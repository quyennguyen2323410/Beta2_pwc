import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "pht logo.jpg",
        "image.png",
        "image copy.png",
        "image copy 2.png",
        "image copy 3.png",
        "image copy 4.png",
        "image copy 5.png",
        "image copy 6.png",
      ],
      manifest: {
        name: "Sổ tay vận hành PWC",
        short_name: "Sổ tay PWC",
        description:
          "Hệ thống hỗ trợ kỹ sư vận hành và tra cứu quy trình xử lý sự cố thiết bị",
        theme_color: "#06384b",
        background_color: "#f8fbff",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pht logo.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "/pht logo.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 giờ
              },
              networkTimeoutSeconds: 4,
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  base: "/",
  server: {
    host: "0.0.0.0",
    port: 7843,
    allowedHosts: true,
  },
});
