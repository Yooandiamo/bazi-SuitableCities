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
      // Default to SiliconFlow (硅基流动) as requested by the user for easier Vercel deployment
      'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'https://api.siliconflow.cn/v1'),
      'process.env.AI_MODEL': JSON.stringify(env.AI_MODEL || 'deepseek-ai/DeepSeek-V3')
    }
  };
});