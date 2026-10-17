'use client';

import { ReactNode } from 'react';
import { Loader2, Pencil, Trash2, Check, X } from 'lucide-react';

/** Shared field styling for every Defaults tab input/select. */
export const fieldClass =
  'px-4 py-2 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent';

export const compactFieldClass =
  'px-2 py-1 bg-input-background border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

export function TabHeading({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h2 className="text-xl font-semibold mb-2 text-foreground">{title}</h2>
      <p className="mb-6 text-muted-foreground">{description}</p>
    </>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      Loading…
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="text-center py-12 text-muted-foreground">{children}</div>;
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-sage hover:bg-sage-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  );
}

/** Edit / delete controls shown on each saved row. */
export function RowActions({
  editing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  disabled,
  allowEdit = true,
}: {
  editing: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete: () => void;
  disabled?: boolean;
  /** Set false for records with too many fields to edit inline (delete + re-add instead). */
  allowEdit?: boolean;
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onSave}
          disabled={disabled}
          className="p-1.5 rounded-full text-sage hover:bg-accent transition-colors active:scale-95 disabled:opacity-50"
          title="Save"
          aria-label="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-full text-muted-foreground hover:bg-accent transition-colors active:scale-95"
          title="Cancel"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      {allowEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors active:scale-95"
          title="Edit"
          aria-label="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={onDelete}
        className="p-1.5 rounded-full text-muted-foreground hover:text-coral hover:bg-accent transition-colors active:scale-95"
        title="Delete"
        aria-label="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Neutral container for one saved default record. */
export function RecordRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted border border-border">
      {children}
    </div>
  );
}
