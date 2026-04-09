import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Circle, Coffee, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BreakManager() {
    const queryClient = useQueryClient();
    const [elapsed, setElapsed] = useState('');

    const { data: activeBreak, isLoading } = useQuery({
        queryKey: ['currentBreak'],
        queryFn: api.getCurrentBreak
    });

    const startMutation = useMutation({
        mutationFn: api.startBreak,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentBreak'] });
            queryClient.invalidateQueries({ queryKey: ['team'] }); // for admin view
            toast.success('Pause démarrée');
        },
        onError: () => toast.error('Erreur lors du démarrage de la pause')
    });

    const endMutation = useMutation({
        mutationFn: api.endBreak,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentBreak'] });
            queryClient.invalidateQueries({ queryKey: ['team'] });
            toast.success('Pause terminée, bon retour !');
        },
        onError: () => toast.error('Erreur lors de la fin de la pause')
    });

    useEffect(() => {
        if (!activeBreak) {
            setElapsed('');
            return;
        }

        const interval = setInterval(() => {
            const start = new Date(activeBreak.startTime).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((now - start) / 1000);

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            if (hours > 0) {
                setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            } else {
                setElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeBreak]);

    if (isLoading) return <div className="text-xs text-muted-foreground animate-pulse">Chargement...</div>;

    const isHovering = false; // For simplified popover logic if needed

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 -ml-2 rounded-md hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border transition-colors">
                        {activeBreak ? (
                            <>
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                </div>
                                <span className="text-orange-600 dark:text-orange-400">
                                    En pause {elapsed && `(${elapsed})`}
                                </span>
                            </>
                        ) : (
                            <>
                                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                <span className="text-sidebar-foreground/70">En ligne</span>
                            </>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                            Changer de statut
                        </p>

                        {!activeBreak ? (
                            <>
                                <button
                                    onClick={() => startMutation.mutate('lunch')}
                                    disabled={startMutation.isPending}
                                    className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                                >
                                    <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                                    <span>Pause Déjeuner</span>
                                </button>
                                <button
                                    onClick={() => startMutation.mutate('short_break')}
                                    disabled={startMutation.isPending}
                                    className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                                >
                                    <Coffee className="h-4 w-4 text-orange-500" />
                                    <span>Pause Courte</span>
                                </button>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <div className="px-2 py-1.5 bg-orange-50 dark:bg-orange-950/30 rounded-md border border-orange-100 dark:border-orange-900 border-dashed">
                                    <p className="text-xs text-orange-800 dark:text-orange-300">
                                        Type: {activeBreak.type === 'lunch' ? 'Déjeuner' : 'Pause Courte'}
                                    </p>
                                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                                        {elapsed}
                                    </p>
                                </div>
                                <button
                                    onClick={() => endMutation.mutate()}
                                    disabled={endMutation.isPending}
                                    className="w-full flex items-center justify-center gap-2 px-2 py-2 text-sm rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Terminer la pause</span>
                                </button>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Global Floating Banner for Active Break */}
            {activeBreak && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-background border border-border shadow-lg rounded-full px-4 py-2 flex items-center gap-4 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                        </div>
                        <span className="text-sm font-medium">
                            En pause ({activeBreak.type === 'lunch' ? 'Déjeuner' : 'Courte'}) - <span className="text-orange-600 dark:text-orange-400 font-bold">{elapsed}</span>
                        </span>
                    </div>
                    <button
                        onClick={() => endMutation.mutate()}
                        disabled={endMutation.isPending}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                    >
                        {endMutation.isPending ? 'Patientez...' : 'Terminer la pause'}
                    </button>
                </div>
            )}
        </>
    );
}
