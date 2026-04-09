import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Agent } from '@/types/crm';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Coffee, UtensilsCrossed, Trash2, Clock, Plus } from 'lucide-react';

interface AgentBreaksDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agent: Agent | null;
}

const breakFormSchema = z.object({
    type: z.string().min(1, 'Sélectionnez un type'),
    startTime: z.string().min(1, 'Heure de début requise'),
    endTime: z.string().min(1, 'Heure de fin requise'),
}).refine(data => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
}, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ['endTime'],
});

export function AgentBreaksDialog({ open, onOpenChange, agent }: AgentBreaksDialogProps) {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);

    const form = useForm<z.infer<typeof breakFormSchema>>({
        resolver: zodResolver(breakFormSchema),
        defaultValues: {
            type: 'short_break',
            startTime: '',
            endTime: '',
        },
    });

    const { data: breaks = [], isLoading } = useQuery({
        queryKey: ['agent-breaks', agent?.id],
        queryFn: () => agent ? api.getAgentBreaks(agent.id) : Promise.resolve([]),
        enabled: !!agent && open,
    });

    const addBreakMutation = useMutation({
        mutationFn: (data: z.infer<typeof breakFormSchema>) => {
            if (!agent) throw new Error('No agent selected');
            return api.addAgentBreak({
                userId: agent.id,
                type: data.type,
                startTime: data.startTime,
                endTime: data.endTime,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-breaks', agent?.id] });
            toast.success('Pause ajoutée avec succès');
            setShowForm(false);
            form.reset();
        },
        onError: () => toast.error("Erreur lors de l'ajout de la pause"),
    });

    const deleteBreakMutation = useMutation({
        mutationFn: api.deleteAgentBreak,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-breaks', agent?.id] });
            toast.success('Pause supprimée');
        },
        onError: () => toast.error('Erreur lors de la suppression'),
    });

    if (!agent) return null;

    // Format date time helper
    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Format duration
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes} min`;
    };

    // Calculate today's total duration
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaysBreaks = breaks.filter((b: any) => new Date(b.startTime) >= todayStart);
    const totalDurationToday = todaysBreaks.reduce((acc: number, curr: any) => acc + (curr.duration || 0), 0);

    const onSubmit = (values: z.infer<typeof breakFormSchema>) => {
        addBreakMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Historique des Pauses : {agent.name}</DialogTitle>
                    <DialogDescription>
                        Consultez ou modifiez manuellement les pauses de cet agent.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg flex items-center gap-3 border border-orange-100 dark:border-orange-900">
                        <Clock className="h-8 w-8 text-orange-500" />
                        <div>
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                                Temps total de pause (Aujourd'hui)
                            </p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {formatDuration(totalDurationToday)}
                            </p>
                        </div>
                    </div>

                    {!showForm ? (
                        <div className="flex justify-end">
                            <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
                                <Plus className="h-4 w-4" /> Ajouter manuellement
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-muted p-4 rounded-lg border">
                            <h4 className="font-semibold mb-4 text-sm">Ajouter une pause</h4>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Type de pause</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="short_break">Pause Courte</SelectItem>
                                                            <SelectItem value="lunch">Déjeuner</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="startTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Heure de début</FormLabel>
                                                    <FormControl>
                                                        <Input type="datetime-local" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="endTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Heure de fin</FormLabel>
                                                    <FormControl>
                                                        <Input type="datetime-local" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end pt-2">
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                            Annuler
                                        </Button>
                                        <Button type="submit" disabled={addBreakMutation.isPending}>
                                            {addBreakMutation.isPending ? 'Ajout...' : 'Ajouter'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    )}

                    <div>
                        <h4 className="font-semibold mb-3">Relevé des pauses</h4>
                        {isLoading ? (
                            <p className="text-sm text-muted-foreground animate-pulse">Chargement...</p>
                        ) : breaks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucune pause enregistrée.</p>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Début</TableHead>
                                            <TableHead>Fin</TableHead>
                                            <TableHead>Durée</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {breaks.map((b: any) => (
                                            <TableRow key={b.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {b.type === 'lunch' ? (
                                                            <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                                                        ) : (
                                                            <Coffee className="h-4 w-4 text-orange-500" />
                                                        )}
                                                        <span className="text-sm">
                                                            {b.type === 'lunch' ? 'Déjeuner' : 'Pause Courte'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">
                                                    {formatDateTime(b.startTime)}
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">
                                                    {b.endTime ? formatDateTime(b.endTime) : <span className="text-orange-500">En cours...</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {b.duration ? formatDuration(b.duration) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            if (window.confirm("Supprimer cette pause ?")) {
                                                                deleteBreakMutation.mutate(b.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
