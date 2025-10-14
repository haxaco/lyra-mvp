import React, { useState } from 'react';
import { Button } from '../primitives/button';
import { PlanCard } from './PlanCard';
import { Check, Download, CreditCard, AlertCircle } from 'lucide-react';

export const Billing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Starter',
      price: billingPeriod === 'monthly' ? 49 : 470,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'Perfect for single location businesses',
      features: [
        'Up to 50 hours/month',
        '5 custom playlists',
        'Basic analytics',
        'Email support',
        'Public performance license included'
      ],
      recommended: false,
      current: false
    },
    {
      name: 'Professional',
      price: billingPeriod === 'monthly' ? 149 : 1430,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'For growing businesses with multiple locations',
      features: [
        'Up to 200 hours/month',
        'Unlimited playlists',
        'Advanced analytics & insights',
        'Priority support',
        'Multi-location management',
        'Custom branding',
        'API access'
      ],
      recommended: true,
      current: true
    },
    {
      name: 'Enterprise',
      price: null,
      period: 'Custom',
      description: 'For large organizations with complex needs',
      features: [
        'Unlimited hours',
        'Unlimited playlists',
        'White-label solution',
        'Dedicated account manager',
        'Custom AI model training',
        'SLA guarantees',
        'Advanced compliance tools'
      ],
      recommended: false,
      current: false
    }
  ];

  const invoices = [
    { id: 'INV-2024-001', date: '2024-01-01', amount: 149, status: 'Paid' },
    { id: 'INV-2023-012', date: '2023-12-01', amount: 149, status: 'Paid' },
    { id: 'INV-2023-011', date: '2023-11-01', amount: 149, status: 'Paid' },
    { id: 'INV-2023-010', date: '2023-10-01', amount: 149, status: 'Paid' }
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-2">Billing & Plans</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-[#FF6F61]/10 via-[#E6B8C2]/10 to-transparent rounded-[16px] p-6 border border-primary/20">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-foreground">Current Plan: Professional</h3>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Active
              </span>
            </div>
            <p className="text-muted-foreground">
              ${billingPeriod === 'monthly' ? '149' : '1,430'} billed {billingPeriod}
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>Next billing date: February 1, 2024</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-border hover:bg-secondary/50">
              <CreditCard className="w-4 h-4 mr-2" />
              Update Payment
            </Button>
            <Button variant="outline" className="border-border hover:bg-secondary/50">
              Cancel Plan
            </Button>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <p className="text-muted-foreground mb-1">Hours Used</p>
            <div className="flex items-baseline gap-2">
              <span className="text-foreground">142</span>
              <span className="text-muted-foreground">/ 200</span>
            </div>
            <div className="mt-2 w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-gradient-coral rounded-full h-2 transition-all duration-500"
                style={{ width: '71%' }}
              />
            </div>
          </div>
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <p className="text-muted-foreground mb-1">Active Playlists</p>
            <div className="flex items-baseline gap-2">
              <span className="text-foreground">8</span>
              <span className="text-muted-foreground">/ Unlimited</span>
            </div>
          </div>
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <p className="text-muted-foreground mb-1">Locations</p>
            <div className="flex items-baseline gap-2">
              <span className="text-foreground">3</span>
              <span className="text-muted-foreground">/ Unlimited</span>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}>
          Monthly
        </span>
        <button
          onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
          className="relative w-14 h-7 rounded-full bg-gradient-coral transition-all"
        >
          <div
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              billingPeriod === 'annual' ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'}>
          Annual
          <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Save 20%
          </span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard key={plan.name} {...plan} />
        ))}
      </div>

      {/* Payment Method */}
      <div className="bg-card rounded-[16px] p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground">Payment Method</h3>
          <Button variant="outline" className="border-border">
            Add New Card
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-gradient-coral rounded flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-foreground">•••• •••• •••• 4242</p>
                <p className="text-muted-foreground">Expires 12/2025</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Default
              </span>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-card rounded-[16px] p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground">Invoice History</h3>
        </div>

        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/30 transition-colors border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-foreground">{invoice.id}</p>
                  <p className="text-muted-foreground">
                    {new Date(invoice.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                  <Check className="w-3 h-3 inline mr-1" />
                  {invoice.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-foreground">${invoice.amount}</span>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
