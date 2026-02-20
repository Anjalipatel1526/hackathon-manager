import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

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
        return data.data || [];
    },

    updateStatus: async (id, status) => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'update_status', data: { _id: id, status } }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if (data.result === 'error') throw new Error(data.error);
        return data.data;
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
