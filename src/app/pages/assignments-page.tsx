'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { HelpCircle, History, FileText, BookOpen, CircleHelp, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/api-client';
import { useOpPeriod } from '../../contexts/op-period-context';
import { toast } from 'sonner';
import { icsFormGenerator } from '../../utils/ics-forms/form-generator';
import { pdfCombiner } from '../../utils/pdf-combiner';

interface Resource {
  id: string;
  name: string;
  leaderName: string;
  numPersons: string;
  contact: string;
  notes: string;
}

interface ContactInfo {
  id: string;
  function: string;
  name: string;
  contact: string;
}

interface Assignment {
  id: string;
  branchDivisionGroup: string;
  divisionGroupType: 'division' | 'group' | 'branch' | 'staging';
  name: string;
  supervisorName?: string;
  supervisorContact?: string;
  branch?: string;
  reportingLocation: string;
  resources: Resource[];
  workAssignments: string;
  specialInstructions: string;
  contacts: ContactInfo[];
}

interface FormPreparation {
  id: string;
  preparedByName: string;
  positionTitle: string;
  dateTimePrepared: string;
}

export function AssignmentsPage() {
  const { iapId, periodId } = useParams();
  const { data: shared, update: updateShared } = useOpPeriod();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [formPrep, setFormPrep] = useState<FormPreparation>({
    id: '',
    preparedByName: '',
    positionTitle: '',
    dateTimePrepared: '',
  });
  const [loading, setLoading] = useState(true);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [localPreparedByName, setLocalPreparedByName] = useState('');
  const [localPreparedByTitle, setLocalPreparedByTitle] = useState('');
  const sharedSynced = useRef(false);

  useEffect(() => {
    if (shared && !sharedSynced.current) {
      sharedSynced.current = true;
      setLocalPreparedByName(shared.preparedByName ?? '');
      setLocalPreparedByTitle(shared.preparedByTitle ?? '');
    }
  }, [shared]);

  useEffect(() => {
    loadData();
  }, [iapId, periodId]);

  const loadData = async () => {
    if (!iapId || !periodId) return;

    try {
      const [assignmentsData, prepData] = await Promise.all([
        apiClient.getData(iapId, `period-${periodId}-assignments`),
        apiClient.getData(iapId, `period-${periodId}-assignments-prep`),
      ]);

      const loadedAssignments = (assignmentsData?.data || []).map((a: any) => ({
        ...a,
        resources: a.resources || [],
        contacts: a.contacts || [],
      }));

      setAssignments(loadedAssignments);
      if (prepData?.data?.[0]) {
        setFormPrep(prepData.data[0]);
      } else {
        setFormPrep({
          id: crypto.randomUUID(),
          preparedByName: '',
          positionTitle: '',
          dateTimePrepared: '',
        });
      }
    } catch (err) {
      console.error('Failed to load assignments data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addAssignment = async () => {
    if (!iapId || !periodId) return;

    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      branchDivisionGroup: '',
      divisionGroupType: 'branch',
      name: '',
      supervisorName: '',
      supervisorContact: '',
      branch: '',
      reportingLocation: '',
      resources: [],
      workAssignments: '',
      specialInstructions: '',
      contacts: [],
    };

    try {
      await apiClient.createData(iapId, `period-${periodId}-assignments`, newAssignment);
      setAssignments([...assignments, newAssignment]);
      setExpandedAssignment(newAssignment.id);
      toast.success('Assignment added');
    } catch (err) {
      toast.error('Failed to add assignment');
      console.error('Failed to add assignment:', err);
    }
  };

  const addResource = (assignmentId: string) => {
    const updated = assignments.map(a =>
      a.id === assignmentId
        ? { ...a, resources: [...a.resources, { id: crypto.randomUUID(), name: '', leaderName: '', numPersons: '', contact: '', notes: '' }] }
        : a
    );
    setAssignments(updated);
  };

  const updateResource = (assignmentId: string, resourceId: string, field: keyof Resource, value: string) => {
    const updated = assignments.map(a =>
      a.id === assignmentId
        ? { ...a, resources: a.resources.map(r => r.id === resourceId ? { ...r, [field]: value } : r) }
        : a
    );
    setAssignments(updated);
  };

  const deleteResource = (assignmentId: string, resourceId: string) => {
    const updated = assignments.map(a =>
      a.id === assignmentId ? { ...a, resources: a.resources.filter(r => r.id !== resourceId) } : a
    );
    setAssignments(updated);
  };

  const addContact = (assignmentId: string) => {
    const updated = assignments.map(a =>
      a.id === assignmentId
        ? { ...a, contacts: [...a.contacts, { id: crypto.randomUUID(), function: '', name: '', contact: '' }] }
        : a
    );
    setAssignments(updated);
  };

  const updateContact = (assignmentId: string, contactId: string, field: keyof ContactInfo, value: string) => {
    const updated = assignments.map(a =>
      a.id === assignmentId
        ? { ...a, contacts: a.contacts.map(c => c.id === contactId ? { ...c, [field]: value } : c) }
        : a
    );
    setAssignments(updated);
  };

  const deleteContact = (assignmentId: string, contactId: string) => {
    const updated = assignments.map(a =>
      a.id === assignmentId ? { ...a, contacts: a.contacts.filter(c => c.id !== contactId) } : a
    );
    setAssignments(updated);
  };

  const updateAssignment = (id: string, field: keyof Assignment, value: any) => {
    const updated = assignments.map(a => a.id === id ? { ...a, [field]: value } : a);
    setAssignments(updated);
  };

  const saveAssignment = async (id: string) => {
    if (!iapId || !periodId) return;

    try {
      const assignment = assignments.find(a => a.id === id);
      if (assignment) {
        try {
          await apiClient.updateData(iapId, `period-${periodId}-assignments`, id, assignment);
          toast.success('Assignment saved');
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-assignments`, assignment);
            toast.success('Assignment saved');
          } else {
            throw updateErr;
          }
        }
      }
    } catch (err) {
      toast.error('Failed to save assignment');
      console.error('Failed to save assignment:', err);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!iapId || !periodId) return;

    const updated = assignments.filter(a => a.id !== id);
    setAssignments(updated);

    try {
      try {
        await apiClient.deleteData(iapId, `period-${periodId}-assignments`, id);
      } catch (deleteErr: any) {
        if (!deleteErr.message?.includes('not found') && deleteErr.status !== 404) throw deleteErr;
      }
      toast.success('Assignment deleted');
    } catch (err) {
      toast.error('Failed to delete assignment');
      console.error('Failed to delete assignment:', err);
      loadData();
    }
  };

  const saveFormPrep = async () => {
    if (!iapId || !periodId) return;

    try {
      const existing = await apiClient.getData(iapId, `period-${periodId}-assignments-prep`);
      if (existing?.data?.[0]) {
        const dataToSave = { ...formPrep, id: existing.data[0].id };
        try {
          await apiClient.updateData(iapId, `period-${periodId}-assignments-prep`, existing.data[0].id, dataToSave);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-assignments-prep`, dataToSave);
          } else {
            throw updateErr;
          }
        }
        setFormPrep(dataToSave);
      } else {
        await apiClient.createData(iapId, `period-${periodId}-assignments-prep`, formPrep);
      }
      toast.success('Form preparation saved');
    } catch (err) {
      toast.error('Failed to save form preparation');
      console.error('Failed to save form preparation:', err);
    }
  };

  const handleGenerateICS204 = async () => {
    if (!iapId || !periodId) return;

    if (!shared?.incidentName) {
      toast.error('Set an incident name in Incident Info before exporting');
      return;
    }
    if (assignments.length === 0) {
      toast.error('Add at least one assignment before exporting');
      return;
    }

    try {
      setGenerating(true);
      toast.info('Generating ICS 204...');

      const personnelData = await apiClient.getData(iapId, `period-${periodId}-personnel`);
      const personnel = personnelData?.data?.[0];

      const formatPreparedDateTime = (datetimeStr: string) => {
        if (!datetimeStr) return '';
        const dt = new Date(datetimeStr);
        const date = dt.toISOString().split('T')[0];
        const time = dt.toTimeString().split(' ')[0].substring(0, 5);
        return `${date} ${time}`;
      };

      // Build a synthetic iapData and periodData from shared context
      const iapData = {
        incidentName: shared.incidentName,
        incidentNumber: shared.incidentNumber,
        preparedBy: shared.preparedByName,
        preparedByPosition: shared.preparedByTitle,
        preparedDateTime: formPrep.dateTimePrepared
          ? formatPreparedDateTime(formPrep.dateTimePrepared)
          : new Date().toISOString(),
      };
      const periodData = { startAt: shared.startAt, endAt: shared.endAt };

      const pdfPages = [];
      for (const assignment of assignments) {
        let branchDirector = '';
        let branchDirectorContact = '';
        if (assignment.branch && assignment.divisionGroupType !== 'branch') {
          const branchAssignment = assignments.find(
            a => a.divisionGroupType === 'branch' && a.name === assignment.branch
          );
          branchDirector = branchAssignment?.supervisorName || '';
          branchDirectorContact = branchAssignment?.supervisorContact || '';
        }

        const assignmentData = {
          iapData,
          periodData,
          formData: [{
            division: assignment.name,
            divisionGroupType: assignment.divisionGroupType,
            branch: assignment.branch || '',
            reportingLocation: assignment.reportingLocation || '',
            supervisor: assignment.supervisorName || '',
            supervisorContact: assignment.supervisorContact || '',
            resources: assignment.resources,
            workAssignment: assignment.workAssignments,
            specialInstructions: assignment.specialInstructions,
            communications: assignment.contacts,
          }],
          operationsSectionChief: personnel?.operationsSectionChief || '',
          operationsSectionChiefContact: personnel?.operationsSectionChiefContact || '',
          branchDirector,
          branchDirectorContact,
          preparedBy: shared.preparedByName,
          preparedByPosition: shared.preparedByTitle,
          preparedDateTime: formatPreparedDateTime(formPrep.dateTimePrepared),
        };

        const pdfBytes = await icsFormGenerator.generateICS204(assignmentData);
        pdfPages.push(pdfBytes);
      }

      const combinedPdf = await pdfCombiner.combinePDFs(pdfPages);
      const filename = `ICS_204_${shared.incidentName}_Period_${shared.periodNumber || ''}.pdf`;
      await pdfCombiner.downloadPDF(combinedPdf, filename);
      toast.success('ICS 204 downloaded successfully!');
    } catch (error) {
      console.error('Error generating ICS 204:', error);
      toast.error('Failed to generate ICS 204');
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
        <h1 className="text-2xl font-bold text-white">ICS 204 - Assignment List</h1>
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
            onClick={handleGenerateICS204}
            disabled={generating}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
            ) : (
              <><FileText className="w-4 h-4" />ICS 204</>
            )}
          </button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.map((assignment, index) => {
          const isExpanded = expandedAssignment === assignment.id;

          return (
            <div key={assignment.id} className="bg-slate-900 rounded-lg border border-slate-700">
              {/* Header - Always Visible */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setExpandedAssignment(isExpanded ? null : assignment.id)}
              >
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-white">
                    Assignment {index + 1}
                    {assignment.name && ` - ${assignment.name}`}
                  </h3>
                  <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                    {assignment.divisionGroupType === 'branch' ? 'Branch' : assignment.divisionGroupType === 'division' ? 'Division' : assignment.divisionGroupType === 'staging' ? 'Staging Area' : 'Group'}
                  </span>
                  {assignment.supervisorName && (
                    <span className="text-sm text-slate-400">
                      {assignment.divisionGroupType === 'branch' ? 'Director' : 'Supervisor'}: {assignment.supervisorName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); saveAssignment(assignment.id); }}
                    className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteAssignment(assignment.id); }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="text-slate-400 hover:text-white transition-colors">
                    {isExpanded ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-6 pt-0 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                      <select
                        value={assignment.divisionGroupType}
                        onChange={(e) => updateAssignment(assignment.id, 'divisionGroupType', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="branch">Branch</option>
                        <option value="division">Division</option>
                        <option value="group">Group</option>
                        <option value="staging">Staging Area</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                      <input
                        type="text"
                        value={assignment.name}
                        onChange={(e) => updateAssignment(assignment.id, 'name', e.target.value)}
                        placeholder="Identifier..."
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {assignment.divisionGroupType === 'branch' ? 'Branch Director' : assignment.divisionGroupType === 'staging' ? 'Staging Area Manager' : 'Division/Group Supervisor'}
                      </label>
                      <input
                        type="text"
                        value={assignment.supervisorName || ''}
                        onChange={(e) => updateAssignment(assignment.id, 'supervisorName', e.target.value)}
                        placeholder="Enter name..."
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {assignment.divisionGroupType === 'branch' ? 'Branch Director Contact(s)' : assignment.divisionGroupType === 'staging' ? 'Staging Area Manager Contact(s)' : 'Supervisor Contact(s)'}
                      </label>
                      <input
                        type="text"
                        value={assignment.supervisorContact || ''}
                        onChange={(e) => updateAssignment(assignment.id, 'supervisorContact', e.target.value)}
                        placeholder="Phone / radio channel..."
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Reporting Location</label>
                      <input
                        type="text"
                        value={assignment.reportingLocation}
                        onChange={(e) => updateAssignment(assignment.id, 'reportingLocation', e.target.value)}
                        placeholder="Enter location..."
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {assignment.divisionGroupType !== 'branch' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-300 mb-2">Assigned to Branch</label>
                      <select
                        value={assignment.branch || ''}
                        onChange={(e) => updateAssignment(assignment.id, 'branch', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None (Direct to Operations)</option>
                        {assignments.filter(a => a.divisionGroupType === 'branch').map(branch => (
                          <option key={branch.id} value={branch.name}>{branch.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Resources Assigned */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-300">Resources Assigned</label>
                      <button
                        onClick={() => addResource(assignment.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />Add Resource
                      </button>
                    </div>
                    {assignment.resources.length > 0 ? (
                      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-slate-750">
                            <tr className="border-b border-slate-700">
                              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Resource Name</th>
                              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Leader Name</th>
                              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2"># Persons</th>
                              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Contact</th>
                              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Notes/Info</th>
                              <th className="w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignment.resources.map((resource) => (
                              <tr key={resource.id} className="border-b border-slate-700 last:border-0">
                                <td className="px-3 py-2">
                                  <input type="text" value={resource.name} onChange={(e) => updateResource(assignment.id, resource.id, 'name', e.target.value)} placeholder="Resource name..." className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="text" value={resource.leaderName} onChange={(e) => updateResource(assignment.id, resource.id, 'leaderName', e.target.value)} placeholder="Leader..." className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="text" value={resource.numPersons} onChange={(e) => updateResource(assignment.id, resource.id, 'numPersons', e.target.value)} placeholder="#" className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="text" value={resource.contact} onChange={(e) => updateResource(assignment.id, resource.id, 'contact', e.target.value)} placeholder="Contact..." className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="text" value={resource.notes} onChange={(e) => updateResource(assignment.id, resource.id, 'notes', e.target.value)} placeholder="Notes..." className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <button onClick={() => deleteResource(assignment.id, resource.id)} className="text-red-400 hover:text-red-300 transition-colors"><X className="w-4 h-4" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 text-center text-sm text-slate-400">
                        No resources assigned yet. Click "Add Resource" to add one.
                      </div>
                    )}
                  </div>

                  {/* Work Assignments */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Work Assignments</label>
                    <textarea
                      value={assignment.workAssignments}
                      onChange={(e) => updateAssignment(assignment.id, 'workAssignments', e.target.value)}
                      placeholder="Describe the work assignments for this division/group/team..."
                      className="w-full h-24 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Special Instructions */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Special Instructions</label>
                    <textarea
                      value={assignment.specialInstructions}
                      onChange={(e) => updateAssignment(assignment.id, 'specialInstructions', e.target.value)}
                      placeholder="Safety information, special instructions, reporting requirements..."
                      className="w-full h-20 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Communications/Contact Info */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-300">Communications/Contact Info</label>
                      <button
                        onClick={() => addContact(assignment.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />Add Contact
                      </button>
                    </div>
                    {assignment.contacts.length > 0 ? (
                      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-slate-750">
                            <tr className="border-b border-slate-700">
                              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Function</th>
                              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Name</th>
                              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Contact</th>
                              <th className="w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignment.contacts.map((contact) => (
                              <tr key={contact.id} className="border-b border-slate-700 last:border-0">
                                <td className="px-3 py-2">
                                  <input type="text" value={contact.function} onChange={(e) => updateContact(assignment.id, contact.id, 'function', e.target.value)} placeholder="Function..." className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="text" value={contact.name} onChange={(e) => updateContact(assignment.id, contact.id, 'name', e.target.value)} placeholder="Name..." className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="text" value={contact.contact} onChange={(e) => updateContact(assignment.id, contact.id, 'contact', e.target.value)} placeholder="Contact info..." className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <button onClick={() => deleteContact(assignment.id, contact.id)} className="text-red-400 hover:text-red-300 transition-colors"><X className="w-4 h-4" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 text-center text-sm text-slate-400">
                        No contact information yet. Click "Add Contact" to add one.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Assignment Button */}
        {assignments.length === 0 ? (
          <div
            onClick={addAssignment}
            className="bg-slate-900 rounded-lg border-2 border-dashed border-slate-600 p-8 text-center cursor-pointer hover:border-slate-500 transition-colors"
          >
            <Plus className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Click to add your first Branch/Division/Group</p>
          </div>
        ) : (
          <button
            onClick={addAssignment}
            className="w-full bg-slate-900 rounded-lg border border-slate-700 p-4 text-yellow-400 hover:text-yellow-300 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Branch/Division/Group
          </button>
        )}
      </div>

      {/* Form Preparation */}
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-white">Form Preparation</h2>
          <HelpCircle className="w-4 h-4 text-slate-400" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Prepared by Name</label>
            <input
              type="text"
              value={localPreparedByName}
              onChange={(e) => {
                setLocalPreparedByName(e.target.value);
                setFormPrep({ ...formPrep, preparedByName: e.target.value });
              }}
              onBlur={(e) => void updateShared({ preparedByName: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Position/Title</label>
            <input
              type="text"
              value={localPreparedByTitle}
              onChange={(e) => {
                setLocalPreparedByTitle(e.target.value);
                setFormPrep({ ...formPrep, positionTitle: e.target.value });
              }}
              onBlur={(e) => void updateShared({ preparedByTitle: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date/Time Prepared</label>
            <input
              type="datetime-local"
              value={formPrep.dateTimePrepared}
              onChange={(e) => setFormPrep({ ...formPrep, dateTimePrepared: e.target.value })}
              onBlur={saveFormPrep}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
