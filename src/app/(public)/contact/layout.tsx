import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: PAGE_METADATA.contact.description,
  keywords: PAGE_METADATA.contact.keywords,
  alternates: {
    canonical: getCanonicalUrl('/contact'),
  },
  openGraph: {
    title: PAGE_METADATA.contact.title,
    description: PAGE_METADATA.contact.description,
    url: getCanonicalUrl('/contact'),
    type: 'website',
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_METADATA.contact.title,
    description: PAGE_METADATA.contact.description,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

