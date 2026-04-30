'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Inbox, Database, CheckCircle, XCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useRouter } from 'next/navigation';
import { projectId } from '../../utils/supabase-info';

interface AccountRequest {
  id: string;
  email: string;
  name: string;
  organization: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface IAP {
  id: string;
  incidentName: string;
  incidentNumber: string;
  created_at: string;
  user_id: string;
}

interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    isAdmin?: boolean;
  };
  created_at: string;
}

export function Admin() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'create' | 'users' | 'workspaces'>('requests');
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [iaps, setIaps] = useState<IAP[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Check admin access
  if (!isAdmin) {
    console.log('Admin check failed for user:', user?.email, 'isAdmin:', isAdmin);
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

  console.log('Admin access granted for user:', user?.email);

  // Create account form
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [newAccountName, setNewAccountName] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'requests') {
        await loadAccountRequests();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'workspaces') {
        await loadAllIAPs();
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const supabaseUrl = `https://${projectId}.supabase.co`;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    console.log('Getting auth headers, token exists:', !!token);
    if (!token) {
      console.error('No access token found in localStorage');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const loadAccountRequests = async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-897e0759/admin/account-requests`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load account requests');
    }

    const data = await response.json();
    setAccountRequests(data);
  };

  const loadUsers = async () => {
    const url = `${supabaseUrl}/functions/v1/make-server-897e0759/admin/users`;
    console.log('Fetching users from:', url);

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    console.log('Response status:', response.status, 'Content-Type:', response.headers.get('content-type'));

    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to load users. Status:', response.status);
      console.error('Response body:', text.substring(0, 500));
      throw new Error(`Failed to load users: ${response.status}`);
    }

    const text = await response.text();
    console.log('Response text preview:', text.substring(0, 200));

    try {
      const data = JSON.parse(text);
      console.log('Loaded users:', data);
      setUsers(data);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      console.error('Response was:', text.substring(0, 500));
      throw new Error('Invalid JSON response from server');
    }
  };

  const loadAllIAPs = async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-897e0759/admin/all-iaps`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load IAPs');
    }

    const data = await response.json();
    setIaps(data);
  };

  const handleApproveRequest = async (request: AccountRequest) => {
    if (!confirm(`Approve account for ${request.email}?`)) return;

    setProcessing(request.id);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-897e0759/admin/approve-request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          requestId: request.id,
          email: request.email,
          name: request.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      toast.success(`Account created for ${request.email}`);
      await loadAccountRequests();
    } catch (err) {
      console.error('Failed to approve request:', err);
      toast.error('Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm('Reject this account request?')) return;

    setProcessing(requestId);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-897e0759/admin/reject-request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      toast.success('Request rejected');
      await loadAccountRequests();
    } catch (err) {
      console.error('Failed to reject request:', err);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAccountEmail || !newAccountPassword || !newAccountName) {
      toast.error('All fields are required');
      return;
    }

    setProcessing('create');
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-897e0759/admin/create-account`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: newAccountEmail,
          password: newAccountPassword,
          name: newAccountName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      toast.success(`Account created for ${newAccountEmail}`);
      setNewAccountEmail('');
      setNewAccountPassword('');
      setNewAccountName('');
    } catch (err) {
      console.error('Failed to create account:', err);
      toast.error('Failed to create account');
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`${currentStatus ? 'Remove' : 'Grant'} admin access for this user?`)) return;

    setProcessing(userId);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-897e0759/admin/toggle-admin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId,
          isAdmin: !currentStatus,
        }),
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

  const handleAccessWorkspace = (iapId: string) => {
    router.push(`/iap/${iapId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'requests'
                  ? 'border-yellow-600 text-yellow-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-4 h-4 inline mr-2" />
              Account Requests
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'create'
                  ? 'border-yellow-600 text-yellow-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Create Account
            </button>
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Account Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Pending Account Requests</h2>
                  <button
                    onClick={() => loadAccountRequests()}
                    className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Refresh
                  </button>
                </div>

                {accountRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                    <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">No pending account requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accountRequests
                      .filter(r => r.status === 'pending')
                      .map((request) => (
                        <div key={request.id} className="bg-white rounded-lg border border-slate-200 p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-900">{request.name}</h3>
                              <p className="text-sm text-slate-600 mt-1">{request.email}</p>
                              <p className="text-sm text-slate-600 mt-1">
                                <strong>Organization:</strong> {request.organization}
                              </p>
                              <p className="text-xs text-slate-500 mt-2">
                                Requested: {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleApproveRequest(request)}
                                disabled={processing === request.id}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                              >
                                {processing === request.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                disabled={processing === request.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">All User Accounts</h2>
                  <button
                    onClick={() => loadUsers()}
                    className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Refresh
                  </button>
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
                          <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Created</th>
                          <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Admin</th>
                          <th className="text-right px-6 py-3 text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {users.map((userItem) => (
                          <tr key={userItem.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {userItem.user_metadata?.name || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {userItem.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(userItem.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              {userItem.user_metadata?.isAdmin || userItem.email === 'sam@ferrenburg.com' ? (
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
                              {userItem.email !== 'sam@ferrenburg.com' && (
                                <button
                                  onClick={() => handleToggleAdmin(userItem.id, userItem.user_metadata?.isAdmin || false)}
                                  disabled={processing === userItem.id}
                                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium disabled:opacity-50"
                                >
                                  {processing === userItem.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin inline" />
                                  ) : userItem.user_metadata?.isAdmin ? (
                                    'Remove Admin'
                                  ) : (
                                    'Make Admin'
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Create Account Tab */}
            {activeTab === 'create' && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Create New Account</h2>
                <div className="max-w-md bg-white rounded-lg border border-slate-200 p-6">
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Full Name*
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        placeholder="Enter name"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Email Address*
                      </label>
                      <input
                        type="email"
                        required
                        value={newAccountEmail}
                        onChange={(e) => setNewAccountEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Password*
                      </label>
                      <input
                        type="password"
                        required
                        value={newAccountPassword}
                        onChange={(e) => setNewAccountPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={processing === 'create'}
                      className="w-full bg-yellow-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                      {processing === 'create' ? 'Creating...' : 'Create Account'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Workspaces Tab */}
            {activeTab === 'workspaces' && (
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
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{iap.incidentName}</h3>
                        <p className="text-sm text-slate-600 mb-1">#{iap.incidentNumber}</p>
                        <p className="text-xs text-slate-500 mb-4">
                          Created: {new Date(iap.created_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleAccessWorkspace(iap.id)}
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
          </>
        )}
      </div>
    </div>
  );
}
