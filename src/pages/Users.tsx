import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Shield, UserCircle, Trash2, Power } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost:3000/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'agent';
    isActive: boolean;
    clientCount: number;
    createdAt: string;
}

export default function Users() {
    const { token, user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [roleDialog, setRoleDialog] = useState<{ open: boolean; user: User | null }>({
        open: false,
        user: null,
    });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
        open: false,
        user: null,
    });
    const [selectedRole, setSelectedRole] = useState<'admin' | 'agent'>('agent');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'agent'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Fetch users
    const { data: users = [], isLoading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            return response.json();
        },
    });

    // Update role mutation
    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const response = await fetch(`${API_URL}/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update role');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Rôle mis à jour avec succès');
            setRoleDialog({ open: false, user: null });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
            const response = await fetch(`${API_URL}/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update status');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Statut mis à jour avec succès');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete user');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Utilisateur supprimé avec succès');
            setDeleteDialog({ open: false, user: null });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Filter users
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && user.isActive) ||
            (statusFilter === 'inactive' && !user.isActive);
        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleRoleChange = () => {
        if (roleDialog.user) {
            updateRoleMutation.mutate({
                userId: roleDialog.user.id,
                role: selectedRole,
            });
        }
    };

    const handleStatusToggle = (user: User) => {
        updateStatusMutation.mutate({
            userId: user.id,
            isActive: !user.isActive,
        });
    };

    const handleDelete = () => {
        if (deleteDialog.user) {
            deleteUserMutation.mutate(deleteDialog.user.id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
                <p className="text-muted-foreground">Gérer les rôles et les accès de votre équipe</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <Input
                    placeholder="Rechercher par nom ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les rôles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actifs</SelectItem>
                        <SelectItem value="inactive">Inactifs</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Clients</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    Aucun utilisateur trouvé
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                            {user.role === 'admin' ? (
                                                <><Shield className="h-3 w-3 mr-1" /> Admin</>
                                            ) : (
                                                <><UserCircle className="h-3 w-3 mr-1" /> Agent</>
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                                            {user.isActive ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.clientCount}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedRole(user.role);
                                                    setRoleDialog({ open: true, user });
                                                }}
                                                disabled={user.id === currentUser?.id}
                                            >
                                                Rôle
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStatusToggle(user)}
                                                disabled={user.id === currentUser?.id}
                                            >
                                                <Power className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setDeleteDialog({ open: true, user })}
                                                disabled={user.id === currentUser?.id}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Role Change Dialog */}
            <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog({ open, user: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le rôle</DialogTitle>
                        <DialogDescription>
                            Modifier le rôle de {roleDialog.user?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleDialog({ open: false, user: null })}>
                            Annuler
                        </Button>
                        <Button onClick={handleRoleChange} disabled={updateRoleMutation.isPending}>
                            {updateRoleMutation.isPending ? 'En cours...' : 'Confirmer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, user: null })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l'utilisateur</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer {deleteDialog.user?.name} ? Cette action est
                            irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteUserMutation.isPending}
                        >
                            {deleteUserMutation.isPending ? 'Suppression...' : 'Supprimer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
