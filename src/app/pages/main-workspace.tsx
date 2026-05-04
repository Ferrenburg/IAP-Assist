'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Users, Radio, Briefcase, Calendar, FileOutput, Shield as ShieldIcon, AlertTriangle, LogOut, Shield, ChevronRight, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../utils/api-client';
import { toast } from 'sonner';
import opLogo from '../../imports/OP_Logo.png';

interface IAP {
  id: string;
  name: string;
  incidentNumber: string;
  jurisdiction: string;
  currentOP: string;
  status: 'draft' | 'in-progress' | 'ready' | 'archived';
  updatedAt: string;
  completionPercent: number;
}

export function MainWorkspace() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [iaps, setIaps] = useState<IAP[]>([]);
  const [archivedIaps, setArchivedIaps] = useState<IAP[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIAPId, setHoveredIAPId] = useState<string | null>(null);
  const [deleteConfirmIAP, setDeleteConfirmIAP] = useState<IAP | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadIAPs();
  }, []);

  const loadIAPs = async () => {
    try {
      const { iaps: fetchedIaps } = await apiClient.getIAPs();
      const activeIaps = fetchedIaps.filter((iap: any) => iap.status !== 'archived');
      const archived = fetchedIaps.filter((iap: any) => iap.status === 'archived');
      setIaps(activeIaps);
      setArchivedIaps(archived);
    } catch (error) {
      console.error('Failed to load IAPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleOpenIAP = async (iapId: string) => {
    try {
      // Load periods for this IAP
      const periodsData = await apiClient.getData(iapId, 'periods');
      const periods = periodsData?.data || [];

      console.log('Opening IAP, found periods:', periods);

      if (periods.length > 0) {
        // Navigate to first period
        router.push(`/iap/${iapId}/period/${periods[0].id}/objectives`);
      } else {
        // No periods - user needs to create one
        // Just navigate to the IAP page, they can create a period from there
        toast.error('This IAP has no operational periods. Please create one.');
      }
    } catch (error) {
      console.error('Failed to open IAP:', error);
    }
  };

  const handleDeleteIAP = async (iap: IAP) => {
    try {
      await apiClient.deleteIAP(iap.id);
      await loadIAPs();
      setDeleteConfirmIAP(null);
      toast.success('IAP deleted successfully');
    } catch (error) {
      console.error('Failed to delete IAP:', error);
      toast.error('Failed to delete IAP');
    }
  };

  const handleArchiveIAP = async (iap: IAP) => {
    try {
      await apiClient.updateIAP(iap.id, { ...iap, status: 'archived' });
      await loadIAPs();
      toast.success('IAP archived successfully');
    } catch (error) {
      console.error('Failed to archive IAP:', error);
      toast.error('Failed to archive IAP');
    }
  };

  const handleUnarchiveIAP = async (iap: IAP) => {
    try {
      await apiClient.updateIAP(iap.id, { ...iap, status: 'in-progress' });
      await loadIAPs();
      toast.success('IAP restored from archive');
    } catch (error) {
      console.error('Failed to unarchive IAP:', error);
      toast.error('Failed to restore IAP');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700 bg-[#000000]">
          <img src={opLogo.src} alt="OpPeriod" className="h-8 mb-3" />
          <p className="text-sm text-slate-400">{user?.email}</p>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#000000]">
          <div className="p-4">
            <div className="mb-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-yellow-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New IAP
              </button>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Active IAPs</p>
              <div className="space-y-1">
                {iaps.map((iap) => (
                  <div
                    key={iap.id}
                    className="relative"
                    onMouseEnter={() => setHoveredIAPId(iap.id)}
                    onMouseLeave={() => setHoveredIAPId(null)}
                  >
                    <button
                      onClick={() => handleOpenIAP(iap.id)}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors text-slate-300 hover:bg-slate-800"
                    >
                      <div className="font-medium truncate">{iap.name}</div>
                      <div className="text-xs opacity-75 truncate">{iap.incidentNumber}</div>
                    </button>

                    {hoveredIAPId === iap.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveIAP(iap);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded bg-amber-600 hover:bg-amber-700 transition-colors"
                        title="Archive IAP"
                      >
                        <Archive className="w-3.5 h-3.5 text-white" />
                      </button>
                    )}
                  </div>
                ))}
                {iaps.length === 0 && (
                  <p className="text-sm text-slate-500 px-3 py-2">No active IAPs</p>
                )}
              </div>
            </div>

            {archivedIaps.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 hover:text-slate-300 transition-colors"
                >
                  <span>Archived IAPs ({archivedIaps.length})</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-90' : ''}`} />
                </button>
                {showArchived && (
                  <div className="space-y-1">
                    {archivedIaps.map((iap) => (
                      <div
                        key={iap.id}
                        className="relative"
                        onMouseEnter={() => setHoveredIAPId(iap.id)}
                        onMouseLeave={() => setHoveredIAPId(null)}
                      >
                        <button
                          onClick={() => handleOpenIAP(iap.id)}
                          className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors text-slate-500 hover:bg-slate-800"
                        >
                          <div className="font-medium truncate">{iap.name}</div>
                          <div className="text-xs opacity-75 truncate">{iap.incidentNumber}</div>
                        </button>

                        {hoveredIAPId === iap.id && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnarchiveIAP(iap);
                              }}
                              className="p-1.5 rounded bg-yellow-600 hover:bg-yellow-700 transition-colors"
                              title="Restore IAP"
                            >
                              <ArchiveRestore className="w-3.5 h-3.5 text-white" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmIAP(iap);
                              }}
                              className="p-1.5 rounded bg-red-600 hover:bg-red-700 transition-colors"
                              title="Delete IAP"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 space-y-2 bg-[#000000]">
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome to OpPeriod</h1>
            <p className="text-lg text-slate-600">Streamline your incident action plan creation and management</p>
          </div>

          {iaps.length > 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Your Active IAPs</h2>
              <p className="text-slate-600 mb-6">
                Click on any IAP in the sidebar to open its workspace and manage operational periods.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {iaps.slice(0, 4).map((iap) => (
                  <button
                    key={iap.id}
                    onClick={() => handleOpenIAP(iap.id)}
                    className="text-left p-4 border border-slate-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                  >
                    <div className="font-semibold text-slate-900 mb-1">{iap.name}</div>
                    <div className="text-sm text-slate-600">{iap.incidentNumber}</div>
                    <div className="text-xs text-slate-500 mt-2">{iap.jurisdiction}</div>
                  </button>
                ))}
              </div>
              {iaps.length > 4 && (
                <p className="text-sm text-slate-500 mt-4">
                  And {iaps.length - 4} more IAP{iaps.length - 4 > 1 ? 's' : ''} in the sidebar
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No Active IAPs</h2>
              <p className="text-slate-600 mb-6">Create your first Incident Action Plan to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New IAP
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateIAPModal onClose={() => setShowCreateModal(false)} onSuccess={loadIAPs} />
      )}

      {deleteConfirmIAP && (
        <DeleteConfirmModal
          iapName={deleteConfirmIAP.name}
          onConfirm={() => handleDeleteIAP(deleteConfirmIAP)}
          onCancel={() => setDeleteConfirmIAP(null)}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({
  iapName,
  onConfirm,
  onCancel,
}: {
  iapName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Delete IAP</h2>
        </div>

        <div className="px-6 py-6">
          <p className="text-slate-700 mb-2">
            Are you sure you want to delete <strong className="text-slate-900">"{iapName}"</strong>?
          </p>
          <p className="text-sm text-slate-600">
            This will permanently delete all operational periods and data associated with this IAP. This action cannot be undone.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Delete IAP
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateIAPModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    incidentNumber: '',
    jurisdiction: '',
    incidentCommander: '',
    startDate: '',
    description: '',
  });
  const [periodData, setPeriodData] = useState({
    periodName: '',
    periodNumber: '1',
    startDateTime: '',
    endDateTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Calculate end date/time 12 hours after start
  const handleStartDateTimeChange = (value: string) => {
    if (value) {
      // Parse the datetime-local value (format: YYYY-MM-DDTHH:mm)
      const start = new Date(value);
      const end = new Date(start.getTime() + 12 * 60 * 60 * 1000); // Add 12 hours

      // Format back to datetime-local format
      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, '0');
      const day = String(end.getDate()).padStart(2, '0');
      const hours = String(end.getHours()).padStart(2, '0');
      const minutes = String(end.getMinutes()).padStart(2, '0');
      const endStr = `${year}-${month}-${day}T${hours}:${minutes}`;

      setPeriodData({ ...periodData, startDateTime: value, endDateTime: endStr });
    } else {
      setPeriodData({ ...periodData, startDateTime: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name || !formData.incidentNumber || !formData.jurisdiction) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!periodData.startDateTime || !periodData.endDateTime) {
        setError('Please set operational period start and end date/time');
        setLoading(false);
        return;
      }

      // Parse datetime-local into separate date and time
      let parsedStartDate = '';
      let parsedStartTime = '';

      if (formData.startDate) {
        const dt = new Date(formData.startDate);
        parsedStartDate = dt.toISOString().split('T')[0]; // YYYY-MM-DD
        const hours = String(dt.getHours()).padStart(2, '0');
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        parsedStartTime = `${hours}:${minutes}`; // HH:MM
      }

      const { iap } = await apiClient.createIAP({
        ...formData,
        startDate: parsedStartDate,
        startTime: parsedStartTime,
      });

      // Create initial operational period
      const startDt = new Date(periodData.startDateTime);
      const endDt = new Date(periodData.endDateTime);

      const periodId = crypto.randomUUID();
      const initialPeriod = {
        id: periodId,
        periodNumber: periodData.periodNumber,
        periodName: periodData.periodName,
        fromDate: startDt.toISOString().split('T')[0],
        fromTime: `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`,
        toDate: endDt.toISOString().split('T')[0],
        toTime: `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`,
      };

      // Create the initial period
      await apiClient.createData(iap.id, 'periods', initialPeriod);
      console.log('Created initial period:', periodId);

      onSuccess();
      onClose();
      router.push(`/iap/${iap.id}/period/${periodId}/objectives`);
    } catch (err: any) {
      setError(err.message || 'Failed to create IAP');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create New IAP</h2>
          <p className="text-sm text-slate-600 mt-1">Set up a new Incident Action Plan workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Incident Name*</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Willow Creek Fire"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Incident Number*</label>
            <input
              type="text"
              required
              value={formData.incidentNumber}
              onChange={(e) => setFormData({ ...formData, incidentNumber: e.target.value })}
              placeholder="e.g., CA-SHF-000123"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Jurisdiction*</label>
              <input
                type="text"
                required
                value={formData.jurisdiction}
                onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                placeholder="e.g., Shasta County"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Incident Commander</label>
              <input
                type="text"
                value={formData.incidentCommander}
                onChange={(e) => setFormData({ ...formData, incidentCommander: e.target.value })}
                placeholder="e.g., John Smith"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Incident Start Date/Time</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional incident description or notes..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Operational Period Section */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Initial Operational Period</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Period Name</label>
                <input
                  type="text"
                  value={periodData.periodName}
                  onChange={(e) => setPeriodData({ ...periodData, periodName: e.target.value })}
                  placeholder="e.g., Initial Response"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Period Number</label>
                <input
                  type="text"
                  value={periodData.periodNumber}
                  onChange={(e) => setPeriodData({ ...periodData, periodNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date/Time*</label>
                <input
                  type="datetime-local"
                  required
                  value={periodData.startDateTime}
                  onChange={(e) => handleStartDateTimeChange(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date/Time*</label>
                <input
                  type="datetime-local"
                  required
                  value={periodData.endDateTime}
                  onChange={(e) => setPeriodData({ ...periodData, endDateTime: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              End date/time defaults to 12 hours after start, but can be adjusted
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create IAP Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
