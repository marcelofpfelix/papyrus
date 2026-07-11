import type { APIRoute } from "astro";

const allowPaths = ["/"];
const disallowPaths: string[] = [];

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL("https://papyrus.marcelofelix.com");
  const lines = [
    "User-agent: *",
    ...allowPaths.map(path => `Allow: ${path}`),
    ...disallowPaths.map(path => `Disallow: ${path}`),
    "",
    `Sitemap: ${new URL("/sitemap-index.xml", baseUrl).href}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
