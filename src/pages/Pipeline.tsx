import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { api } from '@/services/api';
import KanbanColumn from '@/components/pipeline/KanbanColumn';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import CreateOpportunityModal from '@/components/pipeline/CreateOpportunityModal';

const Pipeline: React.FC = () => {
    const [stages, setStages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchPipelineData();
    }, []);

    const fetchPipelineData = async () => {
        try {
            setLoading(true);
            const data = await api.getPipelineStages();
            setStages(data);
        } catch (error) {
            console.error('Failed to fetch pipeline:', error);
            toast.error('Erreur lors du chargement du pipeline');
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Optimistic UI update
        const sourceStageIndex = stages.findIndex(s => s.id === source.droppableId);
        const destStageIndex = stages.findIndex(s => s.id === destination.droppableId);

        const newStages = [...stages];
        const [movedOpportunity] = newStages[sourceStageIndex].opportunities.splice(source.index, 1);
        newStages[destStageIndex].opportunities.splice(destination.index, 0, movedOpportunity);

        setStages(newStages);

        try {
            await api.moveOpportunity(draggableId, destination.droppableId);
            toast.success('Opportunité déplacée avec succès');
        } catch (error) {
            console.error('Failed to move opportunity:', error);
            toast.error('Erreur lors du déplacement');
            fetchPipelineData(); // Revert on failure
        }
    };

    const filteredStages = stages.map(stage => ({
        ...stage,
        opportunities: stage.opportunities.filter((opp: any) =>
            opp.client.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }));

    if (loading && stages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-4 p-4 lg:p-8 bg-slate-50/30 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pipeline de Ventes</h1>
                    <p className="text-muted-foreground text-sm">Gérez vos opportunités et suivez votre cycle de vente</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher une opportunité..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button size="sm" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Nouvelle Vente
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-4 h-full min-w-max">
                        {filteredStages.map((stage) => (
                            <KanbanColumn key={stage.id} stage={stage} />
                        ))}
                    </div>
                </DragDropContext>
            </div>

            <CreateOpportunityModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchPipelineData}
                stages={stages}
            />
        </div>
    );
};

export default Pipeline;
