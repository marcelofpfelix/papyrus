import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    slug: z.string().optional(),
    pubDatetime: z.coerce.date().optional(),
    date: z.coerce.date().optional(),
    modDatetime: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
    hidden: z.boolean().optional().default(false),
    pinned: z.union([z.boolean(), z.number()]).optional().default(false),
    cover: z.string().optional(),
    coverEffect: z.enum(["none", "mono-accent", "tricolor"]).optional(),
    cover_effect: z.enum(["none", "mono-accent", "tricolor"]).optional(),
    tags: z.array(z.string()).optional().default([]),
  }).refine(data => data.pubDatetime || data.date, {
    message: "Posts require either pubDatetime or date.",
    path: ["date"],
  }),
});

export const collections = { posts };
