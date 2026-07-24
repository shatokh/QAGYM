import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function parseProxyTarget(value: string): string {
  const target = new URL(value);

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("VITE_API_PROXY_TARGET must use http or https.");
  }

  if (target.username || target.password) {
    throw new Error("VITE_API_PROXY_TARGET must not contain credentials.");
  }

  if (target.pathname !== "/" || target.search || target.hash) {
    throw new Error("VITE_API_PROXY_TARGET must be an origin without a path.");
  }

  return target.origin;
}

export default defineConfig(({ mode }) => {
  const envDirectory = "../..";
  const env = loadEnv(mode, envDirectory, "");
  const proxyTarget = parseProxyTarget(
    env.VITE_API_PROXY_TARGET ?? "http://localhost:3000",
  );

  const proxy = {
    "/api": {
      target: proxyTarget,
      changeOrigin: true,
    },
  };

  return {
    envDir: envDirectory,
    plugins: [react()],
    server: {
      proxy,
    },
    preview: {
      proxy,
    },
  };
});
