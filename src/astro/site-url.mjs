export function deploymentSiteUrl(fallback) {
  return process.env.SITE_URL ?? fallback ?? process.env.CF_PAGES_URL;
}
