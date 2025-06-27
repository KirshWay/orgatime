import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import sitemap from "vite-plugin-sitemap";

const domain = process.env.VITE_SITE_DOMAIN || "http://localhost:5173";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "robots.txt",
      ],
      manifest: {
        name: "Orgatime - organise your week",
        short_name: "Orgatime",
        description: "Organise your week and be productive",
        theme_color: "#dde1fb",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,json}"],
        runtimeCaching: [
          {
            urlPattern:
              /\.(?:png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|otf|css|js)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\/api\/(?!auth)/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /^https:\/\/[^/]+\/((?!api).)*$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "html-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/_/],
      },
    }),
    sitemap({
      hostname: domain,
      dynamicRoutes: ["/", "/auth/login", "/auth/signup"],
      exclude: [
        "/auth/forgot-password",
        "/auth/reset-password",
        "/404",
        "/error",
      ],
      lastmod: new Date(),
      changefreq: "weekly",
      priority: 0.8,
      robots: [
        {
          userAgent: "*",
          allow: "/",
          disallow: ["/auth/forgot-password", "/auth/reset-password"],
        },
      ],
      readable: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
