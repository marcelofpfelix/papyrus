export type PapyrusImageEffect = "none" | "duotone" | "tritone" | "dither" | "dithernoise";

const BASE_URL = import.meta.env?.BASE_URL ?? "/";

function withBase(path: string, base = BASE_URL): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (!base || base === "/") return path;
  const normalizedBase = `/${base.replace(/^\/+|\/+$/g, "")}`;
  if (path === normalizedBase || path.startsWith(`${normalizedBase}/`)) return path;
  return `${normalizedBase}${path}`;
}

export function isPapyrusImageEffect(value: unknown): value is PapyrusImageEffect {
  return value === "none" || value === "duotone" || value === "tritone" || value === "dither" || value === "dithernoise";
}

export function imageEffectClass(effect: PapyrusImageEffect | undefined): string | undefined {
  return !effect || effect === "none" ? undefined : `papyrus-image-effect-${effect}`;
}

export function ditherMaskPath(assetPath: string, mode: "dark" | "light" = "dark", effect: "dither" | "dithernoise" = "dither"): string {
  const cleanPath = assetPath.split(/[?#]/)[0]?.replace(/^\/+/, "") ?? "";
  const withoutExt = cleanPath.replace(/\.[a-z0-9]+$/i, "");
  const suffix = mode === "light" ? "-light" : "";
  return `/generated/${effect}/${withoutExt}${suffix}.png`;
}

export function imageEffectStyle(effect: PapyrusImageEffect | undefined, assetPath: string | undefined): string | undefined {
  if ((effect !== "dither" && effect !== "dithernoise") || !assetPath) return undefined;
  return [
    `--papyrus-dither-mask-dark: url("${withBase(ditherMaskPath(assetPath, "dark", effect))}")`,
    `--papyrus-dither-mask-light: url("${withBase(ditherMaskPath(assetPath, "light", effect))}")`,
  ].join("; ");
}
