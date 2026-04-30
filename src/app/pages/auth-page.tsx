'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { LogIn, UserPlus, Shield } from 'lucide-react';
import { projectId } from '../../utils/supabase-info';
import opLogo from '../../imports/OP_Logo.png';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Submit account request
        const supabaseUrl = `https://${projectId}.supabase.co`;
        const response = await fetch(`${supabaseUrl}/functions/v1/make-server-897e0759/account-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            name,
            organization,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit account request');
        }

        setRequestSubmitted(true);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (requestSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-8 text-center">
              <img src={opLogo} alt="OpPeriod" className="h-12 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white">Request Submitted</h1>
            </div>
            <div className="p-8 text-center">
              <p className="text-slate-700 mb-6">
                Thank you for your interest in OpPeriod. Your account request has been submitted and will be reviewed by our team.
              </p>
              <p className="text-sm text-slate-600 mb-6">
                You will receive an email at <strong>{email}</strong> once your account has been approved.
              </p>
              <button
                onClick={() => {
                  setRequestSubmitted(false);
                  setIsLogin(true);
                  setEmail('');
                  setName('');
                  setOrganization('');
                }}
                className="text-yellow-600 hover:text-yellow-700 font-medium"
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-8 text-center bg-[#000000]">
            <img src={opLogo} alt="OpPeriod" className="h-12 mx-auto mb-4" />
            <p className="text-slate-300 mt-2 text-sm">Incident Action Plan Management</p>
          </div>

          <div className="p-8">
            <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isLogin
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !isLogin
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Request Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full Name*
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Organization*
                    </label>
                    <input
                      type="text"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Fire Department, Emergency Services, etc."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Submit Request'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">For emergency management and incident management teams.<br /></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
