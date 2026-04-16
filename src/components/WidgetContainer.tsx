import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WidgetContainerProps {
  id: string;
  children: ReactNode;
  editing: boolean;
  onHide?: () => void;
  className?: string;
}

export function WidgetContainer({
  id,
  children,
  editing,
  onHide,
  className,
}: WidgetContainerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'relative',
        editing ? 'ring-1 ring-accent/40 ring-offset-2 ring-offset-bg rounded-xl' : '',
        className ?? '',
      ].join(' ')}
    >
      {editing && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-bg-elevated text-mute-light hover:text-white active:cursor-grabbing"
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
          {onHide && (
            <button
              type="button"
              onClick={onHide}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-bg-elevated text-mute-light hover:bg-status-red/20 hover:text-status-red"
              aria-label="Hide widget"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
