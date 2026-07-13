#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { siteConfig } from "./site-config.mjs";
import { themeTokens } from "./theme-colors.mjs";

const config = await siteConfig();
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const [name, output = "public/site.webmanifest", icon = "/logo.svg"] = args.length === 1 && /\.webmanifest$/i.test(args[0])
  ? [config.title ?? "papyrus site", args[0], "/logo.svg"]
  : [args[0] ?? config.title ?? "papyrus site", args[1] ?? "public/site.webmanifest", args[2] ?? "/logo.svg"];
const tokens = await themeTokens();

const manifest = {
  name,
  short_name: name.split(/\s+/).slice(0, 2).join(" "),
  icons: [
    {
      src: icon,
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any maskable",
    },
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable",
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ],
  theme_color: tokens["--papyrus-bg"],
  background_color: tokens["--papyrus-bg"],
  display: "standalone",
};

const target = resolve(output);
await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${target}`);
