import MainLayout from '@/components/layout/MainLayout';
import AgentCard from '@/components/agents/AgentCard';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  UserCog,
  LayoutGrid,
  List,
  Users,
  Shield,
  UserCheck,
  Mail,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Agent } from '@/types/crm';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';

const Team = () => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'agent'>('all');

  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; agent: Agent | null }>({ open: false, agent: null });
  const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; agent: Agent | null }>({ open: false, agent: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; agent: Agent | null }>({ open: false, agent: null });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, user: currentUser } = useAuth();
  const API_URL = 'http://localhost:3000/api';

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  });

  // Status Mutation
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
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Statut mis à jour avec succès');
      setDeactivateDialog({ open: false, agent: null });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete User Mutation
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
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Utilisateur supprimé avec succès');
      setDeleteDialog({ open: false, agent: null });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || agent.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate stats
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.isActive).length;
  const adminCount = agents.filter(a => a.role === 'admin').length;

  const handleEdit = (agent: Agent) => {
    setEditDialog({ open: true, agent });
  };

  const handleViewClients = (agent: Agent) => {
    navigate(`/clients?agentId=${agent.id}`);
  };

  const handleDeactivate = (agent: Agent) => {
    setDeactivateDialog({ open: true, agent });
  };

  const handleDelete = (agent: Agent) => {
    setDeleteDialog({ open: true, agent });
  };

  const confirmDeactivate = () => {
    if (deactivateDialog.agent) {
      updateStatusMutation.mutate({
        userId: deactivateDialog.agent.id,
        isActive: !deactivateDialog.agent.isActive
      });
    }
  };

  const confirmDelete = () => {
    if (deleteDialog.agent) {
      deleteUserMutation.mutate(deleteDialog.agent.id);
    }
  };

  // Helper to check if user can manage another user
  const canManage = (targetUser: Agent) => {
    if (currentUser?.role !== 'admin') return false;
    // Admin can manage everyone except themselves (for delete/deactivate self-check is in backend, but good to hide in UI)
    return true;
  };


  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">Chargement...</div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-red-500">Erreur lors du chargement des membres</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Équipe</h1>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Membres
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAgents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Actifs
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAgents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Administrateurs
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminCount}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs defaultValue="all" className="w-[400px]" onValueChange={(v) => setRoleFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="admin">Administrateurs</TabsTrigger>
              <TabsTrigger value="agent">Agents</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full sm:w-[250px]"
              />
            </div>
            <div className="flex items-center border rounded-md bg-background">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-none first:rounded-l-md"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-none last:rounded-r-md"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {currentUser?.role === 'admin' && (
              <Button className="gap-2" onClick={() => setCreateDialog(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {filteredAgents.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={handleEdit}
                  onViewClients={handleViewClients}
                  onDeactivate={handleDeactivate}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Clients assignés</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {agent.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.role === 'admin' ? 'default' : 'secondary'}>
                          {agent.role === 'admin' ? 'Administrateur' : 'Agent'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={agent.isActive ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}
                        >
                          {agent.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{agent.clientCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(agent)}>Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewClients(agent)}>Voir les clients</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeactivate(agent)}
                            >
                              {agent.isActive ? 'Désactiver' : 'Activer'}
                            </DropdownMenuItem>
                            {currentUser?.role === 'admin' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDelete(agent)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Supprimer</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border">
            <UserCog className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun membre trouvé</p>
          </div>
        )}

        {/* Create User Dialog */}
        <CreateUserDialog open={createDialog} onOpenChange={setCreateDialog} />

        {/* Edit User Dialog */}
        <EditUserDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
          user={editDialog.agent}
        />

        {/* Deactivate/Activate Dialog */}
        <Dialog
          open={deactivateDialog.open}
          onOpenChange={(open) => setDeactivateDialog({ open, agent: null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{deactivateDialog.agent?.isActive ? 'Désactiver' : 'Activer'} le compte</DialogTitle>
              <DialogDescription>
                {deactivateDialog.agent?.isActive
                  ? `Êtes-vous sûr de vouloir désactiver le compte de ${deactivateDialog.agent?.name} ?`
                  : `Voulez-vous réactiver le compte de ${deactivateDialog.agent?.name} ?`
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeactivateDialog({ open: false, agent: null })}>
                Annuler
              </Button>
              <Button
                variant={deactivateDialog.agent?.isActive ? "destructive" : "default"}
                onClick={confirmDeactivate}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Traitement...' : 'Confirmer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, agent: null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer le compte</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer définitivement le compte de <b>{deleteDialog.agent?.name}</b> ?
                <br /><br />
                Cette action ne peut pas être annulée. L'utilisateur ne pourra plus se connecter.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, agent: null })}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
};

export default Team;
