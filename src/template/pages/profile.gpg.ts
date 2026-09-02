import type { APIRoute } from "astro";
import { getTemplatePublicKeys } from "../public-keys";

export const prerender = true;

export const GET: APIRoute = async () => {
  const { gpg } = await getTemplatePublicKeys();
  return new Response(gpg, {
    headers: {
      "Content-Type": "application/pgp-keys; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
