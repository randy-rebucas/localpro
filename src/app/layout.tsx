import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSettingsProvider } from "@/components/app-settings-provider";
import { ResourceHints } from "@/components/resource-hints";
import { WebVitalsReporter } from "@/components/web-vitals";
import { GoogleTagManager } from "@next/third-parties/google";
import { CLIENT_CONFIG } from "@/lib/env";

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

export const metadata: Metadata = {
  title: "LocalPro Super App",
  description: "Your all-in-one platform for professional services, supplies, education, and more",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ResourceHints />
        <WebVitalsReporter />
        <AppSettingsProvider />
        {children}
        {CLIENT_CONFIG.googleTagManagerId && (
          <GoogleTagManager gtmId={CLIENT_CONFIG.googleTagManagerId} />
        )}
      </body>
    </html>
  );
}
