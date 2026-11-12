// Plain Vite + React SPA. Build with `npm run build` -> dist/, deploy to Netlify.
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const SUPABASE_MANAGEMENT_API = "https://api.supabase.com/v1";
const MANAGEMENT_PATH_RE = /^\/[A-Za-z0-9\-_/.]*$/;

function supabaseManagementProxy(): Plugin {
  return {
    name: "supabase-management-proxy",
    configureServer(server) {
      server.middlewares.use("/api/supabase-mgmt", async (request, response) => {
        response.setHeader("Content-Type", "application/json");

        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end(JSON.stringify({ status: 405, ok: false, body: "Method not allowed" }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of request) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }

          const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
            path?: string;
            method?: string;
            token?: string;
            body?: string;
          };
          const path = payload.path ?? "";
          const method = payload.method === "POST" ? "POST" : "GET";
          const token = String(payload.token ?? "").trim();

          if (!MANAGEMENT_PATH_RE.test(path) || token.length < 10) {
            response.statusCode = 400;
            response.end(JSON.stringify({ status: 400, ok: false, body: "Invalid request" }));
            return;
          }

          const upstream = await fetch(`${SUPABASE_MANAGEMENT_API}${path}`, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "User-Agent": "refaat-uptime/1.0 (+vite-dev)",
              ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
            },
            ...(method === "POST" ? { body: payload.body ?? "{}" } : {}),
          });
          const body = await upstream.text();
          response.statusCode = 200;
          response.end(JSON.stringify({ status: upstream.status, ok: upstream.ok, body }));
        } catch (error) {
          response.statusCode = 500;
          response.end(
            JSON.stringify({
              status: 500,
              ok: false,
              body: error instanceof Error ? error.message : "Proxy request failed",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), supabaseManagementProxy()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 8080,
  },
  preview: {
    host: true,
    port: 8080,
  },
});
