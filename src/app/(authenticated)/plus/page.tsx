'use client';

import { useState, useEffect } from 'react';
import { Star, Check, Crown, Zap, Shield, Users, TrendingUp, Clock, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { formatCurrency } from '@/lib/currency-utils';
import { useAppSettings } from '@/hooks/useAppSettings';
import { getDefaultCurrency } from '@/lib/settings-utils';
import { UserSettings } from '@/types/user-settings';
import { API_ENDPOINTS, API_BASE_URL } from '@/lib/api';
import { createAuthFetchOptions, getApiToken } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  targetAudience?: string;
}

interface PlusStats {
  totalSubscribers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  averageRating: number;
}

// LocalPro Plus pricing tiers (in PHP)
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 199,
    annualPrice: 2000,
    description: 'Perfect for individuals starting their service business',
    features: [
      'Access to job listings',
      'Wallet tools',
      'Basic profile visibility',
      'Email support',
      'Mobile app access'
    ],
    icon: <Star className="w-6 h-6" />,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 499,
    annualPrice: 5000,
    description: 'Advanced features for growing service providers',
    features: [
      'Priority listing placement',
      'Advanced analytics dashboard',
      'Professional badge',
      'Enhanced profile visibility',
      'Priority customer support',
      'Performance insights',
      'Custom branding options'
    ],
    popular: true,
    icon: <Crown className="w-6 h-6" />,
    color: 'bg-yellow-100 text-yellow-700'
  },
  {
    id: 'elite',
    name: 'Elite',
    monthlyPrice: 999,
    annualPrice: 10000,
    description: 'Premium features for established service providers',
    features: [
      'Premium visibility boost',
      'Leads guarantee program',
      'Everything in Pro',
      'Dedicated account manager',
      'Advanced analytics & insights',
      'Custom integrations',
      'Priority booking placement',
      '24/7 phone support'
    ],
    icon: <Zap className="w-6 h-6" />,
    color: 'bg-purple-100 text-purple-700'
  },
  {
    id: 'business-partner',
    name: 'Business Partner',
    monthlyPrice: 1499,
    annualPrice: 15000,
    description: 'Enterprise solution for hotels, developers, and agencies',
    features: [
      'Multi-location management',
      'Team collaboration tools',
      'White-label solutions',
      'Custom integrations',
      'Dedicated account manager',
      'Everything in Elite',
      'Advanced security features',
      'Custom training sessions',
      'API access',
      'Bulk operations'
    ],
    icon: <Shield className="w-6 h-6" />,
    color: 'bg-emerald-100 text-emerald-700',
    targetAudience: 'For hotels, developers, agencies'
  }
];

const premiumFeatures = [
  {
    title: 'Priority Support',
    description: 'Get faster response times and dedicated support channels',
    icon: <Phone className="w-8 h-8" />,
    color: 'bg-green-100 text-green-700'
  },
  {
    title: 'Advanced Analytics',
    description: 'Detailed insights into your business performance and growth',
    icon: <TrendingUp className="w-8 h-8" />,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    title: 'Enhanced Visibility',
    description: 'Boost your profile visibility and get more bookings',
    icon: <Sparkles className="w-8 h-8" />,
    color: 'bg-yellow-100 text-yellow-700'
  },
  {
    title: 'Security & Protection',
    description: 'Advanced security features and fraud protection',
    icon: <Shield className="w-8 h-8" />,
    color: 'bg-red-100 text-red-700'
  },
  {
    title: 'Team Management',
    description: 'Manage multiple team members and assign roles',
    icon: <Users className="w-8 h-8" />,
    color: 'bg-purple-100 text-purple-700'
  },
  {
    title: '24/7 Availability',
    description: 'Round-the-clock support and service availability',
    icon: <Clock className="w-8 h-8" />,
    color: 'bg-orange-100 text-orange-700'
  }
];

export default function PlusPage() {
  const { settings: appSettings } = useAppSettings();
  const [stats, setStats] = useState<PlusStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [, setUserSettings] = useState<UserSettings | null>(null);
  const [currency, setCurrency] = useState<string>(getDefaultCurrency(appSettings));
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user settings to get currency preference
        if (!getApiToken()) return;
        
        const settingsUrl = `${API_BASE_URL}${API_ENDPOINTS.settingsUser}`;
        const settingsResponse = await fetch(settingsUrl, createAuthFetchOptions({ method: 'GET' }));
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setUserSettings(settingsData);
          setCurrency(settingsData.communication?.currency || getDefaultCurrency(appSettings));
        }

        // Try to fetch real stats from API, fallback to default values
        const usageUrl = `${API_BASE_URL}${API_ENDPOINTS.localProPlusUsage}`;
        const response = await fetch(usageUrl, createAuthFetchOptions({ method: 'GET' }));
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats || {
            totalSubscribers: 0,
            activeSubscriptions: 0,
            monthlyRevenue: 0,
            averageRating: 0
          });
        } else {
          // Fallback to default values when API fails
          setStats({
            totalSubscribers: 0,
            activeSubscriptions: 0,
            monthlyRevenue: 0,
            averageRating: 0
          });
        }
      } catch (error) {
        logger.error('Error loading data', error instanceof Error ? error : new Error(String(error)));
        // Fallback to default values when error occurs
        setStats({
          totalSubscribers: 0,
          activeSubscriptions: 0,
          monthlyRevenue: 0,
          averageRating: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [appSettings]);

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId);
    
    try {
      if (!getApiToken()) {
        throw new Error('Please log in to subscribe');
      }
      
      // API endpoint expects planId in the URL path: /api/localpro-plus/subscribe/:planId
      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusSubscribe}/${planId}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: 'card',
          billingCycle: billingPeriod === 'monthly' ? 'monthly' : 'yearly',
        }),
      }));

      if (response.ok) {
        const data = await response.json();
        // Handle successful subscription
        logger.debug('Subscription created', { subscriptionId: data?.id || data?._id });
        // In a real implementation, redirect to payment or show success message
        const plan = subscriptionPlans.find(p => p.id === planId);
        alert(`Successfully subscribed to ${plan?.name} (${billingPeriod})!`);
      } else {
        const errorData = await response.json();
        logger.error('Subscription failed', undefined, { error: errorData });
        alert('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      logger.error('Error subscribing', error instanceof Error ? error : new Error(String(error)));
      alert('An error occurred. Please try again.');
    } finally {
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="LocalPro Plus"
          subtitle="Premium features and priority support for your business"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="LocalPro Plus"
        subtitle={`Unlock premium features and take your business to the next level • Prices in ${currency}`}
        actions={[
          {
            type: "button",
            label: `Currency: ${currency}`,
            onClick: () => {
              const currencies = ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'];
              const currentIndex = currencies.indexOf(currency);
              const nextIndex = (currentIndex + 1) % currencies.length;
              setCurrency(currencies[nextIndex]);
            },
            variant: "outline"
          }
        ]}
      />

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Subscribers</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalSubscribers.toLocaleString()}</p>
              </div>
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-xl font-bold text-gray-900">{stats.activeSubscriptions.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.monthlyRevenue, currency, { appSettings })}
                </p>
              </div>
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Average Rating</p>
                <p className="text-xl font-bold text-gray-900">{stats.averageRating}/5.0</p>
              </div>
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Premium Features */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Premium Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {premiumFeatures.map((feature, index) => (
            <Card key={index} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${feature.color}`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Subscription Plans */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3 sm:mb-0">Choose Your Plan</h2>
          
          {/* Billing Period Toggle */}
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                billingPeriod === 'annual' ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'annual' ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
            </span>
            {billingPeriod === 'annual' && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Save up to 20%
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`p-6 relative ${plan.popular ? 'ring-2 ring-yellow-500 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-4">
                <div className={`inline-flex p-2 rounded-lg ${plan.color} mb-3`}>
                  {plan.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                <div className="mb-3">
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(
                        billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice, 
                        currency,
                        { appSettings }
                      )}
                    </span>
                    <span className="text-gray-600 ml-1 text-sm">
                      /{billingPeriod === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingPeriod === 'annual' && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      Save {formatCurrency(plan.monthlyPrice * 12 - plan.annualPrice, currency, { appSettings })} per year
                    </div>
                  )}
                  {plan.targetAudience && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      {plan.targetAudience}
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                  plan.popular
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {selectedPlan === plan.id ? 'Processing...' : 'Subscribe Now'}
                <ArrowRight className="w-4 h-4 inline ml-2" />
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Why Choose LocalPro Plus?</h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Join thousands of successful service providers who have grown their business with LocalPro Plus
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-yellow-100 text-yellow-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Increase Bookings</h3>
            <p className="text-sm text-gray-600">Get 3x more bookings with priority placement and enhanced visibility</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 text-green-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-sm text-gray-600">Advanced fraud protection and secure payment processing</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 text-blue-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dedicated Support</h3>
            <p className="text-sm text-gray-600">24/7 priority support from our expert team</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          <Card className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Can I change my plan anytime?</h3>
            <p className="text-sm text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">What payment methods do you accept?</h3>
            <p className="text-sm text-gray-600">We accept all major credit cards, PayPal, and bank transfers for enterprise plans.</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Is there a free trial?</h3>
            <p className="text-sm text-gray-600">Yes, we offer a 14-day free trial for all new subscribers with no credit card required.</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Can I cancel anytime?</h3>
            <p className="text-sm text-gray-600">Absolutely. You can cancel your subscription at any time with no cancellation fees.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
