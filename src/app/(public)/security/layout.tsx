import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
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
    siteName: SITE_CONFIG.name,
  },
};

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

