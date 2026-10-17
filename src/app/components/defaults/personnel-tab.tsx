'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useOrgDefaults } from '../../../hooks/use-org-defaults';
import { formatPhoneNumber } from '../../../utils/phone-formatter';
import {
  TabHeading,
  LoadingState,
  EmptyState,
  PrimaryButton,
  RowActions,
  fieldClass,
  compactFieldClass,
} from './defaults-ui';

// Superset of the four columns the page shows. `role` and `radio` are carried
// so Phase 3 can map a saved contact straight onto an ICS 203 role slot
// (personnel-page.tsx stores `<role>Name` / `<role>Contact` pairs) without a
// second round of data entry.
interface DefaultPersonnel {
  id: string;
  name: string;
  agency: string;
  phone: string;
  email: string;
  role?: string;
  radio?: string;
}

const EMPTY = { name: '', agency: '', phone: '', email: '' };

export function PersonnelTab() {
  const { items, loading, saving, add, update, remove } =
    useOrgDefaults<DefaultPersonnel>('default-personnel');
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(EMPTY);

  const submit = async () => {
    if (!draft.name.trim()) return;
    const created = await add({ ...draft, name: draft.name.trim() }, 'Contact added');
    if (created) setDraft(EMPTY);
  };

  const saveEdit = async (id: string) => {
    if (!editDraft.name.trim()) return;
    const saved = await update(id, { ...editDraft, name: editDraft.name.trim() }, 'Contact updated');
    if (saved) setEditingId(null);
  };

  return (
    <div>
      <TabHeading
        title="Personnel Defaults"
        description="Manage your personnel contacts for quick assignment to roles."
      />

      <div className="rounded-lg p-4 mb-6 bg-accent border border-border">
        <p className="text-sm text-foreground">
          <strong>Name Format Recommendation:</strong> For consistent alphabetical sorting, please
          enter names as <code className="bg-muted px-1 rounded">Last, First Middle</code>
        </p>
        <p className="text-xs mt-1 text-muted-foreground">
          Examples: Smith, John | Garcia Lopez, Maria | Johnson, Robert Jr.
        </p>
      </div>

      <div className="grid grid-cols-[2fr_2fr_1.5fr_2fr_auto] gap-3 mb-2 text-sm font-medium text-foreground">
        <div>Name (Last, First)</div>
        <div>Agency</div>
        <div>Phone</div>
        <div>Email</div>
        <div className="w-[76px]" />
      </div>

      <div className="grid grid-cols-[2fr_2fr_1.5fr_2fr_auto] gap-3 mb-6 items-center">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Start typing to add..."
          className={fieldClass}
        />
        <input
          type="text"
          value={draft.agency}
          onChange={(e) => setDraft({ ...draft, agency: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Agency/Organization"
          className={fieldClass}
        />
        <input
          type="tel"
          value={draft.phone}
          onChange={(e) => setDraft({ ...draft, phone: formatPhoneNumber(e.target.value) })}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="(xxx) xxx-xxxx"
          className={fieldClass}
        />
        <input
          type="email"
          value={draft.email}
          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="someone@example.com"
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
        <EmptyState>No personnel contacts saved. Add your first contact above.</EmptyState>
      ) : (
        <div className="space-y-2">
          {items.map((person) => {
            const editing = editingId === person.id;
            return (
              <div
                key={person.id}
                className="grid grid-cols-[2fr_2fr_1.5fr_2fr_auto] gap-3 items-center p-3 rounded-lg bg-muted border border-border"
              >
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      className={compactFieldClass}
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDraft.agency}
                      onChange={(e) => setEditDraft({ ...editDraft, agency: e.target.value })}
                      className={compactFieldClass}
                    />
                    <input
                      type="tel"
                      value={editDraft.phone}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, phone: formatPhoneNumber(e.target.value) })
                      }
                      className={compactFieldClass}
                    />
                    <input
                      type="email"
                      value={editDraft.email}
                      onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
                      className={compactFieldClass}
                    />
                  </>
                ) : (
                  <>
                    <span className="text-sm text-foreground truncate">{person.name}</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {person.agency || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {person.phone || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {person.email || '—'}
                    </span>
                  </>
                )}
                <RowActions
                  editing={editing}
                  disabled={saving}
                  onEdit={() => {
                    setEditingId(person.id);
                    setEditDraft({
                      name: person.name,
                      agency: person.agency || '',
                      phone: person.phone || '',
                      email: person.email || '',
                    });
                  }}
                  onSave={() => saveEdit(person.id)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => remove(person.id, 'Contact deleted')}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
