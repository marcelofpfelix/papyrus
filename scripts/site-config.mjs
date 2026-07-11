import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "smol-toml";

function stringField(text, key) {
  return text.match(new RegExp(`${key}:\\s*["']([^"']+)["']`))?.[1];
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function stringValue(value) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

async function tomlConfig(cwd) {
  const text = await readFile(resolve(cwd, "paper.config.toml"), "utf8");
  const parsed = asRecord(parse(text));
  const site = asRecord(parsed.site);
  const brand = asRecord(parsed.brand);
  const theme = asRecord(parsed.theme);
  const seo = asRecord(parsed.seo);

  return {
    title: stringValue(site.title ?? parsed.title),
    description: stringValue(site.description ?? parsed.description),
    site: stringValue(site.url ?? site.site ?? parsed.site),
    lang: stringValue(site.lang ?? parsed.lang),
    dir: stringValue(site.dir ?? parsed.dir),
    timezone: stringValue(site.timezone ?? parsed.timezone),
    googleVerification: stringValue(seo.googleVerification ?? seo.google_verification ?? parsed.googleVerification ?? parsed.google_verification),
    brandTitle: stringValue(brand.title ?? parsed.brandTitle ?? parsed.brand_title),
    brandMark: stringValue(brand.mark ?? parsed.brandMark ?? parsed.brand_mark),
    headerTitle: stringValue(brand.headerTitle ?? brand.header_title ?? parsed.headerTitle ?? parsed.header_title),
    defaultThemeProfile: stringValue(theme.profile ?? theme.defaultThemeProfile ?? theme.default_theme_profile ?? parsed.defaultThemeProfile ?? parsed.default_theme_profile),
    defaultFontProfile: stringValue(theme.fontProfile ?? theme.font_profile ?? parsed.defaultFontProfile ?? parsed.default_font_profile),
  };
}

export async function siteConfig(cwd = process.cwd()) {
  try {
    return await tomlConfig(cwd);
  } catch {
    // Fall back to the legacy TS config shape while consuming sites migrate.
  }

  try {
    const text = await readFile(resolve(cwd, "src/site.config.ts"), "utf8");
    return {
      title: stringField(text, "title"),
      headerTitle: stringField(text, "headerTitle"),
      defaultThemeProfile: stringField(text, "defaultThemeProfile"),
      defaultFontProfile: stringField(text, "defaultFontProfile"),
      brandTitle: stringField(text, "brandTitle"),
      brandMark: stringField(text, "brandMark"),
    };
  } catch {
    return {};
  }
}

export function configuredBrand(config) {
  const title = config.brandTitle ?? config.headerTitle ?? config.title ?? "papyrus";
  const mark = config.brandMark ?? (config.headerTitle ? "terminal" : "twinkle");
  return { mark, title };
}
