import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { Checklist } from '../components/Checklist';
import { PieChartCard } from '../components/PieChartCard';
import { WidgetContainer } from '../components/WidgetContainer';
import { useDashboardStore } from '../store/useDashboardStore';
import { useLayout } from '../hooks/useLayout';
import { useGoals } from '../hooks/useGoals';
import { useGoalEntries, computeStatus } from '../hooks/useGoalEntries';
import {
  endOfMonthISO,
  endOfWeekISO,
  formatPretty,
  startOfMonthISO,
  startOfWeekISO,
} from '../utils/dateHelpers';
import type { WidgetConfig } from '../types/database';

function useCompletionStats(
  goalsFreq: 'daily' | 'weekly' | 'monthly',
  from: string,
  to: string,
) {
  const { goals } = useGoals();
  const { entries } = useGoalEntries({ from, to });

  return useMemo(() => {
    const targeted = goals.filter(
      (g) => g.frequency === goalsFreq && !g.is_archived,
    );

    let green = 0;
    let yellow = 0;
    let red = 0;

    if (goalsFreq === 'daily') {
      // For daily goals, evaluate each (goal, date) pair in the range.
      const days = daysBetween(from, to);
      for (const g of targeted) {
        for (const d of days) {
          const e = entries.find((x) => x.goal_id === g.id && x.date === d);
          const status = e ? e.status : computeStatus(g, 0);
          if (status === 'green') green++;
          else if (status === 'yellow') yellow++;
          else red++;
        }
      }
    } else {
      // For weekly/monthly goals, aggregate all entries for each goal over
      // the range into one computed status per goal.
      for (const g of targeted) {
        const sum = entries
          .filter((e) => e.goal_id === g.id)
          .reduce((acc, e) => acc + e.value, 0);
        const status = computeStatus(g, sum);
        if (status === 'green') green++;
        else if (status === 'yellow') yellow++;
        else red++;
      }
    }

    return { green, yellow, red };
  }, [goals, entries, goalsFreq, from, to]);
}

function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(from);
  const end = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function Dashboard() {
  const selectedDate = useDashboardStore((s) => s.selectedDate);
  const { layout, saveLayout } = useLayout();
  const [editing, setEditing] = useState(false);

  const daily = useCompletionStats('daily', selectedDate, selectedDate);
  const weekly = useCompletionStats(
    'daily',
    startOfWeekISO(selectedDate),
    endOfWeekISO(selectedDate),
  );
  const monthly = useCompletionStats(
    'daily',
    startOfMonthISO(selectedDate),
    endOfMonthISO(selectedDate),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const widgets = useMemo(
    () => [...layout.widgets].sort((a, b) => a.position - b.position),
    [layout],
  );
  const visibleWidgets = widgets.filter((w) => w.visible);
  const hiddenWidgets = widgets.filter((w) => !w.visible);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = visibleWidgets.map((w) => w.id);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    const reorderedVisible = arrayMove(visibleWidgets, oldIdx, newIdx);
    // Keep hidden widgets appended after visible ones.
    const next = [...reorderedVisible, ...hiddenWidgets].map((w, idx) => ({
      ...w,
      position: idx,
    }));
    void saveLayout({ widgets: next });
  }

  function toggle(widget: WidgetConfig) {
    const next = layout.widgets.map((w) =>
      w.id === widget.id ? { ...w, visible: !w.visible } : w,
    );
    void saveLayout({ widgets: next });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-mute">{formatPretty(selectedDate)}</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            Today's plan
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={editing ? 'btn-primary' : 'btn-outline'}
          >
            {editing ? 'Done editing' : 'Customize'}
          </button>
        </div>
      </div>

      {editing && hiddenWidgets.length > 0 && (
        <div className="card">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-mute-light">
            Hidden widgets
          </p>
          <div className="flex flex-wrap gap-2">
            {hiddenWidgets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => toggle(w)}
                className="btn-outline"
              >
                + {labelFor(w.type)}
              </button>
            ))}
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleWidgets.map((w) => (
              <WidgetContainer
                key={w.id}
                id={w.id}
                editing={editing}
                onHide={() => toggle(w)}
                className={w.type === 'checklist' ? 'md:col-span-2 xl:col-span-3' : ''}
              >
                {renderWidget(w, { daily, weekly, monthly })}
              </WidgetContainer>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function labelFor(t: WidgetConfig['type']): string {
  switch (t) {
    case 'checklist':   return 'Checklist';
    case 'daily-pie':   return 'Daily Completion';
    case 'weekly-pie':  return 'Weekly Completion';
    case 'monthly-pie': return 'Monthly Completion';
    case 'quick-stats': return 'Quick Stats';
  }
}

function renderWidget(
  w: WidgetConfig,
  stats: {
    daily: { green: number; yellow: number; red: number };
    weekly: { green: number; yellow: number; red: number };
    monthly: { green: number; yellow: number; red: number };
  },
) {
  switch (w.type) {
    case 'checklist':
      return <Checklist />;
    case 'daily-pie':
      return <PieChartCard title="Daily completion" subtitle="Today" {...stats.daily} />;
    case 'weekly-pie':
      return <PieChartCard title="Weekly completion" subtitle="This week" {...stats.weekly} />;
    case 'monthly-pie':
      return <PieChartCard title="Monthly completion" subtitle="This month" {...stats.monthly} />;
    case 'quick-stats':
      return <QuickStatsCard daily={stats.daily} weekly={stats.weekly} monthly={stats.monthly} />;
  }
}

function QuickStatsCard({
  daily,
  weekly,
  monthly,
}: {
  daily: { green: number; yellow: number; red: number };
  weekly: { green: number; yellow: number; red: number };
  monthly: { green: number; yellow: number; red: number };
}) {
  const pct = (s: { green: number; yellow: number; red: number }) => {
    const t = s.green + s.yellow + s.red;
    return t > 0 ? Math.round((s.green / t) * 100) : 0;
  };
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-white">Quick stats</h3>
      <div className="space-y-3">
        <StatRow label="Today" value={`${pct(daily)}%`} sub={`${daily.green}/${daily.green + daily.yellow + daily.red} done`} />
        <StatRow label="This week" value={`${pct(weekly)}%`} sub={`${weekly.green}/${weekly.green + weekly.yellow + weekly.red} done`} />
        <StatRow label="This month" value={`${pct(monthly)}%`} sub={`${monthly.green}/${monthly.green + monthly.yellow + monthly.red} done`} />
      </div>
    </div>
  );
}

function StatRow({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2.5">
      <div>
        <div className="text-sm text-mute-light">{label}</div>
        <div className="text-[11px] text-mute">{sub}</div>
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
