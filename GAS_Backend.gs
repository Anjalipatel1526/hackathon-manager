/**
 * PEOPLE DRIVE MANAGER - CONSOLIDATED BACKEND SCRIPT
 * For Phase 1 & Phase 2 Specific Folders for Individual/Team
 * Includes: Status Updates (Approve/Reject) with HR Remarks and Email Notifications
 */

const APP_SHEET_NAME = "Applications";
const SETTINGS_SHEET_NAME = "Settings";

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

function handleRequest(payload) {
    const action = payload.action;
    const data = payload.data || payload;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- ACTION: GET APPLICATIONS ---
    if (action === "get_applications") {
        const sheet = ss.getSheetByName(APP_SHEET_NAME);
        if (!sheet) return createResponse({ result: "success", data: [] });
        const rawData = sheet.getDataRange().getValues();
        if (rawData.length <= 1) return createResponse({ result: "success", data: [] });
        const headers = rawData[0];
        const rows = rawData.slice(1);
        const applications = rows.map(row => {
            let obj = {};
            headers.forEach((header, i) => {
                const key = header.toString().trim();
                obj[key] = row[i];
            });
            // Ensure _id exists for frontend
            obj._id = obj.registrationId; 
            return obj;
        });
        return createResponse({ result: "success", data: applications });
    }

    // --- ACTION: GET APPLICATION BY REG ID ---
    if (action === "get_application_by_regid") {
        const sheet = ss.getSheetByName(APP_SHEET_NAME);
        if (!sheet) return createResponse({ result: "error", error: "Sheet not found" });
        const rawData = sheet.getDataRange().getValues();
        const headers = rawData[0];
        const idCol = headers.indexOf("registrationId");

        for (let i = 1; i < rawData.length; i++) {
            if (rawData[i][idCol] === data.registrationId) {
                let obj = {};
                headers.forEach((header, j) => {
                    obj[header.toString().trim()] = rawData[i][j];
                });
                return createResponse({ result: "success", data: obj });
            }
        }
        return createResponse({ result: "error", error: "Candidate not found" });
    }

    // --- ACTION: GET/TOGGLE PHASE ---
    if (action === "get_phase") {
        let sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
        if (!sheet) {
            sheet = ss.insertSheet(SETTINGS_SHEET_NAME);
            sheet.appendRow(["currentPhase"]);
            sheet.appendRow([1]);
            return createResponse({ result: "success", phase: 1 });
        }
        return createResponse({ result: "success", phase: parseInt(sheet.getRange(2, 1).getValue()) || 1 });
    }

    if (action === "update_phase") {
        let sheet = ss.getSheetByName(SETTINGS_SHEET_NAME) || ss.insertSheet(SETTINGS_SHEET_NAME);
        sheet.getRange(2, 1).setValue(data.currentPhase);
        return createResponse({ result: "success", phase: data.currentPhase });
    }

    // --- ACTION: UPDATE STATUS & SEND EMAIL ---
    if (action === "update_status") {
        const sheet = ss.getSheetByName(APP_SHEET_NAME);
        if (!sheet) return createResponse({ result: "error", error: "Sheet not found" });
        
        const rawData = sheet.getDataRange().getValues();
        const headers = rawData[0];
        const idCol = headers.indexOf("registrationId");
        const statusCol = headers.indexOf("status");
        const remarksCol = headers.indexOf("remarks");

        // Use ID or _id from payload
        const targetId = (data.id || data.registrationId || "").toString();

        for (let i = 1; i < rawData.length; i++) {
            if (rawData[i][idCol].toString() === targetId.toString()) {
                const newStatus = data.status;
                const newRemarks = data.remarks || "";

                // 1. Update Sheet
                if (statusCol !== -1) sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
                if (remarksCol !== -1) sheet.getRange(i + 1, remarksCol + 1).setValue(newRemarks);
                else {
                    // Create remarks column if it doesn't exist
                    const lastCol = sheet.getLastColumn();
                    sheet.getRange(1, lastCol + 1).setValue("remarks");
                    sheet.getRange(i + 1, lastCol + 1).setValue(newRemarks);
                }

                // 2. Prepare Data for Email
                const registrationType = rawData[i][headers.indexOf("registrationType")] || "Individual";
                const candidateName = rawData[i][headers.indexOf("firstName")] + " " + rawData[i][headers.indexOf("lastName")];
                const teamName = rawData[i][headers.indexOf("teamName")];
                const identifier = registrationType === "Individual" ? candidateName : teamName;
                const candidateEmail = registrationType === "Individual" 
                    ? rawData[i][headers.indexOf("email")] 
                    : rawData[i][headers.indexOf("teamLeaderEmail")];

                // 3. Send Professional Notification
                if (candidateEmail) {
                    let subject = "";
                    let customMessage = "";
                    
                    if (newStatus === 'Approved') {
                        subject = "Phase 1 Approved - Kodekar Hackathon";
                        customMessage = "Your PPT is approved, please send your GitHub link and README file for Phase 2.";
                    } else if (newStatus === 'Rejected') {
                        subject = "Application Status Update - Kodekar Hackathon";
                        customMessage = "We regret to inform you that your project has been rejected.";
                    } else {
                        subject = "Application Status Update";
                        customMessage = `Your status has been updated to: ${newStatus}`;
                    }

                    const body = `Hi ${identifier},\n\n${customMessage}\n\n${newRemarks ? `HR Remarks: ${newRemarks}\n\n` : ''}Best Regards,\nKodekar HR Team`;
                    
                    try {
                        GmailApp.sendEmail(candidateEmail, subject, body, {
                            from: "anjali.patel@unaitech.com"
                        });
                    } catch (err) {
                        MailApp.sendEmail(candidateEmail, subject, body);
                    }
                }

                return createResponse({ result: "success", data: { id: targetId, status: newStatus, remarks: newRemarks } });
            }
        }

        // --- MOCK HANDLER FOR TESTING ---
        if (targetId === "12345") {
            const identifier = "Anjali";
            const candidateEmail = "komallarna06@gmail.com";
            const newStatus = data.status;
            const newRemarks = data.remarks || "";

            let subject = "";
            let customMessage = "";
            if (newStatus === 'Approved') {
                subject = "Phase 1 Approved - Kodekar Hackathon";
                customMessage = "Your PPT is approved, please send your GitHub link and README file for Phase 2.";
            } else if (newStatus === 'Rejected') {
                subject = "Application Status Update - Kodekar Hackathon";
                customMessage = "We regret to inform you that your project has been rejected.";
            } else {
                subject = "Application Status Update";
                customMessage = `Your status has been updated to: ${newStatus}`;
            }

            const body = `Hi ${identifier},\n\n${customMessage}\n\n${newRemarks ? `HR Remarks: ${newRemarks}\n\n` : ''}Best Regards,\nKodekar HR Team`;
            
            try {
                GmailApp.sendEmail(candidateEmail, subject, body, { from: "anjali.patel@unaitech.com" });
            } catch (err) {
                MailApp.sendEmail(candidateEmail, subject, body);
            }

            return createResponse({ result: "success", data: { id: "12345", status: newStatus, remarks: newRemarks } });
        }

        return createResponse({ result: "error", error: "Candidate not found" });
    }

    // --- Helper: Get Target Folder ---
    function getCandidateFolder(registrationType, identifier) {
        const rootFolderName = "Applications";
        let rootFolder;
        const rootFolders = DriveApp.getFoldersByName(rootFolderName);
        rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootFolderName);

        let typeFolder;
        const typeFolders = rootFolder.getFoldersByName(registrationType);
        typeFolder = typeFolders.hasNext() ? typeFolders.next() : rootFolder.createFolder(registrationType);

        let candidateFolder;
        const candidateFolders = typeFolder.getFoldersByName(identifier);
        candidateFolder = candidateFolders.hasNext() ? candidateFolders.next() : typeFolder.createFolder(identifier);

        return candidateFolder;
    }

    // --- MOCK INJECTION HELPER ---
    function handleMockSubmission(phase) {
        const identifier = "Anjali";
        const candidateEmail = "komallarna06@gmail.com";
        const candidateFolder = getCandidateFolder("Individual", identifier);

        if (phase === 1) {
             if (data.projectDescription) {
                 const descFile = candidateFolder.createFile("project_description.txt", data.projectDescription, MimeType.PLAIN_TEXT);
                 descFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
             }
             if (payload.files && payload.files.ppt) {
                 const pptData = payload.files.ppt;
                 const blob = Utilities.newBlob(Utilities.base64Decode(pptData.base64), pptData.type, pptData.name);
                 const file = candidateFolder.createFile(blob);
                 file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
             }
             const subject = "Phase 1 Submission Received - Kodekar Hackathon";
             const body = `Hi ${identifier},\n\nWe have successfully received your project description and presentation for Phase 1. Your unique code is ${data.registrationId}.\n\nGood luck,\nKodekar HR Team`;
             
             try {
                 GmailApp.sendEmail(candidateEmail, subject, body, {
                    from: "anjali.patel@unaitech.com"
                 });
             } catch (err) {
                 MailApp.sendEmail(candidateEmail, subject, body);
             }

             return createResponse({ result: "success", message: "Phase 1 Mock Uploaded" });
        } else {
             if (data.githubRepoLink) {
                 const ghFile = candidateFolder.createFile("github_link.txt", data.githubRepoLink, MimeType.PLAIN_TEXT);
                 ghFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
             }
             if (payload.files) {
                 if (payload.files.readme) {
                     const readmeData = payload.files.readme;
                     const blob = Utilities.newBlob(Utilities.base64Decode(readmeData.base64), readmeData.type, readmeData.name);
                     const file = candidateFolder.createFile(blob);
                     file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                 }
                 if (payload.files.finalZip) {
                     const zipData = payload.files.finalZip;
                     const blob = Utilities.newBlob(Utilities.base64Decode(zipData.base64), zipData.type, zipData.name);
                     const file = candidateFolder.createFile(blob);
                     file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                 }
             }
             return createResponse({ result: "success", message: "Phase 2 Mock Uploaded" });
        }
    }

    // --- ACTION: SUBMIT PHASE 1 ---
    if (action === "submit_phase1") {
        if (data.registrationId === '12345') return handleMockSubmission(1);

        const sheet = ss.getSheetByName(APP_SHEET_NAME) || ss.insertSheet(APP_SHEET_NAME);
        const rawData = sheet.getDataRange().getValues();
        const headers = rawData[0];
        const idCol = headers.indexOf("registrationId");

        for (let i = 1; i < rawData.length; i++) {
            if (rawData[i][idCol] === data.registrationId) {
                const registrationType = rawData[i][headers.indexOf("registrationType")] || "Individual";
                const candidateName = rawData[i][headers.indexOf("firstName")] + " " + rawData[i][headers.indexOf("lastName")];
                const teamName = rawData[i][headers.indexOf("teamName")];
                const identifier = registrationType === "Individual" ? candidateName : teamName;

                const candidateFolder = getCandidateFolder(registrationType, identifier);

                let descriptionUrl = "";
                if (data.projectDescription) {
                    const descFile = candidateFolder.createFile("project_description.txt", data.projectDescription, MimeType.PLAIN_TEXT);
                    descFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                    descriptionUrl = descFile.getUrl();
                }

                let pptUrl = "";
                if (payload.files && payload.files.ppt) {
                    const pptData = payload.files.ppt;
                    const blob = Utilities.newBlob(Utilities.base64Decode(pptData.base64), pptData.type, pptData.name);
                    const file = candidateFolder.createFile(blob);
                    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                    pptUrl = file.getUrl();
                }

                sheet.getRange(i + 1, headers.indexOf("projectDescription") + 1).setValue(data.projectDescription);
                sheet.getRange(i + 1, headers.indexOf("descriptionUrl") + 1).setValue(descriptionUrl);
                sheet.getRange(i + 1, headers.indexOf("pptUrl") + 1).setValue(pptUrl);
                sheet.getRange(i + 1, headers.indexOf("phase1SubmittedAt") + 1).setValue(new Date());

                const candidateEmail = registrationType === "Individual" 
                    ? rawData[i][headers.indexOf("email")] 
                    : rawData[i][headers.indexOf("teamLeaderEmail")];
                
                if (candidateEmail) {
                    const subject = "Phase 1 Submission Received - Kodekar Hackathon";
                    const body = `Hi ${identifier},\n\nWe have successfully received your project description and presentation for Phase 1. Your unique code is ${data.registrationId}.\n\nGood luck,\nKodekar HR Team`;
                    
                    try {
                        GmailApp.sendEmail(candidateEmail, subject, body, {
                            from: "anjali.patel@unaitech.com"
                        });
                    } catch (err) {
                        MailApp.sendEmail(candidateEmail, subject, body);
                    }
                }

                return createResponse({ result: "success", message: "Phase 1 Updated" });
            }
        }
        return createResponse({ result: "error", error: "Candidate not found" });
    }

    // --- ACTION: SUBMIT PHASE 2 ---
    if (action === "submit_phase2") {
        if (data.registrationId === '12345') return handleMockSubmission(2);

        const sheet = ss.getSheetByName(APP_SHEET_NAME);
        const rawData = sheet.getDataRange().getValues();
        const headers = rawData[0];
        const idCol = headers.indexOf("registrationId");

        for (let i = 1; i < rawData.length; i++) {
            if (rawData[i][idCol] === data.registrationId) {
                const registrationType = rawData[i][headers.indexOf("registrationType")] || "Individual";
                const candidateName = rawData[i][headers.indexOf("firstName")] + " " + rawData[i][headers.indexOf("lastName")];
                const teamName = rawData[i][headers.indexOf("teamName")];
                const identifier = registrationType === "Individual" ? candidateName : teamName;

                const candidateFolder = getCandidateFolder(registrationType, identifier);

                let githubUrl = "";
                if (data.githubRepoLink) {
                    const ghFile = candidateFolder.createFile("github_link.txt", data.githubRepoLink, MimeType.PLAIN_TEXT);
                    ghFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                    githubUrl = ghFile.getUrl();
                }

                let readmeUrl = "";
                let zipUrl = "";
                if (payload.files) {
                    if (payload.files.readme) {
                        const readmeData = payload.files.readme;
                        const blob = Utilities.newBlob(Utilities.base64Decode(readmeData.base64), readmeData.type, readmeData.name);
                        const file = candidateFolder.createFile(blob);
                        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                        readmeUrl = file.getUrl();
                    }
                    if (payload.files.finalZip) {
                        const zipData = payload.files.finalZip;
                        const blob = Utilities.newBlob(Utilities.base64Decode(zipData.base64), zipData.type, zipData.name);
                        const file = candidateFolder.createFile(blob);
                        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                        zipUrl = file.getUrl();
                    }
                }

                sheet.getRange(i + 1, headers.indexOf("githubRepoLink") + 1).setValue(data.githubRepoLink);
                sheet.getRange(i + 1, headers.indexOf("githubUrl") + 1).setValue(githubUrl);
                sheet.getRange(i + 1, headers.indexOf("readmeUrl") + 1).setValue(readmeUrl);
                sheet.getRange(i + 1, headers.indexOf("finalProjectZipUrl") + 1).setValue(zipUrl);
                sheet.getRange(i + 1, headers.indexOf("phase2SubmittedAt") + 1).setValue(new Date());
                sheet.getRange(i + 1, headers.indexOf("isCompleted") + 1).setValue(true);

                return createResponse({ result: "success", message: "Phase 2 Updated" });
            }
        }
        return createResponse({ result: "error", error: "Candidate not found" });
    }

    return createResponse({ result: "error", error: "Invalid action" });
}

function createResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
