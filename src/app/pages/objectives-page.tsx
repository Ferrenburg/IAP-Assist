'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Trash2, HelpCircle, History, FileText, BookOpen, CircleHelp, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/api-client';
import { useOpPeriod } from '../../contexts/op-period-context';
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
  const { data: shared, update: updateShared } = useOpPeriod();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [commandEmphasis, setCommandEmphasis] = useState('');
  const [situationConditions, setSituationConditions] = useState('');
  const [preparedByName, setPreparedByName] = useState('');
  const [preparedByPosition, setPreparedByPosition] = useState('');
  const [preparedDateTime, setPreparedDateTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const sharedSynced = useRef(false);

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
      // Name and position are shared fields — shared context is the authority.
      // Only use the KV store values as a fallback when the shared context is empty,
      // to avoid overwriting a correct shared value with a stale/partial KV value.
      setPreparedByName((prev) => prev || preparedByData?.data?.[0]?.name || '');
      setPreparedByPosition((prev) => prev || preparedByData?.data?.[0]?.position || '');
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

    // Optimistically add to UI so the user gets instant feedback.
    setObjectives((prev) => [...prev, newObjective]);

    try {
      await apiClient.createData(iapId as string, `period-${periodId}-objectives`, newObjective);
    } catch (err: any) {
      // Roll back optimistic update on failure.
      setObjectives((prev) => prev.filter((o) => o.id !== newObjective.id));
      toast.error(`Failed to add objective: ${err?.message ?? 'unknown error'}`);
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

    // Pre-export validation
    if (!shared?.incidentName) {
      toast.error('Incident name is required. Fill it in on the Incident Info page.');
      return;
    }
    if (objectives.length === 0) {
      toast.error('Add at least one objective before exporting.');
      return;
    }

    try {
      setGenerating(true);
      toast.info('Generating ICS 202...');

      // Only fetch form-specific data; shared fields come from context.
      const [safetyRes, safetyDataRes, commandData, situationData, assignmentsData] = await Promise.all([
        apiClient.getData(iapId, `period-${periodId}-safety`),
        apiClient.getData(iapId, `period-${periodId}-safety-data`),
        apiClient.getData(iapId, `period-${periodId}-command-emphasis`),
        apiClient.getData(iapId, `period-${periodId}-situation`),
        apiClient.getData(iapId, `period-${periodId}-assignments`),
      ]);

      // Build org array from assignments for the organization section.
      const assignments = assignmentsData?.data || [];
      const organizationData: { position: string; name: string }[] = [];
      assignments
        .filter((a: any) => a.divisionGroupType === 'branch')
        .forEach((branch: any) => {
          if (branch.name && branch.supervisorName) {
            organizationData.push({ position: `${branch.name} Director`, name: branch.supervisorName });
          }
        });
      assignments
        .filter((a: any) => a.divisionGroupType === 'division' || a.divisionGroupType === 'group')
        .forEach((a: any) => {
          if (a.name && a.supervisorName) {
            const label = a.divisionGroupType === 'division' ? 'Division' : 'Group';
            organizationData.push({ position: `${label} ${a.name} Supervisor`, name: a.supervisorName });
          }
        });

      const baseData = {
        iapData: {
          incidentName: shared.incidentName,
          incidentNumber: shared.incidentNumber,
          preparedBy: preparedByName,
          preparedByPosition: preparedByPosition,
          preparedDateTime: preparedDateTime,
          incidentCommanderName: shared.incidentCommander,
          agencyName: shared.agencyName,
        },
        periodData: {
          periodNumber: shared.periodNumber,
          startAt: shared.startAt,
          endAt: shared.endAt,
        },
        organizationData,
        safetyData: safetyRes?.data || [],
        safetyFormData: safetyDataRes?.data?.[0] || null,
        formData: objectives,
        commandEmphasis: commandData?.data?.[0]?.content || '',
        situationConditions: situationData?.data?.[0]?.content || '',
      };

      const pdfBytes = await icsFormGenerator.generateICS202(baseData);
      const filename = `ICS_202_${shared.incidentName || 'Incident'}_Period_${shared.periodNumber}.pdf`;
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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Incident info banner — read-only, populated from shared context */}
      {shared && (
        <div className="bg-muted border border-border rounded-lg px-4 py-2.5 flex items-center gap-4 text-sm text-foreground/80 flex-wrap">
          <span><span className="text-muted-foreground">Incident:</span> <span className="text-foreground font-medium">{shared.incidentName || '—'}</span></span>
          <span className="text-muted-foreground">|</span>
          <span><span className="text-muted-foreground">Period:</span> <span className="text-foreground font-medium">{shared.periodNumber}</span></span>
          {shared.startAt && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">{new Date(shared.startAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} – {shared.endAt ? new Date(shared.endAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">ICS 202 - Incident Objectives</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </button>
          <button className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </button>
          <button className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Tutorial
          </button>
          <button className="px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2">
            <CircleHelp className="w-4 h-4" />
            Help
          </button>
          <button
            onClick={handleGenerateICS202}
            disabled={generating}
            className="bg-mustard hover:bg-mustard-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Incident Objectives</h2>
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>

        {objectives.length === 0 ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-sage transition-colors"
            onClick={addObjective}
          >
            <Plus className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Click to add your first objective</p>
          </div>
        ) : (
          <div className="space-y-3">
            {objectives.map((objective) => (
              <div key={objective.id} className="flex items-start gap-3 bg-muted rounded-lg p-4 border border-border">
                <div className="flex-shrink-0 w-8 h-8 bg-sage rounded flex items-center justify-center text-white text-sm font-semibold">
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
                  className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none resize-none overflow-hidden min-h-[24px]"
                />
                <button
                  onClick={() => deleteObjective(objective.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-coral transition-colors"
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
            className="mt-4 flex items-center gap-2 text-sm text-mustard-hover hover:text-mustard transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Objective
          </button>
        )}
      </div>

      {/* Command Emphasis Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Command Emphasis</h2>
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>
        <textarea
          value={commandEmphasis}
          onChange={(e) => setCommandEmphasis(e.target.value)}
          onBlur={saveCommandEmphasis}
          placeholder="Enter command emphasis, which may include tactical priorities, general weather forecast, and Incident Command priorities..."
          className="w-full h-32 bg-muted border border-border rounded-lg px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
        />
      </div>

      {/* Situation/Incident Conditions Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Situation/Incident Conditions</h2>
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>
        <textarea
          value={situationConditions}
          onChange={(e) => setSituationConditions(e.target.value)}
          onBlur={saveSituationConditions}
          placeholder="This can include weather, incident conditions, or safety message..."
          className="w-full h-32 bg-muted border border-border rounded-lg px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
        />
      </div>

      {/* Prepared By Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Prepared By</h2>
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Name</label>
            <input
              type="text"
              value={preparedByName}
              onChange={(e) => setPreparedByName(e.target.value)}
              onBlur={() => savePreparedByData()}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Position/Title</label>
            <input
              type="text"
              value={preparedByPosition}
              onChange={(e) => setPreparedByPosition(e.target.value)}
              onBlur={() => savePreparedByData()}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Date/Time Prepared</label>
            <input
              type="datetime-local"
              value={preparedDateTime}
              onChange={(e) => setPreparedDateTime(e.target.value)}
              onBlur={() => savePreparedByData()}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
