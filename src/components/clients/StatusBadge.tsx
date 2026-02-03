import { cn } from '@/lib/utils';
import { ClientStatus, STATUS_LABELS } from '@/types/crm';

interface StatusBadgeProps {
  status: ClientStatus;
  size?: 'sm' | 'md';
}

const statusStyles: Record<ClientStatus, string> = {
  new: 'bg-status-new/15 text-status-new border-status-new/30',
  in_progress: 'bg-status-in-progress/15 text-status-in-progress border-status-in-progress/30',
  treated: 'bg-status-treated/15 text-status-treated border-status-treated/30',
  relaunched: 'bg-status-relaunched/15 text-status-relaunched border-status-relaunched/30',
  closed: 'bg-status-closed/15 text-status-closed border-status-closed/30',
};

const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        statusStyles[status],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      <span
        className={cn(
          'mr-1.5 rounded-full',
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
          status === 'new' && 'bg-status-new',
          status === 'in_progress' && 'bg-status-in-progress',
          status === 'treated' && 'bg-status-treated',
          status === 'relaunched' && 'bg-status-relaunched',
          status === 'closed' && 'bg-status-closed'
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
};

export default StatusBadge;
