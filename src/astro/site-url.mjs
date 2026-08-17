export function deploymentSiteUrl(fallback) {
  const pagesUrl = process.env.CF_PAGES_URL;
  const pagesBranch = process.env.CF_PAGES_BRANCH;
  const productionBranch = process.env.PAPYRUS_PRODUCTION_BRANCH ?? "main";

  if (pagesUrl && pagesBranch && pagesBranch !== productionBranch) return pagesUrl;

  return process.env.SITE_URL ?? pagesUrl ?? fallback;
}
