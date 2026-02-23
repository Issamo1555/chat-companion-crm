import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Loader2, Users, MessageSquare, Clock, UserPlus, Activity, ArrowUpRight, ArrowDownRight, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import PlatformIcon from '@/components/clients/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#64748b'];

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
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium text-lg animate-pulse">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 max-w-md text-center">
          <p className="text-destructive font-semibold mb-2">Une erreur est survenue</p>
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      </div>
    );
  }

  // Format activity data for charts
  const chartData = stats?.activityByDay.map(day => ({
    name: new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    messages: day.messages,
    clients: day.newClients
  })) || [];

  // Format Status data for Pie chart
  const pieData = [
    { name: 'En cours', value: stats?.inProgressClients || 0 },
    { name: 'Traités', value: stats?.treatedClients || 0 },
    { name: 'Relancés', value: stats?.relaunchedClients || 0 },
    { name: 'Clôturés', value: stats?.closedClients || 0 },
  ].filter(item => item.value > 0); // Hide empty slices

  const sumValues = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue ! Voici l'état actuel de votre activité.</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <div className="bg-primary/10 p-2 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Clients dans la base</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Échangés</CardTitle>
            <div className="bg-blue-500/10 p-2 rounded-full">
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Interactions totales</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Clients</CardTitle>
            <div className="bg-green-500/10 p-2 rounded-full">
              <UserPlus className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newClients || 0}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">En attente de traitement</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-default">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de Réponse</CardTitle>
            <div className="bg-orange-500/10 p-2 rounded-full">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatResponseTime(stats.averageResponseTime) : '0 min'}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Moyenne de réponse</p>
          </CardContent>
        </Card>
      </div>

      {/* New: Channel Connectivity Status */}
      <div className="grid gap-4 md:grid-cols-3">
        {['whatsapp', 'instagram', 'messenger'].map((p) => (
          <Card key={p} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlatformIcon platform={p as any} size={24} />
                <div>
                  <p className="text-sm font-semibold capitalize">{p}</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-[10px] text-muted-foreground">Actif</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-8" asChild>
                <a href="/settings">Gérer</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

        {/* Main Chart */}
        <Card className="col-span-4 lg:col-span-4 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activité des 7 derniers jours</CardTitle>
                <CardDescription>Évolution des messages et de l'acquisition clients</CardDescription>
              </div>
              <div className="bg-primary/10 p-2 rounded-full hidden sm:block">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {chartData.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dx={-10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '13px', fontWeight: 500 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                    <Area type="monotone" name="Messages" dataKey="messages" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMessages)" />
                    <Area type="monotone" name="Nvx Clients" dataKey="clients" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorClients)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                Pas assez de données pour afficher le graphique
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right side widgets */}
        <div className="col-span-4 lg:col-span-3 space-y-6">

          {/* Status Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Répartition des statuts</CardTitle>
            </CardHeader>
            <CardContent>
              {sumValues > 0 ? (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
                  Aucun client actif
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Performance Leaderboard */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Classement Agents</CardTitle>
              <CardDescription>Volume de clients gérés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                {stats?.clientsByAgent.slice(0, 5).map((agent, index) => (
                  <div key={agent.agentName} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold shadow-sm relative">
                        {agent.agentName.charAt(0).toUpperCase()}
                        {index === 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] text-yellow-900 border-2 border-card">1</span>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">{agent.agentName}</p>
                        <p className="text-xs text-muted-foreground">Agent</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-foreground bg-muted px-2 py-1 rounded text-sm">{agent.count}</span>
                    </div>
                  </div>
                ))}
                {(!stats?.clientsByAgent || stats.clientsByAgent.length === 0) && (
                  <div className="bg-muted/30 p-4 rounded-lg text-center text-muted-foreground text-sm border border-dashed">
                    Aucun agent assigné pour le moment
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
