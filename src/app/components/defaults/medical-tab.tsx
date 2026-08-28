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

// These three shapes mirror MedicalStation / Transportation / Hospital in
// safety-medical-page.tsx exactly, so a saved default drops straight into an
// ICS 206 row in Phase 3 without a field-mapping layer.
interface DefaultStation {
  id: string;
  name: string;
  location: string;
  contact: string;
  paramedicsOnSite: boolean;
}

interface DefaultTransport {
  id: string;
  ambulanceService: string;
  location: string;
  contact: string;
  levelOfService: 'ALS' | 'BLS' | '';
}

interface DefaultHospital {
  id: string;
  hospitalName: string;
  address: string;
  contact: string;
  travelTimeAir: string;
  travelTimeGround: string;
  traumaCenter: boolean;
  burnCenter: boolean;
  helipad: boolean;
}

const SUB_TABS = [
  { id: 'stations', label: 'Medical Aid Stations' },
  { id: 'transport', label: 'Transportation' },
  { id: 'hospitals', label: 'Hospitals' },
];

export function MedicalTab() {
  const [sub, setSub] = useState('stations');

  return (
    <div>
      <TabHeading
        title="Medical Defaults (ICS 206)"
        description="Save default medical resources that can be quickly selected when creating operational periods."
      />

      <div className="flex gap-2 mb-6 border-b border-border">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              sub === t.id
                ? 'text-sage border-sage'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'stations' && <StationsSection />}
      {sub === 'transport' && <TransportSection />}
      {sub === 'hospitals' && <HospitalsSection />}
    </div>
  );
}

/* ------------------------------- Stations -------------------------------- */

const EMPTY_STATION = { name: '', location: '', contact: '', paramedicsOnSite: false };

function StationsSection() {
  const { items, loading, saving, add, update, remove } =
    useOrgDefaults<DefaultStation>('default-medical-stations');
  const [draft, setDraft] = useState(EMPTY_STATION);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(EMPTY_STATION);

  const submit = async () => {
    if (!draft.name.trim()) return;
    const created = await add({ ...draft, name: draft.name.trim() }, 'Aid station added');
    if (created) setDraft(EMPTY_STATION);
  };

  return (
    <div>
      <div className="grid grid-cols-[2fr_2fr_1.5fr_auto_auto] gap-3 mb-4 items-center">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Station name"
          className={fieldClass}
        />
        <input
          type="text"
          value={draft.location}
          onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          placeholder="Location"
          className={fieldClass}
        />
        <input
          type="text"
          value={draft.contact}
          onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
          placeholder="Contact"
          className={fieldClass}
        />
        <label className="flex items-center gap-2 text-sm text-foreground whitespace-nowrap">
          <input
            type="checkbox"
            checked={draft.paramedicsOnSite}
            onChange={(e) => setDraft({ ...draft, paramedicsOnSite: e.target.checked })}
            className="w-4 h-4 accent-sage"
          />
          Paramedics
        </label>
        <PrimaryButton onClick={submit} disabled={saving || !draft.name.trim()}>
          <Plus className="w-4 h-4" />
          Add
        </PrimaryButton>
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>
          <p className="mb-2">No medical aid stations saved</p>
          <p className="text-sm">Add one using the fields above.</p>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {items.map((station) => {
            const editing = editingId === station.id;
            return (
              <div
                key={station.id}
                className="grid grid-cols-[2fr_2fr_1.5fr_auto_auto] gap-3 items-center p-3 rounded-lg bg-muted border border-border"
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
                      value={editDraft.location}
                      onChange={(e) => setEditDraft({ ...editDraft, location: e.target.value })}
                      className={compactFieldClass}
                    />
                    <input
                      type="text"
                      value={editDraft.contact}
                      onChange={(e) => setEditDraft({ ...editDraft, contact: e.target.value })}
                      className={compactFieldClass}
                    />
                    <label className="flex items-center gap-2 text-sm text-foreground whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={editDraft.paramedicsOnSite}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, paramedicsOnSite: e.target.checked })
                        }
                        className="w-4 h-4 accent-sage"
                      />
                      Paramedics
                    </label>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-foreground truncate">{station.name}</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {station.location || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {station.contact || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {station.paramedicsOnSite ? 'Paramedics ✓' : '—'}
                    </span>
                  </>
                )}
                <RowActions
                  editing={editing}
                  disabled={saving}
                  onEdit={() => {
                    setEditingId(station.id);
                    setEditDraft({
                      name: station.name,
                      location: station.location || '',
                      contact: station.contact || '',
                      paramedicsOnSite: !!station.paramedicsOnSite,
                    });
                  }}
                  onSave={async () => {
                    if (!editDraft.name.trim()) return;
                    const saved = await update(station.id, editDraft, 'Aid station updated');
                    if (saved) setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => remove(station.id, 'Aid station deleted')}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Transportation ---------------------------- */

const EMPTY_TRANSPORT: Omit<DefaultTransport, 'id'> = {
  ambulanceService: '',
  location: '',
  contact: '',
  levelOfService: '',
};

function TransportSection() {
  const { items, loading, saving, add, update, remove } = useOrgDefaults<DefaultTransport>(
    'default-medical-transport',
  );
  const [draft, setDraft] = useState(EMPTY_TRANSPORT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(EMPTY_TRANSPORT);

  const submit = async () => {
    if (!draft.ambulanceService.trim()) return;
    const created = await add(
      { ...draft, ambulanceService: draft.ambulanceService.trim() },
      'Transport resource added',
    );
    if (created) setDraft(EMPTY_TRANSPORT);
  };

  return (
    <div>
      <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-3 mb-4 items-center">
        <input
          type="text"
          value={draft.ambulanceService}
          onChange={(e) => setDraft({ ...draft, ambulanceService: e.target.value })}
          placeholder="Ambulance service"
          className={fieldClass}
        />
        <input
          type="text"
          value={draft.location}
          onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          placeholder="Location"
          className={fieldClass}
        />
        <input
          type="text"
          value={draft.contact}
          onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
          placeholder="Contact"
          className={fieldClass}
        />
        <select
          value={draft.levelOfService}
          onChange={(e) =>
            setDraft({ ...draft, levelOfService: e.target.value as DefaultTransport['levelOfService'] })
          }
          className={fieldClass}
        >
          <option value="">Level…</option>
          <option value="ALS">ALS</option>
          <option value="BLS">BLS</option>
        </select>
        <PrimaryButton onClick={submit} disabled={saving || !draft.ambulanceService.trim()}>
          <Plus className="w-4 h-4" />
          Add
        </PrimaryButton>
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>
          <p className="mb-2">No transportation resources saved</p>
          <p className="text-sm">Add one using the fields above.</p>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {items.map((transport) => {
            const editing = editingId === transport.id;
            return (
              <div
                key={transport.id}
                className="grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-3 items-center p-3 rounded-lg bg-muted border border-border"
              >
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={editDraft.ambulanceService}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, ambulanceService: e.target.value })
                      }
                      className={compactFieldClass}
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDraft.location}
                      onChange={(e) => setEditDraft({ ...editDraft, location: e.target.value })}
                      className={compactFieldClass}
                    />
                    <input
                      type="text"
                      value={editDraft.contact}
                      onChange={(e) => setEditDraft({ ...editDraft, contact: e.target.value })}
                      className={compactFieldClass}
                    />
                    <select
                      value={editDraft.levelOfService}
                      onChange={(e) =>
                        setEditDraft({
                          ...editDraft,
                          levelOfService: e.target.value as DefaultTransport['levelOfService'],
                        })
                      }
                      className={compactFieldClass}
                    >
                      <option value="">Level…</option>
                      <option value="ALS">ALS</option>
                      <option value="BLS">BLS</option>
                    </select>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-foreground truncate">
                      {transport.ambulanceService}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {transport.location || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {transport.contact || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {transport.levelOfService || '—'}
                    </span>
                  </>
                )}
                <RowActions
                  editing={editing}
                  disabled={saving}
                  onEdit={() => {
                    setEditingId(transport.id);
                    setEditDraft({
                      ambulanceService: transport.ambulanceService,
                      location: transport.location || '',
                      contact: transport.contact || '',
                      levelOfService: transport.levelOfService || '',
                    });
                  }}
                  onSave={async () => {
                    if (!editDraft.ambulanceService.trim()) return;
                    const saved = await update(
                      transport.id,
                      editDraft,
                      'Transport resource updated',
                    );
                    if (saved) setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => remove(transport.id, 'Transport resource deleted')}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Hospitals ------------------------------- */

const EMPTY_HOSPITAL: Omit<DefaultHospital, 'id'> = {
  hospitalName: '',
  address: '',
  contact: '',
  travelTimeAir: '',
  travelTimeGround: '',
  traumaCenter: false,
  burnCenter: false,
  helipad: false,
};

function HospitalsSection() {
  const { items, loading, saving, add, remove } =
    useOrgDefaults<DefaultHospital>('default-medical-hospitals');
  const [draft, setDraft] = useState(EMPTY_HOSPITAL);

  const submit = async () => {
    if (!draft.hospitalName.trim()) return;
    const created = await add(
      { ...draft, hospitalName: draft.hospitalName.trim() },
      'Hospital added',
    );
    if (created) setDraft(EMPTY_HOSPITAL);
  };

  return (
    <div>
      {/* Hospitals carry more fields than fit one row, so this section uses a
          small form block rather than the inline-grid pattern of the other two. */}
      <div className="rounded-lg border border-border p-4 mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={draft.hospitalName}
            onChange={(e) => setDraft({ ...draft, hospitalName: e.target.value })}
            placeholder="Hospital name"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            placeholder="Address"
            className={fieldClass}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            value={draft.contact}
            onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
            placeholder="Contact"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.travelTimeAir}
            onChange={(e) => setDraft({ ...draft, travelTimeAir: e.target.value })}
            placeholder="Travel time — air"
            className={fieldClass}
          />
          <input
            type="text"
            value={draft.travelTimeGround}
            onChange={(e) => setDraft({ ...draft, travelTimeGround: e.target.value })}
            placeholder="Travel time — ground"
            className={fieldClass}
          />
        </div>
        <div className="flex items-center gap-6">
          {([
            ['traumaCenter', 'Trauma center'],
            ['burnCenter', 'Burn center'],
            ['helipad', 'Helipad'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
                className="w-4 h-4 accent-sage"
              />
              {label}
            </label>
          ))}
          <PrimaryButton
            onClick={submit}
            disabled={saving || !draft.hospitalName.trim()}
            className="ml-auto"
          >
            <Plus className="w-4 h-4" />
            Add Hospital
          </PrimaryButton>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>
          <p className="mb-2">No hospitals saved</p>
          <p className="text-sm">Add one using the form above.</p>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {items.map((hospital) => (
            <div
              key={hospital.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted border border-border"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{hospital.hospitalName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[hospital.address, hospital.contact].filter(Boolean).join(' · ') || '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[
                    hospital.travelTimeAir && `Air: ${hospital.travelTimeAir}`,
                    hospital.travelTimeGround && `Ground: ${hospital.travelTimeGround}`,
                    hospital.traumaCenter && 'Trauma',
                    hospital.burnCenter && 'Burn',
                    hospital.helipad && 'Helipad',
                  ]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
              </div>
              {/* Eight fields is too many to edit inline; delete + re-add
                  instead of showing an edit control that does nothing. */}
              <RowActions
                editing={false}
                allowEdit={false}
                disabled={saving}
                onDelete={() => remove(hospital.id, 'Hospital deleted')}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
