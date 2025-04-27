/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Optimize for Cloud Run deployment
  output: "standalone",

  // Configure image domains
  images: {
    domains: [
      "localhost",
      "storage.googleapis.com",
      `${process.env.GCP_PROJECT_ID || "fluxori"}-files.storage.googleapis.com`,
      `${process.env.GCP_PROJECT_ID || "fluxori"}-documents.storage.googleapis.com`,
    ],
    minimumCacheTTL: 3600, // Cache images for 1 hour
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },

  // Set production environment variables based on Cloud Run metadata
  publicRuntimeConfig: {
    apiURL: process.env.CLOUD_RUN
      ? `https://${process.env.BACKEND_SERVICE_URL || "backend-service"}`
      : "http://localhost:3000/api",
    staticDomain: process.env.CLOUD_RUN
      ? `https://storage.googleapis.com/${process.env.GCP_PROJECT_ID || "fluxori"}-files`
      : "http://localhost:3000",
  },

  // Production optimizations
  compress: true,

  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Improve code-splitting
    optimizeCss: true,
    // Optimize memory usage
    optimizePackageImports: ["@mantine/core", "@tabler/icons-react"],
    // Enable webpack optimization for production builds
    webpackBuildWorker: process.env.NODE_ENV === "production",
  },

  // Optional: Configure bundle analyzer in analyze script
  ...(process.env.ANALYZE === "true" && {
    webpack(config) {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "server",
          analyzerPort: 8888,
          openAnalyzer: true,
        }),
      );
      return config;
    },
  }),
};

// Add special configuration for Cloud Run environment
if (process.env.CLOUD_RUN === "true") {
  // Set server-side environment variables
  nextConfig.env = {
    DEPLOYMENT_ENV: "cloud-run",
    GCP_REGION: process.env.GCP_REGION || "africa-south1",
  };
}

export default nextConfig;
