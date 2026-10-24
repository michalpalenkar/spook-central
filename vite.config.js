import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Phaser is loaded lazily (src/Game.jsx) in a chunk of its own, so
        // the page shows at once and a change to the game doesn't make
        // returning players download the engine again.
        codeSplitting: {
          groups: [{ name: 'phaser', test: /node_modules[\\/]phaser[\\/]/ }],
        },
      },
    },
    // The Phaser chunk is the engine itself (~1.2 MB, ~340 kB gzipped) and
    // can't be split further; warn only above it.
    chunkSizeWarningLimit: 1300,
  },
  test: {
    include: ['src/**/*.test.js'],
    environment: 'node',
  },
})
