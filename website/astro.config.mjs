// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import astroBrokenLinksChecker from "astro-broken-links-checker";

export default defineConfig({
  integrations: [svelte(), astroBrokenLinksChecker({ throwError: true })],
  vite: {
    plugins: [tailwindcss()],
  },
});
