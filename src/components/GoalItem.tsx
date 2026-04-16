import { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Goal, GoalEntry } from '../types/database';
import { computeStatus } from '../hooks/useGoalEntries';

interface GoalItemProps {
  goal: Goal;
  entry: GoalEntry | null;
  onChange: (value: number) => void;
  onClear: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  sortable?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  green: 'border-status-green/40 bg-status-green/10',
  yellow: 'border-status-yellow/40 bg-status-yellow/10',
  red: 'border-card-border bg-card',
};

const STATUS_DOT: Record<string, string> = {
  green: 'bg-status-green',
  yellow: 'bg-status-yellow',
  red: 'bg-status-red',
};

export function GoalItem({
  goal,
  entry,
  onChange,
  onClear,
  onEdit,
  onDelete,
  sortable = true,
}: GoalItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id, disabled: !sortable });

  const value = entry?.value ?? 0;
  const status = entry?.status ?? computeStatus(goal, value);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  // Local buffer so typing in the numeric input isn't laggy.
  const [localValue, setLocalValue] = useState<string>(String(value || ''));
  useEffect(() => {
    setLocalValue(String(value || ''));
  }, [value]);

  function commitNumeric() {
    const parsed = parseInt(localValue, 10);
    const next = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    if (next !== value) onChange(next);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
        STATUS_STYLES[status],
      ].join(' ')}
    >
      {sortable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-mute opacity-0 hover:text-white group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
      )}

      {goal.type === 'checkbox' ? (
        <button
          type="button"
          onClick={() => onChange(value > 0 ? 0 : 1)}
          className={[
            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border transition-colors',
            value > 0
              ? 'border-status-green bg-status-green text-white'
              : 'border-mute hover:border-white',
          ].join(' ')}
          aria-label={value > 0 ? 'Mark incomplete' : 'Mark complete'}
        >
          {value > 0 && (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ) : (
        <div className={['h-2.5 w-2.5 rounded-full', STATUS_DOT[status]].join(' ')} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">
            {goal.name}
          </span>
          {goal.category && (
            <span className="hidden rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] uppercase tracking-wide text-mute sm:inline">
              {goal.category}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-mute">
          <span className="capitalize">{goal.frequency}</span>
          {goal.type !== 'checkbox' && goal.target_value != null && (
            <span>
              · Target: {goal.target_value}
              {goal.type === 'duration' ? ' min' : ''}
            </span>
          )}
        </div>
      </div>

      {goal.type !== 'checkbox' && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={commitNumeric}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitNumeric();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="input w-20 text-right"
            placeholder="0"
          />
          <span className="w-8 text-xs text-mute">
            {goal.type === 'duration' ? 'min' : ''}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {value > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-1.5 text-mute hover:bg-card-hover hover:text-white"
            aria-label="Clear entry"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1018 0 9 9 0 00-18 0zm6 0h6" />
            </svg>
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-1.5 text-mute hover:bg-card-hover hover:text-white"
            aria-label="Edit goal"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-mute hover:bg-status-red/20 hover:text-status-red"
            aria-label="Delete goal"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
