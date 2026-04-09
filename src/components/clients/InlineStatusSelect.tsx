import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { ClientStatus, STATUS_LABELS } from '@/types/crm';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import StatusBadge from './StatusBadge';
import { ChevronDown, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Reminder } from '@/types/crm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InlineStatusSelectProps {
    clientId: string;
    currentStatus: ClientStatus;
    size?: 'sm' | 'md';
}

export function InlineStatusSelect({ clientId, currentStatus, size = 'md' }: InlineStatusSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderDesc, setReminderDesc] = useState('');
    const [reminderDate, setReminderDate] = useState<Date | undefined>(new Date());
    const [reminderTime, setReminderTime] = useState('09:00');

    const queryClient = useQueryClient();
    const { user } = useAuth();

    const updateStatusMutation = useMutation({
        mutationFn: (newStatus: ClientStatus) =>
            api.updateClientStatus(clientId, newStatus, 'Statut mis à jour depuis la liste', user?.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success('Statut mis à jour avec succès');
            setIsOpen(false);
        },
        onError: () => {
            toast.error('Erreur lors de la mise à jour du statut');
        }
    });

    const createReminderMutation = useMutation({
        mutationFn: (data: Partial<Reminder>) => api.createReminder(data),
        onSuccess: () => {
            updateStatusMutation.mutate('relaunched');
        },
        onError: () => {
            toast.error('Erreur lors de la création du rappel');
        }
    });

    const handleStatusChange = (newStatus: string) => {
        if (newStatus === currentStatus) return;

        if (newStatus === 'relaunched') {
            setIsReminderModalOpen(true);
            setIsOpen(false);
        } else {
            updateStatusMutation.mutate(newStatus as ClientStatus);
        }
    };

    const handleSaveRappel = () => {
        if (!reminderDate || !reminderTime) {
            toast.error('Veuillez remplir la date et l\'heure');
            return;
        }

        const dateStr = format(reminderDate, 'yyyy-MM-dd');
        const dateTimeString = `${dateStr}T${reminderTime}:00`;
        const dateObj = new Date(dateTimeString);

        if (isNaN(dateObj.getTime())) {
            toast.error('Date ou heure invalide');
            return;
        }

        createReminderMutation.mutate({
            clientId,
            title: reminderTitle || 'Relance Client',
            description: reminderDesc,
            dueDate: dateObj.toISOString()
        });
    };

    const handleCancelRappel = () => {
        setIsReminderModalOpen(false);
        setReminderTitle('');
        setReminderDesc('');
        setReminderDate(new Date());
        setReminderTime('09:00');
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div onClick={handleClick} className="inline-block relative z-10">
            <Select
                value={currentStatus}
                onValueChange={handleStatusChange}
                open={isOpen}
                onOpenChange={setIsOpen}
            >
                <SelectTrigger
                    className={cn(
                        "w-auto h-auto p-0 border-0 bg-transparent ring-0 focus:ring-0 focus:ring-offset-0 [&>svg]:hidden shadow-none",
                        updateStatusMutation.isPending && "opacity-50 cursor-wait"
                    )}
                    disabled={updateStatusMutation.isPending}
                >
                    <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                        <StatusBadge status={currentStatus} size={size} />
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                    </div>
                </SelectTrigger>
                <SelectContent onClick={handleClick}>
                    {Object.keys(STATUS_LABELS).map((value) => (
                        <SelectItem key={value} value={value} className="cursor-pointer py-2">
                            <StatusBadge status={value as ClientStatus} size="sm" />
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Dialog open={isReminderModalOpen} onOpenChange={setIsReminderModalOpen}>
                <DialogContent onClick={handleClick}>
                    <DialogHeader>
                        <DialogTitle>Programmer un rappel (Relance)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="Titre du rappel (optionnel)"
                            value={reminderTitle}
                            onChange={(e) => setReminderTitle(e.target.value)}
                        />
                        <Textarea
                            placeholder="Description (optionnelle)"
                            value={reminderDesc}
                            onChange={(e) => setReminderDesc(e.target.value)}
                            rows={2}
                        />
                        <div className="flex gap-4">
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-sm font-medium">Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !reminderDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {reminderDate ? format(reminderDate, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
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
                            <div className="w-[120px] flex flex-col gap-1.5">
                                <label className="text-sm font-medium">Heure</label>
                                <Input
                                    type="time"
                                    value={reminderTime}
                                    onChange={(e) => setReminderTime(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelRappel}>Annuler</Button>
                        <Button onClick={handleSaveRappel} disabled={createReminderMutation.isPending || updateStatusMutation.isPending}>
                            {(createReminderMutation.isPending || updateStatusMutation.isPending) ? 'Enregistrement...' : 'Enregistrer et changer le statut'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default InlineStatusSelect;
