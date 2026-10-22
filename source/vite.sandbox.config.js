import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react';
const M = '/workspace/showcase/sandbox/firebase-mock.js';
export default defineConfig({ root: '/workspace/porur-prototype', base: './', plugins: [react()], mode: 'sandbox',
  define: { 'import.meta.env.VITE_FIREBASE_PROJECT_ID': '"ding-dong-sandbox"', 'import.meta.env.VITE_FIREBASE_EMULATOR_HOST': '""' },
  resolve: { alias: [{ find: /^firebase\/(app|auth|firestore)$/, replacement: M }] },
  build: { outDir: '/workspace/showcase/site/app', emptyOutDir: true } });
