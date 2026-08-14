import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

type PapyrusSitemapFilterOptions = {
  postsDir?: string;
  excludeCollectionPosts?: boolean;
};

function hiddenPostPaths(dir = "src/content/posts", root = dir): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return hiddenPostPaths(fullPath, root);
    if (!/\.(md|mdx)$/.test(entry.name)) return [];

    const source = readFileSync(fullPath, "utf8");
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    if (!/^hidden:\s*true\s*$/m.test(frontmatter)) return [];

    const slug = frontmatter.match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]
      ?? relative(root, fullPath).replace(/\.(md|mdx)$/, "").split(sep).join("/");

    return [`/posts/${slug}/`];
  });
}

export function createPapyrusSitemapFilter(options: PapyrusSitemapFilterOptions = {}) {
  const hiddenPostPathSet = new Set(hiddenPostPaths(options.postsDir));
  const excludeCollectionPosts = options.excludeCollectionPosts ?? true;

  return (page: string) => {
    const pathname = new URL(page).pathname;
    if (hiddenPostPathSet.has(pathname)) return false;
    if (excludeCollectionPosts && /^\/collections\/[^/]+\/[^/]+\/$/.test(pathname)) return false;
    return true;
  };
}
