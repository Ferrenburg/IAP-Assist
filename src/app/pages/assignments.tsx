'use client';

import { PageHeader } from '../components/page-header';
import { Plus, FileText, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';

interface Assignment {
  id: string;
  division: string;
  branch: string;
  supervisor: string;
  workAssignment: string;
  resources: string[];
  reportingLocation: string;
  specialInstructions: string;
  communications: string;
}

export function Assignments() {
  const { iapId } = useParams();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [divisions, setDivisions] = useState<Array<{ position: string; name: string; type: 'division' }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string; directorName: string; type: 'branch' }>>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    division: '',
    branch: '',
    supervisor: '',
    workAssignment: '',
    resources: '',
    reportingLocation: '',
    specialInstructions: '',
    communications: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAssignments();
    loadDivisions();
    loadBranches();
  }, [iapId]);

  const loadAssignments = async () => {
    if (!iapId) return;

    try {
      setLoading(true);
      const { data } = await apiClient.getData(iapId, 'assignments');
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDivisions = async () => {
    if (!iapId) return;

    try {
      const { data } = await apiClient.getData(iapId, 'organization');
      const divisionData = data
        .filter((item: any) => item.type === 'division')
        .map((item: any) => ({
          position: item.position,
          name: item.name,
          type: 'division' as const,
        }));
      setDivisions(divisionData);
    } catch (err) {
      console.error('Failed to load divisions:', err);
    }
  };

  const loadBranches = async () => {
    if (!iapId) return;

    try {
      const { data } = await apiClient.getData(iapId, 'branches');
      setBranches((data || []).map((branch: any) => ({
        ...branch,
        type: 'branch' as const,
      })));
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  const handleAdd = async () => {
    if (!iapId || !formData.division.trim() || !formData.supervisor.trim()) return;

    try {
      setSaving(true);
      const resources = formData.resources.split(',').map(r => r.trim()).filter(r => r);

      await apiClient.createData(iapId, 'assignments', {
        ...formData,
        resources,
      });

      setFormData({
        division: '',
        branch: '',
        supervisor: '',
        workAssignment: '',
        resources: '',
        reportingLocation: '',
        specialInstructions: '',
        communications: '',
      });
      setShowAddForm(false);
      await loadAssignments();
    } catch (err) {
      console.error('Failed to add assignment:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!iapId) return;

    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    try {
      setSaving(true);
      await apiClient.updateData(iapId, 'assignments', id, assignment);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update assignment:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!iapId || !confirm('Delete this assignment?')) return;

    try {
      await apiClient.deleteData(iapId, 'assignments', id);
      await loadAssignments();
    } catch (err) {
      console.error('Failed to delete assignment:', err);
    }
  };

  const handleEditChange = (id: string, field: string, value: string | string[]) => {
    setAssignments(assignments.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="Assignments"
        description="Branch, division, and resource assignments (ICS 204)"
        action={
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Assignment
          </button>
        }
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Auto-populates ICS 204</p>
            <p className="text-sm text-yellow-700 mt-0.5">Assignment entries will populate Assignment List forms (ICS 204) for each branch, division, group, or resource.</p>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg border-2 border-yellow-500 mb-6 overflow-hidden">
            <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">New Assignment</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignment To*</label>
                  <select
                    required
                    value={formData.division}
                    onChange={(e) => {
                      const selectedDivision = divisions.find(d => d.position === e.target.value);
                      const selectedBranch = branches.find(b => b.name === e.target.value);

                      setFormData({
                        ...formData,
                        division: e.target.value,
                        supervisor: selectedDivision?.name || selectedBranch?.directorName || '',
                        branch: selectedBranch ? selectedBranch.name : ''
                      });
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Select assignment target...</option>
                    {branches.length > 0 && (
                      <optgroup label="Branches">
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.name}>
                            {branch.name} {branch.directorName && `- ${branch.directorName}`}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {divisions.length > 0 && (
                      <optgroup label="Divisions / Groups">
                        {divisions.map((div) => (
                          <option key={div.position} value={div.position}>
                            {div.position} {div.name && `- ${div.name}`}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {divisions.length === 0 && branches.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No branches or divisions/groups found. Add them in the Organization tab first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Supervisor / Director*</label>
                  <input
                    type="text"
                    required
                    value={formData.supervisor}
                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Assignment</label>
                <textarea
                  rows={3}
                  value={formData.workAssignment}
                  onChange={(e) => setFormData({ ...formData, workAssignment: e.target.value })}
                  placeholder="Describe the tactical assignment..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Resources (comma-separated)</label>
                <input
                  type="text"
                  value={formData.resources}
                  onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
                  placeholder="e.g., Engine 5411, Engine 5420, Dozer D241"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reporting Location</label>
                  <input
                    type="text"
                    value={formData.reportingLocation}
                    onChange={(e) => setFormData({ ...formData, reportingLocation: e.target.value })}
                    placeholder="e.g., Staging Area"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Communications</label>
                  <input
                    type="text"
                    value={formData.communications}
                    onChange={(e) => setFormData({ ...formData, communications: e.target.value })}
                    placeholder="e.g., TAC-1 (154.280)"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Special Instructions</label>
                <textarea
                  rows={2}
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                  placeholder="Safety concerns, coordination notes, etc."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !formData.division.trim() || !formData.supervisor.trim()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {assignments.map((assignment) => (
            <div key={assignment.id} className={`bg-white rounded-lg border overflow-hidden ${editingId === assignment.id ? 'border-yellow-500' : 'border-slate-200'}`}>
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{assignment.division}</h3>
                    {assignment.branch && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Branch
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {assignment.branch ? 'Branch Director' : 'Supervisor'}: {assignment.supervisor}
                  </p>
                </div>
                <div className="flex gap-2">
                  {editingId === assignment.id ? (
                    <>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(assignment.id)}
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
                        onClick={() => setEditingId(assignment.id)}
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Work Assignment</label>
                  {editingId === assignment.id ? (
                    <textarea
                      rows={3}
                      value={assignment.workAssignment}
                      onChange={(e) => handleEditChange(assignment.id, 'workAssignment', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                    />
                  ) : (
                    <p className="text-sm text-slate-900">{assignment.workAssignment || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Resources Assigned</label>
                  {editingId === assignment.id ? (
                    <input
                      type="text"
                      value={assignment.resources.join(', ')}
                      onChange={(e) => handleEditChange(assignment.id, 'resources', e.target.value.split(',').map(r => r.trim()))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {assignment.resources.map((resource, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {resource}
                        </span>
                      ))}
                      {assignment.resources.length === 0 && <span className="text-sm text-slate-500">No resources assigned</span>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Reporting Location</label>
                    {editingId === assignment.id ? (
                      <input
                        type="text"
                        value={assignment.reportingLocation}
                        onChange={(e) => handleEditChange(assignment.id, 'reportingLocation', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm text-slate-900">{assignment.reportingLocation || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Communications</label>
                    {editingId === assignment.id ? (
                      <input
                        type="text"
                        value={assignment.communications}
                        onChange={(e) => handleEditChange(assignment.id, 'communications', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    ) : (
                      <p className="text-sm text-slate-900">{assignment.communications || '-'}</p>
                    )}
                  </div>
                </div>

                {(assignment.specialInstructions || editingId === assignment.id) && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Special Instructions</label>
                    {editingId === assignment.id ? (
                      <textarea
                        rows={2}
                        value={assignment.specialInstructions}
                        onChange={(e) => handleEditChange(assignment.id, 'specialInstructions', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                      />
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        <p className="text-sm text-amber-900">{assignment.specialInstructions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {assignments.length === 0 && !showAddForm && (
            <div className="bg-white rounded-lg border border-slate-200 py-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-2">No assignments yet</p>
              <p className="text-sm text-slate-500 mb-4">Add your first division assignment to get started</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Assignment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
