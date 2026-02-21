import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Template } from '@/types/crm';

interface TemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: Template | null;
}

const API_URL = 'http://localhost:3000/api';

export function TemplateDialog({ open, onOpenChange, template }: TemplateDialogProps) {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        content: '',
        category: 'general',
    });

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name,
                content: template.content,
                category: template.category || 'general',
            });
        } else {
            setFormData({
                name: '',
                content: '',
                category: 'general',
            });
        }
    }, [template, open]);

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = template
                ? `${API_URL}/templates/${template.id}`
                : `${API_URL}/templates`;

            const method = template ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save template');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            toast.success(template ? 'Modèle mis à jour' : 'Modèle créé');
            onOpenChange(false);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{template ? 'Modifier le modèle' : 'Nouveau modèle'}</DialogTitle>
                    <DialogDescription>
                        Créez des modèles de messages pour répondre plus rapidement.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Salutation"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Catégorie</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">Général</SelectItem>
                                <SelectItem value="sales">Vente</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="shipping">Livraison</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="content">Message</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Bonjour, comment puis-je vous aider ?"
                            className="h-32"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Enregistrement...' : template ? 'Mettre à jour' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
