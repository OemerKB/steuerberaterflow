/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: {
      // Uploads bis 12 MB erlauben (App-Limit: 10 MB, serverseitig validiert)
      bodySizeLimit: "12mb",
    },
  },
  async redirects() {
    return [
      { source: "/dashboard/clients/:path*", destination: "/clients/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
