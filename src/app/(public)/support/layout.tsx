import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
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
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_METADATA.support.title,
    description: PAGE_METADATA.support.description,
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

