#!/usr/bin/env node
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ts from "typescript";

const execFileAsync = promisify(execFile);
const tmp = await mkdtemp(join(tmpdir(), "papyrus-content-"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function same(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

try {
  const source = await readFile("src/utils/posts.ts", "utf8");
  const guide = await readFile("docs/guide.md", "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText.replace('from "./withBase"', 'from "./withBase.mjs"');
  const modulePath = join(tmp, "posts.mjs");
  await writeFile(join(tmp, "withBase.mjs"), `
export function withBase(path, base = "") {
  const normalizedBase = base === "/" ? "" : base.replace(/\\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : \`/\${path}\`;
  return \`\${normalizedBase}\${normalizedPath}\`.replace(/\\/+/g, "/");
}
`);
  await writeFile(modulePath, transpiled);
  const posts = await import(modulePath);

  const nested = {
    id: "voice/ai/agent-stack.md",
    filePath: "src/content/posts/voice/ai/agent-stack.md",
    data: {
      title: "Agent Stack",
      slug: "stable-agent-stack",
      tags: ["ai", "voice"],
      pubDatetime: "2026-01-03",
      modDatetime: "2026-01-05",
      pinned: 2,
    },
    body: "one two three",
  };
  const older = {
    id: "ops/kamailio.md",
    filePath: "src/content/posts/ops/kamailio.md",
    data: {
      title: "Kamailio",
      tags: ["sip"],
      pubDatetime: "2026-01-01",
      pinned: true,
    },
  };
  const draft = {
    id: "draft.md",
    data: {
      title: "Draft",
      tags: ["draft"],
      pubDatetime: "2026-01-10",
      draft: true,
      pinned: 10,
    },
  };
  const latest = {
    id: "latest.md",
    data: {
      title: "Latest",
      tags: ["news"],
      pubDatetime: "2026-01-08",
    },
  };
  const hidden = {
    id: "hidden.md",
    data: {
      title: "Hidden",
      tags: ["archive"],
      pubDatetime: "2026-01-09",
      hidden: true,
    },
  };

  same(posts.folderTags(nested), ["voice", "ai"], "folderTags should derive nested folder tags");
  same(posts.postTags(nested), ["ai", "voice"], "postTags should merge explicit and folder tags without duplicates");
  assert(posts.postSlug(nested) === "stable-agent-stack", "postSlug should prefer explicit slug");
  assert(posts.postSlug(older) === "ops/kamailio", "postSlug should fall back to id without extension");
  assert(posts.postHref(nested) === "/posts/stable-agent-stack/", "postHref should use slug under /posts");
  assert(posts.postHref(older) === "/posts/ops/kamailio/", "postHref should preserve folder path fallback when no slug is set");
  assert(posts.postHref(nested, "/notes") === "/notes/stable-agent-stack/", "postHref should support an alternate base path without changing slug policy");
  assert(posts.pinRank(nested) === 2, "numeric pinned rank should be preserved");
  assert(posts.pinRank(older) === 1, "boolean pinned rank should be 1");
  assert(posts.hasUpdatedDate(nested), "modDatetime on a different day should count as updated");
  assert(posts.isNewPost(nested, new Date("2026-01-20")), "post should count as new inside the 30 day window");
  assert(!posts.isNewPost(older, new Date("2026-02-01")), "post should not count as new outside the 30 day window");
  assert(posts.hasFreshUpdate(nested, new Date("2026-01-20")), "recent modDatetime should count as a fresh update");
  assert(!posts.hasFreshUpdate(nested, new Date("2026-02-10")), "old modDatetime should not count as a fresh update");
  assert(posts.readingTime("word ".repeat(221)) === "2 min", "readingTime should round up by 220 words");
  same(posts.sortPosts([older, latest]).map(post => post.id), ["latest.md", "ops/kamailio.md"], "sortPosts should sort newest first");
  same(posts.sortPostsWithPinned([latest, older, nested]).map(post => post.id), ["voice/ai/agent-stack.md", "ops/kamailio.md", "latest.md"], "sortPostsWithPinned should rank pinned posts first");
  same(posts.routablePosts([draft, hidden, latest, older]).map(post => post.id), ["hidden.md", "latest.md", "ops/kamailio.md"], "routablePosts should include hidden posts but exclude drafts");
  same(posts.publishedPosts([draft, hidden, latest, older]).map(post => post.id), ["latest.md", "ops/kamailio.md"], "publishedPosts should exclude drafts and hidden posts");
  same(posts.hiddenPosts([draft, hidden, latest, older]).map(post => post.id), ["hidden.md"], "hiddenPosts should include hidden non-draft posts only");
  same(posts.pinnedPosts([draft, hidden, latest, older, nested]).map(post => post.id), ["voice/ai/agent-stack.md", "ops/kamailio.md"], "pinnedPosts should exclude drafts and hidden posts and sort by pin rank");
  same(posts.getAllTags([nested, older]), ["ai", "ops", "sip", "voice"], "getAllTags should include folder tags");
  same(posts.postsByTag([nested, older, latest], "ops").map(post => post.id), ["ops/kamailio.md"], "postsByTag should match folder tags");
  const adjacent = posts.getAdjacentPosts([older, nested, latest], "voice/ai/agent-stack.md");
  assert(adjacent.previous?.id === "ops/kamailio.md", "previous adjacent post should be older in sorted order");
  assert(adjacent.next?.id === "latest.md", "next adjacent post should be newer in sorted order");

  const contentRoot = join(tmp, "content");
  const contentOut = join(tmp, "content-structure.md");
  await mkdir(join(contentRoot, "voice", "ai"), { recursive: true });
  await writeFile(join(contentRoot, "index.md"), "---\ntitle: Main Docs\ndescription: Root collection\n---\n");
  await writeFile(join(contentRoot, "voice", "index.md"), "---\ntitle: Voice Docs\ndescription: Voice section\n---\n");
  await writeFile(join(contentRoot, "voice", "ai", "first.md"), "---\ntitle: AI First\ndescription: First file metadata\n---\n");
  await execFileAsync("node", ["scripts/content-outline.mjs", contentRoot, contentOut]);
  const outline = await readFile(contentOut, "utf8");
  assert(outline.includes("Collection: Main Docs"), "content outline should use root folder metadata");
  assert(outline.includes("- voice: Voice Docs"), "content outline should use child folder index metadata");
  assert(outline.includes("- ai: AI First"), "content outline should use first file metadata when no index file exists");
  assert(outline.includes("- voice/ai/first.md: AI First"), "content outline should include markdown file title");

  const demoOut = join(tmp, "demo-content-structure.md");
  await execFileAsync("node", ["scripts/content-outline.mjs", "public/demo/content-tree", demoOut]);
  const generatedDemo = await readFile(demoOut, "utf8");
  const committedDemo = await readFile("public/demo/content-structure.md", "utf8");
  assert(generatedDemo === committedDemo, "public demo content structure should match generated content-outline output");
  assert(committedDemo.includes("Collection: Content knowledge base"), "public content outline should include root collection metadata");
  assert(committedDemo.includes("- guides: Guides"), "public demo outline should include child folder metadata");
  assert(committedDemo.includes("_How-to documents grouped by folder metadata._"), "public demo outline should include folder descriptions");
  assert(committedDemo.includes("- notes: Field notes"), "public demo outline should use first markdown file metadata for notes folder");
  assert(committedDemo.includes("- guides/theme.md: Theme profiles"), "public demo outline should include nested markdown titles");

  for (const phrase of [
    "Stable route policy",
    "Prefer explicit `slug:` frontmatter for public posts",
    "when the source file moves between folders",
    "postSlug()` falls back to the source path",
    "`postHref(post)` renders posts under `/posts/<slug>/` by default",
    "Backlink and Obsidian-style linking plan",
    "Do not rewrite `[[wiki-style links]]` in the theme package yet",
  ]) {
    assert(guide.includes(phrase), `guide missing stable URL/backlink policy phrase: ${phrase}`);
  }
  assert(
    guide.includes("Node focus, direct") && guide.includes("Backlink parsing and richer force-layout behavior remain planned features"),
    "guide missing planned backlink/graph interaction guidance"
  );

  console.log("Verified post utilities, stable route policy, backlink plan, and content-outline folder metadata behavior.");
} finally {
  await rm(tmp, { recursive: true, force: true });
}
