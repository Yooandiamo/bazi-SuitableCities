import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // We no longer need to expose process.env.API_KEY to the client
  // The client now talks to the backend (api/analyze.js), which holds the secrets.
});