import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "smol-toml";
import { defaultPapyrusFeatures, type PapyrusFeatureConfig } from "../utils/features.ts";

export type PapyrusLinkConfig = {
  href: string;
  label: string;
  icon?: string;
};

export type PapyrusProjectConfig = {
  title: string;
  description: string;
  href?: string;
  image?: string;
  links?: Array<PapyrusLinkConfig & { text?: string }>;
  status?: string;
  repo?: string;
  language?: string;
  stars?: number;
  pinned?: boolean | number;
};

export type PapyrusPostCardConfig = {
  tags: boolean;
  readTime: boolean;
  freshIndicators: boolean;
  freshIndicatorText: boolean;
  updatedDateOnly: boolean;
  limit?: number;
};

export type PapyrusSiteConfig = {
  title: string;
  description?: string;
  site?: string;
  lang: string;
  dir: "ltr" | "rtl" | "auto";
  timezone?: string;
  googleVerification?: string;
  brandTitle?: string;
  brandMark: "twinkle" | "terminal" | string;
  headerTitle?: string;
  showBrandTitle: boolean;
  defaultThemeProfile: string;
  defaultFontProfile: string;
  nav: PapyrusLinkConfig[];
  socialLinks: PapyrusLinkConfig[];
  projects: PapyrusProjectConfig[];
  features: Required<PapyrusFeatureConfig>;
  postCard: PapyrusPostCardConfig;
};

export type PapyrusConfigInput = Partial<Omit<PapyrusSiteConfig, "features" | "postCard" | "nav" | "socialLinks">> & {
  features?: PapyrusFeatureConfig;
  postCard?: Partial<PapyrusPostCardConfig>;
  nav?: PapyrusLinkConfig[];
  socialLinks?: PapyrusLinkConfig[];
  projects?: PapyrusProjectConfig[];
};

const defaultPostCard = {
  tags: true,
  readTime: true,
  freshIndicators: true,
  freshIndicatorText: true,
  updatedDateOnly: false,
} satisfies PapyrusPostCardConfig;

const defaultConfig = {
  title: "papyrus",
  lang: "en",
  dir: "ltr",
  brandMark: "twinkle",
  showBrandTitle: true,
  defaultThemeProfile: "gruvbox",
  defaultFontProfile: "readable",
  nav: [],
  socialLinks: [],
  projects: [],
  features: defaultPapyrusFeatures,
  postCard: defaultPostCard,
} satisfies PapyrusSiteConfig;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asLinks(value: unknown): PapyrusLinkConfig[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const record = asRecord(item);
    const href = asString(record.href);
    const label = asString(record.label);
    if (!href || !label) return [];
    const icon = asString(record.icon);
    return [{ href, label, ...(icon ? { icon } : {}) }];
  });
}

function asProjectLinks(value: unknown): Array<PapyrusLinkConfig & { text?: string }> {
  return asLinks(value).map((link, index) => {
    const record = Array.isArray(value) ? asRecord(value[index]) : {};
    return {
      ...link,
      ...(asString(record.text) ? { text: asString(record.text) } : {}),
    };
  });
}

function asProjects(value: unknown): PapyrusProjectConfig[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const record = asRecord(item);
    const title = asString(record.title);
    const description = asString(record.description);
    if (!title || !description) return [];

    return [{
      title,
      description,
      ...(asString(record.href) ? { href: asString(record.href) } : {}),
      ...(asString(record.image) ? { image: asString(record.image) } : {}),
      ...(asProjectLinks(record.links).length ? { links: asProjectLinks(record.links) } : {}),
      ...(asString(record.status) ? { status: asString(record.status) } : {}),
      ...(asString(record.repo) ? { repo: asString(record.repo) } : {}),
      ...(asString(record.language) ? { language: asString(record.language) } : {}),
      ...(asNumber(record.stars) !== undefined ? { stars: asNumber(record.stars) } : {}),
      ...(asBoolean(record.pinned) !== undefined || asNumber(record.pinned) !== undefined ? { pinned: asBoolean(record.pinned) ?? asNumber(record.pinned) } : {}),
    }];
  });
}

function readFeatureConfig(record: Record<string, unknown>): PapyrusFeatureConfig {
  return Object.fromEntries(
    Object.keys(defaultPapyrusFeatures).flatMap((key) => {
      const value = asBoolean(record[key]);
      return value === undefined ? [] : [[key, value]];
    })
  ) as PapyrusFeatureConfig;
}

function readPostCardConfig(record: Record<string, unknown>): Partial<PapyrusPostCardConfig> {
  return {
    ...(asBoolean(record.tags) !== undefined ? { tags: asBoolean(record.tags) } : {}),
    ...(asBoolean(record.readTime ?? record.read_time) !== undefined ? { readTime: asBoolean(record.readTime ?? record.read_time) } : {}),
    ...(asBoolean(record.freshIndicators ?? record.fresh_indicators) !== undefined ? { freshIndicators: asBoolean(record.freshIndicators ?? record.fresh_indicators) } : {}),
    ...(asBoolean(record.freshIndicatorText ?? record.fresh_indicator_text) !== undefined ? { freshIndicatorText: asBoolean(record.freshIndicatorText ?? record.fresh_indicator_text) } : {}),
    ...(asBoolean(record.updatedDateOnly ?? record.updated_date_only) !== undefined ? { updatedDateOnly: asBoolean(record.updatedDateOnly ?? record.updated_date_only) } : {}),
    ...(asNumber(record.limit) !== undefined ? { limit: asNumber(record.limit) } : {}),
  };
}

export function definePapyrusConfig(config: PapyrusConfigInput): PapyrusSiteConfig {
  return resolvePapyrusConfig(config);
}

export function resolvePapyrusConfig(config: PapyrusConfigInput = {}): PapyrusSiteConfig {
  return {
    ...defaultConfig,
    ...config,
    nav: config.nav ?? defaultConfig.nav,
    socialLinks: config.socialLinks ?? defaultConfig.socialLinks,
    projects: config.projects ?? defaultConfig.projects,
    features: {
      ...defaultPapyrusFeatures,
      ...(config.features ?? {}),
    },
    postCard: {
      ...defaultPostCard,
      ...(config.postCard ?? {}),
    },
  };
}

export function parsePapyrusConfigToml(source: string): PapyrusSiteConfig {
  const parsed = asRecord(parse(source));
  const site = asRecord(parsed.site);
  const brand = asRecord(parsed.brand);
  const theme = asRecord(parsed.theme);
  const seo = asRecord(parsed.seo);

  return resolvePapyrusConfig({
    title: asString(site.title ?? parsed.title),
    description: asString(site.description ?? parsed.description),
    site: asString(site.url ?? site.site ?? parsed.site),
    lang: asString(site.lang ?? parsed.lang),
    dir: (asString(site.dir ?? parsed.dir) as PapyrusSiteConfig["dir"] | undefined),
    timezone: asString(site.timezone ?? parsed.timezone),
    googleVerification: asString(seo.googleVerification ?? seo.google_verification ?? parsed.googleVerification ?? parsed.google_verification),
    brandTitle: asString(brand.title ?? parsed.brandTitle ?? parsed.brand_title),
    brandMark: asString(brand.mark ?? parsed.brandMark ?? parsed.brand_mark),
    headerTitle: asString(brand.headerTitle ?? brand.header_title ?? parsed.headerTitle ?? parsed.header_title),
    showBrandTitle: asBoolean(brand.showTitle ?? brand.show_title ?? parsed.showBrandTitle ?? parsed.show_brand_title),
    defaultThemeProfile: asString(theme.profile ?? theme.defaultThemeProfile ?? theme.default_theme_profile ?? parsed.defaultThemeProfile ?? parsed.default_theme_profile),
    defaultFontProfile: asString(theme.fontProfile ?? theme.font_profile ?? parsed.defaultFontProfile ?? parsed.default_font_profile),
    nav: asLinks(parsed.nav),
    socialLinks: asLinks(parsed.social ?? parsed.socialLinks ?? parsed.social_links),
    projects: asProjects(parsed.project ?? parsed.projects),
    features: readFeatureConfig(asRecord(parsed.features)),
    postCard: readPostCardConfig(asRecord(parsed.post_card ?? parsed.postCard)),
  });
}

export async function loadPapyrusConfig(path = "papyrus.config.toml", cwd = process.cwd()): Promise<PapyrusSiteConfig> {
  let source: string;
  try {
    source = await readFile(resolve(cwd, path), "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return resolvePapyrusConfig();
    }
    throw error;
  }
  return parsePapyrusConfigToml(source);
}
