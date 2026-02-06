import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Loader2 } from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  newClients: number;
  inProgressClients: number;
  treatedClients: number;
  relaunchedClients: number;
  closedClients: number;
  totalMessages: number;
  averageResponseTime: number;
  clientsByAgent: { agentName: string; count: number }[];
  clientsByStatus: { status: string; count: number }[];
  activityByDay: { date: string; messages: number; newClients: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Impossible de charger les statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue dans votre CRM WhatsApp</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Clients</h3>
          <p className="text-2xl font-bold">{stats?.totalClients || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Messages</h3>
          <p className="text-2xl font-bold">{stats?.totalMessages || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Nouveaux Clients</h3>
          <p className="text-2xl font-bold">{stats?.newClients || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">En cours</h3>
          <p className="text-2xl font-bold">{stats?.inProgressClients || 0}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Clients par statut</h2>
          <div className="space-y-2">
            {stats?.clientsByStatus.map((item) => (
              <div key={item.status} className="flex justify-between items-center">
                <span className="text-sm capitalize">{item.status.replace('_', ' ')}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Clients par agent</h2>
          <div className="space-y-2">
            {stats?.clientsByAgent.map((item) => (
              <div key={item.agentName} className="flex justify-between items-center">
                <span className="text-sm">{item.agentName}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Activité récente (7 derniers jours)</h2>
        {stats?.activityByDay && stats.activityByDay.length > 0 ? (
          <div className="space-y-2">
            {stats.activityByDay.map((day) => (
              <div key={day.date} className="flex justify-between items-center text-sm">
                <span>{new Date(day.date).toLocaleDateString('fr-FR')}</span>
                <div className="flex gap-4">
                  <span className="text-muted-foreground">{day.messages} messages</span>
                  <span className="text-muted-foreground">{day.newClients} nouveaux clients</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune activité récente</p>
        )}
      </div>
    </div>
  );
}
