'use client';

import { PageHeader } from '../components/page-header';
import { Plus, Users, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../utils/api-client';
import { formatPhoneNumber } from '../../utils/phone-formatter';

interface Contact {
  id: string;
  name: string;
  role: string;
  agency: string;
  phone: string;
  email: string;
  radio: string;
  category: string;
}

const categories = ['Command Staff', 'General Staff', 'Medical', 'Communications', 'Other'];

export function Contacts() {
  const { iapId } = useParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    agency: '',
    phone: '',
    email: '',
    radio: '',
    category: 'Command Staff',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContacts();
  }, [iapId]);

  const loadContacts = async () => {
    if (!iapId) return;

    try {
      setLoading(true);
      const { contacts: data } = await apiClient.getContacts(iapId);
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!iapId || !formData.name.trim() || !formData.role.trim()) return;

    try {
      setSaving(true);
      await apiClient.createContact(iapId, formData);

      setFormData({
        name: '',
        role: '',
        agency: '',
        phone: '',
        email: '',
        radio: '',
        category: 'Command Staff',
      });
      setShowAddForm(false);
      await loadContacts();
    } catch (err) {
      console.error('Failed to add contact:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!iapId) return;

    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    try {
      setSaving(true);
      await apiClient.updateContact(iapId, id, contact);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update contact:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!iapId || !confirm('Delete this contact?')) return;

    try {
      await apiClient.deleteContact(iapId, id);
      await loadContacts();
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  const handleEditChange = useCallback((id: string, field: string, value: string) => {
    setContacts(prevContacts => prevContacts.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  }, []);

  const filteredContacts = filterCategory === 'all'
    ? contacts
    : contacts.filter(c => c.category === filterCategory);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <PageHeader
        title="Contacts"
        description="Reusable contact records for staff and resources"
        action={
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        }
      />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Reusable Across Forms</p>
            <p className="text-sm text-blue-700 mt-0.5">Contacts saved here can be selected in Organization, Communications, and Medical sections instead of re-entering the same information.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <span className="text-sm text-slate-600">
                {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {showAddForm && (
              <div className="px-6 py-4 bg-yellow-50 border-b-2 border-yellow-500">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-semibold text-slate-900">New Contact</h4>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Name*</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Role*</label>
                    <input
                      type="text"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Radio ID</label>
                    <input
                      type="text"
                      value={formData.radio}
                      onChange={(e) => setFormData({ ...formData, radio: e.target.value })}
                      placeholder="e.g., IC-1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={saving || !formData.name.trim() || !formData.role.trim()}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Contact
                  </button>
                </div>
              </div>
            )}

            {filteredContacts.map((contact) => (
              <div key={contact.id} className={`px-6 py-4 transition-colors ${editingId === contact.id ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingId === contact.id ? (
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">Name*</label>
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => handleEditChange(contact.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">Role*</label>
                          <input
                            type="text"
                            value={contact.role}
                            onChange={(e) => handleEditChange(contact.id, 'role', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">Agency</label>
                          <input
                            type="text"
                            value={contact.agency}
                            onChange={(e) => handleEditChange(contact.id, 'agency', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">Phone</label>
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => handleEditChange(contact.id, 'phone', formatPhoneNumber(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">Radio ID</label>
                          <input
                            type="text"
                            value={contact.radio}
                            onChange={(e) => handleEditChange(contact.id, 'radio', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
                          <select
                            value={contact.category}
                            onChange={(e) => handleEditChange(contact.id, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">Email</label>
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) => handleEditChange(contact.id, 'email', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-slate-900">{contact.name}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {contact.category}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="text-xs font-medium text-slate-600">Role</label>
                            <p className="text-slate-900 mt-0.5">{contact.role}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600">Agency</label>
                            <p className="text-slate-900 mt-0.5">{contact.agency || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600">Phone</label>
                            <p className="text-slate-900 mt-0.5">{contact.phone || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600">Radio ID</label>
                            <p className="text-slate-900 mt-0.5">{contact.radio || '-'}</p>
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs font-medium text-slate-600">Email</label>
                            <p className="text-slate-900 mt-0.5">{contact.email || '-'}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    {editingId === contact.id ? (
                      <>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdate(contact.id)}
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
                          onClick={() => setEditingId(contact.id)}
                          className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
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

            {filteredContacts.length === 0 && !showAddForm && (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 font-medium mb-2">No contacts found</p>
                <p className="text-sm text-slate-500">
                  {contacts.length === 0
                    ? 'Add your first contact to get started'
                    : 'Try adjusting your filters'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
