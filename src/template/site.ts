import { loadPaperConfig } from "../config";

export async function getTemplateSite() {
  const site = await loadPaperConfig();
  return {
    ...site,
    brandMark: site.brandMark === "terminal" ? "terminal" : "twinkle",
  } as const;
}
