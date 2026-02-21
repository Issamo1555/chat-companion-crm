import { useState, useMemo, useEffect } from 'react';
import { Client, ClientStatus, STATUS_LABELS } from '@/types/crm';
import ClientCard from './ClientCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Plus, LayoutGrid, Table as TableIcon, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import InlineStatusSelect from './InlineStatusSelect';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import PlatformIcon from './PlatformIcon';
import { NewClientDialog } from './NewClientDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import SmartListTabs from './SmartListTabs';
import SmartListSaveDialog from './SmartListSaveDialog';
import { toast } from 'sonner';

interface ClientListProps {
  clients: Client[];
  agentId?: string;
}

const ClientList = ({ clients, agentId }: ClientListProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Fetch Smart Lists
  const { data: smartLists = [] } = useQuery({
    queryKey: ['smart-lists'],
    queryFn: api.getSmartLists,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteSmartList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
      toast.success('Liste supprimée');
      if (activeListId) setActiveListId(null);
    }
  });

  // Apply Smart List filters
  useEffect(() => {
    if (activeListId) {
      const list = smartLists.find(l => l.id === activeListId);
      if (list) {
        const filters = JSON.parse(list.filters);
        if (filters.status) setStatusFilter(filters.status);
        if (filters.platform) setPlatformFilter(filters.platform);
        if (filters.search !== undefined) setSearch(filters.search);
      }
    }
  }, [activeListId, smartLists]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        (client.phoneNumber && client.phoneNumber.includes(search)) ||
        client.platformId.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesPlatform = platformFilter === 'all' || client.platform === platformFilter;
      const matchesAgent = !agentId || client.assignedAgentId === agentId;
      return matchesSearch && matchesStatus && matchesPlatform && matchesAgent;
    });
  }, [clients, search, statusFilter, platformFilter, agentId]);

  const statusCounts = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<ClientStatus, number>);
  }, [clients]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">{clients.length} clients au total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-md p-1 bg-card">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
          <NewClientDialog>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau client
            </Button>
          </NewClientDialog>
        </div>
      </div>

      <SmartListTabs
        lists={smartLists.map((l: any) => ({ id: l.id, name: l.name, filters: JSON.parse(l.filters) }))}
        activeListId={activeListId}
        onListSelect={setActiveListId}
        onListDelete={(id) => deleteMutation.mutate(id)}
        onSaveNew={() => setIsSaveDialogOpen(true)}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as ClientStatus | 'all');
            setActiveListId(null); // Reset active list if manual change
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label} ({statusCounts[value as ClientStatus] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={platformFilter}
          onValueChange={(value) => {
            setPlatformFilter(value);
            setActiveListId(null);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Plateforme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="messenger">Messenger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SmartListSaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['smart-lists'] })}
        currentFilters={{ status: statusFilter, platform: platformFilter, search }}
      />

      {/* Client List */}
      {filteredClients.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table className="whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Client</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Email</TableHead>
                  <TableHead className="text-center">Entreprise</TableHead>
                  <TableHead className="text-center">Source</TableHead>
                  <TableHead className="text-center">Dernière activité</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-accent font-semibold text-sm">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{client.name}</div>
                            <PlatformIcon platform={client.platform} size={14} />
                          </div>
                          <div className="text-xs text-muted-foreground">{client.phoneNumber || client.platformId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <InlineStatusSelect clientId={client.id} currentStatus={client.status} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {client.email || '-'}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {client.company || '-'}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {client.source || '-'}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {client.lastMessageAt ? (
                        formatDistanceToNow(new Date(client.lastMessageAt), { addSuffix: true, locale: fr })
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Link to={`/clients/${client.id}`}>
                        <Button variant="ghost" size="sm">
                          Voir
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground">
            Aucun client ne correspond à votre recherche
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientList;
