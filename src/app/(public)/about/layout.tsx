import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
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
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_METADATA.about.title,
    description: PAGE_METADATA.about.description,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

