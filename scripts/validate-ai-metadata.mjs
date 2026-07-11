#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const [input = "src/content/posts", dataFile = ""] = args;
const root = process.cwd();
const inputDir = path.resolve(root, input);
const errors = [];

function usage() {
  console.error("Usage: papyrus-ai-validate [content-dir] [site-data-json]");
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".astro", ".git", "dist", "node_modules"].includes(entry.name)) continue;
      files.push(...await walk(fullPath));
      continue;
    }

    if (/\.(md|mdx)$/i.test(entry.name)) files.push(fullPath);
  }

  return files;
}

function parseScalar(raw) {
  const value = raw.trim();
  if (!value) return "";
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\[.*\]$/.test(value)) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  return value.replace(/^["']|["']$/g, "");
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;

  const data = {};
  let arrayKey = "";

  for (const line of match[1].split("\n")) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (pair) {
      const [, key, rawValue] = pair;
      arrayKey = "";
      if (!rawValue.trim()) {
        data[key] = [];
        arrayKey = key;
      } else {
        data[key] = parseScalar(rawValue);
      }
      continue;
    }

    const arrayItem = line.match(/^\s*-\s*(.+)$/);
    if (arrayItem && arrayKey && Array.isArray(data[arrayKey])) {
      data[arrayKey].push(parseScalar(arrayItem[1]));
    }
  }

  return data;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasDate(value) {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function relative(file) {
  return path.relative(root, file);
}

function requireField(scope, data, key, predicate = isNonEmptyString, message = "must be set") {
  if (!predicate(data[key])) errors.push(`${scope}: ${key} ${message}`);
}

async function validatePosts() {
  const files = (await walk(inputDir)).sort();

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const data = parseFrontmatter(source);
    const scope = relative(file);

    if (!data) {
      errors.push(`${scope}: missing frontmatter`);
      continue;
    }

    requireField(scope, data, "title");
    requireField(scope, data, "description");
    requireField(scope, data, "slug");
    requireField(scope, data, "pubDatetime", hasDate, "must be an ISO-like date");
    requireField(scope, data, "license");

    if (!Array.isArray(data.tags) || data.tags.length === 0) {
      errors.push(`${scope}: tags must be a non-empty array`);
    }
  }

  return files.length;
}

function validateSiteDataShape(siteData) {
  const projects = Array.isArray(siteData.projects) ? siteData.projects : [];
  const notes = Array.isArray(siteData.notes) ? siteData.notes : [];
  const cv = siteData.cv && typeof siteData.cv === "object" ? siteData.cv : null;

  projects.forEach((project, index) => {
    const scope = `site-data projects[${index}]`;
    requireField(scope, project, "title");
    requireField(scope, project, "description");
    if (!isNonEmptyString(project.href) && !isNonEmptyString(project.repo)) {
      errors.push(`${scope}: href or repo must be set`);
    }
  });

  notes.forEach((note, index) => {
    const scope = `site-data notes[${index}]`;
    requireField(scope, note, "id");
    requireField(scope, note, "text");
    if (note.date && !hasDate(note.date)) errors.push(`${scope}: date must be an ISO-like date`);
    if (note.tags !== undefined && !Array.isArray(note.tags)) errors.push(`${scope}: tags must be an array`);
  });

  if (cv) {
    requireField("site-data cv", cv, "source");
    requireField("site-data cv", cv, "name");
    if (!Array.isArray(cv.templates) || cv.templates.length === 0) {
      errors.push("site-data cv: templates must be a non-empty array");
    }
    if (!Array.isArray(cv.sections) || cv.sections.length === 0) {
      errors.push("site-data cv: sections must be a non-empty array");
    }
  }

  return { projects: projects.length, notes: notes.length, cv: cv ? 1 : 0 };
}

async function validateSiteData() {
  if (!dataFile) return { projects: 0, notes: 0, cv: 0 };

  const file = path.resolve(root, dataFile);
  const siteData = JSON.parse(await readFile(file, "utf8"));
  return validateSiteDataShape(siteData);
}

try {
  const postCount = await validatePosts();
  const siteDataCounts = await validateSiteData();

  if (errors.length > 0) {
    console.error("AI metadata validation failed:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`AI metadata validation passed: ${postCount} posts, ${siteDataCounts.projects} projects, ${siteDataCounts.notes} notes, ${siteDataCounts.cv} CV`);
} catch (error) {
  usage();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
