import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
    registrationType: {
        type: String,
        enum: ['Individual', 'Team'],
        required: true
    },
    // Common details
    department: {
        type: String,
        required: true
    },
    registrationId: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    remarks: {
        type: String,
        default: ''
    },

    // Individual specific
    firstName: String,
    lastName: String,
    email: {
        type: String,
        required: function () { return this.registrationType === 'Individual'; }
    },
    phone: String,
    collegeCompany: String,

    // Team specific
    teamName: {
        type: String,
        required: function () { return this.registrationType === 'Team'; }
    },
    teamLeaderName: String,
    teamMembers: [{
        name: String,
        email: String
    }],
    teamLeaderEmail: {
        type: String,
        required: function () { return this.registrationType === 'Team'; }
    },

    // Phase 1 - Project Description
    phase1: {
        projectDescription: String,
        descriptionUrl: String,
        descriptionDriveId: String,
        pptUrl: String, // Google Drive Link
        pptDriveId: String,
        submittedAt: Date
    },

    // Phase 2 - Final Submission
    phase2: {
        githubRepoLink: String,
        githubUrl: String,
        githubDriveId: String,
        readmeUrl: String, // Google Drive Link
        readmeDriveId: String,
        finalProjectZipUrl: String, // Google Drive Link
        finalProjectZipDriveId: String,
        submittedAt: Date,
        isCompleted: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

export const Candidate = mongoose.model('Candidate', candidateSchema);
