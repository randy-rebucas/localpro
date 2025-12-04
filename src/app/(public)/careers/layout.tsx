import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
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
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_METADATA.careers.title,
    description: PAGE_METADATA.careers.description,
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

