import { getTemplateSite } from "../site";

export async function GET() {
  const site = await getTemplateSite();
  const origin = site.site ?? "http://localhost:4321";
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${new URL("/sitemap-index.xml", origin).href}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
