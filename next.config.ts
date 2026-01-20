import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirect old /partners URLs to /trips
  async redirects() {
    return [
      {
        source: '/partners',
        destination: '/trips',
        permanent: true,
      },
      {
        source: '/partners/new',
        destination: '/trips/new',
        permanent: true,
      },
      {
        source: '/partners/:id',
        destination: '/trips/:id',
        permanent: true,
      },
    ];
  },
  // Add cache control headers
  async headers() {
    return [
      {
        // Apply to favicon and icons - short cache for updates
        source: '/:path*.(ico|svg|png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate', // 1 hour instead of forever
          },
        ],
      },
    ];
  },
};

export default nextConfig;
