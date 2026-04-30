'use client';

import { PageHeader } from '../components/page-header';
import { Plus, FileText, Edit2, Trash2, Save, X, Loader2, Users } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';
import { formatPhoneNumber } from '../../utils/phone-formatter';
import {
  COMMAND_STAFF_POSITIONS,
  OPERATIONS_POSITIONS,
  PLANNING_POSITIONS,
  LOGISTICS_POSITIONS,
  FINANCE_POSITIONS,
  DIVISION_GROUP_TYPES,
} from '../../constants/ics-positions';

interface StaffMember {
  id: string;
  type: 'command' | 'general' | 'division';
  position: string;
  name: string;
  agency: string;
  phone: string;
  radio: string;
  resources?: string;
  branch?: string;
}

interface FormData {
  position: string;
  name: string;
  agency: string;
  phone: string;
  radio: string;
  resources: string;
  branch: string;
}

const StaffRow = ({
  member,
  editingId,
  saving,
  branches,
  onEditChange,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete
}: {
  member: StaffMember;
  editingId: string | null;
  saving: boolean;
  branches: Array<{ id: string; name: string; directorName: string; deputyName: string; directorAgency: string; directorPhone: string; directorRadio: string }>;
  onEditChange: (id: string, field: string, value: string) => void;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
}) => (
  <div className={`px-6 py-4 ${editingId === member.id ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {editingId === member.id ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Position</label>
              {member.type === 'division' ? (
                <input
                  type="text"
                  value={member.position}
                  onChange={(e) => onEditChange(member.id, 'position', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              ) : (
                <select
                  value={member.position}
                  onChange={(e) => onEditChange(member.id, 'position', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">Select position...</option>
                  {member.type === 'command' && COMMAND_STAFF_POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                  {member.type === 'general' && (
                    <>
                      <optgroup label="Operations Section">
                        {OPERATIONS_POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Planning Section">
                        {PLANNING_POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Logistics Section">
                        {LOGISTICS_POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Finance/Administration Section">
                        {FINANCE_POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </optgroup>
                    </>
                  )}
                </select>
              )}
            </div>
            {member.type === 'division' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Branch</label>
                <select
                  value={member.branch || ''}
                  onChange={(e) => onEditChange(member.id, 'branch', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">None / Direct to Operations</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {member.type === 'division' ? 'Supervisor' : 'Name'}
              </label>
              <input
                type="text"
                value={member.name}
                onChange={(e) => onEditChange(member.id, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Agency</label>
              <input
                type="text"
                value={member.agency}
                onChange={(e) => onEditChange(member.id, 'agency', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input
                type="text"
                value={member.phone}
                onChange={(e) => onEditChange(member.id, 'phone', formatPhoneNumber(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Radio</label>
              <input
                type="text"
                value={member.radio}
                onChange={(e) => onEditChange(member.id, 'radio', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            {member.type === 'division' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Resources</label>
                <input
                  type="text"
                  value={member.resources || ''}
                  onChange={(e) => onEditChange(member.id, 'resources', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Position</label>
              <p className="text-sm text-slate-900 mt-1 font-medium">{member.position}</p>
            </div>
            {member.type === 'division' && member.branch && (
              <div>
                <label className="text-xs font-medium text-slate-600">Branch</label>
                <p className="text-sm text-slate-900 mt-1">{member.branch}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-600">
                {member.type === 'division' ? 'Supervisor' : 'Name'}
              </label>
              <p className="text-sm text-slate-900 mt-1">{member.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Agency</label>
              <p className="text-sm text-slate-900 mt-1">{member.agency || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Phone</label>
              <p className="text-sm text-slate-900 mt-1">{member.phone || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Radio</label>
              <p className="text-sm text-slate-900 mt-1">{member.radio || '-'}</p>
            </div>
            {member.type === 'division' && (
              <div>
                <label className="text-xs font-medium text-slate-600">Resources</label>
                <p className="text-sm text-slate-900 mt-1">{member.resources || '-'}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-2 ml-6">
        {editingId === member.id ? (
          <>
            <button
              onClick={onCancelEdit}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={() => onSave(member.id)}
              disabled={saving}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(member.id)}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete(member.id)}
              className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);

const StaffForm = ({
  type,
  formData,
  setFormData,
  branches,
  onCancel,
  onSave,
  saving
}: {
  type: 'command' | 'general' | 'division';
  formData: FormData;
  setFormData: (data: FormData) => void;
  branches: Array<{ id: string; name: string; directorName: string; directorAgency: string; directorPhone: string; directorRadio: string }>;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) => (
  <div className="px-6 py-4 bg-yellow-50 border-b-2 border-yellow-500">
    <div className="flex items-start justify-between mb-4">
      <h4 className="font-semibold text-slate-900">New {type === 'command' ? 'Command Staff' : type === 'general' ? 'General Staff' : 'Div/Group/Branch'}</h4>
      <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
        <X className="w-5 h-5" />
      </button>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Position*</label>
        {type === 'division' ? (
          <input
            type="text"
            required
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="e.g., Division A"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        ) : (
          <select
            required
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">Select position...</option>
            {type === 'command' && COMMAND_STAFF_POSITIONS.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
            {type === 'general' && (
              <>
                <optgroup label="Operations Section">
                  {OPERATIONS_POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </optgroup>
                <optgroup label="Planning Section">
                  {PLANNING_POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </optgroup>
                <optgroup label="Logistics Section">
                  {LOGISTICS_POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </optgroup>
                <optgroup label="Finance/Administration Section">
                  {FINANCE_POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
        )}
      </div>
      {type === 'division' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Branch</label>
          <select
            value={formData.branch}
            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">None / Direct to Operations</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.name}>{branch.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          {type === 'division' ? 'Supervisor*' : 'Name*'}
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Agency</label>
        <input
          type="text"
          value={formData.agency}
          onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Radio</label>
        <input
          type="text"
          value={formData.radio}
          onChange={(e) => setFormData({ ...formData, radio: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      {type === 'division' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Resources</label>
          <input
            type="text"
            value={formData.resources}
            onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
            placeholder="e.g., 3 Engines, 1 Dozer"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      )}
    </div>
    <div className="flex justify-end gap-2 mt-4">
      <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving || !formData.position.trim() || !formData.name.trim()}
        className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save
      </button>
    </div>
  </div>
);

const BranchForm = ({
  formData,
  setFormData,
  onCancel,
  onSave,
  saving
}: {
  formData: { name: string; directorName: string; deputyName: string; directorAgency: string; directorPhone: string; directorRadio: string };
  setFormData: (data: { name: string; directorName: string; deputyName: string; directorAgency: string; directorPhone: string; directorRadio: string }) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) => (
  <div className="px-6 py-4 bg-yellow-50 border-b-2 border-yellow-500">
    <div className="flex items-start justify-between mb-4">
      <h4 className="font-semibold text-slate-900">New Branch</h4>
      <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
        <X className="w-5 h-5" />
      </button>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Branch Name*</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Air Operations Branch"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Branch Director Name</label>
        <input
          type="text"
          value={formData.directorName}
          onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
          placeholder="Director name"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Deputy Name</label>
        <input
          type="text"
          value={formData.deputyName}
          onChange={(e) => setFormData({ ...formData, deputyName: e.target.value })}
          placeholder="Deputy name"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Agency</label>
        <input
          type="text"
          value={formData.directorAgency}
          onChange={(e) => setFormData({ ...formData, directorAgency: e.target.value })}
          placeholder="Agency"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Phone</label>
        <input
          type="tel"
          value={formData.directorPhone}
          onChange={(e) => setFormData({ ...formData, directorPhone: formatPhoneNumber(e.target.value) })}
          placeholder="Phone"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Radio</label>
        <input
          type="text"
          value={formData.directorRadio}
          onChange={(e) => setFormData({ ...formData, directorRadio: e.target.value })}
          placeholder="Radio"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
    </div>
    <div className="flex justify-end gap-2 mt-4">
      <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving || !formData.name.trim()}
        className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Branch
      </button>
    </div>
  </div>
);

export function Organization() {
  const { iapId } = useParams();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; role: string; agency: string; phone: string; radio: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string; directorName: string; deputyName: string; directorAgency: string; directorPhone: string; directorRadio: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<'command' | 'general' | 'division' | null>(null);
  const [showAddBranchForm, setShowAddBranchForm] = useState(false);
  const [branchFormData, setBranchFormData] = useState({ name: '', directorName: '', deputyName: '', directorAgency: '', directorPhone: '', directorRadio: '' });
  const [showContactsModal, setShowContactsModal] = useState<'command' | 'general' | 'division' | null>(null);
  const [formData, setFormData] = useState({
    position: '',
    name: '',
    agency: '',
    phone: '',
    radio: '',
    resources: '',
    branch: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrganization();
    loadContacts();
    loadBranches();
  }, [iapId]);

  const loadOrganization = async () => {
    if (!iapId) return;

    try {
      setLoading(true);
      const { data } = await apiClient.getData(iapId, 'organization');
      setStaff(data);
    } catch (err) {
      console.error('Failed to load organization:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    if (!iapId) return;

    try {
      const { contacts: data } = await apiClient.getContacts(iapId);
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const loadBranches = async () => {
    if (!iapId) return;

    try {
      const { data } = await apiClient.getData(iapId, 'branches');
      setBranches(data || []);
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  const handleAddBranch = async () => {
    if (!iapId || !branchFormData.name.trim()) return;

    try {
      setSaving(true);
      await apiClient.createData(iapId, 'branches', branchFormData);
      setBranchFormData({ name: '', directorName: '', deputyName: '', directorAgency: '', directorPhone: '', directorRadio: '' });
      setShowAddBranchForm(false);
      await loadBranches();
    } catch (err) {
      console.error('Failed to add branch:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBranch = async (id: string) => {
    if (!iapId) return;

    const branch = branches.find(b => b.id === id);
    if (!branch) return;

    try {
      setSaving(true);
      await apiClient.updateData(iapId, 'branches', id, branch);
      setEditingBranchId(null);
    } catch (err) {
      console.error('Failed to update branch:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!iapId || !confirm('Delete this branch?')) return;

    try {
      await apiClient.deleteData(iapId, 'branches', id);
      await loadBranches();
    } catch (err) {
      console.error('Failed to delete branch:', err);
    }
  };

  const handleEditBranchChange = (id: string, field: string, value: string) => {
    setBranches(branches.map(branch =>
      branch.id === id ? { ...branch, [field]: value } : branch
    ));
  };

  const handleAdd = async (type: 'command' | 'general' | 'division') => {
    if (!iapId || !formData.position.trim() || !formData.name.trim()) return;

    try {
      setSaving(true);
      await apiClient.createData(iapId, 'organization', {
        type,
        ...formData,
      });

      // Auto-sync to contacts
      const category = type === 'command' ? 'Command Staff' : type === 'general' ? 'General Staff' : 'Other';
      await apiClient.createContact(iapId, {
        name: formData.name,
        role: formData.position,
        agency: formData.agency,
        phone: formData.phone,
        email: '',
        radio: formData.radio,
        category,
      });

      setFormData({ position: '', name: '', agency: '', phone: '', radio: '', resources: '', branch: '' });
      setShowAddForm(null);
      await loadOrganization();
    } catch (err) {
      console.error('Failed to add staff:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!iapId) return;

    const member = staff.find(s => s.id === id);
    if (!member) return;

    try {
      setSaving(true);
      await apiClient.updateData(iapId, 'organization', id, member);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update staff:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!iapId || !confirm('Delete this position?')) return;

    try {
      await apiClient.deleteData(iapId, 'organization', id);
      await loadOrganization();
    } catch (err) {
      console.error('Failed to delete staff:', err);
    }
  };

  const handleEditChange = useCallback((id: string, field: string, value: string) => {
    setStaff(prevStaff => prevStaff.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  }, []);

  const handleAddFromContact = async (contactId: string, type: 'command' | 'general' | 'division') => {
    if (!iapId) return;

    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    try {
      setSaving(true);
      await apiClient.createData(iapId, 'organization', {
        type,
        position: contact.role,
        name: contact.name,
        agency: contact.agency,
        phone: contact.phone,
        radio: contact.radio,
        resources: '',
      });

      setShowContactsModal(null);
      await loadOrganization();
    } catch (err) {
      console.error('Failed to add from contact:', err);
    } finally {
      setSaving(false);
    }
  };

  const commandStaff = staff.filter(s => s.type === 'command');
  const generalStaff = staff.filter(s => s.type === 'general');
  const divisions = staff.filter(s => s.type === 'division');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="Organization"
        description="Command and general staff assignments (ICS 203, ICS 207)"
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Auto-populates ICS 203 and ICS 207</p>
            <p className="text-sm text-yellow-700 mt-0.5">Organization assignments entered here will populate the Organization Assignment List (ICS 203) and can generate an Organization Chart (ICS 207).</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Command Staff</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowContactsModal('command')}
                className="text-sm text-slate-600 hover:text-slate-700 font-medium flex items-center gap-1"
              >
                <Users className="w-4 h-4" />
                Add from Contacts
              </button>
              <button
                onClick={() => setShowAddForm('command')}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Position
              </button>
            </div>
          </div>
          {showAddForm === 'command' && (
            <StaffForm
              type="command"
              formData={formData}
              setFormData={setFormData}
              branches={branches}
              onCancel={() => setShowAddForm(null)}
              onSave={() => handleAdd('command')}
              saving={saving}
            />
          )}
          <div className="divide-y divide-slate-200">
            {commandStaff.map(member => (
              <StaffRow
                key={member.id}
                member={member}
                editingId={editingId}
                saving={saving}
                branches={branches}
                onEditChange={handleEditChange}
                onEdit={setEditingId}
                onCancelEdit={() => setEditingId(null)}
                onSave={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
            {commandStaff.length === 0 && showAddForm !== 'command' && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">No command staff assigned</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">General Staff</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowContactsModal('general')}
                className="text-sm text-slate-600 hover:text-slate-700 font-medium flex items-center gap-1"
              >
                <Users className="w-4 h-4" />
                Add from Contacts
              </button>
              <button
                onClick={() => setShowAddForm('general')}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Position
              </button>
            </div>
          </div>
          {showAddForm === 'general' && (
            <StaffForm
              type="general"
              formData={formData}
              setFormData={setFormData}
              branches={branches}
              onCancel={() => setShowAddForm(null)}
              onSave={() => handleAdd('general')}
              saving={saving}
            />
          )}
          <div className="divide-y divide-slate-200">
            {generalStaff.map(member => (
              <StaffRow
                key={member.id}
                member={member}
                editingId={editingId}
                saving={saving}
                branches={branches}
                onEditChange={handleEditChange}
                onEdit={setEditingId}
                onCancelEdit={() => setEditingId(null)}
                onSave={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
            {generalStaff.length === 0 && showAddForm !== 'general' && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">No general staff assigned</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Branches</h3>
            <button
              onClick={() => setShowAddBranchForm(true)}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </button>
          </div>
          {showAddBranchForm && (
            <BranchForm
              formData={branchFormData}
              setFormData={setBranchFormData}
              onCancel={() => setShowAddBranchForm(false)}
              onSave={handleAddBranch}
              saving={saving}
            />
          )}
          <div className="divide-y divide-slate-200">
            {branches.map(branch => (
              <div key={branch.id} className={`px-6 py-4 ${editingBranchId === branch.id ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingBranchId === branch.id ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Branch Name</label>
                          <input
                            type="text"
                            value={branch.name}
                            onChange={(e) => handleEditBranchChange(branch.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Branch Director</label>
                          <input
                            type="text"
                            value={branch.directorName || ''}
                            onChange={(e) => handleEditBranchChange(branch.id, 'directorName', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Deputy</label>
                          <input
                            type="text"
                            value={branch.deputyName || ''}
                            onChange={(e) => handleEditBranchChange(branch.id, 'deputyName', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Agency</label>
                          <input
                            type="text"
                            value={branch.directorAgency || ''}
                            onChange={(e) => handleEditBranchChange(branch.id, 'directorAgency', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                          <input
                            type="text"
                            value={branch.directorPhone || ''}
                            onChange={(e) => handleEditBranchChange(branch.id, 'directorPhone', formatPhoneNumber(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Radio</label>
                          <input
                            type="text"
                            value={branch.directorRadio || ''}
                            onChange={(e) => handleEditBranchChange(branch.id, 'directorRadio', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-slate-600">Branch Name</label>
                          <p className="text-sm text-slate-900 mt-1 font-medium">{branch.name}</p>
                        </div>
                        {branch.directorName && (
                          <>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Branch Director</label>
                              <p className="text-sm text-slate-900 mt-1">{branch.directorName}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Deputy</label>
                              <p className="text-sm text-slate-900 mt-1">{branch.deputyName || '-'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Agency</label>
                              <p className="text-sm text-slate-900 mt-1">{branch.directorAgency || '-'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Phone</label>
                              <p className="text-sm text-slate-900 mt-1">{branch.directorPhone || '-'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Radio</label>
                              <p className="text-sm text-slate-900 mt-1">{branch.directorRadio || '-'}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-6">
                    {editingBranchId === branch.id ? (
                      <>
                        <button
                          onClick={() => setEditingBranchId(null)}
                          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateBranch(branch.id)}
                          disabled={saving}
                          className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingBranchId(branch.id)}
                          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {branches.length === 0 && !showAddBranchForm && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">No custom branches created</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Divisions / Groups / Branches</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowContactsModal('division')}
                className="text-sm text-slate-600 hover:text-slate-700 font-medium flex items-center gap-1"
              >
                <Users className="w-4 h-4" />
                Add from Contacts
              </button>
              <button
                onClick={() => setShowAddForm('division')}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Div/Group/Branch
              </button>
            </div>
          </div>
          {showAddForm === 'division' && (
            <StaffForm
              type="division"
              formData={formData}
              setFormData={setFormData}
              branches={branches}
              onCancel={() => setShowAddForm(null)}
              onSave={() => handleAdd('division')}
              saving={saving}
            />
          )}
          <div className="divide-y divide-slate-200">
            {divisions.map(member => (
              <StaffRow
                key={member.id}
                member={member}
                editingId={editingId}
                saving={saving}
                branches={branches}
                onEditChange={handleEditChange}
                onEdit={setEditingId}
                onCancelEdit={() => setEditingId(null)}
                onSave={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
            {divisions.length === 0 && showAddForm !== 'division' && (
              <div className="px-6 py-8 text-center text-sm text-slate-500">No divisions/groups/branches assigned</div>
            )}
          </div>
        </div>

        {showContactsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Select Contact</h3>
                <button
                  onClick={() => setShowContactsModal(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {contacts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium mb-1">No contacts found</p>
                    <p className="text-sm text-slate-500">Add contacts in the Contacts tab first</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleAddFromContact(contact.id, showContactsModal)}
                        disabled={saving}
                        className="w-full text-left px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-yellow-300 transition-colors disabled:opacity-50"
                      >
                        <div className="font-medium text-slate-900">{contact.name}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          {contact.role} {contact.agency && `• ${contact.agency}`}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {contact.phone && `Phone: ${contact.phone}`} {contact.radio && `• Radio: ${contact.radio}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
