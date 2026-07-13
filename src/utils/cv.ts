export type PapyrusCvItem = {
  title?: string;
  dates?: string;
  location?: string;
  description?: string;
  tags?: string[];
  range?: {
    start?: string;
    end?: string;
  };
};

export type PapyrusCvGroup = {
  title?: string;
  url?: string;
  logo?: string;
  items?: PapyrusCvItem[];
};

export type PapyrusCvSection = {
  id?: string;
  title: string;
  icon?: string;
  page?: number;
  range?: {
    start?: string;
    end?: string;
  };
  groups?: PapyrusCvGroup[];
};

export type PapyrusCvSectionVariant = "default" | "compact" | "highlight" | "timeline" | string;

export type PapyrusCvSectionOverride = {
  title?: string;
  icon?: string;
  variant?: PapyrusCvSectionVariant;
  hidden?: boolean;
};

export type PapyrusCvSectionOverrides = Record<string, PapyrusCvSectionOverride>;

export type PapyrusCvLink = {
  label: string;
  href?: string;
  icon?: string;
  emailParts?: PapyrusCvEmailParts;
};

export type PapyrusCvEmailParts = {
  user: string;
  domain: string;
  domainParts: string[];
};

export type PapyrusCvNamedFlag = {
  name: string;
  flag?: string;
};

export type PapyrusCvUser = {
  name: string;
  handle?: string;
  avatar?: string;
  favicon?: string;
  ogImage?: string;
  canonicalCv?: string;
  bio?: string;
  summary?: string;
  location?: string;
  url?: string;
  email?: string;
  emailParts?: PapyrusCvEmailParts;
  printColor?: string;
  printLinks?: string[];
  born?: string;
  pages?: number;
  nationality?: PapyrusCvNamedFlag[];
  languages?: PapyrusCvNamedFlag[];
  roles?: string[];
  links?: PapyrusCvLink[];
  sections?: PapyrusCvSection[];
};

type JekyllCvRecord = Record<string, unknown>;

function record(value: unknown): JekyllCvRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JekyllCvRecord : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function cvHref(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(value)) return value;
  return `https://${value}`;
}

function descriptionFrom(value: JekyllCvRecord): string | undefined {
  const raw = stringValue(value.description);
  return raw?.replace(/<br\s*\/?>/gi, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function colorValue(value: unknown): string | undefined {
  const color = stringValue(value);
  if (!color) return undefined;
  return /^(#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([0-9%.,\s-]+\))$/i.test(color) ? color : undefined;
}

function rangeFrom(value: unknown): PapyrusCvItem["range"] | undefined {
  const range = record(value);
  const start = stringValue(range.a);
  const end = stringValue(range.b);
  return start || end ? { start, end } : undefined;
}

function linkFor(user: JekyllCvRecord, key: string): PapyrusCvLink | undefined {
  const link = record(user[key]);
  const account = stringValue(link.name) ?? key;
  const label = account;
  const directHref = stringValue(link.href);
  const baseUrl = stringValue(link.url);
  const href = cvHref(directHref ?? (baseUrl ? `${baseUrl}${account}` : undefined));
  if (!href) return undefined;
  return {
    label,
    href,
    icon: stringValue(link.icon) ?? key,
  };
}

function namedFlagFor(user: JekyllCvRecord, key: string): PapyrusCvNamedFlag | undefined {
  const item = record(user[key]);
  const name = stringValue(item.name);
  if (!name) return undefined;
  return {
    name,
    flag: stringValue(item.flag),
  };
}

function normalizeGroup(section: JekyllCvRecord, groupKey: string): PapyrusCvGroup | undefined {
  const group = record(section[groupKey]);
  const itemKeys = stringList(group.items);
  const items: PapyrusCvItem[] = [];

  itemKeys.forEach((itemKey) => {
      const item = record(group[itemKey]);
      const title = stringValue(item.title) ?? stringValue(itemKey);
      const description = descriptionFrom(item);
      const dates = stringValue(item.dates);
      const location = stringValue(item.location);
      const tags = stringList(item.tags);
      const range = rangeFrom(item.range);

      if (!title && !description && !dates && !location) return;

      items.push({ title, dates, location, description, tags: tags.length ? tags : undefined, range });
    });

  const inlineDescription = descriptionFrom(group);
  if (items.length === 0 && inlineDescription) {
    items.push({
      title: stringValue(group.title) ?? stringValue(groupKey),
      description: inlineDescription,
    });
  }

  const title = stringValue(group.ententy) ?? stringValue(group.entity) ?? stringValue(group.title);
  const url = cvHref(stringValue(group.url));
  const logo = stringValue(group.logo);

  if (items.length === 0 && !title) return undefined;

  return { title, url, logo, items };
}

export function normalizeJekyllCvUser(input: unknown): PapyrusCvUser {
  const root = record(input);
  const user = record(root.user ?? input);
  const emailUser = stringValue(user.email_user);
  const emailDomain = stringValue(user.email_domain);
  const emailParts = emailUser && emailDomain ? {
    user: emailUser,
    domain: emailDomain,
    domainParts: emailDomain.split(".").filter(Boolean),
  } : undefined;
  const linkKeys = stringList(user.links);

  return {
    name: stringValue(user.name) ?? "Unnamed profile",
    handle: stringValue(user.handle),
    avatar: stringValue(user.avatar),
    favicon: stringValue(user.favicon),
    ogImage: stringValue(user.og_image) ?? stringValue(user.ogImage),
    canonicalCv: cvHref(stringValue(user.canonical_cv) ?? stringValue(user.canonicalCv)),
    bio: stringValue(user.bio),
    summary: stringValue(user.summary),
    location: stringValue(user.location),
    url: cvHref(stringValue(user.link) ?? stringValue(user.url)),
    email: emailParts ? undefined : stringValue(user.email),
    emailParts,
    printColor: colorValue(user.print_color) ?? colorValue(user.printColor),
    printLinks: stringList(user.print_links ?? user.printLinks),
    born: stringValue(user.born),
    pages: numberValue(user.pages),
    nationality: stringList(user.nationality)
      .map((key) => namedFlagFor(user, key))
      .filter((item): item is PapyrusCvNamedFlag => Boolean(item)),
    languages: stringList(user.languages)
      .map((key) => namedFlagFor(user, key))
      .filter((item): item is PapyrusCvNamedFlag => Boolean(item)),
    roles: stringList(user.roles),
    links: linkKeys.map((key) => linkFor(user, key)).filter((link): link is PapyrusCvLink => Boolean(link)),
    sections: stringList(user.sections)
      .map((sectionKey) => {
        const section = record(record(user.data)[sectionKey]);
        const groups = stringList(section.groups)
          .map((groupKey) => normalizeGroup(section, groupKey))
          .filter((group): group is PapyrusCvGroup => Boolean(group));

        return {
          id: sectionKey,
          title: stringValue(section.title) ?? sectionKey,
          icon: stringValue(section.icon),
          page: numberValue(section.page),
          range: rangeFrom(section.range),
          groups,
        };
      })
      .filter((section) => section.groups.length > 0),
  };
}

export function cvToJson(user: PapyrusCvUser): string {
  return JSON.stringify(user, null, 2);
}

function sameTitle(a: string | undefined, b: string | undefined): boolean {
  return Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

export function shouldShowCvItemTitle(
  section: Pick<PapyrusCvSection, "id" | "title">,
  group: { title?: string; entity?: string; items?: unknown[] },
  item: Pick<PapyrusCvItem, "title">
): boolean {
  if (!item.title) return false;
  if (
    group.items?.length === 1 &&
    (sameTitle(item.title, section.title) || sameTitle(item.title, section.id) || sameTitle(item.title, group.title) || sameTitle(item.title, group.entity))
  ) {
    return false;
  }
  return true;
}

function shouldShowMarkdownItemTitle(section: PapyrusCvSection, group: PapyrusCvGroup, item: PapyrusCvItem): boolean {
  return shouldShowCvItemTitle(section, group, item);
}

function markdownText(value: string): string {
  return value
    .replace(/<\/li>\s*<li>/gi, "\n- ")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/?(ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/^<p>|<\/p>$/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function cvToMarkdown(user: PapyrusCvUser): string {
  const lines = [`# ${user.name}`, ""];
  const emailDisplay = user.emailParts ? `${user.emailParts.user}＠${user.emailParts.domain}` : user.email?.replace("@", "＠");

  if (user.bio) lines.push(user.bio, "");
  if (user.location || emailDisplay || user.url) {
    lines.push([user.location, emailDisplay, user.url, user.born].filter(Boolean).join(" / "), "");
  }
  if (user.nationality?.length) lines.push(`Nationality: ${user.nationality.map((item) => item.name).join(", ")}`, "");
  if (user.languages?.length) lines.push(`Languages: ${user.languages.map((item) => item.name).join(", ")}`, "");
  if (user.roles?.length) lines.push(`Roles: ${user.roles.join(", ")}`, "");
  if (user.links?.length) {
    lines.push("## Links", "");
    user.links.forEach((link) => lines.push(`- [${link.label}](${link.href})`));
    lines.push("");
  }

  user.sections?.forEach((section) => {
    lines.push(`## ${section.title}`, "");
    section.groups?.forEach((group) => {
      if (group.title) lines.push(`### ${group.title}`, "");
      group.items?.forEach((item) => {
        if (shouldShowMarkdownItemTitle(section, group, item)) lines.push(`- ${item.title}`);
        if (item.dates || item.location) lines.push(`  - ${[item.dates, item.location].filter(Boolean).join(" / ")}`);
        if (item.description) lines.push(`  - ${markdownText(item.description).replace(/\n/g, "\n    ")}`);
      });
      lines.push("");
    });
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}
