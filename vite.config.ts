import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Vital: This replaces `process.env.API_KEY` in your code with the actual value during build
      // allowing the Google GenAI SDK to work in the browser without code changes.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});