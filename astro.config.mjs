import { defineConfig, svgoOptimizer } from "astro/config";
import sitemap from "@astrojs/sitemap";
import papyrus from "./src/integration";
import kamailioLang from "./src/shiki/langs/kamailio.mjs";
import { papyrusMarkdown } from "./src/markdown/config.mjs";
import { createPapyrusSitemapFilter } from "./src/sitemap";

const site = process.env.SITE_URL ?? process.env.CF_PAGES_URL ?? "https://papyrus.marcelofelix.com";

export default defineConfig({
  site,
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
  integrations: [
    papyrus(),
    sitemap({
      filter: createPapyrusSitemapFilter(),
    }),
  ],
  markdown: papyrusMarkdown({
    shikiConfig: {
      langs: [kamailioLang],
      langAlias: {
        kam: "kamailio",
      },
    },
  }),
});
