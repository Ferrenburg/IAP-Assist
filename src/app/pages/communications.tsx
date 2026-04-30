'use client';

import { PageHeader } from '../components/page-header';
import { Plus, FileText, Edit2, Trash2, Save, X, Loader2, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';
import * as Tabs from '@radix-ui/react-tabs';

const NIFOG_CHANNELS = {
  VFIRE: [
    { channelName: 'VFIRE21', function: 'Fire Tactical', rxFreq: '154.280', mode: 'A', remarks: 'NIFOG Fire Tactical' },
    { channelName: 'VFIRE22', function: 'Fire Tactical', rxFreq: '154.295', mode: 'A', remarks: 'NIFOG Fire Tactical' },
    { channelName: 'VFIRE23', function: 'Fire Tactical', rxFreq: '154.265', mode: 'A', remarks: 'NIFOG Fire Tactical' },
    { channelName: 'VFIRE24', function: 'Fire Tactical', rxFreq: '151.1525', mode: 'A', remarks: 'NIFOG Fire Tactical' },
  ],
  VLAW: [
    { channelName: 'VLAW21', function: 'Law Enforcement', rxFreq: '155.475', mode: 'A', remarks: 'NIFOG Law Tactical' },
    { channelName: 'VLAW22', function: 'Law Enforcement', rxFreq: '155.505', mode: 'A', remarks: 'NIFOG Law Tactical' },
    { channelName: 'VLAW23', function: 'Law Enforcement', rxFreq: '155.370', mode: 'A', remarks: 'NIFOG Law Tactical' },
    { channelName: 'VLAW24', function: 'Law Enforcement', rxFreq: '155.385', mode: 'A', remarks: 'NIFOG Law Tactical' },
  ],
  VMED: [
    { channelName: 'VMED21', function: 'EMS Tactical', rxFreq: '155.340', mode: 'A', remarks: 'NIFOG Medical Tactical' },
    { channelName: 'VMED22', function: 'EMS Tactical', rxFreq: '155.175', mode: 'A', remarks: 'NIFOG Medical Tactical' },
    { channelName: 'VMED23', function: 'EMS Tactical', rxFreq: '155.235', mode: 'A', remarks: 'NIFOG Medical Tactical' },
    { channelName: 'VMED24', function: 'EMS Tactical', rxFreq: '155.250', mode: 'A', remarks: 'NIFOG Medical Tactical' },
    { channelName: 'VMED25', function: 'EMS Tactical', rxFreq: '155.280', mode: 'A', remarks: 'NIFOG Medical Tactical' },
    { channelName: 'VMED26', function: 'EMS Tactical', rxFreq: '155.295', mode: 'A', remarks: 'NIFOG Medical Tactical' },
    { channelName: 'VMED27', function: 'EMS Tactical', rxFreq: '155.325', mode: 'A', remarks: 'NIFOG Medical Tactical' },
    { channelName: 'VMED28', function: 'EMS Tactical', rxFreq: '155.355', mode: 'A', remarks: 'NIFOG Medical Tactical' },
    { channelName: 'VMED29', function: 'EMS Tactical', rxFreq: '155.205', mode: 'A', remarks: 'NIFOG Medical Tactical' },
    { channelName: 'VMED30', function: 'EMS Tactical', rxFreq: '155.220', mode: 'A', remarks: 'NIFOG Medical Tactical' },
  ],
  VTAC: [
    { channelName: 'VTAC11', function: 'Tactical', rxFreq: '151.1375', mode: 'A', remarks: 'NIFOG Interop Tactical' },
    { channelName: 'VTAC12', function: 'Tactical', rxFreq: '154.4525', mode: 'A', remarks: 'NIFOG Interop Tactical' },
    { channelName: 'VTAC13', function: 'Tactical', rxFreq: '158.7375', mode: 'A', remarks: 'NIFOG Interop Tactical' },
    { channelName: 'VTAC14', function: 'Tactical', rxFreq: '159.4725', mode: 'A', remarks: 'NIFOG Interop Tactical' },
  ],
  VSAR: [
    { channelName: 'VSAR16', function: 'Search & Rescue', rxFreq: '155.160', mode: 'A', remarks: 'NIFOG SAR' },
  ],
  VCALL: [
    { channelName: 'VCALL10', function: 'Calling', rxFreq: '166.4875', mode: 'A', remarks: 'NIFOG Calling Channel' },
  ],
};

interface RadioChannel {
  id: string;
  zone: string;
  channelNumber: string;
  function: string;
  channelName: string;
  assignment: string;
  rxFreq: string;
  rxFreqType: string; // N or W
  rxTone: string;
  txFreq: string;
  txFreqType: string; // N or W
  txTone: string;
  mode: string; // A, D, or M
  remarks: string;
}

export function Communications() {
  const { iapId } = useParams();
  const [radioChannels, setRadioChannels] = useState<RadioChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    zone: '',
    channelNumber: '',
    function: '',
    channelName: '',
    assignment: '',
    rxFreq: '',
    rxFreqType: 'N',
    rxTone: '',
    txFreq: '',
    txFreqType: 'N',
    txTone: '',
    mode: 'A',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    VFIRE: false,
    VLAW: false,
    VMED: false,
    VTAC: false,
    VSAR: false,
    VCALL: false,
  });

  useEffect(() => {
    loadCommunications();
  }, [iapId]);

  const loadCommunications = async () => {
    if (!iapId) return;

    try {
      setLoading(true);
      const { data } = await apiClient.getData(iapId, 'communications');
      setRadioChannels(data);
    } catch (err) {
      console.error('Failed to load communications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!iapId || !formData.channelName.trim()) return;

    try {
      setSaving(true);
      await apiClient.createData(iapId, 'communications', formData);

      setFormData({
        zone: '',
        channelNumber: '',
        function: '',
        channelName: '',
        assignment: '',
        rxFreq: '',
        rxFreqType: 'N',
        rxTone: '',
        txFreq: '',
        txFreqType: 'N',
        txTone: '',
        mode: 'A',
        remarks: '',
      });
      setShowAddForm(false);
      await loadCommunications();
    } catch (err) {
      console.error('Failed to add channel:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!iapId) return;

    const channel = radioChannels.find(c => c.id === id);
    if (!channel) return;

    try {
      setSaving(true);
      await apiClient.updateData(iapId, 'communications', id, channel);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update channel:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (id: string, field: keyof RadioChannel, value: string) => {
    setRadioChannels(prev => prev.map(ch =>
      ch.id === id ? { ...ch, [field]: value } : ch
    ));
  };

  const handleDelete = async (id: string) => {
    if (!iapId || !confirm('Delete this channel?')) return;

    try {
      await apiClient.deleteData(iapId, 'communications', id);
      await loadCommunications();
    } catch (err) {
      console.error('Failed to delete channel:', err);
    }
  };

  const handleAddNIFOG = async (nifogChannel: { channelName: string; function: string; rxFreq: string; mode: string; remarks: string }) => {
    if (!iapId) return;

    try {
      setSaving(true);
      await apiClient.createData(iapId, 'communications', {
        zone: '',
        channelNumber: '',
        function: nifogChannel.function,
        channelName: nifogChannel.channelName,
        assignment: '',
        rxFreq: nifogChannel.rxFreq,
        rxFreqType: 'N',
        rxTone: '',
        txFreq: nifogChannel.rxFreq,
        txFreqType: 'N',
        txTone: '',
        mode: nifogChannel.mode,
        remarks: nifogChannel.remarks,
      });

      await loadCommunications();
    } catch (err) {
      console.error('Failed to add NIFOG channel:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="Communications"
        description="Radio communications plan (ICS 205) - Contact list available in Contacts page (ICS 205A)"
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Auto-populates ICS 205</p>
            <p className="text-sm text-yellow-700 mt-0.5">Radio channels entered here will populate the Incident Radio Communications Plan (ICS 205). For ICS 205A contacts, use the Contacts page.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">Quick Add NIFOG Channels</h3>
          </div>
          <p className="text-xs text-slate-600 mb-3">Add standard National Interoperability Field Operations Guide (NIFOG) channels</p>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(NIFOG_CHANNELS).map(([category, channels]) => (
              <div key={category}>
                <button
                  onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                  className="w-full flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5 hover:text-slate-900"
                >
                  <span>{category}</span>
                  <span className="text-slate-400">{expandedCategories[category] ? '▼' : '▶'}</span>
                </button>
                {expandedCategories[category] && (
                  <div className="flex flex-col gap-1">
                    {channels.map((channel) => (
                      <button
                        key={channel.channelName}
                        onClick={() => handleAddNIFOG(channel)}
                        disabled={saving}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-amber-100 border border-slate-300 hover:border-amber-400 rounded-md text-xs font-medium text-slate-700 hover:text-amber-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        {channel.channelName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg border-2 border-yellow-500 mb-6 p-6">
            <div className="flex items-start justify-between mb-4">
              <h4 className="font-semibold text-slate-900">New Radio Channel (ICS 205)</h4>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Zone/Grp</label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="e.g., Z1/G1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ch #</label>
                <input
                  type="text"
                  value={formData.channelNumber}
                  onChange={(e) => setFormData({ ...formData, channelNumber: e.target.value })}
                  placeholder="e.g., 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Function</label>
                <input
                  type="text"
                  value={formData.function}
                  onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                  placeholder="e.g., Command"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Channel Name/Talkgroup*</label>
                <input
                  type="text"
                  required
                  value={formData.channelName}
                  onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                  placeholder="e.g., IC Tactical"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignment</label>
                <input
                  type="text"
                  value={formData.assignment}
                  onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                  placeholder="e.g., Command Staff"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">RX Freq (N or W)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.rxFreq}
                    onChange={(e) => setFormData({ ...formData, rxFreq: e.target.value })}
                    placeholder="e.g., 154.280"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <select
                    value={formData.rxFreqType}
                    onChange={(e) => setFormData({ ...formData, rxFreqType: e.target.value })}
                    className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="N">N</option>
                    <option value="W">W</option>
                  </select>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">RX Tone/NAC</label>
                <input
                  type="text"
                  value={formData.rxTone}
                  onChange={(e) => setFormData({ ...formData, rxTone: e.target.value })}
                  placeholder="e.g., 127.3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">TX Freq (N or W)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.txFreq}
                    onChange={(e) => setFormData({ ...formData, txFreq: e.target.value })}
                    placeholder="e.g., 159.280"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <select
                    value={formData.txFreqType}
                    onChange={(e) => setFormData({ ...formData, txFreqType: e.target.value })}
                    className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="N">N</option>
                    <option value="W">W</option>
                  </select>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">TX Tone/NAC</label>
                <input
                  type="text"
                  value={formData.txTone}
                  onChange={(e) => setFormData({ ...formData, txTone: e.target.value })}
                  placeholder="e.g., 127.3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mode</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="A">A (Analog)</option>
                  <option value="D">D (Digital)</option>
                  <option value="M">M (Mixed)</option>
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Optional notes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                disabled={saving || !formData.channelName.trim()}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Channel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Radio Channels (ICS 205)</h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Channel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Zone/Grp</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Ch#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Function</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Channel Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Assignment</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">RX Freq</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">RX Tone</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">TX Freq</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">TX Tone</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Mode</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Remarks</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {radioChannels.map((channel) => (
                  <tr key={channel.id} className={editingId === channel.id ? 'bg-yellow-50' : 'hover:bg-slate-50'}>
                    {editingId === channel.id ? (
                      <>
                        <td className="px-2 py-2">
                          <input type="text" value={channel.zone} onChange={(e) => handleEditChange(channel.id, 'zone', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={channel.channelNumber} onChange={(e) => handleEditChange(channel.id, 'channelNumber', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={channel.function} onChange={(e) => handleEditChange(channel.id, 'function', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={channel.channelName} onChange={(e) => handleEditChange(channel.id, 'channelName', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={channel.assignment} onChange={(e) => handleEditChange(channel.id, 'assignment', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-1">
                            <input type="text" value={channel.rxFreq} onChange={(e) => handleEditChange(channel.id, 'rxFreq', e.target.value)} className="w-20 px-2 py-1 border border-slate-300 rounded text-xs" />
                            <select value={channel.rxFreqType} onChange={(e) => handleEditChange(channel.id, 'rxFreqType', e.target.value)} className="w-12 px-1 py-1 border border-slate-300 rounded text-xs">
                              <option value="N">N</option>
                              <option value="W">W</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={channel.rxTone} onChange={(e) => handleEditChange(channel.id, 'rxTone', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-1">
                            <input type="text" value={channel.txFreq} onChange={(e) => handleEditChange(channel.id, 'txFreq', e.target.value)} className="w-20 px-2 py-1 border border-slate-300 rounded text-xs" />
                            <select value={channel.txFreqType} onChange={(e) => handleEditChange(channel.id, 'txFreqType', e.target.value)} className="w-12 px-1 py-1 border border-slate-300 rounded text-xs">
                              <option value="N">N</option>
                              <option value="W">W</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={channel.txTone} onChange={(e) => handleEditChange(channel.id, 'txTone', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                        </td>
                        <td className="px-2 py-2">
                          <select value={channel.mode} onChange={(e) => handleEditChange(channel.id, 'mode', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs">
                            <option value="A">A</option>
                            <option value="D">D</option>
                            <option value="M">M</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={channel.remarks} onChange={(e) => handleEditChange(channel.id, 'remarks', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-xs" />
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-sm text-slate-500 hover:text-slate-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdate(channel.id)}
                              disabled={saving}
                              className="text-sm text-yellow-600 hover:text-yellow-700"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-3 text-slate-900">{channel.zone || '-'}</td>
                        <td className="px-3 py-3 text-slate-900">{channel.channelNumber || '-'}</td>
                        <td className="px-3 py-3 text-slate-900">{channel.function || '-'}</td>
                        <td className="px-3 py-3 font-medium text-slate-900">{channel.channelName}</td>
                        <td className="px-3 py-3 text-slate-900">{channel.assignment || '-'}</td>
                        <td className="px-3 py-3 text-slate-900">{channel.rxFreq ? `${channel.rxFreq} ${channel.rxFreqType}` : '-'}</td>
                        <td className="px-3 py-3 text-slate-900">{channel.rxTone || '-'}</td>
                        <td className="px-3 py-3 text-slate-900">{channel.txFreq ? `${channel.txFreq} ${channel.txFreqType}` : '-'}</td>
                        <td className="px-3 py-3 text-slate-900">{channel.txTone || '-'}</td>
                        <td className="px-3 py-3 text-slate-900">{channel.mode || '-'}</td>
                        <td className="px-3 py-3 text-slate-600">{channel.remarks || '-'}</td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => setEditingId(channel.id)}
                              className="text-sm text-slate-500 hover:text-slate-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(channel.id)}
                              className="text-sm text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {radioChannels.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-500">
                      No radio channels configured. Add your first channel to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
