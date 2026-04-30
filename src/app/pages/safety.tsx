'use client';

import { PageHeader } from '../components/page-header';
import { FileText, AlertTriangle, Plus, Trash2, Save, Loader2, CheckCircle2, Cloud } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';
import { useAutosave } from '../../hooks/use-autosave';

interface Hazard {
  id: string;
  title: string;
  description: string;
}

export function Safety() {
  const { iapId } = useParams();
  const [safetyMessage, setSafetyMessage] = useState('');
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [mitigations, setMitigations] = useState('');
  const [loading, setLoading] = useState(true);
  const [newHazard, setNewHazard] = useState({ title: '', description: '' });
  const [showAddHazard, setShowAddHazard] = useState(false);
  const [siteSafetyPlanRequired, setSiteSafetyPlanRequired] = useState<boolean | null>(null);
  const [siteSafetyPlanLocation, setSiteSafetyPlanLocation] = useState('');

  // Autosave for safety message
  const saveSafetyMessage = useCallback(async (data: { message: string }) => {
    if (!iapId) return;
    const { data: existingData } = await apiClient.getData(iapId, 'safety');
    const existing = existingData.find((item: any) => item.itemType === 'message');

    if (existing) {
      await apiClient.updateData(iapId, 'safety', existing.id, {
        itemType: 'message',
        content: data.message,
      });
    } else {
      await apiClient.createData(iapId, 'safety', {
        itemType: 'message',
        content: data.message,
      });
    }
  }, [iapId]);

  const { saving: savingMessage, lastSaved: lastSavedMessage } = useAutosave({
    data: { message: safetyMessage },
    onSave: saveSafetyMessage,
    enabled: !loading && !!iapId,
  });

  // Autosave for mitigations
  const saveMitigations = useCallback(async (data: { mitigations: string }) => {
    if (!iapId) return;
    const { data: existingData } = await apiClient.getData(iapId, 'safety');
    const existing = existingData.find((item: any) => item.itemType === 'mitigations');

    if (existing) {
      await apiClient.updateData(iapId, 'safety', existing.id, {
        itemType: 'mitigations',
        content: data.mitigations,
      });
    } else {
      await apiClient.createData(iapId, 'safety', {
        itemType: 'mitigations',
        content: data.mitigations,
      });
    }
  }, [iapId]);

  const { saving: savingMitigations, lastSaved: lastSavedMitigations } = useAutosave({
    data: { mitigations },
    onSave: saveMitigations,
    enabled: !loading && !!iapId,
  });

  // Autosave for site safety plan
  const saveSiteSafetyPlan = useCallback(async (data: { required: boolean | null; location: string }) => {
    if (!iapId) return;
    const { data: existingData } = await apiClient.getData(iapId, 'safety');
    const existing = existingData.find((item: any) => item.itemType === 'siteSafetyPlan');

    if (existing) {
      await apiClient.updateData(iapId, 'safety', existing.id, {
        itemType: 'siteSafetyPlan',
        required: data.required,
        location: data.location,
      });
    } else {
      await apiClient.createData(iapId, 'safety', {
        itemType: 'siteSafetyPlan',
        required: data.required,
        location: data.location,
      });
    }
  }, [iapId]);

  const { saving: savingSiteSafetyPlan, lastSaved: lastSavedSiteSafetyPlan } = useAutosave({
    data: { required: siteSafetyPlanRequired, location: siteSafetyPlanLocation },
    onSave: saveSiteSafetyPlan,
    enabled: !loading && !!iapId,
  });

  useEffect(() => {
    loadSafety();
  }, [iapId]);

  const loadSafety = async () => {
    if (!iapId) return;

    try {
      setLoading(true);
      const { data } = await apiClient.getData(iapId, 'safety');

      const messageItem = data.find((item: any) => item.itemType === 'message');
      const mitigationsItem = data.find((item: any) => item.itemType === 'mitigations');
      const siteSafetyPlanItem = data.find((item: any) => item.itemType === 'siteSafetyPlan');
      const hazardItems = data.filter((item: any) => item.itemType === 'hazard');

      setSafetyMessage(messageItem?.content || '');
      setMitigations(mitigationsItem?.content || '');
      setSiteSafetyPlanRequired(siteSafetyPlanItem?.required ?? null);
      setSiteSafetyPlanLocation(siteSafetyPlanItem?.location || '');
      setHazards(hazardItems);
    } catch (err) {
      console.error('Failed to load safety:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleAddHazard = async () => {
    if (!iapId || !newHazard.title.trim()) return;

    try {
      await apiClient.createData(iapId, 'safety', {
        itemType: 'hazard',
        title: newHazard.title,
        description: newHazard.description,
      });

      setNewHazard({ title: '', description: '' });
      setShowAddHazard(false);
      await loadSafety();
    } catch (err) {
      console.error('Failed to add hazard:', err);
    }
  };

  const handleDeleteHazard = async (id: string) => {
    if (!iapId || !confirm('Delete this hazard?')) return;

    try {
      await apiClient.deleteData(iapId, 'safety', id);
      await loadSafety();
    } catch (err) {
      console.error('Failed to delete hazard:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading safety plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="Safety"
        description="Safety message and hazard mitigation (ICS 208)"
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Auto-populates ICS 208</p>
            <p className="text-sm text-yellow-700 mt-0.5">Safety information entered here will populate the Safety Message/Plan (ICS 208).</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Safety Message</h3>
              <p className="text-sm text-slate-600 mt-1">Primary safety concerns and priorities for this operational period</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {savingMessage ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
                  <span className="text-slate-600">Saving...</span>
                </>
              ) : lastSavedMessage ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-slate-600">Saved {lastSavedMessage.toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="p-6">
            <textarea
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              rows={4}
              value={safetyMessage}
              onChange={(e) => setSafetyMessage(e.target.value)}
              placeholder="Enter safety message..."
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900">Identified Hazards</h3>
            </div>
            <button
              onClick={() => setShowAddHazard(true)}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Hazard
            </button>
          </div>
          <div className="p-6">
            {showAddHazard && (
              <div className="border-2 border-amber-500 bg-amber-50 rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Hazard Title*</label>
                    <input
                      type="text"
                      value={newHazard.title}
                      onChange={(e) => setNewHazard({ ...newHazard, title: e.target.value })}
                      placeholder="e.g., Overhead Power Lines"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                    <textarea
                      rows={2}
                      value={newHazard.description}
                      onChange={(e) => setNewHazard({ ...newHazard, description: e.target.value })}
                      placeholder="Describe the hazard and any relevant details..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowAddHazard(false);
                        setNewHazard({ title: '', description: '' });
                      }}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddHazard}
                      disabled={!newHazard.title.trim()}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                    >
                      Add Hazard
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {hazards.map((hazard) => (
                <div key={hazard.id} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-amber-900 mb-2">{hazard.title}</h4>
                      <p className="text-sm text-amber-800">{hazard.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteHazard(hazard.id)}
                      className="text-red-500 hover:text-red-700 ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {hazards.length === 0 && !showAddHazard && (
                <div className="text-center py-6 text-sm text-slate-500">
                  No hazards identified. Add hazards to track safety concerns.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Site Safety Plan</h3>
              <p className="text-sm text-slate-600 mt-1">Is a site safety plan required for this incident?</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {savingSiteSafetyPlan ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
                  <span className="text-slate-600">Saving...</span>
                </>
              ) : lastSavedSiteSafetyPlan ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-slate-600">Saved {lastSavedSiteSafetyPlan.toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="siteSafetyPlanRequired"
                  checked={siteSafetyPlanRequired === true}
                  onChange={() => setSiteSafetyPlanRequired(true)}
                  className="w-4 h-4 text-yellow-600 focus:ring-2 focus:ring-yellow-500"
                />
                <span className="text-sm font-medium text-slate-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="siteSafetyPlanRequired"
                  checked={siteSafetyPlanRequired === false}
                  onChange={() => setSiteSafetyPlanRequired(false)}
                  className="w-4 h-4 text-yellow-600 focus:ring-2 focus:ring-yellow-500"
                />
                <span className="text-sm font-medium text-slate-700">No</span>
              </label>
            </div>

            {siteSafetyPlanRequired === true && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Approved site safety plans located at:
                </label>
                <input
                  type="text"
                  value={siteSafetyPlanLocation}
                  onChange={(e) => setSiteSafetyPlanLocation(e.target.value)}
                  placeholder="Enter location of approved site safety plans..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Mitigation Measures</h3>
              <p className="text-sm text-slate-600 mt-1">Controls and procedures to reduce identified risks</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {savingMitigations ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
                  <span className="text-slate-600">Saving...</span>
                </>
              ) : lastSavedMitigations ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-slate-600">Saved {lastSavedMitigations.toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="p-6">
            <textarea
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              rows={8}
              value={mitigations}
              onChange={(e) => setMitigations(e.target.value)}
              placeholder="Enter mitigation measures..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
