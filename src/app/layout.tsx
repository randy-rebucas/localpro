import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSettingsProvider } from "@/components/app-settings-provider";
import { ResourceHints } from "@/components/resource-hints";
import { WebVitalsReporter } from "@/components/web-vitals";
import { LiveChatProvider } from "@/components/live-chat";
import { LiveChatWidget } from "@/components/live-chat";
import { GoogleTagManager } from "@next/third-parties/google";
import { CLIENT_CONFIG } from "@/lib/env";
import { SITE_CONFIG, PAGE_METADATA, generateKeywords } from "@/lib/seo-config";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/json-ld";
import { SWRProvider } from "@/providers/swr-provider";
import { PackageSwitcherProvider } from "@/contexts/package-switcher-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// Viewport configuration (separated from metadata in Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: SITE_CONFIG.themeColor },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }, // slate-900
  ],
};

// Comprehensive metadata for SEO
export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: PAGE_METADATA.home.title,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: PAGE_METADATA.home.description,
  keywords: generateKeywords(),
  
  // Application info
  applicationName: SITE_CONFIG.name,
  authors: [{ name: SITE_CONFIG.name, url: SITE_CONFIG.url }],
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  
  // Icons and manifest
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/logo.svg',
    apple: [
      { url: '/logo.svg', sizes: '180x180' },
    ],
  },
  manifest: '/manifest.json',
  
  // Canonical and alternates
  metadataBase: new URL(SITE_CONFIG.url),
  alternates: {
    canonical: '/',
    languages: {
      'en-PH': '/',
    },
  },
  
  // OpenGraph for social sharing
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    alternateLocale: SITE_CONFIG.localeAlternate,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: PAGE_METADATA.home.title,
    description: PAGE_METADATA.home.description,
    images: [
      {
        url: '/og-image.png', // Create this image (1200x630)
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
        type: 'image/png',
      },
      {
        url: '/og-image-square.png', // Create this image (1200x1200)
        width: 1200,
        height: 1200,
        alt: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
        type: 'image/png',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitterHandle,
    creator: SITE_CONFIG.twitterHandle,
    title: PAGE_METADATA.home.title,
    description: PAGE_METADATA.home.description,
    images: ['/og-image.png'],
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification tokens (add your actual tokens)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    // yandex: 'your-yandex-verification',
    // yahoo: 'your-yahoo-verification',
    other: {
      'facebook-domain-verification': process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION || '',
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_WEBSITE_VERIFICATION || '', // Bing Webmaster verification
    },
  },
  
  // App-specific metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_CONFIG.name,
  },
  
  // Format detection
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
  
  // Category
  category: 'business',
  
  // Other useful metadata
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': SITE_CONFIG.themeColor,
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data */}
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for API domain */}
        <link rel="dns-prefetch" href="https://localpro-super-app.onrender.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ResourceHints />
        <WebVitalsReporter />
        <SWRProvider>
          <PackageSwitcherProvider>
            <AppSettingsProvider />
            <LiveChatProvider>
              {children}
              <LiveChatWidget />
            </LiveChatProvider>
          </PackageSwitcherProvider>
        </SWRProvider>
        {CLIENT_CONFIG.googleTagManagerId && (
          <GoogleTagManager gtmId={CLIENT_CONFIG.googleTagManagerId} />
        )}
      </body>
    </html>
  );
}
