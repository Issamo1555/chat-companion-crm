import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Loader2, Users, MessageSquare, Clock, UserPlus, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  totalClients: number;
  newClients: number;
  inProgressClients: number;
  treatedClients: number;
  relaunchedClients: number;
  closedClients: number;
  totalMessages: number;
  averageResponseTime: number; // in minutes
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

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

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
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de votre activité CRM</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">Base de données active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Échangés</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">Total interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de Réponse</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatResponseTime(stats.averageResponseTime) : '0 min'}
            </div>
            <p className="text-xs text-muted-foreground">Moyenne globale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Clients</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newClients || 0}</div>
            <p className="text-xs text-muted-foreground">En attente de traitement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 grid gap-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>État des Demandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground mb-1">En cours</span>
                  <span className="text-2xl font-bold text-blue-600">{stats?.inProgressClients || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground mb-1">Traités</span>
                  <span className="text-2xl font-bold text-green-600">{stats?.treatedClients || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground mb-1">Relancés</span>
                  <span className="text-2xl font-bold text-orange-600">{stats?.relaunchedClients || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground mb-1">Clôturés</span>
                  <span className="text-2xl font-bold text-slate-600">{stats?.closedClients || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.activityByDay && stats.activityByDay.length > 0 ? (
                <div className="space-y-4">
                  {stats.activityByDay.map((day) => (
                    <div key={day.date} className="flex items-center">
                      <div className="w-24 text-sm text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center text-sm">
                          <MessageSquare className="mr-2 h-3 w-3 text-blue-500" />
                          <span className="font-medium">{day.messages}</span>
                          <span className="ml-1 text-muted-foreground">messages</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <UserPlus className="mr-2 h-3 w-3 text-green-500" />
                          <span className="font-medium">{day.newClients}</span>
                          <span className="ml-1 text-muted-foreground">nouveaux clients</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  Aucune activité récente
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Performance Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.clientsByAgent.map((agent) => (
                <div key={agent.agentName} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-xs font-medium text-primary">
                        {agent.agentName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{agent.agentName}</p>
                      <p className="text-xs text-muted-foreground">Agent</p>
                    </div>
                  </div>
                  <div className="font-medium">{agent.count} clients</div>
                </div>
              ))}
              {(!stats?.clientsByAgent || stats.clientsByAgent.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun agent assigné</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
