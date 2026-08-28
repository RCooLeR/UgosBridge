import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'ugreen-nas-mini-card.js'
    },
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
    rolldownOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
