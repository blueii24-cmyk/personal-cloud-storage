import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Same reasoning as the backend: bind to all interfaces, not just
    // localhost, so another device on your network can load the app.
    host: true,
    port: 5173,
  },
});
