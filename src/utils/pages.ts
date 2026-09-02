export interface PapyrusPageEntry {
  id: string;
  data: {
    title: string;
    description?: string;
    layout?: "page";
    permalink?: string;
    draft?: boolean;
    robots?: string;
  };
}

const reservedRoutes = new Set([
  "404", "about", "collections", "llms.txt", "posts", "profile", "projects",
  "robots.txt", "rss.xml", "search", "security.txt", "tag",
]);

export function pageSlug(page: PapyrusPageEntry): string {
  const candidate = page.data.permalink ?? page.id.replace(/\.(md|mdx)$/, "");
  const slug = candidate.replace(/^\/+|\/+$/g, "").replace(/\/index$/, "");
  if (!slug) throw new Error(`Markdown page "${page.id}" resolves to the site root, which is reserved.`);

  const root = slug.split("/")[0];
  if (reservedRoutes.has(root)) {
    throw new Error(`Markdown page "${page.id}" uses reserved route "/${root}/". Add a custom Astro page to override a Papyrus route.`);
  }

  return slug;
}

export function routablePages<T extends PapyrusPageEntry>(pages: T[]): T[] {
  return pages.filter(page => !page.data.draft);
}
