import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo-config';

/**
 * Generate robots.txt for LocalPro
 * This file automatically generates /robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.url;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/blog',
          '/careers',
          '/community',
          '/partners',
          '/support',
          '/contact',
          '/help-center',
          '/privacy',
          '/terms',
          '/security',
          '/auth',
          '/marketplace',
          '/supplies',
          '/rentals',
          '/academy',
          '/jobs',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/settings/',
          '/wallet/',
          '/messages/',
          '/notifications/',
          '/onboarding/',
          '/checkout/',
          '/cart/',
          '/favorites/',
          '/finance/',
          '/_next/',
          '/private/',
        ],
      },
      // Block AI training bots (optional - you can remove if you want AI indexing)
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

