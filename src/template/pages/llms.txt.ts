import { getCollection } from "astro:content";
import { postHref, publishedPosts } from "../../utils/posts";
import { getTemplateSite } from "../site";

export async function GET({ site: astroSite }: { site?: URL }) {
  const site = await getTemplateSite();
  const base = astroSite?.toString().replace(/\/$/, "") ?? site.site ?? "http://localhost:4321";
  const posts = publishedPosts(await getCollection("posts"));
  const lines = [
    `# ${site.title}`,
    "",
    site.description,
    "",
    "## URLs",
    `- [Home](${base}/)`,
    `- [Posts](${base}/posts/)`,
    `- [Projects](${base}/projects/)`,
    `- [About](${base}/about/)`,
    `- [Profile](${base}/profile/)`,
    `- [Timeline](${base}/posts/timeline/)`,
    `- [Search](${base}/search/)`,
    ...posts.map(post => `- [${post.data.title}](${base}${postHref(post)})`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
