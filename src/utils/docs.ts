import { postHref, type PaperPostEntry } from "./posts";

export interface PaperDocSection {
  id: string;
  title: string;
  description?: string;
  order?: number;
}

export interface PaperDocIndexItem {
  title: string;
  href?: string;
  description?: string;
  section?: string;
  order?: number;
  source?: "doc" | "post";
  children?: PaperDocIndexItem[];
}

function docOrder(item: PaperDocIndexItem): number {
  return typeof item.order === "number" ? item.order : Number.MAX_SAFE_INTEGER;
}

export function sortDocIndexItems<T extends PaperDocIndexItem>(items: T[]): T[] {
  return [...items].sort((a, b) => docOrder(a) - docOrder(b) || a.title.localeCompare(b.title));
}

export function postDocIndexItem(post: PaperPostEntry, basePath = "/posts"): PaperDocIndexItem | undefined {
  const docs = post.data.docs;
  if (!docs) return undefined;

  const config = typeof docs === "object" ? docs : {};
  return {
    title: config.title ?? post.data.title,
    href: postHref(post, basePath),
    description: config.description ?? post.data.description,
    section: config.section ?? "authoring",
    order: config.order,
    source: "post",
  };
}

export function buildDocIndex(sections: PaperDocSection[], items: PaperDocIndexItem[]): PaperDocIndexItem[] {
  const sortedSections = [...sections].sort((a, b) =>
    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title)
  );
  const sectionIds = new Set(sortedSections.map(section => section.id));
  const bySection = new Map<string, PaperDocIndexItem[]>();

  for (const item of items) {
    const key = item.section && sectionIds.has(item.section) ? item.section : sortedSections[0]?.id ?? "docs";
    bySection.set(key, [...(bySection.get(key) ?? []), item]);
  }

  return sortedSections.map(section => ({
    title: section.title,
    href: section.id === "start" ? "/docs/" : undefined,
    description: section.description,
    order: section.order,
    children: sortDocIndexItems(bySection.get(section.id) ?? []),
  }));
}
