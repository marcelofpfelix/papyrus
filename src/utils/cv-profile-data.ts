import { parse } from "smol-toml";
import { cvHref, normalizeJekyllCvUser, type PaperCvEmailParts, type PaperCvItem, type PaperCvUser } from "./cv";

const DEFAULT_PRINT_COLOR = "#37474F";
const DEFAULT_PRINT_LINKS = ["email", "linkedin", "github", "website"];

export type ProfileMeta = {
  label: string;
  value: string;
  icon: string;
};

export type CvItem = {
  title: string;
  dates?: string;
  location?: string;
  description?: string;
  tags?: string[];
  range?: PaperCvItem["range"];
  duration?: string;
};

export type CvGroup = {
  entity?: string;
  url?: string;
  logo?: string;
  items: CvItem[];
};

export type CvSection = {
  id: string;
  title: string;
  icon: string;
  page: 1 | 2;
  duration?: string;
  groups: CvGroup[];
};

export type ProfileProject = {
  repo: string;
  description: string;
};

export type ProfileData = {
  profile: {
    name: string;
    handle: string;
    headline: string;
    avatar: string;
    favicon: string;
    ogImage: string;
    canonicalCv: string;
    location: string;
    summary: string;
    email: string;
    emailParts?: PaperCvEmailParts;
    printColor: string;
    pages: number;
    meta: ProfileMeta[];
  };
  profileLinks: {
    label: string;
    href?: string;
    icon?: string;
    emailParts?: PaperCvEmailParts;
  }[];
  printProfileLinks: {
    label: string;
    href?: string;
    icon?: string;
    emailParts?: PaperCvEmailParts;
  }[];
  cvSections: CvSection[];
  profilePages: number[];
  timelineEvents: {
    date?: string;
    content: string;
  }[];
  profileProjects: ProfileProject[];
};

function assetPath(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  if (/^(https?:|\/)/i.test(value)) return value;
  return `/${value}`;
}

function dateFrom(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

function fullMonthsBetween(startValue: string | undefined, endValue?: string): number | undefined {
  const start = dateFrom(startValue);
  const end = dateFrom(endValue) ?? new Date();
  if (!start || end < start) return undefined;

  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export function ageLabel(born: string | undefined): string | undefined {
  const months = fullMonthsBetween(born);
  if (months === undefined) return undefined;
  const years = Math.floor(months / 12);
  return `${years} Year${years === 1 ? "" : "s"}`;
}

export function durationLabel(range: PaperCvItem["range"] | undefined): string | undefined {
  const months = fullMonthsBetween(range?.start, range?.end);
  if (months === undefined) return undefined;
  const years = Math.floor(months / 12);
  const restMonths = months % 12;
  const parts = [];
  if (years) parts.push(`${years} Year${years === 1 ? "" : "s"}`);
  if (restMonths || parts.length === 0) parts.push(`${restMonths} Month${restMonths === 1 ? "" : "s"}`);
  return parts.join(" ");
}

export function compactDurationLabel(label: string | undefined): string | undefined {
  if (!label) return undefined;
  const years = label.match(/(\d+)\s+Years?/i)?.[1];
  const months = label.match(/(\d+)\s+Months?/i)?.[1];
  return [
    years ? `${years}y` : undefined,
    months ? `${months}m` : undefined,
  ].filter(Boolean).join(" ") || label;
}

function firstDescription(user: PaperCvUser): string | undefined {
  return user.sections
    ?.flatMap((section) => section.groups ?? [])
    .flatMap((group) => group.items ?? [])
    .find((item) => item.description)
    ?.description;
}

function handleFrom(user: PaperCvUser): string {
  if (user.handle) return user.handle;
  const github = user.links?.find((link) => link.icon === "github");
  return github?.label ?? user.name.toLowerCase().replace(/\s+/g, "");
}

function profileLinksFor(user: PaperCvUser) {
  const links = [...(user.links ?? [])];

  if (user.emailParts) {
    links.unshift({
      label: `${user.emailParts.user}＠${user.emailParts.domain}`,
      icon: "email",
      emailParts: user.emailParts,
    });
  } else if (user.email) {
    links.unshift({
      label: user.email.replace("@", "＠"),
      icon: "email",
    });
  }

  if (user.url) {
    const label = user.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!links.some((link) => link.href === user.url)) {
      links.push({ label, href: user.url, icon: "link" });
    }
  }

  return links;
}

function normalizedLinkKey(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ?? "";
}

function printLinkMatches(link: ReturnType<typeof profileLinksFor>[number], key: string): boolean {
  const normalizedKey = normalizedLinkKey(key);
  const icon = normalizedLinkKey(link.icon);
  const label = normalizedLinkKey(link.label);
  const href = normalizedLinkKey(link.href);

  if (normalizedKey === "email") return Boolean(link.emailParts || icon === "email" || link.label.includes("＠") || link.label.includes("@"));
  if (normalizedKey === "website" || normalizedKey === "web") return icon === "link" || icon === "website" || icon === "web";
  return icon === normalizedKey || label === normalizedKey || href.includes(normalizedKey);
}

function printProfileLinksFor(user: PaperCvUser, links: ReturnType<typeof profileLinksFor>) {
  const keys = user.printLinks?.length ? user.printLinks : DEFAULT_PRINT_LINKS;
  const seen = new Set<string>();

  return keys
    .map((key) => links.find((link) => printLinkMatches(link, key)))
    .filter((link): link is ReturnType<typeof profileLinksFor>[number] => Boolean(link))
    .filter((link) => {
      const identity = link.href ?? `${link.icon}:${link.label}`;
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
}

export function profileLinkKindLabel(link: ReturnType<typeof profileLinksFor>[number]): string {
  const icon = normalizedLinkKey(link.icon);
  if (link.emailParts || icon === "email" || link.label.includes("＠") || link.label.includes("@")) return "Email";
  if (icon === "linkedin") return "LinkedIn";
  if (icon === "github") return "GitHub";
  if (icon === "link" || icon === "website" || icon === "web") return "Website";
  return link.icon ?? link.label;
}

function profileMetaFor(user: PaperCvUser): ProfileMeta[] {
  return [
    user.location ? { label: "Location", value: user.location, icon: "location" } : undefined,
    user.born ? { label: "Age", value: ageLabel(user.born) ?? user.born.slice(0, 10), icon: "calendar" } : undefined,
    ...(user.nationality ?? []).map((item) => ({ label: "Nationality", value: item.name, icon: "flag" })),
    ...(user.languages ?? []).map((item) => ({ label: "Language", value: item.name, icon: "earth" })),
    ...(user.roles ?? []).map((role) => ({ label: "Role", value: role, icon: "computer" })),
  ].filter((item): item is ProfileMeta => Boolean(item));
}

function sectionPage(page: number | undefined): 1 | 2 {
  return page === 2 ? 2 : 1;
}

function includeInTimeline(item: CvItem): boolean {
  return Boolean(item.dates || item.range);
}

function timelineDateFor(item: CvItem): string | undefined {
  return item.dates;
}

function sameTitle(a: string | undefined, b: string | undefined): boolean {
  return Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

function isSectionNamedItem(section: CvSection, item: CvItem): boolean {
  const title = item.title.trim().toLowerCase();
  return !title || title === section.id || title === section.title.trim().toLowerCase();
}

function timelineTitleFor(section: CvSection, item: CvItem): string {
  return isSectionNamedItem(section, item) ? section.title : item.title;
}

function timelineContentFor(section: CvSection, group: CvGroup, item: CvItem): string {
  const title = timelineTitleFor(section, item);
  const groupIsSection = sameTitle(group.entity, section.title) || sameTitle(group.entity, section.id);
  const entity = group.entity && !groupIsSection ? ` · ${group.entity}` : "";
  const description = isSectionNamedItem(section, item) && item.description ? ` · ${item.description}` : "";
  return `<strong>${title}</strong>${entity}${description}`;
}

export function profileDataFromJekyllCvUser(user: PaperCvUser, projects: ProfileProject[] = []): ProfileData {
  const cvSections = (user.sections ?? []).map((section): CvSection => {
    const groups = (section.groups ?? []).map((group): CvGroup => ({
      entity: group.title,
      url: group.url,
      logo: group.logo ? assetPath(group.logo, "") : undefined,
      items: (group.items ?? []).map((item): CvItem => ({
        title: item.title ?? "",
        dates: item.dates,
        location: item.location,
        description: item.description,
        tags: item.tags,
        range: item.range,
        duration: durationLabel(item.range),
      })),
    }));

    return {
      id: section.id ?? section.title.toLowerCase().replace(/\s+/g, "-"),
      title: section.title,
      icon: section.icon ?? "user",
      page: sectionPage(section.page),
      duration: durationLabel(section.range),
      groups,
    };
  });

  const pages = Math.max(user.pages ?? 1, ...cvSections.map((section) => section.page));
  const canonicalCv = user.canonicalCv ?? cvHref(user.url) ?? "/";
  const avatar = assetPath(user.avatar, "/demo/demo-profile-avatar.svg");
  const summary = user.summary ?? firstDescription(user) ?? user.bio ?? "";
  const profileLinks = profileLinksFor(user);

  return {
    profile: {
      name: user.name,
      handle: handleFrom(user),
      headline: user.bio ?? "",
      avatar,
      favicon: assetPath(user.favicon, "/favicon.svg"),
      ogImage: assetPath(user.ogImage, avatar),
      canonicalCv,
      location: user.location ?? "",
      summary,
      email: user.email ?? "",
      emailParts: user.emailParts,
      printColor: user.printColor ?? DEFAULT_PRINT_COLOR,
      pages,
      meta: profileMetaFor(user),
    },
    profileLinks,
    printProfileLinks: printProfileLinksFor(user, profileLinks),
    cvSections,
    profilePages: Array.from({ length: pages }, (_, index) => index + 1),
    timelineEvents: cvSections
      .flatMap((section) => section.groups.flatMap((group) => group.items
        .filter((item) => includeInTimeline(item))
        .map((item) => ({
          date: timelineDateFor(item),
          content: timelineContentFor(section, group, item),
        })))),
    profileProjects: projects,
  };
}

export function profileDataFromJekyllCvToml(source: string, projects: ProfileProject[] = []): ProfileData {
  return profileDataFromJekyllCvUser(normalizeJekyllCvUser(parse(source)), projects);
}
