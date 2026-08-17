#!/usr/bin/env node
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const tmp = await mkdtemp(join(tmpdir(), "papyrus-cv-"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

try {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const source = (await readFile("src/utils/cv.ts", "utf8"))
    .replace(
      'import { isPapyrusImageEffect, type PapyrusImageEffect } from "./image-effects";',
      'type PapyrusImageEffect = string; const isPapyrusImageEffect = (value: unknown): value is string => typeof value === "string";'
    );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText;
  const modulePath = join(tmp, "cv.mjs");
  await writeFile(modulePath, output);
  const cv = await import(modulePath);

  const data = {
    user: {
      name: "Marcelo",
      avatar: "/avatar.png",
      bio: "Telephony engineer",
      link: "bandonga.com",
      email_user: "marcelo",
      email_domain: "example.net",
      links: ["github"],
      github: { name: "marcelofpfelix", url: "https://github.com/" },
      pgp_key: "https://keys.openpgp.org/search?q=0123456789ABCDEF",
      pgp_fingerprint: "0123 4567 89AB CDEF",
      location: "Lisbon",
      born: "1980-01-01",
      nationality: ["nat_pt"],
      nat_pt: { name: "Portuguese", flag: "pt" },
      languages: ["lang_en"],
      lang_en: { name: "English", flag: "gb" },
      roles: ["Engineer"],
      pages: 2,
      sections: ["experience", "skills"],
      data: {
        experience: {
          title: "Experience",
          icon: "briefcase",
          page: 1,
          groups: ["telnyx"],
          telnyx: {
            ententy: "Telnyx",
            url: "telnyx.com",
            logo: "/telnyx.png",
            items: ["voice"],
            voice: {
              title: "Voice Platform",
              dates: "2020 - now",
              location: "Remote",
              range: { a: "2020-01-01", b: "2026-01-01" },
              description: "Runs SIP.<br>Builds tooling.",
            },
          },
        },
        skills: {
          title: "Skills",
          groups: ["skills"],
          skills: {
            items: ["skills"],
            skills: {
              description: "Rust<br>Astro",
            },
          },
        },
      },
    },
  };

  const user = cv.normalizeJekyllCvUser(data);
  assert(user.name === "Marcelo", "user name was not normalized");
  assert(user.url === "https://bandonga.com", "scheme-less profile URL was not normalized");
  assert(user.email === undefined, "split email should not be combined into a raw public address");
  assert(user.emailParts?.user === "marcelo", "email user part was not preserved");
  assert(user.emailParts?.domain === "example.net", "email domain part was not preserved");
  assert(user.pages === 2, "pages field was not preserved");
  assert(user.nationality?.[0]?.flag === "pt", "nationality flag was not preserved");
  assert(user.languages?.[0]?.name === "English", "language entry was not preserved");
  assert(user.links?.[0]?.href === "https://github.com/marcelofpfelix", "profile link was not normalized");
  assert(user.links?.some(link => link.icon === "pgp" && link.href?.includes("keys.openpgp.org")), "PGP link was not normalized");
  assert(user.sections?.length === 2, "sections were not normalized");
  assert(user.sections?.[0]?.groups?.[0]?.url === "https://telnyx.com", "group URL was not normalized");
  assert(user.sections?.[0]?.groups?.[0]?.items?.[0]?.range?.start === "2020-01-01", "range start was not normalized");
  assert(user.sections?.[0]?.groups?.[0]?.items?.[0]?.description?.includes("Runs SIP.\nBuilds tooling."), "HTML line breaks were not converted");

  const json = cv.cvToJson(user);
  const parsed = JSON.parse(json);
  assert(parsed.name === "Marcelo", "cvToJson output is not valid normalized JSON");
  assert(json.includes('"sections"'), "cvToJson is missing sections");
  const jsonResume = JSON.parse(cv.cvToJsonResume(user));
  assert(jsonResume.basics?.name === "Marcelo", "cvToJsonResume missing basics.name");
  assert(jsonResume.basics?.email === "marcelo＠example.net", "cvToJsonResume should preserve obfuscated split email");
  assert(jsonResume.work?.[0]?.name === "Telnyx", "cvToJsonResume missing work entry");
  assert(jsonResume.skills?.length > 0, "cvToJsonResume missing skills");

  const markdown = cv.cvToMarkdown(user);
  assert(markdown.includes("# Marcelo"), "cvToMarkdown missing title");
  assert(markdown.includes("marcelo＠example.net"), "cvToMarkdown missing obfuscated contact line");
  assert(markdown.includes("## Experience"), "cvToMarkdown missing section heading");
  assert(markdown.includes("### Telnyx"), "cvToMarkdown missing group heading");
  assert(markdown.includes("- Voice Platform"), "cvToMarkdown missing item title");
  assert(markdown.includes("Runs SIP."), "cvToMarkdown missing description");

  assert(await exists("public/demo/users.toml"), "TOML demo source is missing");
  const demoToml = await readFile("public/demo/users.toml", "utf8");
  const profileToml = await readFile("src/data/profile.toml", "utf8");
  assert(demoToml.includes('email_domain = "site.test"'), "public demo TOML should use the reserved site.test email domain");
  assert(profileToml.includes('email_domain = "site.test"'), "profile TOML should use the reserved site.test email domain");
  const guide = await readFile(".agents/package-guide.md", "utf8");
  const sourceComparison = await readFile(".agents/cv-source-comparison.md", "utf8");
  assert(guide.includes("Parser packages belong in consuming sites"), "guide should document parser ownership for YAML/TOML");
  assert(guide.includes("TOML example in a consuming site"), "guide should document consuming-site TOML adapter example");
  assert(!packageJson.dependencies?.yaml && !packageJson.devDependencies?.yaml, "papyrus should not force a yaml parser dependency");
  assert(packageJson.dependencies?.["smol-toml"] || packageJson.devDependencies?.["smol-toml"], "papyrus should include the TOML parser used by CV exports");
  assert(guide.includes("normalizeJekyllCvUser"), "guide should document CV normalization utility");
  assert(guide.includes("cvToJson") && guide.includes("cvToMarkdown") && guide.includes("cvToJsonResume"), "guide should document JSON/Markdown/JSON Resume export helpers");

  for (const phrase of [
    "### CV template contract",
    "A CV template in papyrus is a small Astro composition around the normalized",
    "Pick a built-in `PapyrusCvProfile` variant",
    "Use `sectionOverrides` to rename, hide",
    "Compose smaller components such as `PapyrusCvHero`, `PapyrusCvLinks`",
    "`PapyrusCvSections`, `PapyrusCvExportActions`, `PapyrusCvA4Page`, and",
    "`PapyrusJekyllCvPage`",
    "The stable template inputs are `user`, `variant`, `showSource`, `sourceHref`,",
    "Custom templates should pass normalized data through",
    "unchanged so JSON, Markdown, web profile, and print routes stay in sync",
    '<PapyrusCvProfile user={user} variant="terminal" />',
    '<PapyrusCvProfile user={user} variant="cards" />',
    '<PapyrusCvProfile user={user} variant="timeline" />',
    '<PapyrusCvProfile user={user} variant="a4" />',
    "sectionOverrides={sectionOverrides}",
    "<PapyrusCvA4Page user={user} template=\"classic\" />",
  ]) {
    assert(guide.includes(phrase), `guide missing CV template API phrase: ${phrase}`);
  }

  for (const phrase of [
    "CV source comparison",
    "/Users/marcelof/gwt/marcelofpfelix/jekyllcv/master/_layouts/cv.html",
    "/Users/marcelof/gwt/marcelofpfelix/jekyllcv/master/_includes/cv-templates/default.html",
    "/Users/marcelof/gwt/marcelofpfelix/jekyllcv/master/_includes/cv-profile.html",
    "/Users/marcelof/gwt/marcelofpfelix/jekyllcv/master/_includes/cv-sections.html",
    "/Users/marcelof/gwt/marcelofpfelix/jekyllcv/master/_sass/jekyllcv/_layout.scss",
    "No separate local `bandonga/cv` checkout was found",
    "/Users/marcelof/gwt/marcelofpfelix/marcelofelix/main/src/data/profile.ts",
    "/Users/marcelof/gwt/marcelofpfelix/marcelofelix/main/src/pages/profile/index.astro",
    "/Users/marcelof/gwt/marcelofpfelix/marcelofelix/main/src/pages/profile/print.astro",
    "The source comparison proves that the old sources were re-read and mapped.",
    "exact old jekyllcv visual parity",
    "PDF output parity",
    "consuming-site `marcelofelix` integration",
  ]) {
    assert(sourceComparison.includes(phrase), `CV source comparison missing phrase: ${phrase}`);
  }

  console.log("Verified CV normalization, JSON/Markdown export helpers, and old CV source comparison notes.");
} finally {
  await rm(tmp, { recursive: true, force: true });
}
