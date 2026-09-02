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

function linkHref(html, rel) {
  const pattern = new RegExp(`<link\\s+rel=["']${rel}["'][^>]*href=["']([^"']+)["'][^>]*>`, "i");
  return html.match(pattern)?.[1];
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

async function verifyImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("image/png")) throw new Error(`${url} returned ${contentType || "(missing)"}, expected image/png`);
  const image = Buffer.from(await response.arrayBuffer());
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!image.subarray(0, 8).equals(signature)) throw new Error(`${url} is not a PNG file`);
  if (image.readUInt32BE(16) !== 1200 || image.readUInt32BE(20) !== 630) throw new Error(`${url} is not 1200x630`);
}

for (const route of routes) {
  const url = pageUrl(route);
  const html = await fetchText(url);
  const card = metaContent(html, "name", "twitter:card");
  const ogImage = metaContent(html, "property", "og:image");
  const twitterImage = metaContent(html, "name", "twitter:image");
  const ogImageAlt = metaContent(html, "property", "og:image:alt");
  const twitterImageAlt = metaContent(html, "name", "twitter:image:alt");
  const imageType = metaContent(html, "property", "og:image:type");
  const imageWidth = metaContent(html, "property", "og:image:width");
  const imageHeight = metaContent(html, "property", "og:image:height");
  const locale = metaContent(html, "property", "og:locale");
  const canonical = linkHref(html, "canonical");

  if (card !== "summary_large_image") throw new Error(`${url} has twitter:card=${card || "(missing)"}`);
  if (!ogImage) throw new Error(`${url} is missing og:image`);
  if (!twitterImage) throw new Error(`${url} is missing twitter:image`);
  if (ogImage !== twitterImage) throw new Error(`${url} has different og:image and twitter:image`);
  if (!ogImageAlt || !twitterImageAlt) throw new Error(`${url} is missing image alt metadata`);
  if (imageType !== "image/png" || imageWidth !== "1200" || imageHeight !== "630") throw new Error(`${url} has incomplete PNG image metadata`);
  if (!locale) throw new Error(`${url} is missing og:locale`);
  if (!canonical) throw new Error(`${url} is missing a canonical URL`);
  if (new URL(canonical).origin !== new URL(ogImage).origin) throw new Error(`${url} canonical and social image use different origins`);
  const expectedOrigin = process.env.PAPYRUS_EXPECTED_CANONICAL_ORIGIN;
  if (expectedOrigin && new URL(canonical).origin !== new URL(expectedOrigin).origin) throw new Error(`${url} canonical does not use ${expectedOrigin}`);

  await verifyImage(ogImage);
  console.log(`Verified ${url} -> ${ogImage}`);
}
