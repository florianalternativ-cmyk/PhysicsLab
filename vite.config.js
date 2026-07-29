import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base entspricht dem Repository-Namen, damit die Assets auch unter
// https://<benutzername>.github.io/PhysicsLab/ gefunden werden.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/PhysicsLab/',
});
