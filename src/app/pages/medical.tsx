'use client';

import { PageHeader } from '../components/page-header';
import { Plus, FileText, Edit2, Trash2, Save, X, Loader2, CheckCircle2, Cloud } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';
import { useAutosave } from '../../hooks/use-autosave';
import { formatPhoneNumber } from '../../utils/phone-formatter';

interface MedicalFacility {
  id: string;
  type: string;
  name: string;
  location: string;
  paramedic: string;
  contact: string;
  phone: string;
}

export function Medical() {
  const { iapId } = useParams();
  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [procedures, setProcedures] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Med Aid Station',
    name: '',
    location: '',
    paramedic: 'Yes',
    contact: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  // Autosave for procedures
  const saveProcedures = useCallback(async (data: { procedures: string }) => {
    if (!iapId) return;
    const { data: existingData } = await apiClient.getData(iapId, 'medical');
    const existing = existingData.find((item: any) => item.itemType === 'procedures');

    if (existing) {
      await apiClient.updateData(iapId, 'medical', existing.id, {
        itemType: 'procedures',
        content: data.procedures,
      });
    } else {
      await apiClient.createData(iapId, 'medical', {
        itemType: 'procedures',
        content: data.procedures,
      });
    }
  }, [iapId]);

  const { saving: savingProcedures, lastSaved: lastSavedProcedures } = useAutosave({
    data: { procedures },
    onSave: saveProcedures,
    enabled: !loading && !!iapId,
  });

  useEffect(() => {
    loadMedical();
  }, [iapId]);

  const loadMedical = async () => {
    if (!iapId) return;

    try {
      setLoading(true);
      const { data } = await apiClient.getData(iapId, 'medical');
      setFacilities(data.filter((item: any) => item.itemType === 'facility'));

      const proceduresItem = data.find((item: any) => item.itemType === 'procedures');
      if (proceduresItem) {
        setProcedures(proceduresItem.content || '');
      }
    } catch (err) {
      console.error('Failed to load medical:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!iapId || !formData.name.trim()) return;

    try {
      setSaving(true);
      await apiClient.createData(iapId, 'medical', {
        itemType: 'facility',
        ...formData,
      });

      setFormData({
        type: 'Med Aid Station',
        name: '',
        location: '',
        paramedic: 'Yes',
        contact: '',
        phone: '',
      });
      setShowAddForm(false);
      await loadMedical();
    } catch (err) {
      console.error('Failed to add facility:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!iapId) return;

    const facility = facilities.find(f => f.id === id);
    if (!facility) return;

    try {
      setSaving(true);
      await apiClient.updateData(iapId, 'medical', id, {
        itemType: 'facility',
        ...facility,
      });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update facility:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!iapId || !confirm('Delete this facility?')) return;

    try {
      await apiClient.deleteData(iapId, 'medical', id);
      await loadMedical();
    } catch (err) {
      console.error('Failed to delete facility:', err);
    }
  };


  const handleEditChange = (id: string, field: string, value: string) => {
    setFacilities(facilities.map(f =>
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading medical plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="Medical"
        description="Medical plan and facilities (ICS 206)"
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Auto-populates ICS 206</p>
            <p className="text-sm text-yellow-700 mt-0.5">Medical facilities and procedures entered here will populate the Medical Plan (ICS 206).</p>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg border-2 border-yellow-500 mb-6 p-6">
            <div className="flex items-start justify-between mb-4">
              <h4 className="font-semibold text-slate-900">New Medical Facility</h4>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Facility Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option>Med Aid Station</option>
                  <option>Hospital</option>
                  <option>Clinic</option>
                  <option>Ambulance Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Paramedic Available</label>
                <select
                  value={formData.paramedic}
                  onChange={(e) => setFormData({ ...formData, paramedic: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name*</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ICP Medical Unit"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Incident Command Post"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Contact person or department"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="Phone number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !formData.name.trim()}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Facility
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Medical Facilities</h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Facility
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {facilities.map((facility) => (
              <div key={facility.id} className={`px-6 py-4 ${editingId === facility.id ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingId === facility.id ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                          <select
                            value={facility.type}
                            onChange={(e) => handleEditChange(facility.id, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          >
                            <option>Med Aid Station</option>
                            <option>Hospital</option>
                            <option>Clinic</option>
                            <option>Ambulance Service</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Paramedic</label>
                          <select
                            value={facility.paramedic}
                            onChange={(e) => handleEditChange(facility.id, 'paramedic', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          >
                            <option>Yes</option>
                            <option>No</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                          <input
                            type="text"
                            value={facility.name}
                            onChange={(e) => handleEditChange(facility.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
                          <input
                            type="text"
                            value={facility.location}
                            onChange={(e) => handleEditChange(facility.id, 'location', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Contact</label>
                          <input
                            type="text"
                            value={facility.contact}
                            onChange={(e) => handleEditChange(facility.id, 'contact', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                          <input
                            type="text"
                            value={facility.phone}
                            onChange={(e) => handleEditChange(facility.id, 'phone', formatPhoneNumber(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-600">Facility Type</label>
                          <p className="text-sm text-slate-900 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {facility.type}
                            </span>
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Paramedic Available</label>
                          <p className="text-sm text-slate-900 mt-1">{facility.paramedic}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Name</label>
                          <p className="text-sm text-slate-900 mt-1 font-medium">{facility.name}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Contact</label>
                          <p className="text-sm text-slate-900 mt-1">{facility.contact || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Location</label>
                          <p className="text-sm text-slate-900 mt-1">{facility.location || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Phone</label>
                          <p className="text-sm text-slate-900 mt-1">{facility.phone || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-6">
                    {editingId === facility.id ? (
                      <>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdate(facility.id)}
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
                          onClick={() => setEditingId(facility.id)}
                          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(facility.id)}
                          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {facilities.length === 0 && !showAddForm && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                No medical facilities added
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Medical Emergency Procedures</h3>
            <div className="flex items-center gap-2 text-xs">
              {savingProcedures ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
                  <span className="text-slate-600">Saving...</span>
                </>
              ) : lastSavedProcedures ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-slate-600">Saved {lastSavedProcedures.toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="p-6">
            <textarea
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              rows={8}
              value={procedures}
              onChange={(e) => setProcedures(e.target.value)}
              placeholder="Enter medical emergency procedures and protocols..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
