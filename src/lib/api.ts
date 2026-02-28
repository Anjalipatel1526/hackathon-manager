import axios from 'axios';

// Get URL and log it for debugging
const VITE_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = VITE_URL.trim();

console.log("DEBUG: Initializing API with URL:", `"${API_BASE_URL}"`);

if (!API_BASE_URL) {
    console.error("CRITICAL: No API URL found in .env! Please check VITE_GOOGLE_SCRIPT_URL.");
}

export const candidateApi = {
    submitPhase1: async (payload) => {
        try {
            console.log("Submitting Phase 1 to:", API_BASE_URL);
            console.log("Payload keys:", Object.keys(payload.data || {}));
            if (payload.files) console.log("Files keys:", Object.keys(payload.files));

            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'submit_phase1', ...payload }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });

            if (!response.ok) {
                console.error("HTTP Error:", response.status, response.statusText);
                throw new Error(`HTTP Error ${response.status}`);
            }

            const data = await response.json();
            if (data.result === 'error') throw new Error(data.error);
            return data;
        } catch (error: any) {
            console.error("Detailed Submission Error:", error);
            if (error.message === 'Failed to fetch') {
                throw new Error(`Failed to connect to Google Script. Verify this URL is reachable and deployed as 'Anyone': ${API_BASE_URL}`);
            }
            throw error;
        }
    },

    getApplicationByRegId: async (regId) => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'get_application_by_regid', data: { registrationId: regId } }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const data = await response.json();
            if (data.result === 'error') throw new Error(data.error);
            return data.data;
        } catch (error) {
            console.error("Fetch Application Error:", error);
            throw error;
        }
    },

    submitPhase2: async (payload) => {
        try {
            console.log("Submitting Phase 2 to:", API_BASE_URL);
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'submit_phase2', ...payload }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const data = await response.json();
            if (data.result === 'error') throw new Error(data.error);
            return data;
        } catch (error: any) {
            console.error("Phase 2 Error:", error);
            throw error;
        }
    },

    getAllApplications: async () => {
        try {
            console.log("Fetching all applications from:", API_BASE_URL);
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'get_applications' }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const data = await response.json();
            if (data.result === 'error') throw new Error(data.error);
            return data.data || [];
        } catch (error) {
            console.error("Get Applications Error:", error);
            return [];
        }
    },

    updateStatus: async (id, status, remarks?: string) => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'update_status', data: { id, status, remarks } }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const data = await response.json();
            if (data.result === 'error') throw new Error(data.error);
            return { _id: id, status, remarks };
        } catch (error) {
            console.error("Update Status Error:", error);
            throw error;
        }
    },

    getPhase: async () => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'get_phase' }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const data = await response.json();
            if (data.result === 'error') throw new Error(data.error);
            return data.phase;
        } catch (error) {
            // console.error("Get Phase Error:", error);
            return 1;
        }
    },

    updatePhase: async (phase: number) => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'update_phase', data: { currentPhase: phase } }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const data = await response.json();
            if (data.result === 'error') throw new Error(data.error);
            return data.phase;
        } catch (error) {
            console.error("Update Phase Error:", error);
            throw error;
        }
    }
};
