import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl } from '@/lib/seo-config';

/**
 * Generate metadata for public pages
 * Since public pages use "use client", we export metadata from layout instead
 */

// Home page metadata
export const homeMetadata: Metadata = {
  title: PAGE_METADATA.home.title,
  description: PAGE_METADATA.home.description,
  keywords: PAGE_METADATA.home.keywords,
  alternates: {
    canonical: getCanonicalUrl('/'),
  },
  openGraph: {
    title: PAGE_METADATA.home.title,
    description: PAGE_METADATA.home.description,
    url: getCanonicalUrl('/'),
    type: 'website',
  },
  twitter: {
    title: PAGE_METADATA.home.title,
    description: PAGE_METADATA.home.description,
  },
};

// About page metadata
export const aboutMetadata: Metadata = {
  title: 'About Us',
  description: PAGE_METADATA.about.description,
  keywords: PAGE_METADATA.about.keywords,
  alternates: {
    canonical: getCanonicalUrl('/about'),
  },
  openGraph: {
    title: PAGE_METADATA.about.title,
    description: PAGE_METADATA.about.description,
    url: getCanonicalUrl('/about'),
    type: 'website',
  },
};

// Blog page metadata
export const blogMetadata: Metadata = {
  title: 'Blog',
  description: PAGE_METADATA.blog.description,
  keywords: PAGE_METADATA.blog.keywords,
  alternates: {
    canonical: getCanonicalUrl('/blog'),
  },
  openGraph: {
    title: PAGE_METADATA.blog.title,
    description: PAGE_METADATA.blog.description,
    url: getCanonicalUrl('/blog'),
    type: 'website',
  },
};

// Careers page metadata
export const careersMetadata: Metadata = {
  title: 'Careers',
  description: PAGE_METADATA.careers.description,
  keywords: PAGE_METADATA.careers.keywords,
  alternates: {
    canonical: getCanonicalUrl('/careers'),
  },
  openGraph: {
    title: PAGE_METADATA.careers.title,
    description: PAGE_METADATA.careers.description,
    url: getCanonicalUrl('/careers'),
    type: 'website',
  },
};

// Partners page metadata
export const partnersMetadata: Metadata = {
  title: 'Partner Program',
  description: PAGE_METADATA.partners.description,
  keywords: PAGE_METADATA.partners.keywords,
  alternates: {
    canonical: getCanonicalUrl('/partners'),
  },
  openGraph: {
    title: PAGE_METADATA.partners.title,
    description: PAGE_METADATA.partners.description,
    url: getCanonicalUrl('/partners'),
    type: 'website',
  },
};

// Contact page metadata
export const contactMetadata: Metadata = {
  title: 'Contact Us',
  description: PAGE_METADATA.contact.description,
  keywords: PAGE_METADATA.contact.keywords,
  alternates: {
    canonical: getCanonicalUrl('/contact'),
  },
  openGraph: {
    title: PAGE_METADATA.contact.title,
    description: PAGE_METADATA.contact.description,
    url: getCanonicalUrl('/contact'),
    type: 'website',
  },
};

// Support page metadata
export const supportMetadata: Metadata = {
  title: 'Support Center',
  description: PAGE_METADATA.support.description,
  keywords: PAGE_METADATA.support.keywords,
  alternates: {
    canonical: getCanonicalUrl('/support'),
  },
  openGraph: {
    title: PAGE_METADATA.support.title,
    description: PAGE_METADATA.support.description,
    url: getCanonicalUrl('/support'),
    type: 'website',
  },
};

// Community page metadata
export const communityMetadata: Metadata = {
  title: 'Community',
  description: PAGE_METADATA.community.description,
  keywords: PAGE_METADATA.community.keywords,
  alternates: {
    canonical: getCanonicalUrl('/community'),
  },
  openGraph: {
    title: PAGE_METADATA.community.title,
    description: PAGE_METADATA.community.description,
    url: getCanonicalUrl('/community'),
    type: 'website',
  },
};

// Privacy page metadata
export const privacyMetadata: Metadata = {
  title: 'Privacy Policy',
  description: PAGE_METADATA.privacy.description,
  keywords: PAGE_METADATA.privacy.keywords,
  alternates: {
    canonical: getCanonicalUrl('/privacy'),
  },
  openGraph: {
    title: PAGE_METADATA.privacy.title,
    description: PAGE_METADATA.privacy.description,
    url: getCanonicalUrl('/privacy'),
    type: 'website',
  },
};

// Terms page metadata
export const termsMetadata: Metadata = {
  title: 'Terms of Service',
  description: PAGE_METADATA.terms.description,
  keywords: PAGE_METADATA.terms.keywords,
  alternates: {
    canonical: getCanonicalUrl('/terms'),
  },
  openGraph: {
    title: PAGE_METADATA.terms.title,
    description: PAGE_METADATA.terms.description,
    url: getCanonicalUrl('/terms'),
    type: 'website',
  },
};

// Security page metadata
export const securityMetadata: Metadata = {
  title: 'Security',
  description: PAGE_METADATA.security.description,
  keywords: PAGE_METADATA.security.keywords,
  alternates: {
    canonical: getCanonicalUrl('/security'),
  },
  openGraph: {
    title: PAGE_METADATA.security.title,
    description: PAGE_METADATA.security.description,
    url: getCanonicalUrl('/security'),
    type: 'website',
  },
};

// Auth page metadata
export const authMetadata: Metadata = {
  title: 'Sign In',
  description: PAGE_METADATA.auth.description,
  keywords: PAGE_METADATA.auth.keywords,
  alternates: {
    canonical: getCanonicalUrl('/auth'),
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Helper function to generate dynamic page metadata
export function generatePageMetadata(
  page: keyof typeof PAGE_METADATA,
  overrides?: Partial<Metadata>
): Metadata {
  const pageConfig = PAGE_METADATA[page];
  const path = page === 'home' ? '/' : `/${page}`;
  
  return {
    title: pageConfig.title.split(' | ')[0], // Remove site name suffix
    description: pageConfig.description,
    keywords: pageConfig.keywords,
    alternates: {
      canonical: getCanonicalUrl(path),
    },
    openGraph: {
      title: pageConfig.title,
      description: pageConfig.description,
      url: getCanonicalUrl(path),
      type: 'website',
    },
    twitter: {
      title: pageConfig.title,
      description: pageConfig.description,
    },
    ...overrides,
  };
}

