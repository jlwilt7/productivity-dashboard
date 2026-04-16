import { useMemo, useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import { GoalDialog } from '../components/Checklist';
import type { Goal, GoalFrequency } from '../types/database';

const FREQ_LABEL: Record<GoalFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, archiveGoal, loading } = useGoals(true);
  const [filter, setFilter] = useState<'all' | GoalFrequency | 'archived'>('all');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'archived') return goals.filter((g) => g.is_archived);
    if (filter === 'all') return goals.filter((g) => !g.is_archived);
    return goals.filter((g) => !g.is_archived && g.frequency === filter);
  }, [goals, filter]);

  const counts = useMemo(() => {
    const c = { all: 0, daily: 0, weekly: 0, monthly: 0, archived: 0 };
    for (const g of goals) {
      if (g.is_archived) c.archived++;
      else {
        c.all++;
        c[g.frequency]++;
      }
    }
    return c;
  }, [goals]);

  const filters: { key: typeof filter; label: string; count: number }[] = [
    { key: 'all',      label: 'All active', count: counts.all },
    { key: 'daily',    label: 'Daily',      count: counts.daily },
    { key: 'weekly',   label: 'Weekly',     count: counts.weekly },
    { key: 'monthly',  label: 'Monthly',    count: counts.monthly },
    { key: 'archived', label: 'Archived',   count: counts.archived },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Goals</h2>
          <p className="mt-1 text-sm text-mute">
            Manage your tracked goals, categories, and targets.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
          </svg>
          New goal
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.key
                ? 'bg-accent/20 text-accent'
                : 'bg-card text-mute-light hover:bg-card-hover hover:text-white',
            ].join(' ')}
          >
            {f.label} <span className="ml-1 text-mute">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="card p-0">
        {loading ? (
          <div className="p-8 text-center text-sm text-mute">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-mute">
            No goals match this filter.
          </div>
        ) : (
          <div className="divide-y divide-card-border">
            {filtered.map((g) => (
              <GoalRow
                key={g.id}
                goal={g}
                onEdit={() => setEditing(g)}
                onArchive={() => void archiveGoal(g.id, !g.is_archived)}
                onDelete={() => {
                  if (confirm(`Permanently delete "${g.name}"? This removes all entries.`)) {
                    void deleteGoal(g.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {(adding || editing) && (
        <GoalDialog
          goal={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSave={async (input) => {
            if (editing) {
              await updateGoal(editing.id, input);
            } else {
              await addGoal(input);
            }
            setAdding(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function GoalRow({
  goal,
  onEdit,
  onArchive,
  onDelete,
}: {
  goal: Goal;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={[
              'truncate font-medium',
              goal.is_archived ? 'text-mute line-through' : 'text-white',
            ].join(' ')}
          >
            {goal.name}
          </span>
          {goal.category && (
            <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] uppercase tracking-wide text-mute">
              {goal.category}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-mute">
          <span>{FREQ_LABEL[goal.frequency]}</span>
          <span>·</span>
          <span className="capitalize">{goal.type}</span>
          {goal.target_value != null && (
            <>
              <span>·</span>
              <span>
                Target {goal.target_value}
                {goal.type === 'duration' ? ' min' : ''}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onEdit} className="btn-ghost">
          Edit
        </button>
        <button type="button" onClick={onArchive} className="btn-ghost">
          {goal.is_archived ? 'Restore' : 'Archive'}
        </button>
        <button type="button" onClick={onDelete} className="btn-danger">
          Delete
        </button>
      </div>
    </div>
  );
}
