import { useMemo, useState, type FormEvent } from 'react';
import dayjs from 'dayjs';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboardStore } from '../store/useDashboardStore';
import { todayISO } from '../utils/dateHelpers';

export default function StartupTracker() {
  const entries = useDashboardStore((s) => s.startupEntries);
  const add = useDashboardStore((s) => s.addStartupEntry);
  const remove = useDashboardStore((s) => s.removeStartupEntry);

  const [date, setDate] = useState(todayISO());
  const [minutes, setMinutes] = useState('');
  const [revenue, setRevenue] = useState('');
  const [tasks, setTasks] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    add({
      date,
      minutesWorked: parseInt(minutes, 10) || 0,
      revenue: parseFloat(revenue) || 0,
      tasksCompleted: parseInt(tasks, 10) || 0,
    });
    setMinutes('');
    setRevenue('');
    setTasks('');
  }

  const chartData = useMemo(
    () =>
      [...entries]
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .slice(-30)
        .map((e) => ({
          date: dayjs(e.date).format('MMM D'),
          Hours: +(e.minutesWorked / 60).toFixed(2),
          Revenue: e.revenue,
          Tasks: e.tasksCompleted,
        })),
    [entries],
  );

  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({
          minutes: acc.minutes + e.minutesWorked,
          revenue: acc.revenue + e.revenue,
          tasks: acc.tasks + e.tasksCompleted,
        }),
        { minutes: 0, revenue: 0, tasks: 0 },
      ),
    [entries],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Startup Tracker</h2>
        <p className="mt-1 text-sm text-mute">
          Log daily focus time, revenue, and tasks for your side project or startup.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          label="Total hours"
          value={(totals.minutes / 60).toFixed(1)}
          suffix="hrs"
        />
        <StatCard
          label="Total revenue"
          value={`$${totals.revenue.toFixed(2)}`}
        />
        <StatCard
          label="Tasks completed"
          value={totals.tasks}
        />
      </div>

      <form onSubmit={onSubmit} className="card">
        <h3 className="mb-3 text-sm font-semibold text-white">Log today's work</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
              max={todayISO()}
            />
          </div>
          <div>
            <label className="label">Minutes worked</label>
            <input
              type="number"
              min={0}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="input"
              placeholder="120"
            />
          </div>
          <div>
            <label className="label">Revenue ($)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              className="input"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label">Tasks completed</label>
            <input
              type="number"
              min={0}
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="submit" className="btn-primary">
            Save entry
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-white">Focus time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="focus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#141414',
                    border: '1px solid #2A2A2A',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Hours"
                  stroke="#8B5CF6"
                  fill="url(#focus)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-white">Revenue & tasks</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#141414',
                    border: '1px solid #2A2A2A',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="Revenue" fill="#22C55E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Tasks" fill="#EAB308" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Recent entries</h3>
          <span className="text-xs text-mute">{entries.length} entries</span>
        </div>
        {entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-mute">
            No entries yet. Log today's work above to get started.
          </div>
        ) : (
          <div className="divide-y divide-card-border">
            {entries.slice(0, 20).map((e) => (
              <div key={e.date} className="flex items-center gap-3 px-4 py-3">
                <div className="w-24 text-sm text-mute-light">
                  {dayjs(e.date).format('MMM D, YYYY')}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-3 text-sm">
                  <span>
                    <span className="text-mute">Hours </span>
                    <span className="text-white">{(e.minutesWorked / 60).toFixed(1)}</span>
                  </span>
                  <span>
                    <span className="text-mute">Revenue </span>
                    <span className="text-white">${e.revenue.toFixed(2)}</span>
                  </span>
                  <span>
                    <span className="text-mute">Tasks </span>
                    <span className="text-white">{e.tasksCompleted}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(e.date)}
                  className="btn-ghost"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
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
