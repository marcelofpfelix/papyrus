import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parse } from "smol-toml";
import { postSlug, type PapyrusPostEntry } from "./posts";
import { withBase } from "./withBase";

export type PapyrusCollectionSection = {
  name: string;
  description: string;
};

export type PapyrusCollection = {
  slug: string;
  href: string;
  path: string;
  name: string;
  description: string;
  settings: PapyrusCollectionSettings;
  sections: PapyrusCollectionSection[];
  posts: PapyrusPostEntry[];
};

export type PapyrusCollectionPostFooter = "collection" | "none";

export type PapyrusCollectionSettings = {
  postFooter: PapyrusCollectionPostFooter;
  postFooterCollapsible: boolean;
};

export type PapyrusCollectionTocLink = {
  href: string;
  title: string;
  depth: number;
};

export function collectionSectionSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function collectionSectionId(name: string): string {
  return `collection-section-${collectionSectionSlug(name)}`;
}

export function collectionPostHref(collection: Pick<PapyrusCollection, "slug">, post: PapyrusPostEntry, basePath = `/collections/${collection.slug}`): string {
  return withBase(`${basePath}/${collectionPostSlug(collection, post)}/`);
}

export function collectionPostSlug(collection: Pick<PapyrusCollection, "slug">, post: PapyrusPostEntry): string {
  const slug = postSlug(post);
  const prefix = `${collection.slug}/`;
  return slug.startsWith(prefix) ? slug.slice(prefix.length) : slug;
}

export function collectionDir(collection: Pick<PapyrusCollection, "path" | "slug">): string {
  return collection.path.includes("/") ? collection.path.slice(0, collection.path.lastIndexOf("/")) : collection.slug;
}

function postPath(post: PapyrusPostEntry) {
  return post.filePath?.replaceAll("\\", "/") ?? "";
}

export function collectionPostsForSection(collection: PapyrusCollection, sectionName: string): PapyrusPostEntry[] {
  const sectionSlug = collectionSectionSlug(sectionName);
  const prefix = `src/content/posts/${collectionDir(collection)}/${sectionSlug}/`;

  return collection.posts.filter(post => postPath(post).startsWith(prefix));
}

export function collectionOrderedPosts(collection: PapyrusCollection): PapyrusPostEntry[] {
  const sectionPostIds = new Set<string>();
  const sectionPosts = collection.sections.flatMap(section => {
    const posts = collectionPostsForSection(collection, section.name);
    posts.forEach(post => sectionPostIds.add(post.id));
    return posts;
  });
  const loosePosts = collection.posts.filter(post => !sectionPostIds.has(post.id));

  return [...sectionPosts, ...loosePosts];
}

export function collectionTocLinks(collection: PapyrusCollection, basePath = `/collections/${collection.slug}`): PapyrusCollectionTocLink[] {
  const sectionPostIds = new Set<string>();
  const links = collection.sections.flatMap(section => {
    const posts = collectionPostsForSection(collection, section.name);
    posts.forEach(post => sectionPostIds.add(post.id));

    return [
      {
        href: `#${collectionSectionId(section.name)}`,
        title: section.name,
        depth: 2,
      },
      ...posts.map(post => ({
        href: collectionPostHref(collection, post, basePath),
        title: post.data.title,
        depth: 3,
      })),
    ];
  });
  const loosePosts = collection.posts.filter(post => !sectionPostIds.has(post.id));

  return loosePosts.length > 0
    ? [
        ...links,
        { href: "#collection-posts", title: "Posts", depth: 2 },
        ...loosePosts.map(post => ({
          href: collectionPostHref(collection, post, basePath),
          title: post.data.title,
          depth: 3,
        })),
      ]
    : links;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asSections(value: unknown): PapyrusCollectionSection[] {
  return Array.isArray(value)
    ? value.map(section => {
        const record = asRecord(section);
        return {
          name: asString(record.name),
          description: asString(record.description),
        };
      }).filter(section => section.name)
    : [];
}

function asSettings(value: unknown): PapyrusCollectionSettings {
  const record = asRecord(value);
  const postFooter = asString(record.post_footer, "collection");

  return {
    postFooter: postFooter === "none" ? "none" : "collection",
    postFooterCollapsible: record.post_footer_collapsible !== false,
  };
}

function titleFromSlug(slug: string): string {
  return slug.split("-").filter(Boolean).map(part => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");
}

async function findTomlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return findTomlFiles(path);
    return entry.isFile() && entry.name.endsWith(".toml") ? [path] : [];
  }));

  return files.flat();
}

export async function getPostCollections(postsDir = "src/content/posts", sourcePosts: PapyrusPostEntry[] = []): Promise<PapyrusCollection[]> {
  const collectionSourcePosts = sourcePosts;
  const collectionFiles = await findTomlFiles(postsDir);
  const collections = await Promise.all(collectionFiles.map(async path => {
    const source = await readFile(path, "utf8");
    const parsed = asRecord(parse(source));
    const relativePath = relative(postsDir, path).split(sep).join("/");
    const slug = relativePath.replace(/\/[^/]+\.toml$/, "").replace(/\.toml$/, "");
    const collectionSlug = slug.split("/").filter(Boolean).at(-1) ?? slug;
    const collectionDir = relativePath.includes("/") ? relativePath.slice(0, relativePath.lastIndexOf("/")) : "";
    const collectionPostPrefix = collectionDir ? `${postsDir}/${collectionDir}/` : `${postsDir}/`;
    const collectionPosts = collectionSourcePosts
      .filter(post => !post.data.draft && !post.data.hidden)
      .filter(post => postPath(post).includes(collectionPostPrefix))
      .sort((a, b) => (a.filePath ?? a.id).localeCompare(b.filePath ?? b.id));

    return {
      slug: collectionSlug,
      href: withBase(`/collections/${collectionSlug}/`),
      path: relativePath,
      name: asString(parsed.name, titleFromSlug(collectionSlug)),
      description: asString(parsed.description),
      settings: asSettings(parsed.settings),
      sections: asSections(parsed.sections),
      posts: collectionPosts,
    };
  }));

  return collections.sort((a, b) => a.name.localeCompare(b.name));
}
