import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';

interface CreateOpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    stages: any[];
}

const CreateOpportunityModal: React.FC<CreateOpportunityModalProps> = ({ isOpen, onClose, onSuccess, stages }) => {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedStageId, setSelectedStageId] = useState('');
    const [value, setValue] = useState('0');

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            if (stages.length > 0) {
                setSelectedStageId(stages[0].id);
            }
        }
    }, [isOpen, stages]);

    const fetchClients = async () => {
        try {
            const data = await api.getClients();
            setClients(data);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
            toast.error('Erreur lors du chargement des clients');
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phoneNumber.includes(searchQuery)
    ).slice(0, 10);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientId || !selectedStageId) {
            toast.error('Veuillez sélectionner un client et une étape');
            return;
        }

        try {
            setLoading(true);
            await api.createOpportunity({
                clientId: selectedClientId,
                stageId: selectedStageId,
                value: parseFloat(value) || 0,
            });
            toast.success('Opportunité créée avec succès');
            onSuccess();
            onClose();
            // Reset
            setSelectedClientId('');
            setValue('0');
        } catch (error) {
            console.error('Failed to create opportunity:', error);
            toast.error('Erreur lors de la création');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nouvelle Opportunité</DialogTitle>
                    <DialogDescription>
                        Créez une nouvelle opportunité de vente pour un client existant.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Client</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un client..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="max-h-40 overflow-y-auto border rounded-md mt-1">
                            {filteredClients.length > 0 ? (
                                filteredClients.map(client => (
                                    <div
                                        key={client.id}
                                        className={`p-2 cursor-pointer hover:bg-slate-100 flex justify-between items-center ${selectedClientId === client.id ? 'bg-primary/10' : ''}`}
                                        onClick={() => setSelectedClientId(client.id)}
                                    >
                                        <span className="text-sm font-medium">{client.name}</span>
                                        <span className="text-xs text-muted-foreground">{client.phoneNumber}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-2 text-sm text-muted-foreground text-center">Aucun client trouvé</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stage">Étape du Pipeline</Label>
                            <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                                <SelectTrigger id="stage">
                                    <SelectValue placeholder="Choisir une étape" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stages.map(stage => (
                                        <SelectItem key={stage.id} value={stage.id}>
                                            {stage.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="value">Valeur (€/MAD)</Label>
                            <Input
                                id="value"
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={loading || !selectedClientId}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer Vente
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateOpportunityModal;
