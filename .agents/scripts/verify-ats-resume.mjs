#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { basename } from "node:path";

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

const jsonPath = argValue("--json", "public/cv/resume.json");
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

function flattenCvText(resume) {
  const basics = resume.basics ?? {};
  const location = basics.location ?? {};
  const parts = [
    basics.name,
    basics.label,
    basics.summary,
    basics.email,
    basics.url,
    location.address,
    location.city,
    location.region,
    location.countryCode,
    resume.meta?.canonical,
    ...(basics.profiles ?? []).flatMap(profile => [profile.network, profile.username, profile.url]),
  ];

  for (const item of resume.work ?? []) {
    parts.push(item.name, item.position, item.location, item.description, item.url, item.startDate, item.endDate, item.summary);
    parts.push(...(item.highlights ?? []));
  }

  for (const item of resume.education ?? []) {
    parts.push(item.institution, item.area, item.studyType, item.startDate, item.endDate, item.summary);
    parts.push(...(item.courses ?? []));
  }

  for (const item of resume.skills ?? []) parts.push(item.name, item.level, ...(item.keywords ?? []));
  for (const item of resume.languages ?? []) parts.push(item.language, item.fluency);
  for (const item of resume.interests ?? []) parts.push(item.name, ...(item.keywords ?? []));

  return parts.filter(Boolean).join("\n");
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

function searchableDate(value) {
  const raw = text(value);
  return raw.match(/^\d{4}/)?.[0] ?? raw;
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

function validateCvJson(resume) {
  const basics = resume.basics ?? {};
  const location = basics.location ?? {};

  assert(text(basics.name), "JSON Resume missing basics.name");
  assert(text(basics.label) || text(basics.summary), "JSON Resume missing basics.label or basics.summary");
  assert(text(location.address) || text(location.city) || text(location.region), "JSON Resume missing basics.location");
  assert(text(basics.url) || text(resume.meta?.canonical), "JSON Resume missing website/current CV URL");
  assert(text(basics.email), "JSON Resume missing basics.email");
  assert(Array.isArray(resume.work) && resume.work.length > 0, "JSON Resume missing work entries");
  assert(Array.isArray(resume.education) && resume.education.length > 0, "JSON Resume missing education entries");
  assert(Array.isArray(resume.skills) && resume.skills.length > 0, "JSON Resume missing skills entries");

  assert(resume.work.some(item => text(item.name)), "Work entries missing organization names");
  assert(resume.work.some(item => text(item.position)), "Work entries missing positions");
  assert(resume.work.some(item => text(item.startDate) || text(item.endDate)), "Work entries missing dates");
  assert(resume.work.some(item => text(item.summary) || (item.highlights ?? []).some(text)), "Work entries missing summaries or highlights");

  assert(flattenCvText(resume).length > 0, "JSON Resume did not produce parser-readable text");
}

function validateMarkdown(markdown, resume) {
  assert(markdown.startsWith(`# ${resume.basics?.name}`), "Markdown should start with the CV name as H1");
  assert(!/<\/?[a-z][\s\S]*>/i.test(markdown), "Markdown should not contain raw HTML tags");
  assert(!/\bundefined\b|\bnull\b/i.test(markdown), "Markdown contains undefined/null text");
  assert(wordCount(markdown) >= minWords, `Markdown has too little parser-readable text; expected at least ${minWords} words`);

  for (const heading of ["Details", "Profile", "Education"]) {
    assert(markdown.includes(`## ${heading}`), `Markdown missing ${heading} heading`);
  }
  assert(/## .*Experience/i.test(markdown), "Markdown missing experience heading");
  assert(/## .*Skills/i.test(markdown), "Markdown missing skills heading");
}

function validateExtractedText(label, extractedText, resume) {
  const normalized = normalizeForSearch(extractedText);
  assert(wordCount(extractedText) >= minWords, `${label} has too little extractable text; expected at least ${minWords} words`);

  const basics = resume.basics ?? {};
  const location = basics.location ?? {};
  const required = [
    basics.name,
    basics.label,
    location.address,
    location.city,
    "Experience",
    "Education",
    "Skills",
    ...(resume.work ?? []).flatMap(item => [item.name, item.position, searchableDate(item.startDate), searchableDate(item.endDate), item.location]),
    ...(resume.education ?? []).flatMap(item => [item.institution, item.area, item.studyType]),
    ...(resume.skills ?? []).map(item => item.name),
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
