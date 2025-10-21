export type Visibility = "public" | "private" | "connections";

export interface UserSettings {
  privacy: {
    profileVisibility: Visibility;
    showPhoneNumber: boolean;
    showEmail: boolean;
    showLocation: boolean;
    showRating: boolean;
    showPortfolio: boolean;
    allowDirectMessages: boolean;
    allowJobInvitations: boolean;
    allowReferralRequests: boolean;
  };
  notifications: {
    push: {
      enabled: boolean;
      newMessages: boolean;
      jobMatches: boolean;
      bookingUpdates: boolean;
      paymentUpdates: boolean;
      referralUpdates: boolean;
      systemUpdates: boolean;
      marketing: boolean;
    };
    email: {
      enabled: boolean;
      newMessages: boolean;
      jobMatches: boolean;
      bookingUpdates: boolean;
      paymentUpdates: boolean;
      referralUpdates: boolean;
      systemUpdates: boolean;
      marketing: boolean;
      weeklyDigest: boolean;
      monthlyReport: boolean;
    };
    sms: {
      enabled: boolean;
      urgentMessages: boolean;
      bookingReminders: boolean;
      paymentAlerts: boolean;
      securityAlerts: boolean;
    };
  };
  communication: {
    preferredLanguage: string;
    timezone: string;
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
    timeFormat: "12h" | "24h";
    currency: string;
    autoReply: {
      enabled: boolean;
      message: string;
    };
  };
  service: {
    defaultServiceRadius: number;
    autoAcceptJobs: boolean;
    minimumJobValue: number;
    maximumJobValue: number;
    preferredJobTypes: string[];
    workingHours: {
      start: string; // HH:mm
      end: string;   // HH:mm
      days: Array<
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      >;
    };
    emergencyService: {
      enabled: boolean;
      surcharge: number;
    };
  };
  payment: {
    preferredPaymentMethod: "paypal" | "paymaya" | "gcash" | "bank" | "cash";
    autoWithdraw: {
      enabled: boolean;
      threshold: number;
      frequency: "daily" | "weekly" | "monthly";
    };
    invoiceSettings: {
      includeTax: boolean;
      taxRate: number;
      invoiceTemplate: string;
    };
  };
  security: {
    twoFactorAuth: {
      enabled: boolean;
      method: "sms" | "email" | "authenticator";
    };
    loginAlerts: {
      enabled: boolean;
      newDevice: boolean;
      suspiciousActivity: boolean;
    };
    sessionTimeout: number; // hours
    passwordChangeReminder: {
      enabled: boolean;
      frequency: number; // days
    };
  };
  app: {
    theme: "light" | "dark" | "auto";
    fontSize: "small" | "medium" | "large";
    soundEffects: {
      enabled: boolean;
      volume: number; // 0-100
    };
    hapticFeedback: {
      enabled: boolean;
    };
    autoSave: {
      enabled: boolean;
      interval: number; // seconds
    };
    dataUsage: {
      imageQuality: "low" | "medium" | "high";
      videoQuality: "low" | "medium" | "high";
      autoDownload: boolean;
    };
  };
  analytics: {
    shareUsageData: boolean;
    shareLocationData: boolean;
    sharePerformanceData: boolean;
    personalizedRecommendations: boolean;
  };
}

export const defaultUserSettings: UserSettings = {
  privacy: {
    profileVisibility: "public",
    showPhoneNumber: false,
    showEmail: false,
    showLocation: true,
    showRating: true,
    showPortfolio: true,
    allowDirectMessages: true,
    allowJobInvitations: true,
    allowReferralRequests: true,
  },
  notifications: {
    push: {
      enabled: true,
      newMessages: true,
      jobMatches: true,
      bookingUpdates: true,
      paymentUpdates: true,
      referralUpdates: true,
      systemUpdates: true,
      marketing: false,
    },
    email: {
      enabled: true,
      newMessages: true,
      jobMatches: true,
      bookingUpdates: true,
      paymentUpdates: true,
      referralUpdates: true,
      systemUpdates: true,
      marketing: false,
      weeklyDigest: true,
      monthlyReport: true,
    },
    sms: {
      enabled: true,
      urgentMessages: true,
      bookingReminders: true,
      paymentAlerts: true,
      securityAlerts: true,
    },
  },
  communication: {
    preferredLanguage: "en",
    timezone: "Asia/Manila",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    currency: "PHP",
    autoReply: {
      enabled: false,
      message: "Thank you for your message. I will get back to you soon.",
    },
  },
  service: {
    defaultServiceRadius: 25,
    autoAcceptJobs: false,
    minimumJobValue: 0,
    maximumJobValue: 100000,
    preferredJobTypes: [],
    workingHours: {
      start: "08:00",
      end: "17:00",
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
    emergencyService: {
      enabled: false,
      surcharge: 0,
    },
  },
  payment: {
    preferredPaymentMethod: "paypal",
    autoWithdraw: {
      enabled: false,
      threshold: 1000,
      frequency: "weekly",
    },
    invoiceSettings: {
      includeTax: true,
      taxRate: 12,
      invoiceTemplate: "standard",
    },
  },
  security: {
    twoFactorAuth: {
      enabled: false,
      method: "sms",
    },
    loginAlerts: {
      enabled: true,
      newDevice: true,
      suspiciousActivity: true,
    },
    sessionTimeout: 24,
    passwordChangeReminder: {
      enabled: true,
      frequency: 90,
    },
  },
  app: {
    theme: "auto",
    fontSize: "medium",
    soundEffects: {
      enabled: true,
      volume: 50,
    },
    hapticFeedback: {
      enabled: true,
    },
    autoSave: {
      enabled: true,
      interval: 30,
    },
    dataUsage: {
      imageQuality: "medium",
      videoQuality: "medium",
      autoDownload: false,
    },
  },
  analytics: {
    shareUsageData: true,
    shareLocationData: true,
    sharePerformanceData: true,
    personalizedRecommendations: true,
  },
};


