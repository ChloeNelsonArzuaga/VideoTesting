

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/VideoTesting/", // 👈 Replace with your repo name
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        credentials: true,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        credentials: true,
      },
      '/get_session': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        credentials: true,
      },
      '/fetch_images': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        credentials: true,
      },
      '/image': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        credentials: true,
      },
      '/video': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        credentials: true,
      },
      '/new_session': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        credentials: true,
      },
    },
  },
});

