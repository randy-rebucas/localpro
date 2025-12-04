import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
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
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_METADATA.partners.title,
    description: PAGE_METADATA.partners.description,
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

