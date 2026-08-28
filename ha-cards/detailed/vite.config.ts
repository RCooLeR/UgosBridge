import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'UgreenNasCard',
      fileName: () => 'ugreen-nas-card.js',
      formats: ['es']
    },
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
    rolldownOptions: {
      external: []
    }
  }
});
