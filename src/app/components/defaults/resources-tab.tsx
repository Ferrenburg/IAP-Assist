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
  fieldClass,
  compactFieldClass,
} from './defaults-ui';

// Mirrors the Resource interface in assignments-page.tsx (ICS 204) exactly.
interface DefaultResource {
  id: string;
  name: string;
  leaderName: string;
  numPersons: string;
  contact: string;
  notes: string;
}

const EMPTY: Omit<DefaultResource, 'id'> = {
  name: '',
  leaderName: '',
  numPersons: '',
  contact: '',
  notes: '',
};

export function ResourcesTab() {
  const { items, loading, saving, add, update, remove } =
    useOrgDefaults<DefaultResource>('default-resources');
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(EMPTY);

  const submit = async () => {
    if (!draft.name.trim()) return;
    const created = await add({ ...draft, name: draft.name.trim() }, 'Resource added');
    if (created) setDraft(EMPTY);
  };

  const cols = 'grid grid-cols-[1.5fr_1.5fr_0.7fr_1.5fr_2fr_auto] gap-3';

  return (
    <div>
      <TabHeading
        title="Resources Assigned"
        description="Create default resource entries for quick assignment in Operations assignments."
      />

      <div className="rounded-lg p-4 mb-6 bg-accent border border-border">
        <p className="text-sm font-semibold mb-2 text-foreground">How to Use Resource Defaults</p>
        <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
          <li>Add commonly used resources here to save time when creating assignments</li>
          <li>When adding resources in the Operations tab, you can load from these defaults</li>
          <li>Loaded defaults can be edited directly in the Operations tab as needed</li>
          <li>Resource Identifier examples: E-101, ENG-13, IA-SCC-413, or TBD (to be determined)</li>
          <li>Number of persons should include the leader</li>
          <li>Contact can be radio frequency, phone, pager, or other contact method</li>
        </ul>
      </div>

      <div className={`${cols} mb-2 text-sm font-medium text-foreground`}>
        <div>Identifier</div>
        <div>Leader</div>
        <div>#</div>
        <div>Contact</div>
        <div>Notes</div>
        <div className="w-[76px]" />
      </div>

      <div className={`${cols} mb-6 items-center`}>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="E-101"
          className={fieldClass}
        />
        <input
          type="text"
          value={draft.leaderName}
          onChange={(e) => setDraft({ ...draft, leaderName: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Leader"
          className={fieldClass}
        />
        <input
          type="text"
          value={draft.numPersons}
          onChange={(e) => setDraft({ ...draft, numPersons: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="#"
          className={fieldClass}
        />
        <input
          type="text"
          value={draft.contact}
          onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Contact"
          className={fieldClass}
        />
        <input
          type="text"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Notes"
          className={fieldClass}
        />
        <PrimaryButton onClick={submit} disabled={saving || !draft.name.trim()}>
          <Plus className="w-4 h-4" />
          Add
        </PrimaryButton>
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>No default resources configured yet.</EmptyState>
      ) : (
        <div className="space-y-2">
          {items.map((resource) => {
            const editing = editingId === resource.id;
            return (
              <div
                key={resource.id}
                className={`${cols} items-center p-3 rounded-lg bg-muted border border-border`}
              >
                {editing ? (
                  (['name', 'leaderName', 'numPersons', 'contact', 'notes'] as const).map(
                    (key, i) => (
                      <input
                        key={key}
                        type="text"
                        value={editDraft[key]}
                        onChange={(e) => setEditDraft({ ...editDraft, [key]: e.target.value })}
                        className={compactFieldClass}
                        autoFocus={i === 0}
                      />
                    ),
                  )
                ) : (
                  <>
                    <span className="text-sm text-foreground truncate">{resource.name}</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {resource.leaderName || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {resource.numPersons || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {resource.contact || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {resource.notes || '—'}
                    </span>
                  </>
                )}
                <RowActions
                  editing={editing}
                  disabled={saving}
                  onEdit={() => {
                    setEditingId(resource.id);
                    setEditDraft({
                      name: resource.name,
                      leaderName: resource.leaderName || '',
                      numPersons: resource.numPersons || '',
                      contact: resource.contact || '',
                      notes: resource.notes || '',
                    });
                  }}
                  onSave={async () => {
                    if (!editDraft.name.trim()) return;
                    const saved = await update(resource.id, editDraft, 'Resource updated');
                    if (saved) setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => remove(resource.id, 'Resource deleted')}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
