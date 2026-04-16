import { useMemo, useState, type FormEvent } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useGoals } from '../hooks/useGoals';
import { useGoalEntries } from '../hooks/useGoalEntries';
import { useDashboardStore } from '../store/useDashboardStore';
import { GoalItem } from './GoalItem';
import type { Goal, GoalFrequency, GoalType } from '../types/database';

export function Checklist() {
  const selectedDate = useDashboardStore((s) => s.selectedDate);
  const { goals, addGoal, updateGoal, deleteGoal, reorderGoals, loading } = useGoals();
  const { getEntry, upsertEntry, clearEntry } = useGoalEntries({
    from: selectedDate,
    to: selectedDate,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const dailyGoals = useMemo(
    () => goals.filter((g) => g.frequency === 'daily'),
    [goals],
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = dailyGoals.map((g) => g.id);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(ids, oldIdx, newIdx);
    // Combine with the ordering of non-daily goals to preserve them.
    const rest = goals.filter((g) => g.frequency !== 'daily').map((g) => g.id);
    void reorderGoals([...next, ...rest]);
  }

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Daily Checklist</h3>
          <p className="text-xs text-mute">
            {dailyGoals.length} item{dailyGoals.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setAdding(true);
          }}
          className="btn-primary"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
          </svg>
          Add goal
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-mute">Loading…</div>
      ) : dailyGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-card-border py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated text-mute">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <p className="text-sm text-mute-light">No daily goals yet.</p>
          <p className="mt-1 text-xs text-mute">
            Add your first goal to start tracking.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={dailyGoals.map((g) => g.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {dailyGoals.map((g) => (
                <GoalItem
                  key={g.id}
                  goal={g}
                  entry={getEntry(g.id, selectedDate)}
                  onChange={(value) => void upsertEntry(g, selectedDate, value)}
                  onClear={() => void clearEntry(g.id, selectedDate)}
                  onEdit={() => setEditing(g)}
                  onDelete={() => {
                    if (confirm(`Delete "${g.name}"? This removes all its entries.`)) {
                      void deleteGoal(g.id);
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

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
              await addGoal({ ...input, frequency: input.frequency ?? 'daily' });
            }
            setAdding(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

interface GoalDialogProps {
  goal: Goal | null;
  onClose: () => void;
  onSave: (input: {
    name: string;
    frequency: GoalFrequency;
    type: GoalType;
    target_value: number | null;
    category: string | null;
  }) => Promise<void>;
}

export function GoalDialog({ goal, onClose, onSave }: GoalDialogProps) {
  const [name, setName] = useState(goal?.name ?? '');
  const [frequency, setFrequency] = useState<GoalFrequency>(goal?.frequency ?? 'daily');
  const [type, setType] = useState<GoalType>(goal?.type ?? 'checkbox');
  const [target, setTarget] = useState<string>(
    goal?.target_value != null ? String(goal.target_value) : '',
  );
  const [category, setCategory] = useState(goal?.category ?? '');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await onSave({
      name: name.trim(),
      frequency,
      type,
      target_value: type === 'checkbox' ? null : parseInt(target, 10) || null,
      category: category.trim() || null,
    });
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-card-border bg-card p-5 shadow-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {goal ? 'Edit goal' : 'Add goal'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost h-8 w-8 p-0"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Goal name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Morning meditation"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as GoalFrequency)}
                className="input"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as GoalType)}
                className="input"
              >
                <option value="checkbox">Checkbox</option>
                <option value="numeric">Numeric</option>
                <option value="duration">Duration (min)</option>
              </select>
            </div>
          </div>

          {type !== 'checkbox' && (
            <div>
              <label className="label">
                Target ({type === 'duration' ? 'minutes' : 'value'})
              </label>
              <input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="input"
                placeholder={type === 'duration' ? 'e.g. 30' : 'e.g. 5'}
              />
            </div>
          )}

          <div>
            <label className="label">Category (optional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
              placeholder="Health, Work, Learning…"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? 'Saving…' : goal ? 'Save changes' : 'Add goal'}
          </button>
        </div>
      </form>
    </div>
  );
}
