import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadPapyrusConfig } from "./config/index.mjs";

function templateRoute(path) {
  return fileURLToPath(new URL(path, import.meta.url));
}

function localRouteExists(files) {
  return files.some(file => existsSync(file));
}

const defaultRoutes = [
  { pattern: "/", entrypoint: templateRoute("./template/pages/index.astro"), localFiles: ["src/pages/index.astro"] },
  { pattern: "/about", entrypoint: templateRoute("./template/pages/about.astro"), localFiles: ["src/pages/about.astro"] },
  { pattern: "/posts", entrypoint: templateRoute("./template/pages/posts/index.astro"), localFiles: ["src/pages/posts/index.astro"] },
  { pattern: "/posts/timeline", entrypoint: templateRoute("./template/pages/posts/timeline.astro"), localFiles: ["src/pages/posts/timeline.astro"] },
  { pattern: "/posts/[...slug]", entrypoint: templateRoute("./template/pages/posts/[...slug].astro"), localFiles: ["src/pages/posts/[...slug].astro"] },
  { pattern: "/projects", entrypoint: templateRoute("./template/pages/projects.astro"), localFiles: ["src/pages/projects.astro"] },
  { pattern: "/profile", entrypoint: templateRoute("./template/pages/profile/index.astro"), localFiles: ["src/pages/profile/index.astro", "src/pages/profile.astro"] },
  { pattern: "/profile/print", entrypoint: templateRoute("./template/pages/profile/print.astro"), localFiles: ["src/pages/profile/print.astro"] },
  { pattern: "/profile/ast", entrypoint: templateRoute("./template/pages/profile/ast.astro"), localFiles: ["src/pages/profile/ast.astro"] },
  { pattern: "/collections", entrypoint: templateRoute("./template/pages/collections.astro"), localFiles: ["src/pages/collections.astro", "src/pages/collections/index.astro"] },
  { pattern: "/collections/[slug]", entrypoint: templateRoute("./template/pages/collections/[slug].astro"), localFiles: ["src/pages/collections/[slug].astro"] },
  { pattern: "/collections/[collection]/[...slug]", entrypoint: templateRoute("./template/pages/collections/[collection]/[...slug].astro"), localFiles: ["src/pages/collections/[collection]/[...slug].astro"] },
  { pattern: "/search", entrypoint: templateRoute("./template/pages/search.astro"), localFiles: ["src/pages/search.astro", "src/pages/search/index.astro"] },
  { pattern: "/tag", entrypoint: templateRoute("./template/pages/tag/index.astro"), localFiles: ["src/pages/tag/index.astro", "src/pages/tag.astro"] },
  { pattern: "/tag/[tag]", entrypoint: templateRoute("./template/pages/tag/[tag].astro"), localFiles: ["src/pages/tag/[tag].astro"] },
  { pattern: "/404", entrypoint: templateRoute("./template/pages/404.astro"), localFiles: ["src/pages/404.astro"] },
  { pattern: "/llms.txt", entrypoint: templateRoute("./template/pages/llms.txt.ts"), localFiles: ["src/pages/llms.txt.ts", "src/pages/llms.txt.js", "public/llms.txt"] },
  { pattern: "/rss.xml", entrypoint: templateRoute("./template/pages/rss.xml.ts"), localFiles: ["src/pages/rss.xml.ts", "src/pages/rss.xml.js"] },
  { pattern: "/robots.txt", entrypoint: templateRoute("./template/pages/robots.txt.ts"), localFiles: ["src/pages/robots.txt.ts", "src/pages/robots.txt.js"] },
];

const securityTxtRoutes = [
  { pattern: "/.well-known/security.txt", entrypoint: templateRoute("./template/pages/security.txt.ts"), localFiles: ["src/pages/.well-known/security.txt.ts", "src/pages/.well-known/security.txt.js", "public/.well-known/security.txt"] },
  { pattern: "/security.txt", entrypoint: templateRoute("./template/pages/security.txt.ts"), localFiles: ["src/pages/security.txt.ts", "src/pages/security.txt.js", "public/security.txt"] },
];

export default function papyrus() {
  return {
    name: "astro-papyrus",
    hooks: {
      "astro:config:setup": async ({ injectRoute }) => {
        const site = await loadPapyrusConfig();
        for (const { pattern, entrypoint, localFiles } of defaultRoutes) {
          if (localRouteExists(localFiles)) continue;
          injectRoute({ pattern, entrypoint });
        }
        if (site.securityTxt.contacts.length > 0) {
          for (const { pattern, entrypoint, localFiles } of securityTxtRoutes) {
            if (localRouteExists(localFiles)) continue;
            injectRoute({ pattern, entrypoint });
          }
        }
      },
    },
  };
}
