#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const temp = await mkdtemp(join(tmpdir(), "papyrus-plugins-"));

try {
  const plugins = await import("../../src/plugins/index.mjs");
  const tree = {
    type: "root",
    children: [
      { type: "paragraph", children: [
        { type: "link", url: "/posts/example/", children: [] },
        { type: "image", url: "/images/example.png", alt: "Example" },
        { type: "link", url: "https://example.com/", children: [] },
        { type: "link", url: "#section", children: [] },
      ] },
    ],
  };

  plugins.remarkPapyrusBasePath({ base: "/docs/" })(tree);
  const [internalLink, internalImage, externalLink, fragmentLink] = tree.children[0].children;
  assert(internalLink.url === "/docs/posts/example/", "base-path plugin should rewrite root-relative Markdown links");
  assert(internalImage.url === "/docs/images/example.png", "base-path plugin should rewrite root-relative Markdown images");
  assert(externalLink.url === "https://example.com/", "base-path plugin should preserve external links");
  assert(fragmentLink.url === "#section", "base-path plugin should preserve fragment links");

  const validDist = join(temp, "valid");
  await mkdir(join(validDist, "posts", "example"), { recursive: true });
  await writeFile(join(validDist, "index.html"), '<a href="/docs/posts/example/">Example</a><script src="/docs/pagefind/pagefind-ui.js"></script>');
  await writeFile(join(validDist, "posts", "example", "index.html"), '<a href="/docs/">Home</a>');
  await writeFile(join(validDist, "example.md.txt"), '[Example](/docs/not-a-rendered-link/)');
  const valid = await plugins.validateBuiltLinks(validDist, { base: "/docs/" });
  assert(valid.broken.length === 0 && valid.checkedFiles.length === 2, "link validator should accept base-aware internal links");
  assert(!valid.broken.some((item) => item.includes("/pagefind/")), "link validator should defer Pagefind assets generated after Astro build");

  await writeFile(join(validDist, "index.html"), '<a href="/docs/missing/">Missing</a>');
  const invalid = await plugins.validateBuiltLinks(validDist, { base: "/docs/" });
  assert(invalid.broken.some((item) => item.includes("/docs/missing/")), "link validator should report missing base-aware routes");

  const markdownDir = join(temp, "content");
  await mkdir(markdownDir, { recursive: true });
  await writeFile(join(markdownDir, "valid.md"), "# Valid\n\n[Example](/docs/posts/example/)\n");
  await writeFile(join(markdownDir, "invalid.md"), "# Invalid\n\n[Missing](/docs/missing/)\n");
  const sourceLinks = await plugins.validateMarkdownLinks(markdownDir, validDist, { base: "/docs/" });
  assert(sourceLinks.broken.some((item) => item.includes("invalid.md:3:1 -> /docs/missing/")), "source validator should report the original Markdown line and column");
  assert(!sourceLinks.broken.some((item) => /(^|\/)valid\.md:/.test(item)), "source validator should accept valid base-aware Markdown routes");

  const integrationCases = [
    [plugins.papyrusBasePath(), "astro-papyrus-base-path", "astro:config:setup"],
    [plugins.papyrusLinkValidator(), "astro-papyrus-links-validator", "astro:build:done"],
    [plugins.papyrusMdTxt(), "astro-papyrus-md-txt", "astro:config:setup"],
    [plugins.papyrusSiteGraph(), "astro-papyrus-site-graph", "astro:config:setup"],
  ];
  for (const [integration, name, hook] of integrationCases) {
    assert(integration.name === name, `plugin integration name changed: ${name}`);
    assert(typeof integration.hooks[hook] === "function", `${name} should expose ${hook}`);
  }

  const injectedMdRoutes = [];
  const mdConfigUpdates = [];
  await plugins.papyrusMdTxt().hooks["astro:config:setup"]({
    injectRoute(route) { injectedMdRoutes.push(route); },
    updateConfig(config) { mdConfigUpdates.push(config); },
  });
  assert(injectedMdRoutes.some((route) => route.pattern === "/posts/[...slug].md.txt" && route.prerender === true), "md-txt plugin should inject prerendered post routes");
  assert(mdConfigUpdates.some((config) => config.vite?.plugins?.some((plugin) => plugin.name === "vite-plugin-papyrus-md-txt")), "md-txt plugin should expose its adapted route config through a virtual module");

  const mdRoute = await readFile("src/plugins/routes/md-txt.ts", "utf8");
  const graphRoute = await readFile("src/plugins/routes/site-graph.astro", "utf8");
  const graphComponent = await readFile("src/components/PapyrusSiteGraph.astro", "utf8");
  const graphIntegration = await readFile("src/plugins/site-graph.mjs", "utf8");
  const notices = await readFile("THIRD_PARTY_NOTICES.md", "utf8");
  const postRoute = await readFile("src/template/pages/posts/[...slug].astro", "utf8");
  const installGuide = await readFile("src/content/posts/docs/start/02-install-configure-papyrus.md", "utf8");
  const astroConfig = await readFile("src/astro/config.mjs", "utf8");
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert(mdRoute.includes('"text/plain; charset=utf-8"') && mdRoute.includes('"text/markdown; charset=utf-8"'), "md-txt route should return the upstream-compatible content type for its configured extension");
  assert(mdRoute.includes("publishedPosts") && mdRoute.includes("postSlug") && mdRoute.includes("cleanMdx"), "md-txt route should combine upstream cleaning with Papyrus publication and slug rules");
  assert(graphRoute.includes("public/ai/graph.json") && graphRoute.includes("PapyrusSiteGraph"), "graph route should reuse the generated graph index");
  assert(graphComponent.includes("data-papyrus-graph-node") && graphComponent.includes('role="group"'), "graph fallback should retain the accessible local SVG renderer");
  assert(graphIntegration.includes('pattern: route'), "site-graph adapter should retain its configurable Papyrus route");
  assert(notices.includes("process is not defined") && notices.includes("816 KB"), "site-graph notice should record why the public upstream wrapper was rolled back");
  assert(postRoute.includes("tags={post.data.hidden ? [] : postTags(post)}"), "hidden posts should not link to intentionally absent public tag pages");
  for (const record of [
    ["starlight-site-graph@0.5.0", "fed9ce0b3aa160255a673aa76aeea17166dcceb9"],
    ["starlight-md-txt@0.1.0", "66dd11fac57d1e913ea40f371722651ed9928525"],
    ["starlight-base-path@0.2.1", "e9b515561ab6c93d70cb21298e585ed0176f050a"],
    ["starlight-links-validator@0.25.3", "e9dc6783a19264773361edf6fdbfc0b6bfa766e0"],
  ]) {
    assert(notices.includes(record[0]) && notices.includes(record[1]), `third-party notice missing ${record[0]} provenance`);
  }
  for (const name of ["papyrusBasePath", "papyrusLinkValidator", "papyrusMdTxt", "papyrusSiteGraph"]) {
    assert(installGuide.includes(`${name}()`), `public install guide should document ${name}`);
  }
  assert(astroConfig.includes("...(options.plugins ?? [])"), "definePapyrusAstroConfig should accept optional Astro plugins");
  assert(packageJson.exports["./plugins"] === "./src/plugins/index.mjs", "package should export astro-papyrus/plugins");

  assert(!packageJson.dependencies?.["starlight-telescope"], "optional Papyrus plugins must not install Starlight and Fuse for every consumer");
  console.log("Verified Papyrus base-path, link-validator, md-txt, and site-graph plugin contracts.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
