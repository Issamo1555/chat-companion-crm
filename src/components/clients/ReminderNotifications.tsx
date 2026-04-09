import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ReminderNotifications() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

    const { data: reminders = [] } = useQuery({
        queryKey: ['reminders', 'notifications'],
        queryFn: () => api.getReminders(),
        enabled: !!user,
        refetchInterval: 30000, // Poll every 30 seconds for better responsiveness
    });

    useEffect(() => {
        if (!reminders.length) return;

        const now = new Date();
        const notificationThreshold = 15 * 60 * 1000; // 15 minutes in ms

        reminders.forEach(reminder => {
            if (reminder.status !== 'pending') return;
            if (notifiedIds.has(reminder.id)) return;

            const dueDate = new Date(reminder.dueDate);
            const timeDiff = dueDate.getTime() - now.getTime();

            const handleMarkAsDone = async () => {
                try {
                    await api.updateReminder(reminder.id, { status: 'completed' });
                    toast.success('Rappel marqué comme fait');
                    queryClient.invalidateQueries({ queryKey: ['reminders'] });
                } catch (error) {
                    toast.error('Erreur lors de la mise à jour du rappel');
                }
            };

            // CASE 1: Upcoming (Due in the next 15 minutes)
            if (timeDiff > 0 && timeDiff <= notificationThreshold) {
                toast.info(`Bientôt : ${reminder.title}`, {
                    description: reminder.client?.name ? `Dans ~${Math.round(timeDiff / 60000)} min pour ${reminder.client.name}` : 'Rappel imminent',
                    duration: 15000,
                    action: {
                        label: 'Fait',
                        onClick: handleMarkAsDone
                    }
                });
                setNotifiedIds(prev => new Set(prev).add(reminder.id));
            }
            // CASE 2: Overdue (Past due)
            else if (timeDiff <= 0) {
                toast.error(`Retard : ${reminder.title}`, {
                    description: reminder.client?.name ? `Échéance dépassée pour ${reminder.client.name}` : 'Échéance dépassée',
                    duration: 20000,
                    action: {
                        label: 'Fait',
                        onClick: handleMarkAsDone
                    }
                });
                setNotifiedIds(prev => new Set(prev).add(reminder.id));
            }
        });
    }, [reminders, notifiedIds, navigate, queryClient]);

    return null;
}
