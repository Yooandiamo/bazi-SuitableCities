import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Prioritize env var from file, then system process.env, then empty string.
  // CRITICAL: Trim whitespace which often causes "API KEY NOT VALID" errors.
  const apiKey = (env.API_KEY || process.env.API_KEY || '').trim();

  return {
    plugins: [react()],
    define: {
      // Expose these variables to the client-side code safely
      'process.env.API_KEY': JSON.stringify(apiKey),
    }
  };
});