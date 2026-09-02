import { postSlug, type PapyrusPostEntry } from "./posts";
import { withBase } from "./withBase";
import {
  collectionContainsPost,
  collectionSectionForPost,
  collectionSectionSlug as sectionSlug,
  readPostCollectionMetadata,
} from "./collection-metadata.mjs";

export type PapyrusCollectionSection = {
  name: string;
  directory: string;
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
  breadcrumbs: boolean;
  postFooter: PapyrusCollectionPostFooter;
  postFooterCollapsible: boolean;
};

export type PapyrusCollectionTocLink = {
  href: string;
  title: string;
  depth: number;
};

export function collectionSectionSlug(name: string): string {
  return sectionSlug(name);
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

export function collectionSectionNameForPost(collection: PapyrusCollection, post: PapyrusPostEntry): string | undefined {
  return collectionSectionForPost({
    ...collection,
    directory: collectionDir(collection),
  }, postPath(post));
}

export function collectionPostsForSection(collection: PapyrusCollection, sectionName: string): PapyrusPostEntry[] {
  return collection.posts.filter(post => collectionSectionForPost({
    ...collection,
    directory: collectionDir(collection),
  }, postPath(post)) === sectionName);
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

export async function getPostCollections(postsDir = "src/content/posts", sourcePosts: PapyrusPostEntry[] = []): Promise<PapyrusCollection[]> {
  const collections = (await readPostCollectionMetadata(postsDir)).map(metadata => {
    const collectionPosts = sourcePosts
      .filter(post => !post.data.draft && !post.data.hidden)
      .filter(post => collectionContainsPost(metadata, postPath(post), postsDir))
      .sort((a, b) => (a.filePath ?? a.id).localeCompare(b.filePath ?? b.id));

    return {
      ...metadata,
      href: withBase(`/collections/${metadata.slug}/`),
      posts: collectionPosts,
    };
  });

  return collections.sort((a, b) => a.name.localeCompare(b.name));
}
