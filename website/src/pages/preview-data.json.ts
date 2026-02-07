import type { APIRoute } from "astro";
import { buildPreviewData } from "../data/previews";

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(buildPreviewData()), {
    headers: { "Content-Type": "application/json" },
  });
};
