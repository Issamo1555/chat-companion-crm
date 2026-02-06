import MainLayout from '@/components/layout/MainLayout';
import AgentCard from '@/components/agents/AgentCard';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, UserCog } from 'lucide-react';
import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

const Team = () => {
  const [search, setSearch] = useState('');

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: api.getAgents,
  });

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.email.toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Équipe</h1>
            <p className="text-muted-foreground">
              Gérez votre équipe de {agents.length} membres
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau membre
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Agents Grid */}
        {filteredAgents.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border">
            <UserCog className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun membre trouvé</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Team;
