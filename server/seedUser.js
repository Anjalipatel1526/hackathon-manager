import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Candidate } from './models/Candidate.js';

dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/people-drive-manager";

async function seedUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const mockData = {
            firstName: "Anjali",
            lastName: "Patel",
            email: "komallarna06@gmail.com",
            phone: "+91 9876543210",
            department: "AI Agent and Automation",
            collegeCompany: "Codekar Institute",
            registrationId: "12345",
            registrationType: "Individual",
            phase1: {
                projectDescription: "This is a demo project focused on autonomous AI agents that can handle drive management and people operations. It uses advanced NLP and agentic workflows to streamline HR tasks.",
                pptUrl: "https://docs.google.com/presentation/d/demo",
                submittedAt: new Date()
            },
            status: "Pending"
        };

        // Check if exists
        const existing = await Candidate.findOne({ registrationId: "12345" });
        if (existing) {
            console.log("User 12345 already exists, updating...");
            await Candidate.updateOne({ registrationId: "12345" }, mockData);
        } else {
            console.log("Inserting new mock user 12345...");
            await Candidate.create(mockData);
        }

        console.log("Seed complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedUser();
