import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        format: 'iife',
        name: 'AroidShare',
        entryFileNames: 'share.js',
      },
    },
    outDir: '../source/javascripts',
    emptyOutDir: false,
  },
})
