#!/usr/bin/env node
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const tmp = await mkdtemp(join(tmpdir(), "papyrus-features-"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function same(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function transpileModule(sourcePath, outputName) {
  const source = await readFile(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText.replaceAll("./features", "./features.mjs");
  const outputPath = join(tmp, outputName);
  await writeFile(outputPath, output);
  return outputPath;
}

try {
  const guide = await readFile(".agents/package-guide.md", "utf8");
  const starlightComparison = await readFile(".agents/starlight-comparison.md", "utf8");
  const featuresPath = await transpileModule("src/utils/features.ts", "features.mjs");
  const pluginsPath = await transpileModule("src/utils/plugins.ts", "plugins.mjs");
  const examplePluginPackage = JSON.parse(await readFile("examples/papyrus-kbd-plugin/package.json", "utf8"));
  const examplePluginSource = (await readFile("examples/papyrus-kbd-plugin/src/index.ts", "utf8"))
    .replace('"astro-theme-papyrus/utils"', JSON.stringify(pathToFileURL(pluginsPath).href));
  const examplePluginPath = join(tmp, "papyrus-kbd-plugin.mjs");
  await writeFile(examplePluginPath, ts.transpileModule(examplePluginSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText);
  const features = await import(featuresPath);
  const plugins = await import(pluginsPath);
  const examplePlugin = await import(examplePluginPath);

  same(features.defaultPapyrusFeatures, {
    header: true,
    footer: true,
    scrollHeader: true,
    search: true,
    rss: true,
    poweredBy: true,
    themeControls: true,
    share: true,
    toc: true,
    postTags: true,
    aiMetadata: true,
    sourceActions: true,
    postStats: true,
    comments: true,
    postSideLinks: true,
    adjacentPosts: true,
    backToTop: true,
    markdownAlerts: true,
    mermaid: true,
    artifactLinks: true,
    imageZoom: true,
    notes: true,
    projects: true,
    graph: true,
    cv: true,
    linkPreviews: true,
    contentIndex: true,
    sectionMenu: true,
  }, "default feature set should enable all built-in features");

  same(features.resolvePapyrusFeatures({ rss: false, share: false, toc: false, header: false, mermaid: false }), {
    header: false,
    footer: true,
    scrollHeader: true,
    search: true,
    rss: false,
    poweredBy: true,
    themeControls: true,
    share: false,
    toc: false,
    postTags: true,
    aiMetadata: true,
    sourceActions: true,
    postStats: true,
    comments: true,
    postSideLinks: true,
    adjacentPosts: true,
    backToTop: true,
    markdownAlerts: true,
    mermaid: false,
    artifactLinks: true,
    imageZoom: true,
    notes: true,
    projects: true,
    graph: true,
    cv: true,
    linkPreviews: true,
    contentIndex: true,
    sectionMenu: true,
  }, "site feature overrides should merge over defaults");

  const commentsPlugin = plugins.definePapyrusPlugin({
    name: "comments",
    description: "Comment rendering",
    packageName: "papyrus-comments",
    docsUrl: "https://example.com/comments",
    featureDefaults: { postStats: true, sourceActions: false },
    capabilities: [
      { kind: "component", name: "Comments" },
      { kind: "script", name: "comment-counts" },
      { kind: "route", name: "comments-endpoint" },
    ],
  });
  const quietPlugin = plugins.definePapyrusPlugin({
    name: "quiet",
    description: "Quiet default layout",
    featureDefaults: { rss: false, share: false },
    capabilities: [
      { kind: "style", name: "quiet-theme" },
      { kind: "data", name: "quiet-metadata" },
    ],
  });
  const lifecyclePlugin = plugins.definePapyrusPlugin({
    name: "lifecycle",
    description: "Lifecycle plugin",
    setup({ addCapability, setFeatureDefaults }) {
      setFeatureDefaults({ search: false, poweredBy: false });
      addCapability({ kind: "integration", name: "setup-hook" });
    },
  });

  assert(commentsPlugin.packageName === "papyrus-comments", "definePapyrusPlugin should return the plugin definition unchanged");

  const resolved = plugins.resolvePapyrusPluginConfig([commentsPlugin, quietPlugin], {
    sourceActions: true,
    toc: false,
  });

  same(resolved.features, {
    header: true,
    footer: true,
    scrollHeader: true,
    search: true,
    rss: false,
    poweredBy: true,
    themeControls: true,
    share: false,
    toc: false,
    postTags: true,
    aiMetadata: true,
    sourceActions: true,
    postStats: true,
    comments: true,
    postSideLinks: true,
    adjacentPosts: true,
    backToTop: true,
    markdownAlerts: true,
    mermaid: true,
    artifactLinks: true,
    imageZoom: true,
    notes: true,
    projects: true,
    graph: true,
    cv: true,
    linkPreviews: true,
    contentIndex: true,
    sectionMenu: true,
  }, "plugin defaults should merge before site overrides");
  same(resolved.plugins.map(plugin => plugin.name), ["comments", "quiet"], "resolved config should preserve plugin order");
  same(resolved.capabilities.map(capability => `${capability.kind}:${capability.name}`), [
    "component:Comments",
    "script:comment-counts",
    "route:comments-endpoint",
    "style:quiet-theme",
    "data:quiet-metadata",
  ], "resolved config should aggregate plugin capabilities");

  const resolvedLifecycle = plugins.resolvePapyrusPluginConfig([lifecyclePlugin], { poweredBy: true });
  same(resolvedLifecycle.features, {
    header: true,
    footer: true,
    scrollHeader: true,
    search: false,
    rss: true,
    poweredBy: true,
    themeControls: true,
    share: true,
    toc: true,
    postTags: true,
    aiMetadata: true,
    sourceActions: true,
    postStats: true,
    comments: true,
    postSideLinks: true,
    adjacentPosts: true,
    backToTop: true,
    markdownAlerts: true,
    mermaid: true,
    artifactLinks: true,
    imageZoom: true,
    notes: true,
    projects: true,
    graph: true,
    cv: true,
    linkPreviews: true,
    contentIndex: true,
    sectionMenu: true,
  }, "setup lifecycle feature defaults should merge before site overrides");
  same(resolvedLifecycle.capabilities.map(capability => `${capability.kind}:${capability.name}`), [
    "integration:setup-hook",
  ], "setup lifecycle should contribute capabilities");

  assert(examplePluginPackage.name === "@example/papyrus-kbd", "example plugin package name changed");
  assert(examplePluginPackage.exports["."] === "./src/index.ts", "example plugin should export its default entry");
  assert(examplePluginPackage.peerDependencies["astro-theme-papyrus"] === "*", "example plugin should peer-depend on astro-theme-papyrus");
  assert(examplePluginPackage.peerDependencies.astro === ">=6.0.0", "example plugin should peer-depend on Astro");
  assert(examplePlugin.default.name === "papyrus-kbd", "example plugin default export missing plugin definition");
  same(examplePlugin.default.capabilities.map(capability => `${capability.kind}:${capability.name}`), [
    "markdown:kbd-shortcodes",
    "style:kbd-theme-tokens",
  ], "example plugin should expose markdown and style capabilities");

  const resolvedWithExample = plugins.resolvePapyrusPluginConfig([examplePlugin.default], { rss: false });
  same(resolvedWithExample.plugins.map(plugin => plugin.packageName), ["@example/papyrus-kbd"], "example plugin should resolve through plugin config");
  same(resolvedWithExample.capabilities.map(capability => `${capability.kind}:${capability.name}`), [
    "markdown:kbd-shortcodes",
    "style:kbd-theme-tokens",
    "script:kbd-copy-help",
  ], "resolved example plugin should aggregate capabilities");
  assert(resolvedWithExample.features.sourceActions === true, "example plugin setup should contribute sourceActions default");

  for (const phrase of [
    "Starlight plugin idea comparisons",
    "starlight-site-graph",
    "starlight-kbd",
    "starlight-auto-sidebar",
    "starlight-contextual-menu",
    "starlight-telescope",
    "Keep as roadmap for global AI-first search and backlinks",
    "dependency-free graph demo with search, type filtering, node focus, and focused connection details",
  ]) {
    assert(guide.includes(phrase), `guide missing Starlight plugin comparison phrase: ${phrase}`);
  }
  assert(
    guide.includes("Do not mark") && guide.includes("community-plugin rows verified") && guide.includes("idea is listed here"),
    "guide missing warning not to close community-plugin rows from idea listing alone"
  );

  for (const phrase of [
    "Context7 `/withastro/starlight` docs on 2026-07-01",
    "@astrojs/starlight/components",
    "Aside",
    "Tabs, TabItem",
    "@astrojs/starlight/components/SocialIcons.astro",
    "autogenerate: { directory: 'reference' }",
    "PP-081",
    "PP-123B",
    "avoid copying private internals",
    "Keep papyrus independent from Starlight",
  ]) {
    assert(starlightComparison.includes(phrase), `Starlight comparison missing phrase: ${phrase}`);
  }
  assert(guide.includes(".agents/starlight-comparison.md"), "guide should link to the Starlight comparison record");
  assert(guide.includes("examples/papyrus-kbd-plugin"), "guide should document the example external plugin fixture");
  assert(guide.includes("setup lifecycle"), "guide should document the plugin setup lifecycle");
  assert(guide.includes("addCapability") && guide.includes("setFeatureDefaults"), "guide should document setup context methods");
  for (const phrase of [
    "Feature implementation rule",
    "isolated reusable units first",
    "standalone Astro component, markdown helper, runtime component",
    "Add a feature flag",
    "public import path stable through `package.json` exports",
    "deep-import Pure or Starlight private internals",
    "proposed upstream to Pure later",
    "Add demo content and verifier coverage",
  ]) {
    assert(guide.includes(phrase), `guide missing future feature implementation rule phrase: ${phrase}`);
  }

  console.log("Verified feature defaults, feature overrides, local plugin config helpers, setup lifecycle, example external plugin fixture, and Starlight comparison notes.");
} finally {
  await rm(tmp, { recursive: true, force: true });
}
