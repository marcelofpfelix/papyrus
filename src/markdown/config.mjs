import { unified } from "@astrojs/markdown-remark";
import rehypeCallouts from "rehype-callouts";
import remarkArtifactLinks from "./remark-artifact-links.mjs";
import remarkMermaidBlocks from "./remark-mermaid-blocks.mjs";
import rehypePapyrusCalloutIcons from "./rehype-callout-icons.mjs";
import rehypeTaskListLabels from "./rehype-task-list-labels.mjs";
import {
  addCollapse,
  addCopyButton,
  addLanguage,
  addTitle,
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerRemoveNotationEscape,
  updateStyle,
} from "../shiki/index.mjs";

export function papyrusMarkdown(options = {}) {
  const shikiConfig = options.shikiConfig ?? {};

  return {
    processor: unified({
      remarkPlugins: [
        remarkArtifactLinks,
        remarkMermaidBlocks,
        ...(options.remarkPlugins ?? []),
      ],
      rehypePlugins: [
        rehypeCallouts,
        rehypePapyrusCalloutIcons,
        rehypeTaskListLabels,
        ...(options.rehypePlugins ?? []),
      ],
      ...options.processor,
    }),
    shikiConfig: {
      theme: "css-variables",
      ...shikiConfig,
      transformers: shikiConfig.transformers ?? [
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerRemoveNotationEscape(),
        updateStyle(),
        addTitle(),
        addLanguage(),
        addCopyButton(options.copyDuration ?? 2000),
        addCollapse(options.collapseLines ?? 15),
      ],
    },
  };
}
