import { ActionLog } from '@/types/crm';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserCircle, MessageSquare, RefreshCw, ArrowRightLeft } from 'lucide-react';

interface RecentActivityProps {
  logs: ActionLog[];
}

const getActionIcon = (entityType: ActionLog['entityType']) => {
  switch (entityType) {
    case 'client':
      return UserCircle;
    case 'message':
      return MessageSquare;
    case 'status':
      return RefreshCw;
    default:
      return ArrowRightLeft;
  }
};

const RecentActivity = ({ logs }: RecentActivityProps) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Activité récente
      </h3>
      <div className="space-y-4">
        {logs.map((log) => {
          const Icon = getActionIcon(log.entityType);
          return (
            <div
              key={log.id}
              className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {log.userName}
                </p>
                <p className="text-sm text-muted-foreground">{log.action}</p>
                {log.details && (
                  <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">
                    {log.details}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(log.timestamp, { addSuffix: true, locale: fr })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
