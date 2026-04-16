import { Cell, Pie, PieChart, Tooltip } from 'recharts';

interface PieChartCardProps {
  title: string;
  subtitle?: string;
  green: number;
  yellow: number;
  red: number;
}

const STATUS_COLORS = {
  Completed: '#22C55E',
  Partial: '#EAB308',
  Remaining: '#EF4444',
};

export function PieChartCard({
  title,
  subtitle,
  green,
  yellow,
  red,
}: PieChartCardProps) {
  const total = green + yellow + red;
  const pct = total > 0 ? Math.round((green / total) * 100) : 0;

  const data = [
    { name: 'Completed', value: green },
    { name: 'Partial', value: yellow },
    { name: 'Remaining', value: red },
  ].filter((d) => d.value > 0);

  return (
    <div className="card">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-mute">{subtitle}</p>
          )}
        </div>
        <span className="text-xs text-mute">{total} items</span>
      </div>
      <div className="relative flex h-[250px] w-full items-center justify-center">
        <PieChart width={260} height={250}>
          <Pie
            data={data.length ? data : [{ name: 'Empty', value: 1 }]}
            innerRadius={55}
            outerRadius={80}
            paddingAngle={data.length > 1 ? 2 : 0}
            dataKey="value"
            stroke="#1A1A1A"
            strokeWidth={2}
          >
            {data.length
              ? data.map((d) => (
                  <Cell
                    key={d.name}
                    fill={STATUS_COLORS[d.name as keyof typeof STATUS_COLORS]}
                  />
                ))
              : [<Cell key="empty" fill="#2A2A2A" />]}
          </Pie>
          {data.length > 0 && (
            <Tooltip
              contentStyle={{
                background: '#141414',
                border: '1px solid #2A2A2A',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [String(value), String(name)]}
            />
          )}
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-white">{pct}%</div>
          <div className="text-[10px] uppercase tracking-wider text-mute">
            Complete
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-around text-xs">
        <Legend color={STATUS_COLORS.Completed} label="Done" value={green} />
        <Legend color={STATUS_COLORS.Partial} label="Partial" value={yellow} />
        <Legend color={STATUS_COLORS.Remaining} label="Remaining" value={red} />
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-mute">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
