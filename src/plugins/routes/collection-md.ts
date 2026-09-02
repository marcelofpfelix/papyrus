import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { collectionPostSlug, getPostCollections } from "../../utils/collections";
import { markdownResponse, type RawPost } from "./md-txt";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("posts");
  const collections = await getPostCollections("src/content/posts", posts);

  return collections.flatMap(collection => collection.posts.map(post => ({
    params: {
      collection: collection.slug,
      slug: collectionPostSlug(collection, post),
    },
    props: {
      title: post.data.title,
      description: post.data.description,
      body: post.body ?? "",
    } satisfies RawPost,
  })));
};

export const GET: APIRoute<RawPost> = async ({ props }) => markdownResponse(props);
