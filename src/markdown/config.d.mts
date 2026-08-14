import type { AstroUserConfig } from "astro";

type MarkdownConfig = NonNullable<AstroUserConfig["markdown"]>;

export type PapyrusMarkdownOptions = {
  processor?: Record<string, unknown>;
  remarkPlugins?: unknown[];
  rehypePlugins?: unknown[];
  shikiConfig?: MarkdownConfig["shikiConfig"];
  copyDuration?: number;
  collapseLines?: number;
};

export function papyrusMarkdown(options?: PapyrusMarkdownOptions): MarkdownConfig;
