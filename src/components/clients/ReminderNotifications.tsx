import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ReminderNotifications() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

    // Only poll if user is logged in, every minute
    const { data: reminders = [] } = useQuery({
        queryKey: ['reminders', 'notifications'],
        queryFn: () => api.getReminders(),
        enabled: !!user,
        refetchInterval: 60000,
    });

    useEffect(() => {
        if (!reminders.length) return;

        const now = new Date();

        reminders.forEach(reminder => {
            if (reminder.status !== 'pending') return;
            if (notifiedIds.has(reminder.id)) return;

            const dueDate = new Date(reminder.dueDate);

            // If the due date is in the past, or exactly now
            // This will fire for any overdue reminder the user hasn't seen this session
            if (dueDate <= now) {
                toast.info(`Rappel: ${reminder.title}`, {
                    description: reminder.client?.name ? `Client: ${reminder.client.name}` : 'Rappel en attente',
                    duration: 10000,
                    action: {
                        label: 'Voir',
                        onClick: () => {
                            navigate(reminder.client?.id ? `/clients/${reminder.client.id}` : '/rappels');
                        }
                    }
                });

                setNotifiedIds(prev => new Set(prev).add(reminder.id));
            }
        });
    }, [reminders, notifiedIds, navigate]);

    return null;
}
