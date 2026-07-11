const BASE_URL = import.meta.env.BASE_URL ?? "/";

export function isInternalUrl(value?: string): boolean {
  if (!value) return false;
  return value.startsWith("/") && !value.startsWith("//");
}

function normalizeBase(base = BASE_URL): string {
  if (!base || base === "/") return "";
  return `/${base.replace(/^\/+|\/+$/g, "")}`;
}

export function stripBase(path: string, base = BASE_URL): string {
  if (!isInternalUrl(path)) return path;

  const normalizedBase = normalizeBase(base);
  if (!normalizedBase) return path;
  if (path === normalizedBase) return "/";
  if (!path.startsWith(`${normalizedBase}/`)) return path;

  return path.slice(normalizedBase.length) || "/";
}

export function stripLocale(path: string, locales: string[] = []): string {
  if (!isInternalUrl(path) || locales.length === 0) return path;

  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : path.slice(suffixIndex);
  const parts = pathname.split("/");
  if (locales.includes(parts[1])) {
    const stripped = `/${parts.slice(2).join("/")}`;
    const normalized = stripped === "/" ? "/" : stripped || "/";
    return `${normalized}${suffix}`;
  }

  return path;
}

export function withBase(path: string, base = BASE_URL): string {
  if (!isInternalUrl(path)) return path;

  const normalizedBase = normalizeBase(base);
  if (!normalizedBase) return path;
  if (path === normalizedBase || path.startsWith(`${normalizedBase}/`)) return path;

  return `${normalizedBase}${path}`;
}

export function getAssetPath(path: string, base = BASE_URL): string {
  return withBase(path, base);
}

export function getRelativeLocaleUrl(path: string, _locale?: string): string {
  return withBase(path);
}
