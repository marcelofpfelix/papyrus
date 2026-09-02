import { fileURLToPath } from "node:url";

export function papyrusMdTxt({ includeDrafts = false } = {}) {
  return {
    name: "astro-papyrus-md-txt",
    hooks: {
      "astro:config:setup"({ injectRoute, updateConfig }) {
        injectRoute({
          pattern: "/posts/[...slug].md",
          entrypoint: fileURLToPath(new URL("./routes/md-txt.ts", import.meta.url)),
          prerender: true,
        });
        injectRoute({
          pattern: "/collections/[collection]/[...slug].md",
          entrypoint: fileURLToPath(new URL("./routes/collection-md.ts", import.meta.url)),
          prerender: true,
        });
        const virtualId = "virtual:papyrus-md-txt/config";
        const resolvedId = `\0${virtualId}`;
        updateConfig({
          vite: {
            plugins: [{
              name: "vite-plugin-papyrus-md-txt",
              resolveId(id) { if (id === virtualId) return resolvedId; },
              load(id) {
                if (id === resolvedId) return `export default ${JSON.stringify({ includeDrafts })}`;
              },
            }],
          },
        });
      },
    },
  };
}
