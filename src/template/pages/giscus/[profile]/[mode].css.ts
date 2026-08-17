import { papyrusGiscusThemeCss, papyrusGiscusThemeModes, papyrusGiscusThemeProfiles } from "../../../../utils/giscus-theme";

export function getStaticPaths() {
  return papyrusGiscusThemeProfiles.flatMap(profile =>
    papyrusGiscusThemeModes.map(mode => ({
      params: { profile, mode },
    })),
  );
}

export async function GET({ params }: { params: { profile?: string; mode?: string } }) {
  const css = papyrusGiscusThemeCss(params.profile ?? "", params.mode ?? "");
  if (!css) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
