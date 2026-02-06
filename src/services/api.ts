import { Agent, Client, Message, ClientStatus } from '@/types/crm';

const API_URL = 'http://localhost:3000/api';

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    getAgents: async (): Promise<Agent[]> => {
        const response = await fetch(`${API_URL}/users`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch agents');
        }
        return response.json();
    },

    getClients: async (): Promise<Client[]> => {
        const response = await fetch(`${API_URL}/clients`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch clients');
        }
        return response.json();
    },

    sendMessage: async (clientId: string, content: string, direction: 'inbound' | 'outbound'): Promise<Message> => {
        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ clientId, content, direction })
        });
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        return response.json();
    },

    updateClientStatus: async (clientId: string, status: ClientStatus, note?: string, userId?: string): Promise<Client> => {
        const response = await fetch(`${API_URL}/clients/${clientId}/status`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status, note, userId })
        });
        if (!response.ok) {
            throw new Error('Failed to update status');
        }
        return response.json();
    },

    getTags: async (): Promise<{ id: number, name: string }[]> => {
        const response = await fetch(`${API_URL}/tags`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch tags');
        }
        return response.json();
    },

    getDashboardStats: async () => {
        const response = await fetch(`${API_URL}/dashboard/stats`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }
        return response.json();
    }
};
