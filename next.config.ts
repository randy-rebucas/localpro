import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /**
   * IMPORTANT (Windows/dev reliability):
   * `next dev` and `next build` both write to `distDir`. If you run `pnpm build`
   * while a dev server is running, the `.next` folder can get overwritten and
   * the browser will request chunks that no longer exist (ChunkLoadError).
   *
   * Using a separate distDir in development prevents that class of issues.
   */
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      '@radix-ui/react-slot',
      'recharts', // Optimize recharts imports (only load used components)
    ],
  },
  
  // Compress output
  compress: true,
  
  // Production source maps (disable for smaller bundles, enable for debugging)
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localpro-super-app.onrender.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Security headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Build connect-src with conditional localhost for development
    const connectSrc = [
      "'self'",
      "https://*.onrender.com",
      "https://*.vercel-analytics.com",
      "https://va.vercel-scripts.com",
      "https://*.sentry.io",
      "https://maps.googleapis.com",
      "https://*.googleapis.com",
      "https://maps.gstatic.com",
      "https://www.googletagmanager.com",
      "https://*.googletagmanager.com",
      ...(isDevelopment ? ["http://localhost:5000", "ws://localhost:5000"] : []),
    ].join(' ');

    // Build CSP directives
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel-analytics.com https://va.vercel-scripts.com https://maps.googleapis.com https://*.googleapis.com https://www.googletagmanager.com https://*.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob: https://maps.googleapis.com https://maps.gstatic.com https://*.gstatic.com",
      `connect-src ${connectSrc}`,
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      // Only add upgrade-insecure-requests in production to allow localhost in dev
      ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
    ];

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
        ],
      },
    ];
  },
  
  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  /**
   * Webpack config tweak:
   * In `next dev`, disable the filesystem "pack" cache serialization that can emit warnings like:
   *   [webpack.cache.PackFileCacheStrategy] Serializing big strings ...
   * We use an in-memory cache in development to avoid those warnings.
   */
  webpack: (config) => {
    // Avoid webpack's filesystem "pack" cache serialization warnings about large strings.
    // Memory cache is sufficient for both dev and CI/build environments.
    config.cache = { type: "memory" };
    return config;
  },
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, configFile, stripPrefix, urlPrefix, include, ignore

  org: "localpro",
  project: "localpro-super-app",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
