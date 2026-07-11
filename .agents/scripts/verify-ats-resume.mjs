#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { basename } from "node:path";

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

const jsonPath = argValue("--json", "public/cv/profile.json");
const markdownPath = argValue("--markdown", "public/cv/profile.md");
const pdfPath = argValue("--pdf", undefined);
const pdfTextPath = argValue("--pdf-text", undefined);
const minWords = Number(argValue("--min-words", "120"));

const failures = [];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function flattenCvText(cv) {
  const parts = [
    cv.name,
    cv.bio,
    cv.summary,
    cv.location,
    cv.url,
    cv.email,
    cv.emailParts?.display,
    cv.canonicalCv,
    ...(cv.roles ?? []),
    ...(cv.nationality ?? []).map(item => item.name),
    ...(cv.languages ?? []).map(item => item.name),
    ...(cv.links ?? []).flatMap(link => [link.label, link.href]),
  ];

  for (const section of cv.sections ?? []) {
    parts.push(section.title, section.id);
    for (const group of section.groups ?? []) {
      parts.push(group.title, group.url);
      for (const item of group.items ?? []) {
        parts.push(item.title, item.location, item.dates, item.description);
      }
    }
  }

  return parts.filter(Boolean).join("\n");
}

function sectionByIdOrTitle(cv, pattern) {
  return (cv.sections ?? []).find(section => pattern.test(`${section.id} ${section.title}`));
}

function wordCount(value) {
  return (value.match(/\b[\p{L}\p{N}][\p{L}\p{N}'-]*\b/gu) ?? []).length;
}

function normalizeForSearch(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\uFF20/g, "@")
    .trim()
    .toLowerCase();
}

function sameTitle(a, b) {
  return Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

function hasDuplicateSingletonItemTitle(section, group, item) {
  return (
    (group.items ?? []).length === 1 &&
    (sameTitle(item.title, section.title) || sameTitle(item.title, section.id) || sameTitle(item.title, group.title))
  );
}

async function readPdfText() {
  if (pdfTextPath) return readFile(pdfTextPath, "utf8");
  if (!pdfPath) return undefined;

  const result = spawnSync("pdftotext", [pdfPath, "-"], { encoding: "utf8" });
  if (result.error?.code === "ENOENT") {
    fail(`${basename(pdfPath)}: pdftotext is not installed; install poppler or pass --pdf-text`);
    return undefined;
  }
  if (result.status !== 0) {
    fail(`${basename(pdfPath)}: pdftotext failed: ${result.stderr || result.stdout}`);
    return undefined;
  }
  return result.stdout;
}

function validateCvJson(cv) {
  assert(text(cv.name), "JSON missing name");
  assert(text(cv.bio) || text(cv.summary), "JSON missing headline or summary");
  assert(text(cv.location), "JSON missing location");
  assert(text(cv.url) || text(cv.canonicalCv), "JSON missing website/current CV URL");
  assert(text(cv.email) || text(cv.emailParts?.display), "JSON missing email or email parts");
  assert(Array.isArray(cv.sections) && cv.sections.length >= 3, "JSON should expose at least 3 CV sections");

  const profile = sectionByIdOrTitle(cv, /profile|about|summary/i);
  const experience = sectionByIdOrTitle(cv, /experience|work|employment/i);
  const education = sectionByIdOrTitle(cv, /education|school|university/i);
  const skills = sectionByIdOrTitle(cv, /skills|tools|technologies/i);

  assert(profile, "JSON missing profile/summary section");
  assert(experience, "JSON missing experience section");
  assert(education, "JSON missing education section");
  assert(skills, "JSON missing skills section");

  const experienceItems = (experience?.groups ?? []).flatMap(group => group.items ?? []);
  assert(experienceItems.length > 0, "Experience section has no items");
  assert(experienceItems.some(item => text(item.title)), "Experience items missing titles");
  assert(experienceItems.some(item => text(item.dates) || item.range), "Experience items missing dates or ranges");
  assert(experienceItems.some(item => text(item.description)), "Experience items missing descriptions");

  assert(flattenCvText(cv).length > 0, "JSON did not produce parser-readable text");
}

function validateMarkdown(markdown, cv) {
  assert(markdown.startsWith(`# ${cv.name}`), "Markdown should start with the CV name as H1");
  assert(!/<\/?[a-z][\s\S]*>/i.test(markdown), "Markdown should not contain raw HTML tags");
  assert(!/\bundefined\b|\bnull\b/i.test(markdown), "Markdown contains undefined/null text");
  assert(wordCount(markdown) >= minWords, `Markdown has too little parser-readable text; expected at least ${minWords} words`);

  for (const heading of ["Details", "Profile", "Education"]) {
    assert(markdown.includes(`## ${heading}`), `Markdown missing ${heading} heading`);
  }
  assert(/## .*Experience/i.test(markdown), "Markdown missing experience heading");
  assert(/## .*Skills/i.test(markdown), "Markdown missing skills heading");

  for (const section of cv.sections ?? []) {
    for (const group of section.groups ?? []) {
      for (const item of group.items ?? []) {
        if (hasDuplicateSingletonItemTitle(section, group, item)) {
          assert(!markdown.includes(`#### ${item.title}`), `Markdown repeats redundant item title: ${item.title}`);
        }
      }
    }
  }
}

function validateExtractedText(label, extractedText, cv) {
  const normalized = normalizeForSearch(extractedText);
  assert(wordCount(extractedText) >= minWords, `${label} has too little extractable text; expected at least ${minWords} words`);

  const required = [
    cv.name,
    cv.location,
    cv.bio,
    sectionByIdOrTitle(cv, /experience|work|employment/i)?.title,
    sectionByIdOrTitle(cv, /education|school|university/i)?.title,
    sectionByIdOrTitle(cv, /skills|tools|technologies/i)?.title,
    ...(sectionByIdOrTitle(cv, /experience|work|employment/i)?.groups ?? []).flatMap(group => [
      group.title,
      ...(group.items ?? []).flatMap(item => [item.title, item.dates, item.location]),
    ]),
  ].filter(Boolean);

  for (const value of required) {
    const needle = normalizeForSearch(value);
    assert(normalized.includes(needle), `${label} missing parser-readable text: ${value}`);
  }
}

try {
  const cv = JSON.parse(await readFile(jsonPath, "utf8"));
  const markdown = await readFile(markdownPath, "utf8");

  validateCvJson(cv);
  validateMarkdown(markdown, cv);
  validateExtractedText("Markdown", markdown, cv);

  const cvText = flattenCvText(cv);
  assert(wordCount(cvText) >= minWords, `JSON has too little parser-readable text; expected at least ${minWords} words`);

  const pdfText = await readPdfText();
  if (pdfText !== undefined) validateExtractedText(pdfTextPath ? "PDF text" : "PDF", pdfText, cv);

  if (failures.length > 0) {
    console.error(`ATS resume check failed with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`ATS resume check passed for ${jsonPath} and ${markdownPath}${pdfPath || pdfTextPath ? " with PDF text extraction" : ""}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
