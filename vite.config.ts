import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' loads all env vars regardless of prefix (e.g. API_KEY).
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Vital: Replaces process.env.API_KEY in the code with the actual string value.
      // We default to '' if undefined to prevent the code from breaking with "process is not defined" or "undefined" errors.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});