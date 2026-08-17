import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "smol-toml";
import { defaultPapyrusFeatures, type PapyrusFeatureConfig } from "../utils/features.ts";
import { isPapyrusImageEffect, type PapyrusImageEffect } from "../utils/image-effects.ts";

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

export type PapyrusMarkdownLinkStyle = "accent" | "underline" | "accent-underline" | "accent-hover-underline";
export type PapyrusMarkdownHeadingStyle = "plain" | "accent" | "muted-accent";
export type PapyrusMarkdownMarkerStyle = "plain" | "muted" | "accent";
export type PapyrusMarkdownBlockquoteStyle = "muted-bar" | "accent-bar" | "panel";
export type PapyrusMarkdownTableStyle = "none" | "horizontal" | "grid";
export type PapyrusMarkdownTableHeaderStyle = "plain" | "muted" | "panel";
export type PapyrusMarkdownInlineCodeStyle = "plain" | "panel" | "accent-soft";

export type PapyrusMarkdownStyleConfig = {
  linkStyle: PapyrusMarkdownLinkStyle;
  headingStyle: PapyrusMarkdownHeadingStyle;
  markerStyle: PapyrusMarkdownMarkerStyle;
  blockquoteStyle: PapyrusMarkdownBlockquoteStyle;
  tableStyle: PapyrusMarkdownTableStyle;
  tableHeaderStyle: PapyrusMarkdownTableHeaderStyle;
  inlineCodeStyle: PapyrusMarkdownInlineCodeStyle;
};

export type PapyrusHomeConfig = {
  projectLimit: number;
};

export type PapyrusProfileImagesConfig = {
  effect: PapyrusImageEffect;
};

export type PapyrusProfileConfig = {
  images: PapyrusProfileImagesConfig;
};

export type PapyrusProfileConfigInput = {
  images?: Partial<PapyrusProfileImagesConfig>;
};

export type PapyrusSourceConfig = {
  repo?: string;
  branch?: string;
};

export type PapyrusVerificationConfig = {
  name: string;
  content: string;
};

export type PapyrusAnalyticsProvider = "ga4" | "plausible" | "umami" | "goatcounter" | "custom";

export type PapyrusAnalyticsConfig = {
  enabled: boolean;
  provider?: PapyrusAnalyticsProvider;
  id?: string;
  domain?: string;
  src?: string;
  includeInDev: boolean;
};

export type PapyrusCommentsConfig = {
  enabled: boolean;
  provider: "giscus";
  repo?: string;
  repoId?: string;
  category?: string;
  categoryId?: string;
  mapping: "pathname" | "url" | "title" | "og:title" | "specific" | "number";
  term?: string;
  number?: number;
  description?: string;
  backLink?: string;
  strict: boolean;
  reactionsEnabled: boolean;
  emitMetadata: boolean;
  inputPosition: "top" | "bottom";
  theme: string;
  lightTheme: string;
  darkTheme: string;
  lang: string;
  loading: "lazy" | "eager";
};

export type PapyrusHeadMetaConfig = {
  name?: string;
  property?: string;
  content: string;
};

export type PapyrusHeadLinkConfig = {
  rel: string;
  href: string;
  type?: string;
  title?: string;
};

export type PapyrusHeadScriptConfig = {
  src: string;
  async?: boolean;
  defer?: boolean;
};

export type PapyrusHeadConfig = {
  meta: PapyrusHeadMetaConfig[];
  links: PapyrusHeadLinkConfig[];
  scripts: PapyrusHeadScriptConfig[];
};

export type PapyrusSecurityTxtConfig = {
  contacts: string[];
  expires?: string;
  preferredLanguages?: string;
  canonical?: string;
  policy?: string;
  acknowledgments?: string;
  encryption?: string;
  hiring?: string;
};

export type PapyrusPageConfig = {
  content?: string;
  description?: string | false;
};

export type PapyrusSiteConfig = {
  title: string;
  homeTitle?: string;
  description?: string;
  site?: string;
  lang: string;
  dir: "ltr" | "rtl" | "auto";
  timezone?: string;
  googleVerification?: string;
  verification: PapyrusVerificationConfig[];
  analytics: PapyrusAnalyticsConfig;
  comments: PapyrusCommentsConfig;
  head: PapyrusHeadConfig;
  securityTxt: PapyrusSecurityTxtConfig;
  brandTitle?: string;
  brandMark: "twinkle" | "terminal" | string;
  headerTitle?: string;
  showBrandTitle: boolean;
  defaultThemeProfile: string;
  defaultFontProfile: string;
  nav: PapyrusLinkConfig[];
  footerLinks: PapyrusLinkConfig[];
  socialLinks: PapyrusLinkConfig[];
  projects: PapyrusProjectConfig[];
  home: PapyrusHomeConfig;
  profile: PapyrusProfileConfig;
  markdown: PapyrusMarkdownStyleConfig;
  pages: Record<string, PapyrusPageConfig>;
  source: PapyrusSourceConfig;
  features: Required<PapyrusFeatureConfig>;
  postCard: PapyrusPostCardConfig;
};

export type PapyrusConfigInput = Partial<Omit<PapyrusSiteConfig, "features" | "postCard" | "home" | "profile" | "markdown" | "nav" | "footerLinks" | "socialLinks" | "source" | "analytics" | "comments" | "head" | "securityTxt">> & {
  features?: PapyrusFeatureConfig;
  postCard?: Partial<PapyrusPostCardConfig>;
  home?: Partial<PapyrusHomeConfig>;
  profile?: PapyrusProfileConfigInput;
  markdown?: Partial<PapyrusMarkdownStyleConfig>;
  nav?: PapyrusLinkConfig[];
  footerLinks?: PapyrusLinkConfig[];
  socialLinks?: PapyrusLinkConfig[];
  projects?: PapyrusProjectConfig[];
  pages?: Record<string, PapyrusPageConfig>;
  source?: PapyrusSourceConfig;
  analytics?: Partial<PapyrusAnalyticsConfig>;
  comments?: Partial<PapyrusCommentsConfig>;
  head?: Partial<PapyrusHeadConfig>;
  securityTxt?: Partial<PapyrusSecurityTxtConfig>;
};

const defaultPostCard = {
  tags: false,
  readTime: false,
  freshIndicators: true,
  freshIndicatorText: true,
  updatedDateOnly: true,
  limit: 20,
} satisfies PapyrusPostCardConfig;

const defaultHome = {
  projectLimit: 2,
} satisfies PapyrusHomeConfig;

const defaultProfile = {
  images: {
    effect: "none",
  },
} satisfies PapyrusProfileConfig;

const defaultMarkdown = {
  linkStyle: "accent-hover-underline",
  headingStyle: "plain",
  markerStyle: "accent",
  blockquoteStyle: "accent-bar",
  tableStyle: "horizontal",
  tableHeaderStyle: "muted",
  inlineCodeStyle: "panel",
} satisfies PapyrusMarkdownStyleConfig;

const defaultAnalytics = {
  enabled: false,
  includeInDev: false,
} satisfies PapyrusAnalyticsConfig;

const defaultComments = {
  enabled: false,
  provider: "giscus",
  mapping: "pathname",
  strict: false,
  reactionsEnabled: true,
  emitMetadata: false,
  inputPosition: "bottom",
  theme: "preferred_color_scheme",
  lightTheme: "light",
  darkTheme: "dark_dimmed",
  lang: "en",
  loading: "lazy",
} satisfies PapyrusCommentsConfig;

const defaultHead = {
  meta: [],
  links: [],
  scripts: [],
} satisfies PapyrusHeadConfig;

const defaultPages: Record<string, PapyrusPageConfig> = {
  posts: { description: false },
  timeline: { description: false },
  tags: { description: false },
  search: { description: false },
  projects: { description: false },
  about: { description: false },
};

const defaultConfig = {
  title: "papyrus",
  lang: "en",
  dir: "ltr",
  brandMark: "twinkle",
  showBrandTitle: true,
  defaultThemeProfile: "gruvbox",
  defaultFontProfile: "readable",
  nav: [],
  footerLinks: [],
  socialLinks: [],
  projects: [],
  home: defaultHome,
  profile: defaultProfile,
  markdown: defaultMarkdown,
  pages: defaultPages,
  source: {},
    verification: [],
    analytics: defaultAnalytics,
    comments: defaultComments,
    head: defaultHead,
  securityTxt: { contacts: [] },
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

function asImageEffect(value: unknown): PapyrusImageEffect | undefined {
  return isPapyrusImageEffect(value) ? value : undefined;
}

function enumValue<const T extends readonly string[]>(value: unknown, allowed: T): T[number] | undefined {
  return typeof value === "string" && allowed.includes(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  const single = asString(value);
  if (single) return [single];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const text = asString(item);
    return text ? [text] : [];
  });
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

function asPageConfig(value: unknown): PapyrusPageConfig {
  const record = asRecord(value);
  const description = record.description;
  return {
    ...(asString(record.content) ? { content: asString(record.content) } : {}),
    ...(description === false ? { description: false as const } : {}),
    ...(asString(description) ? { description: asString(description) } : {}),
  };
}

function asSourceConfig(value: unknown): PapyrusSourceConfig {
  const record = asRecord(value);
  return {
    ...(asString(record.repo) ? { repo: asString(record.repo) } : {}),
    ...(asString(record.branch) ? { branch: asString(record.branch) } : {}),
  };
}

function asVerificationConfig(value: unknown): PapyrusVerificationConfig[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = asRecord(item);
    const name = asString(record.name);
    const content = asString(record.content);
    if (!name || !content) return [];
    return [{ name, content }];
  });
}

function asAnalyticsProvider(value: unknown): PapyrusAnalyticsProvider | undefined {
  const provider = asString(value);
  return provider && ["ga4", "plausible", "umami", "goatcounter", "custom"].includes(provider)
    ? provider as PapyrusAnalyticsProvider
    : undefined;
}

function asAnalyticsConfig(value: unknown): Partial<PapyrusAnalyticsConfig> {
  const record = asRecord(value);
  const id = asString(record.id ?? record.measurement_id ?? record.website_id ?? record.code);
  return {
    ...(asBoolean(record.enabled) !== undefined ? { enabled: asBoolean(record.enabled)! } : {}),
    ...(asAnalyticsProvider(record.provider) ? { provider: asAnalyticsProvider(record.provider) } : {}),
    ...(id ? { id } : {}),
    ...(asString(record.domain) ? { domain: asString(record.domain) } : {}),
    ...(asString(record.src ?? record.script) ? { src: asString(record.src ?? record.script) } : {}),
    ...(asBoolean(record.includeInDev ?? record.include_in_dev) !== undefined ? { includeInDev: asBoolean(record.includeInDev ?? record.include_in_dev)! } : {}),
  };
}

function asCommentsConfig(value: unknown): Partial<PapyrusCommentsConfig> {
  const record = asRecord(value);
  const provider = asString(record.provider);
  const mapping = enumValue(record.mapping, ["pathname", "url", "title", "og:title", "specific", "number"] as const);
  const inputPosition = enumValue(record.inputPosition ?? record.input_position, ["top", "bottom"] as const);
  const loading = enumValue(record.loading, ["lazy", "eager"] as const);
  const strict = asBoolean(record.strict ?? record.strict_title_matching);
  const reactionsEnabled = asBoolean(record.reactionsEnabled ?? record.reactions_enabled);
  const emitMetadata = asBoolean(record.emitMetadata ?? record.emit_metadata);
  return {
    ...(asBoolean(record.enabled) !== undefined ? { enabled: asBoolean(record.enabled)! } : {}),
    ...(provider === "giscus" ? { provider } : {}),
    ...(asString(record.repo) ? { repo: asString(record.repo) } : {}),
    ...(asString(record.repoId ?? record.repo_id) ? { repoId: asString(record.repoId ?? record.repo_id) } : {}),
    ...(asString(record.category) ? { category: asString(record.category) } : {}),
    ...(asString(record.categoryId ?? record.category_id) ? { categoryId: asString(record.categoryId ?? record.category_id) } : {}),
    ...(mapping ? { mapping } : {}),
    ...(asString(record.term) ? { term: asString(record.term) } : {}),
    ...(typeof record.number === "number" ? { number: record.number } : {}),
    ...(asString(record.description) ? { description: asString(record.description) } : {}),
    ...(asString(record.backLink ?? record.back_link) ? { backLink: asString(record.backLink ?? record.back_link) } : {}),
    ...(strict !== undefined ? { strict } : {}),
    ...(reactionsEnabled !== undefined ? { reactionsEnabled } : {}),
    ...(emitMetadata !== undefined ? { emitMetadata } : {}),
    ...(inputPosition ? { inputPosition } : {}),
    ...(asString(record.theme) ? { theme: asString(record.theme) } : {}),
    ...(asString(record.lightTheme ?? record.light_theme) ? { lightTheme: asString(record.lightTheme ?? record.light_theme) } : {}),
    ...(asString(record.darkTheme ?? record.dark_theme) ? { darkTheme: asString(record.darkTheme ?? record.dark_theme) } : {}),
    ...(asString(record.lang) ? { lang: asString(record.lang) } : {}),
    ...(loading ? { loading } : {}),
  };
}

function asHeadConfig(value: unknown): Partial<PapyrusHeadConfig> {
  const record = asRecord(value);
  const linkInput = record.link ?? record.links;
  const scriptInput = record.script ?? record.scripts;
  const meta = Array.isArray(record.meta)
    ? record.meta.flatMap((item) => {
      const entry = asRecord(item);
      const content = asString(entry.content);
      const name = asString(entry.name);
      const property = asString(entry.property);
      if (!content || (!name && !property)) return [];
      return [{ ...(name ? { name } : {}), ...(property ? { property } : {}), content }];
    })
    : [];
  const links = Array.isArray(linkInput)
    ? linkInput.flatMap((item) => {
      const entry = asRecord(item);
      const rel = asString(entry.rel);
      const href = asString(entry.href);
      if (!rel || !href) return [];
      return [{
        rel,
        href,
        ...(asString(entry.type) ? { type: asString(entry.type) } : {}),
        ...(asString(entry.title) ? { title: asString(entry.title) } : {}),
      }];
    })
    : [];
  const scripts = Array.isArray(scriptInput)
    ? scriptInput.flatMap((item) => {
      const entry = asRecord(item);
      const src = asString(entry.src);
      if (!src) return [];
      return [{
        src,
        ...(asBoolean(entry.async) !== undefined ? { async: asBoolean(entry.async) } : {}),
        ...(asBoolean(entry.defer) !== undefined ? { defer: asBoolean(entry.defer) } : {}),
      }];
    })
    : [];

  return {
    ...(meta.length ? { meta } : {}),
    ...(links.length ? { links } : {}),
    ...(scripts.length ? { scripts } : {}),
  };
}

function asSecurityTxtConfig(value: unknown): PapyrusSecurityTxtConfig {
  const record = asRecord(value);
  return {
    contacts: asStringArray(record.contact ?? record.contacts),
    ...(asString(record.expires) ? { expires: asString(record.expires) } : {}),
    ...(asString(record.preferredLanguages ?? record.preferred_languages) ? { preferredLanguages: asString(record.preferredLanguages ?? record.preferred_languages) } : {}),
    ...(asString(record.canonical) ? { canonical: asString(record.canonical) } : {}),
    ...(asString(record.policy) ? { policy: asString(record.policy) } : {}),
    ...(asString(record.acknowledgments) ? { acknowledgments: asString(record.acknowledgments) } : {}),
    ...(asString(record.encryption) ? { encryption: asString(record.encryption) } : {}),
    ...(asString(record.hiring) ? { hiring: asString(record.hiring) } : {}),
  };
}

function asPages(value: unknown): Record<string, PapyrusPageConfig> {
  const record = asRecord(value);
  return Object.fromEntries(
    Object.entries(record).map(([key, page]) => [key, asPageConfig(page)])
  );
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

function readHomeConfig(record: Record<string, unknown>): Partial<PapyrusHomeConfig> {
  return {
    ...(asNumber(record.projectLimit ?? record.project_limit ?? record.project_count ?? record.projects) !== undefined
      ? { projectLimit: asNumber(record.projectLimit ?? record.project_limit ?? record.project_count ?? record.projects) }
      : {}),
  };
}

function readProfileConfig(record: Record<string, unknown>): PapyrusProfileConfigInput {
  const images = asRecord(record.images);
  return {
    images: {
      ...(asImageEffect(images.effect) ? { effect: asImageEffect(images.effect) } : {}),
    },
  };
}

function readMarkdownConfig(record: Record<string, unknown>): Partial<PapyrusMarkdownStyleConfig> {
  const linkStyle = enumValue(record.linkStyle ?? record.link_style, ["accent", "underline", "accent-underline", "accent-hover-underline"] as const);
  const headingStyle = enumValue(record.headingStyle ?? record.heading_style, ["plain", "accent", "muted-accent"] as const);
  const markerStyle = enumValue(record.markerStyle ?? record.marker_style, ["plain", "muted", "accent"] as const);
  const blockquoteStyle = enumValue(record.blockquoteStyle ?? record.blockquote_style, ["muted-bar", "accent-bar", "panel"] as const);
  const tableStyle = enumValue(record.tableStyle ?? record.table_style, ["none", "horizontal", "grid"] as const);
  const tableHeaderStyle = enumValue(record.tableHeaderStyle ?? record.table_header_style, ["plain", "muted", "panel"] as const);
  const inlineCodeStyle = enumValue(record.inlineCodeStyle ?? record.inline_code_style, ["plain", "panel", "accent-soft"] as const);
  return {
    ...(linkStyle ? { linkStyle } : {}),
    ...(headingStyle ? { headingStyle } : {}),
    ...(markerStyle ? { markerStyle } : {}),
    ...(blockquoteStyle ? { blockquoteStyle } : {}),
    ...(tableStyle ? { tableStyle } : {}),
    ...(tableHeaderStyle ? { tableHeaderStyle } : {}),
    ...(inlineCodeStyle ? { inlineCodeStyle } : {}),
  };
}

function mergePages(pages: Record<string, PapyrusPageConfig> = {}): Record<string, PapyrusPageConfig> {
  return Object.fromEntries(
    Array.from(new Set([...Object.keys(defaultConfig.pages), ...Object.keys(pages)])).map((key) => [
      key,
      {
        ...(defaultConfig.pages[key] ?? {}),
        ...(pages[key] ?? {}),
      },
    ])
  );
}

export function definePapyrusConfig(config: PapyrusConfigInput): PapyrusSiteConfig {
  return resolvePapyrusConfig(config);
}

export function resolvePapyrusConfig(config: PapyrusConfigInput = {}): PapyrusSiteConfig {
  return {
    ...defaultConfig,
    ...config,
    nav: config.nav ?? defaultConfig.nav,
    footerLinks: config.footerLinks ?? defaultConfig.footerLinks,
    socialLinks: config.socialLinks ?? defaultConfig.socialLinks,
    projects: config.projects ?? defaultConfig.projects,
    home: {
      ...defaultHome,
      ...(config.home ?? {}),
    },
    profile: {
      ...defaultProfile,
      ...(config.profile ?? {}),
      images: {
        ...defaultProfile.images,
        ...(config.profile?.images ?? {}),
      },
    },
    markdown: {
      ...defaultMarkdown,
      ...(config.markdown ?? {}),
    },
    pages: mergePages(config.pages),
    source: config.source ?? defaultConfig.source,
    verification: [
      ...(config.googleVerification ? [{ name: "google-site-verification", content: config.googleVerification }] : []),
      ...(config.verification ?? defaultConfig.verification),
    ].filter((item, index, items) => items.findIndex(other => other.name === item.name && other.content === item.content) === index),
    analytics: {
      ...defaultAnalytics,
      ...(config.analytics ?? {}),
    },
    comments: {
      ...defaultComments,
      ...(config.comments ?? {}),
    },
    head: {
      meta: config.head?.meta ?? defaultHead.meta,
      links: config.head?.links ?? defaultHead.links,
      scripts: config.head?.scripts ?? defaultHead.scripts,
    },
    securityTxt: {
      ...defaultConfig.securityTxt,
      ...(config.securityTxt ?? {}),
    },
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
  const verification = asRecord(parsed.verification);
  const sourceConfig = asRecord(parsed.source);
  const home = asRecord(parsed.home);
  const profile = asRecord(parsed.profile);
  const markdown = asRecord(parsed.markdown);
  const security = asRecord(parsed.security_txt ?? parsed.securityTxt ?? parsed.security);

  return resolvePapyrusConfig({
    title: asString(site.title ?? parsed.title),
    homeTitle: asString(site.homeTitle ?? site.home_title ?? parsed.homeTitle ?? parsed.home_title),
    description: asString(site.description ?? parsed.description),
    site: asString(site.url ?? site.site ?? parsed.site),
    lang: asString(site.lang ?? parsed.lang),
    dir: (asString(site.dir ?? parsed.dir) as PapyrusSiteConfig["dir"] | undefined),
    timezone: asString(site.timezone ?? parsed.timezone),
    googleVerification: asString(seo.googleVerification ?? seo.google_verification ?? parsed.googleVerification ?? parsed.google_verification),
    verification: [
      ...asVerificationConfig(parsed.verification_meta ?? parsed.verificationMeta),
      ...asVerificationConfig(verification.meta),
      ...["bing", "msvalidate", "yandex", "pinterest", "facebook"].flatMap((key) => {
        const content = asString(verification[key] ?? seo[key]);
        return content ? [{ name: key === "bing" || key === "msvalidate" ? "msvalidate.01" : `${key}-site-verification`, content }] : [];
      }),
    ],
    analytics: asAnalyticsConfig(parsed.analytics),
    comments: asCommentsConfig(parsed.comments),
    head: asHeadConfig(parsed.head),
    securityTxt: asSecurityTxtConfig(security),
    brandTitle: asString(brand.title ?? parsed.brandTitle ?? parsed.brand_title),
    brandMark: asString(brand.mark ?? parsed.brandMark ?? parsed.brand_mark),
    headerTitle: asString(brand.headerTitle ?? brand.header_title ?? parsed.headerTitle ?? parsed.header_title),
    showBrandTitle: asBoolean(brand.showTitle ?? brand.show_title ?? parsed.showBrandTitle ?? parsed.show_brand_title),
    defaultThemeProfile: asString(theme.profile ?? theme.defaultThemeProfile ?? theme.default_theme_profile ?? parsed.defaultThemeProfile ?? parsed.default_theme_profile),
    defaultFontProfile: asString(theme.fontProfile ?? theme.font_profile ?? parsed.defaultFontProfile ?? parsed.default_font_profile),
    nav: asLinks(parsed.nav),
    footerLinks: asLinks(parsed.footer ?? parsed.footerLinks ?? parsed.footer_links),
    socialLinks: asLinks(parsed.social ?? parsed.socialLinks ?? parsed.social_links),
    projects: asProjects(parsed.project ?? parsed.projects),
    home: readHomeConfig(home),
    profile: readProfileConfig(profile),
    markdown: readMarkdownConfig(markdown),
    pages: asPages(parsed.pages ?? parsed.page),
    source: asSourceConfig(sourceConfig),
    features: readFeatureConfig(asRecord(parsed.features)),
    postCard: readPostCardConfig(asRecord(parsed.post_card ?? parsed.postCard)),
  });
}

export function parsePapyrusProjectsToml(source: string): PapyrusProjectConfig[] {
  const parsed = asRecord(parse(source));
  return asProjects(parsed.project ?? parsed.projects);
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
  const site = parsePapyrusConfigToml(source);
  try {
    const projectsSource = await readFile(resolve(cwd, "src/data/projects.toml"), "utf8");
    const projects = parsePapyrusProjectsToml(projectsSource);
    return projects.length ? { ...site, projects } : site;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return site;
    }
    throw error;
  }
}

export function pageDescription(site: Pick<PapyrusSiteConfig, "pages">, page: string, fallback?: string): string | undefined {
  const configured = site.pages[page]?.description;
  if (configured === false) return undefined;
  return configured ?? fallback;
}

export function pageMetaDescription(site: Pick<PapyrusSiteConfig, "pages">, page: string, fallback?: string): string | undefined {
  const configured = site.pages[page]?.description;
  if (configured === false) return fallback;
  return configured ?? fallback;
}

export function pageContent(site: Pick<PapyrusSiteConfig, "pages">, page: string): string | undefined {
  return site.pages[page]?.content;
}

function normalizeGithubRepo(repo: string): string {
  return repo
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/^git@github\.com:/, "")
    .replace(/\.git$/, "")
    .replace(/^\/+|\/+$/g, "");
}

function detectedSourceBranch(): string | undefined {
  return [
    process.env.CF_PAGES_BRANCH,
    process.env.GITHUB_HEAD_REF,
    process.env.GITHUB_REF_NAME,
    process.env.VERCEL_GIT_COMMIT_REF,
    process.env.BRANCH,
    process.env.HEAD,
  ].find((branch) => branch && branch !== "HEAD");
}

export function githubSourceUrl(site: Pick<PapyrusSiteConfig, "source">, path: string, kind: "blob" | "raw" = "blob"): string | undefined {
  const repo = site.source.repo ? normalizeGithubRepo(site.source.repo) : undefined;
  if (!repo) return undefined;

  const branch = site.source.branch ?? detectedSourceBranch() ?? "main";
  const normalizedPath = path.replace(/^\/+/, "");
  if (kind === "raw") return `https://raw.githubusercontent.com/${repo}/${branch}/${normalizedPath}`;
  return `https://github.com/${repo}/blob/${branch}/${normalizedPath}`;
}
