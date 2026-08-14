import sitemap from "@astrojs/sitemap";
import { defineConfig, svgoOptimizer } from "astro/config";
import { loadPapyrusConfig } from "../config/index.mjs";
import papyrus from "../integration.mjs";
import { papyrusMarkdown } from "../markdown/config.mjs";
import { createPapyrusSitemapFilter } from "../sitemap.mjs";

export async function definePapyrusAstroConfig(options = {}) {
  const siteConfig = await loadPapyrusConfig(options.configPath, options.cwd);
  const site = options.site ?? siteConfig.site;
  const sitemapOptions = {
    ...(options.sitemap ?? {}),
    filter: createPapyrusSitemapFilter(options.sitemapFilter),
  };

  return defineConfig({
    site,
    experimental: {
      svgOptimizer: svgoOptimizer(),
      ...(options.experimental ?? {}),
    },
    integrations: [
      papyrus(),
      sitemap(sitemapOptions),
      ...(options.integrations ?? []),
    ],
    markdown: papyrusMarkdown(options.markdown),
    ...(options.config ?? {}),
  });
}
