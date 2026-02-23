import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Candidate } from '../models/Candidate.js';
import * as driveService from '../services/driveService.js';
import * as emailService from '../services/emailService.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Helper to generate Registration ID
const generateRegId = () => `REG-${Math.floor(100000 + Math.random() * 900000)}`;

/**
 * PHASE 1 Submission (Update Existing)
 */
router.post('/phase1', upload.single('ppt'), async (req, res) => {
    try {
        const { registrationId, projectDescription } = req.body;
        const file = req.file;

        const candidate = await Candidate.findOne({ registrationId });
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        const identifier = candidate.registrationType === 'Individual'
            ? `${candidate.firstName} ${candidate.lastName}_${candidate.email}`
            : `${candidate.teamName}_${candidate.teamLeaderEmail}`;
        const targetEmail = candidate.registrationType === 'Individual' ? candidate.email : candidate.teamLeaderEmail;

        // 1. Setup Drive folder
        const folderId = await driveService.getOrCreateTargetFolder(candidate.registrationType, identifier);

        // 2. Upload description as file if exists
        let descriptionData = {};
        if (projectDescription) {
            const uploadResult = await driveService.uploadTextAsFile(projectDescription, "project_description.txt", folderId);
            descriptionData = {
                descriptionUrl: uploadResult.link,
                descriptionDriveId: uploadResult.id,
            };
        }

        // 3. Upload PPT if exists
        let pptData = {};
        if (file) {
            const uploadResult = await driveService.uploadFile(file.path, file.originalname, folderId);
            pptData = {
                pptUrl: uploadResult.link,
                pptDriveId: uploadResult.id,
            };
            // Cleanup local file
            fs.unlinkSync(file.path);
        }

        // 4. Update DB
        candidate.phase1 = {
            projectDescription,
            ...descriptionData,
            ...pptData,
            submittedAt: new Date(),
        };

        await candidate.save();

        // 4. Send Email
        await emailService.sendPhase1Email(targetEmail, identifier, candidate.registrationId, candidate.registrationType === 'Team');

        res.status(200).json({ message: 'Phase 1 submission successful', registrationId: candidate.registrationId });
    } catch (err) {
        console.error('Phase 1 Error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * PHASE 2 Submission
 */
router.post('/phase2', upload.fields([
    { name: 'readme', maxCount: 1 },
    { name: 'finalZip', maxCount: 1 }
]), async (req, res) => {
    try {
        const { registrationId, githubRepoLink } = req.body;
        const files = req.files;

        const candidate = await Candidate.findOne({ registrationId });
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        const identifier = candidate.registrationType === 'Individual'
            ? `${candidate.firstName} ${candidate.lastName}_${candidate.email}`
            : `${candidate.teamName}_${candidate.teamLeaderEmail}`;
        const targetEmail = candidate.registrationType === 'Individual' ? candidate.email : candidate.teamLeaderEmail;

        // 1. Setup Drive folder (use same logic)
        const folderId = await driveService.getOrCreateTargetFolder(candidate.registrationType, identifier);

        // 2. Upload GitHub Link as file if exists
        let githubData = {};
        if (githubRepoLink) {
            const uploadResult = await driveService.uploadTextAsFile(githubRepoLink, "github_link.txt", folderId);
            githubData = {
                githubUrl: uploadResult.link,
                githubDriveId: uploadResult.id,
            };
        }

        // 3. Upload Files
        let readmeData = {};
        if (files.readme) {
            const readmeFile = files.readme[0];
            const uploadResult = await driveService.uploadFile(readmeFile.path, readmeFile.originalname, folderId);
            readmeData = {
                readmeUrl: uploadResult.link,
                readmeDriveId: uploadResult.id,
            };
            fs.unlinkSync(readmeFile.path);
        }

        let zipData = {};
        if (files.finalZip) {
            const zipFile = files.finalZip[0];
            const uploadResult = await driveService.uploadFile(zipFile.path, zipFile.originalname, folderId);
            zipData = {
                finalProjectZipUrl: uploadResult.link,
                finalProjectZipDriveId: uploadResult.id,
            };
            fs.unlinkSync(zipFile.path);
        }

        // 4. Update DB
        candidate.phase2 = {
            githubRepoLink,
            ...githubData,
            ...readmeData,
            ...zipData,
            submittedAt: new Date(),
            isCompleted: true,
        };

        await candidate.save();

        // 4. Send Email
        await emailService.sendPhase2Email(targetEmail, identifier, candidate.registrationType === 'Team');

        res.json({ message: 'Phase 2 submission successful' });
    } catch (err) {
        console.error('Phase 2 Error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Admin: Get All Applications
 */
router.get('/applications', async (req, res) => {
    try {
        const apps = await Candidate.find().sort({ createdAt: -1 });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Get Application by Registration ID
 */
router.get('/applications/:regId', async (req, res) => {
    try {
        const candidate = await Candidate.findOne({ registrationId: req.params.regId });
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.json(candidate);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Admin: Update Status
 */
router.patch('/status/:id', async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const candidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { status, remarks },
            { new: true }
        );

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const name = candidate.registrationType === 'Individual'
            ? `${candidate.firstName} ${candidate.lastName}`
            : candidate.teamName;
        const email = candidate.registrationType === 'Individual'
            ? candidate.email
            : candidate.teamLeaderEmail;

        // Send Email Notification
        await emailService.sendStatusUpdateEmail(email, name, status, remarks);

        res.json(candidate);
    } catch (err) {
        console.error('Status Update Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
