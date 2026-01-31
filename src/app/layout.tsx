import type { Metadata, Viewport } from "next";
import { Shield } from "lucide-react";
import { RegistrationForm } from "@/components/registration-form";
// Set this flag to true to enable maintenance mode globally
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
import { RoleViewProvider } from "@/contexts/role-view-context";

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

const isMaintenanceMode = process.env.MAINTENANCE_MODE && process.env.MAINTENANCE_MODE !== 'false';

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
          {/* AppSettingsProvider: Makes app settings available throughout the entire app
              - Available in all routes: authenticated, public, admin, auth
              - Use via: useAppSettingsContext() or useAppSettings()
              - Fetches settings once and shares across all components
              - Manages global app settings (features, business info, etc.)
              - Also renders MaintenanceMode and ForceUpdate components
              - Should be early in the hierarchy as other providers may need feature flags */}
          <AppSettingsProvider>
            {/* PackageSwitcherProvider: Makes activePackage (feature switcher) available throughout the entire app
                - Available in all routes: authenticated, public, admin, auth
                - Use via: usePackageSwitcher() or usePreferredFeature()
                - Handles storage, sync, and cross-tab updates automatically
                - Manages user's preferred feature/package selection */}
            <PackageSwitcherProvider>
              {/* RoleViewProvider: Makes roleView available throughout the entire app
                  - Available in all routes: authenticated, public, admin, auth
                  - Use via: useRoleView({ userRoles }) or useActiveRoleView()
                  - Handles storage, sync, and cross-tab updates automatically
                  - Manages user's active role view (client, provider, etc.) */}
              <RoleViewProvider>
                <LiveChatProvider>
                  {/* Maintenance overlay at root, above main content but below nav/header */}
                  {isMaintenanceMode && (
                    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950/95 backdrop-blur-xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-2xl" />
                      <div className="relative z-10 max-w-lg w-full mx-auto p-8 rounded-2xl bg-slate-900/90 border border-emerald-700/30 shadow-2xl flex flex-col items-center">
                        <Shield className="w-14 h-14 text-emerald-400 mb-4" />
                        <h1 className="text-3xl font-bold text-white mb-2 text-center">Scheduled Maintenance</h1>
                        <p className="text-slate-300 mb-6 text-center">
                          {isMaintenanceMode} LocalPro is currently undergoing scheduled maintenance to bring you new features and improvements.<br />
                          <span className="text-emerald-400 font-semibold">User registration for Service Providers and Clients is still open!</span>
                        </p>
                        <RegistrationForm />
                        <div className="mt-8 text-slate-400 text-xs text-center">
                          Thank you for your patience. We&apos;ll be back soon!<br />
                        </div>
                      </div>
                    </div>
                  )}
                  {children}
                  <LiveChatWidget />
                </LiveChatProvider>
              </RoleViewProvider>
            </PackageSwitcherProvider>
          </AppSettingsProvider>
        </SWRProvider>
        {CLIENT_CONFIG.googleTagManagerId && (
          <GoogleTagManager gtmId={CLIENT_CONFIG.googleTagManagerId} />
        )}
      </body>
    </html>
  );
}
