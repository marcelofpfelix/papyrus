import { loadPapyrusConfig } from "../config";

export async function getTemplateSite() {
  const site = await loadPapyrusConfig();
  return {
    ...site,
    brandMark: site.brandMark === "terminal" ? "terminal" : "twinkle",
  } as const;
}
