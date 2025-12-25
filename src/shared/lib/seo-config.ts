/**
 * SEO Configuration for LocalPro
 * Centralized SEO constants and metadata helpers
 */

export const SITE_CONFIG = {
  name: 'LocalPro',
  tagline: 'Connect. Grow. Succeed.',
  description: 'The #1 platform for professional services in the Philippines. Connect with verified service providers, buy supplies, rent equipment, and grow your business.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.localpro.asia',
  locale: 'en_PH',
  localeAlternate: 'fil_PH',
  themeColor: '#10b981', // emerald-500
  twitterHandle: '@localproasia',
  facebookPage: 'https://www.facebook.com/localproasia',
  linkedInPage: 'https://www.linkedin.com/company/localproasia/',
  foundingDate: '2025',
  location: {
    city: 'Ormoc City',
    region: 'Eastern Visayas',
    country: 'Philippines',
    countryCode: 'PH',
  },
  contact: {
    email: 'admin@localpro.asia',
    phone: '+63 917 915 7515', // Update with real phone
  },
  logo: {
    url: '/logo.svg',
    width: 512,
    height: 512,
  },
} as const;

export const SEO_KEYWORDS = {
  primary: [
    'LocalPro',
    'professional services Philippines',
    'service marketplace',
    'hire professionals',
    'local services',
    'verified service providers',
  ],
  services: [
    'cleaning services',
    'plumbing services',
    'electrical services',
    'construction services',
    'maintenance services',
    'facility care',
    'janitorial services',
  ],
  marketplace: [
    'buy supplies Philippines',
    'rent equipment',
    'service providers',
    'job board Philippines',
    'freelance work',
  ],
  location: [
    'Ormoc City',
    'Eastern Visayas',
    'Leyte',
    'Philippines',
  ],
} as const;

// Generate keywords string for meta tags
export function generateKeywords(additionalKeywords: string[] = []): string {
  const allKeywords = [
    ...SEO_KEYWORDS.primary,
    ...SEO_KEYWORDS.services.slice(0, 5),
    ...SEO_KEYWORDS.location.slice(0, 2),
    ...additionalKeywords,
  ];
  return [...new Set(allKeywords)].join(', ');
}

// Page-specific metadata configurations
export const PAGE_METADATA = {
  home: {
    title: 'LocalPro - The #1 Platform for Professional Services in the Philippines',
    description: 'Connect with 10,000+ verified service providers. Book cleaning, plumbing, electrical, and 500+ other services. Grow your business with LocalPro.',
    keywords: generateKeywords(['home services', 'book services online']),
  },
  about: {
    title: 'About LocalPro - Our Mission & Story',
    description: 'Learn about LocalPro\'s mission to empower professionals in the Philippines through innovative technology. Founded in Ormoc City, partnering with LGU-Ormoc.',
    keywords: generateKeywords(['about LocalPro', 'company mission', 'Ormoc City startup']),
  },
  marketplace: {
    title: 'Service Marketplace - Find Verified Professionals | LocalPro',
    description: 'Browse 500+ service categories from verified professionals. Compare prices, read reviews, and book instantly. Satisfaction guaranteed.',
    keywords: generateKeywords(['hire professionals', 'service marketplace', 'book services']),
  },
  supplies: {
    title: 'Supplies Marketplace - Buy Equipment & Materials | LocalPro',
    description: 'Shop for business supplies, equipment, and materials from trusted sellers. Fast delivery across the Philippines.',
    keywords: generateKeywords(['buy supplies', 'business equipment', 'materials marketplace']),
  },
  rentals: {
    title: 'Equipment Rentals - Rent Tools & Spaces | LocalPro',
    description: 'Rent equipment, tools, spaces, and machinery for your projects. Flexible terms, verified suppliers, instant booking.',
    keywords: generateKeywords(['rent equipment', 'tool rental', 'space rental']),
  },
  academy: {
    title: 'LocalPro Academy - Professional Training & Courses',
    description: 'Learn new skills with industry-expert courses. Get certified, enhance your profile, and earn more as a service provider.',
    keywords: generateKeywords(['online courses', 'professional training', 'skills development']),
  },
  jobs: {
    title: 'Job Board - Find Work or Hire Talent | LocalPro',
    description: 'Browse job opportunities or post jobs to find skilled professionals. Connect with local talent across the Philippines.',
    keywords: generateKeywords(['jobs Philippines', 'hire workers', 'find work']),
  },
  blog: {
    title: 'Blog - Tips, News & Insights | LocalPro',
    description: 'Stay updated with the latest tips for service providers, industry news, and business growth strategies from LocalPro.',
    keywords: generateKeywords(['business tips', 'service provider blog', 'industry news']),
  },
  careers: {
    title: 'Careers at LocalPro - Join Our Team',
    description: 'Join LocalPro and help build the future of professional services. Explore open positions and grow your career with us.',
    keywords: generateKeywords(['LocalPro careers', 'job openings', 'work at LocalPro']),
  },
  partners: {
    title: 'Partner Program - Grow Together | LocalPro',
    description: 'Partner with LocalPro to expand your business. Special programs for hotels, agencies, developers, and enterprise clients.',
    keywords: generateKeywords(['business partnership', 'enterprise solutions', 'partner program']),
  },
  contact: {
    title: 'Contact Us - Get in Touch | LocalPro',
    description: 'Have questions? Contact the LocalPro team. We\'re here to help you succeed with our platform.',
    keywords: generateKeywords(['contact LocalPro', 'customer support', 'help']),
  },
  support: {
    title: 'Support Center - Help & FAQs | LocalPro',
    description: 'Find answers to common questions, troubleshooting guides, and get support for using LocalPro platform.',
    keywords: generateKeywords(['help center', 'FAQs', 'customer support']),
  },
  privacy: {
    title: 'Privacy Policy | LocalPro',
    description: 'Learn how LocalPro collects, uses, and protects your personal information. Your privacy matters to us.',
    keywords: generateKeywords(['privacy policy', 'data protection']),
  },
  terms: {
    title: 'Terms of Service | LocalPro',
    description: 'Read LocalPro\'s terms and conditions for using our platform and services.',
    keywords: generateKeywords(['terms of service', 'user agreement']),
  },
  security: {
    title: 'Security - How We Protect You | LocalPro',
    description: 'Learn about LocalPro\'s security measures to protect your data and transactions.',
    keywords: generateKeywords(['security', 'data protection', 'safe transactions']),
  },
  community: {
    title: 'Community - Connect with Professionals | LocalPro',
    description: 'Join the LocalPro community. Connect with fellow professionals, share experiences, and grow together.',
    keywords: generateKeywords(['community', 'networking', 'professional community']),
  },
  auth: {
    title: 'Sign In or Create Account | LocalPro',
    description: 'Sign in to your LocalPro account or create a new one to start connecting with professionals and growing your business.',
    keywords: generateKeywords(['sign in', 'create account', 'register']),
  },
  helpCenter: {
    title: 'Help Center - FAQs & Guides | LocalPro',
    description: 'Find answers to common questions, step-by-step guides, and helpful resources for using LocalPro platform.',
    keywords: generateKeywords(['help center', 'FAQs', 'user guides', 'how to']),
  },
} as const;

// Helper to get full URL
export function getCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${cleanPath}`;
}

// Helper to generate page title
export function generateTitle(pageTitle?: string): string {
  if (!pageTitle) return PAGE_METADATA.home.title;
  return `${pageTitle} | ${SITE_CONFIG.name}`;
}

