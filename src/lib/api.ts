import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://script.google.com/macros/s/AKfycbwaUeJtbFqZaS75k0CCDZu9_XC7Ue59UxRP_iwFfyMaWVnpJKFBDcTQYX5TmD4PLGUcUw/exec';
const NODE_API_URL = 'http://localhost:5000/api'; // Or use a relative path /api if same domain

export const candidateApi = {
    submitPhase1: async (payload) => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'submit_phase1', ...payload }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if (data.result === 'error') throw new Error(data.error);
        return data.data;
    },

    getApplicationByRegId: async (regId) => {
        if (regId === '12345') {
            return {
                registrationId: "12345",
                firstName: "Anjali",
                lastName: "",
                email: "komallarna06@gmail.com",
                phone: "0000000000",
                department: "AI Agent and Automation",
                collegeCompany: "Demo University",
                registrationType: "Individual",
                phase1: {
                    projectDescription: "This is a mock project description for Anjali."
                },
                phase2: {
                    githubRepoLink: "https://github.com/anjali/mock-repo"
                }
            };
        }

        if (regId === '123') {
            return {
                registrationId: "123",
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                registrationType: "Individual",
                phase1: {
                    projectDescription: "Phase 1 complete."
                }
            };
        }

        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_application_by_regid', data: { registrationId: regId } }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if (data.result === 'error') throw new Error(data.error);
        return data.data;
    },

    submitPhase2: async (payload) => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'submit_phase2', ...payload }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if (data.result === 'error') throw new Error(data.error);
        return data.data;
    },

    getAllApplications: async () => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_applications' }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if (data.result === 'error') throw new Error(data.error);

        const apps = data.data || [];

        // Inject mock "12345" data so it appears in Admin Dashboards
        if (!apps.find((a: any) => a.registrationId === '12345' || a.registrationId === 12345)) {
            apps.push({
                _id: "12345",
                registrationId: "12345",
                firstName: "Anjali",
                lastName: "(Mock Candidate)",
                email: "komallarna06@gmail.com",
                phone: "0000000000",
                department: "AI Agent and Automation",
                collegeCompany: "Demo University",
                registrationType: "Individual",
                status: "Pending",
                projectDescription: "This is a mock project description for testing purposes.",
                descriptionUrl: "https://docs.google.com/document/d/mock-link",
                pptUrl: "https://docs.google.com/presentation/d/mock-link",
                phase1SubmittedAt: new Date().toISOString(),
                githubRepoLink: "https://github.com/mock/repo",
                githubUrl: "https://docs.google.com/document/d/mock-link-gh",
                readmeUrl: "https://drive.google.com/file/d/mock-link-readme",
                finalProjectZipUrl: "https://drive.google.com/file/d/mock-link-zip",
                phase2SubmittedAt: new Date().toISOString(),
                isCompleted: true
            });
        }

        return apps;
    },

    updateStatus: async (id, status, remarks?: string) => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'update_status', data: { id, status, remarks } }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const data = await response.json();
        if (data.result === 'error') throw new Error(data.error);
        return { _id: id, status, remarks };
    },

    getPhase: async () => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_phase' }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if (data.result === 'error') throw new Error(data.error);
        return data.phase;
    },

    updatePhase: async (phase: number) => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'update_phase', data: { currentPhase: phase } }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if (data.result === 'error') throw new Error(data.error);
        return data.phase;
    }
};
