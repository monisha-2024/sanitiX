import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Set base to the repository name so asset URLs work on GitHub Pages
  base: '/sanitiX/',
  plugins: [react()],
  server: {
    port: 5173
  }
});
