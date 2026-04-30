import { useState } from 'react';
import { Users, Mail, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../contexts/theme-context';

export function Team() {
  const { resolvedTheme } = useTheme();
  const lightMode = resolvedTheme === 'light';
  const [teamMembers] = useState([
    {
      id: '1',
      email: 'user@example.com',
      role: 'Organization Administrator',
      joinedDate: '4/24/2026',
    },
  ]);

  const [pendingInvitations] = useState<any[]>([]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${lightMode ? 'text-slate-900' : 'text-white'}`}>
            Team Management
          </h1>
          <p className={lightMode ? 'text-slate-600' : 'text-slate-400'}>
            Manage members and invitations for your organization
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Seat Usage */}
      <div className={`rounded-lg p-4 mb-6 ${
        lightMode
          ? 'bg-white border border-slate-300'
          : 'bg-slate-900 border border-slate-700'
      }`}>
        <div className={`flex items-center gap-2 ${lightMode ? 'text-slate-700' : 'text-slate-300'}`}>
          <Users className="w-5 h-5" />
          <span className="font-medium">Seat Usage: 1 of 5 seats used</span>
        </div>
      </div>

      {/* Team Members */}
      <div className={`rounded-lg p-6 mb-6 ${
        lightMode
          ? 'bg-white border border-slate-300'
          : 'bg-slate-900 border border-slate-700'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${lightMode ? 'text-slate-900' : 'text-white'}`}>
          Team Members ({teamMembers.length})
        </h2>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{member.email}</p>
                  <p className="text-sm text-slate-400">{member.role} - Full access to all organization functions</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-green-400">✓ Joined {member.joinedDate}</span>
                <select className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white">
                  <option>Organization Administrator</option>
                  <option>Member</option>
                </select>
                <button className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Pending Invitations ({pendingInvitations.length})</h2>
        <div className="text-center py-8 text-slate-400">
          No pending invitations.
        </div>
      </div>
    </div>
  );
}
