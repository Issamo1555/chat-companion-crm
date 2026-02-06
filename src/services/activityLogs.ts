import { api } from './api';

export interface ActivityLog {
    id: string;
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        avatar?: string;
    };
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    expiresAt: string;
    loggedOutAt?: string;
}

export interface ActivityLogsResponse {
    logs: ActivityLog[];
    total: number;
}

export interface ActivityLogsFilters {
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export const activityLogsService = {
    async getActivityLogs(filters: ActivityLogsFilters = {}): Promise<ActivityLogsResponse> {
        const params = new URLSearchParams();
        if (filters.userId) params.append('userId', filters.userId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());

        const token = localStorage.getItem('token');
        const response = await fetch(
            `http://localhost:3000/api/admin/activity-logs?${params.toString()}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch activity logs');
        }

        return response.json();
    }
};
