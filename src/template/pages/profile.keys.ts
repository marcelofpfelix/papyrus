import type { APIRoute } from "astro";
import { getTemplatePublicKeys } from "../public-keys";

export const prerender = true;

export const GET: APIRoute = async () => {
  const { ssh } = await getTemplatePublicKeys();
  return new Response(ssh, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
