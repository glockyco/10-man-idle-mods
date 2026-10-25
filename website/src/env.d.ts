declare module "astro-broken-links-checker" {
  import type { AstroIntegration } from "astro";

  export default function astroBrokenLinksChecker(options?: {
    logFilePath?: string;
    checkExternalLinks?: boolean;
    throwError?: boolean;
  }): AstroIntegration;
}
