import { defineConfig, svgoOptimizer } from "astro/config";
import sitemap from "@astrojs/sitemap";
import papyrus from "./src/integration";
import { papyrusMarkdown } from "./src/markdown/config.mjs";
import {
  papyrusBasePath,
  papyrusLinkValidator,
  papyrusMdTxt,
  papyrusSiteGraph,
} from "./src/plugins/index.mjs";
import { createPapyrusSitemapFilter } from "./src/sitemap";
import { deploymentSiteUrl } from "./src/astro/site-url.mjs";

const site = deploymentSiteUrl("https://papyrus.marcelofelix.com");

export default defineConfig({
  site,
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
  integrations: [
    papyrus(),
    papyrusBasePath(),
    papyrusMdTxt(),
    papyrusSiteGraph(),
    papyrusLinkValidator(),
    sitemap({
      filter: createPapyrusSitemapFilter(),
    }),
  ],
  markdown: papyrusMarkdown(),
});
