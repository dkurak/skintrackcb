import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Backcountry Crews - Find Your Backcountry Partners';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo - Stacked Peaks */}
        <svg
          width="200"
          height="100"
          viewBox="0 0 128 64"
          fill="none"
        >
          <path
            d="M8 48L24 16L40 48"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M40 48L56 24L72 48"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
          <path
            d="M72 48L84 32L96 48"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            marginTop: 40,
            letterSpacing: '-0.02em',
          }}
        >
          Backcountry Crews
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 20,
          }}
        >
          Find your crew for backcountry adventures
        </div>

        {/* Location */}
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>📍</span>
          <span>Crested Butte, Colorado</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
