import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Expose these variables to the client-side code
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Updated to use official DeepSeek API which is accessible in China
      'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'https://api.deepseek.com'),
      'process.env.AI_MODEL': JSON.stringify(env.AI_MODEL || 'deepseek-chat')
    }
  };
});