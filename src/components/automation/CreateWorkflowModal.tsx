import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface CreateWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const TRIGGER_TYPES = [
    { value: 'on_client_created', label: 'Nouveau Client Créé' },
    { value: 'on_status_change', label: 'Changement de Statut' },
    { value: 'on_opportunity_stage_change', label: 'Changement d\'étape de vente' },
    { value: 'on_message_received', label: 'Message Reçu' },
];

const ACTION_TYPES = [
    { value: 'send_message', label: 'Envoyer un Message' },
    { value: 'add_tag', label: 'Ajouter un Tag' },
    { value: 'remove_tag', label: 'Supprimer un Tag' },
    { value: 'update_status', label: 'Mettre à jour le Statut' },
];

const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [trigger, setTrigger] = useState(TRIGGER_TYPES[0].value);
    const [actions, setActions] = useState<any[]>([{ type: 'send_message', config: { content: '' } }]);

    const handleAddAction = () => {
        setActions([...actions, { type: 'send_message', config: { content: '' } }]);
    };

    const handleRemoveAction = (index: number) => {
        if (actions.length > 1) {
            setActions(actions.filter((_, i) => i !== index));
        }
    };

    const handleActionChange = (index: number, field: string, value: any) => {
        const newActions = [...actions];
        if (field === 'type') {
            newActions[index].type = value;
        } else {
            newActions[index].config = { ...newActions[index].config, [field]: value };
        }
        setActions(newActions);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setLoading(true);
            await api.createWorkflow({
                name: name.trim(),
                description: description.trim(),
                triggers: [{ type: trigger, config: {} }],
                actions: actions.map((a, i) => ({ ...a, order: i }))
            });
            toast.success('Workflow créé avec succès !');
            onSuccess();
            onClose();
            // Reset form
            setName('');
            setDescription('');
            setTrigger(TRIGGER_TYPES[0].value);
            setActions([{ type: 'send_message', config: { content: '' } }]);
        } catch (error) {
            console.error('Failed to create workflow:', error);
            toast.error('Erreur lors de la création du workflow');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau Workflow</DialogTitle>
                    <DialogDescription>
                        Définissez un déclencheur et une suite d'actions automatisées.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-6 py-4">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du workflow</Label>
                            <Input
                                id="name"
                                placeholder="ex: Relance Client Abandonné"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Description</Label>
                            <Input
                                id="desc"
                                placeholder="Optionnel"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <Label className="text-lg font-semibold">1. Déclencheur (Trigger)</Label>
                        <Select value={trigger} onValueChange={setTrigger}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir un déclencheur" />
                            </SelectTrigger>
                            <SelectContent>
                                {TRIGGER_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-lg font-semibold">2. Actions</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddAction} className="gap-2">
                                <Plus className="h-4 w-4" /> Ajouter une action
                            </Button>
                        </div>

                        {actions.map((action, index) => (
                            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative group">
                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1">
                                        <Label className="text-xs uppercase text-slate-500 mb-1 block font-bold">Type d'action</Label>
                                        <Select
                                            value={action.type}
                                            onValueChange={(v) => handleActionChange(index, 'type', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ACTION_TYPES.map(a => (
                                                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {actions.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mt-6 h-10 w-10 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemoveAction(index)}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>

                                {action.type === 'send_message' && (
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-slate-500 mb-1 block font-bold">Message</Label>
                                        <Input
                                            placeholder="Contenu du message..."
                                            value={action.config.content || ''}
                                            onChange={(e) => handleActionChange(index, 'content', e.target.value)}
                                        />
                                    </div>
                                )}

                                {action.type === 'add_tag' && (
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-slate-500 mb-1 block font-bold">Tag à ajouter</Label>
                                        <Input
                                            placeholder="ex: Lead Chaud"
                                            value={action.config.tag || ''}
                                            onChange={(e) => handleActionChange(index, 'tag', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
                        <Button type="submit" disabled={loading || !name.trim()}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer le Workflow
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateWorkflowModal;
