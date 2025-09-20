/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Performance optimizations
  compress: true,
  swcMinify: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@heroicons/react', 'react-window', 'react-virtualized-auto-sizer'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // Partial Prerendering requires Next.js canary; keep disabled on stable
    ppr: false,
  },
  
  // Bundle analyzer and optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // React chunk
          react: {
            name: 'react',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 30,
          },
          // Charts chunk
          charts: {
            name: 'charts',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|recharts)[\\/]/,
            priority: 25,
          },
          // Virtualization chunk
          virtualization: {
            name: 'virtualization',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react-window|react-virtualized)[\\/]/,
            priority: 25,
          },
        },
      };
    }
    
    return config;
  },
  
  // Headers for caching and performance
  async headers() {
    return [
      {
        source: '/api/optimized/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // ISR configuration for semi-static data
  async rewrites() {
    return [
      {
        source: '/announcements',
        destination: '/announcements',
        has: [
          {
            type: 'header',
            key: 'x-revalidate',
            value: '(?<revalidate>.*)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
