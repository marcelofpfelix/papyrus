import { type PapyrusFeatureConfig } from "../utils/features.ts";
import { type PapyrusImageEffect } from "../utils/image-effects.ts";
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
    links?: Array<PapyrusLinkConfig & {
        text?: string;
    }>;
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
    ogLocale?: string;
    twitterSite?: string;
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
export declare function definePapyrusConfig(config: PapyrusConfigInput): PapyrusSiteConfig;
export declare function resolvePapyrusConfig(config?: PapyrusConfigInput): PapyrusSiteConfig;
export declare function parsePapyrusConfigToml(source: string): PapyrusSiteConfig;
export declare function parsePapyrusProjectsToml(source: string): PapyrusProjectConfig[];
export declare function loadPapyrusConfig(path?: string, cwd?: string): Promise<PapyrusSiteConfig>;
export declare function pageDescription(site: Pick<PapyrusSiteConfig, "pages">, page: string, fallback?: string): string | undefined;
export declare function pageMetaDescription(site: Pick<PapyrusSiteConfig, "pages">, page: string, fallback?: string): string | undefined;
export declare function pageContent(site: Pick<PapyrusSiteConfig, "pages">, page: string): string | undefined;
export declare function githubSourceUrl(site: Pick<PapyrusSiteConfig, "source">, path: string, kind?: "blob" | "raw"): string | undefined;
