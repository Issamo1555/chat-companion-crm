import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ActivityChartProps {
  data: { date: string; messages: number; newClients: number }[];
}

const ActivityChart = ({ data }: ActivityChartProps) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Activité des 7 derniers jours
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
              }}
            />
            <Area
              type="monotone"
              dataKey="messages"
              name="Messages"
              stroke="hsl(142, 70%, 45%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMessages)"
            />
            <Area
              type="monotone"
              dataKey="newClients"
              name="Nouveaux clients"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClients)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityChart;
