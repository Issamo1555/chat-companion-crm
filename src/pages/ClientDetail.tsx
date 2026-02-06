import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ChatWindow from '@/components/chat/ChatWindow';
import StatusBadge from '@/components/clients/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Phone,
  Calendar,
  User,
  Tag,
  FileText,
  History,
  Edit2,
  Save,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { ClientStatus, STATUS_LABELS } from '@/types/crm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

// We need to fetch agents too for the dropdown, assume we duplicate the hook or pull from cache
// For now, let's just fetch everything or leave agents mocked if we didn't implement getAgents fully in hooks yet.
// Actually api.getAgents exists.

const ClientDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: api.getClients,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  });

  // In a real app we might fetch just one client by ID, but since we have getClients which fetches all with details...
  const client = clients.find((c) => c.id === id);

  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Sync state when client loads
  useEffect(() => {
    if (client) {
      setNotes(client.notes || '');
    }
  }, [client]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!id) return;
      return api.sendMessage(id, content, 'outbound');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: ClientStatus) => {
      if (!id) return;
      return api.updateClientStatus(id, status, 'Status update from detail page', '1'); // '1' is hardcoded user id for now
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!client) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Client non trouvé
          </h1>
          <Link to="/clients">
            <Button variant="outline">Retour à la liste</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  const handleStatusChange = (value: ClientStatus) => {
    updateStatusMutation.mutate(value);
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {client.name}
              </h1>
              <StatusBadge status={client.status} />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Phone className="h-4 w-4" />
              <span>{client.phoneNumber}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chat Section */}
          <div className="lg:col-span-2 h-[600px]">
            <ChatWindow client={client} onSendMessage={handleSendMessage} />
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {/* Status */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Statut
                  </label>
                  <Select defaultValue={client.status} onValueChange={(val) => handleStatusChange(val as ClientStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assigned Agent */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Agent assigné
                  </label>
                  <Select defaultValue={client.assignedAgentId}>
                    <SelectTrigger>
                      <User className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium text-muted-foreground">
                      Tags
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {client.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-secondary px-2 py-1 text-sm font-medium text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    <Button variant="outline" size="sm" className="h-7">
                      + Ajouter
                    </Button>
                  </div>
                </div>

                {/* Created/Updated */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Créé le</span>
                    <span className="font-medium">
                      {format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mis à jour le</span>
                    <span className="font-medium">
                      {format(new Date(client.updatedAt), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <label className="text-sm font-medium text-muted-foreground">
                        Notes internes
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (isEditingNotes) {
                          // Save notes logic would go here
                          console.log('Saving notes:', notes);
                        }
                        setIsEditingNotes(!isEditingNotes);
                      }}
                    >
                      {isEditingNotes ? (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Sauvegarder
                        </>
                      ) : (
                        <>
                          <Edit2 className="h-4 w-4 mr-1" />
                          Modifier
                        </>
                      )}
                    </Button>
                  </div>
                  {isEditingNotes ? (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[150px] resize-none"
                      placeholder="Ajoutez des notes..."
                    />
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {notes || 'Aucune note'}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium text-muted-foreground">
                      Historique des statuts
                    </label>
                  </div>
                  <div className="space-y-3">
                    {client.statusHistory && client.statusHistory.length > 0 ? (
                      client.statusHistory.map((change) => (
                        <div
                          key={change.id}
                          className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                        >
                          <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {STATUS_LABELS[change.toStatus]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Par {change.changedBy || 'Système'} •{' '}
                              {format(new Date(change.changedAt), 'dd/MM/yyyy HH:mm', {
                                locale: fr,
                              })}
                            </p>
                            {change.note && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {change.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucun changement de statut
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientDetail;
