import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ClientStatus, STATUS_LABELS } from '@/types/crm';

interface StatusChartProps {
  data: { status: ClientStatus; count: number }[];
}

const COLORS: Record<ClientStatus, string> = {
  new: 'hsl(217, 91%, 60%)',
  in_progress: 'hsl(38, 92%, 50%)',
  treated: 'hsl(142, 71%, 45%)',
  relaunched: 'hsl(262, 83%, 58%)',
  closed: 'hsl(215, 14%, 45%)',
};

const StatusChart = ({ data }: StatusChartProps) => {
  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status],
    value: item.count,
    color: COLORS[item.status],
  }));

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Répartition par statut
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number) => [`${value} clients`, '']}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatusChart;
