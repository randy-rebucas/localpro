import { Metadata } from 'next';
import { PAGE_METADATA, getCanonicalUrl, SITE_CONFIG } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Blog',
  description: PAGE_METADATA.blog.description,
  keywords: PAGE_METADATA.blog.keywords,
  alternates: {
    canonical: getCanonicalUrl('/blog'),
  },
  openGraph: {
    title: PAGE_METADATA.blog.title,
    description: PAGE_METADATA.blog.description,
    url: getCanonicalUrl('/blog'),
    type: 'website',
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_METADATA.blog.title,
    description: PAGE_METADATA.blog.description,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

