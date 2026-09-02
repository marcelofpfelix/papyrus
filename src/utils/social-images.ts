import { postSlug, type PapyrusPostEntry } from "./posts";

export const papyrusSiteSocialImage = "/generated/social/home.png";

export function papyrusPostSocialImage(postOrSlug: PapyrusPostEntry | string): string {
  const slug = typeof postOrSlug === "string" ? postOrSlug : postSlug(postOrSlug);
  return `/generated/social/posts/${slug.replace(/^\/+|\/+$/g, "")}.png`;
}

export function papyrusExplicitSocialImage(post: PapyrusPostEntry): string | undefined {
  return post.data.ogImage;
}

export function papyrusSocialImageForPost(post: PapyrusPostEntry): string {
  return papyrusExplicitSocialImage(post) ?? papyrusPostSocialImage(post);
}
