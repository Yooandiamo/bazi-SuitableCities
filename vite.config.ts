import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Use es2015 to support most modern browsers including iOS 11+
    target: 'es2015',
    outDir: 'dist',
  },
});