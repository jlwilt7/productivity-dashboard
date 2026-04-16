import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useGoals } from '../hooks/useGoals';
import { useGoalEntries, computeStatus } from '../hooks/useGoalEntries';
import { useReflections } from '../hooks/useReflections';
import {
  endOfMonthISO,
  monthLabel,
  startOfMonthISO,
  formatDate,
} from '../utils/dateHelpers';

export default function MonthlyReview() {
  const [cursor, setCursor] = useState(formatDate(new Date()));
  const monthStart = startOfMonthISO(cursor);
  const monthEnd = endOfMonthISO(cursor);

  const { goals } = useGoals();
  const { entries } = useGoalEntries({ from: monthStart, to: monthEnd });
  const { reflection, save } = useReflections('monthly', monthStart);

  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(reflection?.content ?? '');
    setSaved(false);
  }, [reflection]);

  const stats = useMemo(() => {
    const dailyGoals = goals.filter(
      (g) => g.frequency === 'daily' && !g.is_archived,
    );

    const byDate = new Map<string, { g: number; y: number; r: number; total: number }>();
    const start = dayjs(monthStart);
    const end = dayjs(monthEnd);
    for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
      byDate.set(d.format('YYYY-MM-DD'), { g: 0, y: 0, r: 0, total: 0 });
    }

    for (const g of dailyGoals) {
      for (const [date, bucket] of byDate) {
        const e = entries.find((x) => x.goal_id === g.id && x.date === date);
        const status = e ? e.status : computeStatus(g, 0);
        bucket.total++;
        if (status === 'green') bucket.g++;
        else if (status === 'yellow') bucket.y++;
        else bucket.r++;
      }
    }

    return byDate;
  }, [goals, entries, monthStart, monthEnd]);

  const totals = useMemo(() => {
    let g = 0, y = 0, r = 0;
    for (const b of stats.values()) {
      g += b.g;
      y += b.y;
      r += b.r;
    }
    const t = g + y + r;
    return { g, y, r, t, pct: t > 0 ? Math.round((g / t) * 100) : 0 };
  }, [stats]);

  async function handleSave() {
    await save(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Monthly Review</h2>
          <p className="mt-1 text-sm text-mute">{monthLabel(cursor)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline"
            onClick={() => setCursor(dayjs(cursor).subtract(1, 'month').format('YYYY-MM-DD'))}
          >
            ← Previous
          </button>
          <input
            type="month"
            value={dayjs(cursor).format('YYYY-MM')}
            onChange={(e) => setCursor(`${e.target.value}-01`)}
            className="input w-auto"
          />
          <button
            type="button"
            className="btn-outline"
            onClick={() => setCursor(dayjs(cursor).add(1, 'month').format('YYYY-MM-DD'))}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Completion" value={`${totals.pct}%`} accent="text-status-green" />
        <StatCard label="Done" value={totals.g} accent="text-status-green" />
        <StatCard label="Partial" value={totals.y} accent="text-status-yellow" />
        <StatCard label="Missed" value={totals.r} accent="text-status-red" />
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Heatmap</h3>
          <div className="flex items-center gap-2 text-[11px] text-mute">
            <LegendDot color="#1F2937" /> None
            <LegendDot color="#15803D" /> Low
            <LegendDot color="#22C55E" /> Mid
            <LegendDot color="#86EFAC" /> High
          </div>
        </div>
        <Heatmap monthStart={monthStart} stats={stats} />
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Monthly reflection</h3>
          {saved && <span className="text-xs text-status-green">Saved ✓</span>}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          className="input resize-none"
          placeholder="What are the biggest wins this month? What would you do differently? What's next?"
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

function LegendDot({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: color }} />;
}

function heatColor(pct: number): string {
  if (pct <= 0) return '#1F2937';
  if (pct < 34) return '#15803D';
  if (pct < 67) return '#22C55E';
  return '#86EFAC';
}

function Heatmap({
  monthStart,
  stats,
}: {
  monthStart: string;
  stats: Map<string, { g: number; y: number; r: number; total: number }>;
}) {
  const start = dayjs(monthStart).startOf('isoWeek');
  const end = dayjs(monthStart).endOf('month').endOf('isoWeek');
  const days: { date: string; inMonth: boolean }[] = [];
  for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
    days.push({
      date: d.format('YYYY-MM-DD'),
      inMonth: d.month() === dayjs(monthStart).month(),
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-mute">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const bucket = stats.get(d.date);
          const pct = bucket && bucket.total > 0 ? (bucket.g / bucket.total) * 100 : 0;
          return (
            <div
              key={d.date}
              title={`${d.date} — ${Math.round(pct)}% complete`}
              className="aspect-square rounded"
              style={{
                background: d.inMonth ? heatColor(pct) : 'transparent',
                border: d.inMonth ? 'none' : '1px dashed #2A2A2A',
                opacity: d.inMonth ? 1 : 0.35,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
