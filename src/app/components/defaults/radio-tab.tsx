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
} from './defaults-ui';

// Mirrors RadioChannel in communications-page.tsx field-for-field so a saved
// channel drops straight into an ICS 205 row in Phase 3.
interface DefaultRadioChannel {
  id: string;
  zoneGroup: string;
  channelNumber: string;
  function: string;
  channelName: string;
  assignment: string;
  rxFreq: string;
  rxTone: string;
  txFreq: string;
  txTone: string;
  mode: string;
  remarks: string;
}

const EMPTY: Omit<DefaultRadioChannel, 'id'> = {
  zoneGroup: '',
  channelNumber: '',
  function: '',
  channelName: '',
  assignment: '',
  rxFreq: '',
  rxTone: '',
  txFreq: '',
  txTone: '',
  mode: '',
  remarks: '',
};

export function RadioTab() {
  const { items, loading, saving, add, remove } = useOrgDefaults<DefaultRadioChannel>(
    'default-radio-channels',
  );
  const [draft, setDraft] = useState(EMPTY);

  const set = (key: keyof typeof EMPTY, value: string) => setDraft({ ...draft, [key]: value });

  const submit = async () => {
    if (!draft.channelName.trim()) return;
    const created = await add(
      { ...draft, channelName: draft.channelName.trim() },
      'Radio channel added',
    );
    if (created) setDraft(EMPTY);
  };

  return (
    <div>
      <TabHeading
        title="Radio Channel Defaults (ICS 205)"
        description="Save default radio channels that can be quickly loaded into the Radio Communications form."
      />

      <div className="rounded-lg border border-border p-4 mb-4 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <input
            type="text"
            value={draft.zoneGroup}
            onChange={(e) => set('zoneGroup', e.target.value)}
            placeholder="Zone/Group"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.channelNumber}
            onChange={(e) => set('channelNumber', e.target.value)}
            placeholder="Ch #"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.function}
            onChange={(e) => set('function', e.target.value)}
            placeholder="Function"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.channelName}
            onChange={(e) => set('channelName', e.target.value)}
            placeholder="Channel name *"
            className={fieldClass}
          />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <input
            type="text"
            value={draft.assignment}
            onChange={(e) => set('assignment', e.target.value)}
            placeholder="Assignment"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.rxFreq}
            onChange={(e) => set('rxFreq', e.target.value)}
            placeholder="RX freq"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.rxTone}
            onChange={(e) => set('rxTone', e.target.value)}
            placeholder="RX tone"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.txFreq}
            onChange={(e) => set('txFreq', e.target.value)}
            placeholder="TX freq"
            className={fieldClass}
          />
        </div>
        <div className="grid grid-cols-[1fr_1fr_2fr_auto] gap-3 items-center">
          <input
            type="text"
            value={draft.txTone}
            onChange={(e) => set('txTone', e.target.value)}
            placeholder="TX tone"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.mode}
            onChange={(e) => set('mode', e.target.value)}
            placeholder="Mode (A/D/M)"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.remarks}
            onChange={(e) => set('remarks', e.target.value)}
            placeholder="Remarks"
            className={fieldClass}
          />
          <PrimaryButton onClick={submit} disabled={saving || !draft.channelName.trim()}>
            <Plus className="w-4 h-4" />
            Add Channel
          </PrimaryButton>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>
          <p className="mb-2">No radio channels saved</p>
          <p className="text-sm">Add one using the form above.</p>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {items.map((channel) => (
            <div
              key={channel.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted border border-border"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {channel.channelName}
                  {channel.channelNumber && (
                    <span className="text-muted-foreground font-normal"> · Ch {channel.channelNumber}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[
                    channel.zoneGroup,
                    channel.function,
                    channel.assignment,
                    channel.mode && `Mode ${channel.mode}`,
                  ]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {[
                    channel.rxFreq && `RX ${channel.rxFreq}${channel.rxTone ? ` (${channel.rxTone})` : ''}`,
                    channel.txFreq && `TX ${channel.txFreq}${channel.txTone ? ` (${channel.txTone})` : ''}`,
                  ]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
                {channel.remarks && (
                  <p className="text-xs text-muted-foreground italic truncate">{channel.remarks}</p>
                )}
              </div>
              {/* Eleven ICS 205 fields is too many to edit inline; delete + re-add. */}
              <RowActions
                editing={false}
                allowEdit={false}
                disabled={saving}
                onDelete={() => remove(channel.id, 'Radio channel deleted')}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
