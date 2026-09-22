import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: '/simular-frete',
        destination: '/fretes/simular',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
