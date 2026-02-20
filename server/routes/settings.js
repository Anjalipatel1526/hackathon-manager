import express from 'express';
import { Settings } from '../models/Settings.js';
import { Candidate } from '../models/Candidate.js';
import * as emailService from '../services/emailService.js';

const router = express.Router();

/**
 * Get current system settings, including the active registration phase.
 */
router.get('/phase', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ currentPhase: 1 });
            await settings.save();
        }
        res.json({ phase: settings.currentPhase });
    } catch (err) {
        console.error('Error fetching phase:', err);
        res.status(500).json({ error: 'Failed to fetch phase' });
    }
});

/**
 * Toggle the current registration phase.
 */
router.post('/phase', async (req, res) => {
    try {
        const { currentPhase } = req.body;

        if (![1, 2].includes(currentPhase)) {
            return res.status(400).json({ error: 'Invalid phase. Must be 1 or 2.' });
        }

        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ currentPhase });
        } else {
            // Check if transitioning from Phase 1 to Phase 2
            const isTransitioningToPhase2 = settings.currentPhase === 1 && currentPhase === 2;
            settings.currentPhase = currentPhase;

            if (isTransitioningToPhase2) {
                // Broadcast email to all registered Phase 1 candidates
                const candidates = await Candidate.find();
                for (const candidate of candidates) {
                    const targetEmail = candidate.registrationType === 'Individual' ? candidate.email : candidate.teamLeaderEmail;
                    const identifier = candidate.registrationType === 'Individual' ? `${candidate.firstName} ${candidate.lastName}` : candidate.teamName;

                    if (targetEmail) {
                        await emailService.sendPhase2BroadcastEmail(targetEmail, identifier, candidate.registrationType === 'Team');
                    }
                }
            }
        }

        await settings.save();
        res.json({ message: `Phase successfully updated to ${currentPhase}`, phase: settings.currentPhase });
    } catch (err) {
        console.error('Error updating phase:', err);
        res.status(500).json({ error: 'Failed to update phase' });
    }
});

export default router;
