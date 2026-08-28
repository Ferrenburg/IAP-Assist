'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Check, ArrowLeft } from 'lucide-react';
import opLogo from '../../imports/No_Background_OP_Logo.png';

export function Pricing() {
  const router = useRouter();

  const tiers = [
    {
      name: 'Type 3',
      description: 'Perfect for small teams',
      seats: '5 or fewer users',
      priceYearly: 599,
      priceUnit: 'per year',
      totalYearly: '($120/user/year)',
      recommended: false,
    },
    {
      name: 'Type 2',
      description: 'Great for growing teams',
      seats: 'Up to 15 users',
      priceYearly: 1199,
      priceUnit: 'per year',
      totalYearly: '($80/user/year)',
      recommended: true,
    },
    {
      name: 'Type 1',
      description: 'For larger organizations',
      seats: 'Up to 30 users',
      priceYearly: 2399,
      priceUnit: 'per year',
      totalYearly: '($80/user/year)',
      recommended: false,
    },
    {
      name: 'Complex',
      description: 'Enterprise solution',
      seats: '30+ users',
      priceYearly: 3000,
      priceUnit: 'starting at',
      totalYearly: 'Custom pricing',
      recommended: false,
    },
  ];

  const features = [
    'Unlimited IAPs and operational periods',
    'All ICS forms (202, 203, 204, 205, 206, 207, 208)',
    'PDF export and printing',
    'Safety plan and hazard tracking',
    'FEMA-compliant forms',
    'Email support',
  ];

  return (
    <div className="legacy-warm-theme min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={opLogo.src} alt="OpPeriod" className="h-12" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground border border-border rounded-lg hover:bg-background transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      {/* Pricing Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choose the plan that works best for your team size
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-card rounded-xl shadow-lg overflow-hidden ${
                tier.recommended ? 'border-2 border-mustard ring-2 ring-blush' : 'border border-border'
              }`}
            >
              {tier.recommended && (
                <div className="bg-mustard text-white text-xs font-semibold text-center py-1">
                  MOST POPULAR
                </div>
              )}
              <div className={`px-6 py-4 ${tier.recommended ? 'bg-mustard' : 'bg-muted'}`}>
                <h3 className={`text-xl font-bold ${tier.recommended ? 'text-white' : 'text-foreground'}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm ${tier.recommended ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                  {tier.description}
                </p>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold text-foreground">
                      ${tier.priceYearly.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{tier.priceUnit}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tier.totalYearly}</p>
                </div>

                <div className="mb-6 pb-6 border-b border-border">
                  <p className="text-sm font-semibold text-foreground mb-2">{tier.seats}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-mustard-hover flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push('/login')}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                    tier.recommended
                      ? 'bg-mustard text-white hover:bg-mustard-hover'
                      : 'bg-muted text-foreground hover:bg-accent'
                  }`}
                >
                  {tier.name === 'Complex' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            All plans include the same features. Choose based on your team size.
          </p>
          <p className="text-xs text-muted-foreground">
            Need help choosing? <a href="mailto:support@opperiod.com" className="text-mustard-hover hover:text-mustard">Contact us</a>
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h3>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h4 className="font-semibold text-foreground mb-2">Can I cancel anytime?</h4>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. Your access will continue until the end of your annual billing period. Contact us for assistance with cancellation.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h4 className="font-semibold text-foreground mb-2">Is there a free trial?</h4>
              <p className="text-muted-foreground">
                Contact us to discuss trial options for your team. We want to make sure OpPeriod is the right fit for your organization.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h4 className="font-semibold text-foreground mb-2">Are the ICS forms FEMA-compliant?</h4>
              <p className="text-muted-foreground">
                Yes, all forms are based on official FEMA ICS templates and meet NIMS requirements.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h4 className="font-semibold text-foreground mb-2">How many team members can use one account?</h4>
              <p className="text-muted-foreground">
                Each plan includes a specific number of users: Type 3 (up to 5), Type 2 (up to 15), Type 1 (up to 30), or Complex (30+). All users get access to the same features.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h4 className="font-semibold text-foreground mb-2">Can I upgrade my plan later?</h4>
              <p className="text-muted-foreground">
                Yes, you can upgrade to a larger plan at any time as your team grows. Contact us for assistance with plan changes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={opLogo.src} alt="OpPeriod" className="h-8" />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 OpPeriod. IAP management for emergency response teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
