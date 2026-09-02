import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadPapyrusConfig } from "./config/index.js";
import { generateSocialImages } from "../scripts/generate-social-images.mjs";
function templateRoute(path) {
    const localUrl = new URL(path, import.meta.url);
    if (existsSync(fileURLToPath(localUrl)))
        return fileURLToPath(localUrl);
    return fileURLToPath(new URL(`../src/${path.replace(/^\.\//, "")}`, import.meta.url));
}
function localRouteExists(files) {
    return files.some(file => existsSync(file));
}
const defaultRoutes = [
    { pattern: "/", entrypoint: templateRoute("./template/pages/index.astro"), localFiles: ["src/pages/index.astro"] },
    { pattern: "/about", entrypoint: templateRoute("./template/pages/about.astro"), localFiles: ["src/pages/about.astro"] },
    { pattern: "/posts", entrypoint: templateRoute("./template/pages/posts/index.astro"), localFiles: ["src/pages/posts/index.astro"] },
    { pattern: "/posts/timeline", entrypoint: templateRoute("./template/pages/posts/timeline.astro"), localFiles: ["src/pages/posts/timeline.astro"] },
    { pattern: "/posts/[...slug]", entrypoint: templateRoute("./template/pages/posts/[...slug].astro"), localFiles: ["src/pages/posts/[...slug].astro"] },
    { pattern: "/projects", entrypoint: templateRoute("./template/pages/projects.astro"), localFiles: ["src/pages/projects.astro"] },
    { pattern: "/profile", entrypoint: templateRoute("./template/pages/profile/index.astro"), localFiles: ["src/pages/profile/index.astro", "src/pages/profile.astro"] },
    { pattern: "/profile/print", entrypoint: templateRoute("./template/pages/profile/print.astro"), localFiles: ["src/pages/profile/print.astro"] },
    { pattern: "/profile/ast", entrypoint: templateRoute("./template/pages/profile/ast.astro"), localFiles: ["src/pages/profile/ast.astro"] },
    { pattern: "/collections", entrypoint: templateRoute("./template/pages/collections.astro"), localFiles: ["src/pages/collections.astro", "src/pages/collections/index.astro"] },
    { pattern: "/collections/[slug]", entrypoint: templateRoute("./template/pages/collections/[slug].astro"), localFiles: ["src/pages/collections/[slug].astro"] },
    { pattern: "/collections/[collection]/[...slug]", entrypoint: templateRoute("./template/pages/collections/[collection]/[...slug].astro"), localFiles: ["src/pages/collections/[collection]/[...slug].astro"] },
    { pattern: "/search", entrypoint: templateRoute("./template/pages/search.astro"), localFiles: ["src/pages/search.astro", "src/pages/search/index.astro"] },
    { pattern: "/tag", entrypoint: templateRoute("./template/pages/tag/index.astro"), localFiles: ["src/pages/tag/index.astro", "src/pages/tag.astro"] },
    { pattern: "/tag/[tag]", entrypoint: templateRoute("./template/pages/tag/[tag].astro"), localFiles: ["src/pages/tag/[tag].astro"] },
    { pattern: "/404", entrypoint: templateRoute("./template/pages/404.astro"), localFiles: ["src/pages/404.astro"] },
    { pattern: "/llms.txt", entrypoint: templateRoute("./template/pages/llms.txt.ts"), localFiles: ["src/pages/llms.txt.ts", "src/pages/llms.txt.js", "public/llms.txt"] },
    { pattern: "/rss.xml", entrypoint: templateRoute("./template/pages/rss.xml.ts"), localFiles: ["src/pages/rss.xml.ts", "src/pages/rss.xml.js"] },
    { pattern: "/robots.txt", entrypoint: templateRoute("./template/pages/robots.txt.ts"), localFiles: ["src/pages/robots.txt.ts", "src/pages/robots.txt.js"] },
    { pattern: "/giscus/[profile]/[mode].css", entrypoint: templateRoute("./template/pages/giscus/[profile]/[mode].css.ts"), localFiles: ["src/pages/giscus/[profile]/[mode].css.ts", "src/pages/giscus/[profile]/[mode].css.js"] },
    { pattern: "/[...page]", entrypoint: templateRoute("./template/pages/[...page].astro"), localFiles: ["src/pages/[...page].astro"] },
];
const securityTxtRoutes = [
    { pattern: "/.well-known/security.txt", entrypoint: templateRoute("./template/pages/security.txt.ts"), localFiles: ["src/pages/.well-known/security.txt.ts", "src/pages/.well-known/security.txt.js", "public/.well-known/security.txt"] },
    { pattern: "/security.txt", entrypoint: templateRoute("./template/pages/security.txt.ts"), localFiles: ["src/pages/security.txt.ts", "src/pages/security.txt.js", "public/security.txt"] },
];
function pureVirtualConfig(site) {
    const navMenu = site.nav.map((item) => ({
        name: item.label,
        url: item.href,
        external: /^https?:\/\//.test(item.href),
    }));
    const socialLinks = site.socialLinks.map((item) => ({
        name: item.label,
        url: item.href,
        icon: item.icon ?? item.label.toLowerCase(),
    }));
    return {
        title: site.title,
        description: site.description ?? "",
        site: site.site ?? "",
        npmCDN: "https://cdn.jsdelivr.net/npm",
        locale: {
            lang: site.lang || "en-US",
            attrs: site.lang || "en_US",
            dateLocale: site.lang || "en-US",
            dateOptions: {},
        },
        header: {
            title: site.headerTitle ?? site.brandTitle ?? site.title,
            menu: navMenu,
        },
        footer: {
            social: socialLinks,
            links: site.footerLinks.map((item) => ({ name: item.label, url: item.href })),
            copyright: `© ${new Date().getFullYear()} ${site.title}`,
        },
        author: {
            name: site.title,
            url: site.site ?? "/",
            avatar: "",
            bio: site.description ?? "",
            social: socialLinks,
        },
        content: {
            share: true,
        },
        integ: {
            quote: false,
            mediumZoom: true,
        },
    };
}
function pureVirtualConfigPlugin(site) {
    const virtualId = "virtual:config";
    const resolvedVirtualId = `\0${virtualId}`;
    const pureConfig = pureVirtualConfig(site);
    return {
        name: "papyrus-pure-virtual-config",
        resolveId(id) {
            if (id === virtualId)
                return resolvedVirtualId;
            return undefined;
        },
        load(id) {
            if (id === resolvedVirtualId)
                return `export default ${JSON.stringify(pureConfig)}`;
            return undefined;
        },
    };
}
export default function papyrus() {
    return {
        name: "astro-papyrus",
        hooks: {
            "astro:config:setup": async ({ injectRoute, updateConfig }) => {
                const site = await loadPapyrusConfig();
                updateConfig({
                    vite: {
                        plugins: [pureVirtualConfigPlugin(site)],
                    },
                });
                for (const { pattern, entrypoint, localFiles } of defaultRoutes) {
                    if (localRouteExists(localFiles))
                        continue;
                    injectRoute({ pattern, entrypoint });
                }
                if (site.securityTxt.contacts.length > 0) {
                    for (const { pattern, entrypoint, localFiles } of securityTxtRoutes) {
                        if (localRouteExists(localFiles))
                            continue;
                        injectRoute({ pattern, entrypoint });
                    }
                }
            },
            "astro:build:start": async () => {
                await generateSocialImages();
            },
        },
    };
}
