import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { postDate, postHref, publishedPosts } from "../../utils";
import { getTemplateSite } from "../site";

export async function GET(context: { site?: URL }) {
  const site = await getTemplateSite();
  const posts = publishedPosts(await getCollection("posts"));

  return rss({
    title: site.title,
    description: site.description ?? "",
    site: context.site ?? site.site ?? "http://localhost:4321",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: postDate(post),
      link: postHref(post),
    })),
  });
}
