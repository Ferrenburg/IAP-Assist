'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Trash2, HelpCircle, History, FileText, BookOpen, CircleHelp, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/api-client';
import { toast } from 'sonner';
import { icsFormGenerator } from '../../utils/ics-forms/form-generator';
import { pdfCombiner } from '../../utils/pdf-combiner';

interface Objective {
  id: string;
  number: string;
  description: string;
}

export function ObjectivesPage() {
  const { iapId, periodId } = useParams();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [commandEmphasis, setCommandEmphasis] = useState('');
  const [situationConditions, setSituationConditions] = useState('');
  const [preparedByName, setPreparedByName] = useState('');
  const [preparedByPosition, setPreparedByPosition] = useState('');
  const [preparedDateTime, setPreparedDateTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [iapId, periodId]);

  useEffect(() => {
    // Auto-resize all textareas after objectives load
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach((textarea) => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }, [objectives]);

  const loadData = async () => {
    if (!iapId || !periodId) return;

    try {
      const [objectivesData, commandData, situationData, preparedByData] = await Promise.all([
        apiClient.getData(iapId, `period-${periodId}-objectives`),
        apiClient.getData(iapId, `period-${periodId}-command-emphasis`),
        apiClient.getData(iapId, `period-${periodId}-situation`),
        apiClient.getData(iapId, `period-${periodId}-objectives-prepared-by`),
      ]);

      // Remove duplicates by ID if any exist
      const uniqueObjectives = objectivesData?.data || [];
      const seen = new Set();
      const deduped = uniqueObjectives.filter((obj: Objective) => {
        if (seen.has(obj.id)) {
          return false;
        }
        seen.add(obj.id);
        return true;
      });

      setObjectives(deduped);
      setCommandEmphasis(commandData?.data?.[0]?.content || '');
      setSituationConditions(situationData?.data?.[0]?.content || '');
      setPreparedByName(preparedByData?.data?.[0]?.name || '');
      setPreparedByPosition(preparedByData?.data?.[0]?.position || '');
      setPreparedDateTime(preparedByData?.data?.[0]?.dateTime || '');
    } catch (err) {
      console.error('Failed to load objectives data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addObjective = async () => {
    if (!iapId || !periodId) return;

    const newObjective = {
      id: crypto.randomUUID(),
      number: (objectives.length + 1).toString(),
      description: '',
    };

    try {
      await apiClient.createData(iapId, `period-${periodId}-objectives`, newObjective);
      setObjectives([...objectives, newObjective]);
    } catch (err) {
      toast.error('Failed to add objective');
      console.error('Failed to add objective:', err);
    }
  };

  const updateObjective = async (id: string, description: string) => {
    const updated = objectives.map(obj =>
      obj.id === id ? { ...obj, description } : obj
    );
    setObjectives(updated);

    // Autosave
    if (!iapId || !periodId) return;

    try {
      const objective = objectives.find(obj => obj.id === id);
      if (objective) {
        const updatedObj = { ...objective, description };
        try {
          await apiClient.updateData(iapId, `period-${periodId}-objectives`, id, updatedObj);
        } catch (updateErr: any) {
          // If update fails because item doesn't exist, try to create it
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-objectives`, updatedObj);
          } else {
            throw updateErr;
          }
        }
      }
    } catch (err) {
      console.error('Failed to save objective:', err);
    }
  };

  const deleteObjective = async (id: string) => {
    if (!iapId || !periodId) return;

    // Update local state first
    const updated = objectives.filter(obj => obj.id !== id);
    // Renumber remaining objectives
    const renumbered = updated.map((obj, index) => ({
      ...obj,
      number: (index + 1).toString(),
    }));
    setObjectives(renumbered);

    try {
      // Try to delete from backend
      try {
        await apiClient.deleteData(iapId, `period-${periodId}-objectives`, id);
      } catch (deleteErr: any) {
        // Ignore "not found" errors - item might not have been saved yet
        if (!deleteErr.message?.includes('not found') && deleteErr.status !== 404) {
          throw deleteErr;
        }
      }

      // Update all objectives with new numbers
      for (const obj of renumbered) {
        try {
          await apiClient.updateData(iapId, `period-${periodId}-objectives`, obj.id, obj);
        } catch (updateErr: any) {
          // If update fails because item doesn't exist, create it
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-objectives`, obj);
          } else {
            throw updateErr;
          }
        }
      }
    } catch (err) {
      toast.error('Failed to delete objective');
      console.error('Failed to delete objective:', err);
      // Reload to get consistent state
      loadData();
    }
  };

  const saveCommandEmphasis = async () => {
    if (!iapId || !periodId) return;
    setSaving(true);

    try {
      const existing = await apiClient.getData(iapId, `period-${periodId}-command-emphasis`);
      if (existing?.data?.[0]) {
        await apiClient.updateData(iapId, `period-${periodId}-command-emphasis`, existing.data[0].id, {
          content: commandEmphasis,
        });
      } else {
        await apiClient.createData(iapId, `period-${periodId}-command-emphasis`, {
          id: crypto.randomUUID(),
          content: commandEmphasis,
        });
      }
      toast.success('Command emphasis saved');
    } catch (err) {
      toast.error('Failed to save command emphasis');
      console.error('Failed to save command emphasis:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveSituationConditions = async () => {
    if (!iapId || !periodId) return;
    setSaving(true);

    try {
      const existing = await apiClient.getData(iapId, `period-${periodId}-situation`);
      if (existing?.data?.[0]) {
        await apiClient.updateData(iapId, `period-${periodId}-situation`, existing.data[0].id, {
          content: situationConditions,
        });
      } else {
        await apiClient.createData(iapId, `period-${periodId}-situation`, {
          id: crypto.randomUUID(),
          content: situationConditions,
        });
      }
      toast.success('Situation conditions saved');
    } catch (err) {
      toast.error('Failed to save situation conditions');
      console.error('Failed to save situation conditions:', err);
    } finally {
      setSaving(false);
    }
  };

  const savePreparedByData = async () => {
    if (!iapId || !periodId) return;

    try {
      const existing = await apiClient.getData(iapId, `period-${periodId}-objectives-prepared-by`);
      const preparedByData = {
        name: preparedByName,
        position: preparedByPosition,
        dateTime: preparedDateTime,
      };

      if (existing?.data?.[0]) {
        await apiClient.updateData(iapId, `period-${periodId}-objectives-prepared-by`, existing.data[0].id, preparedByData);
      } else {
        await apiClient.createData(iapId, `period-${periodId}-objectives-prepared-by`, {
          id: crypto.randomUUID(),
          ...preparedByData,
        });
      }
    } catch (err) {
      console.error('Failed to save prepared by data:', err);
    }
  };

  const handleGenerateICS202 = async () => {
    if (!iapId || !periodId) return;

    try {
      setGenerating(true);
      toast.info('Generating ICS 202...');

      // Fetch all required data
      const [iapRes, periodsData, organizationRes, safetyRes, safetyDataRes, commandData, situationData, personnelData, assignmentsData] = await Promise.all([
        apiClient.getIAP(iapId),
        apiClient.getData(iapId, 'periods'),
        apiClient.getData(iapId, `period-${periodId}-organization`),
        apiClient.getData(iapId, `period-${periodId}-safety`),
        apiClient.getData(iapId, `period-${periodId}-safety-data`),
        apiClient.getData(iapId, `period-${periodId}-command-emphasis`),
        apiClient.getData(iapId, `period-${periodId}-situation`),
        apiClient.getData(iapId, `period-${periodId}-personnel`),
        apiClient.getData(iapId, `period-${periodId}-assignments`),
      ]);

      const period = periodsData?.data?.find((p: any) => p.id === periodId);
      if (!period) {
        toast.error('Operational period not found');
        setGenerating(false);
        return;
      }

      // Get IC name from personnel data
      const personnel = personnelData?.data?.[0];
      let icName = '';
      if (personnel) {
        if (personnel.commandStructure === 'single' && personnel.incidentCommanderName) {
          icName = personnel.incidentCommanderName;
        } else if (personnel.commandStructure === 'unified' && personnel.commanders?.length > 0) {
          // For unified command, use the first commander's name
          icName = personnel.commanders[0].name || '';
        }
      }

      // Transform assignments data into organization data format
      const assignments = assignmentsData?.data || [];
      const assignmentOrganizationData = [];

      // Add branches with their directors
      assignments
        .filter((a: any) => a.divisionGroupType === 'branch')
        .forEach((branch: any) => {
          if (branch.name && branch.supervisorName) {
            assignmentOrganizationData.push({
              position: `${branch.name} Director`,
              name: branch.supervisorName,
            });
          }
        });

      // Add divisions and groups with their supervisors
      assignments
        .filter((a: any) => a.divisionGroupType === 'division' || a.divisionGroupType === 'group')
        .forEach((assignment: any) => {
          if (assignment.name && assignment.supervisorName) {
            const label = assignment.divisionGroupType === 'division' ? 'Division' : 'Group';
            assignmentOrganizationData.push({
              position: `${label} ${assignment.name} Supervisor`,
              name: assignment.supervisorName,
            });
          }
        });

      // Combine old organization data with assignments organization data
      const combinedOrganizationData = [
        ...(organizationRes?.data || []),
        ...assignmentOrganizationData,
      ];

      const baseData = {
        iapData: {
          ...iapRes.iap,
          preparedBy: personnel?.preparedByName || preparedByName,
          preparedByPosition: personnel?.preparedByPosition || preparedByPosition,
          preparedDateTime: personnel?.preparedDateTime || preparedDateTime,
          incidentCommanderName: icName,
        },
        periodData: period,
        organizationData: combinedOrganizationData,
        safetyData: safetyRes?.data || [],
        safetyFormData: safetyDataRes?.data?.[0] || null,
        formData: objectives,
        commandEmphasis: commandData?.data?.[0]?.content || '',
        situationConditions: situationData?.data?.[0]?.content || '',
      };

      // Generate the PDF
      const pdfBytes = await icsFormGenerator.generateICS202(baseData);

      // Download the PDF
      const filename = `ICS_202_${iapRes.iap?.name || 'Incident'}_Period_${period.periodNumber}.pdf`;
      await pdfCombiner.downloadPDF(pdfBytes, filename);

      toast.success('ICS 202 downloaded successfully!');
    } catch (error) {
      console.error('Error generating ICS 202:', error);
      toast.error('Failed to generate ICS 202');
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
        <h1 className="text-2xl font-bold text-white">ICS 202 - Incident Objectives</h1>
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
            onClick={handleGenerateICS202}
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
                ICS 202
              </>
            )}
          </button>
        </div>
      </div>

      {/* Incident Objectives Section */}
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-white">Incident Objectives</h2>
          <HelpCircle className="w-4 h-4 text-slate-400" />
        </div>

        {objectives.length === 0 ? (
          <div
            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-slate-500 transition-colors"
            onClick={addObjective}
          >
            <Plus className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Click to add your first objective</p>
          </div>
        ) : (
          <div className="space-y-3">
            {objectives.map((objective) => (
              <div key={objective.id} className="flex items-start gap-3 bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-semibold mt-1">
                  {objective.number}
                </div>
                <textarea
                  value={objective.description}
                  onChange={(e) => updateObjective(objective.id, e.target.value)}
                  placeholder="Enter objective description..."
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none overflow-hidden min-h-[24px]"
                />
                <button
                  onClick={() => deleteObjective(objective.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {objectives.length > 0 && (
          <button
            onClick={addObjective}
            className="mt-4 flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Objective
          </button>
        )}
      </div>

      {/* Command Emphasis Section */}
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-white">Command Emphasis</h2>
          <HelpCircle className="w-4 h-4 text-slate-400" />
        </div>
        <textarea
          value={commandEmphasis}
          onChange={(e) => setCommandEmphasis(e.target.value)}
          onBlur={saveCommandEmphasis}
          placeholder="Enter command emphasis, which may include tactical priorities, general weather forecast, and Incident Command priorities..."
          className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Situation/Incident Conditions Section */}
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-white">Situation/Incident Conditions</h2>
          <HelpCircle className="w-4 h-4 text-slate-400" />
        </div>
        <textarea
          value={situationConditions}
          onChange={(e) => setSituationConditions(e.target.value)}
          onBlur={saveSituationConditions}
          placeholder="This can include weather, incident conditions, or safety message..."
          className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Prepared By Section */}
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-white">Prepared By</h2>
          <HelpCircle className="w-4 h-4 text-slate-400" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
            <input
              type="text"
              value={preparedByName}
              onChange={(e) => setPreparedByName(e.target.value)}
              onBlur={() => savePreparedByData()}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Position/Title</label>
            <input
              type="text"
              value={preparedByPosition}
              onChange={(e) => setPreparedByPosition(e.target.value)}
              onBlur={() => savePreparedByData()}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date/Time Prepared</label>
            <input
              type="datetime-local"
              value={preparedDateTime}
              onChange={(e) => setPreparedDateTime(e.target.value)}
              onBlur={() => savePreparedByData()}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
