import { defineConfig, svgoOptimizer } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { unified } from "@astrojs/markdown-remark";
import rehypeCallouts from "rehype-callouts";
import papyrus from "./src/integration";
import kamailioLang from "./src/shiki/langs/kamailio.mjs";
import remarkArtifactLinks from "./src/markdown/remark-artifact-links.mjs";
import rehypeTaskListLabels from "./src/markdown/rehype-task-list-labels.mjs";
import remarkMermaidBlocks from "./src/markdown/remark-mermaid-blocks.mjs";
import {
  addCollapse,
  addCopyButton,
  addLanguage,
  addTitle,
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerRemoveNotationEscape,
  updateStyle,
} from "./src/shiki/index.mjs";

const calloutIcons = {
  tip: [
    { tagName: "path", properties: { d: "M15 14c.2-1 .7-1.7 1.4-2.5A5 5 0 1 0 7.6 11.5C8.3 12.3 8.8 13 9 14" } },
    { tagName: "path", properties: { d: "M9 18h6" } },
    { tagName: "path", properties: { d: "M10 22h4" } },
    { tagName: "path", properties: { d: "M10 14h4" } },
  ],
  caution: [
    { tagName: "path", properties: { d: "M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9L7.9 2Z" } },
    { tagName: "path", properties: { d: "m15 9-6 6" } },
    { tagName: "path", properties: { d: "m9 9 6 6" } },
  ],
  important: [
    { tagName: "circle", properties: { cx: "12", cy: "12", r: "10" } },
    { tagName: "path", properties: { d: "M12 8v4" } },
    { tagName: "path", properties: { d: "M12 16h.01" } },
  ],
  warning: [
    { tagName: "path", properties: { d: "m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" } },
    { tagName: "path", properties: { d: "M12 9v4" } },
    { tagName: "path", properties: { d: "M12 17h.01" } },
  ],
};

function calloutIcon(type) {
  return {
    type: "element",
    tagName: "svg",
    properties: {
      xmlns: "http://www.w3.org/2000/svg",
      width: "1em",
      height: "1em",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    children: calloutIcons[type].map(icon => ({ type: "element", children: [], ...icon })),
  };
}

function hasClass(node, className) {
  const classList = node?.properties?.className ?? node?.properties?.class ?? [];
  return Array.isArray(classList) ? classList.includes(className) : String(classList).split(/\s+/).includes(className);
}

function replaceCalloutIcon(node) {
  if (node?.type === "element") {
    const calloutType = node.properties?.["data-callout"] ?? node.properties?.dataCallout;
    if (calloutType in calloutIcons) {
      const title = node.children?.find(child => child.type === "element" && hasClass(child, "callout-title"));
      const icon = title?.children?.find(child => child.type === "element" && hasClass(child, "callout-title-icon"));
      if (icon) icon.children = [calloutIcon(calloutType)];
    }
  }

  node.children?.forEach(replaceCalloutIcon);
}

function rehypePapyrusCalloutIcons() {
  return tree => replaceCalloutIcon(tree);
}

function hiddenPostPaths(dir = "src/content/posts") {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return hiddenPostPaths(fullPath);
    if (!/\.(md|mdx)$/.test(entry.name)) return [];

    const source = readFileSync(fullPath, "utf8");
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    if (!/^hidden:\s*true\s*$/m.test(frontmatter)) return [];

    const slug = frontmatter.match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]
      ?? relative("src/content/posts", fullPath).replace(/\.(md|mdx)$/, "").split(sep).join("/");

    return [`/posts/${slug}/`];
  });
}

const hiddenPostPathSet = new Set(hiddenPostPaths());

function shouldIncludeInSitemap(page) {
  const pathname = new URL(page).pathname;
  if (hiddenPostPathSet.has(pathname)) return false;
  if (/^\/collections\/[^/]+\/[^/]+\/$/.test(pathname)) return false;
  return true;
}

export default defineConfig({
  site: "https://papyrus.marcelofelix.com",
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
  integrations: [
    papyrus(),
    sitemap({
      filter: shouldIncludeInSitemap,
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "css-variables",
      langs: [kamailioLang],
      langAlias: {
        kam: "kamailio",
      },
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerRemoveNotationEscape(),
        updateStyle(),
        addTitle(),
        addLanguage(),
        addCopyButton(2000),
        addCollapse(15),
      ],
    },
    processor: unified({
      remarkPlugins: [remarkArtifactLinks, remarkMermaidBlocks],
      rehypePlugins: [rehypeCallouts, rehypePapyrusCalloutIcons, rehypeTaskListLabels],
    }),
  },
});
