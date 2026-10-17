'use client';

import { PageHeader } from '../components/page-header';
import { Loader2, CheckCircle2, Cloud } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';
import { useOpPeriod } from '../../contexts/op-period-context';

// The "incident info" page is the canonical edit UI for shared op-period data.
// Shared fields (incident name/number, IC, prepared-by, approved-by, agency,
// period dates) flow through OpPeriodContext so every other workspace page
// sees the latest values without re-fetching. Non-shared incident-level
// metadata (jurisdiction, type, location, description, etc.) still goes
// through the IAP update endpoint and lives in incidents.metadata.

const AUTOSAVE_DELAY_MS = 700;

interface SharedDraft {
  incidentName: string;
  incidentNumber: string;
  incidentCommander: string;
  preparedByName: string;
  preparedByTitle: string;
  approvedByName: string;
  agencyName: string;
}

interface MetadataDraft {
  jurisdiction: string;
  incidentType: string;
  location: string;
  startDate: string;
  startTime: string;
  icAgency: string;
  description: string;
  estimatedSize: string;
  cause: string;
}

export function IncidentInfo() {
  const { iapId } = useParams<{ iapId: string }>();
  const { data: shared, loading, error: contextError, update: updateShared } = useOpPeriod();

  const [shareDraft, setSharedDraft] = useState<SharedDraft | null>(null);
  const [metaDraft, setMetaDraft] = useState<MetadataDraft>({
    jurisdiction: '',
    incidentType: 'Wildfire',
    location: '',
    startDate: '',
    startTime: '',
    icAgency: '',
    description: '',
    estimatedSize: '',
    cause: '',
  });
  const [metaLoading, setMetaLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hydrate the shared draft from context whenever the underlying record changes.
  useEffect(() => {
    if (!shared) return;
    setSharedDraft({
      incidentName: shared.incidentName ?? '',
      incidentNumber: shared.incidentNumber ?? '',
      incidentCommander: shared.incidentCommander ?? '',
      preparedByName: shared.preparedByName ?? '',
      preparedByTitle: shared.preparedByTitle ?? '',
      approvedByName: shared.approvedByName ?? '',
      agencyName: shared.agencyName ?? '',
    });
  }, [shared]);

  // Load metadata fields from the incidents row (incidents.metadata JSONB).
  useEffect(() => {
    if (!iapId) return;
    let cancelled = false;
    (async () => {
      setMetaLoading(true);
      try {
        const { iap } = await apiClient.getIAP(iapId);
        if (cancelled) return;
        setMetaDraft({
          jurisdiction: iap.jurisdiction ?? '',
          incidentType: iap.incidentType ?? 'Wildfire',
          location: iap.location ?? '',
          startDate: iap.startDate ?? '',
          startTime: iap.startTime ?? '',
          icAgency: iap.icAgency ?? '',
          description: iap.description ?? '',
          estimatedSize: iap.estimatedSize ?? '',
          cause: iap.cause ?? '',
        });
      } catch (err) {
        console.error('Failed to load incident metadata:', err);
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [iapId]);

  const sharedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueSharedSave = useCallback(
    (next: SharedDraft) => {
      if (sharedTimer.current) clearTimeout(sharedTimer.current);
      sharedTimer.current = setTimeout(async () => {
        setSaving(true);
        setSaveError(null);
        try {
          await updateShared(next);
          setLastSaved(new Date());
        } catch (err: any) {
          setSaveError(err?.message ?? 'Failed to save shared data');
        } finally {
          setSaving(false);
        }
      }, AUTOSAVE_DELAY_MS);
    },
    [updateShared],
  );

  const queueMetaSave = useCallback(
    (next: MetadataDraft) => {
      if (!iapId) return;
      if (metaTimer.current) clearTimeout(metaTimer.current);
      metaTimer.current = setTimeout(async () => {
        setSaving(true);
        setSaveError(null);
        try {
          await apiClient.updateIAP(iapId, next);
          setLastSaved(new Date());
        } catch (err: any) {
          setSaveError(err?.message ?? 'Failed to save incident details');
        } finally {
          setSaving(false);
        }
      }, AUTOSAVE_DELAY_MS);
    },
    [iapId],
  );

  const handleSharedChange = (field: keyof SharedDraft, value: string) => {
    setSharedDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      queueSharedSave(next);
      return next;
    });
  };

  const handleMetaChange = (field: keyof MetadataDraft, value: string) => {
    setMetaDraft((prev) => {
      const next = { ...prev, [field]: value };
      queueMetaSave(next);
      return next;
    });
  };

  if (loading || metaLoading || !shareDraft) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-mustard-hover animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading incident information…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <PageHeader
        title="Incident Info"
        description="Shared incident + operational period data. Edits here propagate to every form."
        action={
          <div className="flex items-center gap-2 text-sm">
            {saving ? (
              <>
                <Cloud className="w-4 h-4 text-mustard-hover animate-pulse" />
                <span className="text-muted-foreground">Saving…</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-muted-foreground">Saved {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Autosave enabled</span>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 p-8 overflow-y-auto">
        {(saveError || contextError) && (
          <div className="max-w-3xl mb-6 bg-coral/10 border border-coral/30 rounded-lg p-4">
            <p className="text-sm text-coral">{saveError || contextError}</p>
          </div>
        )}

        <div className="max-w-3xl space-y-6">
          {/* Shared op-period data — synced across every workspace page */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Shared Op-Period Data
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Entered once. Read by every form in this operational period.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Incident Name*
                </label>
                <input
                  type="text"
                  required
                  value={shareDraft.incidentName}
                  onChange={(e) => handleSharedChange('incidentName', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Incident Number
                </label>
                <input
                  type="text"
                  value={shareDraft.incidentNumber}
                  onChange={(e) => handleSharedChange('incidentNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Incident Commander
                </label>
                <input
                  type="text"
                  value={shareDraft.incidentCommander}
                  onChange={(e) => handleSharedChange('incidentCommander', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Agency / Organization
                </label>
                <input
                  type="text"
                  value={shareDraft.agencyName}
                  onChange={(e) => handleSharedChange('agencyName', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Prepared By (Name)
                </label>
                <input
                  type="text"
                  value={shareDraft.preparedByName}
                  onChange={(e) => handleSharedChange('preparedByName', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Prepared By (Title)
                </label>
                <input
                  type="text"
                  value={shareDraft.preparedByTitle}
                  onChange={(e) => handleSharedChange('preparedByTitle', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Approved By (Name)
              </label>
              <input
                type="text"
                value={shareDraft.approvedByName}
                onChange={(e) => handleSharedChange('approvedByName', e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              />
            </div>
          </div>

          {/* Incident-level metadata (not shared, stored on incidents.metadata) */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Incident Details
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Incident-level info, not shared across operational periods.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Jurisdiction
                </label>
                <input
                  type="text"
                  value={metaDraft.jurisdiction}
                  onChange={(e) => handleMetaChange('jurisdiction', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Incident Type
                </label>
                <select
                  value={metaDraft.incidentType}
                  onChange={(e) => handleMetaChange('incidentType', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                >
                  <option>Wildfire</option>
                  <option>Flood</option>
                  <option>Search and Rescue</option>
                  <option>Hazmat</option>
                  <option>Storm</option>
                  <option>Earthquake</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Incident Location
              </label>
              <input
                type="text"
                value={metaDraft.location}
                onChange={(e) => handleMetaChange('location', e.target.value)}
                placeholder="Street address, coordinates, or general location"
                className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Incident Start Date
                </label>
                <input
                  type="date"
                  value={metaDraft.startDate}
                  onChange={(e) => handleMetaChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Incident Start Time
                </label>
                <input
                  type="time"
                  value={metaDraft.startTime}
                  onChange={(e) => handleMetaChange('startTime', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Incident Description / Notes
              </label>
              <textarea
                rows={4}
                value={metaDraft.description}
                onChange={(e) => handleMetaChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Estimated Size / Scope
                </label>
                <input
                  type="text"
                  value={metaDraft.estimatedSize}
                  onChange={(e) => handleMetaChange('estimatedSize', e.target.value)}
                  placeholder="e.g., 100 acres, 50 people affected"
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Incident Cause
                </label>
                <input
                  type="text"
                  value={metaDraft.cause}
                  onChange={(e) => handleMetaChange('cause', e.target.value)}
                  placeholder="Known or suspected cause"
                  className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
