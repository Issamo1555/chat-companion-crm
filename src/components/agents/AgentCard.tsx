import { Agent } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import AgentStatusBadge from './AgentStatusBadge';
import { Button } from '@/components/ui/button';
import { Users, Mail, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onViewClients?: (agent: Agent) => void;
  onDeactivate?: (agent: Agent) => void;
  onViewBreaks?: (agent: Agent) => void;
}

const AgentCard = ({ agent, onEdit, onViewClients, onDeactivate, onViewBreaks }: AgentCardProps) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-lg">
            {agent.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {agent.email}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(agent)}>
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewClients?.(agent)}>
              Voir les clients
            </DropdownMenuItem>
            {onViewBreaks && (
              <DropdownMenuItem onClick={() => onViewBreaks(agent)}>
                Historique des pauses
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDeactivate?.(agent)}
            >
              {agent.isActive ? 'Désactiver' : 'Activer'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={agent.role === 'admin' ? 'default' : 'secondary'}>
            {agent.role === 'admin' ? 'Administrateur' : 'Agent'}
          </Badge>
          <AgentStatusBadge agent={agent} />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{agent.clientCount} clients</span>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
