import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Reminder } from '@/types/crm';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock, Trash2, User, Phone, Loader2, CalendarDays, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Reminders() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const queryClient = useQueryClient();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reminderDate, setReminderDate] = useState<Date | undefined>(new Date());
    const [dueTime, setDueTime] = useState('09:00');
    const [selectedClientId, setSelectedClientId] = useState('');

    const { data: reminders = [], isLoading: isLoadingReminders } = useQuery({
        queryKey: isAdmin ? ['reminders'] : ['reminders', 'user', user?.id],
        queryFn: async () => {
            const allRem = await api.getReminders();
            if (isAdmin) return allRem;
            return allRem.filter((r: Reminder) => r.userId === user?.id || (r.client as any)?.assignedAgentId === user?.id);
        },
    });

    const { data: clients = [], isLoading: isLoadingClients } = useQuery({
        queryKey: isAdmin ? ['clients'] : ['clients', 'agent', user?.id],
        queryFn: async () => {
            const allCli = await api.getClients();
            if (isAdmin) return allCli;
            return allCli.filter((c: any) => c.assignedAgentId === user?.id);
        }
    });

    const isLoading = isLoadingReminders || isLoadingClients;

    const createMutation = useMutation({
        mutationFn: (data: Partial<Reminder>) => api.createReminder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            setTitle('');
            setDescription('');
            setReminderDate(new Date());
            setDueTime('09:00');
            setSelectedClientId('');
            toast.success('Rappel créé avec succès');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<Reminder> }) => api.updateReminder(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] })
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteReminder(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] })
    });

    // Combine actual Reminders with virtual reminders from 'relaunched' clients
    const allReminders: Reminder[] = useMemo(() => {
        const virtualReminders: Reminder[] = clients
            .filter((c: any) => c.status === 'relaunched')
            .map((c: any) => ({
                id: `virtual-${c.id}`,
                clientId: c.id,
                userId: c.assignedAgentId || 'system',
                title: `Relance Client: ${c.name}`,
                description: 'Ce client est en statut "Relancé". Merci de faire le suivi.',
                dueDate: c.updatedAt,
                status: 'pending',
                createdAt: c.updatedAt,
                updatedAt: c.updatedAt,
                client: c,
                isVirtual: true // Custom flag to identify them later if needed
            } as any));

        return [...reminders, ...virtualReminders].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [reminders, clients]);

    // Filter by selected date
    const filteredReminders = useMemo(() => {
        if (!date) return allReminders;
        return allReminders.filter(r => isSameDay(new Date(r.dueDate), date));
    }, [allReminders, date]);

    // Extract dates that have reminders for calendar dots
    const datesWithReminders = useMemo(() => {
        return allReminders.map(r => new Date(r.dueDate));
    }, [allReminders]);

    const toggleStatus = (reminder: Reminder) => {
        const newStatus = reminder.status === 'completed' ? 'pending' : 'completed';
        updateMutation.mutate({ id: reminder.id, data: { status: newStatus } });
    };

    const handleCreate = () => {
        if (!title || !reminderDate || !dueTime || !selectedClientId) {
            toast.error('Veuillez remplir tous les champs obligatoires (Titre, Date, Heure, Client)');
            return;
        }

        const dateStr = format(reminderDate, 'yyyy-MM-dd');
        const dateTimeString = `${dateStr}T${dueTime}:00`;
        const dateObj = new Date(dateTimeString);

        if (isNaN(dateObj.getTime())) {
            toast.error('Date ou heure invalide');
            return;
        }

        createMutation.mutate({
            title,
            description,
            dueDate: dateObj.toISOString(),
            userId: user?.id,
            clientId: selectedClientId,
        });
    };

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Rappels & Calendrier</h1>
                    <p className="text-muted-foreground">Gérez vos tâches et relances selon la date</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[350px_1fr] items-start">
                    <div className="space-y-4 sticky top-6">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex justify-center flex-col items-center">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    locale={fr}
                                    className="rounded-md border shadow-sm p-4 [&_.rdp-cell]:p-1 [&_.rdp-day]:h-10 [&_.rdp-day]:w-10 [&_.rdp-head_cell]:w-10 [&_.rdp-caption]:mb-4"
                                    modifiers={{
                                        hasReminder: datesWithReminders
                                    }}
                                    modifiersStyles={{
                                        hasReminder: {
                                            fontWeight: 'bold',
                                            textDecoration: 'underline',
                                            textDecorationColor: 'var(--primary)',
                                            textUnderlineOffset: '4px'
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4">
                            <h3 className="font-medium mb-2">Résumé</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total:</span>
                                    <span className="font-semibold">{allReminders.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">En attente:</span>
                                    <span className="font-semibold text-orange-500">
                                        {allReminders.filter(r => r.status === 'pending').length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Terminés:</span>
                                    <span className="font-semibold text-green-500">
                                        {allReminders.filter(r => r.status === 'completed').length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm relative overflow-hidden mt-6">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                            <h4 className="font-semibold text-base flex items-center gap-2 mb-2 pl-2">
                                Nouveau Rappel (Général)
                            </h4>
                            <div className="pl-2 space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Client associé <span className="text-destructive">*</span></label>
                                    <select
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="" disabled>Sélectionner un client...</option>
                                        {clients.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Titre <span className="text-destructive">*</span></label>
                                    <input
                                        placeholder="Titre du rappel"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Description</label>
                                    <textarea
                                        placeholder="Détails (optionnel)"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium">Date</label>
                                        <input
                                            type="date"
                                            value={reminderDate ? format(reminderDate, 'yyyy-MM-dd') : ''}
                                            onChange={(e) => setReminderDate(e.target.value ? new Date(e.target.value) : undefined)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="w-[120px] flex flex-col gap-1.5">
                                        <label className="text-sm font-medium">Heure</label>
                                        <input
                                            type="time"
                                            value={dueTime}
                                            onChange={(e) => setDueTime(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                                        onClick={handleCreate}
                                        disabled={createMutation.isPending || !title || !selectedClientId}
                                    >
                                        {createMutation.isPending ? 'Création...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 min-h-[500px]">
                        <h2 className="text-lg font-semibold mb-6 flex items-center justify-between">
                            <span className="capitalize">{date ? format(date, 'EEEE d MMMM yyyy', { locale: fr }) : 'Tous les rappels'}</span>
                            {date && (
                                <button
                                    onClick={() => setDate(undefined)}
                                    className="text-sm text-primary hover:underline font-normal"
                                >
                                    Voir tout
                                </button>
                            )}
                        </h2>

                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredReminders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl border-border bg-muted/20">
                                <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium">Aucun rappel</h3>
                                <p className="text-muted-foreground mt-1 max-w-sm">
                                    Vous n'avez aucun rappel prévu pour {date ? 'cette date' : 'le moment'}.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredReminders.map((reminder) => {
                                    const isVirtual = (reminder as any).isVirtual;
                                    const isOverdue = new Date(reminder.dueDate) < new Date() && reminder.status === 'pending';
                                    const isCompleted = reminder.status === 'completed';

                                    return (
                                        <div
                                            key={reminder.id}
                                            className={cn(
                                                "flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-all duration-200 relative overflow-hidden pl-5",
                                                isCompleted ? "bg-muted/30 border-transparent opacity-80" : "bg-card border-border hover:shadow-md",
                                                isOverdue ? "border-red-500/50 shadow-sm shadow-red-500/10" : "",
                                                isVirtual && !isCompleted ? "bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" : ""
                                            )}
                                        >
                                            {/* Colored left strip */}
                                            <div className={cn(
                                                "absolute left-0 top-0 bottom-0 w-1.5",
                                                isCompleted ? "bg-muted-foreground/30" :
                                                    isOverdue ? "bg-red-500" :
                                                        isVirtual ? "bg-blue-500" : "bg-primary"
                                            )} />

                                            <div className="flex gap-4 flex-1">
                                                {isVirtual ? (
                                                    <Circle className="h-6 w-6 text-muted-foreground/30 cursor-not-allowed flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <button
                                                        onClick={() => toggleStatus(reminder)}
                                                        className="mt-0.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                                                    >
                                                        {reminder.status === 'completed' ? (
                                                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                                                        ) : (
                                                            <Circle className="h-6 w-6" />
                                                        )}
                                                    </button>
                                                )}

                                                <div className="flex-1">
                                                    {isVirtual && !isCompleted && (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 font-semibold text-blue-700 dark:text-blue-300 text-[10px] uppercase tracking-wider mb-2">
                                                            <RefreshCw className="h-3 w-3" /> Relance Auto
                                                        </span>
                                                    )}
                                                    <p className={cn(
                                                        "font-semibold text-lg",
                                                        isCompleted && "line-through text-muted-foreground"
                                                    )}>
                                                        {reminder.title}
                                                    </p>
                                                    {reminder.description && (
                                                        <p className="text-muted-foreground mt-1 text-sm">
                                                            {reminder.description}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-4 mt-3 text-sm font-medium">
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md",
                                                            isOverdue ? "text-red-700 bg-red-50 dark:bg-red-950/30" : "text-foreground bg-secondary/60"
                                                        )}>
                                                            <Clock className="h-4 w-4" />
                                                            <span>{format(new Date(reminder.dueDate), 'HH:mm')}</span>
                                                            {!date && (
                                                                <>
                                                                    <span className="mx-1 opacity-50">•</span>
                                                                    <span>{format(new Date(reminder.dueDate), 'dd/MM/yyyy')}</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {reminder.client && (
                                                            <Link to={`/clients/${reminder.client.id}`} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/5 hover:bg-primary/10 text-primary transition-colors">
                                                                <User className="h-4 w-4" />
                                                                <span>{reminder.client.name}</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                                                {reminder.client?.phoneNumber && (
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-secondary/40 px-2 py-1 rounded-md">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {reminder.client.phoneNumber}
                                                    </div>
                                                )}
                                                {!isVirtual && (
                                                    <button
                                                        onClick={() => deleteMutation.mutate(reminder.id)}
                                                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors p-2 rounded-md sm:mt-auto"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
