import { withBase } from "./withBase";

export interface PapyrusPostEntry {
  id: string;
  filePath?: string;
  data: {
    title: string;
    description?: string;
    slug?: string;
    pubDatetime?: Date | string;
    modDatetime?: Date | string;
    date?: Date | string;
    draft?: boolean;
    hidden?: boolean;
    pinned?: boolean | number;
    cover?: string;
    ogImage?: string;
    ogSourceImage?: string;
    category?: string;
    tags?: string[];
    editUrl?: string;
  };
  body?: string;
}

export function postDate(post: PapyrusPostEntry): Date {
  return parsePostDate(post.data.pubDatetime ?? post.data.date);
}

export function postUpdatedDate(post: PapyrusPostEntry): Date | undefined {
  return post.data.modDatetime ? new Date(post.data.modDatetime) : undefined;
}

export function parsePostDate(value?: Date | string): Date {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  return new Date(value ?? 0);
}

export function isScheduledPost(post: PapyrusPostEntry, reference = new Date()): boolean {
  return postDate(post).valueOf() > reference.valueOf();
}

export function postPublishTimestamp(post: PapyrusPostEntry): number {
  return postDate(post).valueOf();
}

export function hasUpdatedDate(post: PapyrusPostEntry): boolean {
  const updated = postUpdatedDate(post);
  if (!updated) return false;

  const published = postDate(post);
  return updated.toDateString() !== published.toDateString();
}

export function isRecentDate(value?: Date | string, reference = new Date(), days = 30): boolean {
  if (!value) return false;

  const date = new Date(value);
  const ageMs = reference.valueOf() - date.valueOf();
  const windowMs = days * 24 * 60 * 60 * 1000;
  return Number.isFinite(ageMs) && ageMs >= 0 && ageMs < windowMs;
}

export function isNewPost(post: PapyrusPostEntry, reference = new Date(), days = 30): boolean {
  return isRecentDate(postDate(post), reference, days);
}

export function hasFreshUpdate(post: PapyrusPostEntry, reference = new Date(), days = 30): boolean {
  const updated = postUpdatedDate(post);
  return hasUpdatedDate(post) && isRecentDate(updated, reference, days);
}

export function formatPostDate(value?: Date | string, reference = new Date()): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";

  const monthDay = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
  }).format(date);

  const year = date.getFullYear();
  return year === reference.getFullYear() ? monthDay : `${year} ${monthDay}`;
}

export function pinRank(post: PapyrusPostEntry): number {
  if (typeof post.data.pinned === "number") return post.data.pinned;
  return post.data.pinned ? 1 : 0;
}

export function postSlug(post: PapyrusPostEntry): string {
  return post.data.slug ?? post.id.replace(/\.(md|mdx)$/, "");
}

export function postSourcePath(post: PapyrusPostEntry, root = "src/content/posts"): string {
  const filePath = post.filePath?.replaceAll("\\", "/");
  if (filePath) {
    const marker = `${root}/`;
    const markerIndex = filePath.indexOf(marker);
    if (markerIndex >= 0) return filePath.slice(markerIndex);
    if (filePath.startsWith("src/")) return filePath;
  }

  const id = post.id.replace(/\.(md|mdx)$/, "");
  return `${root}/${id}.md`;
}

export function folderTags(post: PapyrusPostEntry): string[] {
  const sourcePath = postSourcePath(post)
    .replace(/^src\/content\/posts\//, "")
    .replace(/\.(md|mdx)$/, "");
  const parts = sourcePath.split("/").slice(0, -1);
  return parts.map(part => part.trim()).filter(Boolean);
}

export function postTags(post: PapyrusPostEntry): string[] {
  const tags = new Map<string, string>();
  [...(post.data.tags ?? []), ...folderTags(post)]
    .map(tag => tag.trim())
    .filter(Boolean)
    .forEach((tag) => {
      const slug = tagSlug(tag);
      if (slug && !tags.has(slug)) tags.set(slug, tag);
    });

  return Array.from(tags.values());
}

export function tagSlug(tag: string): string {
  return encodeURIComponent(tag.trim().toLowerCase().replace(/\s+/g, "-"));
}

export function tagHref(tag: string, basePath = "/tag"): string {
  return withBase(`${basePath}/${tagSlug(tag)}/`);
}

export function postCategory(post: PapyrusPostEntry): string | undefined {
  return post.data.category?.trim() || undefined;
}

export function postHref(post: PapyrusPostEntry, basePath = "/posts"): string {
  return withBase(`${basePath}/${postSlug(post)}/`);
}

export function toTransitionName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "-")
    .replace(/[^\x00-\x7F]/g, char => `u${char.codePointAt(0)?.toString(16).padStart(6, "0") ?? ""}`)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) return "post";
  return /^\d/.test(normalized) ? `p-${normalized}` : normalized;
}

export function sortPosts<T extends PapyrusPostEntry>(posts: T[]): T[] {
  return [...posts].sort((a, b) => postDate(b).valueOf() - postDate(a).valueOf());
}

export function sortPostsWithPinned<T extends PapyrusPostEntry>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const pinned = pinRank(b) - pinRank(a);
    return pinned || postDate(b).valueOf() - postDate(a).valueOf();
  });
}

export function routablePosts<T extends PapyrusPostEntry>(posts: T[]): T[] {
  return sortPosts(posts.filter(post => !post.data.draft));
}

export function publishedPosts<T extends PapyrusPostEntry>(posts: T[]): T[] {
  return sortPosts(posts.filter(post => !post.data.draft && !post.data.hidden));
}

export function hiddenPosts<T extends PapyrusPostEntry>(posts: T[]): T[] {
  return sortPosts(posts.filter(post => !post.data.draft && post.data.hidden));
}

export function pinnedPosts<T extends PapyrusPostEntry>(posts: T[]): T[] {
  return sortPostsWithPinned(posts.filter(post => pinRank(post) > 0 && !post.data.draft && !post.data.hidden));
}

export function scheduledListPosts<T extends PapyrusPostEntry>(posts: T[], limit: number, reference = new Date()): T[] {
  const result: T[] = [];
  let visibleCount = 0;

  for (const post of posts) {
    const scheduled = isScheduledPost(post, reference);
    if (!scheduled && visibleCount >= limit) break;

    result.push(post);
    if (!scheduled) visibleCount += 1;
  }

  return result;
}

export function getAllTags<T extends PapyrusPostEntry>(posts: T[]): string[] {
  const tags = new Map<string, string>();
  posts.flatMap(post => postTags(post))
    .map(tag => tag.trim())
    .filter(Boolean)
    .forEach((tag) => {
      const slug = tagSlug(tag);
      if (slug && !tags.has(slug)) tags.set(slug, tag);
    });

  return Array.from(tags.values()).sort((a, b) => a.localeCompare(b));
}

export function postsByTag<T extends PapyrusPostEntry>(posts: T[], tag: string): T[] {
  const slug = tagSlug(tag);
  return sortPosts(posts.filter(post => postTags(post).some(postTag => tagSlug(postTag) === slug)));
}

export function getAdjacentPosts<T extends PapyrusPostEntry>(posts: T[], currentId: string) {
  const sorted = sortPosts(posts);
  const index = sorted.findIndex(post => post.id === currentId);
  return {
    previous: index >= 0 ? sorted[index + 1] : undefined,
    next: index > 0 ? sorted[index - 1] : undefined,
  };
}

export function readingTime(input = ""): string {
  const words = input.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min`;
}
