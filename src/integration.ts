import type { AstroIntegration } from "astro";

const defaultRoutes = [
  ["/", "astro-theme-papyrus/template/pages/index.astro"],
  ["/about", "astro-theme-papyrus/template/pages/about.astro"],
  ["/posts", "astro-theme-papyrus/template/pages/posts/index.astro"],
  ["/posts/[...slug]", "astro-theme-papyrus/template/pages/posts/[...slug].astro"],
  ["/projects", "astro-theme-papyrus/template/pages/projects.astro"],
  ["/profile", "astro-theme-papyrus/template/pages/profile/index.astro"],
  ["/collections", "astro-theme-papyrus/template/pages/collections.astro"],
  ["/collections/[slug]", "astro-theme-papyrus/template/pages/collections/[slug].astro"],
  ["/collections/[collection]/[...slug]", "astro-theme-papyrus/template/pages/collections/[collection]/[...slug].astro"],
  ["/search", "astro-theme-papyrus/template/pages/search.astro"],
  ["/tag", "astro-theme-papyrus/template/pages/tag/index.astro"],
  ["/tag/[tag]", "astro-theme-papyrus/template/pages/tag/[tag].astro"],
  ["/404", "astro-theme-papyrus/template/pages/404.astro"],
  ["/rss.xml", "astro-theme-papyrus/template/pages/rss.xml.ts"],
  ["/robots.txt", "astro-theme-papyrus/template/pages/robots.txt.ts"],
] as const;

export default function papyrus(): AstroIntegration {
  return {
    name: "astro-theme-papyrus",
    hooks: {
      "astro:config:setup": ({ injectRoute }) => {
        for (const [pattern, entrypoint] of defaultRoutes) {
          injectRoute({ pattern, entrypoint });
        }
      },
    },
  };
}
