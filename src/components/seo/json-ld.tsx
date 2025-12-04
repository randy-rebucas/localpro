import { SITE_CONFIG, getCanonicalUrl } from '@/lib/seo-config';

/**
 * JSON-LD Structured Data Components for LocalPro
 * These help search engines understand your content better and can enable rich snippets
 */

// Organization Schema
export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: getCanonicalUrl('/logo.svg'),
      width: SITE_CONFIG.logo.width,
      height: SITE_CONFIG.logo.height,
    },
    description: SITE_CONFIG.description,
    foundingDate: SITE_CONFIG.foundingDate,
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE_CONFIG.location.city,
      addressRegion: SITE_CONFIG.location.region,
      addressCountry: SITE_CONFIG.location.countryCode,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SITE_CONFIG.contact.phone,
        contactType: 'customer service',
        email: SITE_CONFIG.contact.email,
        availableLanguage: ['English', 'Filipino'],
      },
    ],
    sameAs: [
      SITE_CONFIG.facebookPage,
      SITE_CONFIG.linkedInPage,
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Website Schema with SearchAction
export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_CONFIG.url}/#website`,
    url: SITE_CONFIG.url,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    publisher: {
      '@id': `${SITE_CONFIG.url}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-PH',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Service Provider / Local Business Schema
interface LocalBusinessJsonLdProps {
  name: string;
  description: string;
  image?: string;
  address?: {
    street?: string;
    city: string;
    region: string;
    postalCode?: string;
    country: string;
  };
  rating?: {
    value: number;
    count: number;
  };
  priceRange?: string;
  serviceType?: string[];
  url: string;
}

export function LocalBusinessJsonLd({
  name,
  description,
  image,
  address,
  rating,
  priceRange,
  serviceType,
  url,
}: LocalBusinessJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    description,
    image: image || getCanonicalUrl('/logo.svg'),
    url,
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: address.street,
        addressLocality: address.city,
        addressRegion: address.region,
        postalCode: address.postalCode,
        addressCountry: address.country,
      },
    }),
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.value,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(priceRange && { priceRange }),
    ...(serviceType && { serviceType }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Service Schema (for individual services)
interface ServiceJsonLdProps {
  name: string;
  description: string;
  provider: string;
  providerUrl: string;
  serviceType: string;
  areaServed?: string;
  price?: {
    value: number;
    currency: string;
    unit?: string; // e.g., "hour", "job"
  };
  rating?: {
    value: number;
    count: number;
  };
  image?: string;
  url: string;
}

export function ServiceJsonLd({
  name,
  description,
  provider,
  providerUrl,
  serviceType,
  areaServed,
  price,
  rating,
  image,
  url,
}: ServiceJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'LocalBusiness',
      name: provider,
      url: providerUrl,
    },
    serviceType,
    ...(areaServed && { areaServed }),
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price.value,
        priceCurrency: price.currency,
        ...(price.unit && { unitText: price.unit }),
      },
    }),
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.value,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(image && { image }),
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Product Schema (for supplies marketplace)
interface ProductJsonLdProps {
  name: string;
  description: string;
  image: string;
  sku?: string;
  brand?: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: {
    value: number;
    count: number;
  };
  url: string;
}

export function ProductJsonLd({
  name,
  description,
  image,
  sku,
  brand,
  price,
  currency = 'PHP',
  availability = 'InStock',
  rating,
  url,
}: ProductJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    ...(sku && { sku }),
    ...(brand && {
      brand: {
        '@type': 'Brand',
        name: brand,
      },
    }),
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url,
    },
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.value,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Job Posting Schema
interface JobPostingJsonLdProps {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'TEMPORARY';
  hiringOrganization: {
    name: string;
    logo?: string;
    url?: string;
  };
  location?: {
    city: string;
    region: string;
    country: string;
  };
  salary?: {
    min: number;
    max: number;
    currency: string;
    unit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  };
  remote?: boolean;
  url: string;
}

export function JobPostingJsonLd({
  title,
  description,
  datePosted,
  validThrough,
  employmentType = 'FULL_TIME',
  hiringOrganization,
  location,
  salary,
  remote,
  url,
}: JobPostingJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    datePosted,
    ...(validThrough && { validThrough }),
    employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: hiringOrganization.name,
      ...(hiringOrganization.logo && { logo: hiringOrganization.logo }),
      ...(hiringOrganization.url && { sameAs: hiringOrganization.url }),
    },
    ...(location && {
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: location.city,
          addressRegion: location.region,
          addressCountry: location.country,
        },
      },
    }),
    ...(salary && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: salary.currency,
        value: {
          '@type': 'QuantitativeValue',
          minValue: salary.min,
          maxValue: salary.max,
          unitText: salary.unit,
        },
      },
    }),
    ...(remote && {
      jobLocationType: 'TELECOMMUTE',
    }),
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Course Schema (for Academy)
interface CourseJsonLdProps {
  name: string;
  description: string;
  provider: string;
  providerUrl?: string;
  instructor?: string;
  duration?: string; // ISO 8601 duration, e.g., "PT2H" for 2 hours
  price?: {
    value: number;
    currency: string;
  };
  rating?: {
    value: number;
    count: number;
  };
  image?: string;
  url: string;
}

export function CourseJsonLd({
  name,
  description,
  provider,
  providerUrl,
  instructor,
  duration,
  price,
  rating,
  image,
  url,
}: CourseJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
      ...(providerUrl && { sameAs: providerUrl }),
    },
    ...(instructor && {
      instructor: {
        '@type': 'Person',
        name: instructor,
      },
    }),
    ...(duration && { timeRequired: duration }),
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price.value,
        priceCurrency: price.currency,
      },
    }),
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.value,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(image && { image }),
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// FAQ Schema (for support/help pages)
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQJsonLdProps {
  items: FAQItem[];
}

export function FAQJsonLd({ items }: FAQJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Breadcrumb Schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Article/Blog Schema
interface ArticleJsonLdProps {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  image: string;
  url: string;
}

export function ArticleJsonLd({
  title,
  description,
  datePublished,
  dateModified,
  author,
  image,
  url,
}: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
    },
    image,
    url,
    publisher: {
      '@id': `${SITE_CONFIG.url}/#organization`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

