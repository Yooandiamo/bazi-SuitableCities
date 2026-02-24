import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 降低构建目标版本，以兼容更多旧版浏览器（如旧版安卓 WebView、旧版 Safari）
    target: ['es2015', 'chrome64', 'safari11'],
    cssTarget: 'chrome61',
    outDir: 'dist',
  },
});