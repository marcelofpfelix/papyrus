import type { AstroIntegration } from "astro";
import type { AstroUserConfig, MarkdownConfig } from "astro/config";
import type { PapyrusSitemapFilterOptions } from "../sitemap.ts";

export type PapyrusAstroConfigOptions = {
  site?: string;
  configPath?: string;
  cwd?: string;
  integrations?: AstroIntegration[];
  sitemap?: Record<string, unknown>;
  sitemapFilter?: PapyrusSitemapFilterOptions;
  markdown?: Partial<MarkdownConfig>;
  experimental?: NonNullable<AstroUserConfig["experimental"]>;
  config?: Omit<AstroUserConfig, "site" | "experimental" | "integrations" | "markdown">;
};

export function definePapyrusAstroConfig(options?: PapyrusAstroConfigOptions): Promise<AstroUserConfig>;
