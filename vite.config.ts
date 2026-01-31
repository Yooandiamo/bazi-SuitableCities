import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Clean the API Key: remove whitespace and potential surrounding quotes
  let apiKey = (env.API_KEY || process.env.API_KEY || '').trim();
  if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
    apiKey = apiKey.slice(1, -1);
  }

  return {
    plugins: [react()],
    define: {
      // Expose these variables to the client-side code safely
      'process.env.API_KEY': JSON.stringify(apiKey),
    }
  };
});