import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    config.module.rules.push({
      test: /\.(pdf|csv)$/,
      type: 'asset/resource',
    });
    return config;
  },

  turbopack: {
    resolveAlias: {
      '@': './src',
    },
    rules: {
      '*.pdf': { loaders: ['file-loader'], as: '*.js' },
      '*.csv': { loaders: ['file-loader'], as: '*.js' },
    },
  },
};

export default nextConfig;
