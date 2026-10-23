// Single-file trial build: no server, data kept in the browser, everything inlined.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'client',
  base: './',
  plugins: [react()],
  define: { 'import.meta.env.VITE_LOCAL_DEMO': JSON.stringify('1') },
  build: {
    outDir: '../dist-trial',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
    chunkSizeWarningLimit: 3000,
  },
});
