import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Sign In or Create Account',
  description: PAGE_METADATA.auth.description,
  keywords: PAGE_METADATA.auth.keywords,
  alternates: {
    canonical: getCanonicalUrl('/auth'),
  },
  openGraph: {
    title: PAGE_METADATA.auth.title,
    description: PAGE_METADATA.auth.description,
    url: getCanonicalUrl('/auth'),
    type: 'website',
    siteName: SITE_CONFIG.name,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

