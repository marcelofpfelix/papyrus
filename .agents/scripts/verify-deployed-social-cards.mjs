#!/usr/bin/env node

const args = process.argv.slice(2).filter(arg => arg !== "--");
const [baseUrl, ...paths] = args;

if (!baseUrl) {
  console.error("Usage: node .agents/scripts/verify-deployed-social-cards.mjs <base-url> [paths...]");
  process.exit(1);
}

const routes = paths.length ? paths : [
  "/",
  "/posts/install-configure-papyrus/",
  "/posts/hidden-post-demo/",
];

function pageUrl(pathname) {
  return new URL(pathname, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).href;
}

function metaContent(html, attribute, name) {
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
  return html.match(pattern)?.[1];
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

async function verifyImage(url) {
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`${url} returned non-image content-type: ${contentType || "(missing)"}`);
  }
}

for (const route of routes) {
  const url = pageUrl(route);
  const html = await fetchText(url);
  const card = metaContent(html, "name", "twitter:card");
  const ogImage = metaContent(html, "property", "og:image");
  const twitterImage = metaContent(html, "name", "twitter:image");
  const ogImageAlt = metaContent(html, "property", "og:image:alt");
  const twitterImageAlt = metaContent(html, "name", "twitter:image:alt");

  if (card !== "summary_large_image") throw new Error(`${url} has twitter:card=${card || "(missing)"}`);
  if (!ogImage) throw new Error(`${url} is missing og:image`);
  if (!twitterImage) throw new Error(`${url} is missing twitter:image`);
  if (ogImage !== twitterImage) throw new Error(`${url} has different og:image and twitter:image`);
  if (!ogImageAlt || !twitterImageAlt) throw new Error(`${url} is missing image alt metadata`);

  await verifyImage(ogImage);
  console.log(`Verified ${url} -> ${ogImage}`);
}
