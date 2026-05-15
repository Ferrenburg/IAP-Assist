'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { HelpCircle, History, FileText, BookOpen, CircleHelp, Plus, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/api-client';
import { useOpPeriod } from '../../contexts/op-period-context';
import { toast } from 'sonner';
import { icsFormGenerator } from '../../utils/ics-forms/form-generator';
import { pdfCombiner } from '../../utils/pdf-combiner';

interface RadioChannel {
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

interface CommsContact {
  id: string;
  role: string;
  name: string;
  phone: string;
  radio: string;
}

interface CommunicationsData {
  id: string;
  specialInstructions: string;
  dateTimePrepared: string;
}

export function CommunicationsPage() {
  const { iapId, periodId } = useParams();
  const { data: shared, update: updateShared } = useOpPeriod();
  const [activeTab, setActiveTab] = useState<'ics205' | 'ics205a'>('ics205');
  const [channels, setChannels] = useState<RadioChannel[]>([]);
  const [contacts, setContacts] = useState<CommsContact[]>([]);
  const [commData, setCommData] = useState<CommunicationsData>({
    id: '',
    specialInstructions: '',
    dateTimePrepared: '',
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [iapId, periodId]);

  // Auto-save commData after 1 second of no changes
  useEffect(() => {
    if (!loading && commData.id) {
      const timer = setTimeout(() => { saveCommData(false); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [commData, loading]);

  // Auto-save channels after 1 second of no changes
  useEffect(() => {
    if (!loading && channels.length > 0) {
      const timer = setTimeout(() => {
        channels.forEach(channel => { saveChannel(channel.id); });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [channels, loading]);

  const loadData = async () => {
    if (!iapId || !periodId) return;

    try {
      const [channelsData, commDataResponse, contactsData] = await Promise.all([
        apiClient.getData(iapId, `period-${periodId}-radio-channels`),
        apiClient.getData(iapId, `period-${periodId}-communications-data`),
        apiClient.getData(iapId, `period-${periodId}-comms-contacts`),
      ]);

      setChannels(channelsData?.data || []);
      setContacts(contactsData?.data || []);

      if (commDataResponse?.data?.[0]) {
        setCommData(commDataResponse.data[0]);
      } else {
        setCommData({ id: crypto.randomUUID(), specialInstructions: '', dateTimePrepared: '' });
      }
    } catch (err) {
      console.error('Failed to load communications data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── ICS 205 channel handlers ──────────────────────────────────────────────

  const addChannel = async () => {
    if (!iapId || !periodId) return;

    const newChannel: RadioChannel = {
      id: crypto.randomUUID(),
      zoneGroup: '', channelNumber: '', function: '', channelName: '',
      assignment: '', rxFreq: '', rxTone: '', txFreq: '', txTone: '', mode: '', remarks: '',
    };

    try {
      await apiClient.createData(iapId, `period-${periodId}-radio-channels`, newChannel);
      setChannels([...channels, newChannel]);
      toast.success('Channel added');
    } catch (err) {
      toast.error('Failed to add channel');
      console.error('Failed to add channel:', err);
    }
  };

  const updateChannel = (id: string, field: keyof RadioChannel, value: string) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, [field]: value } : ch));
  };

  const saveChannel = async (id: string) => {
    if (!iapId || !periodId) return;
    try {
      const channel = channels.find(ch => ch.id === id);
      if (channel) {
        try {
          await apiClient.updateData(iapId, `period-${periodId}-radio-channels`, id, channel);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-radio-channels`, channel);
          } else throw updateErr;
        }
      }
    } catch (err) {
      console.error('Failed to save channel:', err);
    }
  };

  const deleteChannel = async (id: string) => {
    if (!iapId || !periodId) return;
    setChannels(channels.filter(ch => ch.id !== id));
    try {
      try {
        await apiClient.deleteData(iapId, `period-${periodId}-radio-channels`, id);
      } catch (deleteErr: any) {
        if (!deleteErr.message?.includes('not found') && deleteErr.status !== 404) throw deleteErr;
      }
      toast.success('Channel deleted');
    } catch (err) {
      toast.error('Failed to delete channel');
      console.error('Failed to delete channel:', err);
      loadData();
    }
  };

  // ── ICS 205A contact handlers ─────────────────────────────────────────────

  const addContact = async () => {
    if (!iapId || !periodId) return;

    const newContact: CommsContact = {
      id: crypto.randomUUID(), role: '', name: '', phone: '', radio: '',
    };

    try {
      await apiClient.createData(iapId, `period-${periodId}-comms-contacts`, newContact);
      setContacts([...contacts, newContact]);
      toast.success('Contact added');
    } catch (err) {
      toast.error('Failed to add contact');
      console.error('Failed to add contact:', err);
    }
  };

  const updateContact = (id: string, field: keyof CommsContact, value: string) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const saveContact = async (id: string) => {
    if (!iapId || !periodId) return;
    try {
      const contact = contacts.find(c => c.id === id);
      if (contact) {
        try {
          await apiClient.updateData(iapId, `period-${periodId}-comms-contacts`, id, contact);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-comms-contacts`, contact);
          } else throw updateErr;
        }
      }
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  const deleteContact = async (id: string) => {
    if (!iapId || !periodId) return;
    setContacts(contacts.filter(c => c.id !== id));
    try {
      try {
        await apiClient.deleteData(iapId, `period-${periodId}-comms-contacts`, id);
      } catch (deleteErr: any) {
        if (!deleteErr.message?.includes('not found') && deleteErr.status !== 404) throw deleteErr;
      }
      toast.success('Contact deleted');
    } catch (err) {
      toast.error('Failed to delete contact');
      console.error('Failed to delete contact:', err);
      loadData();
    }
  };

  // ── Shared form data ──────────────────────────────────────────────────────

  const saveCommData = async (showToast = false) => {
    if (!iapId || !periodId) return;
    try {
      const existing = await apiClient.getData(iapId, `period-${periodId}-communications-data`);
      if (existing?.data?.[0]) {
        const dataToSave = { ...commData, id: existing.data[0].id };
        try {
          await apiClient.updateData(iapId, `period-${periodId}-communications-data`, existing.data[0].id, dataToSave);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-communications-data`, dataToSave);
          } else throw updateErr;
        }
        setCommData(dataToSave);
      } else {
        await apiClient.createData(iapId, `period-${periodId}-communications-data`, commData);
      }
      if (showToast) toast.success('Communications data saved');
    } catch (err) {
      toast.error('Failed to save communications data');
      console.error('Failed to save communications data:', err);
    }
  };

  // ── PDF generators ────────────────────────────────────────────────────────

  const buildPeriodData = () => ({ startAt: shared?.startAt, endAt: shared?.endAt });
  const buildIapData = (dateTimePrepared?: string) => ({
    incidentName: shared?.incidentName,
    incidentNumber: shared?.incidentNumber,
    preparedBy: shared?.preparedByName,
    preparedByPosition: shared?.preparedByTitle,
    preparedDateTime: dateTimePrepared || commData.dateTimePrepared || new Date().toISOString(),
  });

  const handleGenerateICS205 = async () => {
    if (!shared?.incidentName) {
      toast.error('Set an incident name in Incident Info before exporting');
      return;
    }
    if (channels.length === 0) {
      toast.error('Add at least one radio channel before exporting');
      return;
    }

    try {
      setGenerating(true);
      toast.info('Generating ICS 205...');

      const pdfBytes = await icsFormGenerator.generateICS205({
        iapData: buildIapData(),
        periodData: buildPeriodData(),
        formData: channels,
        specialInstructions: commData.specialInstructions,
      });

      const filename = `ICS_205_${shared.incidentName}_Period_${shared.periodNumber || ''}.pdf`;
      await pdfCombiner.downloadPDF(pdfBytes, filename);
      toast.success('ICS 205 downloaded successfully!');
    } catch (error) {
      console.error('Error generating ICS 205:', error);
      toast.error('Failed to generate ICS 205');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateICS205A = async () => {
    if (!shared?.incidentName) {
      toast.error('Set an incident name in Incident Info before exporting');
      return;
    }
    if (contacts.length === 0) {
      toast.error('Add at least one contact before exporting ICS 205A');
      return;
    }

    try {
      setGenerating(true);
      toast.info('Generating ICS 205A...');

      const pdfBytes = await icsFormGenerator.generateICS205A({
        iapData: buildIapData(),
        periodData: buildPeriodData(),
        formData: contacts,
      });

      const filename = `ICS_205A_${shared.incidentName}_Period_${shared.periodNumber || ''}.pdf`;
      await pdfCombiner.downloadPDF(pdfBytes, filename);
      toast.success('ICS 205A downloaded successfully!');
    } catch (error) {
      console.error('Error generating ICS 205A:', error);
      toast.error('Failed to generate ICS 205A');
    } finally {
      setGenerating(false);
    }
  };

  const formatBannerDate = (iso: string | null | undefined) => {
    if (!iso) return '';
    return iso.split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Incident info banner */}
      {shared?.incidentName && (
        <div className="text-sm text-slate-400 flex items-center gap-3">
          <span className="text-slate-200 font-medium">{shared.incidentName}</span>
          {shared.periodNumber && <><span>·</span><span>Period {shared.periodNumber}</span></>}
          {(shared.startAt || shared.endAt) && (
            <><span>·</span><span>{formatBannerDate(shared.startAt)} – {formatBannerDate(shared.endAt)}</span></>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">ICS 205 / 205A - Communications</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <History className="w-4 h-4" />History
          </button>
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" />Templates
          </button>
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <BookOpen className="w-4 h-4" />Tutorial
          </button>
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <CircleHelp className="w-4 h-4" />Help
          </button>
          <button
            onClick={handleGenerateICS205}
            disabled={generating}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            ICS 205
          </button>
          <button
            onClick={handleGenerateICS205A}
            disabled={generating}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            ICS 205A
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('ics205')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ics205' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          ICS 205 — Radio Communications Plan
        </button>
        <button
          onClick={() => setActiveTab('ics205a')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ics205a' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          ICS 205A — Communications List
        </button>
      </div>

      {/* ── ICS 205 Tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'ics205' && (
        <div className="space-y-6">
          {/* Radio Channel Assignments */}
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Radio Channel Assignments</h2>
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              <button
                onClick={addChannel}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />Add Channel
              </button>
            </div>

            {channels.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No radio channels added yet. Click "Add Channel" to begin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">Zone/Group</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">Ch #</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">Function</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">Channel Name/Talkgroup</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">Assignment</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">RX Freq</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">RX Tone</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">TX Freq</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">TX Tone</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">Mode</th>
                      <th className="text-left py-2 px-2 text-slate-400 font-medium">Remarks</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map((channel) => (
                      <tr key={channel.id} className="border-b border-slate-700 hover:bg-slate-800">
                        {(['zoneGroup', 'channelNumber', 'function', 'channelName', 'assignment', 'rxFreq', 'rxTone', 'txFreq', 'txTone', 'mode', 'remarks'] as (keyof RadioChannel)[]).map(field => (
                          <td key={field} className="py-2 px-2">
                            <input
                              type="text"
                              value={channel[field] as string}
                              onChange={(e) => updateChannel(channel.id, field, e.target.value)}
                              onBlur={() => saveChannel(channel.id)}
                              className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                        ))}
                        <td className="py-2 px-2">
                          <button onClick={() => deleteChannel(channel.id)} className="text-red-400 hover:text-red-300 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Special Instructions</label>
            <textarea
              value={commData.specialInstructions}
              onChange={(e) => setCommData({ ...commData, specialInstructions: e.target.value })}
              onBlur={() => saveCommData(false)}
              placeholder="Any special instructions..."
              className="w-full h-32 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Prepared By */}
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Prepared by</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  value={shared?.preparedByName ?? ''}
                  onChange={(e) => void updateShared({ preparedByName: e.target.value })}
                  placeholder="Preparer name"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Position/Title</label>
                <input
                  type="text"
                  value={shared?.preparedByTitle ?? ''}
                  onChange={(e) => void updateShared({ preparedByTitle: e.target.value })}
                  placeholder="Position or title"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date/Time Prepared</label>
                <input
                  type="datetime-local"
                  value={commData.dateTimePrepared}
                  onChange={(e) => setCommData({ ...commData, dateTimePrepared: e.target.value })}
                  onBlur={() => saveCommData(false)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ICS 205A Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'ics205a' && (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Communications List</h2>
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              <button
                onClick={addContact}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />Add Contact
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No contacts added yet. Click "Add Contact" to begin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 font-medium">Role / Function</th>
                      <th className="text-left py-2 px-3 text-slate-400 font-medium">Name</th>
                      <th className="text-left py-2 px-3 text-slate-400 font-medium">Phone / Cell</th>
                      <th className="text-left py-2 px-3 text-slate-400 font-medium">Radio Channel</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="border-b border-slate-700 hover:bg-slate-800">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={contact.role}
                            onChange={(e) => updateContact(contact.id, 'role', e.target.value)}
                            onBlur={() => saveContact(contact.id)}
                            placeholder="e.g. Operations Chief"
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                            onBlur={() => saveContact(contact.id)}
                            placeholder="Full name"
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={contact.phone}
                            onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                            onBlur={() => saveContact(contact.id)}
                            placeholder="555-0100"
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={contact.radio}
                            onChange={(e) => updateContact(contact.id, 'radio', e.target.value)}
                            onBlur={() => saveContact(contact.id)}
                            placeholder="Channel / freq"
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <button onClick={() => deleteContact(contact.id)} className="text-red-400 hover:text-red-300 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Prepared By */}
          <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Prepared by</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  value={shared?.preparedByName ?? ''}
                  onChange={(e) => void updateShared({ preparedByName: e.target.value })}
                  placeholder="Preparer name"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Position/Title</label>
                <input
                  type="text"
                  value={shared?.preparedByTitle ?? ''}
                  onChange={(e) => void updateShared({ preparedByTitle: e.target.value })}
                  placeholder="Position or title"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
