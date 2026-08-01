'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { HelpCircle, History, FileText, BookOpen, CircleHelp, Plus, X, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/api-client';
import { useOpPeriod } from '../../contexts/op-period-context';
import { toast } from 'sonner';
import { icsFormGenerator } from '../../utils/ics-forms/form-generator';
import { pdfCombiner } from '../../utils/pdf-combiner';

interface TechnicalSpecialist {
  id: string;
  name: string;
  specialty: string;
}

interface AgencyRep {
  id: string;
  agency: string;
  representative: string;
}

interface PersonnelData {
  id: string;
  commandStructure: 'single' | 'unified';
  commanders?: { name: string; contact: string }[];
  incidentCommanderName?: string;
  incidentCommanderContact?: string;
  deputyIncidentCommanderName?: string;
  deputyIncidentCommanderContact?: string;
  safetyOfficerName?: string;
  safetyOfficerContact?: string;
  publicInfoOfficerName?: string;
  publicInfoOfficerContact?: string;
  liaisonOfficerName?: string;
  liaisonOfficerContact?: string;
  operationsSectionChief?: string;
  operationsSectionChiefContact?: string;
  operationsDeputyChief?: string;
  operationsDeputyChiefContact?: string;
  stagingAreaManager?: string;
  stagingAreaManagerContact?: string;
  planningSectionChief?: string;
  planningSectionChiefContact?: string;
  planningDeputy?: string;
  planningDeputyContact?: string;
  resourcesUnitLeader?: string;
  resourcesUnitLeaderContact?: string;
  situationUnitLeader?: string;
  situationUnitLeaderContact?: string;
  documentationUnitLeader?: string;
  documentationUnitLeaderContact?: string;
  demobilizationUnitLeader?: string;
  demobilizationUnitLeaderContact?: string;
  technicalSpecialists?: TechnicalSpecialist[];
  logisticsSectionChief?: string;
  logisticsSectionChiefContact?: string;
  logisticsDeputy?: string;
  logisticsDeputyContact?: string;
  supportBranchDirector?: string;
  supportBranchDirectorContact?: string;
  supplyUnitLeader?: string;
  supplyUnitLeaderContact?: string;
  facilitiesUnitLeader?: string;
  facilitiesUnitLeaderContact?: string;
  groundSupportUnitLeader?: string;
  groundSupportUnitLeaderContact?: string;
  serviceBranchDirector?: string;
  serviceBranchDirectorContact?: string;
  communicationsUnitLeader?: string;
  communicationsUnitLeaderContact?: string;
  medicalUnitLeader?: string;
  medicalUnitLeaderContact?: string;
  foodUnitLeader?: string;
  foodUnitLeaderContact?: string;
  financeSectionChief?: string;
  financeSectionChiefContact?: string;
  financeDeputy?: string;
  financeDeputyContact?: string;
  timeUnitLeader?: string;
  timeUnitLeaderContact?: string;
  procurementUnitLeader?: string;
  procurementUnitLeaderContact?: string;
  compensationClaimsUnitLeader?: string;
  compensationClaimsUnitLeaderContact?: string;
  costUnitLeader?: string;
  costUnitLeaderContact?: string;
  agencyReps?: AgencyRep[];
  preparedByName?: string;
  preparedByPosition?: string;
  preparedDateTime?: string;
}

export function PersonnelPage() {
  const { iapId, periodId } = useParams();
  const { data: shared, update: updateShared } = useOpPeriod();
  const [personnelData, setPersonnelData] = useState<PersonnelData>({
    id: '',
    commandStructure: 'single',
  });
  const [loading, setLoading] = useState(true);
  const [focusedFieldValue, setFocusedFieldValue] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const [localPreparedByName, setLocalPreparedByName] = useState('');
  const [localPreparedByTitle, setLocalPreparedByTitle] = useState('');
  const sharedSynced = useRef(false);


  useEffect(() => {
    loadData();
  }, [iapId, periodId]);

  const loadData = async () => {
    if (!iapId || !periodId) return;

    try {
      const data = await apiClient.getData(iapId, `period-${periodId}-personnel`);
      if (data?.data?.[0]) {
        setPersonnelData(data.data[0]);
        setLocalPreparedByName(data.data[0].preparedByName || '');
        setLocalPreparedByTitle(data.data[0].preparedByPosition || '');
      } else {
        setPersonnelData({ id: crypto.randomUUID(), commandStructure: 'single' });
      }
    } catch (err) {
      console.error('Failed to load personnel data:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (dataOverride?: PersonnelData) => {
    if (!iapId || !periodId) return;

    const dataToUse = dataOverride || personnelData;

    try {
      const existing = await apiClient.getData(iapId, `period-${periodId}-personnel`);
      if (existing?.data?.[0]) {
        const dataToSave = { ...dataToUse, id: existing.data[0].id };
        try {
          await apiClient.updateData(iapId, `period-${periodId}-personnel`, existing.data[0].id, dataToSave);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-personnel`, dataToSave);
          } else {
            throw updateErr;
          }
        }
        // Don't call setPersonnelData here — updateField already set the optimistic state.
        // Calling it again with a stale closure snapshot causes the flicker.
      } else {
        // Create new record
        const createdData = await apiClient.createData(iapId, `period-${periodId}-personnel`, dataToUse);
        // Update local state with the created record's ID if returned
        if (createdData?.item?.id) {
          setPersonnelData({ ...dataToUse, id: createdData.item.id });
        }
      }
      toast.success('Personnel data saved');
    } catch (err) {
      toast.error('Failed to save personnel data');
      console.error('Failed to save personnel data:', err);
    }
  };

  const updateField = (field: keyof PersonnelData, value: any) => {
    setPersonnelData({ ...personnelData, [field]: value });
  };

  const handleInputFocus = (currentValue: any) => {
    setFocusedFieldValue(currentValue);
  };

  const handleInputBlur = (currentValue: any) => {
    // Only save if the value actually changed from when we focused
    if (focusedFieldValue !== null && currentValue !== focusedFieldValue) {
      saveData();
    }
    setFocusedFieldValue(null);
  };

  const handleGenerateICS203 = async () => {
    if (!iapId || !periodId) return;

    if (!shared?.incidentName) {
      toast.error('Incident name is required. Fill it in on the Incident Info page.');
      return;
    }

    try {
      setGenerating(true);
      toast.info('Generating ICS 203...');

      // Only fetch form-specific data; shared fields come from context.
      const [safetyRes, assignmentsData] = await Promise.all([
        apiClient.getData(iapId, `period-${periodId}-safety`),
        apiClient.getData(iapId, `period-${periodId}-assignments`),
      ]);

      // Transform personnel data to organization format expected by ICS 203
      const organizationData = [];

      // Add command staff
      if (personnelData.commandStructure === 'single' && personnelData.incidentCommanderName) {
        organizationData.push({ position: 'Incident Commander', name: personnelData.incidentCommanderName });
      } else if (personnelData.commandStructure === 'unified' && personnelData.commanders) {
        personnelData.commanders.forEach(cmd => {
          if (cmd.name) organizationData.push({ position: 'Incident Commander', name: cmd.name });
        });
      }
      if (personnelData.deputyIncidentCommanderName) organizationData.push({ position: 'Deputy Incident Commander', name: personnelData.deputyIncidentCommanderName });
      if (personnelData.safetyOfficerName) organizationData.push({ position: 'Safety Officer', name: personnelData.safetyOfficerName });
      if (personnelData.publicInfoOfficerName) organizationData.push({ position: 'Public Information Officer', name: personnelData.publicInfoOfficerName });
      if (personnelData.liaisonOfficerName) organizationData.push({ position: 'Liaison Officer', name: personnelData.liaisonOfficerName });

      // Add agency reps
      if (personnelData.agencyReps) {
        personnelData.agencyReps.forEach(rep => {
          if (rep.representative) organizationData.push({ position: 'Agency Representative', name: rep.representative, agency: rep.agency });
        });
      }

      // Operations Section
      if (personnelData.operationsSectionChief) organizationData.push({ position: 'Operations Section Chief', name: personnelData.operationsSectionChief });
      if (personnelData.operationsDeputyChief) organizationData.push({ position: 'Deputy Operations Section Chief', name: personnelData.operationsDeputyChief });
      if (personnelData.stagingAreaManager) organizationData.push({ position: 'Staging Area Manager', name: personnelData.stagingAreaManager });

      // Planning Section
      if (personnelData.planningSectionChief) organizationData.push({ position: 'Planning Section Chief', name: personnelData.planningSectionChief });
      if (personnelData.planningDeputy) organizationData.push({ position: 'Deputy Planning Section Chief', name: personnelData.planningDeputy });
      if (personnelData.resourcesUnitLeader) organizationData.push({ position: 'Resources Unit Leader', name: personnelData.resourcesUnitLeader });
      if (personnelData.situationUnitLeader) organizationData.push({ position: 'Situation Unit Leader', name: personnelData.situationUnitLeader });
      if (personnelData.documentationUnitLeader) organizationData.push({ position: 'Documentation Unit Leader', name: personnelData.documentationUnitLeader });
      if (personnelData.demobilizationUnitLeader) organizationData.push({ position: 'Demobilization Unit Leader', name: personnelData.demobilizationUnitLeader });

      // Technical Specialists
      if (personnelData.technicalSpecialists) {
        personnelData.technicalSpecialists.forEach(spec => {
          if (spec.name) organizationData.push({ position: 'Technical Specialist', name: spec.name });
        });
      }

      // Logistics Section
      if (personnelData.logisticsSectionChief) organizationData.push({ position: 'Logistics Section Chief', name: personnelData.logisticsSectionChief });
      if (personnelData.logisticsDeputy) organizationData.push({ position: 'Deputy Logistics Section Chief', name: personnelData.logisticsDeputy });
      if (personnelData.supportBranchDirector) organizationData.push({ position: 'Support Branch Director', name: personnelData.supportBranchDirector });
      if (personnelData.supplyUnitLeader) organizationData.push({ position: 'Supply Unit Leader', name: personnelData.supplyUnitLeader });
      if (personnelData.facilitiesUnitLeader) organizationData.push({ position: 'Facilities Unit Leader', name: personnelData.facilitiesUnitLeader });
      if (personnelData.groundSupportUnitLeader) organizationData.push({ position: 'Ground Support Unit Leader', name: personnelData.groundSupportUnitLeader });
      if (personnelData.serviceBranchDirector) organizationData.push({ position: 'Service Branch Director', name: personnelData.serviceBranchDirector });
      if (personnelData.communicationsUnitLeader) organizationData.push({ position: 'Communications Unit Leader', name: personnelData.communicationsUnitLeader });
      if (personnelData.medicalUnitLeader) organizationData.push({ position: 'Medical Unit Leader', name: personnelData.medicalUnitLeader });
      if (personnelData.foodUnitLeader) organizationData.push({ position: 'Food Unit Leader', name: personnelData.foodUnitLeader });

      // Finance/Admin Section
      if (personnelData.financeSectionChief) organizationData.push({ position: 'Finance/Administration Section Chief', name: personnelData.financeSectionChief });
      if (personnelData.financeDeputy) organizationData.push({ position: 'Deputy Finance/Administration Section Chief', name: personnelData.financeDeputy });
      if (personnelData.timeUnitLeader) organizationData.push({ position: 'Time Unit Leader', name: personnelData.timeUnitLeader });
      if (personnelData.procurementUnitLeader) organizationData.push({ position: 'Procurement Unit Leader', name: personnelData.procurementUnitLeader });
      if (personnelData.compensationClaimsUnitLeader) organizationData.push({ position: 'Compensation/Claims Unit Leader', name: personnelData.compensationClaimsUnitLeader });
      if (personnelData.costUnitLeader) organizationData.push({ position: 'Cost Unit Leader', name: personnelData.costUnitLeader });

      // Transform assignments data for Operations Section
      const assignments = assignmentsData?.data || [];
      const branchesData = assignments
        .filter((a: any) => a.divisionGroupType === 'branch')
        .map((a: any) => ({
          name: a.name || '',
          directorName: a.supervisorName || '',
        }));

      const divisionsData = assignments
        .filter((a: any) => a.divisionGroupType === 'division' || a.divisionGroupType === 'group')
        .map((a: any) => ({
          position: a.name || '',
          name: a.supervisorName || '',
          type: a.divisionGroupType,
          branch: a.branch || null,
        }));

      const baseData = {
        iapData: {
          incidentName: shared?.incidentName ?? '',
          incidentNumber: shared?.incidentNumber ?? '',
          preparedBy: localPreparedByName,
          preparedByPosition: localPreparedByTitle,
          preparedDateTime: personnelData.preparedDateTime ?? '',
          agencyName: shared?.agencyName ?? '',
        },
        periodData: {
          periodNumber: shared?.periodNumber,
          startAt: shared?.startAt,
          endAt: shared?.endAt,
        },
        organizationData,
        branchesData,
        divisionsData,
        safetyData: safetyRes?.data || [],
        formData: organizationData,
      };

      const pdfBytes = await icsFormGenerator.generateICS203(baseData);
      const filename = `ICS_203_${shared?.incidentName || 'Incident'}_Period_${shared?.periodNumber}.pdf`;
      await pdfCombiner.downloadPDF(pdfBytes, filename);

      toast.success('ICS 203 downloaded successfully!');
    } catch (error) {
      console.error('Error generating ICS 203:', error);
      toast.error('Failed to generate ICS 203');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateICS207 = async () => {
    if (!iapId || !periodId) return;

    if (!shared?.incidentName) {
      toast.error('Incident name is required. Fill it in on the Incident Info page.');
      return;
    }

    try {
      setGenerating(true);
      toast.info('Generating ICS 207...');

      // Build the 8 top-level org chart positions from personnel data
      const organizationData: { position: string; name: string }[] = [];

      if (personnelData.commandStructure === 'single' && personnelData.incidentCommanderName) {
        organizationData.push({ position: 'Incident Commander', name: personnelData.incidentCommanderName });
      } else if (personnelData.commandStructure === 'unified' && personnelData.commanders) {
        personnelData.commanders.forEach(cmd => {
          if (cmd.name) organizationData.push({ position: 'Incident Commander', name: cmd.name });
        });
      }
      if (personnelData.safetyOfficerName)    organizationData.push({ position: 'Safety Officer',               name: personnelData.safetyOfficerName });
      if (personnelData.publicInfoOfficerName) organizationData.push({ position: 'Public Information Officer',  name: personnelData.publicInfoOfficerName });
      if (personnelData.liaisonOfficerName)   organizationData.push({ position: 'Liaison Officer',             name: personnelData.liaisonOfficerName });
      if (personnelData.operationsSectionChief) organizationData.push({ position: 'Operations Section Chief',  name: personnelData.operationsSectionChief });
      if (personnelData.planningSectionChief)  organizationData.push({ position: 'Planning Section Chief',     name: personnelData.planningSectionChief });
      if (personnelData.logisticsSectionChief) organizationData.push({ position: 'Logistics Section Chief',    name: personnelData.logisticsSectionChief });
      if (personnelData.financeSectionChief)   organizationData.push({ position: 'Finance/Admin Section Chief', name: personnelData.financeSectionChief });

      const pdfBytes = await icsFormGenerator.generateICS207({
        iapData: {
          incidentName: shared?.incidentName ?? '',
          incidentNumber: shared?.incidentNumber ?? '',
          preparedBy: localPreparedByName,
          preparedByPosition: localPreparedByTitle,
          preparedDateTime: personnelData.preparedDateTime ?? '',
          agencyName: shared?.agencyName ?? '',
        },
        periodData: {
          periodNumber: shared?.periodNumber,
          startAt: shared?.startAt,
          endAt: shared?.endAt,
        },
        formData: organizationData,
      });

      const filename = `ICS_207_${shared?.incidentName || 'Incident'}_Period_${shared?.periodNumber}.pdf`;
      await pdfCombiner.downloadPDF(pdfBytes, filename);
      toast.success('ICS 207 downloaded successfully!');
    } catch (error) {
      console.error('Error generating ICS 207:', error);
      toast.error('Failed to generate ICS 207');
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">ICS 203 - Organization Assignment List</h1>
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
            onClick={handleGenerateICS203}
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
                ICS 203
              </>
            )}
          </button>
          <button
            onClick={handleGenerateICS207}
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
                ICS 207
              </>
            )}
          </button>
        </div>
      </div>

      {/* Command Structure */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Command Structure</h2>
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const newData = { ...personnelData, commandStructure: 'single' as const };
                updateField('commandStructure', 'single');
                await saveData(newData);
              }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                personnelData.commandStructure === 'single'
                  ? 'bg-sage text-white'
                  : 'bg-muted text-foreground/80 hover:bg-accent'
              }`}
            >
              Single Incident Commander
            </button>
            <button
              onClick={async () => {
                const newData = { ...personnelData, commandStructure: 'unified' as const };
                updateField('commandStructure', 'unified');
                await saveData(newData);
              }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                personnelData.commandStructure === 'unified'
                  ? 'bg-sage text-white'
                  : 'bg-muted text-foreground/80 hover:bg-accent'
              }`}
            >
              Unified Command
            </button>
          </div>
        </div>

        {personnelData.commandStructure === 'single' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Incident Commander</label>
              <input
                type="text"
                value={personnelData.incidentCommanderName || ''}
                onFocus={(e) => handleInputFocus(e.target.value)}
                onChange={(e) => {
                  updateField('incidentCommanderName', e.target.value);
                  void updateShared({ incidentCommander: e.target.value });
                }}
                onBlur={(e) => handleInputBlur(e.target.value)}
                placeholder="Select or type name"
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
              <input
                type="text"
                value={personnelData.incidentCommanderContact || ''}
                onFocus={(e) => handleInputFocus(e.target.value)}
                onChange={(e) => updateField('incidentCommanderContact', e.target.value)}
                onBlur={(e) => handleInputBlur(e.target.value)}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Add one or more Unified Command representatives for this incident</p>
              <button
                onClick={async () => {
                  const commanders = personnelData.commanders || [];
                  const updated = [...commanders, { name: '', contact: '' }];
                  const newData = { ...personnelData, commanders: updated };
                  updateField('commanders', updated);
                  // Save immediately with the updated data
                  await saveData(newData);
                }}
                className="px-3 py-1.5 bg-sage hover:bg-sage-hover text-white text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Commander
              </button>
            </div>
            {(personnelData.commanders || []).map((cmd, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-4 mb-3">
                <input
                  type="text"
                  value={cmd.name}
                  onChange={(e) => {
                    const updated = [...(personnelData.commanders || [])];
                    updated[idx].name = e.target.value;
                    updateField('commanders', updated);
                  }}
                  onBlur={() => saveData()}
                  placeholder="Commander Name"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cmd.contact}
                    onChange={(e) => {
                      const updated = [...(personnelData.commanders || [])];
                      updated[idx].contact = e.target.value;
                      updateField('commanders', updated);
                    }}
                    onBlur={() => saveData()}
                    placeholder="Contact"
                    className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
                  />
                  <button
                    onClick={async () => {
                      const updated = (personnelData.commanders || []).filter((_, i) => i !== idx);
                      const newData = { ...personnelData, commanders: updated };
                      updateField('commanders', updated);
                      await saveData(newData);
                    }}
                    className="p-2 text-coral hover:text-coral transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Command & General Staff */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Command Staff</h2>
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Deputy Incident Commander</label>
            <input
              type="text"
              value={personnelData.deputyIncidentCommanderName || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('deputyIncidentCommanderName', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.deputyIncidentCommanderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('deputyIncidentCommanderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Safety Officer</label>
            <input
              type="text"
              value={personnelData.safetyOfficerName || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('safetyOfficerName', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.safetyOfficerContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('safetyOfficerContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Public Information Officer</label>
            <input
              type="text"
              value={personnelData.publicInfoOfficerName || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('publicInfoOfficerName', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.publicInfoOfficerContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('publicInfoOfficerContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Liaison Officer</label>
            <input
              type="text"
              value={personnelData.liaisonOfficerName || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('liaisonOfficerName', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.liaisonOfficerContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('liaisonOfficerContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </div>

      {/* Operations Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Operations Section</h2>
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Operations Section Chief</label>
            <input
              type="text"
              value={personnelData.operationsSectionChief || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('operationsSectionChief', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.operationsSectionChiefContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('operationsSectionChiefContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Operations Deputy</label>
            <input
              type="text"
              value={personnelData.operationsDeputyChief || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('operationsDeputyChief', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.operationsDeputyChiefContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('operationsDeputyChiefContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Staging Area Manager</label>
            <input
              type="text"
              value={personnelData.stagingAreaManager || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('stagingAreaManager', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.stagingAreaManagerContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('stagingAreaManagerContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </div>

      {/* Planning Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Planning Section</h2>
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Planning Section Chief</label>
            <input
              type="text"
              value={personnelData.planningSectionChief || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('planningSectionChief', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.planningSectionChiefContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('planningSectionChiefContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Planning Deputy</label>
            <input
              type="text"
              value={personnelData.planningDeputy || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('planningDeputy', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.planningDeputyContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('planningDeputyContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Resources Unit Leader</label>
            <input
              type="text"
              value={personnelData.resourcesUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('resourcesUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.resourcesUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('resourcesUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Situation Unit Leader</label>
            <input
              type="text"
              value={personnelData.situationUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('situationUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.situationUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('situationUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Documentation Unit Leader</label>
            <input
              type="text"
              value={personnelData.documentationUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('documentationUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.documentationUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('documentationUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Demobilization Unit Leader</label>
            <input
              type="text"
              value={personnelData.demobilizationUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('demobilizationUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.demobilizationUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('demobilizationUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>

        {/* Technical Specialists */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-foreground/80">Technical Specialists</label>
            <button
              onClick={async () => {
                const specialists = personnelData.technicalSpecialists || [];
                const updated = [...specialists, { id: crypto.randomUUID(), name: '', specialty: '' }];
                const newData = { ...personnelData, technicalSpecialists: updated };
                updateField('technicalSpecialists', updated);
                await saveData(newData);
              }}
              className="px-3 py-1.5 bg-sage hover:bg-sage-hover text-white text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Specialist
            </button>
          </div>
          {(personnelData.technicalSpecialists || []).map((specialist, idx) => (
            <div key={specialist.id} className="grid grid-cols-2 gap-4 mb-3">
              <input
                type="text"
                value={specialist.name}
                onChange={(e) => {
                  const updated = [...(personnelData.technicalSpecialists || [])];
                  updated[idx].name = e.target.value;
                  updateField('technicalSpecialists', updated);
                }}
                onBlur={() => saveData()}
                placeholder="Select or type name"
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={specialist.specialty}
                  onChange={(e) => {
                    const updated = [...(personnelData.technicalSpecialists || [])];
                    updated[idx].specialty = e.target.value;
                    updateField('technicalSpecialists', updated);
                  }}
                  onBlur={() => saveData()}
                  placeholder="e.g., Hazmat, Weather, GIS"
                  className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
                />
                <button
                  onClick={async () => {
                    const updated = (personnelData.technicalSpecialists || []).filter((_, i) => i !== idx);
                    const newData = { ...personnelData, technicalSpecialists: updated };
                    updateField('technicalSpecialists', updated);
                    await saveData(newData);
                  }}
                  className="p-2 text-coral hover:text-coral transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logistics Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Logistics Section</h2>
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Logistics Section Chief</label>
            <input
              type="text"
              value={personnelData.logisticsSectionChief || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('logisticsSectionChief', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.logisticsSectionChiefContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('logisticsSectionChiefContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Logistics Deputy</label>
            <input
              type="text"
              value={personnelData.logisticsDeputy || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('logisticsDeputy', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.logisticsDeputyContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('logisticsDeputyContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Support Branch Director</label>
            <input
              type="text"
              value={personnelData.supportBranchDirector || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('supportBranchDirector', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.supportBranchDirectorContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('supportBranchDirectorContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Supply Unit Leader</label>
            <input
              type="text"
              value={personnelData.supplyUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('supplyUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.supplyUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('supplyUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Facilities Unit Leader</label>
            <input
              type="text"
              value={personnelData.facilitiesUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('facilitiesUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.facilitiesUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('facilitiesUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Ground Support Unit Leader</label>
            <input
              type="text"
              value={personnelData.groundSupportUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('groundSupportUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.groundSupportUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('groundSupportUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Service Branch Director</label>
            <input
              type="text"
              value={personnelData.serviceBranchDirector || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('serviceBranchDirector', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.serviceBranchDirectorContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('serviceBranchDirectorContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Communications Unit Leader</label>
            <input
              type="text"
              value={personnelData.communicationsUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('communicationsUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.communicationsUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('communicationsUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Medical Unit Leader</label>
            <input
              type="text"
              value={personnelData.medicalUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('medicalUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.medicalUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('medicalUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Food Unit Leader</label>
            <input
              type="text"
              value={personnelData.foodUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('foodUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.foodUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('foodUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </div>

      {/* Finance/Administration Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Finance/Administration Section</h2>
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Finance/Administration Section Chief</label>
            <input
              type="text"
              value={personnelData.financeSectionChief || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('financeSectionChief', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.financeSectionChiefContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('financeSectionChiefContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Finance Deputy</label>
            <input
              type="text"
              value={personnelData.financeDeputy || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('financeDeputy', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.financeDeputyContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('financeDeputyContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Time Unit Leader</label>
            <input
              type="text"
              value={personnelData.timeUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('timeUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.timeUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('timeUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Procurement Unit Leader</label>
            <input
              type="text"
              value={personnelData.procurementUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('procurementUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.procurementUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('procurementUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Compensation/Claims Unit Leader</label>
            <input
              type="text"
              value={personnelData.compensationClaimsUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('compensationClaimsUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.compensationClaimsUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('compensationClaimsUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Cost Unit Leader</label>
            <input
              type="text"
              value={personnelData.costUnitLeader || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('costUnitLeader', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              placeholder="Select or type name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Contact</label>
            <input
              type="text"
              value={personnelData.costUnitLeaderContact || ''}
              onFocus={(e) => handleInputFocus(e.target.value)}
              onChange={(e) => updateField('costUnitLeaderContact', e.target.value)}
              onBlur={(e) => handleInputBlur(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </div>

      {/* Agency/Organization Representatives */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Agency/Organization Representatives</h2>
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </div>
          <button
            onClick={async () => {
              const reps = personnelData.agencyReps || [];
              const updated = [...reps, { id: crypto.randomUUID(), agency: '', representative: '' }];
              const newData = { ...personnelData, agencyReps: updated };
              updateField('agencyReps', updated);
              await saveData(newData);
            }}
            className="px-3 py-1.5 bg-sage hover:bg-sage-hover text-white text-xs rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Representative
          </button>
        </div>
        {(personnelData.agencyReps || []).map((rep, idx) => (
          <div key={rep.id} className="grid grid-cols-2 gap-4 mb-3">
            <input
              type="text"
              value={rep.agency}
              onChange={(e) => {
                const updated = [...(personnelData.agencyReps || [])];
                updated[idx].agency = e.target.value;
                updateField('agencyReps', updated);
              }}
              onBlur={() => saveData()}
              placeholder="Agency/Organization"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={rep.representative}
                onChange={(e) => {
                  const updated = [...(personnelData.agencyReps || [])];
                  updated[idx].representative = e.target.value;
                  updateField('agencyReps', updated);
                }}
                onBlur={() => saveData()}
                placeholder="Representative Name"
                className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
              />
              <button
                onClick={async () => {
                  const updated = (personnelData.agencyReps || []).filter((_, i) => i !== idx);
                  const newData = { ...personnelData, agencyReps: updated };
                  updateField('agencyReps', updated);
                  await saveData(newData);
                }}
                className="p-2 text-coral hover:text-coral transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Prepared By */}
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
              value={localPreparedByName}
              onChange={(e) => {
                setLocalPreparedByName(e.target.value);
                updateField('preparedByName', e.target.value);
              }}
              onBlur={() => saveData()}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Position/Title</label>
            <input
              type="text"
              value={localPreparedByTitle}
              onChange={(e) => {
                setLocalPreparedByTitle(e.target.value);
                updateField('preparedByPosition', e.target.value);
              }}
              onBlur={() => saveData()}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">Date/Time Prepared</label>
            <input
              type="datetime-local"
              value={personnelData.preparedDateTime || ''}
              onChange={(e) => updateField('preparedDateTime', e.target.value)}
              onBlur={() => saveData()}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
