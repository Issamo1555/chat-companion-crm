import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AgentPerformanceProps {
  data: { agentName: string; count: number }[];
}

const AgentPerformance = ({ data }: AgentPerformanceProps) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Clients par agent
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="agentName"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number) => [`${value} clients`, 'Clients']}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--accent))"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AgentPerformance;
