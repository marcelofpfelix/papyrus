import sitemap from "@astrojs/sitemap";
import { defineConfig, svgoOptimizer } from "astro/config";
import { loadPapyrusConfig } from "../../lib/config/index.js";
import papyrus from "../../lib/integration.js";
import { papyrusMarkdown } from "../markdown/config.mjs";
import { createPapyrusSitemapFilter } from "../sitemap.mjs";
import { deploymentSiteUrl } from "./site-url.mjs";

export async function definePapyrusAstroConfig(options = {}) {
  const siteConfig = await loadPapyrusConfig(options.configPath, options.cwd);
  const site = deploymentSiteUrl(options.site ?? siteConfig.site);
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
      ...(options.plugins ?? []),
      sitemap(sitemapOptions),
      ...(options.integrations ?? []),
    ],
    markdown: papyrusMarkdown(options.markdown),
    ...(options.config ?? {}),
  });
}
