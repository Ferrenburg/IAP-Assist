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

interface CommunicationsData {
  id: string;
  specialInstructions: string;
  preparedByName: string;
  positionTitle: string;
  dateTimePrepared: string;
}

export function CommunicationsPage() {
  const { iapId, periodId } = useParams();
  const { data: shared, update: updateShared } = useOpPeriod();
  const [channels, setChannels] = useState<RadioChannel[]>([]);
  const [commData, setCommData] = useState<CommunicationsData>({
    id: '',
    specialInstructions: '',
    preparedByName: '',
    positionTitle: '',
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
      const timer = setTimeout(() => {
        saveCommData(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [commData, loading]);

  // Auto-save channels after 1 second of no changes
  useEffect(() => {
    if (!loading && channels.length > 0) {
      const timer = setTimeout(() => {
        channels.forEach(channel => {
          saveChannel(channel.id);
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [channels, loading]);

  const loadData = async () => {
    if (!iapId || !periodId) return;

    try {
      const [channelsData, commDataResponse] = await Promise.all([
        apiClient.getData(iapId, `period-${periodId}-radio-channels`),
        apiClient.getData(iapId, `period-${periodId}-communications-data`),
      ]);

      setChannels(channelsData?.data || []);
      if (commDataResponse?.data?.[0]) {
        setCommData(commDataResponse.data[0]);
      } else {
        setCommData({
          id: crypto.randomUUID(),
          specialInstructions: '',
          preparedByName: '',
          positionTitle: '',
          dateTimePrepared: '',
        });
      }
    } catch (err) {
      console.error('Failed to load communications data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addChannel = async () => {
    if (!iapId || !periodId) return;

    const newChannel: RadioChannel = {
      id: crypto.randomUUID(),
      zoneGroup: '',
      channelNumber: '',
      function: '',
      channelName: '',
      assignment: '',
      rxFreq: '',
      rxTone: '',
      txFreq: '',
      txTone: '',
      mode: '',
      remarks: '',
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
    const updated = channels.map(ch =>
      ch.id === id ? { ...ch, [field]: value } : ch
    );
    setChannels(updated);
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
          } else {
            throw updateErr;
          }
        }
      }
    } catch (err) {
      console.error('Failed to save channel:', err);
    }
  };

  const deleteChannel = async (id: string) => {
    if (!iapId || !periodId) return;

    const updated = channels.filter(ch => ch.id !== id);
    setChannels(updated);

    try {
      try {
        await apiClient.deleteData(iapId, `period-${periodId}-radio-channels`, id);
      } catch (deleteErr: any) {
        if (!deleteErr.message?.includes('not found') && deleteErr.status !== 404) {
          throw deleteErr;
        }
      }
      toast.success('Channel deleted');
    } catch (err) {
      toast.error('Failed to delete channel');
      console.error('Failed to delete channel:', err);
      loadData();
    }
  };

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
          } else {
            throw updateErr;
          }
        }
        setCommData(dataToSave);
      } else {
        await apiClient.createData(iapId, `period-${periodId}-communications-data`, commData);
      }
      if (showToast) {
        toast.success('Communications data saved');
      }
    } catch (err) {
      toast.error('Failed to save communications data');
      console.error('Failed to save communications data:', err);
    }
  };

  const handleGenerateICS205 = async () => {
    if (!iapId || !periodId) return;

    try {
      setGenerating(true);
      toast.info('Generating ICS 205...');

      // Fetch required data
      const [iapRes, periodsData] = await Promise.all([
        apiClient.getIAP(iapId),
        apiClient.getData(iapId, 'periods'),
      ]);

      const period = periodsData?.data?.find((p: any) => p.id === periodId);
      if (!period) {
        toast.error('Operational period not found');
        setGenerating(false);
        return;
      }

      // Format the prepared date/time
      const formatPreparedDateTime = (datetimeStr: string) => {
        if (!datetimeStr) return '';
        const dt = new Date(datetimeStr);
        const date = dt.toISOString().split('T')[0];
        const time = dt.toTimeString().split(' ')[0].substring(0, 5);
        return `${date}T${time}`;
      };

      const formData = {
        iapData: {
          ...iapRes.iap,
          preparedBy: commData.preparedByName,
          preparedByPosition: commData.positionTitle,
          preparedDateTime: formatPreparedDateTime(commData.dateTimePrepared),
        },
        periodData: period,
        formData: channels,
        specialInstructions: commData.specialInstructions,
      };

      // Generate the PDF
      const pdfBytes = await icsFormGenerator.generateICS205(formData);

      // Download the PDF
      const filename = `ICS_205_${iapRes.iap?.name || 'Incident'}_Period_${period.periodNumber}.pdf`;
      await pdfCombiner.downloadPDF(pdfBytes, filename);

      toast.success('ICS 205 downloaded successfully!');
    } catch (error) {
      console.error('Error generating ICS 205:', error);
      toast.error('Failed to generate ICS 205');
    } finally {
      setGenerating(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">ICS 205 - Radio Communications Plan</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </button>
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </button>
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Tutorial
          </button>
          <button className="px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <CircleHelp className="w-4 h-4" />
            Help
          </button>
          <button
            onClick={handleGenerateICS205}
            disabled={generating}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                ICS 205
              </>
            )}
          </button>
        </div>
      </div>

      {/* Radio Channel Assignments */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Radio Channel Assignments</h2>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <button
            onClick={addChannel}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Channel
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
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">Zone/Group</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">Ch #</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">Function</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">Channel Name/Talkgroup</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">Assignment</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">RX Freq N</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">RX Tone N</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">TX Freq N</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">TX Tone N</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">Mode N</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium">Remarks</th>
                  <th className="text-left py-2 px-2 text-slate-700 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => (
                  <tr key={channel.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.zoneGroup}
                        onChange={(e) => updateChannel(channel.id, 'zoneGroup', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.channelNumber}
                        onChange={(e) => updateChannel(channel.id, 'channelNumber', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.function}
                        onChange={(e) => updateChannel(channel.id, 'function', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.channelName}
                        onChange={(e) => updateChannel(channel.id, 'channelName', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.assignment}
                        onChange={(e) => updateChannel(channel.id, 'assignment', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.rxFreq}
                        onChange={(e) => updateChannel(channel.id, 'rxFreq', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.rxTone}
                        onChange={(e) => updateChannel(channel.id, 'rxTone', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.txFreq}
                        onChange={(e) => updateChannel(channel.id, 'txFreq', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.txTone}
                        onChange={(e) => updateChannel(channel.id, 'txTone', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.mode}
                        onChange={(e) => updateChannel(channel.id, 'mode', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={channel.remarks}
                        onChange={(e) => updateChannel(channel.id, 'remarks', e.target.value)}
                        onBlur={() => saveChannel(channel.id)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => deleteChannel(channel.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
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
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Special Instructions</label>
        <textarea
          value={commData.specialInstructions}
          onChange={(e) => setCommData({ ...commData, specialInstructions: e.target.value })}
          onBlur={() => saveCommData(false)}
          placeholder="Any special instructions..."
          className="w-full h-32 px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Prepared By */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Prepared by</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
            <input
              type="text"
              value={shared?.preparedByName ?? ''}
              onChange={(e) => {
                setCommData({ ...commData, preparedByName: e.target.value });
                void updateShared({ preparedByName: e.target.value });
              }}
              placeholder="Preparer name"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Position/Title</label>
            <input
              type="text"
              value={shared?.preparedByTitle ?? ''}
              onChange={(e) => {
                setCommData({ ...commData, positionTitle: e.target.value });
                void updateShared({ preparedByTitle: e.target.value });
              }}
              placeholder="Position or title"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date/Time Prepared</label>
          <input
            type="datetime-local"
            value={commData.dateTimePrepared}
            onChange={(e) => setCommData({ ...commData, dateTimePrepared: e.target.value })}
            onBlur={() => saveCommData(false)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
