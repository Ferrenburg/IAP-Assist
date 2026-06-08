'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { HelpCircle, History, FileText, BookOpen, CircleHelp, Plus, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/api-client';
import { useOpPeriod } from '../../contexts/op-period-context';
import { toast } from 'sonner';
import { icsFormGenerator } from '../../utils/ics-forms/form-generator';
import { pdfCombiner } from '../../utils/pdf-combiner';

interface MedicalStation {
  id: string;
  name: string;
  location: string;
  contact: string;
  paramedicsOnSite: boolean;
}

interface Transportation {
  id: string;
  ambulanceService: string;
  location: string;
  contact: string;
  levelOfService: 'ALS' | 'BLS' | '';
}

interface Hospital {
  id: string;
  hospitalName: string;
  address: string;
  latitude: string;
  longitude: string;
  contact: string;
  travelTimeAir: string;
  travelTimeGround: string;
  traumaCenter: boolean;
  traumaCenterLevel: string;
  burnCenter: boolean;
  helipad: boolean;
}

interface SafetyData {
  id: string;
  safetyMessage: string;
  siteSafetyPlanRequired: boolean;
  siteSafetyPlanLocation: string;
  preparedByName: string;
  positionTitle: string;
  dateTimePrepared: string;
}

interface MedicalData {
  id: string;
  specialProcedures: string;
  preparedByName: string;
  positionTitle: string;
  dateTimePrepared: string;
}

export function SafetyMedicalPage() {
  const { iapId, periodId } = useParams();
  const { data: shared, update: updateShared } = useOpPeriod();
  const [activeTab, setActiveTab] = useState<'medical' | 'safety'>('medical');
  const [medicalStations, setMedicalStations] = useState<MedicalStation[]>([]);
  const [transportation, setTransportation] = useState<Transportation[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [medicalData, setMedicalData] = useState<MedicalData>({
    id: '',
    specialProcedures: '',
    preparedByName: '',
    positionTitle: '',
    dateTimePrepared: '',
  });
  const [safetyData, setSafetyData] = useState<SafetyData>({
    id: '',
    safetyMessage: '',
    siteSafetyPlanRequired: false,
    siteSafetyPlanLocation: '',
    preparedByName: '',
    positionTitle: '',
    dateTimePrepared: '',
  });
  const [loading, setLoading] = useState(true);
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
      const [stationsData, transportData, hospitalsData, medData, safeData] = await Promise.all([
        apiClient.getData(iapId, `period-${periodId}-medical-stations`),
        apiClient.getData(iapId, `period-${periodId}-transportation`),
        apiClient.getData(iapId, `period-${periodId}-hospitals`),
        apiClient.getData(iapId, `period-${periodId}-medical-data`),
        apiClient.getData(iapId, `period-${periodId}-safety-data`),
      ]);

      setMedicalStations(stationsData?.data || []);
      setTransportation(transportData?.data || []);
      setHospitals(hospitalsData?.data || []);

      if (medData?.data?.[0]) {
        setMedicalData(medData.data[0]);
      } else {
        setMedicalData({
          id: crypto.randomUUID(),
          specialProcedures: '',
          preparedByName: '',
          positionTitle: '',
          dateTimePrepared: '',
        });
      }

      if (safeData?.data?.[0]) {
        setSafetyData(safeData.data[0]);
      } else {
        setSafetyData({
          id: crypto.randomUUID(),
          safetyMessage: '',
          siteSafetyPlanRequired: false,
          siteSafetyPlanLocation: '',
          preparedByName: '',
          positionTitle: '',
          dateTimePrepared: '',
        });
      }
    } catch (err) {
      console.error('Failed to load safety/medical data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Medical Station functions
  const addMedicalStation = async () => {
    if (!iapId || !periodId) return;

    const newStation: MedicalStation = {
      id: crypto.randomUUID(),
      name: '',
      location: '',
      contact: '',
      paramedicsOnSite: false,
    };

    try {
      await apiClient.createData(iapId, `period-${periodId}-medical-stations`, newStation);
      setMedicalStations([...medicalStations, newStation]);
    } catch (err) {
      toast.error('Failed to add medical station');
      console.error('Failed to add medical station:', err);
    }
  };

  const updateMedicalStation = (id: string, field: keyof MedicalStation, value: any) => {
    const updated = medicalStations.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    setMedicalStations(updated);
  };

  const saveMedicalStation = async (id: string) => {
    if (!iapId || !periodId) return;

    try {
      const station = medicalStations.find(s => s.id === id);
      if (station) {
        try {
          await apiClient.updateData(iapId, `period-${periodId}-medical-stations`, id, station);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-medical-stations`, station);
          } else {
            throw updateErr;
          }
        }
      }
    } catch (err) {
      console.error('Failed to save medical station:', err);
    }
  };

  const deleteMedicalStation = async (id: string) => {
    if (!iapId || !periodId) return;

    const updated = medicalStations.filter(s => s.id !== id);
    setMedicalStations(updated);

    try {
      await apiClient.deleteData(iapId, `period-${periodId}-medical-stations`, id);
    } catch (err: any) {
      if (!err.message?.includes('not found') && err.status !== 404) {
        console.error('Failed to delete medical station:', err);
      }
    }
  };

  // Transportation functions
  const addTransportation = async () => {
    if (!iapId || !periodId) return;

    const newTransport: Transportation = {
      id: crypto.randomUUID(),
      ambulanceService: '',
      location: '',
      contact: '',
      levelOfService: '',
    };

    try {
      await apiClient.createData(iapId, `period-${periodId}-transportation`, newTransport);
      setTransportation([...transportation, newTransport]);
    } catch (err) {
      toast.error('Failed to add transportation');
      console.error('Failed to add transportation:', err);
    }
  };

  const updateTransportation = (id: string, field: keyof Transportation, value: any) => {
    const updated = transportation.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    );
    setTransportation(updated);
  };

  const saveTransportation = async (id: string) => {
    if (!iapId || !periodId) return;

    try {
      const transport = transportation.find(t => t.id === id);
      if (transport) {
        try {
          await apiClient.updateData(iapId, `period-${periodId}-transportation`, id, transport);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-transportation`, transport);
          } else {
            throw updateErr;
          }
        }
      }
    } catch (err) {
      console.error('Failed to save transportation:', err);
    }
  };

  const deleteTransportation = async (id: string) => {
    if (!iapId || !periodId) return;

    const updated = transportation.filter(t => t.id !== id);
    setTransportation(updated);

    try {
      await apiClient.deleteData(iapId, `period-${periodId}-transportation`, id);
    } catch (err: any) {
      if (!err.message?.includes('not found') && err.status !== 404) {
        console.error('Failed to delete transportation:', err);
      }
    }
  };

  // Hospital functions
  const addHospital = async () => {
    if (!iapId || !periodId) return;

    const newHospital: Hospital = {
      id: crypto.randomUUID(),
      hospitalName: '',
      address: '',
      latitude: '',
      longitude: '',
      contact: '',
      travelTimeAir: '',
      travelTimeGround: '',
      traumaCenter: false,
      traumaCenterLevel: '',
      burnCenter: false,
      helipad: false,
    };

    try {
      await apiClient.createData(iapId, `period-${periodId}-hospitals`, newHospital);
      setHospitals([...hospitals, newHospital]);
    } catch (err) {
      toast.error('Failed to add hospital');
      console.error('Failed to add hospital:', err);
    }
  };

  const updateHospital = (id: string, field: keyof Hospital, value: any) => {
    const updated = hospitals.map(h =>
      h.id === id ? { ...h, [field]: value } : h
    );
    setHospitals(updated);
  };

  const saveHospital = async (id: string) => {
    if (!iapId || !periodId) return;

    try {
      const hospital = hospitals.find(h => h.id === id);
      if (hospital) {
        try {
          await apiClient.updateData(iapId, `period-${periodId}-hospitals`, id, hospital);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-hospitals`, hospital);
          } else {
            throw updateErr;
          }
        }
      }
    } catch (err) {
      console.error('Failed to save hospital:', err);
    }
  };

  const deleteHospital = async (id: string) => {
    if (!iapId || !periodId) return;

    const updated = hospitals.filter(h => h.id !== id);
    setHospitals(updated);

    try {
      await apiClient.deleteData(iapId, `period-${periodId}-hospitals`, id);
    } catch (err: any) {
      if (!err.message?.includes('not found') && err.status !== 404) {
        console.error('Failed to delete hospital:', err);
      }
    }
  };

  const saveMedicalData = async () => {
    if (!iapId || !periodId) return;

    try {
      const existing = await apiClient.getData(iapId, `period-${periodId}-medical-data`);
      if (existing?.data?.[0]) {
        const dataToSave = { ...medicalData, id: existing.data[0].id };
        try {
          await apiClient.updateData(iapId, `period-${periodId}-medical-data`, existing.data[0].id, dataToSave);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-medical-data`, dataToSave);
          } else {
            throw updateErr;
          }
        }
        setMedicalData(dataToSave);
      } else {
        await apiClient.createData(iapId, `period-${periodId}-medical-data`, medicalData);
      }
      toast.success('Medical data saved');
    } catch (err) {
      toast.error('Failed to save medical data');
      console.error('Failed to save medical data:', err);
    }
  };

  const saveSafetyData = async (dataOverride?: Partial<SafetyData>) => {
    if (!iapId || !periodId) return;

    const dataToUse = dataOverride ? { ...safetyData, ...dataOverride } : safetyData;

    try {
      const existing = await apiClient.getData(iapId, `period-${periodId}-safety-data`);
      if (existing?.data?.[0]) {
        const dataToSave = { ...dataToUse, id: existing.data[0].id };
        try {
          await apiClient.updateData(iapId, `period-${periodId}-safety-data`, existing.data[0].id, dataToSave);
        } catch (updateErr: any) {
          if (updateErr.message?.includes('not found') || updateErr.status === 404) {
            await apiClient.createData(iapId, `period-${periodId}-safety-data`, dataToSave);
          } else {
            throw updateErr;
          }
        }
      } else {
        await apiClient.createData(iapId, `period-${periodId}-safety-data`, dataToUse);
      }
    } catch (err) {
      console.error('Failed to save safety data:', err);
    }
  };

  const buildIapData = (dateTimePrepared?: string) => ({
    incidentName: shared?.incidentName,
    incidentNumber: shared?.incidentNumber,
    preparedBy: shared?.preparedByName,
    preparedByPosition: shared?.preparedByTitle,
    preparedDateTime: dateTimePrepared || new Date().toISOString(),
  });
  const buildPeriodData = () => ({ startAt: shared?.startAt, endAt: shared?.endAt });

  const formatPreparedDateTime = (datetimeStr: string) => {
    if (!datetimeStr) return '';
    const dt = new Date(datetimeStr);
    return `${dt.toISOString().split('T')[0]}T${dt.toTimeString().split(' ')[0].substring(0, 5)}`;
  };

  const handleGenerateICS206 = async () => {
    if (!iapId || !periodId) return;

    if (!shared?.incidentName) {
      toast.error('Set an incident name in Incident Info before exporting');
      return;
    }

    try {
      setGenerating(true);
      toast.info('Generating ICS 206...');

      const formData: any[] = [
        ...medicalStations.map(station => ({
          itemType: 'medicalStation',
          name: station.name,
          location: station.location,
          contact: station.contact,
          paramedic: station.paramedicsOnSite ? 'Yes' : 'No',
        })),
        ...transportation.map(transport => ({
          itemType: 'transportation',
          service: transport.ambulanceService,
          location: transport.location,
          contact: transport.contact,
          level: transport.levelOfService,
        })),
        ...hospitals.map(hospital => ({
          itemType: 'hospital',
          name: hospital.hospitalName,
          address: hospital.address,
          contact: hospital.contact,
          airTime: hospital.travelTimeAir,
          groundTime: hospital.travelTimeGround,
          traumaCenter: hospital.traumaCenter,
          traumaCenterLevel: hospital.traumaCenterLevel,
          burnCenter: hospital.burnCenter,
          helipad: hospital.helipad,
        })),
      ];

      if (medicalData.specialProcedures) {
        formData.push({ itemType: 'procedures', content: medicalData.specialProcedures });
      }

      const pdfBytes = await icsFormGenerator.generateICS206({
        iapData: buildIapData(formatPreparedDateTime(medicalData.dateTimePrepared)),
        periodData: buildPeriodData(),
        formData,
      });

      const filename = `ICS_206_${shared.incidentName}_Period_${shared.periodNumber || ''}.pdf`;
      await pdfCombiner.downloadPDF(pdfBytes, filename);
      toast.success('ICS 206 downloaded successfully!');
    } catch (error) {
      console.error('Error generating ICS 206:', error);
      toast.error('Failed to generate ICS 206');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateICS208 = async () => {
    if (!iapId || !periodId) return;

    if (!shared?.incidentName) {
      toast.error('Set an incident name in Incident Info before exporting');
      return;
    }

    try {
      setGenerating(true);
      toast.info('Generating ICS 208...');

      const formData = [
        { itemType: 'message', content: safetyData.safetyMessage },
        { itemType: 'siteSafetyPlan', required: safetyData.siteSafetyPlanRequired, location: safetyData.siteSafetyPlanLocation },
      ];

      const pdfBytes = await icsFormGenerator.generateICS208({
        iapData: buildIapData(formatPreparedDateTime(safetyData.dateTimePrepared)),
        periodData: buildPeriodData(),
        formData,
        organizationData: shared?.incidentCommander
          ? [{ position: 'Incident Commander', name: shared.incidentCommander }]
          : [],
      });

      const filename = `ICS_208_${shared.incidentName}_Period_${shared.periodNumber || ''}.pdf`;
      await pdfCombiner.downloadPDF(pdfBytes, filename);
      toast.success('ICS 208 downloaded successfully!');
    } catch (error) {
      console.error('Error generating ICS 208:', error);
      toast.error('Failed to generate ICS 208');
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

  const formatBannerDate = (iso: string | null | undefined) => {
    if (!iso) return '';
    return iso.split('T')[0];
  };

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
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Safety</h1>
            <p className="text-sm text-slate-400">ICS 206 Medical Plan & ICS 208 Safety Message/Plan</p>
          </div>
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
            onClick={handleGenerateICS206}
            disabled={generating}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating && <Loader2 className="w-4 h-4 animate-spin" />}
            ICS 206
          </button>
          <button
            onClick={handleGenerateICS208}
            disabled={generating}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating && <Loader2 className="w-4 h-4 animate-spin" />}
            ICS 208
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('medical')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'medical'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          ICS 206 - Medical Plan
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'safety'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          ICS 208 - Safety Message/Plan
        </button>
      </div>

      {/* Safety Message/Plan Tab */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* Safety Message */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Safety Message/Expanded Safety Message, Safety Plan, Site Safety Plan
            </label>
            <textarea
              value={safetyData.safetyMessage}
              onChange={(e) => setSafetyData({ ...safetyData, safetyMessage: e.target.value })}
              onBlur={() => saveSafetyData()}
              placeholder="Enter clear, concise statements for safety message(s), priorities, and key command emphasis/decisions/directions. Enter information such as known safety hazards and specific precautions to be observed during this operational period..."
              className="w-full h-64 px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Site Safety Plan Required */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-3">Site Safety Plan Required?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={safetyData.siteSafetyPlanRequired === true}
                    onChange={() => {
                      setSafetyData({ ...safetyData, siteSafetyPlanRequired: true });
                      saveSafetyData({ siteSafetyPlanRequired: true });
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={safetyData.siteSafetyPlanRequired === false}
                    onChange={() => {
                      setSafetyData({ ...safetyData, siteSafetyPlanRequired: false });
                      saveSafetyData({ siteSafetyPlanRequired: false });
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">No</span>
                </label>
              </div>
            </div>

            {safetyData.siteSafetyPlanRequired && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Approved Site Safety Plan(s) Located At:</label>
                <input
                  type="text"
                  value={safetyData.siteSafetyPlanLocation}
                  onChange={(e) => setSafetyData({ ...safetyData, siteSafetyPlanLocation: e.target.value })}
                  onBlur={() => saveSafetyData()}
                  placeholder="Enter location of approved site safety plan(s)"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Prepared By */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Prepared by</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={localPreparedByName}
                  onChange={(e) => {
                    setLocalPreparedByName(e.target.value);
                    setSafetyData({ ...safetyData, preparedByName: e.target.value });
                  }}
                  onBlur={(e) => void updateShared({ preparedByName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Position/Title</label>
                <input
                  type="text"
                  value={localPreparedByTitle}
                  onChange={(e) => {
                    setLocalPreparedByTitle(e.target.value);
                    setSafetyData({ ...safetyData, positionTitle: e.target.value });
                  }}
                  onBlur={(e) => void updateShared({ preparedByTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date/Time Prepared</label>
              <input
                type="datetime-local"
                value={safetyData.dateTimePrepared}
                onChange={(e) => setSafetyData({ ...safetyData, dateTimePrepared: e.target.value })}
                onBlur={() => saveSafetyData()}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Time shown in America/Chicago</p>
            </div>
          </div>
        </div>
      )}

      {/* Medical Plan Tab */}
      {activeTab === 'medical' && (
        <div className="space-y-6">
          {/* Medical Aid Stations */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Medical Aid Stations</h2>
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              <button
                onClick={addMedicalStation}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Station
              </button>
            </div>

            {medicalStations.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No medical aid stations added. Click "Add Station" to add one.
              </div>
            ) : (
              <div className="space-y-4">
                {medicalStations.map((station, index) => (
                  <div key={station.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-700">Station {index + 1}</h3>
                      <button
                        onClick={() => deleteMedicalStation(station.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={station.name}
                          onChange={(e) => updateMedicalStation(station.id, 'name', e.target.value)}
                          onBlur={() => saveMedicalStation(station.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={station.location}
                          onChange={(e) => updateMedicalStation(station.id, 'location', e.target.value)}
                          onBlur={() => saveMedicalStation(station.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number(s)/Frequency</label>
                        <input
                          type="text"
                          value={station.contact}
                          onChange={(e) => updateMedicalStation(station.id, 'contact', e.target.value)}
                          onBlur={() => saveMedicalStation(station.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">Paramedics on Site?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={station.paramedicsOnSite === true}
                              onChange={() => {
                                updateMedicalStation(station.id, 'paramedicsOnSite', true);
                                saveMedicalStation(station.id);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={station.paramedicsOnSite === false}
                              onChange={() => {
                                updateMedicalStation(station.id, 'paramedicsOnSite', false);
                                saveMedicalStation(station.id);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transportation */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Transportation (indicate air or ground)</h2>
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              <button
                onClick={addTransportation}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Transportation
              </button>
            </div>

            {transportation.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No transportation added. Click "Add Transportation" to add one.
              </div>
            ) : (
              <div className="space-y-4">
                {transportation.map((transport, index) => (
                  <div key={transport.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-700">Transport {index + 1}</h3>
                      <button
                        onClick={() => deleteTransportation(transport.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ambulance Service</label>
                        <input
                          type="text"
                          value={transport.ambulanceService}
                          onChange={(e) => updateTransportation(transport.id, 'ambulanceService', e.target.value)}
                          onBlur={() => saveTransportation(transport.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={transport.location}
                          onChange={(e) => updateTransportation(transport.id, 'location', e.target.value)}
                          onBlur={() => saveTransportation(transport.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number(s)/Frequency</label>
                        <input
                          type="text"
                          value={transport.contact}
                          onChange={(e) => updateTransportation(transport.id, 'contact', e.target.value)}
                          onBlur={() => saveTransportation(transport.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">Level of Service</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={transport.levelOfService === 'ALS'}
                              onChange={() => {
                                updateTransportation(transport.id, 'levelOfService', 'ALS');
                                saveTransportation(transport.id);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">ALS</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={transport.levelOfService === 'BLS'}
                              onChange={() => {
                                updateTransportation(transport.id, 'levelOfService', 'BLS');
                                saveTransportation(transport.id);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">BLS</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hospitals */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Hospitals</h2>
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              <button
                onClick={addHospital}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Hospital
              </button>
            </div>

            {hospitals.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No hospitals added. Click "Add Hospital" to add one.
              </div>
            ) : (
              <div className="space-y-4">
                {hospitals.map((hospital, index) => (
                  <div key={hospital.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-700">Hospital {index + 1}</h3>
                      <button
                        onClick={() => deleteHospital(hospital.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Hospital Name</label>
                        <input
                          type="text"
                          value={hospital.hospitalName}
                          onChange={(e) => updateHospital(hospital.id, 'hospitalName', e.target.value)}
                          onBlur={() => saveHospital(hospital.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                        <input
                          type="text"
                          value={hospital.address}
                          onChange={(e) => updateHospital(hospital.id, 'address', e.target.value)}
                          onBlur={() => saveHospital(hospital.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Latitude & Longitude (if Helipad)</label>
                        <input
                          type="text"
                          value={hospital.latitude}
                          onChange={(e) => updateHospital(hospital.id, 'latitude', e.target.value)}
                          onBlur={() => saveHospital(hospital.id)}
                          placeholder="e.g., 40.7128, -74.0060"
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number(s)/Frequency</label>
                        <input
                          type="text"
                          value={hospital.contact}
                          onChange={(e) => updateHospital(hospital.id, 'contact', e.target.value)}
                          onBlur={() => saveHospital(hospital.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Travel Time - Air</label>
                        <input
                          type="text"
                          value={hospital.travelTimeAir}
                          onChange={(e) => updateHospital(hospital.id, 'travelTimeAir', e.target.value)}
                          onBlur={() => saveHospital(hospital.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Travel Time - Ground</label>
                        <input
                          type="text"
                          value={hospital.travelTimeGround}
                          onChange={(e) => updateHospital(hospital.id, 'travelTimeGround', e.target.value)}
                          onBlur={() => saveHospital(hospital.id)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Trauma Center?</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={hospital.traumaCenter === true}
                              onChange={() => {
                                updateHospital(hospital.id, 'traumaCenter', true);
                                saveHospital(hospital.id);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={hospital.traumaCenter === false}
                              onChange={() => {
                                const updated = hospitals.map(h =>
                                  h.id === hospital.id ? { ...h, traumaCenter: false, traumaCenterLevel: '' } : h
                                );
                                setHospitals(updated);
                                saveHospital(hospital.id);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>
                      {hospital.traumaCenter && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Trauma Level</label>
                          <input
                            type="text"
                            value={hospital.traumaCenterLevel}
                            onChange={(e) => updateHospital(hospital.id, 'traumaCenterLevel', e.target.value)}
                            onBlur={() => saveHospital(hospital.id)}
                            placeholder="e.g., I, II, III"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Burn Center?</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={hospital.burnCenter === true}
                              onChange={() => {
                                updateHospital(hospital.id, 'burnCenter', true);
                                saveHospital(hospital.id);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={hospital.burnCenter === false}
                              onChange={() => {
                                updateHospital(hospital.id, 'burnCenter', false);
                                saveHospital(hospital.id);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Helipad?</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={hospital.helipad === true}
                              onChange={() => {
                                updateHospital(hospital.id, 'helipad', true);
                                saveHospital(hospital.id);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={hospital.helipad === false}
                              onChange={() => {
                                updateHospital(hospital.id, 'helipad', false);
                                saveHospital(hospital.id);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Special Medical Emergency Procedures */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Special Medical Emergency Procedures</h2>
            <textarea
              value={medicalData.specialProcedures}
              onChange={(e) => setMedicalData({ ...medicalData, specialProcedures: e.target.value })}
              onBlur={() => saveMedicalData()}
              placeholder="Note any special emergency instructions for use by incident personnel..."
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
                  value={localPreparedByName}
                  onChange={(e) => {
                    setLocalPreparedByName(e.target.value);
                    setMedicalData({ ...medicalData, preparedByName: e.target.value });
                  }}
                  onBlur={(e) => void updateShared({ preparedByName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Position/Title</label>
                <input
                  type="text"
                  value={localPreparedByTitle}
                  onChange={(e) => {
                    setLocalPreparedByTitle(e.target.value);
                    setMedicalData({ ...medicalData, positionTitle: e.target.value });
                  }}
                  onBlur={(e) => void updateShared({ preparedByTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date/Time Prepared</label>
              <input
                type="datetime-local"
                value={medicalData.dateTimePrepared}
                onChange={(e) => setMedicalData({ ...medicalData, dateTimePrepared: e.target.value })}
                onBlur={() => saveMedicalData()}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Time shown in America/Chicago</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
