import { useMemo } from 'react';
import dayjs from 'dayjs';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useGoals } from '../hooks/useGoals';
import { useGoalEntries, computeStatus } from '../hooks/useGoalEntries';
import { lastNDays } from '../utils/dateHelpers';

export default function Metrics() {
  const windowDays = 60;
  const to = dayjs().format('YYYY-MM-DD');
  const from = dayjs().subtract(windowDays - 1, 'day').format('YYYY-MM-DD');

  const { goals } = useGoals();
  const { entries } = useGoalEntries({ from, to });

  const data = useMemo(() => {
    const days = lastNDays(windowDays);
    const dailyGoals = goals.filter((g) => g.frequency === 'daily' && !g.is_archived);

    return days.map((d) => {
      if (dailyGoals.length === 0) {
        return { date: d, label: dayjs(d).format('MMM D'), completion: 0, completed: 0, total: 0 };
      }
      let green = 0;
      for (const g of dailyGoals) {
        const e = entries.find((x) => x.goal_id === g.id && x.date === d);
        const status = e ? e.status : computeStatus(g, 0);
        if (status === 'green') green++;
      }
      return {
        date: d,
        label: dayjs(d).format('MMM D'),
        completion: Math.round((green / dailyGoals.length) * 100),
        completed: green,
        total: dailyGoals.length,
      };
    });
  }, [goals, entries]);

  const metrics = useMemo(() => {
    const totalDaysTracked = data.filter((d) => d.completed > 0).length;
    const totalCompletion =
      data.length > 0
        ? Math.round(data.reduce((a, d) => a + d.completion, 0) / data.length)
        : 0;

    // Streak: consecutive days ending today where completion == 100%.
    let currentStreak = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].total > 0 && data[i].completion === 100) currentStreak++;
      else break;
    }

    let longest = 0;
    let run = 0;
    for (const d of data) {
      if (d.total > 0 && d.completion === 100) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    }

    return { totalDaysTracked, totalCompletion, currentStreak, longest };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Metrics</h2>
        <p className="mt-1 text-sm text-mute">
          Last {windowDays} days · trends and streaks for daily goals
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Current streak" value={metrics.currentStreak} suffix="days" />
        <MetricCard label="Longest streak" value={metrics.longest} suffix="days" />
        <MetricCard label="Days tracked" value={metrics.totalDaysTracked} suffix="days" />
        <MetricCard label="Avg completion" value={`${metrics.totalCompletion}%`} />
      </div>

      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-white">Completion trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#22C55E" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis
                dataKey="label"
                stroke="#6B7280"
                fontSize={11}
                interval={Math.max(1, Math.floor(data.length / 12))}
              />
              <YAxis stroke="#6B7280" fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{
                  background: '#141414',
                  border: '1px solid #2A2A2A',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => [`${value}%`, 'Completion']}
              />
              <Line
                type="monotone"
                dataKey="completion"
                stroke="url(#gradLine)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-mute">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-white">{value}</span>
        {suffix && <span className="text-xs text-mute">{suffix}</span>}
      </div>
    </div>
  );
}
