import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
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
    siteName: SITE_CONFIG.name,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

