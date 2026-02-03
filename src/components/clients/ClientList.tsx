import { useState, useMemo } from 'react';
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
import { Search, Filter, Plus } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
}

const ClientList = ({ clients }: ClientListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.phoneNumber.includes(search);
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const statusCounts = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {} as Record<ClientStatus, number>);
  }, [clients]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">{clients.length} clients au total</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau client
        </Button>
      </div>

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
          onValueChange={(value) => setStatusFilter(value as ClientStatus | 'all')}
        >
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrer par statut" />
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
      </div>

      {/* Client Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
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
