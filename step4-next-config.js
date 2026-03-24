// ============================================================
// next.config.js — Production Next.js Configuration
// ============================================================
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'your-project.supabase.co', // replace with your Supabase project ref
      'res.cloudinary.com',        // if using Cloudinary for images
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
