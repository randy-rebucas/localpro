import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
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
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_METADATA.community.title,
    description: PAGE_METADATA.community.description,
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

