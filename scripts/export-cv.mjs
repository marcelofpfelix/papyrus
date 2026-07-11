#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parse } from "smol-toml";

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function stringValue(value, fallback = undefined) {
  return typeof value === "string" ? value : fallback;
}

function stringList(value) {
  return arrayValue(value).filter(item => typeof item === "string");
}

function numberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function colorValue(value) {
  const color = stringValue(value);
  if (!color) return undefined;
  return /^(#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([0-9%.,\s-]+\))$/i.test(color) ? color : undefined;
}

function cvHref(value) {
  if (!value) return undefined;
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(value)) return value;
  return `https://${value}`;
}

function rangeValue(value) {
  const range = objectValue(value);
  const start = stringValue(range.a) || stringValue(range.from);
  const end = stringValue(range.b) || stringValue(range.to);
  return start || end ? { start, end } : undefined;
}

function linkFor(user, key) {
  const link = objectValue(user[key]);
  const account = stringValue(link.name, key);
  const directHref = stringValue(link.href);
  const baseUrl = stringValue(link.url);
  const href = cvHref(directHref || (baseUrl ? `${baseUrl}${account}` : undefined));
  if (!href) return undefined;

  return {
    label: account,
    href,
    icon: stringValue(link.icon) || key,
  };
}

function namedFlagFor(user, key) {
  const item = objectValue(user[key]);
  const name = stringValue(item.name);
  if (!name) return undefined;
  return {
    name,
    flag: stringValue(item.flag) || undefined,
  };
}

function descriptionFrom(value) {
  const description = stringValue(objectValue(value).description);
  return description
    ?.replace(/<\/li>\s*<li>/gi, "\n- ")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/?(ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/^<p>|<\/p>$/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function normalizeGroup(section, groupKey) {
  const group = objectValue(section[groupKey]);
  const items = stringList(group.items)
    .map(itemKey => {
      const item = objectValue(group[itemKey]);
      const title = stringValue(item.title, itemKey);
      const dates = stringValue(item.dates);
      const location = stringValue(item.location);
      const description = descriptionFrom(item);
      const tags = stringList(item.tags);
      const range = rangeValue(item.range);
      if (!title && !dates && !location && !description) return undefined;

      return { title, dates, location, description, tags: tags.length ? tags : undefined, range };
    })
    .filter(Boolean);

  const inlineDescription = descriptionFrom(group);
  if (items.length === 0 && inlineDescription) {
    items.push({
      title: stringValue(group.title, groupKey),
      description: inlineDescription,
    });
  }

  const title = stringValue(group.ententy) || stringValue(group.entity) || stringValue(group.title);
  const url = cvHref(stringValue(group.url));
  const logo = stringValue(group.logo);
  if (items.length === 0 && !title) return undefined;

  return { title, url, logo, items };
}

function normalizeCv(source) {
  const root = objectValue(source);
  const user = objectValue(root.user ?? source);
  const emailUser = stringValue(user.email_user);
  const emailDomain = stringValue(user.email_domain);
  const emailParts = emailUser && emailDomain ? {
    user: emailUser,
    domain: emailDomain,
    domainParts: emailDomain.split(".").filter(Boolean),
    display: `${emailUser}＠${emailDomain}`,
  } : undefined;
  const links = stringList(user.links).map(key => linkFor(user, key)).filter(Boolean);
  const sections = stringList(user.sections)
    .map(sectionKey => {
      const section = objectValue(objectValue(user.data)[sectionKey]);
      const groups = stringList(section.groups).map(groupKey => normalizeGroup(section, groupKey)).filter(Boolean);
      return {
        id: sectionKey,
        title: stringValue(section.title, sectionKey),
        icon: stringValue(section.icon) || undefined,
        page: numberValue(section.page),
        range: rangeValue(section.range),
        groups,
      };
    })
    .filter(section => section.groups.length > 0);

  return {
    name: stringValue(user.name, "Unnamed profile"),
    handle: stringValue(user.handle) || undefined,
    avatar: stringValue(user.avatar) || undefined,
    favicon: stringValue(user.favicon) || undefined,
    ogImage: stringValue(user.og_image) || stringValue(user.ogImage) || undefined,
    canonicalCv: cvHref(stringValue(user.canonical_cv) || stringValue(user.canonicalCv)),
    bio: stringValue(user.bio) || undefined,
    summary: stringValue(user.summary) || undefined,
    location: stringValue(user.location) || undefined,
    url: cvHref(stringValue(user.link) || stringValue(user.url)),
    email: emailParts ? undefined : stringValue(user.email)?.replace("@", "＠"),
    emailParts,
    printColor: colorValue(user.print_color) || colorValue(user.printColor),
    born: stringValue(user.born) || undefined,
    pages: numberValue(user.pages),
    nationality: stringList(user.nationality).map(key => namedFlagFor(user, key)).filter(Boolean),
    languages: stringList(user.languages).map(key => namedFlagFor(user, key)).filter(Boolean),
    roles: stringList(user.roles),
    links,
    sections,
  };
}

function jsonExport(cv) {
  return `${JSON.stringify(cv, null, 2)}\n`;
}

function sameTitle(a, b) {
  return Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

function shouldShowItemTitle(section, group, item) {
  if (!item.title) return false;
  if (
    group.items.length === 1 &&
    (sameTitle(item.title, section.title) || sameTitle(item.title, section.id) || sameTitle(item.title, group.title))
  ) {
    return false;
  }
  return true;
}

function markdownExport(cv) {
  const lines = [`# ${cv.name}`, ""];

  if (cv.bio) lines.push(cv.bio, "");
  if (cv.summary) lines.push(cv.summary, "");

  const facts = [
    cv.location && `- Location: ${cv.location}`,
    (cv.emailParts || cv.email) && `- Email: ${cv.emailParts?.display ?? cv.email}`,
    cv.url && `- Website: ${cv.url}`,
    cv.born && `- Born: ${cv.born}`,
    cv.canonicalCv && `- Current CV: ${cv.canonicalCv}`,
    cv.nationality?.length && `- Nationality: ${cv.nationality.map(item => item.name).join(", ")}`,
    cv.languages?.length && `- Languages: ${cv.languages.map(item => item.name).join(", ")}`,
    cv.roles?.length && `- Roles: ${cv.roles.join(", ")}`,
    ...cv.links.map(link => `- ${link.label}: ${link.href}`),
  ].filter(Boolean);

  if (facts.length > 0) lines.push("## Details", "", ...facts, "");

  for (const section of cv.sections) {
    if (!section.title) continue;

    lines.push(`## ${section.title}`, "");
    for (const group of section.groups) {
      if (group.title) {
        lines.push(`### ${group.title}${group.url ? ` (${group.url})` : ""}`, "");
      }

      for (const item of group.items) {
        const showTitle = shouldShowItemTitle(section, group, item);
        if (showTitle) lines.push(`#### ${item.title}`);
        const details = [item.location, item.dates, item.duration].filter(Boolean).join(" - ");
        if (details) lines.push(details);
        if (item.description) lines.push("", item.description);
        lines.push("");
      }
    }
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

async function writeOrCheck(path, content, check) {
  if (check) {
    let current = "";
    try {
      current = await readFile(path, "utf8");
    } catch {
      throw new Error(`${path} does not exist. Run the CV export script.`);
    }

    if (current !== content) {
      throw new Error(`${path} is stale. Run the CV export script.`);
    }
    return;
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

const [sourceArg = "src/data/profile.toml", outputBaseArg = "public/cv/profile", ...flags] = process.argv.slice(2);
const check = flags.includes("--check");
const sourcePath = resolve(process.cwd(), sourceArg);
const outputBase = resolve(process.cwd(), outputBaseArg);

try {
  const source = parse(await readFile(sourcePath, "utf8"));
  const cv = normalizeCv(source);
  await writeOrCheck(`${outputBase}.json`, jsonExport(cv), check);
  await writeOrCheck(`${outputBase}.md`, markdownExport(cv), check);
  console.log(check ? "CV exports are current." : `Wrote ${outputBase}.json and ${outputBase}.md.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
