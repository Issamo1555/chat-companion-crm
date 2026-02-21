import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, MoreVertical, Play, Pause, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import CreateWorkflowModal from '@/components/automation/CreateWorkflowModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Workflows: React.FC = () => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: workflows = [], isLoading } = useQuery({
        queryKey: ['workflows'],
        queryFn: api.getWorkflows,
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => api.toggleWorkflow(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast.success('Statut mis à jour');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            toast.success('Workflow supprimé');
        }
    });

    const toggleWorkflow = (id: string, currentStatus: boolean) => {
        toggleMutation.mutate({ id, isActive: !currentStatus });
    };

    const handleDelete = (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce workflow ?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Automatisations</h1>
                    <p className="text-muted-foreground">Créez des workflows pour gagner du temps et ne manquer aucune opportunité.</p>
                </div>
                <Button
                    className="gap-2 bg-primary hover:bg-primary/90"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="w-4 h-4" />
                    Créer un Workflow
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflows.map((workflow: any) => (
                        <Card key={workflow.id} className="relative overflow-hidden border-slate-200 hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Zap className="w-5 h-5 text-primary" />
                                    </div>
                                    <Switch
                                        checked={workflow.isActive}
                                        onCheckedChange={() => toggleWorkflow(workflow.id, workflow.isActive)}
                                    />
                                </div>
                                <CardTitle className="mt-4 text-xl">{workflow.name}</CardTitle>
                                <CardDescription className="line-clamp-2">{workflow.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="bg-slate-100 text-[10px] uppercase font-bold tracking-wider">
                                            {workflow.triggers[0]?.type?.replace('on_', '').replace(/_/g, ' ') || 'Trigger'}
                                        </Badge>
                                        <span className="text-slate-400 text-xs mt-1">→</span>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                                            {workflow.actions?.length || 0} Actions
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 italic text-[10px] text-muted-foreground">
                                        <span>Créé le {format(new Date(workflow.createdAt), 'dd MMMM yyyy', { locale: fr })}</span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                onClick={() => handleDelete(workflow.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary/40 hover:text-primary/60 transition-all group min-h-[250px]"
                    >
                        <div className="p-4 rounded-full bg-slate-50 group-hover:bg-primary/5 transition-colors">
                            <Plus className="w-8 h-8" />
                        </div>
                        <span className="mt-4 font-semibold">Nouveau Workflow</span>
                    </button>
                </div>
            )}

            <CreateWorkflowModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['workflows'] })}
            />
        </div>
    );
};

export default Workflows;
