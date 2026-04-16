import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useGoals } from '../hooks/useGoals';
import { useGoalEntries, computeStatus } from '../hooks/useGoalEntries';
import { useReflections } from '../hooks/useReflections';
import {
  daysInRange,
  endOfWeekISO,
  startOfWeekISO,
  weekLabel,
  formatDate,
} from '../utils/dateHelpers';

export default function WeeklyReview() {
  const [cursor, setCursor] = useState<string>(formatDate(new Date()));
  const weekStart = startOfWeekISO(cursor);
  const weekEnd = endOfWeekISO(cursor);

  const { goals } = useGoals();
  const { entries } = useGoalEntries({ from: weekStart, to: weekEnd });
  const { reflection, save } = useReflections('weekly', weekStart);

  const [draft, setDraft] = useState<string>('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(reflection?.content ?? '');
    setSaved(false);
  }, [reflection]);

  const chartData = useMemo(() => {
    const days = daysInRange(weekStart, weekEnd);
    const dailyGoals = goals.filter(
      (g) => g.frequency === 'daily' && !g.is_archived,
    );
    return days.map((d) => {
      let green = 0;
      let yellow = 0;
      let red = 0;
      for (const g of dailyGoals) {
        const e = entries.find((x) => x.goal_id === g.id && x.date === d);
        const status = e ? e.status : computeStatus(g, 0);
        if (status === 'green') green++;
        else if (status === 'yellow') yellow++;
        else red++;
      }
      return {
        date: dayjs(d).format('ddd'),
        fullDate: d,
        Done: green,
        Partial: yellow,
        Missed: red,
      };
    });
  }, [goals, entries, weekStart, weekEnd]);

  const totals = useMemo(() => {
    let g = 0, y = 0, r = 0;
    for (const row of chartData) {
      g += row.Done;
      y += row.Partial;
      r += row.Missed;
    }
    const t = g + y + r;
    return {
      green: g,
      yellow: y,
      red: r,
      total: t,
      pct: t > 0 ? Math.round((g / t) * 100) : 0,
    };
  }, [chartData]);

  async function handleSave() {
    await save(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Weekly Review</h2>
          <p className="mt-1 text-sm text-mute">{weekLabel(cursor)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline"
            onClick={() => setCursor(dayjs(cursor).subtract(1, 'week').format('YYYY-MM-DD'))}
          >
            ← Previous
          </button>
          <input
            type="date"
            value={cursor}
            onChange={(e) => setCursor(e.target.value)}
            className="input w-auto"
          />
          <button
            type="button"
            className="btn-outline"
            onClick={() => setCursor(dayjs(cursor).add(1, 'week').format('YYYY-MM-DD'))}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Completion" value={`${totals.pct}%`} accent="text-status-green" />
        <StatCard label="Done" value={totals.green} accent="text-status-green" />
        <StatCard label="Partial" value={totals.yellow} accent="text-status-yellow" />
        <StatCard label="Missed" value={totals.red} accent="text-status-red" />
      </div>

      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-white">Daily breakdown</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#141414',
                  border: '1px solid #2A2A2A',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="Done" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Partial" stackId="a" fill="#EAB308" />
              <Bar dataKey="Missed" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Weekly reflection</h3>
          {saved && <span className="text-xs text-status-green">Saved ✓</span>}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          className="input resize-none"
          placeholder="What went well this week? What could be improved? What are you proud of?"
        />
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={handleSave} className="btn-primary">
            Save reflection
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-mute">{label}</div>
      <div className={['mt-1 text-2xl font-semibold', accent].join(' ')}>{value}</div>
    </div>
  );
}
