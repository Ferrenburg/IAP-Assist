'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Trash2, History, FileText, BookOpen, CircleHelp, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/api-client';
import { toast } from 'sonner';
import { icsFormGenerator } from '../../utils/ics-forms/form-generator';
import { pdfCombiner } from '../../utils/pdf-combiner';

interface ActionItem {
  id: string;
  number: number;
  item: string;
  forPoc: string;
  briefedPoc: boolean;
  startDate: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled' | 'Closed';
  targetDate: string;
  actualDate: string;
  includedInPrint: boolean;
}

export function ActionTrackerPage() {
  const { iapId, periodId } = useParams();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [iapId, periodId]);

  const loadData = async () => {
    if (!iapId || !periodId) return;

    try {
      const data = await apiClient.getData(iapId, `period-${periodId}-action-tracker`);
      if (data?.data && data.data.length > 0) {
        setActionItems(data.data);
      }
    } catch (err) {
      console.error('Failed to load action tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    if (!iapId || !periodId) return;

    try {
      // Delete all existing items
      const existing = await apiClient.getData(iapId, `period-${periodId}-action-tracker`);
      if (existing?.data) {
        for (const item of existing.data) {
          await apiClient.deleteData(iapId, `period-${periodId}-action-tracker`, item.id);
        }
      }

      // Create all current items
      for (const item of actionItems) {
        await apiClient.createData(iapId, `period-${periodId}-action-tracker`, item);
      }

      toast.success('Action tracker saved');
    } catch (err) {
      toast.error('Failed to save action tracker');
      console.error('Failed to save action tracker:', err);
    }
  };

  const addAction = () => {
    const newAction: ActionItem = {
      id: crypto.randomUUID(),
      number: actionItems.length + 1,
      item: '',
      forPoc: '',
      briefedPoc: false,
      startDate: '',
      status: 'Open',
      targetDate: '',
      actualDate: '',
      includedInPrint: true,
    };
    setActionItems([...actionItems, newAction]);
  };

  const updateAction = async (id: string, field: keyof ActionItem, value: any) => {
    const updated = actionItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setActionItems(updated);

    // Autosave after a short delay
    setTimeout(async () => {
      if (!iapId || !periodId) return;
      try {
        const item = updated.find(i => i.id === id);
        if (item) {
          try {
            await apiClient.updateData(iapId, `period-${periodId}-action-tracker`, id, item);
          } catch (updateErr: any) {
            if (updateErr.message?.includes('not found') || updateErr.status === 404) {
              await apiClient.createData(iapId, `period-${periodId}-action-tracker`, item);
            }
          }
        }
      } catch (err) {
        console.error('Failed to autosave action item:', err);
      }
    }, 500);
  };

  const deleteAction = async (id: string) => {
    const filtered = actionItems.filter(item => item.id !== id);
    // Renumber the items
    const renumbered = filtered.map((item, idx) => ({ ...item, number: idx + 1 }));
    setActionItems(renumbered);

    // Autosave deletion
    if (!iapId || !periodId) return;
    try {
      await apiClient.deleteData(iapId, `period-${periodId}-action-tracker`, id);
      // Update remaining items with new numbers
      for (const item of renumbered) {
        try {
          await apiClient.updateData(iapId, `period-${periodId}-action-tracker`, item.id, item);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-action-tracker`, item);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete action item:', err);
    }
  };

  const handleGenerateICS233 = async () => {
    if (!iapId || !periodId) return;

    try {
      setGenerating(true);
      toast.info('Generating ICS 233...');

      // Fetch IAP and period data
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

      const baseData = {
        iapData: iapRes.iap,
        periodData: period,
        formData: actionItems,
      };

      // Generate the PDF
      const pdfBytes = await icsFormGenerator.generateICS233(baseData);

      // Download the PDF
      const filename = `ICS_233_Action_Tracker_${iapRes.iap?.name || 'Incident'}_Period_${period.periodNumber}.pdf`;
      await pdfCombiner.downloadPDF(pdfBytes, filename);

      toast.success('ICS 233 downloaded successfully!');
    } catch (error) {
      console.error('Error generating ICS 233:', error);
      toast.error('Failed to generate ICS 233');
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
        <div>
          <h1 className="text-2xl font-bold text-white">Action Tracker (ICS-233)</h1>
          <p className="text-sm text-slate-400 mt-1">Track tasks and actions that don't rise to the level of Incident Objectives</p>
        </div>
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
            onClick={handleGenerateICS233}
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
                ICS 233
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Action Items</h2>
          <button
            onClick={addAction}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Action
          </button>
        </div>

        <div className="space-y-6">
          {actionItems.map((action) => (
            <div key={action.id} className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              {/* Top Row: Number, Item, For/POC, Briefed POC, Delete */}
              <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-2">No.</label>
                  <div className="px-3 py-2 bg-slate-700 rounded-lg text-white text-sm">
                    {action.number}
                  </div>
                </div>
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Item</label>
                  <input
                    type="text"
                    value={action.item}
                    onChange={(e) => updateAction(action.id, 'item', e.target.value)}
                    placeholder="Short description of task/action"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-slate-400 mb-2">For/POC</label>
                  <input
                    type="text"
                    value={action.forPoc}
                    onChange={(e) => updateAction(action.id, 'forPoc', e.target.value)}
                    placeholder="Responsible person/section"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={action.briefedPoc}
                      onChange={(e) => updateAction(action.id, 'briefedPoc', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-400">Briefed POC</span>
                  </label>
                </div>
                <div className="col-span-1 flex items-end justify-end">
                  <button
                    onClick={() => deleteAction(action.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Dates, Status, Included in Print */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={action.startDate}
                    onChange={(e) => updateAction(action.id, 'startDate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
                  <select
                    value={action.status}
                    onChange={(e) => updateAction(action.id, 'status', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Target Date</label>
                  <input
                    type="date"
                    value={action.targetDate}
                    onChange={(e) => updateAction(action.id, 'targetDate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Actual Date</label>
                  <input
                    type="date"
                    value={action.actualDate}
                    onChange={(e) => updateAction(action.id, 'actualDate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-4 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={action.includedInPrint}
                      onChange={(e) => updateAction(action.id, 'includedInPrint', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-xs text-green-400">Included in print</span>
                  </label>
                </div>
              </div>
            </div>
          ))}

          {actionItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No action items yet. Click "Add Action" to create one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Note:</strong> Action items are associated with the incident and will automatically carry over to all operational periods.
          Items with status "Cancelled" or "Closed" will not appear in the printed ICS-233 form.
        </p>
      </div>
    </div>
  );
}
