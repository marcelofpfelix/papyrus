import { fileURLToPath } from "node:url";

export function papyrusSiteGraph({ route = "/graph" } = {}) {
  return {
    name: "astro-papyrus-site-graph",
    hooks: {
      "astro:config:setup"({ injectRoute }) {
        injectRoute({
          pattern: route,
          entrypoint: fileURLToPath(new URL("./routes/site-graph.astro", import.meta.url)),
          prerender: true,
        });
      },
    },
  };
}
