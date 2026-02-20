import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Creates a folder in Google Drive
 */
export const createFolder = async (name, parentId = null) => {
    const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : [],
    };

    try {
        const file = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        return file.data.id;
    } catch (err) {
        console.error('Error creating folder in Drive:', err);
        throw err;
    }
};

/**
 * Uploads a file to a specific folder in Google Drive
 */
export const uploadFile = async (filePath, fileName, folderId) => {
    const fileMetadata = {
        name: fileName,
        parents: [folderId],
    };
    const media = {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(filePath),
    };

    try {
        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });
        return {
            id: file.data.id,
            link: file.data.webViewLink,
        };
    } catch (err) {
        console.error('Error uploading file to Drive:', err);
        throw err;
    }
};

/**
 * Ensures the basic folder structure exists and returns the target folder ID
 * Structure: Phase X / Individual|Team / Name|TeamName
 */
export const getOrCreateTargetFolder = async (phase, registrationType, identifier) => {
    // 1. Get or create Phase folder
    let phaseFolderId = await findFolderByName(`Phase ${phase}`);
    if (!phaseFolderId) {
        phaseFolderId = await createFolder(`Phase ${phase}`);
    }

    // 2. Get or create Type folder
    let typeFolderId = await findFolderByName(registrationType, phaseFolderId);
    if (!typeFolderId) {
        typeFolderId = await createFolder(registrationType, phaseFolderId);
    }

    // 3. Create Specific folder (always new for clarity or check if exists)
    let specificFolderId = await findFolderByName(identifier, typeFolderId);
    if (!specificFolderId) {
        specificFolderId = await createFolder(identifier, typeFolderId);
    }

    return specificFolderId;
};

const findFolderByName = async (name, parentId = null) => {
    let query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId) {
        query += ` and '${parentId}' in parents`;
    }

    try {
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });
        return response.data.files[0]?.id || null;
    } catch (err) {
        console.error('Error finding folder in Drive:', err);
        return null;
    }
};
