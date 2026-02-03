import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'accent';
}

const StatCard = ({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-lg',
        variant === 'accent'
          ? 'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground'
          : 'bg-card border border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              variant === 'accent' ? 'text-accent-foreground/80' : 'text-muted-foreground'
            )}
          >
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-2 text-sm font-medium',
                trend.isPositive
                  ? variant === 'accent'
                    ? 'text-accent-foreground/90'
                    : 'text-status-treated'
                  : 'text-destructive'
              )}
            >
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% ce mois
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            variant === 'accent'
              ? 'bg-accent-foreground/20'
              : 'bg-primary/10'
          )}
        >
          <Icon
            className={cn(
              'h-6 w-6',
              variant === 'accent' ? 'text-accent-foreground' : 'text-primary'
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
