import type { Metadata } from 'next';

interface MetadataConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
}

export function generateMetadata(config: MetadataConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = '/og-image.png',
    url = 'https://localpro-super-app.vercel.app',
  } = config;

  const fullTitle = title.includes('LocalPro') ? title : `${title} | LocalPro Super App`;

  return {
    title: fullTitle,
    description,
    keywords: [
      'LocalPro',
      'professional services',
      'marketplace',
      'supplies',
      'academy',
      'rentals',
      'finance',
      ...keywords,
    ],
    authors: [{ name: 'LocalPro Team' }],
    creator: 'LocalPro',
    publisher: 'LocalPro',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: 'LocalPro Super App',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@localpro',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION_ID,
    },
  };
}

// Predefined metadata for common pages
export const pageMetadata = {
  home: generateMetadata({
    title: 'LocalPro Super App',
    description: 'Your all-in-one platform for professional services, supplies, education, and more. Connect with local professionals and grow your business.',
    keywords: ['professional services', 'local business', 'marketplace', 'supplies', 'education'],
  }),
  
  dashboard: generateMetadata({
    title: 'Dashboard',
    description: 'Access your LocalPro dashboard to manage services, view analytics, and connect with professionals.',
    keywords: ['dashboard', 'analytics', 'services', 'management'],
  }),
  
  auth: generateMetadata({
    title: 'Sign In',
    description: 'Sign in to your LocalPro account to access professional services and manage your business.',
    keywords: ['sign in', 'login', 'authentication', 'account'],
  }),
  
  profile: generateMetadata({
    title: 'Profile',
    description: 'Manage your LocalPro profile, update information, and showcase your professional services.',
    keywords: ['profile', 'account', 'settings', 'professional'],
  }),
  
  marketplace: generateMetadata({
    title: 'Marketplace',
    description: 'Discover and book professional services in your area. From cleaning to plumbing, find trusted professionals.',
    keywords: ['marketplace', 'services', 'booking', 'professionals', 'cleaning', 'plumbing'],
  }),
  
  academy: generateMetadata({
    title: 'Academy',
    description: 'Learn new skills and advance your career with our comprehensive courses and certifications.',
    keywords: ['academy', 'courses', 'education', 'certification', 'learning'],
  }),
  
  supplies: generateMetadata({
    title: 'Supplies & Materials',
    description: 'Find and order professional supplies and equipment from verified suppliers.',
    keywords: ['supplies', 'materials', 'equipment', 'tools', 'ordering'],
  }),
  
  rentals: generateMetadata({
    title: 'Rentals',
    description: 'Rent professional equipment and vehicles for your projects and business needs.',
    keywords: ['rentals', 'equipment', 'vehicles', 'tools', 'rent'],
  }),
  
  finance: generateMetadata({
    title: 'Finance',
    description: 'Manage your finances with salary advances, micro-loans, and financial services.',
    keywords: ['finance', 'loans', 'salary advance', 'financial services', 'money'],
  }),
};
