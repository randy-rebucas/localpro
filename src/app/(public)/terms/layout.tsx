import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
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
    siteName: SITE_CONFIG.name,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

