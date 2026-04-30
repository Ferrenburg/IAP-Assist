'use client';

import { PageHeader } from '../components/page-header';
import { Plus, FileText, Edit2, Trash2, Save, X, Loader2, CheckCircle2, Cloud } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';
import { useAutosave } from '../../hooks/use-autosave';

interface Objective {
  id: string;
  number: number;
  description: string;
  measureOfSuccess: string;
}

export function Objectives() {
  const { iapId } = useParams();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [commandEmphasis, setCommandEmphasis] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ description: '', measureOfSuccess: '' });
  const [saving, setSaving] = useState(false);

  // Autosave for command emphasis
  const saveCommandEmphasis = useCallback(async (data: { commandEmphasis: string }) => {
    if (!iapId) return;
    await apiClient.updateIAP(iapId, { commandEmphasis: data.commandEmphasis });
  }, [iapId]);

  const { saving: autosaving, lastSaved } = useAutosave({
    data: { commandEmphasis },
    onSave: saveCommandEmphasis,
    enabled: !loading && !!iapId,
  });

  useEffect(() => {
    loadObjectives();
  }, [iapId]);

  const loadObjectives = async () => {
    if (!iapId) return;

    try {
      setLoading(true);
      const [{ objectives: data }, { iap }] = await Promise.all([
        apiClient.getObjectives(iapId),
        apiClient.getIAP(iapId),
      ]);
      setObjectives(data.sort((a: any, b: any) => a.number - b.number));
      setCommandEmphasis(iap.commandEmphasis || '');
    } catch (err) {
      console.error('Failed to load objectives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!iapId || !formData.description.trim()) return;

    try {
      setSaving(true);
      const nextNumber = objectives.length > 0 ? Math.max(...objectives.map(o => o.number)) + 1 : 1;

      await apiClient.createObjective(iapId, {
        number: nextNumber,
        description: formData.description,
        measureOfSuccess: formData.measureOfSuccess,
      });

      setFormData({ description: '', measureOfSuccess: '' });
      setShowAddForm(false);
      await loadObjectives();
    } catch (err) {
      console.error('Failed to add objective:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!iapId) return;

    const objective = objectives.find(o => o.id === id);
    if (!objective) return;

    try {
      setSaving(true);
      await apiClient.updateObjective(iapId, id, {
        description: objective.description,
        measureOfSuccess: objective.measureOfSuccess,
      });

      setEditingId(null);
    } catch (err) {
      console.error('Failed to update objective:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!iapId || !confirm('Delete this objective?')) return;

    try {
      await apiClient.deleteObjective(iapId, id);
      await loadObjectives();
    } catch (err) {
      console.error('Failed to delete objective:', err);
    }
  };

  const handleEditChange = (id: string, field: string, value: string) => {
    setObjectives(objectives.map(obj =>
      obj.id === id ? { ...obj, [field]: value } : obj
    ));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading objectives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="Objectives"
        description="Define incident objectives and command emphasis (ICS 202)"
        action={
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Objective
          </button>
        }
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Auto-populates ICS 202</p>
            <p className="text-sm text-yellow-700 mt-0.5">Objectives entered here will automatically appear on the Incident Objectives form (ICS 202) in your IAP packet.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Incident Objectives</h3>
          </div>
          <div className="p-6 space-y-4">
            {showAddForm && (
              <div className="border-2 border-yellow-500 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold">
                    {objectives.length + 1}
                  </span>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Objective*</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter the objective..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Measure of Success</label>
                    <textarea
                      rows={2}
                      value={formData.measureOfSuccess}
                      onChange={(e) => setFormData({ ...formData, measureOfSuccess: e.target.value })}
                      placeholder="How will success be measured?"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdd}
                      disabled={saving || !formData.description.trim()}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Objective
                    </button>
                  </div>
                </div>
              </div>
            )}

            {objectives.map((obj) => (
              <div key={obj.id} className={`border rounded-lg p-4 ${editingId === obj.id ? 'border-yellow-500 bg-yellow-50' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold">
                    {obj.number}
                  </span>
                  <div className="flex gap-2">
                    {editingId === obj.id ? (
                      <>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdate(obj.id)}
                          disabled={saving}
                          className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingId(obj.id)}
                          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(obj.id)}
                          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Objective</label>
                    {editingId === obj.id ? (
                      <textarea
                        rows={2}
                        value={obj.description}
                        onChange={(e) => handleEditChange(obj.id, 'description', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 mt-1">{obj.description}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Measure of Success</label>
                    {editingId === obj.id ? (
                      <textarea
                        rows={2}
                        value={obj.measureOfSuccess}
                        onChange={(e) => handleEditChange(obj.id, 'measureOfSuccess', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-slate-900 mt-1">{obj.measureOfSuccess || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {objectives.length === 0 && !showAddForm && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium mb-2">No objectives yet</p>
                <p className="text-sm text-slate-500 mb-4">Add your first incident objective to get started</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Objective
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Command Emphasis</h3>
            <div className="flex items-center gap-2 text-xs">
              {autosaving ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
                  <span className="text-slate-600">Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-slate-600">Saved {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="p-6">
            <textarea
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              rows={4}
              value={commandEmphasis}
              onChange={(e) => setCommandEmphasis(e.target.value)}
              placeholder="Enter command emphasis, priorities, or special considerations..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
