import type { CollectionEntry } from "astro:content";
import type { PapyrusSiteConfig } from "../config";
import { githubSourceUrl } from "../config";
import { papyrusSocialImageForPost } from "../utils/social-images";
import { postDate, postSourcePath, postTags, readingTime } from "../utils/posts";

type TemplateSite = PapyrusSiteConfig & {
  brandMark: "twinkle" | "terminal";
};

export function templatePostLayoutProps(post: CollectionEntry<"posts">, site: TemplateSite) {
  const sourcePath = postSourcePath(post);

  return {
    title: post.data.title,
    description: post.data.description,
    siteTitle: site.title,
    brandTitle: site.brandTitle,
    brandMark: site.brandMark,
    showBrandTitle: site.showBrandTitle,
    defaultThemeProfile: site.defaultThemeProfile,
    defaultFontProfile: site.defaultFontProfile,
    pubDatetime: postDate(post),
    modDatetime: post.data.modDatetime,
    cover: post.data.cover,
    ogImage: papyrusSocialImageForPost(post),
    ogImageAlt: post.data.title,
    coverEffect: post.data.coverEffect ?? post.data.cover_effect,
    tags: post.data.hidden ? [] : postTags(post),
    readingTime: readingTime(post.body),
    sourceUrl: githubSourceUrl(site, sourcePath, "raw"),
    sourceLinkUrl: githubSourceUrl(site, sourcePath),
    robots: post.data.hidden ? "noindex, follow" : post.data.robots,
    googleVerification: site.googleVerification,
    nav: site.nav,
    socialLinks: site.socialLinks,
    features: site.features,
  };
}
