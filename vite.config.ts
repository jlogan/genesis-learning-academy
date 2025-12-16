import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Production domain - update this with your actual production domain
  const productionDomain = process.env.VITE_PRODUCTION_DOMAIN || "genesislearningacademyofkennesaw.com";
  
  // Allowed hosts for development and preview servers
  const allowedHosts = [
    "genesislearningacademyofkennesaw.local", // Local development
    productionDomain, // Production domain
    `www.${productionDomain}`, // www subdomain
    "localhost",
    ".local",
  ];

  return {
    server: {
      host: "0.0.0.0", // Allow access from Docker containers
      port: 8080,
      strictPort: true,
      allowedHosts,
      proxy: {
        '/api': {
          // In Docker, use service name; locally, use localhost
          target: process.env.DOCKER_ENV === 'true' ? 'http://api:3001' : 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      strictPort: true,
      allowedHosts, // Also apply to preview server for production testing
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
