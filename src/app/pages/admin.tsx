'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Database, Loader2, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import { projectId } from '../../utils/supabase-info';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface IAP {
  id: string;
  name: string;
  incidentNumber: string;
  createdAt: string;
  userId: string;
}

interface OrgMembership {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
}

interface AdminUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
  };
  app_metadata: {
    isAdmin?: boolean;
  };
  created_at: string;
  organizations: OrgMembership[];
}

interface Organization {
  id: string;
  name: string;
}

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/server`;

const NEW_ORG_VALUE = '__new__';

export function Admin() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'workspaces'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [iaps, setIaps] = useState<IAP[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    orgSelection: '',
    newOrgName: '',
    role: 'member' as 'owner' | 'admin' | 'member',
    grantAdmin: false,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-2">You do not have permission to access the admin panel.</p>
          <p className="text-xs text-slate-500 mb-6">Logged in as: {user?.email}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700"
          >
            Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        await Promise.all([loadUsers(), loadOrganizations()]);
      } else {
        await loadAllIAPs();
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const response = await fetch(`${SERVER_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to load users: ${response.status}`);
    }
    const data = await response.json();
    setUsers(data);
  };

  const loadOrganizations = async () => {
    const response = await fetch(`${SERVER_BASE}/admin/organizations`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to load organizations');
    }
    const data = await response.json();
    setOrgs(data);
  };

  const loadAllIAPs = async () => {
    const response = await fetch(`${SERVER_BASE}/admin/all-iaps`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to load IAPs');
    }
    const data = await response.json();
    setIaps(data);
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`${currentStatus ? 'Remove' : 'Grant'} admin access for this user?`)) return;

    setProcessing(userId);
    try {
      const response = await fetch(`${SERVER_BASE}/admin/toggle-admin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, isAdmin: !currentStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update admin status');
      }
      toast.success(`Admin access ${!currentStatus ? 'granted' : 'removed'}`);
      await loadUsers();
    } catch (err) {
      console.error('Failed to update admin status:', err);
      toast.error('Failed to update admin status');
    } finally {
      setProcessing(null);
    }
  };

  const handleChangeOrgRole = async (userId: string, orgId: string, role: string) => {
    setProcessing(userId);
    try {
      const response = await fetch(`${SERVER_BASE}/admin/users/${userId}/org-role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orgId, role }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update role');
      }
      toast.success('Role updated');
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to update role:', err);
      toast.error(err.message ?? 'Failed to update role');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteUser = async (targetUser: AdminUser) => {
    if (targetUser.id === user?.id) {
      toast.error('You cannot delete your own account');
      return;
    }
    if (!confirm(`Permanently delete ${targetUser.email}? This cannot be undone.`)) return;

    setProcessing(targetUser.id);
    try {
      const response = await fetch(`${SERVER_BASE}/admin/users/${targetUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to delete user');
      }
      toast.success('User deleted');
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      toast.error(err.message ?? 'Failed to delete user');
    } finally {
      setProcessing(null);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      orgSelection: '',
      newOrgName: '',
      role: 'member',
      grantAdmin: false,
    });
  };

  const handleCreateUser = async () => {
    const { name, email, password, orgSelection, newOrgName, role, grantAdmin } = createForm;

    if (!name.trim() || !email.trim() || !password) {
      toast.error('Name, email, and password are required');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const isNewOrg = orgSelection === NEW_ORG_VALUE;
    if (!orgSelection || (isNewOrg && !newOrgName.trim())) {
      toast.error('Choose an organization or name a new one');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${SERVER_BASE}/admin/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          isAdmin: grantAdmin,
          ...(isNewOrg ? { organizationName: newOrgName.trim() } : { orgId: orgSelection }),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create user');
      }
      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success('User account created');
      }
      setCreateOpen(false);
      resetCreateForm();
      await Promise.all([loadUsers(), loadOrganizations()]);
    } catch (err: any) {
      console.error('Failed to create user:', err);
      toast.error(err.message ?? 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-yellow-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
                <p className="text-sm text-slate-600">System Administration</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back to Workspace
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-yellow-600 text-yellow-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              All Users
            </button>
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'workspaces'
                  ? 'border-yellow-600 text-yellow-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              All Workspaces
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
          </div>
        ) : activeTab === 'users' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">All User Accounts</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => loadUsers()}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  Refresh
                </button>
                <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create User
                </Button>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No users found</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Name</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Email</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Organization</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Created</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Platform Admin</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900">{u.user_metadata?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-slate-900">{u.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {u.organizations.length === 0 ? (
                            <span className="text-slate-400">No organization</span>
                          ) : (
                            <div className="space-y-1.5">
                              {u.organizations.map((org) => (
                                <div key={org.id} className="flex items-center gap-2">
                                  <span className="text-slate-900">{org.name}</span>
                                  <select
                                    value={org.role}
                                    disabled={processing === u.id}
                                    onChange={(e) => handleChangeOrgRole(u.id, org.id, e.target.value)}
                                    className="text-xs border border-slate-300 rounded px-1.5 py-0.5 bg-white disabled:opacity-50"
                                  >
                                    <option value="owner">owner</option>
                                    <option value="admin">admin</option>
                                    <option value="member">member</option>
                                  </select>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {u.app_metadata?.isAdmin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleToggleAdmin(u.id, !!u.app_metadata?.isAdmin)}
                              disabled={processing === u.id}
                              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium disabled:opacity-50"
                            >
                              {processing === u.id ? (
                                <Loader2 className="w-4 h-4 animate-spin inline" />
                              ) : u.app_metadata?.isAdmin ? (
                                'Remove Admin'
                              ) : (
                                'Make Admin'
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={processing === u.id || u.id === user?.id}
                              title={u.id === user?.id ? "You can't delete your own account" : 'Delete user'}
                              className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">All IAP Workspaces</h2>
              <button
                onClick={() => loadAllIAPs()}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
              >
                Refresh
              </button>
            </div>

            {iaps.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Database className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No IAP workspaces found</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {iaps.map((iap) => (
                  <div key={iap.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{iap.name || 'Untitled'}</h3>
                    {iap.incidentNumber && (
                      <p className="text-sm text-slate-600 mb-1">#{iap.incidentNumber}</p>
                    )}
                    <p className="text-xs text-slate-500 mb-4">
                      Created: {new Date(iap.createdAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => router.push(`/iap/${iap.id}`)}
                      className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                    >
                      Access Workspace
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User Account</DialogTitle>
            <DialogDescription>
              Creates a login for this person and adds them to an organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@agency.gov"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">Temporary Password</Label>
              <Input
                id="create-password"
                type="text"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Organization</Label>
              <Select
                value={createForm.orgSelection}
                onValueChange={(value) => setCreateForm((f) => ({ ...f, orgSelection: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_ORG_VALUE}>+ New organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createForm.orgSelection === NEW_ORG_VALUE && (
              <div className="space-y-1.5">
                <Label htmlFor="create-new-org">New Organization Name</Label>
                <Input
                  id="create-new-org"
                  value={createForm.newOrgName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, newOrgName: e.target.value }))}
                  placeholder="Riverside Fire Department"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Role in Organization</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) =>
                  setCreateForm((f) => ({ ...f, role: value as 'owner' | 'admin' | 'member' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={createForm.grantAdmin}
                onChange={(e) => setCreateForm((f) => ({ ...f, grantAdmin: e.target.checked }))}
              />
              Grant platform admin access (this admin panel)
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
