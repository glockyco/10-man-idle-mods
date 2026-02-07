// @ts-check
import { defineConfig } from "astro/config";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import astroBrokenLinksChecker from "astro-broken-links-checker";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const distPagefind = join(projectRoot, "dist", "pagefind");

/** Serve dist/pagefind/ during dev so search works after the first build. */
function pagefindDevServer() {
  const types = /** @type {Record<string, string>} */ ({
    js: "text/javascript",
    css: "text/css",
    json: "application/json",
    wasm: "application/wasm",
  });

  return {
    name: "pagefind-dev-server",
    configureServer(/** @type {any} */ server) {
      server.middlewares.use(
        "/pagefind",
        (/** @type {any} */ req, /** @type {any} */ res, /** @type {Function} */ next) => {
          const pathname = (req.url || "").split("?")[0];
          const filePath = join(distPagefind, pathname);
          if (!existsSync(filePath)) return next();
          const ext = pathname.split(".").pop() || "";
          res.setHeader("Content-Type", types[ext] || "application/octet-stream");
          res.end(readFileSync(filePath));
        },
      );
    },
  };
}

export default defineConfig({
  integrations: [astroBrokenLinksChecker({ throwError: true })],
  vite: {
    plugins: [tailwindcss(), pagefindDevServer()],
  },
});
