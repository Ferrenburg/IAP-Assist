'use client';

import { Plus, ArrowLeft, Clock, X, Pencil, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiClient } from '../../utils/api-client';
import { toast } from 'sonner';

interface IAP {
  id: string;
  name: string;
  incidentNumber: string;
  jurisdiction: string;
}

interface OperationalPeriod {
  id: string;
  iapId?: string;
  periodNumber: string;
  periodName?: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export function Sidebar() {
  const { iapId, periodId } = useParams();
  const router = useRouter();
  const [currentIAP, setCurrentIAP] = useState<IAP | null>(null);
  const [operationalPeriods, setOperationalPeriods] = useState<OperationalPeriod[]>([]);
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<OperationalPeriod | null>(null);
  const [deletingPeriodId, setDeletingPeriodId] = useState<string | null>(null);
  const [hoveredPeriodId, setHoveredPeriodId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [iapId, periodId]);

  const loadData = async () => {
    if (!iapId) return;

    try {
      const [{ iap }, periodsData] = await Promise.all([
        apiClient.getIAP(iapId),
        apiClient.getData(iapId, 'periods'),
      ]);

      setCurrentIAP({
        id: iap.id,
        name: iap.name || 'Unnamed Incident',
        incidentNumber: iap.incidentNumber || '',
        jurisdiction: iap.jurisdiction || '',
      });

      const periods = periodsData?.data || [];
      console.log('Loaded operational periods:', periods);
      setOperationalPeriods(periods);
    } catch (err) {
      console.error('Failed to load sidebar data:', err);
    }
  };

  const handleDeletePeriod = async (periodToDelete: OperationalPeriod) => {
    if (!iapId) return;

    try {
      await apiClient.deletePeriod(iapId, periodToDelete.id);
      toast.success('Operational period deleted');

      if (periodToDelete.id === periodId) {
        const remaining = operationalPeriods.filter(p => p.id !== periodToDelete.id);
        if (remaining.length > 0) {
          router.push(`/iap/${iapId}/period/${remaining[0].id}/objectives`);
        } else {
          router.push('/');
        }
      }

      loadData();
    } catch (err) {
      toast.error('Failed to delete period');
      console.error('Failed to delete period:', err);
    }
    setDeletingPeriodId(null);
  };

  return (
    <>
      {/* Persistent dark rail — Apple's global-nav is always black regardless
          of light/dark mode; this carries the same idea into a left rail so
          the light parchment workspace has a tile to alternate against. */}
      <aside className="w-72 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-5 pt-5 pb-4 border-b border-sidebar-border">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs font-medium mb-3 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Workspaces
          </button>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-sidebar-foreground/60">Incident</p>
          <h1 className="text-base font-semibold leading-tight text-sidebar-foreground">
            {currentIAP?.name || 'Loading...'}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              Operational Periods
            </p>
            <button
              onClick={() => setShowCreatePeriodModal(true)}
              className="p-1 rounded-full text-sidebar-primary hover:brightness-125 hover:bg-sidebar-accent transition-colors active:scale-95"
              title="Add period"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {operationalPeriods.map((period) => {
              const fmt = (date: string, time: string) =>
                new Date(`${date}T${time}`).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });

              const isActive = period.id === periodId;

              return (
                <div
                  key={period.id}
                  className={`px-3 py-2.5 rounded-lg cursor-pointer transition-colors relative group ${
                    isActive ? 'bg-sidebar-primary' : 'hover:bg-sidebar-accent'
                  }`}
                  onMouseEnter={() => setHoveredPeriodId(period.id)}
                  onMouseLeave={() => setHoveredPeriodId(null)}
                  onClick={() => router.push(`/iap/${iapId}/period/${period.id}/objectives`)}
                >
                  <div className={`flex items-center gap-2 mb-0.5 ${
                    isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground'
                  }`}>
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-sm font-medium">Period {period.periodNumber}</span>
                  </div>
                  <div className={`text-xs pl-5 ${
                    isActive ? 'text-sidebar-primary-foreground/80' : 'text-sidebar-foreground/60'
                  }`}>
                    {fmt(period.fromDate, period.fromTime)} – {fmt(period.toDate, period.toTime)}
                  </div>

                  {hoveredPeriodId === period.id && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingPeriod(period); }}
                        className={`p-1.5 rounded-full transition-colors active:scale-95 ${
                          isActive
                            ? 'bg-white/15 hover:bg-white/25 text-sidebar-primary-foreground'
                            : 'bg-sidebar-accent hover:brightness-125 text-sidebar-foreground'
                        }`}
                        title="Edit period"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingPeriodId(period.id); }}
                        className={`p-1.5 rounded-full transition-colors active:scale-95 ${
                          isActive
                            ? 'bg-white/15 hover:bg-white/25 text-sidebar-primary-foreground'
                            : 'bg-sidebar-accent hover:brightness-125 text-coral'
                        }`}
                        title="Delete period"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {operationalPeriods.length === 0 && (
              <p className="text-xs px-2 py-2 text-sidebar-foreground/60">
                No periods yet
              </p>
            )}
          </div>
        </div>
      </aside>

      {showCreatePeriodModal && (
        <CreatePeriodModal
          iapId={iapId!}
          existingPeriods={operationalPeriods}
          onClose={() => setShowCreatePeriodModal(false)}
          onSuccess={() => {
            setShowCreatePeriodModal(false);
            loadData();
          }}
        />
      )}

      {editingPeriod && (
        <EditPeriodModal
          iapId={iapId!}
          period={editingPeriod}
          onClose={() => setEditingPeriod(null)}
          onSuccess={() => {
            setEditingPeriod(null);
            loadData();
          }}
        />
      )}

      {deletingPeriodId && (
        <DeleteConfirmationModal
          periodName={operationalPeriods.find(p => p.id === deletingPeriodId)?.periodNumber || ''}
          onConfirm={() => {
            const period = operationalPeriods.find(p => p.id === deletingPeriodId);
            if (period) handleDeletePeriod(period);
          }}
          onCancel={() => setDeletingPeriodId(null)}
        />
      )}
    </>
  );
}

function CreatePeriodModal({
  iapId,
  existingPeriods,
  onClose,
  onSuccess,
}: {
  iapId: string;
  existingPeriods: OperationalPeriod[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    periodNumber: (existingPeriods.length + 1).toString(),
    periodName: '',
    fromDate: '',
    fromTime: '06:00',
    toDate: '',
    toTime: '06:00',
  });
  const [copyFromPrevious, setCopyFromPrevious] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pages = ['objectives', 'personnel', 'assignments', 'communications', 'safety-medical', 'weather', 'action-tracker'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.fromDate || !formData.toDate) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const newPeriodId = crypto.randomUUID();
      const newPeriod = { ...formData, id: newPeriodId };
      const result = await apiClient.createData(iapId, 'periods', newPeriod);
      console.log('Period created, result:', result);

      if (copyFromPrevious && existingPeriods.length > 0 && selectedPages.length > 0) {
        const previousPeriod = existingPeriods[existingPeriods.length - 1];
        let totalItemsCopied = 0;

        for (const page of selectedPages) {
          try {
            let dataTypesToCopy: string[] = [];
            switch (page) {
              case 'objectives': dataTypesToCopy = ['objectives', 'command-emphasis', 'situation']; break;
              case 'personnel': dataTypesToCopy = ['personnel']; break;
              case 'assignments': dataTypesToCopy = ['assignments', 'assignments-prep']; break;
              case 'communications': dataTypesToCopy = ['radio-channels', 'communications-data']; break;
              case 'safety-medical': dataTypesToCopy = ['medical-stations', 'transportation', 'hospitals', 'medical-data', 'safety-data']; break;
              case 'weather': dataTypesToCopy = []; break;
              case 'action-tracker': dataTypesToCopy = ['action-tracker']; break;
              default: dataTypesToCopy = [page];
            }
            for (const dataType of dataTypesToCopy) {
              try {
                const pageData = await apiClient.getData(iapId, `period-${previousPeriod.id}-${dataType}`);
                if (pageData?.data && pageData.data.length > 0) {
                  for (const item of pageData.data) {
                    const copiedItem = { ...item, id: crypto.randomUUID() };
                    await apiClient.createData(iapId, `period-${newPeriodId}-${dataType}`, copiedItem);
                    totalItemsCopied++;
                  }
                }
              } catch (dataTypeErr) {
                console.error(`Failed to copy ${dataType} data:`, dataTypeErr);
              }
            }
          } catch (err) {
            console.error(`Failed to copy ${page} data:`, err);
          }
        }
        if (totalItemsCopied > 0) console.log(`Total items copied: ${totalItemsCopied}`);
      }

      toast.success('Operational period created');
      await new Promise(resolve => setTimeout(resolve, 100));
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create period');
      setLoading(false);
    }
  };

  const togglePage = (page: string) => {
    setSelectedPages(prev => prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create New Operational Period</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Period Number</label>
              <input type="text" required value={formData.periodNumber} onChange={(e) => setFormData({ ...formData, periodNumber: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Period Name</label>
              <input type="text" value={formData.periodName} onChange={(e) => setFormData({ ...formData, periodName: e.target.value })} placeholder="e.g., Extended Attack" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">From Date</label>
              <input type="date" required value={formData.fromDate} onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">From Time</label>
              <input type="time" required value={formData.fromTime} onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">To Date</label>
              <input type="date" required value={formData.toDate} onChange={(e) => setFormData({ ...formData, toDate: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">To Time</label>
              <input type="time" required value={formData.toTime} onChange={(e) => setFormData({ ...formData, toTime: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
          </div>
          {existingPeriods.length > 0 && (
            <>
              <div className="pt-4 border-t border-slate-700">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={copyFromPrevious} onChange={(e) => { setCopyFromPrevious(e.target.checked); if (!e.target.checked) setSelectedPages([]); }} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-sage focus:ring-sage" />
                  Copy data from Period {existingPeriods[existingPeriods.length - 1].periodNumber}
                </label>
              </div>
              {copyFromPrevious && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Select pages to copy:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {pages.map((page) => (
                      <label key={page} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={selectedPages.includes(page)} onChange={() => togglePage(page)} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-sage focus:ring-sage" />
                        {page.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {error && <div className="bg-coral/10 border border-coral/40 rounded-2xl p-3"><p className="text-sm text-coral">{error}</p></div>}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="bg-sage text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-sage-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating...' : 'Create Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPeriodModal({
  iapId,
  period,
  onClose,
  onSuccess,
}: {
  iapId: string;
  period: OperationalPeriod;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    periodNumber: period.periodNumber,
    periodName: period.periodName || '',
    fromDate: period.fromDate,
    fromTime: period.fromTime,
    toDate: period.toDate,
    toTime: period.toTime,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!formData.fromDate || !formData.toDate) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      const updatedPeriod = {
        periodNumber: formData.periodNumber,
        periodName: formData.periodName,
        fromDate: formData.fromDate,
        fromTime: formData.fromTime,
        toDate: formData.toDate,
        toTime: formData.toTime,
      };
      await apiClient.updatePeriod(iapId, period.id, updatedPeriod);
      toast.success('Operational period updated');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to update period:', err);
      setError(err.message || 'Failed to update period');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit Operational Period</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Period Number</label>
              <input type="text" required value={formData.periodNumber} onChange={(e) => setFormData({ ...formData, periodNumber: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Period Name</label>
              <input type="text" value={formData.periodName} onChange={(e) => setFormData({ ...formData, periodName: e.target.value })} placeholder="e.g., Extended Attack" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">From Date</label>
              <input type="date" required value={formData.fromDate} onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">From Time</label>
              <input type="time" required value={formData.fromTime} onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">To Date</label>
              <input type="date" required value={formData.toDate} onChange={(e) => setFormData({ ...formData, toDate: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">To Time</label>
              <input type="time" required value={formData.toTime} onChange={(e) => setFormData({ ...formData, toTime: e.target.value })} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent" />
            </div>
          </div>
          {error && <div className="bg-coral/10 border border-coral/40 rounded-2xl p-3"><p className="text-sm text-coral">{error}</p></div>}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="bg-sage text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-sage-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Updating...' : 'Update Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({
  periodName,
  onConfirm,
  onCancel,
}: {
  periodName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Delete Operational Period</h2>
        </div>
        <div className="px-6 py-6">
          <p className="text-slate-300 mb-4">Are you sure you want to delete <span className="font-semibold text-white">Period {periodName}</span>?</p>
          <p className="text-sm text-slate-400">This action cannot be undone. All data associated with this period will be permanently deleted.</p>
        </div>
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
          <button onClick={onConfirm} className="bg-coral text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-coral-hover transition-colors">Delete Period</button>
        </div>
      </div>
    </div>
  );
}
