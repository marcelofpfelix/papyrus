#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = ["dist", "public"];
const extensions = new Set([".html", ".json", ".md", ".txt", ".xml"]);
const excludedParts = new Set(["_astro", "pagefind"]);
const forbidden = [
  "TODO",
  "FIXME",
  "lorem",
  "dummy",
  "placeholder",
  "Description not set",
  "Waiting for api",
  "GitHub metadata unavailable",
  "Original CV",
  "docsDescription",
  "baseExample",
  "postExample",
  "commentsExample",
  "pluginExample",
  "demoPluginConfig",
  "__PAPYRUS_CODE_BLOCK",
  "https://example.com",
  "https://github.com/example/site",
  "127.0.0.1",
  "request audits",
  "What the Site Owns",
  "Configure Site Defaults",
  "Create a Base Page",
  "Route Checklist",
  "Add Posts",
  "Render a Post Page",
  "Enable Search, RSS, and Metadata",
  "Add a Profile",
  "Keep the Boundary Clean",
  "Paragraph Features",
  "GitHub Alerts",
  "Link Preview",
  "Definition List",
  "Horizontal Rule",
  "What This Page Shows",
  "Content Knowledge Base",
  "CV Templates",
  "Field Notes",
  "Console Fences",
  "Example Author",
  'data-gh-stars>?',
  'data-gh-forks>?',
  ">language<",
  ">license<",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extension(path) {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

function shouldSkip(path) {
  return path.split("/").some((part) => excludedParts.has(part));
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (shouldSkip(path)) continue;
    if (entry.isDirectory()) {
      files.push(...await walk(path));
      continue;
    }
    if (extensions.has(extension(entry.name))) files.push(path);
  }

  return files;
}

function publicText(path, source) {
  if (!path.endsWith(".html")) return source;
  return source
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\splaceholder=(["']).*?\1/gi, "");
}

const files = [];
for (const root of roots) {
  files.push(...await walk(root));
}

const failures = [];
for (const file of files) {
  const content = publicText(file, await readFile(file, "utf8"));
  for (const phrase of forbidden) {
    if (content.includes(phrase)) failures.push(`${relative(process.cwd(), file)} contains ${JSON.stringify(phrase)}`);
  }
}

assert(failures.length === 0, `Public content fallback text found:\n${failures.join("\n")}`);

const llmsFull = await readFile("public/llms-full.txt", "utf8");
assert(llmsFull.includes('<PapyrusPostList posts={posts} view="list" />'), "llms-full.txt should preserve post-list Astro examples");
assert(llmsFull.includes('<PapyrusBaseLayout title="My site" description="Custom page.">'), "llms-full.txt should preserve layout Astro examples");
assert(llmsFull.includes("publishedPosts(await getCollection(\"posts\"))") && llmsFull.includes("The public posts page uses the standard list view"), "llms-full.txt should document the public post-list helper");
assert(llmsFull.includes("Use folders for organization, inherited tags, and section labels"), "llms-full.txt should document folder-aware post tags");
assert(!llmsFull.includes("[user.email_parts]"), "llms-full.txt should not document the unsupported user.email_parts TOML shape");
assert(llmsFull.includes('email_user = "hello"') && llmsFull.includes('email_domain = "site.test"'), "llms-full.txt should document the supported split email TOML fields");

const mainRss = await readFile("dist/rss.xml", "utf8");
assert(mainRss.includes("Reusable Astro theme package for posts, docs, projects, profile/CV pages, search, RSS, and generated metadata."), "main RSS feed should use polished public-site description");
assert(!mainRss.includes("Example feed for Papyrus") && !mainRss.includes("profile examples"), "main RSS feed should not use generic example wording");

const demoPostSource = await readFile("public/demo/post-demo.md", "utf8");
assert(demoPostSource.includes("Markdown source reference"), "public post demo source should explain its source-action purpose");
assert(demoPostSource.includes("copy a canonical citation"), "public post demo source should explain copy/source actions");
assert(!demoPostSource.includes("Markdown source example"), "public post demo source should not use scaffold-style example title");

const demoSiteData = JSON.parse(await readFile("public/demo/site-data.json", "utf8"));
for (const note of demoSiteData.notes ?? []) {
  assert(!/\b(test|todo|lorem|placeholder)\b/i.test(note.text), `demo note ${note.id} should not read as filler`);
  assert(note.text.includes("Papyrus") || note.text.includes("Theme") || note.text.includes("Code") || note.text.includes("CV"), `demo note ${note.id} should describe a real feature`);
}
for (const project of demoSiteData.projects ?? []) {
  assert(project.description?.length > 40, `project ${project.title} should have a useful public description`);
  assert(Array.isArray(project.links) && project.links.length > 0, `project ${project.title} should expose useful public links`);
  assert(project.status !== "example", `project ${project.title} should not use scaffold-style example status`);
}
assert(demoSiteData.projects.some(project => project.title === "CV profile components" && project.description.includes("one normalized profile data source") && project.links?.some(link => link.label === "components")), "CV profile project should use reference-style normalized-data wording");

const homeHtml = await readFile("dist/index.html", "utf8");
assert(homeHtml.includes("/posts/install-configure-papyrus/") && homeHtml.includes("start here"), "home page should point new users to the install guide");
assert(homeHtml.includes("Code fences use Astro/Shiki") && homeHtml.includes("Theme profiles own light and dark token sets") && homeHtml.includes("Keep CV data stable"), "home notes should be real feature notes, not filler");

const publicDocsIndexHtml = await readFile("dist/collections/docs/index.html", "utf8");
for (const repoOnlyDoc of ["guide", "request-audit", "status-roadmap", "pure-parity"]) {
  assert(!publicDocsIndexHtml.includes(`/collections/docs/${repoOnlyDoc}/`), `repo-only ${repoOnlyDoc} doc should not be linked from the public docs collection index`);
}
assert(publicDocsIndexHtml.includes("References") && publicDocsIndexHtml.includes("Feature map") && publicDocsIndexHtml.includes("Route-by-route guide to public Papyrus features."), "docs collection index should label feature docs as references");
assert(!publicDocsIndexHtml.includes(">Examples<") && !publicDocsIndexHtml.includes("feature examples stay in one"), "docs index should avoid generic Examples section wording");
assert(publicDocsIndexHtml.includes("Start") && publicDocsIndexHtml.includes("Getting started, feature configuration, and the core Papyrus content model."), "docs collection index should expose the getting-started section");
assert(!publicDocsIndexHtml.includes("/posts/ai-first-metadata-demo/") && !publicDocsIndexHtml.includes("AI-first metadata"), "docs collection index should not link the removed AI metadata post");
assert(!publicDocsIndexHtml.includes('{ ... }'), "docs index should not use placeholder CSS theme examples");
assert(!publicDocsIndexHtml.includes("Post layout example for published dates"), "docs index should not use scaffold-style metadata wording");
assert(!publicDocsIndexHtml.includes("TOML and Astro content collection examples for CV input."), "docs index should not resurrect removed CV demo wording");

const pluginFeaturesHtml = await readFile("dist/collections/docs/features/index.html", "utf8");
assert(!pluginFeaturesHtml.includes("@example/papyrus-giscus") && !pluginFeaturesHtml.includes("@example/papyrus-diagrams"), "features docs should not show placeholder plugin package names");
assert(pluginFeaturesHtml.includes("Community plugins stay small") && pluginFeaturesHtml.includes("optional feature"), "features docs should describe the current plugin contract");

const codeDemoHtml = await readFile("dist/collections/docs/code-demo/index.html", "utf8");
assert(codeDemoHtml.includes('alt="Profile fixture avatar"'), "Markdown code guide should use fixture-style image alt text");
assert(!codeDemoHtml.includes('alt="Example profile avatar"'), "Markdown code guide should not use generic example image alt text");
assert(codeDemoHtml.includes("Keep feature walkthroughs explicit"), "Markdown code guide should use walkthrough wording in task lists");
assert(!codeDemoHtml.includes("Keep feature examples explicit"), "Markdown code guide should avoid generic feature-example task wording");

const contentStructureHtml = await readFile("dist/collections/docs/content-structure/index.html", "utf8");
assert(contentStructureHtml.includes("papyrus-content-outline public/demo/content-tree public/demo/content-structure.md"), "content-structure docs should show the outline generation command");
assert(contentStructureHtml.includes("direct route") && contentStructureHtml.includes("public lists, feeds, sitemaps, search, and AI exports") && contentStructureHtml.includes("<code>hidden: true</code>"), "content-structure docs should explain hidden direct-route boundaries");
assert(contentStructureHtml.includes("User-facing docs now live as regular posts under <code>src/content/posts/docs</code>"), "content-structure docs should distinguish public docs from repo-only notes");
assert(contentStructureHtml.includes("Development-only notes stay under <code>.agents/</code>"), "content-structure docs should state repo-only docs boundary");
assert(contentStructureHtml.includes("generated Markdown outline remains available as a public fixture") && contentStructureHtml.includes("/demo/content-structure.md"), "content-structure docs should present demo content as a public fixture");
assert(!contentStructureHtml.includes("public example content") && !contentStructureHtml.includes("papyrus example"), "content-structure docs should not use generic example wording");

const deployHtml = await readFile("dist/collections/docs/deploy/index.html", "utf8");
assert(deployHtml.includes("Build settings") && deployHtml.includes("package manager: pnpm"), "deploy docs should show static-host build settings");
assert(deployHtml.includes('SITE_URL="https://example.test" pnpm build') && deployHtml.includes("output directory: dist"), "deploy docs should document production URL and dist output");
assert(deployHtml.includes("Astro <code>base</code> option") && deployHtml.includes("withBase()") && deployHtml.includes("getRelativeLocaleUrl()"), "deploy docs should document base-path helper expectations");
assert(deployHtml.includes("minimumReleaseAge") && deployHtml.includes("production builds do not pick up packages published") && deployHtml.includes("only minutes ago"), "deploy docs should carry the dependency freshness policy into production builds");

const profileHtml = await readFile("dist/profile/index.html", "utf8");
assert(profileHtml.includes(">Source<") && profileHtml.includes("profile.toml") && profileHtml.includes("profile.json") && profileHtml.includes("profile.md"), "profile page should expose canonical source links through the shared action menu");
assert(!profileHtml.includes("Original CV"), "profile page should not use the ambiguous Original CV label");

const projectsHtml = await readFile("dist/projects/index.html", "utf8");
assert(projectsHtml.includes("Project data"), "projects page should document the project source data shape");
assert(projectsHtml.includes("Project cards") && projectsHtml.includes("pinned homepage cards") && projectsHtml.includes("full project index"), "projects page should label the full project-card list accurately");
assert(!projectsHtml.includes("Pinned Projects"), "projects page should not label the full project index as only pinned projects");
assert(projectsHtml.includes("&quot;links&quot;") && projectsHtml.includes("&quot;features&quot;") && projectsHtml.includes("&quot;repo&quot;"), "projects page should show link entries in the project data example");
assert(projectsHtml.includes("homepage cards") && projectsHtml.includes("AI/project JSON"), "projects page should explain reuse across rendered and generated surfaces");
assert(projectsHtml.includes('href="/profile/"') && projectsHtml.includes('href="/posts/cv-profile/"') && projectsHtml.includes('href="/ai/graph.json"'), "projects page should link fixture cards to live public routes and generated artifacts");

const metadataDemoHtml = await readFile("dist/metadata-demo/index.html", "utf8");
assert(!metadataDemoHtml.includes('rel="canonical" href="https://example.com'), "metadata demo should not publish an example.com canonical URL");
assert(metadataDemoHtml.includes('rel="canonical" href="https://papyrus.marcelofelix.com/metadata-demo/"'), "metadata demo should publish its own canonical URL");
assert(metadataDemoHtml.includes("Post layout reference for published date, updated date, reading time, and tags."), "metadata demo should use reference-style public description");
assert(!metadataDemoHtml.includes("Post layout example with published date"), "metadata demo should not use scaffold-style example description");
const metadataFooter = metadataDemoHtml.match(/<footer class="papyrus-post-footer">([\s\S]*?)<\/footer>/)?.[1] ?? "";
assert(metadataFooter.includes("Jul 01") && metadataFooter.includes("Jul 03"), "post detail footer should show both created and updated dates inside the post");
assert(metadataFooter.includes("M16 2v4") && metadataFooter.includes("M21 12a9 9 0 0 1-9 9"), "post detail footer should use calendar and refresh icons for created/updated dates");

const installPostHtml = await readFile("dist/posts/install-configure-papyrus/index.html", "utf8");
assert(!installPostHtml.includes("[user.email_parts]"), "install guide should not document the unsupported user.email_parts TOML shape");
assert(installPostHtml.includes("email_user") && installPostHtml.includes("hello"), "install guide should document the supported email_user TOML field");
assert(installPostHtml.includes("email_domain") && installPostHtml.includes("site.test"), "install guide should document the supported email_domain TOML field");
assert(installPostHtml.includes("routablePosts") && installPostHtml.includes("adjacentPosts"), "install guide should document separate routable and adjacent post sets");
assert(installPostHtml.includes("postTags") && installPostHtml.includes("tags={postTags(post)}"), "install guide should document folder-aware post tags");
assert(installPostHtml.includes("minimumReleaseAge") && installPostHtml.includes("10080"), "install guide should document the seven-day pnpm mature-release gate");
assert(installPostHtml.includes("minimumReleaseAgeStrict") && installPostHtml.includes("fail instead of silently falling back"), "install guide should document strict mature-release behavior");
assert(installPostHtml.includes("Publishing with Papyrus") && installPostHtml.includes("A short implementation note published from a Papyrus-powered site."), "install guide post example should use polished post metadata");
assert(!installPostHtml.includes("First post in a Papyrus site."), "install guide post example should avoid first-post scaffold wording");

const searchPostHtml = await readFile("dist/posts/dark-mode-and-search/index.html", "utf8");
assert(searchPostHtml.includes("PapyrusBaseLayout") && searchPostHtml.includes('title="Search"'), "search guide should show a complete PapyrusBaseLayout search route example");
assert(searchPostHtml.includes("Static search for posts, tags, and archive entries.") && searchPostHtml.includes("searchHref") && searchPostHtml.includes("/search/"), "search guide should document searchHref with required layout props");
assert(searchPostHtml.includes("The public Papyrus site builds a Pagefind index"), "search guide should describe the package site's search implementation directly");
assert(!searchPostHtml.includes("Search example") && !searchPostHtml.includes("The demo site builds"), "search guide should not use placeholder or demo-site route titles");

const featuresHtml = await readFile("dist/collections/docs/features/index.html", "utf8");
for (const phrase of ["SEO and social metadata", "Base path deploys", "Search, tags, sitemap, and robots", "Plugin contract"]) {
  assert(featuresHtml.includes(phrase), `features docs should use concrete public docs heading: ${phrase}`);
}
for (const phrase of ["SEO Friendly", "Dynamic Sitemap", "Fully Accessible", "Search Box, Categories"]) {
  assert(!featuresHtml.includes(phrase), `features docs should not use checklist-style heading: ${phrase}`);
}
assert(!featuresHtml.includes("category pages"), "features docs should not imply built-in category pages");
assert(featuresHtml.includes("Regenerate the sitemap") && featuresHtml.includes("dynamic <code>robots.txt</code> route"), "features docs should explain sitemap and robots as direct user documentation");
assert(featuresHtml.includes("Community plugins stay small") && featuresHtml.includes("do not mutate Papyrus"), "features docs should describe plugin boundaries");
assert(!featuresHtml.includes("should regenerate its sitemap") && !featuresHtml.includes("navigate the demo with a keyboard") && !featuresHtml.includes("The resolved example config") && !featuresHtml.includes("while this example renders"), "features docs should not use audit-style sitemap/accessibility wording");

const featureMapHtml = await readFile("dist/collections/docs/feature-map/index.html", "utf8");
assert(featureMapHtml.includes("Feature flags and plugin contract") && featureMapHtml.includes("typed plugin configuration"), "feature map should describe plugin docs as a reusable configuration pattern");
assert(featureMapHtml.includes("CV/profile templates") && featureMapHtml.includes("normalized CV data") && featureMapHtml.includes("Site config"), "feature map should describe profile data and CV routes as public reusable surfaces");
assert(!featureMapHtml.includes("/docs/cv-data/") && !featureMapHtml.includes("/collections/docs/cv-data/"), "feature map should not link removed CV data docs");
assert(featureMapHtml.includes("Every public feature has a route") && featureMapHtml.includes("Repository-only implementation notes stay outside visitor-facing docs"), "feature map should describe the public site directly");
assert(!featureMapHtml.includes("example plugin configuration") && !featureMapHtml.includes("This example site focuses"), "feature map should not use demo-only wording for public docs");

const packageShapeHtml = await readFile("dist/posts/papyrus-package-shape/index.html", "utf8");
assert(packageShapeHtml.includes("publishedPosts"), "package-shape post should show the public post filtering helper");
assert(!packageShapeHtml.includes("sortPosts"), "package-shape import snippet should not include unused helpers");
assert(packageShapeHtml.includes("per tag or site-owned section"), "package-shape RSS docs should use tag-first section wording");
assert(!packageShapeHtml.includes("per tag or category"), "package-shape RSS docs should not present categories as built-in feed taxonomy");
assert(packageShapeHtml.includes("posts tagged with custom authoring features") && packageShapeHtml.includes("important subscription choices"), "package-shape RSS docs should describe tag feeds as subscription choices");
assert(!packageShapeHtml.includes("custom tag examples") && !packageShapeHtml.includes("important examples inside"), "package-shape RSS docs should avoid generic example wording");
assert(packageShapeHtml.includes("documentation references, landing pages, or custom sections") && packageShapeHtml.includes("post-list-view-reference.astro"), "package-shape post should describe alternate list views as documentation references");
assert(!packageShapeHtml.includes("feature examples, landing pages") && !packageShapeHtml.includes("post-list-view-examples.astro"), "package-shape post should avoid generic feature-example wording for list views");

const markdownAuthoringHtml = await readFile("dist/posts/markdown-feature-sample/index.html", "utf8");
assert(markdownAuthoringHtml.includes('href="/demo/theme-flow.mmd"') && markdownAuthoringHtml.includes('href="/demo/call-flow.puml"') && markdownAuthoringHtml.includes('href="/demo/sketch.excalidraw"'), "Markdown authoring guide should link to public demo artifact fixtures");
assert(!markdownAuthoringHtml.includes('href="/diagrams/'), "Markdown authoring guide should not link to missing /diagrams fixtures");

const cvProfilePostHtml = await readFile("dist/posts/cv-profile/index.html", "utf8");
assert(cvProfilePostHtml.includes("src/data/profile.toml") && cvProfilePostHtml.includes("/cv/profile.json") && cvProfilePostHtml.includes("/cv/profile.md"), "CV profile post should point to concrete CV data source/export guidance");
assert(!cvProfilePostHtml.includes("TOML and Astro content collection examples for feeding profile data into Papyrus."), "CV profile post should not describe CV data as generic examples");

const notFoundHtml = await readFile("dist/404.html", "utf8");
assert(notFoundHtml.includes("Closest matches") && notFoundHtml.includes("Search posts and tags.") && notFoundHtml.includes("Browse configured post collections."), "404 search suggestion should use post/tag/collection wording");
assert(!notFoundHtml.includes("category, tag, and hidden-archive entry points"), "404 search suggestion should not present categories as built-in search facets");

const hiddenPostHtml = await readFile("dist/posts/hidden-post-demo/index.html", "utf8");
assert(hiddenPostHtml.includes('<meta name="robots" content="noindex'), "hidden post demo should emit noindex robots metadata");
assert(!llmsFull.includes("Hidden post demo"), "hidden post demo should stay out of llms-full.txt");

const postsIndexHtml = await readFile("dist/posts/index.html", "utf8");
const timelineHtml = await readFile("dist/posts/timeline/index.html", "utf8");
const astroTagHtml = await readFile("dist/tag/astro/index.html", "utf8");
const searchHtml = await readFile("dist/search/index.html", "utf8");
assert(searchHtml.includes("Search public content, browse sections, or open tag pages.") && searchHtml.includes("/tag/papyrus/"), "search page should expose sections and tag pages");
assert(searchHtml.includes('aria-label="Sections"'), "search page should label optional facets as sections");
assert(!searchHtml.includes('aria-label="Categories"') && !searchHtml.includes("categories, tags"), "search page should not present categories as a built-in taxonomy");
const markdownGuideItem = postsIndexHtml.match(/<li[^>]*>\s*<a href="\/posts\/markdown-feature-sample\/">([\s\S]*?)<\/a>\s*<\/li>/)?.[1] ?? "";
assert(markdownGuideItem.includes("Jun 30") && !markdownGuideItem.includes("Jun 29"), "posts index should show only the updated date for the updated Markdown guide");
assert(markdownGuideItem.includes("M21 12a9 9 0 0 1-9 9") && !markdownGuideItem.includes("M16 2v4"), "posts index updated date should use the refresh icon instead of the calendar icon");
assert((await readFile("src/styles/papyrus.css", "utf8")).includes(".papyrus-post-recently-updated svg"), "recently updated list styling should target the icon, not the whole date item");
assert(!postsIndexHtml.includes("Hidden post demo"), "hidden post demo should stay out of public posts index");
assert(!timelineHtml.includes("Hidden post demo"), "hidden post demo should stay out of public timeline");
assert(!astroTagHtml.includes("Hidden post demo"), "hidden post demo should stay out of public tag pages");
assert(searchHtml.includes('"href":"/posts/hidden-post-demo/"'), "hidden post demo should remain available through explicit archive search data");

const routeMetadataChecks = [
  ["dist/index.html", "papyrus", "Reusable Astro theme package"],
  ["dist/about/index.html", "About", "Compact about page pattern"],
  ["dist/collections/docs/index.html", "Papyrus docs", "Package docs for installing"],
  ["dist/collections/docs/feature-map/index.html", "Feature map", "public Papyrus features"],
  ["dist/posts/install-configure-papyrus/index.html", "Install and configure Papyrus", "recommended starting point"],
  ["dist/posts/markdown-feature-sample/index.html", "Markdown authoring guide", "practical guide"],
  ["dist/posts/index.html", "Posts", "All public posts"],
  ["dist/search/index.html", "Search", "Static search"],
  ["dist/profile/index.html", "Profile", "public fixture"],
  ["dist/projects/index.html", "Projects", "Project list page"],
  ["dist/404.html", "Not found", "Find a nearby page"],
];

for (const [file, expectedTitle, expectedDescription] of routeMetadataChecks) {
  const html = await readFile(file, "utf8");
  const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  assert(title.toLowerCase().includes(expectedTitle.toLowerCase()), `${file} should have a meaningful title`);
  assert(description.toLowerCase().includes(expectedDescription.toLowerCase()), `${file} should have a meaningful meta description`);
}

console.log(`Verified public content text across ${files.length} generated files.`);
