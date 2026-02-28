/**
 * CODEKARX HACKATHON - OVERHAULED BACKEND (v4)
 * Supports: Transaction IDs, Project Names, Multi-Member Email Notifications, 
 * and organized Google Drive file storage (Phase 1/2 > Sub-folders).
 */

const APP_SHEET_NAME = "Applications";
const SETTINGS_SHEET_NAME = "Settings";
const ROOT_FOLDER_NAME = "Codekarx_Submissions";

// Mandatory Headers for the Applications Sheet
const APP_HEADERS = [
  "registrationId", 
  "transactionId", 
  "projectName", 
  "status", 
  "remarks", 
  "firstName", 
  "lastName", 
  "email", 
  "registrationType", 
  "teamName", 
  "teamLeaderName", 
  "teamLeaderEmail",
  "member1Email",
  "member2Email",
  "member3Email",
  "member4Email",
  "projectDescription", 
  "pptUrl",          // New
  "readmeUrl",       // New
  "sourceCodeUrl",   // New
  "phase1SubmittedAt",
  "githubRepoLink",
  "phase2SubmittedAt",
  "isCompleted",
  "collegeCompany"   // Added for folder naming
];

function doGet(e) {
    try {
        return handleRequest(e.parameter);
    } catch (err) {
        return createResponse({ result: "error", error: "GET Error: " + err.toString() });
    }
}

function doPost(e) {
    try {
        const contents = JSON.parse(e.postData.contents);
        return handleRequest(contents);
    } catch (err) {
        return createResponse({ result: "error", error: "POST Error: " + err.toString() });
    }
}

/**
 * Helper to get or create a folder structure
 */
function getTargetFolder(phaseNum, data) {
    let root = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
    let rootFolder = root.hasNext() ? root.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
    
    let phaseName = "Phase " + phaseNum;
    let phase = rootFolder.getFoldersByName(phaseName);
    let phaseFolder = phase.hasNext() ? phase.next() : rootFolder.createFolder(phaseName);
    
    // Sub-folder name: [Name] - [College]
    const userName = data.registrationType === "Individual" 
      ? (data.firstName || "Unknown") 
      : (data.teamName || "Team");
    const college = data.collegeCompany || "NoCollege";
    const subFolderName = `${userName} - ${college}`;
    
    let sub = phaseFolder.getFoldersByName(subFolderName);
    let subFolder = sub.hasNext() ? sub.next() : phaseFolder.createFolder(subFolderName);
    
    return subFolder;
}

/**
 * Decodes base64 and saves to folder
 */
function saveBase64File(folder, fileObj) {
    if (!fileObj || !fileObj.base64) return null;
    const decoded = Utilities.base64Decode(fileObj.base64);
    const blob = Utilities.newBlob(decoded, fileObj.type, fileObj.name);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
}

function handleRequest(payload) {
    const action = payload.action;
    const data = payload.data || payload;
    const files = payload.files || {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Helper to get or init sheet
    function getOrInitSheet(name, headers) {
        let sheet = ss.getSheetByName(name);
        if (!sheet) {
            sheet = ss.getSheetByName("Sheet1") || ss.insertSheet(name);
            if (sheet.getName() !== name) sheet.setName(name);
        }
        if (sheet.getLastRow() === 0) {
            sheet.appendRow(headers);
        } else if (name === APP_SHEET_NAME) {
            // Optional: Ensure new columns exist
            const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            headers.forEach(h => {
              if (existingHeaders.indexOf(h) === -1) {
                sheet.getRange(1, existingHeaders.length + 1).setValue(h);
                existingHeaders.push(h);
              }
            });
        }
        return sheet;
    }

    const appSheet = getOrInitSheet(APP_SHEET_NAME, APP_HEADERS);
    const settingsSheet = getOrInitSheet(SETTINGS_SHEET_NAME, ["currentPhase"]);

    // --- ACTION: GET APPLICATIONS ---
    if (action === "get_applications") {
        const rawData = appSheet.getDataRange().getValues();
        if (rawData.length <= 1) return createResponse({ result: "success", data: [] });
        const headers = rawData[0];
        const rows = rawData.slice(1);
        const applications = rows.map(row => {
            let obj = {};
            headers.forEach((header, i) => {
                obj[header.toString().trim()] = row[i];
            });
            obj._id = (obj.registrationId || obj.transactionId || "").toString(); 
            return obj;
        });
        return createResponse({ result: "success", data: applications });
    }

    // --- ACTION: GET/UPDATE PHASE ---
    if (action === "get_phase") {
        return createResponse({ result: "success", phase: parseInt(settingsSheet.getRange(2, 1).getValue()) || 1 });
    }

    // --- ACTION: SUBMIT PHASE 1 ---
    if (action === "submit_phase1") {
        const transactionId = (data.transactionId || "").toString().trim();
        const regId = (data.registrationId || transactionId || "REG-" + new Date().getTime()).toString();
        
        // Handle Drive Files
        const folder = getTargetFolder(1, data);
        if (files.ppt) {
          data.pptUrl = saveBase64File(folder, files.ppt);
        }

        const headers = appSheet.getRange(1, 1, 1, appSheet.getLastColumn()).getValues()[0];
        const row = headers.map(h => {
          const key = h.toString().trim();
          if (data[key] !== undefined) return data[key];
          if (key === "registrationId") return regId;
          if (key === "status") return "Pending";
          if (key === "phase1SubmittedAt") return new Date();
          return "";
        });
        
        appSheet.appendRow(row);

        // Notify Team
        const emails = [];
        if (data.registrationType === "Individual") {
          if (data.email) emails.push(data.email);
        } else {
          const fields = ["teamLeaderEmail", "member1Email", "member2Email", "member3Email", "member4Email"];
          fields.forEach(f => { if (data[f]) emails.push(data[f]); });
        }

        const uniqueEmails = [...new Set(emails.filter(e => e && e.trim() !== ""))];
        if (uniqueEmails.length > 0) {
           const subject = "Phase 1 Submission Received - Codekarx Hackathon";
           const body = `Hi,\n\nWe have received your Phase 1 submission for project: ${data.projectName}.\nTransaction ID: ${data.transactionId}\n\nYour application is now under review.\n\nBest Regards,\nCodekarx Team`;
           uniqueEmails.forEach(email => {
             try { GmailApp.sendEmail(email, subject, body); } catch (e) {}
           });
        }

        return createResponse({ result: "success", message: "Phase 1 Submitted", registrationId: regId });
    }

    // --- ACTION: SUBMIT PHASE 2 ---
    if (action === "submit_phase2") {
        const targetId = (data.registrationId || data.transactionId || "").toString();
        const rawData = appSheet.getDataRange().getValues();
        const headers = rawData[0];
        const idCol = headers.indexOf("registrationId");
        const transCol = headers.indexOf("transactionId");
        
        for (let i = 1; i < rawData.length; i++) {
           if (rawData[i][idCol].toString() === targetId || rawData[i][transCol].toString() === targetId) {
              const rowDataObj = {};
              headers.forEach((h, idx) => rowDataObj[h] = rawData[i][idx]);

              // Handle Drive Files
              const folder = getTargetFolder(2, rowDataObj);
              if (files.readme) data.readmeUrl = saveBase64File(folder, files.readme);
              if (files.finalZip) data.sourceCodeUrl = saveBase64File(folder, files.finalZip);

              // Update columns
              const updates = {
                githubRepoLink: data.githubRepoLink,
                readmeUrl: data.readmeUrl || rowDataObj.readmeUrl,
                sourceCodeUrl: data.sourceCodeUrl || rowDataObj.sourceCodeUrl,
                phase2SubmittedAt: new Date(),
                isCompleted: "TRUE"
              };

              Object.keys(updates).forEach(key => {
                const colIdx = headers.indexOf(key);
                if (colIdx !== -1) appSheet.getRange(i + 1, colIdx + 1).setValue(updates[key]);
              });

              return createResponse({ result: "success", message: "Phase 2 Updated" });
           }
        }
        return createResponse({ result: "error", error: "Registration not found" });
    }

    // --- ACTION: UPDATE STATUS ---
    if (action === "update_status") {
        const targetId = (data.id || data.registrationId || data.transactionId || "").toString();
        const rawData = appSheet.getDataRange().getValues();
        const headers = rawData[0];
        const idCol = headers.indexOf("registrationId");
        const transCol = headers.indexOf("transactionId");

        for (let i = 1; i < rawData.length; i++) {
            if (rawData[i][idCol].toString() === targetId || rawData[i][transCol].toString() === targetId) {
                const newStatus = data.status;
                const newRemarks = data.remarks || "";

                const statusCol = headers.indexOf("status");
                const remarksCol = headers.indexOf("remarks");
                if (statusCol !== -1) appSheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
                if (remarksCol !== -1) appSheet.getRange(i + 1, remarksCol + 1).setValue(newRemarks);
                
                const emails = [];
                const regType = rawData[i][headers.indexOf("registrationType")];
                if (regType === "Individual") {
                  emails.push(rawData[i][headers.indexOf("email")]);
                } else {
                  ["teamLeaderEmail", "member1Email", "member2Email", "member3Email", "member4Email"].forEach(f => {
                    const idx = headers.indexOf(f);
                    if (idx !== -1 && rawData[i][idx]) emails.push(rawData[i][idx]);
                  });
                }
                
                const uniqueEmails = [...new Set(emails.filter(e => e && e.toString().trim() !== ""))];
                const projectName = rawData[i][headers.indexOf("projectName")];

                if (uniqueEmails.length > 0) {
                    const subject = (newStatus === 'Approved') ? `Phase 1 Approved - ${projectName}` : `Status Update - ${projectName}`;
                    const customMsg = (newStatus === 'Approved') 
                        ? "Your Phase 1 project has been approved! You can now proceed to Phase 2."
                        : `Your application status has been updated to: ${newStatus}`;
                    const body = `Hi,\n\n${customMsg}\n\nRemarks: ${newRemarks}\n\nBest Regards,\nCodekarx Team`;
                    uniqueEmails.forEach(email => { try { GmailApp.sendEmail(email.toString(), subject, body); } catch (e) {} });
                }
                
                return createResponse({ result: "success", data: { id: targetId, status: newStatus, remarks: newRemarks } });
            }
        }
        return createResponse({ result: "error", error: "Candidate not found" });
    }

    // --- ACTION: UPDATE PHASE & NOTIFY ---
    if (action === "update_phase") {
        const newPhase = parseInt(data.currentPhase);
        settingsSheet.getRange(2, 1).setValue(newPhase);

        // If moving to Phase 2, notify all candidates
        if (newPhase === 2) {
            const raw = appSheet.getDataRange().getValues();
            const headers = raw[0];
            const rows = raw.slice(1);
            
            const emailSet = new Set();
            rows.forEach(row => {
                const regType = row[headers.indexOf("registrationType")];
                if (regType === "Individual") {
                    const e = row[headers.indexOf("email")];
                    if (e) emailSet.add(e.toString().trim());
                } else {
                    ["teamLeaderEmail", "member1Email", "member2Email", "member3Email", "member4Email"].forEach(f => {
                        const idx = headers.indexOf(f);
                        if (idx !== -1 && row[idx]) emailSet.add(row[idx].toString().trim());
                    });
                }
            });

            const uniqueEmails = Array.from(emailSet).filter(e => e !== "");
            if (uniqueEmails.length > 0) {
                const subject = "Phase 2 is now LIVE - Codekarx Hackathon";
                const body = `Hi,\n\nWe are excited to announce that Phase 2 of the Codekarx Hackathon is now OPEN!\n\nYou can now log in to the portal using your Transaction ID to upload your final README and Source Code ZIP.\n\nGood luck!\nCodekarx Team`;
                uniqueEmails.forEach(email => {
                    try { GmailApp.sendEmail(email, subject, body); } catch(e) {}
                });
            }
        }

        return createResponse({ result: "success", phase: newPhase });
    }

    return createResponse({ result: "error", error: "Invalid action" });
}

function createResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
