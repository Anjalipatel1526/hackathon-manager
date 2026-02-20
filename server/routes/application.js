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
 * PHASE 1 Submission
 */
router.post('/phase1', upload.single('ppt'), async (req, res) => {
    try {
        const { registrationType, department, email, teamLeaderEmail, ...otherData } = req.body;
        const file = req.file;

        const identifier = registrationType === 'Individual' ? otherData.firstName + ' ' + otherData.lastName : otherData.teamName;
        const targetEmail = registrationType === 'Individual' ? email : teamLeaderEmail;

        // 1. Setup Drive folder
        const folderId = await driveService.getOrCreateTargetFolder(1, registrationType, identifier);

        // 2. Upload PPT if exists
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

        // 3. Save to DB
        const candidate = new Candidate({
            registrationType,
            department,
            registrationId: generateRegId(),
            email: registrationType === 'Individual' ? email : undefined,
            teamLeaderEmail: registrationType === 'Team' ? teamLeaderEmail : undefined,
            ...otherData,
            phase1: {
                projectDescription: otherData.projectDescription,
                ...pptData,
                submittedAt: new Date(),
            }
        });

        await candidate.save();

        // 4. Send Email
        await emailService.sendPhase1Email(targetEmail, identifier, registrationType === 'Team');

        res.status(201).json({ message: 'Phase 1 submission successful', registrationId: candidate.registrationId });
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

        const identifier = candidate.registrationType === 'Individual' ? candidate.firstName + ' ' + candidate.lastName : candidate.teamName;
        const targetEmail = candidate.registrationType === 'Individual' ? candidate.email : candidate.teamLeaderEmail;

        // 1. Setup Drive folder (Phase 2)
        const folderId = await driveService.getOrCreateTargetFolder(2, candidate.registrationType, identifier);

        // 2. Upload Files
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

        // 3. Update DB
        candidate.phase2 = {
            githubRepoLink,
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
 * Admin: Update Status
 */
router.patch('/status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const candidate = await Candidate.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(candidate);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
