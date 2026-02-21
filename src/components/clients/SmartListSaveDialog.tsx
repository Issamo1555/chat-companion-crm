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
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SmartListSaveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentFilters: any;
}

const SmartListSaveDialog: React.FC<SmartListSaveDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
    currentFilters
}) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setLoading(true);
            await api.createSmartList({
                name: name.trim(),
                filters: currentFilters
            });
            toast.success('Smart List enregistrée !');
            onSuccess();
            onClose();
            setName('');
        } catch (error) {
            console.error('Failed to save smart list:', error);
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Enregistrer une Smart List</DialogTitle>
                    <DialogDescription>
                        Sauvegardez vos filtres actuels pour y accéder rapidement plus tard.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom de la liste</Label>
                        <Input
                            id="name"
                            placeholder="ex: Clients VIP, Leads Instagram..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={loading || !name.trim()}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SmartListSaveDialog;
