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
          <h1 className={`text-3xl font-bold mb-2 ${lightMode ? 'text-foreground' : 'text-white'}`}>
            Team Management
          </h1>
          <p className={lightMode ? 'text-muted-foreground' : 'text-slate-400'}>
            Manage members and invitations for your organization
          </p>
        </div>
        <button className="bg-sage hover:bg-sage-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Seat Usage */}
      <div className={`rounded-lg p-4 mb-6 ${
        lightMode
          ? 'bg-card border border-border'
          : 'bg-slate-900 border border-slate-700'
      }`}>
        <div className={`flex items-center gap-2 ${lightMode ? 'text-foreground' : 'text-slate-300'}`}>
          <Users className="w-5 h-5" />
          <span className="font-medium">Seat Usage: 1 of 5 seats used</span>
        </div>
      </div>

      {/* Team Members */}
      <div className={`rounded-lg p-6 mb-6 ${
        lightMode
          ? 'bg-card border border-border'
          : 'bg-slate-900 border border-slate-700'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${lightMode ? 'text-foreground' : 'text-white'}`}>
          Team Members ({teamMembers.length})
        </h2>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.id} className={`flex items-center justify-between p-4 rounded-lg border ${
              lightMode ? 'bg-muted border-border' : 'bg-slate-800 border-slate-700'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`font-medium ${lightMode ? 'text-foreground' : 'text-white'}`}>{member.email}</p>
                  <p className={`text-sm ${lightMode ? 'text-muted-foreground' : 'text-slate-400'}`}>{member.role} - Full access to all organization functions</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-sage">✓ Joined {member.joinedDate}</span>
                <select className={`rounded px-3 py-1.5 text-sm border ${
                  lightMode ? 'bg-card border-border text-foreground' : 'bg-slate-700 border-slate-600 text-white'
                }`}>
                  <option>Organization Administrator</option>
                  <option>Member</option>
                </select>
                <button className={`p-2 transition-colors hover:text-coral ${lightMode ? 'text-muted-foreground' : 'text-slate-400'}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      <div className={`rounded-lg p-6 border ${lightMode ? 'bg-card border-border' : 'bg-slate-900 border-slate-700'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${lightMode ? 'text-foreground' : 'text-white'}`}>Pending Invitations ({pendingInvitations.length})</h2>
        <div className={`text-center py-8 ${lightMode ? 'text-muted-foreground' : 'text-slate-400'}`}>
          No pending invitations.
        </div>
      </div>
    </div>
  );
}
