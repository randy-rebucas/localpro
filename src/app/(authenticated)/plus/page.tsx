'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Star, 
  Check, 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp, 
  Clock, 
  Phone, 
  ArrowRight, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Headphones,
  Gift,
  CreditCard,
  BadgeCheck,
  Rocket,
  Target,
  Award
} from 'lucide-react';
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
  bgGradient: string;
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
    color: 'text-blue-600',
    bgGradient: 'from-blue-500 to-blue-600'
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
    color: 'text-yellow-600',
    bgGradient: 'from-yellow-500 to-amber-500'
  },
  {
    id: 'elite',
    name: 'Elite',
    monthlyPrice: 999,
    annualPrice: 10000,
    description: 'Premium features for established providers',
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
    color: 'text-purple-600',
    bgGradient: 'from-purple-500 to-purple-600'
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
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-500 to-emerald-600',
    targetAudience: 'For hotels, developers, agencies'
  }
];

const premiumFeatures = [
  {
    title: 'Priority Support',
    description: 'Get faster response times and dedicated support channels',
    icon: <Phone className="w-6 h-6" />,
    color: 'bg-green-100 text-green-600'
  },
  {
    title: 'Advanced Analytics',
    description: 'Detailed insights into your business performance',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    title: 'Enhanced Visibility',
    description: 'Boost your profile and get more bookings',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    title: 'Security & Protection',
    description: 'Advanced security features and fraud protection',
    icon: <Shield className="w-6 h-6" />,
    color: 'bg-red-100 text-red-600'
  },
  {
    title: 'Team Management',
    description: 'Manage multiple team members and roles',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    title: '24/7 Availability',
    description: 'Round-the-clock support and assistance',
    icon: <Clock className="w-6 h-6" />,
    color: 'bg-orange-100 text-orange-600'
  }
];

const faqs = [
  {
    question: 'Can I change my plan anytime?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we\'ll prorate any differences.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, GCash, PayMaya, and bank transfers for enterprise plans.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, we offer a 14-day free trial for all new subscribers with no credit card required.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. You can cancel your subscription at any time with no cancellation fees.'
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data remains accessible for 30 days after cancellation. You can export your data anytime during this period.'
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
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!getApiToken()) {
          setLoading(false);
          return;
        }
        
        const settingsUrl = `${API_BASE_URL}${API_ENDPOINTS.settingsUser}`;
        const settingsResponse = await fetch(settingsUrl, createAuthFetchOptions({ method: 'GET' }));
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setUserSettings(settingsData);
          setCurrency(settingsData.communication?.currency || getDefaultCurrency(appSettings));
        }

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
          setStats({
            totalSubscribers: 0,
            activeSubscriptions: 0,
            monthlyRevenue: 0,
            averageRating: 0
          });
        }
      } catch (error) {
        logger.error('Error loading data', error instanceof Error ? error : new Error(String(error)));
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
        logger.debug('Subscription created', { subscriptionId: data?.id || data?._id });
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
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-10 bg-slate-800 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2 mb-8"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 animate-pulse">
                <div className="h-12 bg-slate-800 rounded-full w-12 mb-4"></div>
                <div className="h-6 bg-slate-800 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-slate-800 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 bg-slate-800 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-sm font-semibold mb-4">
            <Star className="w-4 h-4 fill-current" />
            Premium Membership
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">LocalPro+</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-6">
            Take your business to the next level with premium features, priority support, and exclusive benefits.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-slate-900/80 rounded-full p-1.5 border border-slate-800 shadow-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                billingPeriod === 'annual' 
                  ? 'bg-white/30 text-white' 
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Subheader Links */}
        <div className="mb-8 flex items-center justify-center gap-6 border-b border-slate-800 pb-4 flex-wrap">
          <Link 
            href="/referrals" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors group"
          >
            <Gift className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Referral Program</span>
          </Link>
          <Link 
            href="/wallet" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors group"
          >
            <CreditCard className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Manage Billing</span>
          </Link>
          <Link 
            href="/support" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors group"
          >
            <Headphones className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Support</span>
          </Link>
        </div>

        {/* Stats */}
        {stats && (stats.totalSubscribers > 0 || stats.activeSubscriptions > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubscribers.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Total Subscribers</p>
            </div>
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Active Plans</p>
            </div>
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 text-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.monthlyRevenue, currency, { appSettings, showSymbol: true })}
              </p>
              <p className="text-xs text-gray-600">Monthly Savings</p>
            </div>
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating}/5.0</p>
              <p className="text-xs text-gray-600">Member Rating</p>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {subscriptionPlans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-yellow-400 shadow-lg shadow-yellow-500/20 scale-105 relative z-10' 
                  : 'border-gray-200 hover:border-yellow-300'
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-center py-2 text-sm font-semibold">
                  <Crown className="w-4 h-4 inline mr-1" />
                  Most Popular
                </div>
              )}
              
              <div className="p-6">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${plan.bgGradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                  {plan.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                
                {plan.targetAudience && (
                  <p className="text-xs text-gray-500 italic mb-3">{plan.targetAudience}</p>
                )}
                
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(
                        billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice, 
                        currency,
                        { appSettings, showSymbol: true }
                      )}
                    </span>
                    <span className="text-gray-500 ml-1">
                      /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {billingPeriod === 'annual' && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      Save {formatCurrency(plan.monthlyPrice * 12 - plan.annualPrice, currency, { appSettings, showSymbol: true })} per year
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.slice(0, 5).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-xs text-gray-500 pl-6">
                      +{plan.features.length - 5} more features
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={selectedPlan === plan.id}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:scale-105'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {selectedPlan === plan.id ? (
                    'Processing...'
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Features Grid */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Features Included</h2>
            <p className="text-gray-600">Everything you need to grow your business</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiumFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-yellow-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Section */}
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-8 md:p-12 text-white mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Why Choose LocalPro+?</h2>
              <p className="text-yellow-100 max-w-2xl mx-auto">
                Join thousands of successful service providers who have grown their business with LocalPro Plus
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">3x More Bookings</h3>
                <p className="text-sm text-yellow-100">Get priority placement and enhanced visibility</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Leads Guarantee</h3>
                <p className="text-sm text-yellow-100">We guarantee qualified leads or your money back</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Verified Badge</h3>
                <p className="text-sm text-yellow-100">Build trust with a professional verification badge</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-600">Everything you need to know about LocalPro+</p>
          </div>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => handleSubscribe('pro')}
              className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white rounded-xl font-semibold shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <Star className="w-5 h-5" />
              Start Free Trial
            </button>
            <Link
              href="/support"
              className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Headphones className="w-5 h-5" />
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
