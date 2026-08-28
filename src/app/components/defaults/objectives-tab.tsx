'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useOrgDefaults } from '../../../hooks/use-org-defaults';
import {
  TabHeading,
  LoadingState,
  EmptyState,
  PrimaryButton,
  RowActions,
  RecordRow,
  fieldClass,
  compactFieldClass,
} from './defaults-ui';

// Mirrors the `description` field of the Objective interface in
// objectives-page.tsx. `number` is deliberately not stored — it's assigned
// sequentially per form when the objective is loaded into an ICS 202.
interface DefaultObjective {
  id: string;
  description: string;
}

export function ObjectivesTab() {
  const { items, loading, saving, add, update, remove } =
    useOrgDefaults<DefaultObjective>('default-objectives');
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const submit = async () => {
    const description = draft.trim();
    if (!description) return;
    const created = await add({ description }, 'Objective added');
    if (created) setDraft('');
  };

  const saveEdit = async (id: string) => {
    const description = editText.trim();
    if (!description) return;
    const saved = await update(id, { description }, 'Objective updated');
    if (saved) setEditingId(null);
  };

  return (
    <div>
      <TabHeading
        title="Incident Objectives Library"
        description="Create reusable incident objectives that can be quickly selected when filling out ICS 202 forms."
      />

      <div className="mb-6">
        <label htmlFor="new-objective" className="block text-sm font-medium mb-2 text-foreground">
          Add New Objective
        </label>
        <div className="flex gap-2">
          <input
            id="new-objective"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Enter objective text (e.g., 'Ensure life safety of all personnel and civilians')"
            className={`flex-1 ${fieldClass}`}
          />
          <PrimaryButton onClick={submit} disabled={saving || !draft.trim()}>
            <Plus className="w-4 h-4" />
            Add
          </PrimaryButton>
        </div>
        <p className="text-xs mt-1 text-muted-foreground">Tip: press Enter to add the objective.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>No objectives created yet. Add your first objective to get started.</EmptyState>
      ) : (
        <div className="space-y-2">
          {items.map((objective) => (
            <RecordRow key={objective.id}>
              {editingId === objective.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(objective.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className={`flex-1 ${compactFieldClass}`}
                  autoFocus
                />
              ) : (
                <p className="text-sm text-foreground flex-1">{objective.description}</p>
              )}
              <RowActions
                editing={editingId === objective.id}
                disabled={saving}
                onEdit={() => {
                  setEditingId(objective.id);
                  setEditText(objective.description);
                }}
                onSave={() => saveEdit(objective.id)}
                onCancel={() => setEditingId(null)}
                onDelete={() => remove(objective.id, 'Objective deleted')}
              />
            </RecordRow>
          ))}
        </div>
      )}
    </div>
  );
}
