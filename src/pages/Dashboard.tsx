import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import StatusChart from '@/components/dashboard/StatusChart';
import ActivityChart from '@/components/dashboard/ActivityChart';
import AgentPerformance from '@/components/dashboard/AgentPerformance';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { mockDashboardStats, mockActionLogs } from '@/data/mockData';
import { Users, MessageSquare, Clock, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const stats = mockDashboardStats;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre activité CRM
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total clients"
            value={stats.totalClients}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            variant="accent"
          />
          <StatCard
            title="Messages ce mois"
            value={stats.totalMessages}
            icon={MessageSquare}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Temps de réponse moyen"
            value={`${stats.averageResponseTime}min`}
            icon={Clock}
            trend={{ value: 15, isPositive: false }}
          />
          <StatCard
            title="Nouveaux clients"
            value={stats.newClients}
            icon={TrendingUp}
            trend={{ value: 23, isPositive: true }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityChart data={stats.activityByDay} />
          </div>
          <StatusChart data={stats.clientsByStatus} />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AgentPerformance data={stats.clientsByAgent} />
          <RecentActivity logs={mockActionLogs} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
