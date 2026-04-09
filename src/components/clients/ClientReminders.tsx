import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Reminder } from '@/types/crm';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface ClientRemindersProps {
    clientId: string;
}

export default function ClientReminders({ clientId }: ClientRemindersProps) {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [reminderDate, setReminderDate] = useState<Date | undefined>(new Date());
    const [dueTime, setDueTime] = useState('09:00');

    const { data: reminders = [], isLoading } = useQuery({
        queryKey: ['reminders', clientId],
        queryFn: () => api.getReminders(clientId),
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Reminder>) => api.createReminder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders', clientId] });
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            toast.success('Rappel créé');
            setIsAdding(false);
            setTitle('');
            setDescription('');
            setReminderDate(new Date());
            setDueTime('09:00');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<Reminder> }) => api.updateReminder(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders', clientId] });
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteReminder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminders', clientId] });
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            toast.success('Rappel supprimé');
        }
    });

    const handleCreate = () => {
        if (!title || !reminderDate || !dueTime) {
            toast.error('Veuillez remplir le titre, la date et l\'heure');
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
            clientId,
            title,
            description,
            dueDate: dateObj.toISOString(),
        });
    };

    const toggleStatus = (reminder: Reminder) => {
        const newStatus = reminder.status === 'completed' ? 'pending' : 'completed';
        updateMutation.mutate({ id: reminder.id, data: { status: newStatus } });
    };

    // Filter reminders by selected date
    const filteredReminders = useMemo(() => {
        if (!selectedDate) return reminders;
        return reminders.filter(r => isSameDay(new Date(r.dueDate), selectedDate));
    }, [reminders, selectedDate]);

    // Dates with existing reminders
    const datesWithReminders = useMemo(() => {
        return reminders.map(r => new Date(r.dueDate));
    }, [reminders]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Rappels</h3>
                    <p className="text-sm text-muted-foreground mt-1">Gérez les rappels pour ce client. Cliquez sur une date pour voir ou ajouter un rappel.</p>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[320px_1fr] items-start">
                <div className="flex flex-col gap-4 w-full max-w-[320px] mx-auto xl:mx-0">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex justify-center flex-col items-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                locale={fr}
                                className="rounded-md border shadow-sm p-3 [&_.rdp-cell]:p-0.5 [&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-head_cell]:w-9 [&_.rdp-caption]:mb-2"
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

                    {!isAdding ? (
                        <Button className="w-full" onClick={() => {
                            setReminderDate(selectedDate || new Date());
                            setIsAdding(true);
                        }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau rappel
                        </Button>
                    ) : (
                        <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                            <h4 className="font-semibold text-base flex items-center gap-2 mb-2 pl-2">
                                <Plus className="h-5 w-5 text-primary" />
                                Nouveau Rappel
                            </h4>
                            <div className="pl-2 space-y-3">
                                <Input
                                    placeholder="Titre du rappel (e.g. Relancer)"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-background"
                                />
                                <Textarea
                                    placeholder="Description (optionnelle)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="bg-background resize-none"
                                />
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-muted-foreground">Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal bg-background",
                                                        !reminderDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {reminderDate ? format(reminderDate, 'PPP', { locale: fr }) : <span>Choisir...</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={reminderDate}
                                                    onSelect={setReminderDate}
                                                    initialFocus
                                                    locale={fr}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-muted-foreground">Heure</label>
                                        <Input
                                            type="time"
                                            value={dueTime}
                                            onChange={(e) => setDueTime(e.target.value)}
                                            className="w-full bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Annuler</Button>
                                    <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
                                        {createMutation.isPending ? '...' : 'Enregistrer'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4 flex flex-col h-full">
                    <div className="bg-card rounded-xl border border-border p-4 flex-1">
                        <div className="flex items-center justify-between mb-4 border-b pb-3">
                            <h4 className="font-medium text-sm capitalize">
                                {selectedDate ? format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr }) : 'Tous les rappels'}
                            </h4>
                            {selectedDate && (
                                <button
                                    onClick={() => setSelectedDate(undefined)}
                                    className="text-xs text-primary hover:underline font-normal"
                                >
                                    Voir tout
                                </button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="text-center py-4 text-muted-foreground flex justify-center">
                                <span className="animate-spin mr-2">⏳</span> Chargement...
                            </div>
                        ) : filteredReminders.length === 0 ? (
                            <div className="text-center py-8 border border-dashed rounded-xl text-muted-foreground">
                                Aucun rappel {selectedDate ? 'pour cette date' : 'pour ce client'}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredReminders.map((reminder) => (
                                    <div
                                        key={reminder.id}
                                        className={cn(
                                            "flex gap-3 p-3 rounded-xl border transition-colors",
                                            reminder.status === 'completed' ? "bg-muted/50 border-transparent opacity-70" : "bg-card border-border shadow-sm",
                                            new Date(reminder.dueDate) < new Date() && reminder.status === 'pending' ? "border-red-500/50 bg-red-500/5 text-red-900" : ""
                                        )}
                                    >
                                        <button
                                            onClick={() => toggleStatus(reminder)}
                                            className="mt-1 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                                        >
                                            {reminder.status === 'completed' ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <Circle className="h-5 w-5" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "font-medium truncate",
                                                reminder.status === 'completed' && "line-through text-muted-foreground"
                                            )}>
                                                {reminder.title}
                                            </p>
                                            {reminder.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                                    {reminder.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs font-medium">
                                                <div className={cn(
                                                    "flex items-center gap-1",
                                                    new Date(reminder.dueDate) < new Date() && reminder.status === 'pending' ? "text-red-500" : "text-muted-foreground"
                                                )}>
                                                    {!selectedDate && (
                                                        <>
                                                            <CalendarIcon className="h-3 w-3" />
                                                            <span>{format(new Date(reminder.dueDate), 'dd MMM yyyy', { locale: fr })}</span>
                                                        </>
                                                    )}
                                                    <Clock className={cn("h-3 w-3", !selectedDate && "ml-1")} />
                                                    <span>{format(new Date(reminder.dueDate), 'HH:mm')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => deleteMutation.mutate(reminder.id)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors opacity-60 p-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
