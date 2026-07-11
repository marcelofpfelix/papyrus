import { withBase } from "./withBase";

export interface PaperPostEntry {
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
    category?: string;
    tags?: string[];
    editUrl?: string;
    docs?: boolean | {
      title?: string;
      description?: string;
      section?: string;
      order?: number;
    };
  };
  body?: string;
}

export function postDate(post: PaperPostEntry): Date {
  return new Date(post.data.pubDatetime ?? post.data.date ?? 0);
}

export function postUpdatedDate(post: PaperPostEntry): Date | undefined {
  return post.data.modDatetime ? new Date(post.data.modDatetime) : undefined;
}

export function hasUpdatedDate(post: PaperPostEntry): boolean {
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

export function isNewPost(post: PaperPostEntry, reference = new Date(), days = 30): boolean {
  return isRecentDate(postDate(post), reference, days);
}

export function hasFreshUpdate(post: PaperPostEntry, reference = new Date(), days = 30): boolean {
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

export function pinRank(post: PaperPostEntry): number {
  if (typeof post.data.pinned === "number") return post.data.pinned;
  return post.data.pinned ? 1 : 0;
}

export function postSlug(post: PaperPostEntry): string {
  return post.data.slug ?? post.id.replace(/\.(md|mdx)$/, "");
}

export function folderTags(post: PaperPostEntry): string[] {
  const sourcePath = (post.filePath ?? post.id)
    .replace(/^.*?src\/content\/posts\//, "")
    .replace(/\.(md|mdx)$/, "");
  const parts = sourcePath.split("/").slice(0, -1);
  return parts.map(part => part.trim()).filter(Boolean);
}

export function postTags(post: PaperPostEntry): string[] {
  return Array.from(
    new Set([...(post.data.tags ?? []), ...folderTags(post)].map(tag => tag.trim()).filter(Boolean))
  );
}

export function tagSlug(tag: string): string {
  return encodeURIComponent(tag.trim().toLowerCase().replace(/\s+/g, "-"));
}

export function tagHref(tag: string, basePath = "/tag"): string {
  return withBase(`${basePath}/${tagSlug(tag)}/`);
}

export function postCategory(post: PaperPostEntry): string | undefined {
  return post.data.category?.trim() || undefined;
}

export function postHref(post: PaperPostEntry, basePath = "/posts"): string {
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

export function sortPosts<T extends PaperPostEntry>(posts: T[]): T[] {
  return [...posts].sort((a, b) => postDate(b).valueOf() - postDate(a).valueOf());
}

export function sortPostsWithPinned<T extends PaperPostEntry>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const pinned = pinRank(b) - pinRank(a);
    return pinned || postDate(b).valueOf() - postDate(a).valueOf();
  });
}

export function routablePosts<T extends PaperPostEntry>(posts: T[]): T[] {
  return sortPosts(posts.filter(post => !post.data.draft));
}

export function publishedPosts<T extends PaperPostEntry>(posts: T[]): T[] {
  return sortPosts(posts.filter(post => !post.data.draft && !post.data.hidden));
}

export function hiddenPosts<T extends PaperPostEntry>(posts: T[]): T[] {
  return sortPosts(posts.filter(post => !post.data.draft && post.data.hidden));
}

export function pinnedPosts<T extends PaperPostEntry>(posts: T[]): T[] {
  return sortPostsWithPinned(posts.filter(post => pinRank(post) > 0 && !post.data.draft && !post.data.hidden));
}

export function getAllTags<T extends PaperPostEntry>(posts: T[]): string[] {
  return Array.from(
    new Set(posts.flatMap(post => postTags(post)).map(tag => tag.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

export function postsByTag<T extends PaperPostEntry>(posts: T[], tag: string): T[] {
  return sortPosts(posts.filter(post => postTags(post).includes(tag)));
}

export function getAdjacentPosts<T extends PaperPostEntry>(posts: T[], currentId: string) {
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
