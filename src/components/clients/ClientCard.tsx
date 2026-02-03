import { Client } from '@/types/crm';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Phone, MessageSquare, User } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ClientCardProps {
  client: Client;
}

const ClientCard = ({ client }: ClientCardProps) => {
  const lastMessage = client.messages[client.messages.length - 1];

  return (
    <Link
      to={`/clients/${client.id}`}
      className={cn(
        'block rounded-2xl border border-border bg-card p-5 transition-all duration-200',
        'hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-accent font-semibold">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{client.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {client.phoneNumber}
            </div>
          </div>
        </div>
        <StatusBadge status={client.status} size="sm" />
      </div>

      {/* Tags */}
      {client.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {client.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Last message preview */}
      {lastMessage && (
        <div className="mt-4 rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>
              {lastMessage.direction === 'inbound' ? 'Reçu' : 'Envoyé'}{' '}
              {formatDistanceToNow(lastMessage.timestamp, {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
          <p className="text-sm text-foreground/80 line-clamp-2">
            {lastMessage.content}
          </p>
        </div>
      )}

      {/* Agent */}
      {client.assignedAgent && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Assigné à {client.assignedAgent.name}</span>
        </div>
      )}
    </Link>
  );
};

export default ClientCard;
