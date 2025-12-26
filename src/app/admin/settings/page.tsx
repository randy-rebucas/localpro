"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Shield,
  Bell,
  CreditCard,
  Zap,
  RotateCcw,
  Building2,
  Upload,
  BarChart3,
  Plug
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";

interface SettingsData {
  general: {
    appName: string;
    appVersion: string;
    environment: "development" | "staging" | "production";
    maintenanceMode: {
      enabled: boolean;
      message: string;
      estimatedEndTime?: string;
    };
    forceUpdate: {
      enabled: boolean;
      minVersion: string;
      message: string;
    };
  };
  business: {
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    businessHours: {
      timezone: string;
      schedule: Array<{
        day: string;
        startTime: string;
        endTime: string;
        isOpen: boolean;
      }>;
    };
    supportChannels: {
      email: {
        enabled: boolean;
        address: string;
      };
      phone: {
        enabled: boolean;
        number: string;
      };
      chat: {
        enabled: boolean;
        hours: {
          start: string;
          end: string;
        };
      };
    };
  };
  features: {
    marketplace: {
      enabled: boolean;
      allowNewProviders: boolean;
      requireVerification: boolean;
      description?: string;
      icon?: string;
      color?: string;
      services?: string[];
      route?: string;
      category?: string;
      users?: number;
      lastUpdated?: string;
      featured?: boolean;
    };
    academy: {
      enabled: boolean;
      allowNewCourses: boolean;
      requireInstructorVerification: boolean;
      description?: string;
      icon?: string;
      color?: string;
      services?: string[];
      route?: string;
      category?: string;
      users?: number;
      lastUpdated?: string;
      featured?: boolean;
    };
    jobBoard: {
      enabled: boolean;
      allowNewJobs: boolean;
      requireCompanyVerification: boolean;
      description?: string;
      icon?: string;
      color?: string;
      services?: string[];
      route?: string;
      category?: string;
      users?: number;
      lastUpdated?: string;
      featured?: boolean;
    };
    referrals: {
      enabled: boolean;
      rewardAmount: number;
      maxReferralsPerUser: number;
      description?: string;
      icon?: string;
      color?: string;
      services?: string[];
      route?: string;
      category?: string;
      users?: number;
      lastUpdated?: string;
      featured?: boolean;
    };
    payments: {
      paypal: {
        enabled: boolean;
      };
      paymaya: {
        enabled: boolean;
      };
      gcash: {
        enabled: boolean;
      };
      bankTransfer: {
        enabled: boolean;
      };
    };
    analytics: {
      enabled: boolean;
      trackUserBehavior: boolean;
      trackPerformance: boolean;
    };
    rentals: {
      enabled: boolean;
      description?: string;
      icon?: string;
      color?: string;
      services?: string[];
      route?: string;
      category?: string;
      users?: number;
      lastUpdated?: string;
      featured?: boolean;
    };
    ads: {
      enabled: boolean;
      description?: string;
      icon?: string;
      color?: string;
      services?: string[];
      route?: string;
      category?: string;
      users?: number;
      lastUpdated?: string;
      featured?: boolean;
    };
    facilityCare: {
      enabled: boolean;
      description?: string;
      icon?: string;
      color?: string;
      services?: string[];
      route?: string;
      category?: string;
      users?: number;
      lastUpdated?: string;
      featured?: boolean;
    };
    finance: {
      enabled: boolean;
      description?: string;
      icon?: string;
      color?: string;
      services?: string[];
      route?: string;
      category?: string;
      users?: number;
      lastUpdated?: string;
      featured?: boolean;
    };
    supplies: {
      enabled: boolean;
      description?: string;
      icon?: string;
      color?: string;
      services?: string[];
      route?: string;
      category?: string;
      users?: number;
      lastUpdated?: string;
      featured?: boolean;
    };
    localProPlus: {
      enabled: boolean;
      description?: string;
      icon?: string;
      color?: string;
      services?: string[];
      route?: string;
      category?: string;
      users?: number;
      lastUpdated?: string;
      featured?: boolean;
    };
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxLoginAttempts: number;
      lockoutDuration: number;
    };
    sessionSettings: {
      maxSessionDuration: number;
      allowMultipleSessions: boolean;
      maxConcurrentSessions: number;
    };
    dataProtection: {
      encryptSensitiveData: boolean;
      dataRetentionPeriod: number;
      allowDataExport: boolean;
      allowDataDeletion: boolean;
    };
  };
  uploads: {
    maxFileSize: number;
    allowedImageTypes: string[];
    allowedDocumentTypes: string[];
    maxImagesPerUpload: number;
    imageCompression: {
      enabled: boolean;
      quality: number;
    };
  };
  notifications: {
    email: {
      enabled: boolean;
      provider: "nodemailer" | "sendgrid" | "mailgun" | "ses";
      fromEmail: string;
      fromName: string;
    };
    sms: {
      enabled: boolean;
      provider: "twilio" | "vonage" | "aws_sns";
      fromNumber: string;
    };
    push: {
      enabled: boolean;
      provider: "firebase" | "onesignal" | "pusher";
    };
  };
  payments: {
    defaultCurrency: string;
    supportedCurrencies: string[];
    transactionFees: {
      percentage: number;
      fixed: number;
    };
    minimumPayout: number;
    payoutSchedule: {
      frequency: "daily" | "weekly" | "monthly";
      dayOfWeek: number;
      dayOfMonth: number;
    };
  };
  analytics: {
    googleAnalytics: {
      enabled: boolean;
      trackingId: string;
    };
    mixpanel: {
      enabled: boolean;
      projectToken: string;
    };
    customAnalytics: {
      enabled: boolean;
      retentionPeriod: number;
    };
  };
  integrations: {
    googleMaps: {
      enabled: boolean;
      apiKey: string;
      defaultZoom: number;
    };
    cloudinary: {
      enabled: boolean;
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    };
    socialLogin: {
      google: {
        enabled: boolean;
        clientId: string;
      };
      facebook: {
        enabled: boolean;
        appId: string;
      };
    };
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");

  const getDefaultSettings = useCallback((): SettingsData => {
    return {
      general: {
        appName: "LocalPro Super App",
        appVersion: "1.0.0",
        environment: "production",
        maintenanceMode: {
          enabled: false,
          message: "The app is currently under maintenance. Please try again later.",
          estimatedEndTime: undefined,
        },
        forceUpdate: {
          enabled: false,
          minVersion: "1.0.0",
          message: "Please update to the latest version to continue using the app.",
        },
      },
      business: {
        companyName: "LocalPro Super App",
        companyEmail: "support@localpro.com",
        companyPhone: "+63-912-345-6789",
        companyAddress: {
          street: "123 Main Street",
          city: "Ormoc City",
          state: "Leyte",
          zipCode: "6541",
          country: "Philippines",
        },
        businessHours: {
          timezone: "Asia/Manila",
          schedule: [
            { day: "monday", startTime: "09:00", endTime: "17:00", isOpen: true },
            { day: "tuesday", startTime: "09:00", endTime: "17:00", isOpen: true },
            { day: "wednesday", startTime: "09:00", endTime: "17:00", isOpen: true },
            { day: "thursday", startTime: "09:00", endTime: "17:00", isOpen: true },
            { day: "friday", startTime: "09:00", endTime: "17:00", isOpen: true },
            { day: "saturday", startTime: "09:00", endTime: "13:00", isOpen: true },
            { day: "sunday", startTime: "00:00", endTime: "00:00", isOpen: false },
          ],
        },
        supportChannels: {
          email: {
            enabled: true,
            address: "support@localpro.com",
          },
          phone: {
            enabled: true,
            number: "+63-912-345-6789",
          },
          chat: {
            enabled: true,
            hours: {
              start: "09:00",
              end: "17:00",
            },
          },
        },
      },
      features: {
        marketplace: {
          enabled: true,
          allowNewProviders: true,
          requireVerification: true,
          description: "Connect with service providers and customers",
          icon: "Shield",
          color: "bg-gray-100 text-gray-700",
          services: ["Cleaning", "Plumbing", "Electrical", "Moving"],
          route: "/marketplace",
          category: "Services",
          users: 1250,
          lastUpdated: "2 hours ago",
          featured: true,
        },
        academy: {
          enabled: true,
          allowNewCourses: true,
          requireInstructorVerification: true,
          description: "Learn new skills with expert-led courses",
          icon: "GraduationCap",
          color: "bg-primary/10 text-primary",
          services: ["Web Development", "Design", "Marketing", "Business"],
          route: "/academy",
          category: "Education",
          users: 850,
          lastUpdated: "1 hour ago",
          featured: true,
        },
        jobBoard: {
          enabled: true,
          allowNewJobs: true,
          requireCompanyVerification: true,
          description: "Find your next career opportunity",
          icon: "Briefcase",
          color: "bg-accent/10 text-accent",
          services: ["Full-time", "Part-time", "Contract", "Freelance"],
          route: "/jobs",
          category: "Employment",
          users: 2100,
          lastUpdated: "30 minutes ago",
          featured: true,
        },
        referrals: {
          enabled: true,
          rewardAmount: 100,
          maxReferralsPerUser: 50,
          description: "Earn rewards by referring friends",
          icon: "Users",
          color: "bg-purple-100 text-purple-700",
          services: ["Referral Program", "Rewards", "Invitations"],
          route: "/referrals",
          category: "Rewards",
          users: 450,
          lastUpdated: "3 hours ago",
          featured: false,
        },
        payments: {
          paypal: {
            enabled: true,
          },
          paymaya: {
            enabled: true,
          },
          gcash: {
            enabled: true,
          },
          bankTransfer: {
            enabled: true,
          },
        },
        analytics: {
          enabled: true,
          trackUserBehavior: true,
          trackPerformance: true,
        },
        rentals: {
          enabled: true,
          description: "Rent equipment and tools for your projects",
          icon: "Package",
          color: "bg-orange-100 text-orange-700",
          services: ["Equipment", "Tools", "Vehicles", "Furniture"],
          route: "/rentals",
          category: "Rentals",
          users: 320,
          lastUpdated: "5 hours ago",
          featured: false,
        },
        ads: {
          enabled: false,
          description: "Promote your business with targeted advertising",
          icon: "Megaphone",
          color: "bg-yellow-100 text-yellow-700",
          services: ["Banner Ads", "Sponsored Posts", "Promotions"],
          route: "/ads",
          category: "Advertising",
          users: 0,
          lastUpdated: "Never",
          featured: false,
        },
        facilityCare: {
          enabled: false,
          description: "Professional facility maintenance services",
          icon: "Building",
          color: "bg-primary/10 text-primary",
          services: ["Maintenance", "Cleaning", "Repairs", "Inspection"],
          route: "/facility-care",
          category: "Services",
          users: 0,
          lastUpdated: "Never",
          featured: false,
        },
        finance: {
          enabled: false,
          description: "Manage your finances and transactions",
          icon: "Wallet",
          color: "bg-emerald-100 text-emerald-700",
          services: ["Payments", "Invoicing", "Reports", "Analytics"],
          route: "/finance",
          category: "Finance",
          users: 0,
          lastUpdated: "Never",
          featured: false,
        },
        supplies: {
          enabled: false,
          description: "Source supplies and materials for your business",
          icon: "ShoppingCart",
          color: "bg-pink-100 text-pink-700",
          services: ["Materials", "Equipment", "Consumables"],
          route: "/supplies",
          category: "Supplies",
          users: 0,
          lastUpdated: "Never",
          featured: false,
        },
        localProPlus: {
          enabled: false,
          description: "Premium features and exclusive benefits",
          icon: "Star",
          color: "bg-amber-100 text-amber-700",
          services: ["Premium Support", "Advanced Features", "Priority Access"],
          route: "/plus",
          category: "Premium",
          users: 0,
          lastUpdated: "Never",
          featured: true,
        },
      },
      security: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxLoginAttempts: 5,
          lockoutDuration: 15,
        },
        sessionSettings: {
          maxSessionDuration: 24,
          allowMultipleSessions: true,
          maxConcurrentSessions: 3,
        },
        dataProtection: {
          encryptSensitiveData: true,
          dataRetentionPeriod: 365,
          allowDataExport: true,
          allowDataDeletion: true,
        },
      },
      uploads: {
        maxFileSize: 10485760, // 10MB
        allowedImageTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ],
        allowedDocumentTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maxImagesPerUpload: 10,
        imageCompression: {
          enabled: true,
          quality: 80,
        },
      },
      notifications: {
        email: {
          enabled: true,
          provider: "nodemailer",
          fromEmail: "noreply@localpro.com",
          fromName: "LocalPro Super App",
        },
        sms: {
          enabled: true,
          provider: "twilio",
          fromNumber: "+1234567890",
        },
        push: {
          enabled: true,
          provider: "firebase",
        },
      },
      payments: {
        defaultCurrency: "PHP",
        supportedCurrencies: ["PHP"],
        transactionFees: {
          percentage: 2.9,
          fixed: 0.30,
        },
        minimumPayout: 100,
        payoutSchedule: {
          frequency: "weekly",
          dayOfWeek: 1, // Monday
          dayOfMonth: 1,
        },
      },
      analytics: {
        googleAnalytics: {
          enabled: false,
          trackingId: "UA-XXXXXXXXX-X",
        },
        mixpanel: {
          enabled: false,
          projectToken: "your-mixpanel-project-token",
        },
        customAnalytics: {
          enabled: true,
          retentionPeriod: 365,
        },
      },
      integrations: {
        googleMaps: {
          enabled: true,
          apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          defaultZoom: 13,
        },
        cloudinary: {
          enabled: true,
          cloudName: "your-cloud-name",
          apiKey: "your-api-key",
          apiSecret: "your-api-secret",
        },
        socialLogin: {
          google: {
            enabled: false,
            clientId: "your-google-client-id",
          },
          facebook: {
            enabled: false,
            appId: "your-facebook-app-id",
          },
        },
      },
    };
  }, []);

  const loadDefaultValues = useCallback(() => {
    const defaultSettings = getDefaultSettings();
    setSettings(defaultSettings);
    toast.success("Default values loaded");
  }, [getDefaultSettings]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.settingsApp}`,
        createAuthFetchOptions({ method: 'GET' })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to fetch settings: ${response.status}`);
      }

      const result = await response.json();
      const settingsData = result.data || result;
      
      // Get default settings to use as fallback
      const defaults = getDefaultSettings();
      
      // Transform API response to match SettingsData interface
      // Ensure all fields have default values to prevent uncontrolled input errors
      const normalizedSettings: SettingsData = {
        general: {
          appName: settingsData.general?.appName ?? defaults.general.appName,
          appVersion: settingsData.general?.appVersion ?? defaults.general.appVersion,
          environment: settingsData.general?.environment ?? defaults.general.environment,
          maintenanceMode: {
            enabled: settingsData.general?.maintenanceMode?.enabled ?? defaults.general.maintenanceMode.enabled,
            message: settingsData.general?.maintenanceMode?.message ?? defaults.general.maintenanceMode.message,
            estimatedEndTime: settingsData.general?.maintenanceMode?.estimatedEndTime ?? defaults.general.maintenanceMode.estimatedEndTime,
          },
          forceUpdate: {
            enabled: settingsData.general?.forceUpdate?.enabled ?? defaults.general.forceUpdate.enabled,
            minVersion: settingsData.general?.forceUpdate?.minVersion ?? defaults.general.forceUpdate.minVersion,
            message: settingsData.general?.forceUpdate?.message ?? defaults.general.forceUpdate.message,
          },
        },
        business: {
          companyName: settingsData.business?.companyName ?? defaults.business.companyName,
          companyEmail: settingsData.business?.companyEmail ?? defaults.business.companyEmail,
          companyPhone: settingsData.business?.companyPhone ?? defaults.business.companyPhone,
          companyAddress: {
            street: settingsData.business?.companyAddress?.street ?? defaults.business.companyAddress.street,
            city: settingsData.business?.companyAddress?.city ?? defaults.business.companyAddress.city,
            state: settingsData.business?.companyAddress?.state ?? defaults.business.companyAddress.state,
            zipCode: settingsData.business?.companyAddress?.zipCode ?? defaults.business.companyAddress.zipCode,
            country: settingsData.business?.companyAddress?.country ?? defaults.business.companyAddress.country,
          },
          businessHours: {
            timezone: settingsData.business?.businessHours?.timezone ?? defaults.business.businessHours.timezone,
            schedule: settingsData.business?.businessHours?.schedule ?? defaults.business.businessHours.schedule,
          },
          supportChannels: {
            email: {
              enabled: settingsData.business?.supportChannels?.email?.enabled ?? defaults.business.supportChannels.email.enabled,
              address: settingsData.business?.supportChannels?.email?.address ?? defaults.business.supportChannels.email.address,
            },
            phone: {
              enabled: settingsData.business?.supportChannels?.phone?.enabled ?? defaults.business.supportChannels.phone.enabled,
              number: settingsData.business?.supportChannels?.phone?.number ?? defaults.business.supportChannels.phone.number,
            },
            chat: {
              enabled: settingsData.business?.supportChannels?.chat?.enabled ?? defaults.business.supportChannels.chat.enabled,
              hours: {
                start: settingsData.business?.supportChannels?.chat?.hours?.start ?? defaults.business.supportChannels.chat.hours.start,
                end: settingsData.business?.supportChannels?.chat?.hours?.end ?? defaults.business.supportChannels.chat.hours.end,
              },
            },
          },
        },
        features: {
          marketplace: {
            enabled: settingsData.features?.marketplace?.enabled ?? defaults.features.marketplace.enabled,
            allowNewProviders: settingsData.features?.marketplace?.allowNewProviders ?? defaults.features.marketplace.allowNewProviders,
            requireVerification: settingsData.features?.marketplace?.requireVerification ?? defaults.features.marketplace.requireVerification,
            description: settingsData.features?.marketplace?.description ?? defaults.features.marketplace.description,
            icon: settingsData.features?.marketplace?.icon ?? defaults.features.marketplace.icon,
            color: settingsData.features?.marketplace?.color ?? defaults.features.marketplace.color,
            services: settingsData.features?.marketplace?.services ?? defaults.features.marketplace.services,
            route: settingsData.features?.marketplace?.route ?? defaults.features.marketplace.route,
            category: settingsData.features?.marketplace?.category ?? defaults.features.marketplace.category,
            users: settingsData.features?.marketplace?.users ?? defaults.features.marketplace.users,
            lastUpdated: settingsData.features?.marketplace?.lastUpdated ?? defaults.features.marketplace.lastUpdated,
            featured: settingsData.features?.marketplace?.featured ?? defaults.features.marketplace.featured,
          },
          academy: {
            enabled: settingsData.features?.academy?.enabled ?? defaults.features.academy.enabled,
            allowNewCourses: settingsData.features?.academy?.allowNewCourses ?? defaults.features.academy.allowNewCourses,
            requireInstructorVerification: settingsData.features?.academy?.requireInstructorVerification ?? defaults.features.academy.requireInstructorVerification,
            description: settingsData.features?.academy?.description ?? defaults.features.academy.description,
            icon: settingsData.features?.academy?.icon ?? defaults.features.academy.icon,
            color: settingsData.features?.academy?.color ?? defaults.features.academy.color,
            services: settingsData.features?.academy?.services ?? defaults.features.academy.services,
            route: settingsData.features?.academy?.route ?? defaults.features.academy.route,
            category: settingsData.features?.academy?.category ?? defaults.features.academy.category,
            users: settingsData.features?.academy?.users ?? defaults.features.academy.users,
            lastUpdated: settingsData.features?.academy?.lastUpdated ?? defaults.features.academy.lastUpdated,
            featured: settingsData.features?.academy?.featured ?? defaults.features.academy.featured,
          },
          jobBoard: {
            enabled: settingsData.features?.jobBoard?.enabled ?? defaults.features.jobBoard.enabled,
            allowNewJobs: settingsData.features?.jobBoard?.allowNewJobs ?? defaults.features.jobBoard.allowNewJobs,
            requireCompanyVerification: settingsData.features?.jobBoard?.requireCompanyVerification ?? defaults.features.jobBoard.requireCompanyVerification,
            description: settingsData.features?.jobBoard?.description ?? defaults.features.jobBoard.description,
            icon: settingsData.features?.jobBoard?.icon ?? defaults.features.jobBoard.icon,
            color: settingsData.features?.jobBoard?.color ?? defaults.features.jobBoard.color,
            services: settingsData.features?.jobBoard?.services ?? defaults.features.jobBoard.services,
            route: settingsData.features?.jobBoard?.route ?? defaults.features.jobBoard.route,
            category: settingsData.features?.jobBoard?.category ?? defaults.features.jobBoard.category,
            users: settingsData.features?.jobBoard?.users ?? defaults.features.jobBoard.users,
            lastUpdated: settingsData.features?.jobBoard?.lastUpdated ?? defaults.features.jobBoard.lastUpdated,
            featured: settingsData.features?.jobBoard?.featured ?? defaults.features.jobBoard.featured,
          },
          referrals: {
            enabled: settingsData.features?.referrals?.enabled ?? defaults.features.referrals.enabled,
            rewardAmount: settingsData.features?.referrals?.rewardAmount ?? defaults.features.referrals.rewardAmount,
            maxReferralsPerUser: settingsData.features?.referrals?.maxReferralsPerUser ?? defaults.features.referrals.maxReferralsPerUser,
            description: settingsData.features?.referrals?.description ?? defaults.features.referrals.description,
            icon: settingsData.features?.referrals?.icon ?? defaults.features.referrals.icon,
            color: settingsData.features?.referrals?.color ?? defaults.features.referrals.color,
            services: settingsData.features?.referrals?.services ?? defaults.features.referrals.services,
            route: settingsData.features?.referrals?.route ?? defaults.features.referrals.route,
            category: settingsData.features?.referrals?.category ?? defaults.features.referrals.category,
            users: settingsData.features?.referrals?.users ?? defaults.features.referrals.users,
            lastUpdated: settingsData.features?.referrals?.lastUpdated ?? defaults.features.referrals.lastUpdated,
            featured: settingsData.features?.referrals?.featured ?? defaults.features.referrals.featured,
          },
          payments: {
            paypal: {
              enabled: settingsData.features?.payments?.paypal?.enabled ?? defaults.features.payments.paypal.enabled,
            },
            paymaya: {
              enabled: settingsData.features?.payments?.paymaya?.enabled ?? defaults.features.payments.paymaya.enabled,
            },
            gcash: {
              enabled: settingsData.features?.payments?.gcash?.enabled ?? defaults.features.payments.gcash.enabled,
            },
            bankTransfer: {
              enabled: settingsData.features?.payments?.bankTransfer?.enabled ?? defaults.features.payments.bankTransfer.enabled,
            },
          },
          analytics: {
            enabled: settingsData.features?.analytics?.enabled ?? defaults.features.analytics.enabled,
            trackUserBehavior: settingsData.features?.analytics?.trackUserBehavior ?? defaults.features.analytics.trackUserBehavior,
            trackPerformance: settingsData.features?.analytics?.trackPerformance ?? defaults.features.analytics.trackPerformance,
          },
          rentals: {
            enabled: settingsData.features?.rentals?.enabled ?? defaults.features.rentals.enabled,
            description: settingsData.features?.rentals?.description ?? defaults.features.rentals.description,
            icon: settingsData.features?.rentals?.icon ?? defaults.features.rentals.icon,
            color: settingsData.features?.rentals?.color ?? defaults.features.rentals.color,
            services: settingsData.features?.rentals?.services ?? defaults.features.rentals.services,
            route: settingsData.features?.rentals?.route ?? defaults.features.rentals.route,
            category: settingsData.features?.rentals?.category ?? defaults.features.rentals.category,
            users: settingsData.features?.rentals?.users ?? defaults.features.rentals.users,
            lastUpdated: settingsData.features?.rentals?.lastUpdated ?? defaults.features.rentals.lastUpdated,
            featured: settingsData.features?.rentals?.featured ?? defaults.features.rentals.featured,
          },
          ads: {
            enabled: settingsData.features?.ads?.enabled ?? defaults.features.ads.enabled,
            description: settingsData.features?.ads?.description ?? defaults.features.ads.description,
            icon: settingsData.features?.ads?.icon ?? defaults.features.ads.icon,
            color: settingsData.features?.ads?.color ?? defaults.features.ads.color,
            services: settingsData.features?.ads?.services ?? defaults.features.ads.services,
            route: settingsData.features?.ads?.route ?? defaults.features.ads.route,
            category: settingsData.features?.ads?.category ?? defaults.features.ads.category,
            users: settingsData.features?.ads?.users ?? defaults.features.ads.users,
            lastUpdated: settingsData.features?.ads?.lastUpdated ?? defaults.features.ads.lastUpdated,
            featured: settingsData.features?.ads?.featured ?? defaults.features.ads.featured,
          },
          facilityCare: {
            enabled: settingsData.features?.facilityCare?.enabled ?? defaults.features.facilityCare.enabled,
            description: settingsData.features?.facilityCare?.description ?? defaults.features.facilityCare.description,
            icon: settingsData.features?.facilityCare?.icon ?? defaults.features.facilityCare.icon,
            color: settingsData.features?.facilityCare?.color ?? defaults.features.facilityCare.color,
            services: settingsData.features?.facilityCare?.services ?? defaults.features.facilityCare.services,
            route: settingsData.features?.facilityCare?.route ?? defaults.features.facilityCare.route,
            category: settingsData.features?.facilityCare?.category ?? defaults.features.facilityCare.category,
            users: settingsData.features?.facilityCare?.users ?? defaults.features.facilityCare.users,
            lastUpdated: settingsData.features?.facilityCare?.lastUpdated ?? defaults.features.facilityCare.lastUpdated,
            featured: settingsData.features?.facilityCare?.featured ?? defaults.features.facilityCare.featured,
          },
          finance: {
            enabled: settingsData.features?.finance?.enabled ?? defaults.features.finance.enabled,
            description: settingsData.features?.finance?.description ?? defaults.features.finance.description,
            icon: settingsData.features?.finance?.icon ?? defaults.features.finance.icon,
            color: settingsData.features?.finance?.color ?? defaults.features.finance.color,
            services: settingsData.features?.finance?.services ?? defaults.features.finance.services,
            route: settingsData.features?.finance?.route ?? defaults.features.finance.route,
            category: settingsData.features?.finance?.category ?? defaults.features.finance.category,
            users: settingsData.features?.finance?.users ?? defaults.features.finance.users,
            lastUpdated: settingsData.features?.finance?.lastUpdated ?? defaults.features.finance.lastUpdated,
            featured: settingsData.features?.finance?.featured ?? defaults.features.finance.featured,
          },
          supplies: {
            enabled: settingsData.features?.supplies?.enabled ?? defaults.features.supplies.enabled,
            description: settingsData.features?.supplies?.description ?? defaults.features.supplies.description,
            icon: settingsData.features?.supplies?.icon ?? defaults.features.supplies.icon,
            color: settingsData.features?.supplies?.color ?? defaults.features.supplies.color,
            services: settingsData.features?.supplies?.services ?? defaults.features.supplies.services,
            route: settingsData.features?.supplies?.route ?? defaults.features.supplies.route,
            category: settingsData.features?.supplies?.category ?? defaults.features.supplies.category,
            users: settingsData.features?.supplies?.users ?? defaults.features.supplies.users,
            lastUpdated: settingsData.features?.supplies?.lastUpdated ?? defaults.features.supplies.lastUpdated,
            featured: settingsData.features?.supplies?.featured ?? defaults.features.supplies.featured,
          },
          localProPlus: {
            enabled: settingsData.features?.localProPlus?.enabled ?? defaults.features.localProPlus.enabled,
            description: settingsData.features?.localProPlus?.description ?? defaults.features.localProPlus.description,
            icon: settingsData.features?.localProPlus?.icon ?? defaults.features.localProPlus.icon,
            color: settingsData.features?.localProPlus?.color ?? defaults.features.localProPlus.color,
            services: settingsData.features?.localProPlus?.services ?? defaults.features.localProPlus.services,
            route: settingsData.features?.localProPlus?.route ?? defaults.features.localProPlus.route,
            category: settingsData.features?.localProPlus?.category ?? defaults.features.localProPlus.category,
            users: settingsData.features?.localProPlus?.users ?? defaults.features.localProPlus.users,
            lastUpdated: settingsData.features?.localProPlus?.lastUpdated ?? defaults.features.localProPlus.lastUpdated,
            featured: settingsData.features?.localProPlus?.featured ?? defaults.features.localProPlus.featured,
          },
        },
        security: {
          passwordPolicy: {
            minLength: settingsData.security?.passwordPolicy?.minLength ?? defaults.security.passwordPolicy.minLength,
            requireUppercase: settingsData.security?.passwordPolicy?.requireUppercase ?? defaults.security.passwordPolicy.requireUppercase,
            requireLowercase: settingsData.security?.passwordPolicy?.requireLowercase ?? defaults.security.passwordPolicy.requireLowercase,
            requireNumbers: settingsData.security?.passwordPolicy?.requireNumbers ?? defaults.security.passwordPolicy.requireNumbers,
            requireSpecialChars: settingsData.security?.passwordPolicy?.requireSpecialChars ?? defaults.security.passwordPolicy.requireSpecialChars,
            maxLoginAttempts: settingsData.security?.passwordPolicy?.maxLoginAttempts ?? defaults.security.passwordPolicy.maxLoginAttempts,
            lockoutDuration: settingsData.security?.passwordPolicy?.lockoutDuration ?? defaults.security.passwordPolicy.lockoutDuration,
          },
          sessionSettings: {
            maxSessionDuration: settingsData.security?.sessionSettings?.maxSessionDuration ?? defaults.security.sessionSettings.maxSessionDuration,
            allowMultipleSessions: settingsData.security?.sessionSettings?.allowMultipleSessions ?? defaults.security.sessionSettings.allowMultipleSessions,
            maxConcurrentSessions: settingsData.security?.sessionSettings?.maxConcurrentSessions ?? defaults.security.sessionSettings.maxConcurrentSessions,
          },
          dataProtection: {
            encryptSensitiveData: settingsData.security?.dataProtection?.encryptSensitiveData ?? defaults.security.dataProtection.encryptSensitiveData,
            dataRetentionPeriod: settingsData.security?.dataProtection?.dataRetentionPeriod ?? defaults.security.dataProtection.dataRetentionPeriod,
            allowDataExport: settingsData.security?.dataProtection?.allowDataExport ?? defaults.security.dataProtection.allowDataExport,
            allowDataDeletion: settingsData.security?.dataProtection?.allowDataDeletion ?? defaults.security.dataProtection.allowDataDeletion,
          },
        },
        uploads: {
          maxFileSize: settingsData.uploads?.maxFileSize ?? defaults.uploads.maxFileSize,
          allowedImageTypes: settingsData.uploads?.allowedImageTypes ?? defaults.uploads.allowedImageTypes,
          allowedDocumentTypes: settingsData.uploads?.allowedDocumentTypes ?? defaults.uploads.allowedDocumentTypes,
          maxImagesPerUpload: settingsData.uploads?.maxImagesPerUpload ?? defaults.uploads.maxImagesPerUpload,
          imageCompression: {
            enabled: settingsData.uploads?.imageCompression?.enabled ?? defaults.uploads.imageCompression.enabled,
            quality: settingsData.uploads?.imageCompression?.quality ?? defaults.uploads.imageCompression.quality,
          },
        },
        notifications: {
          email: {
            enabled: settingsData.notifications?.email?.enabled ?? defaults.notifications.email.enabled,
            provider: settingsData.notifications?.email?.provider ?? defaults.notifications.email.provider,
            fromEmail: settingsData.notifications?.email?.fromEmail ?? defaults.notifications.email.fromEmail,
            fromName: settingsData.notifications?.email?.fromName ?? defaults.notifications.email.fromName,
          },
          sms: {
            enabled: settingsData.notifications?.sms?.enabled ?? defaults.notifications.sms.enabled,
            provider: settingsData.notifications?.sms?.provider ?? defaults.notifications.sms.provider,
            fromNumber: settingsData.notifications?.sms?.fromNumber ?? defaults.notifications.sms.fromNumber,
          },
          push: {
            enabled: settingsData.notifications?.push?.enabled ?? defaults.notifications.push.enabled,
            provider: settingsData.notifications?.push?.provider ?? defaults.notifications.push.provider,
          },
        },
        payments: {
          defaultCurrency: settingsData.payments?.defaultCurrency ?? defaults.payments.defaultCurrency,
          supportedCurrencies: settingsData.payments?.supportedCurrencies ?? defaults.payments.supportedCurrencies,
          transactionFees: {
            percentage: settingsData.payments?.transactionFees?.percentage ?? defaults.payments.transactionFees.percentage,
            fixed: settingsData.payments?.transactionFees?.fixed ?? defaults.payments.transactionFees.fixed,
          },
          minimumPayout: settingsData.payments?.minimumPayout ?? defaults.payments.minimumPayout,
          payoutSchedule: {
            frequency: settingsData.payments?.payoutSchedule?.frequency ?? defaults.payments.payoutSchedule.frequency,
            dayOfWeek: settingsData.payments?.payoutSchedule?.dayOfWeek ?? defaults.payments.payoutSchedule.dayOfWeek,
            dayOfMonth: settingsData.payments?.payoutSchedule?.dayOfMonth ?? defaults.payments.payoutSchedule.dayOfMonth,
          },
        },
        analytics: {
          googleAnalytics: {
            enabled: settingsData.analytics?.googleAnalytics?.enabled ?? defaults.analytics.googleAnalytics.enabled,
            trackingId: settingsData.analytics?.googleAnalytics?.trackingId ?? defaults.analytics.googleAnalytics.trackingId,
          },
          mixpanel: {
            enabled: settingsData.analytics?.mixpanel?.enabled ?? defaults.analytics.mixpanel.enabled,
            projectToken: settingsData.analytics?.mixpanel?.projectToken ?? defaults.analytics.mixpanel.projectToken,
          },
          customAnalytics: {
            enabled: settingsData.analytics?.customAnalytics?.enabled ?? defaults.analytics.customAnalytics.enabled,
            retentionPeriod: settingsData.analytics?.customAnalytics?.retentionPeriod ?? defaults.analytics.customAnalytics.retentionPeriod,
          },
        },
        integrations: {
          googleMaps: {
            enabled: settingsData.integrations?.googleMaps?.enabled ?? defaults.integrations.googleMaps.enabled,
            apiKey: settingsData.integrations?.googleMaps?.apiKey ?? defaults.integrations.googleMaps.apiKey,
            defaultZoom: settingsData.integrations?.googleMaps?.defaultZoom ?? defaults.integrations.googleMaps.defaultZoom,
          },
          cloudinary: {
            enabled: settingsData.integrations?.cloudinary?.enabled ?? defaults.integrations.cloudinary.enabled,
            cloudName: settingsData.integrations?.cloudinary?.cloudName ?? defaults.integrations.cloudinary.cloudName,
            apiKey: settingsData.integrations?.cloudinary?.apiKey ?? defaults.integrations.cloudinary.apiKey,
            apiSecret: settingsData.integrations?.cloudinary?.apiSecret ?? defaults.integrations.cloudinary.apiSecret,
          },
          socialLogin: {
            google: {
              enabled: settingsData.integrations?.socialLogin?.google?.enabled ?? defaults.integrations.socialLogin.google.enabled,
              clientId: settingsData.integrations?.socialLogin?.google?.clientId ?? defaults.integrations.socialLogin.google.clientId,
            },
            facebook: {
              enabled: settingsData.integrations?.socialLogin?.facebook?.enabled ?? defaults.integrations.socialLogin.facebook.enabled,
              appId: settingsData.integrations?.socialLogin?.facebook?.appId ?? defaults.integrations.socialLogin.facebook.appId,
            },
          },
        },
      };
      
      setSettings(normalizedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching settings", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [getDefaultSettings]);

  const saveSettings = useCallback(async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.settingsAppUpdate}`,
        createAuthFetchOptions({
          method: 'PUT',
          body: JSON.stringify(settings)
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to save settings: ${response.status}`);
      }

      const result = await response.json();
      const updatedSettings = result.data || result;
      setSettings(updatedSettings);
      
      setSuccess(true);
      toast.success("Settings saved successfully");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error saving settings", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "business", label: "Business", icon: Building2 },
    { id: "security", label: "Security", icon: Shield },
    { id: "uploads", label: "Uploads", icon: Upload },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "features", label: "Features", icon: Zap },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "integrations", label: "Integrations", icon: Plug },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading settings..." />
      </div>
    );
  }

  if (error && !settings) {
    return <AdminErrorState error={error} onRetry={fetchSettings} />;
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 text-sm">Manage platform settings and configuration</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={loadDefaultValues}
            disabled={saving || loading}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-all duration-200"
            title="Load default values"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Load Defaults
          </button>
          <button
            onClick={fetchSettings}
            disabled={saving}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || !settings}
            className="inline-flex items-center px-2 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-all duration-200"
          >
            <Save className={`w-3 h-3 mr-1 ${saving ? 'animate-spin' : ''}`} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-accent/5 border border-accent/20 rounded p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
          <p className="text-accent text-xs">Settings saved successfully</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded shadow border border-gray-200 p-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors text-xs font-medium ${
                      activeTab === tab.id
                        ? "bg-primary/5 text-primary border-l-4 border-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded shadow border border-gray-200 p-4">
            {settings && (
              <div className="space-y-4">
                {/* General Settings */}
                {activeTab === "general" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900">General Settings</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          App Name
                        </label>
                        <input
                          type="text"
                          value={settings.general.appName ?? ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              general: { ...settings.general, appName: e.target.value },
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          App Version
                        </label>
                        <input
                          type="text"
                          value={settings.general.appVersion ?? ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              general: { ...settings.general, appVersion: e.target.value },
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Environment
                        </label>
                        <select
                          value={settings.general.environment ?? "production"}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              general: { ...settings.general, environment: e.target.value as "development" | "staging" | "production" },
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                        >
                          <option value="development">Development</option>
                          <option value="staging">Staging</option>
                          <option value="production">Production</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={settings.general.maintenanceMode.enabled ?? false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                general: { 
                                  ...settings.general, 
                                  maintenanceMode: { 
                                    ...settings.general.maintenanceMode, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                          <label className="text-xs font-medium text-gray-700">
                            Maintenance Mode
                          </label>
                        </div>
                        {settings.general.maintenanceMode.enabled && (
                          <div className="space-y-2 ml-6">
                            <textarea
                              value={settings.general.maintenanceMode.message ?? ""}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  general: { 
                                    ...settings.general, 
                                    maintenanceMode: { 
                                      ...settings.general.maintenanceMode, 
                                      message: e.target.value 
                                    } 
                                  },
                                })
                              }
                              placeholder="Maintenance message"
                              rows={2}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            />
                            <input
                              type="datetime-local"
                              value={settings.general.maintenanceMode.estimatedEndTime ? new Date(settings.general.maintenanceMode.estimatedEndTime).toISOString().slice(0, 16) : ""}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  general: { 
                                    ...settings.general, 
                                    maintenanceMode: { 
                                      ...settings.general.maintenanceMode, 
                                      estimatedEndTime: e.target.value ? new Date(e.target.value).toISOString() : undefined
                                    } 
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={settings.general.forceUpdate.enabled ?? false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                general: { 
                                  ...settings.general, 
                                  forceUpdate: { 
                                    ...settings.general.forceUpdate, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                          <label className="text-xs font-medium text-gray-700">
                            Force Update
                          </label>
                        </div>
                        {settings.general.forceUpdate.enabled && (
                          <div className="space-y-2 ml-6">
                            <input
                              type="text"
                              value={settings.general.forceUpdate.minVersion ?? ""}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  general: { 
                                    ...settings.general, 
                                    forceUpdate: { 
                                      ...settings.general.forceUpdate, 
                                      minVersion: e.target.value 
                                    } 
                                  },
                                })
                              }
                              placeholder="Minimum version (e.g., 1.0.0)"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            />
                            <textarea
                              value={settings.general.forceUpdate.message ?? ""}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  general: { 
                                    ...settings.general, 
                                    forceUpdate: { 
                                      ...settings.general.forceUpdate, 
                                      message: e.target.value 
                                    } 
                                  },
                                })
                              }
                              placeholder="Force update message"
                              rows={2}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Settings */}
                {activeTab === "business" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900">Business Settings</h2>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={settings.business.companyName ?? ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                business: { ...settings.business, companyName: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Company Email
                          </label>
                          <input
                            type="email"
                            value={settings.business.companyEmail ?? ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                business: { ...settings.business, companyEmail: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Company Phone
                          </label>
                          <input
                            type="tel"
                            value={settings.business.companyPhone ?? ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                business: { ...settings.business, companyPhone: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Timezone
                          </label>
                          <input
                            type="text"
                            value={settings.business.businessHours.timezone ?? ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                business: { 
                                  ...settings.business, 
                                  businessHours: { 
                                    ...settings.business.businessHours, 
                                    timezone: e.target.value 
                                  } 
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Company Address
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={settings.business.companyAddress.street ?? ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                business: { 
                                  ...settings.business, 
                                  companyAddress: { 
                                    ...settings.business.companyAddress, 
                                    street: e.target.value 
                                  } 
                                },
                              })
                            }
                            placeholder="Street"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                          <input
                            type="text"
                            value={settings.business.companyAddress.city ?? ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                business: { 
                                  ...settings.business, 
                                  companyAddress: { 
                                    ...settings.business.companyAddress, 
                                    city: e.target.value 
                                  } 
                                },
                              })
                            }
                            placeholder="City"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                          <input
                            type="text"
                            value={settings.business.companyAddress.state ?? ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                business: { 
                                  ...settings.business, 
                                  companyAddress: { 
                                    ...settings.business.companyAddress, 
                                    state: e.target.value 
                                  } 
                                },
                              })
                            }
                            placeholder="State"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                          <input
                            type="text"
                            value={settings.business.companyAddress.zipCode ?? ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                business: { 
                                  ...settings.business, 
                                  companyAddress: { 
                                    ...settings.business.companyAddress, 
                                    zipCode: e.target.value 
                                  } 
                                },
                              })
                            }
                            placeholder="Zip Code"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                          <input
                            type="text"
                            value={settings.business.companyAddress.country ?? ""}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                business: { 
                                  ...settings.business, 
                                  companyAddress: { 
                                    ...settings.business.companyAddress, 
                                    country: e.target.value 
                                  } 
                                },
                              })
                            }
                            placeholder="Country"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-900">Support Channels</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                            <div>
                              <h4 className="text-xs font-medium text-gray-900">Email Support</h4>
                              <p className="text-xs text-gray-600">{settings.business.supportChannels.email.address ?? ""}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={settings.business.supportChannels.email.enabled ?? true}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  business: { 
                                    ...settings.business, 
                                    supportChannels: { 
                                      ...settings.business.supportChannels, 
                                      email: { 
                                        ...settings.business.supportChannels.email, 
                                        enabled: e.target.checked 
                                      } 
                                    } 
                                  },
                                })
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                            <div>
                              <h4 className="text-xs font-medium text-gray-900">Phone Support</h4>
                              <p className="text-xs text-gray-600">{settings.business.supportChannels.phone.number ?? ""}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={settings.business.supportChannels.phone.enabled ?? true}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  business: { 
                                    ...settings.business, 
                                    supportChannels: { 
                                      ...settings.business.supportChannels, 
                                      phone: { 
                                        ...settings.business.supportChannels.phone, 
                                        enabled: e.target.checked 
                                      } 
                                    } 
                                  },
                                })
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                            <div>
                              <h4 className="text-xs font-medium text-gray-900">Chat Support</h4>
                              <p className="text-xs text-gray-600">
                                {settings.business.supportChannels.chat.hours.start ?? "09:00"} - {settings.business.supportChannels.chat.hours.end ?? "17:00"}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={settings.business.supportChannels.chat.enabled ?? true}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  business: { 
                                    ...settings.business, 
                                    supportChannels: { 
                                      ...settings.business.supportChannels, 
                                      chat: { 
                                        ...settings.business.supportChannels.chat, 
                                        enabled: e.target.checked 
                                      } 
                                    } 
                                  },
                                })
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === "security" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900">Security Settings</h2>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Min Password Length
                          </label>
                          <input
                            type="number"
                            value={settings.security.passwordPolicy.minLength ?? 8}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { 
                                  ...settings.security, 
                                  passwordPolicy: { 
                                    ...settings.security.passwordPolicy, 
                                    minLength: parseInt(e.target.value) || 8 
                                  } 
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Max Login Attempts
                          </label>
                          <input
                            type="number"
                            value={settings.security.passwordPolicy.maxLoginAttempts ?? 5}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { 
                                  ...settings.security, 
                                  passwordPolicy: { 
                                    ...settings.security.passwordPolicy, 
                                    maxLoginAttempts: parseInt(e.target.value) || 5 
                                  } 
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Lockout Duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={settings.security.passwordPolicy.lockoutDuration ?? 15}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { 
                                  ...settings.security, 
                                  passwordPolicy: { 
                                    ...settings.security.passwordPolicy, 
                                    lockoutDuration: parseInt(e.target.value) || 15 
                                  } 
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Max Session Duration (hours)
                          </label>
                          <input
                            type="number"
                            value={settings.security.sessionSettings.maxSessionDuration ?? 24}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { 
                                  ...settings.security, 
                                  sessionSettings: { 
                                    ...settings.security.sessionSettings, 
                                    maxSessionDuration: parseInt(e.target.value) || 24 
                                  } 
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">Require Uppercase</h3>
                            <p className="text-xs text-gray-600">Passwords must contain uppercase letters</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.security.passwordPolicy.requireUppercase ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { 
                                  ...settings.security, 
                                  passwordPolicy: { 
                                    ...settings.security.passwordPolicy, 
                                    requireUppercase: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">Require Lowercase</h3>
                            <p className="text-xs text-gray-600">Passwords must contain lowercase letters</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.security.passwordPolicy.requireLowercase ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { 
                                  ...settings.security, 
                                  passwordPolicy: { 
                                    ...settings.security.passwordPolicy, 
                                    requireLowercase: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">Require Numbers</h3>
                            <p className="text-xs text-gray-600">Passwords must contain numbers</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.security.passwordPolicy.requireNumbers ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { 
                                  ...settings.security, 
                                  passwordPolicy: { 
                                    ...settings.security.passwordPolicy, 
                                    requireNumbers: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">Require Special Characters</h3>
                            <p className="text-xs text-gray-600">Passwords must contain special characters</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.security.passwordPolicy.requireSpecialChars ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { 
                                  ...settings.security, 
                                  passwordPolicy: { 
                                    ...settings.security.passwordPolicy, 
                                    requireSpecialChars: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">Allow Multiple Sessions</h3>
                            <p className="text-xs text-gray-600">Users can have multiple active sessions</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.security.sessionSettings.allowMultipleSessions ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                security: { 
                                  ...settings.security, 
                                  sessionSettings: { 
                                    ...settings.security.sessionSettings, 
                                    allowMultipleSessions: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Uploads Settings */}
                {activeTab === "uploads" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900">Upload Settings</h2>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Max File Size (bytes)
                          </label>
                          <input
                            type="number"
                            value={settings.uploads.maxFileSize ?? 10485760}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                uploads: { ...settings.uploads, maxFileSize: parseInt(e.target.value) || 10485760 },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                          <p className="text-xs text-gray-500 mt-1">{(settings.uploads.maxFileSize ?? 10485760) / 1048576} MB</p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Max Images Per Upload
                          </label>
                          <input
                            type="number"
                            value={settings.uploads.maxImagesPerUpload ?? 10}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                uploads: { ...settings.uploads, maxImagesPerUpload: parseInt(e.target.value) || 10 },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900">Image Compression</h3>
                          <p className="text-xs text-gray-600">Enable automatic image compression</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.uploads.imageCompression.enabled ?? true}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              uploads: { 
                                ...settings.uploads, 
                                imageCompression: { 
                                  ...settings.uploads.imageCompression, 
                                  enabled: e.target.checked 
                                } 
                              },
                            })
                          }
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                        />
                      </div>
                      
                      {settings.uploads.imageCompression.enabled && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Compression Quality (1-100)
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="100"
                            value={settings.uploads.imageCompression.quality ?? 80}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                uploads: { 
                                  ...settings.uploads, 
                                  imageCompression: { 
                                    ...settings.uploads.imageCompression, 
                                    quality: parseInt(e.target.value) || 80 
                                  } 
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Allowed Image Types (MIME types, one per line)
                        </label>
                        <textarea
                          value={(settings.uploads.allowedImageTypes ?? []).join('\n')}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              uploads: { 
                                ...settings.uploads, 
                                allowedImageTypes: e.target.value.split('\n').filter(t => t.trim()) 
                              },
                            })
                          }
                          rows={4}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          placeholder="image/jpeg&#10;image/png&#10;image/gif&#10;image/webp"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Allowed Document Types (MIME types, one per line)
                        </label>
                        <textarea
                          value={(settings.uploads.allowedDocumentTypes ?? []).join('\n')}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              uploads: { 
                                ...settings.uploads, 
                                allowedDocumentTypes: e.target.value.split('\n').filter(t => t.trim()) 
                              },
                            })
                          }
                          rows={4}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          placeholder="application/pdf&#10;application/msword"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeTab === "notifications" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900">Notification Settings</h2>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">Email Notifications</h3>
                            <p className="text-xs text-gray-600">Enable email notifications</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.email.enabled ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                notifications: { 
                                  ...settings.notifications, 
                                  email: { 
                                    ...settings.notifications.email, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.notifications.email.enabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Provider</label>
                              <select
                                value={settings.notifications.email.provider ?? "nodemailer"}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    notifications: { 
                                      ...settings.notifications, 
                                      email: { 
                                        ...settings.notifications.email, 
                                        provider: e.target.value as "nodemailer" | "sendgrid" | "mailgun" | "ses"
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              >
                                <option value="nodemailer">Nodemailer</option>
                                <option value="sendgrid">SendGrid</option>
                                <option value="mailgun">Mailgun</option>
                                <option value="ses">AWS SES</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">From Email</label>
                              <input
                                type="email"
                                value={settings.notifications.email.fromEmail ?? ""}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    notifications: { 
                                      ...settings.notifications, 
                                      email: { 
                                        ...settings.notifications.email, 
                                        fromEmail: e.target.value 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">From Name</label>
                              <input
                                type="text"
                                value={settings.notifications.email.fromName ?? ""}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    notifications: { 
                                      ...settings.notifications, 
                                      email: { 
                                        ...settings.notifications.email, 
                                        fromName: e.target.value 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">SMS Notifications</h3>
                            <p className="text-xs text-gray-600">Enable SMS notifications</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.sms.enabled ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                notifications: { 
                                  ...settings.notifications, 
                                  sms: { 
                                    ...settings.notifications.sms, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.notifications.sms.enabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Provider</label>
                              <select
                                value={settings.notifications.sms.provider ?? "twilio"}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    notifications: { 
                                      ...settings.notifications, 
                                      sms: { 
                                        ...settings.notifications.sms, 
                                        provider: e.target.value as "twilio" | "vonage" | "aws_sns"
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              >
                                <option value="twilio">Twilio</option>
                                <option value="vonage">Vonage</option>
                                <option value="aws_sns">AWS SNS</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">From Number</label>
                              <input
                                type="tel"
                                value={settings.notifications.sms.fromNumber ?? ""}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    notifications: { 
                                      ...settings.notifications, 
                                      sms: { 
                                        ...settings.notifications.sms, 
                                        fromNumber: e.target.value 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">Push Notifications</h3>
                            <p className="text-xs text-gray-600">Enable push notifications</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.push.enabled ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                notifications: { 
                                  ...settings.notifications, 
                                  push: { 
                                    ...settings.notifications.push, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.notifications.push.enabled && (
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Provider</label>
                            <select
                              value={settings.notifications.push.provider ?? "firebase"}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  notifications: { 
                                    ...settings.notifications, 
                                    push: { 
                                      ...settings.notifications.push, 
                                      provider: e.target.value as "firebase" | "onesignal" | "pusher"
                                    } 
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            >
                              <option value="firebase">Firebase</option>
                              <option value="onesignal">OneSignal</option>
                              <option value="pusher">Pusher</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payments Settings */}
                {activeTab === "payments" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900">Payment Settings</h2>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Default Currency
                          </label>
                          <select
                            value={settings.payments.defaultCurrency ?? "PHP"}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                payments: { ...settings.payments, defaultCurrency: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          >
                            <option value="PHP">PHP</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Transaction Fee Percentage (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={settings.payments.transactionFees.percentage ?? 2.9}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                payments: { 
                                  ...settings.payments, 
                                  transactionFees: { 
                                    ...settings.payments.transactionFees, 
                                    percentage: parseFloat(e.target.value) || 0 
                                  } 
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Transaction Fee Fixed
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={settings.payments.transactionFees.fixed ?? 0.30}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                payments: { 
                                  ...settings.payments, 
                                  transactionFees: { 
                                    ...settings.payments.transactionFees, 
                                    fixed: parseFloat(e.target.value) || 0 
                                  } 
                                },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Minimum Payout
                          </label>
                          <input
                            type="number"
                            value={settings.payments.minimumPayout ?? 100}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                payments: { ...settings.payments, minimumPayout: parseFloat(e.target.value) || 0 },
                              })
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Supported Currencies (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={(settings.payments.supportedCurrencies ?? []).join(', ')}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              payments: { 
                                ...settings.payments, 
                                supportedCurrencies: e.target.value.split(',').map(c => c.trim()).filter(c => c) 
                              },
                            })
                          }
                          placeholder="PHP"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                        />
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <h3 className="text-xs font-semibold text-gray-900 mb-2">Payout Schedule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                            <select
                              value={settings.payments.payoutSchedule.frequency ?? "weekly"}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  payments: { 
                                    ...settings.payments, 
                                    payoutSchedule: { 
                                      ...settings.payments.payoutSchedule, 
                                      frequency: e.target.value as "daily" | "weekly" | "monthly"
                                    } 
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Day of Week (0-6)</label>
                            <input
                              type="number"
                              min="0"
                              max="6"
                              value={settings.payments.payoutSchedule.dayOfWeek ?? 1}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  payments: { 
                                    ...settings.payments, 
                                    payoutSchedule: { 
                                      ...settings.payments.payoutSchedule, 
                                      dayOfWeek: parseInt(e.target.value) || 1 
                                    } 
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Day of Month (1-31)</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={settings.payments.payoutSchedule.dayOfMonth ?? 1}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  payments: { 
                                    ...settings.payments, 
                                    payoutSchedule: { 
                                      ...settings.payments.payoutSchedule, 
                                      dayOfMonth: parseInt(e.target.value) || 1 
                                    } 
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features Settings */}
                {activeTab === "features" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900">Feature Toggles</h2>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">Marketplace</h3>
                            <p className="text-xs text-gray-600">Enable service marketplace</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.features.marketplace.enabled ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                features: { 
                                  ...settings.features, 
                                  marketplace: { 
                                    ...settings.features.marketplace, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.features.marketplace.enabled && (
                          <div className="space-y-2 mt-3 border-t border-gray-200 pt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <input
                                  type="text"
                                  value={settings.features.marketplace.description ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        marketplace: { 
                                          ...settings.features.marketplace, 
                                          description: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  placeholder="Connect with service providers and customers"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Icon Name</label>
                                <input
                                  type="text"
                                  value={settings.features.marketplace.icon ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        marketplace: { 
                                          ...settings.features.marketplace, 
                                          icon: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  placeholder="Shield"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Color Classes</label>
                                <input
                                  type="text"
                                  value={settings.features.marketplace.color ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        marketplace: { 
                                          ...settings.features.marketplace, 
                                          color: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  placeholder="bg-gray-100 text-gray-700"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Route</label>
                                <input
                                  type="text"
                                  value={settings.features.marketplace.route ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        marketplace: { 
                                          ...settings.features.marketplace, 
                                          route: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  placeholder="/marketplace"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                <input
                                  type="text"
                                  value={settings.features.marketplace.category ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        marketplace: { 
                                          ...settings.features.marketplace, 
                                          category: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  placeholder="Services"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Users Count</label>
                                <input
                                  type="number"
                                  value={settings.features.marketplace.users ?? 0}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        marketplace: { 
                                          ...settings.features.marketplace, 
                                          users: parseInt(e.target.value) || 0 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Last Updated</label>
                                <input
                                  type="text"
                                  value={settings.features.marketplace.lastUpdated ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        marketplace: { 
                                          ...settings.features.marketplace, 
                                          lastUpdated: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  placeholder="2 hours ago"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-700">Featured</label>
                                <input
                                  type="checkbox"
                                  checked={settings.features.marketplace.featured ?? false}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        marketplace: { 
                                          ...settings.features.marketplace, 
                                          featured: e.target.checked 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Services (comma-separated)</label>
                              <input
                                type="text"
                                value={(settings.features.marketplace.services ?? []).join(', ')}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      marketplace: { 
                                        ...settings.features.marketplace, 
                                        services: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                                      } 
                                    },
                                  })
                                }
                                placeholder="Cleaning, Plumbing, Electrical, Moving"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 border border-gray-200 rounded">
                              <div>
                                <h4 className="text-xs font-medium text-gray-900">Allow New Providers</h4>
                                <p className="text-xs text-gray-600">Allow new service providers to register</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={settings.features.marketplace.allowNewProviders ?? true}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      marketplace: { 
                                        ...settings.features.marketplace, 
                                        allowNewProviders: e.target.checked 
                                      } 
                                    },
                                  })
                                }
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 border border-gray-200 rounded">
                              <div>
                                <h4 className="text-xs font-medium text-gray-900">Require Verification</h4>
                                <p className="text-xs text-gray-600">Require provider verification before listing</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={settings.features.marketplace.requireVerification ?? true}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      marketplace: { 
                                        ...settings.features.marketplace, 
                                        requireVerification: e.target.checked 
                                      } 
                                    },
                                  })
                                }
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-xs font-medium text-gray-900">Academy</h3>
                            <p className="text-xs text-gray-600">Enable course academy</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.features.academy.enabled ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                features: { 
                                  ...settings.features, 
                                  academy: { 
                                    ...settings.features.academy, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.features.academy.enabled && (
                          <div className="space-y-2 mt-3 border-t border-gray-200 pt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <input
                                  type="text"
                                  value={settings.features.academy.description ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        academy: { 
                                          ...settings.features.academy, 
                                          description: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Icon Name</label>
                                <input
                                  type="text"
                                  value={settings.features.academy.icon ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        academy: { 
                                          ...settings.features.academy, 
                                          icon: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Color Classes</label>
                                <input
                                  type="text"
                                  value={settings.features.academy.color ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        academy: { 
                                          ...settings.features.academy, 
                                          color: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Route</label>
                                <input
                                  type="text"
                                  value={settings.features.academy.route ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        academy: { 
                                          ...settings.features.academy, 
                                          route: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                <input
                                  type="text"
                                  value={settings.features.academy.category ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        academy: { 
                                          ...settings.features.academy, 
                                          category: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Users Count</label>
                                <input
                                  type="number"
                                  value={settings.features.academy.users ?? 0}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        academy: { 
                                          ...settings.features.academy, 
                                          users: parseInt(e.target.value) || 0 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Last Updated</label>
                                <input
                                  type="text"
                                  value={settings.features.academy.lastUpdated ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        academy: { 
                                          ...settings.features.academy, 
                                          lastUpdated: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-700">Featured</label>
                                <input
                                  type="checkbox"
                                  checked={settings.features.academy.featured ?? false}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        academy: { 
                                          ...settings.features.academy, 
                                          featured: e.target.checked 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Services (comma-separated)</label>
                              <input
                                type="text"
                                value={(settings.features.academy.services ?? []).join(', ')}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      academy: { 
                                        ...settings.features.academy, 
                                        services: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 border border-gray-200 rounded">
                              <div>
                                <h4 className="text-xs font-medium text-gray-900">Allow New Courses</h4>
                                <p className="text-xs text-gray-600">Allow new courses to be created</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={settings.features.academy.allowNewCourses ?? true}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      academy: { 
                                        ...settings.features.academy, 
                                        allowNewCourses: e.target.checked 
                                      } 
                                    },
                                  })
                                }
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 border border-gray-200 rounded">
                              <div>
                                <h4 className="text-xs font-medium text-gray-900">Require Instructor Verification</h4>
                                <p className="text-xs text-gray-600">Require instructor verification before teaching</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={settings.features.academy.requireInstructorVerification ?? true}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      academy: { 
                                        ...settings.features.academy, 
                                        requireInstructorVerification: e.target.checked 
                                      } 
                                    },
                                  })
                                }
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Feature Details Helper Component */}
                      {(['rentals', 'ads', 'facilityCare', 'finance', 'supplies', 'localProPlus'] as const).map((featureKey) => {
                        const feature = settings.features[featureKey] || { enabled: false };
                        const featureNames: Record<typeof featureKey, { title: string; description: string }> = {
                          rentals: { title: "Rentals", description: "Enable rental marketplace" },
                          ads: { title: "Ads", description: "Enable advertising platform" },
                          facilityCare: { title: "Facility Care", description: "Enable facility care services" },
                          finance: { title: "Finance", description: "Enable finance features" },
                          supplies: { title: "Supplies", description: "Enable supplies marketplace" },
                          localProPlus: { title: "LocalPro Plus", description: "Enable LocalPro Plus premium features" },
                        };
                        const featureName = featureNames[featureKey];
                        
                        return (
                          <div key={featureKey} className="border border-gray-200 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="text-xs font-medium text-gray-900">{featureName.title}</h3>
                                <p className="text-xs text-gray-600">{featureName.description}</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={feature?.enabled ?? false}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      [featureKey]: { 
                                        ...feature, 
                                        enabled: e.target.checked 
                                      } 
                                    },
                                  })
                                }
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                              />
                            </div>
                            {feature?.enabled && (
                              <div className="space-y-2 mt-3 border-t border-gray-200 pt-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                      type="text"
                                      value={feature.description ?? ""}
                                      onChange={(e) =>
                                        setSettings({
                                          ...settings,
                                          features: { 
                                            ...settings.features, 
                                            [featureKey]: { 
                                              ...feature, 
                                              description: e.target.value 
                                            } 
                                          },
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Icon Name</label>
                                    <input
                                      type="text"
                                      value={feature.icon ?? ""}
                                      onChange={(e) =>
                                        setSettings({
                                          ...settings,
                                          features: { 
                                            ...settings.features, 
                                            [featureKey]: { 
                                              ...feature, 
                                              icon: e.target.value 
                                            } 
                                          },
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Color Classes</label>
                                    <input
                                      type="text"
                                      value={feature.color ?? ""}
                                      onChange={(e) =>
                                        setSettings({
                                          ...settings,
                                          features: { 
                                            ...settings.features, 
                                            [featureKey]: { 
                                              ...feature, 
                                              color: e.target.value 
                                            } 
                                          },
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Route</label>
                                    <input
                                      type="text"
                                      value={feature.route ?? ""}
                                      onChange={(e) =>
                                        setSettings({
                                          ...settings,
                                          features: { 
                                            ...settings.features, 
                                            [featureKey]: { 
                                              ...feature, 
                                              route: e.target.value 
                                            } 
                                          },
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                    <input
                                      type="text"
                                      value={feature.category ?? ""}
                                      onChange={(e) =>
                                        setSettings({
                                          ...settings,
                                          features: { 
                                            ...settings.features, 
                                            [featureKey]: { 
                                              ...feature, 
                                              category: e.target.value 
                                            } 
                                          },
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Users Count</label>
                                    <input
                                      type="number"
                                      value={feature.users ?? 0}
                                      onChange={(e) =>
                                        setSettings({
                                          ...settings,
                                          features: { 
                                            ...settings.features, 
                                            [featureKey]: { 
                                              ...feature, 
                                              users: parseInt(e.target.value) || 0 
                                            } 
                                          },
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Updated</label>
                                    <input
                                      type="text"
                                      value={feature.lastUpdated ?? ""}
                                      onChange={(e) =>
                                        setSettings({
                                          ...settings,
                                          features: { 
                                            ...settings.features, 
                                            [featureKey]: { 
                                              ...feature, 
                                              lastUpdated: e.target.value 
                                            } 
                                          },
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-gray-700">Featured</label>
                                    <input
                                      type="checkbox"
                                      checked={feature.featured ?? false}
                                      onChange={(e) =>
                                        setSettings({
                                          ...settings,
                                          features: { 
                                            ...settings.features, 
                                            [featureKey]: { 
                                              ...feature, 
                                              featured: e.target.checked 
                                            } 
                                          },
                                        })
                                      }
                                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Services (comma-separated)</label>
                                  <input
                                    type="text"
                                    value={(feature.services ?? []).join(', ')}
                                    onChange={(e) =>
                                      setSettings({
                                        ...settings,
                                        features: { 
                                          ...settings.features, 
                                          [featureKey]: { 
                                            ...feature, 
                                            services: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                                          } 
                                        },
                                      })
                                    }
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-gray-900">Job Board</h3>
                          <input
                            type="checkbox"
                            checked={settings.features.jobBoard.enabled ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                features: { 
                                  ...settings.features, 
                                  jobBoard: { 
                                    ...settings.features.jobBoard, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.features.jobBoard.enabled && (
                          <div className="space-y-2 mt-3 border-t border-gray-200 pt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <input
                                  type="text"
                                  value={settings.features.jobBoard.description ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        jobBoard: { 
                                          ...settings.features.jobBoard, 
                                          description: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Icon Name</label>
                                <input
                                  type="text"
                                  value={settings.features.jobBoard.icon ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        jobBoard: { 
                                          ...settings.features.jobBoard, 
                                          icon: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Color Classes</label>
                                <input
                                  type="text"
                                  value={settings.features.jobBoard.color ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        jobBoard: { 
                                          ...settings.features.jobBoard, 
                                          color: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Route</label>
                                <input
                                  type="text"
                                  value={settings.features.jobBoard.route ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        jobBoard: { 
                                          ...settings.features.jobBoard, 
                                          route: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                <input
                                  type="text"
                                  value={settings.features.jobBoard.category ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        jobBoard: { 
                                          ...settings.features.jobBoard, 
                                          category: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Users Count</label>
                                <input
                                  type="number"
                                  value={settings.features.jobBoard.users ?? 0}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        jobBoard: { 
                                          ...settings.features.jobBoard, 
                                          users: parseInt(e.target.value) || 0 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Last Updated</label>
                                <input
                                  type="text"
                                  value={settings.features.jobBoard.lastUpdated ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        jobBoard: { 
                                          ...settings.features.jobBoard, 
                                          lastUpdated: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-700">Featured</label>
                                <input
                                  type="checkbox"
                                  checked={settings.features.jobBoard.featured ?? false}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        jobBoard: { 
                                          ...settings.features.jobBoard, 
                                          featured: e.target.checked 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Services (comma-separated)</label>
                              <input
                                type="text"
                                value={(settings.features.jobBoard.services ?? []).join(', ')}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      jobBoard: { 
                                        ...settings.features.jobBoard, 
                                        services: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 border border-gray-200 rounded">
                              <div>
                                <h4 className="text-xs font-medium text-gray-900">Allow New Jobs</h4>
                                <p className="text-xs text-gray-600">Allow new job postings</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={settings.features.jobBoard.allowNewJobs ?? true}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      jobBoard: { 
                                        ...settings.features.jobBoard, 
                                        allowNewJobs: e.target.checked 
                                      } 
                                    },
                                  })
                                }
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 border border-gray-200 rounded">
                              <div>
                                <h4 className="text-xs font-medium text-gray-900">Require Company Verification</h4>
                                <p className="text-xs text-gray-600">Require company verification before posting</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={settings.features.jobBoard.requireCompanyVerification ?? true}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      jobBoard: { 
                                        ...settings.features.jobBoard, 
                                        requireCompanyVerification: e.target.checked 
                                      } 
                                    },
                                  })
                                }
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-gray-900">Referrals</h3>
                          <input
                            type="checkbox"
                            checked={settings.features.referrals.enabled ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                features: { 
                                  ...settings.features, 
                                  referrals: { 
                                    ...settings.features.referrals, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.features.referrals.enabled && (
                          <div className="space-y-2 mt-3 border-t border-gray-200 pt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <input
                                  type="text"
                                  value={settings.features.referrals.description ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        referrals: { 
                                          ...settings.features.referrals, 
                                          description: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Icon Name</label>
                                <input
                                  type="text"
                                  value={settings.features.referrals.icon ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        referrals: { 
                                          ...settings.features.referrals, 
                                          icon: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Color Classes</label>
                                <input
                                  type="text"
                                  value={settings.features.referrals.color ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        referrals: { 
                                          ...settings.features.referrals, 
                                          color: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Route</label>
                                <input
                                  type="text"
                                  value={settings.features.referrals.route ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        referrals: { 
                                          ...settings.features.referrals, 
                                          route: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                <input
                                  type="text"
                                  value={settings.features.referrals.category ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        referrals: { 
                                          ...settings.features.referrals, 
                                          category: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Users Count</label>
                                <input
                                  type="number"
                                  value={settings.features.referrals.users ?? 0}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        referrals: { 
                                          ...settings.features.referrals, 
                                          users: parseInt(e.target.value) || 0 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Last Updated</label>
                                <input
                                  type="text"
                                  value={settings.features.referrals.lastUpdated ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        referrals: { 
                                          ...settings.features.referrals, 
                                          lastUpdated: e.target.value 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-700">Featured</label>
                                <input
                                  type="checkbox"
                                  checked={settings.features.referrals.featured ?? false}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        referrals: { 
                                          ...settings.features.referrals, 
                                          featured: e.target.checked 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Services (comma-separated)</label>
                              <input
                                type="text"
                                value={(settings.features.referrals.services ?? []).join(', ')}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    features: { 
                                      ...settings.features, 
                                      referrals: { 
                                        ...settings.features.referrals, 
                                        services: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Reward Amount</label>
                                <input
                                  type="number"
                                  value={settings.features.referrals.rewardAmount ?? 100}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        referrals: { 
                                          ...settings.features.referrals, 
                                          rewardAmount: parseInt(e.target.value) || 100 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Max Referrals Per User</label>
                                <input
                                  type="number"
                                  value={settings.features.referrals.maxReferralsPerUser ?? 50}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      features: { 
                                        ...settings.features, 
                                        referrals: { 
                                          ...settings.features.referrals, 
                                          maxReferralsPerUser: parseInt(e.target.value) || 50 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <h3 className="text-xs font-semibold text-gray-900 mb-2">Payment Methods</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">PayPal</span>
                            <input
                              type="checkbox"
                              checked={settings.features.payments?.paypal?.enabled ?? true}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  features: { 
                                    ...settings.features, 
                                    payments: { 
                                      ...(settings.features.payments || {}), 
                                      paypal: { 
                                        ...(settings.features.payments?.paypal || {}), 
                                        enabled: e.target.checked 
                                      } 
                                    } 
                                  },
                                })
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">PayMaya</span>
                            <input
                              type="checkbox"
                              checked={settings.features.payments?.paymaya?.enabled ?? true}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  features: { 
                                    ...settings.features, 
                                    payments: { 
                                      ...(settings.features.payments || {}), 
                                      paymaya: { 
                                        ...(settings.features.payments?.paymaya || {}), 
                                        enabled: e.target.checked 
                                      } 
                                    } 
                                  },
                                })
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">GCash</span>
                            <input
                              type="checkbox"
                              checked={settings.features.payments?.gcash?.enabled ?? true}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  features: { 
                                    ...settings.features, 
                                    payments: { 
                                      ...(settings.features.payments || {}), 
                                      gcash: { 
                                        ...(settings.features.payments?.gcash || {}), 
                                        enabled: e.target.checked 
                                      } 
                                    } 
                                  },
                                })
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">Bank Transfer</span>
                            <input
                              type="checkbox"
                              checked={settings.features.payments?.bankTransfer?.enabled ?? true}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  features: { 
                                    ...settings.features, 
                                    payments: { 
                                      ...(settings.features.payments || {}), 
                                      bankTransfer: { 
                                        ...(settings.features.payments?.bankTransfer || {}), 
                                        enabled: e.target.checked 
                                      } 
                                    } 
                                  },
                                })
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <h3 className="text-xs font-semibold text-gray-900 mb-2">Analytics</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">Enabled</span>
                            <input
                              type="checkbox"
                              checked={settings.features.analytics?.enabled ?? true}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  features: { 
                                    ...settings.features, 
                                    analytics: { 
                                      ...(settings.features.analytics || {}), 
                                      enabled: e.target.checked 
                                    } 
                                  },
                                })
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">Track User Behavior</span>
                            <input
                              type="checkbox"
                              checked={settings.features.analytics?.trackUserBehavior ?? true}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  features: { 
                                    ...settings.features, 
                                    analytics: { 
                                      ...(settings.features.analytics || {}), 
                                      trackUserBehavior: e.target.checked 
                                    } 
                                  },
                                })
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">Track Performance</span>
                            <input
                              type="checkbox"
                              checked={settings.features.analytics?.trackPerformance ?? true}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  features: { 
                                    ...settings.features, 
                                    analytics: { 
                                      ...(settings.features.analytics || {}), 
                                      trackPerformance: e.target.checked 
                                    } 
                                  },
                                })
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics Settings */}
                {activeTab === "analytics" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900">Analytics Settings</h2>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-gray-900">Google Analytics</h3>
                          <input
                            type="checkbox"
                            checked={settings.analytics.googleAnalytics.enabled ?? false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                analytics: { 
                                  ...settings.analytics, 
                                  googleAnalytics: { 
                                    ...settings.analytics.googleAnalytics, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.analytics.googleAnalytics.enabled && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tracking ID</label>
                            <input
                              type="text"
                              value={settings.analytics.googleAnalytics.trackingId ?? ""}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  analytics: { 
                                    ...settings.analytics, 
                                    googleAnalytics: { 
                                      ...settings.analytics.googleAnalytics, 
                                      trackingId: e.target.value 
                                    } 
                                  },
                                })
                              }
                              placeholder="UA-XXXXXXXXX-X"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-gray-900">Mixpanel</h3>
                          <input
                            type="checkbox"
                            checked={settings.analytics.mixpanel.enabled ?? false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                analytics: { 
                                  ...settings.analytics, 
                                  mixpanel: { 
                                    ...settings.analytics.mixpanel, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.analytics.mixpanel.enabled && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Project Token</label>
                            <input
                              type="text"
                              value={settings.analytics.mixpanel.projectToken ?? ""}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  analytics: { 
                                    ...settings.analytics, 
                                    mixpanel: { 
                                      ...settings.analytics.mixpanel, 
                                      projectToken: e.target.value 
                                    } 
                                  },
                                })
                              }
                              placeholder="your-mixpanel-project-token"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-gray-900">Custom Analytics</h3>
                          <input
                            type="checkbox"
                            checked={settings.analytics.customAnalytics.enabled ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                analytics: { 
                                  ...settings.analytics, 
                                  customAnalytics: { 
                                    ...settings.analytics.customAnalytics, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.analytics.customAnalytics.enabled && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Retention Period (days)</label>
                            <input
                              type="number"
                              value={settings.analytics.customAnalytics.retentionPeriod ?? 365}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  analytics: { 
                                    ...settings.analytics, 
                                    customAnalytics: { 
                                      ...settings.analytics.customAnalytics, 
                                      retentionPeriod: parseInt(e.target.value) || 365 
                                    } 
                                  },
                                })
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Integrations Settings */}
                {activeTab === "integrations" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Plug className="w-4 h-4 text-primary" />
                      <h2 className="text-base font-semibold text-gray-900">Integration Settings</h2>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-gray-900">Google Maps</h3>
                          <input
                            type="checkbox"
                            checked={settings.integrations.googleMaps.enabled ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                integrations: { 
                                  ...settings.integrations, 
                                  googleMaps: { 
                                    ...settings.integrations.googleMaps, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.integrations.googleMaps.enabled && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">API Key</label>
                              <input
                                type="text"
                                value={settings.integrations.googleMaps.apiKey ?? ""}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    integrations: { 
                                      ...settings.integrations, 
                                      googleMaps: { 
                                        ...settings.integrations.googleMaps, 
                                        apiKey: e.target.value 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Default Zoom</label>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={settings.integrations.googleMaps.defaultZoom ?? 13}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    integrations: { 
                                      ...settings.integrations, 
                                      googleMaps: { 
                                        ...settings.integrations.googleMaps, 
                                        defaultZoom: parseInt(e.target.value) || 13 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-gray-900">Cloudinary</h3>
                          <input
                            type="checkbox"
                            checked={settings.integrations.cloudinary.enabled ?? true}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                integrations: { 
                                  ...settings.integrations, 
                                  cloudinary: { 
                                    ...settings.integrations.cloudinary, 
                                    enabled: e.target.checked 
                                  } 
                                },
                              })
                            }
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                          />
                        </div>
                        {settings.integrations.cloudinary.enabled && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Cloud Name</label>
                              <input
                                type="text"
                                value={settings.integrations.cloudinary.cloudName ?? ""}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    integrations: { 
                                      ...settings.integrations, 
                                      cloudinary: { 
                                        ...settings.integrations.cloudinary, 
                                        cloudName: e.target.value 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">API Key</label>
                              <input
                                type="text"
                                value={settings.integrations.cloudinary.apiKey ?? ""}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    integrations: { 
                                      ...settings.integrations, 
                                      cloudinary: { 
                                        ...settings.integrations.cloudinary, 
                                        apiKey: e.target.value 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">API Secret</label>
                              <input
                                type="password"
                                value={settings.integrations.cloudinary.apiSecret ?? ""}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    integrations: { 
                                      ...settings.integrations, 
                                      cloudinary: { 
                                        ...settings.integrations.cloudinary, 
                                        apiSecret: e.target.value 
                                      } 
                                    },
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="border border-gray-200 rounded p-3">
                        <h3 className="text-xs font-semibold text-gray-900 mb-2">Social Login</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-medium text-gray-900">Google</h4>
                              <input
                                type="checkbox"
                                checked={settings.integrations.socialLogin.google.enabled ?? false}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    integrations: { 
                                      ...settings.integrations, 
                                      socialLogin: { 
                                        ...settings.integrations.socialLogin, 
                                        google: { 
                                          ...settings.integrations.socialLogin.google, 
                                          enabled: e.target.checked 
                                        } 
                                      } 
                                    },
                                  })
                                }
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                              />
                            </div>
                            {settings.integrations.socialLogin.google.enabled && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Client ID</label>
                                <input
                                  type="text"
                                  value={settings.integrations.socialLogin.google.clientId ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      integrations: { 
                                        ...settings.integrations, 
                                        socialLogin: { 
                                          ...settings.integrations.socialLogin, 
                                          google: { 
                                            ...settings.integrations.socialLogin.google, 
                                            clientId: e.target.value 
                                          } 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-medium text-gray-900">Facebook</h4>
                              <input
                                type="checkbox"
                                checked={settings.integrations.socialLogin.facebook.enabled ?? false}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    integrations: { 
                                      ...settings.integrations, 
                                      socialLogin: { 
                                        ...settings.integrations.socialLogin, 
                                        facebook: { 
                                          ...settings.integrations.socialLogin.facebook, 
                                          enabled: e.target.checked 
                                        } 
                                      } 
                                    },
                                  })
                                }
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-ring"
                              />
                            </div>
                            {settings.integrations.socialLogin.facebook.enabled && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">App ID</label>
                                <input
                                  type="text"
                                  value={settings.integrations.socialLogin.facebook.appId ?? ""}
                                  onChange={(e) =>
                                    setSettings({
                                      ...settings,
                                      integrations: { 
                                        ...settings.integrations, 
                                        socialLogin: { 
                                          ...settings.integrations.socialLogin, 
                                          facebook: { 
                                            ...settings.integrations.socialLogin.facebook, 
                                            appId: e.target.value 
                                          } 
                                        } 
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-ring focus:border-primary text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

