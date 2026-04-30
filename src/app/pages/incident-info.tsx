'use client';

import { PageHeader } from '../components/page-header';
import { Loader2, CheckCircle2, Cloud } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';
import { useAutosave } from '../../hooks/use-autosave';
import { formatPhoneNumber } from '../../utils/phone-formatter';

export function IncidentInfo() {
  const { iapId } = useParams();
  const [formData, setFormData] = useState({
    incidentName: '',
    incidentNumber: '',
    jurisdiction: '',
    incidentType: 'Wildfire',
    location: '',
    startDate: '',
    startTime: '',
    incidentCommander: '',
    icAgency: '',
    description: '',
    estimatedSize: '',
    cause: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadIAPData();
  }, [iapId]);

  const loadIAPData = async () => {
    if (!iapId) return;

    try {
      setLoading(true);
      const { iap } = await apiClient.getIAP(iapId);

      setFormData({
        incidentName: iap.incidentName || '',
        incidentNumber: iap.incidentNumber || '',
        jurisdiction: iap.jurisdiction || '',
        incidentType: iap.incidentType || 'Wildfire',
        location: iap.location || '',
        startDate: iap.startDate || '',
        startTime: iap.startTime || '',
        incidentCommander: iap.incidentCommander || '',
        icAgency: iap.icAgency || '',
        description: iap.description || '',
        estimatedSize: iap.estimatedSize || '',
        cause: iap.cause || '',
      });
    } catch (err: any) {
      console.error('Failed to load IAP:', err);
      setError('Failed to load incident information');
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = useCallback(async (data: typeof formData) => {
    if (!iapId) return;

    // Sync IC to organization if changed
    if (data.incidentCommander) {
      try {
        const { data: orgData } = await apiClient.getData(iapId, 'organization');
        const icEntry = orgData.find((item: any) => item.position === 'Incident Commander');

        if (icEntry) {
          // Update existing IC
          await apiClient.updateData(iapId, 'organization', icEntry.id, {
            ...icEntry,
            name: data.incidentCommander,
            agency: data.icAgency || icEntry.agency,
          });
        } else {
          // Create new IC entry
          await apiClient.createData(iapId, 'organization', {
            type: 'command',
            position: 'Incident Commander',
            name: data.incidentCommander,
            agency: data.icAgency || '',
            phone: '',
            radio: '',
          });
        }
      } catch (err) {
        console.error('Failed to sync IC to organization:', err);
      }
    }

    await apiClient.updateIAP(iapId, data);
  }, [iapId]);

  const { saving, lastSaved, error: autosaveError } = useAutosave({
    data: formData,
    onSave: saveChanges,
    enabled: !loading && !!iapId,
  });

  const handleChange = (field: string, value: string) => {
    // Apply phone formatting to phone fields
    if (field.toLowerCase().includes('phone')) {
      value = formatPhoneNumber(value);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading incident information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="Incident Info"
        description="Basic incident information and metadata"
        action={
          <div className="flex items-center gap-2 text-sm">
            {saving ? (
              <>
                <Cloud className="w-4 h-4 text-yellow-600 animate-pulse" />
                <span className="text-slate-600">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-slate-600">Saved {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Autosave enabled</span>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 p-8 overflow-y-auto">
        {(error || autosaveError) && (
          <div className="max-w-3xl mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error || autosaveError}</p>
          </div>
        )}

        <div className="max-w-3xl bg-white rounded-lg border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Incident Name*
              </label>
              <input
                type="text"
                required
                value={formData.incidentName}
                onChange={(e) => handleChange('incidentName', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Incident Number*
              </label>
              <input
                type="text"
                required
                value={formData.incidentNumber}
                onChange={(e) => handleChange('incidentNumber', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Jurisdiction*
              </label>
              <input
                type="text"
                required
                value={formData.jurisdiction}
                onChange={(e) => handleChange('jurisdiction', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Incident Type
              </label>
              <select
                value={formData.incidentType}
                onChange={(e) => handleChange('incidentType', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option>Wildfire</option>
                <option>Flood</option>
                <option>Search and Rescue</option>
                <option>Hazmat</option>
                <option>Storm</option>
                <option>Earthquake</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Incident Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Street address, coordinates, or general location"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Incident Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Incident Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Incident Commander
              </label>
              <input
                type="text"
                value={formData.incidentCommander}
                onChange={(e) => handleChange('incidentCommander', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                IC Agency
              </label>
              <input
                type="text"
                value={formData.icAgency}
                onChange={(e) => handleChange('icAgency', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Incident Description / Notes
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Additional Information</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Estimated Size/Scope
                </label>
                <input
                  type="text"
                  value={formData.estimatedSize}
                  onChange={(e) => handleChange('estimatedSize', e.target.value)}
                  placeholder="e.g., 100 acres, 50 people affected"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Incident Cause
                </label>
                <input
                  type="text"
                  value={formData.cause}
                  onChange={(e) => handleChange('cause', e.target.value)}
                  placeholder="Known or suspected cause"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
