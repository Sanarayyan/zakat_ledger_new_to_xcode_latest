import { versionHubEndpoint } from './src/services/versionHubEndpoint.mjs';
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production') {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    const url = new URL(env.VITE_API_BASE_URL || 'http://localhost');
    if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      throw new Error('Production builds require VITE_API_BASE_URL pointing to an HTTPS backend. For local device tests use npm run build:device-test.');
    }
    if (!versionHubEndpoint({ ...env, MODE: 'production' })) throw new Error('Production builds require an HTTPS VersionHub endpoint.');
    if (!env.VITE_GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
      throw new Error('Production builds require VITE_GOOGLE_CLIENT_ID. For local device tests use npm run build:device-test.');
    }
  }
  return { plugins: [react()] };
})
