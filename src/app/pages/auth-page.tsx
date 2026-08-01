'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { LogIn, UserPlus } from 'lucide-react';
import opLogo from '../../imports/OP_Logo.png';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name, organization);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
          <div className="px-6 py-8 text-center bg-foreground">
            <img src={opLogo.src} alt="OpPeriod" className="h-12 mx-auto mb-4" />
            <p className="text-background/80 mt-2 text-sm">Incident Action Plan Management</p>
          </div>

          <div className="p-8">
            <div className="flex rounded-full bg-muted p-1 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isLogin
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !isLogin
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Full Name*
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Organization*
                    </label>
                    <input
                      type="text"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Fire Department, Emergency Services, etc."
                      className="w-full px-4 py-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? 'Enter your password' : 'Choose a password (8+ chars)'}
                  className="w-full px-4 py-2 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-coral/10 border border-coral/30 rounded-2xl p-3">
                  <p className="text-sm text-coral">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-mustard text-foreground px-4 py-2.5 rounded-full font-medium hover:bg-mustard-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                For emergency management and incident management teams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
