import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import config from "virtual:papyrus-md-txt/config";
import { postSlug, publishedPosts } from "../../utils/posts";

type RawPost = {
  title: string;
  description?: string;
  body: string;
};

function frontmatterValue(value: string) {
  return JSON.stringify(value);
}

// Adapted from starlight-md-txt v0.1.0 (MIT), src/route.ts.
export async function cleanMdx(body: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(() => (tree: any) => {
      tree.children = tree.children.filter((node: any) => node.type !== "mdxjsEsm");
      visit(tree, (node: any, index: number | undefined, parent: any) => {
        if (index === undefined || !parent) return;
        if ((node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") && node.value?.trim().startsWith("/*") && node.value.trim().endsWith("*/")) {
          parent.children.splice(index, 1);
          return index;
        }
        if (node.type !== "mdxJsxFlowElement" && node.type !== "mdxJsxTextElement") return;
        const attributes = Object.fromEntries((node.attributes ?? [])
          .filter((attribute: any) => attribute.type === "mdxJsxAttribute")
          .map((attribute: any) => [attribute.name, attribute.value]));
        if (node.name === "Tabs" || node.name === "CardGrid") {
          parent.children.splice(index, 1, ...node.children);
          return index;
        }
        if (node.name === "TabItem") {
          parent.children.splice(index, 1, {
            type: "paragraph",
            children: [{ type: "strong", children: [{ type: "text", value: `${attributes.label || "Option"}:` }] }],
          }, ...node.children);
          return index;
        }
        if (node.name === "Aside") {
          parent.children.splice(index, 1, {
            type: "blockquote",
            children: [{
              type: "paragraph",
              children: [{ type: "strong", children: [{ type: "text", value: `${String(attributes.type || "note").toUpperCase()}:` }] }],
            }, ...node.children],
          });
          return index;
        }
        if (node.name === "Card" || node.name === "LinkCard") {
          parent.children.splice(index, 1, {
            type: "heading",
            depth: 3,
            children: [{ type: "text", value: String(attributes.title || "Card") }],
          }, ...node.children);
          return index;
        }
        if (node.name && node.name[0] === node.name[0]?.toUpperCase()) {
          parent.children.splice(index, 1, ...node.children);
          return index;
        }
      });
    })
    .use(remarkStringify);
  return String(await processor.process(body));
}

async function rawMarkdown(post: RawPost): Promise<string> {
  const frontmatter = [
    "---",
    `title: ${frontmatterValue(post.title)}`,
    ...(post.description ? [`description: ${frontmatterValue(post.description)}`] : []),
    "---",
    "",
  ];
  return `${frontmatter.join("\n")}${(await cleanMdx(post.body)).trim()}\n`;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allPosts = await getCollection("posts");
  const posts = config.includeDrafts ? allPosts : publishedPosts(allPosts);
  return posts.map((post) => ({
    params: { slug: postSlug(post) },
    props: {
      title: post.data.title,
      description: post.data.description,
      body: post.body ?? "",
    } satisfies RawPost,
  }));
};

export const GET: APIRoute<RawPost> = async ({ props }) => new Response(await rawMarkdown(props), {
  headers: {
    "Content-Type": config.format === ".md.txt" ? "text/plain; charset=utf-8" : "text/markdown; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  },
});
