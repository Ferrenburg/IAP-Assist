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

// FEMA's seven Community Lifelines.
const LIFELINES = [
  'Safety and Security',
  'Food, Water, Shelter',
  'Health and Medical',
  'Energy',
  'Communications',
  'Transportation',
  'Hazardous Materials',
];

interface DefaultLifelineObjective {
  id: string;
  lifeline: string;
  description: string;
}

export function LifelineTab() {
  const { items, loading, saving, add, update, remove } = useOrgDefaults<DefaultLifelineObjective>(
    'default-lifeline-objectives',
  );
  const [lifeline, setLifeline] = useState(LIFELINES[0]);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState('All Lifelines');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const submit = async () => {
    const description = draft.trim();
    if (!description) return;
    const created = await add({ lifeline, description }, 'Lifeline objective added');
    if (created) setDraft('');
  };

  const saveEdit = async (id: string) => {
    const description = editText.trim();
    if (!description) return;
    const saved = await update(id, { description }, 'Lifeline objective updated');
    if (saved) setEditingId(null);
  };

  const visible =
    filter === 'All Lifelines' ? items : items.filter((item) => item.lifeline === filter);

  return (
    <div>
      <TabHeading
        title="Community Lifeline Objectives Library"
        description="Create reusable objectives for each community lifeline that can be quickly loaded when filling out lifeline forms."
      />

      <div className="mb-6">
        <label htmlFor="lifeline-select" className="block text-sm font-medium mb-2 text-foreground">
          Community Lifeline
        </label>
        <select
          id="lifeline-select"
          value={lifeline}
          onChange={(e) => setLifeline(e.target.value)}
          className={`w-full mb-4 ${fieldClass}`}
        >
          {LIFELINES.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Enter objective text (e.g., 'Ensure 24/7 law enforcement presence at critical facilities')"
            className={`flex-1 ${fieldClass}`}
          />
          <PrimaryButton onClick={submit} disabled={saving || !draft.trim()}>
            <Plus className="w-4 h-4" />
            Add
          </PrimaryButton>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="lifeline-filter" className="block text-sm font-medium mb-2 text-foreground">
          Filter by Lifeline
        </label>
        <select
          id="lifeline-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={`w-full ${fieldClass}`}
        >
          <option>All Lifelines</option>
          {LIFELINES.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <EmptyState>
          {items.length === 0
            ? 'No objectives created yet. Add your first objective to get started.'
            : `No objectives saved under ${filter}.`}
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {visible.map((objective) => (
            <RecordRow key={objective.id}>
              <div className="flex-1 min-w-0">
                <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent text-muted-foreground mb-1">
                  {objective.lifeline}
                </span>
                {editingId === objective.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(objective.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className={`w-full ${compactFieldClass}`}
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-foreground">{objective.description}</p>
                )}
              </div>
              <RowActions
                editing={editingId === objective.id}
                disabled={saving}
                onEdit={() => {
                  setEditingId(objective.id);
                  setEditText(objective.description);
                }}
                onSave={() => saveEdit(objective.id)}
                onCancel={() => setEditingId(null)}
                onDelete={() => remove(objective.id, 'Lifeline objective deleted')}
              />
            </RecordRow>
          ))}
        </div>
      )}
    </div>
  );
}
