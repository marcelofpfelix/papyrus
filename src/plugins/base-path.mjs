import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { visit } from "unist-util-visit";

// Adapted from starlight-base-path v0.2.1 (MIT), remark.ts and index.ts.
export function normalizeBase(base = "/") {
  let normalized = base || "/";
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (!normalized.endsWith("/")) normalized = `${normalized}/`;
  return normalized;
}

export function remarkPapyrusBasePath({ base = "/" } = {}) {
  const normalizedBase = normalizeBase(base);
  return (tree) => {
    visit(tree, ["link", "image", "definition"], (node) => {
      if (!node.url.startsWith("/") || node.url.startsWith("//")) return;
      if (normalizedBase !== "/" && node.url.startsWith(normalizedBase)) return;
      node.url = normalizedBase === "/" ? node.url : normalizedBase + node.url.slice(1);
    });
  };
}

export function satteriPapyrusBasePath(base = "/") {
  const normalizedBase = normalizeBase(base);
  const rewrite = (node, context) => {
    if (!node.url.startsWith("/") || node.url.startsWith("//")) return;
    if (normalizedBase !== "/" && node.url.startsWith(normalizedBase)) return;
    context.setProperty(node, "url", normalizedBase === "/" ? node.url : normalizedBase + node.url.slice(1));
  };
  return {
    name: "astro-papyrus-base-path",
    link: rewrite,
    image: rewrite,
    definition: rewrite,
  };
}

const nativeImport = new Function("url", "return import(url)");

async function loadMarkdownRemark(root) {
  try {
    const requireFromRoot = createRequire(new URL("package.json", root));
    const requireFromAstro = createRequire(requireFromRoot.resolve("astro"));
    return await nativeImport(pathToFileURL(requireFromAstro.resolve("@astrojs/markdown-remark")).href);
  } catch {
    return null;
  }
}

export function papyrusBasePath() {
  return {
    name: "astro-papyrus-base-path",
    hooks: {
      async "astro:config:setup"({ config, logger, updateConfig }) {
        const markdownRemark = await loadMarkdownRemark(config.root);
        const processor = config.markdown.processor;
        const remarkPlugin = [remarkPapyrusBasePath, { base: config.base }];

        if (processor && markdownRemark?.isUnifiedProcessor?.(processor)) {
          processor.options.remarkPlugins.push(remarkPlugin);
          updateConfig({ markdown: { processor } });
          return;
        }
        if (processor?.name === "satteri" && Array.isArray(processor.options?.mdastPlugins)) {
          processor.options.mdastPlugins.push(satteriPapyrusBasePath(config.base));
          updateConfig({ markdown: { processor } });
          return;
        }
        if (processor) {
          logger.warn(`Unsupported Markdown processor (${processor.name}); Papyrus base-path rewriting was not installed.`);
          return;
        }
        updateConfig({ markdown: { remarkPlugins: [remarkPlugin] } });
      },
    },
  };
}
