import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Help Center',
  description: PAGE_METADATA.helpCenter.description,
  keywords: PAGE_METADATA.helpCenter.keywords,
  alternates: {
    canonical: getCanonicalUrl('/help-center'),
  },
  openGraph: {
    title: PAGE_METADATA.helpCenter.title,
    description: PAGE_METADATA.helpCenter.description,
    url: getCanonicalUrl('/help-center'),
    type: 'website',
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_METADATA.helpCenter.title,
    description: PAGE_METADATA.helpCenter.description,
  },
};

export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

