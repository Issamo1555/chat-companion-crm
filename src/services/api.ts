import { Agent, Client, Message, ClientStatus, Template, Reminder } from '@/types/crm';

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

    sendMessage: async (clientId: string, content: string | File, direction: 'inbound' | 'outbound'): Promise<Message> => {
        if (content instanceof File) {
            return api.sendMediaMessage(clientId, content, direction);
        }

        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders() as Record<string, string>,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clientId, content, direction })
        });
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        return response.json();
    },

    sendMediaMessage: async (clientId: string, file: File, direction: 'inbound' | 'outbound'): Promise<Message> => {
        const formData = new FormData();
        formData.append('clientId', clientId);
        formData.append('file', file);
        formData.append('direction', direction);

        const headers = getAuthHeaders() as Record<string, string>;
        // Remove Content-Type to let browser set it with boundary for FormData
        delete headers['Content-Type'];

        const response = await fetch(`${API_URL}/messages/media`, {
            method: 'POST',
            headers,
            body: formData
        });
        if (!response.ok) {
            throw new Error('Failed to send media message');
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

    updateClient: async (clientId: string, data: Partial<Client>): Promise<Client> => {
        const response = await fetch(`${API_URL}/clients/${clientId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error('Failed to update client');
        }
        return response.json();
    },

    createClient: async (data: Partial<Client>): Promise<Client> => {
        const response = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error('Failed to create client');
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
    },

    getTemplates: async (): Promise<Template[]> => {
        const response = await fetch(`${API_URL}/templates`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch templates');
        }
        return response.json();
    },

    getReminders: async (clientId?: string, status?: string): Promise<Reminder[]> => {
        const queryParams = new URLSearchParams();
        if (clientId) queryParams.append('clientId', clientId);
        if (status) queryParams.append('status', status);
        const url = `${API_URL}/reminders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await fetch(url, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch reminders');
        return response.json();
    },

    createReminder: async (data: Partial<Reminder>): Promise<Reminder> => {
        const response = await fetch(`${API_URL}/reminders`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create reminder');
        return response.json();
    },

    updateReminder: async (id: string, data: Partial<Reminder>): Promise<Reminder> => {
        const response = await fetch(`${API_URL}/reminders/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update reminder');
        return response.json();
    },

    getConversationsExport: async (): Promise<any[]> => {
        const response = await fetch(`${API_URL}/admin/export/conversations`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch conversations export');
        return response.json();
    },

    deleteReminder: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/reminders/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete reminder');
    },

    // --- Breaks API ---
    startBreak: async (type: string): Promise<any> => {
        const response = await fetch(`${API_URL}/breaks/start`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ type })
        });
        if (!response.ok) throw new Error('Failed to start break');
        return response.json();
    },

    endBreak: async (): Promise<any> => {
        const response = await fetch(`${API_URL}/breaks/end`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to end break');
        return response.json();
    },

    getCurrentBreak: async (): Promise<any> => {
        const response = await fetch(`${API_URL}/breaks/current`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch current break');
        return response.json();
    },

    // Admin APIs for breaks
    getAgentBreaks: async (userId: string): Promise<any[]> => {
        const response = await fetch(`${API_URL}/admin/agent-breaks/${userId}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch agent breaks');
        return response.json();
    },

    addAgentBreak: async (data: { userId: string, type: string, startTime: string, endTime: string }): Promise<any> => {
        const response = await fetch(`${API_URL}/admin/agent-breaks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to add manual break');
        return response.json();
    },

    deleteAgentBreak: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/admin/agent-breaks/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete agent break');
    }
};
