import { parseFrontmatter as parseAstroFrontmatter } from "@astrojs/markdown-remark";

export function parseFrontmatter(source) {
  const { frontmatter, content } = parseAstroFrontmatter(source);
  return { data: frontmatter, body: content };
}

export function frontmatterTags(value) {
  if (Array.isArray(value)) return value.map(String).map(tag => tag.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map(tag => tag.trim()).filter(Boolean);
  return [];
}
