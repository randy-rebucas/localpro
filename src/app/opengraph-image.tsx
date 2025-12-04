import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';
export const alt = 'LocalPro - Connect. Grow. Succeed.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Dynamic OpenGraph image generator for LocalPro
 * This generates the default OG image at /opengraph-image
 */
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(20, 184, 166, 0.15) 0%, transparent 50%)',
          }}
        />
        
        {/* Grid Pattern Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Logo Container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
              borderRadius: 24,
              marginBottom: 32,
              boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.4)',
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>

          {/* Brand Name */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: 'white',
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            LocalPro
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              background: 'linear-gradient(90deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: 24,
            }}
          >
            Connect. Grow. Succeed.
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 22,
              color: '#94a3b8',
              maxWidth: 700,
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            The #1 Platform for Professional Services in the Philippines
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            gap: 64,
            alignItems: 'center',
          }}
        >
          {[
            { value: '50K+', label: 'Users' },
            { value: '10K+', label: 'Providers' },
            { value: '500+', label: 'Services' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#10b981',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* URL Badge */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: '#10b981',
              fontWeight: 500,
            }}
          >
            localpro.ph
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

