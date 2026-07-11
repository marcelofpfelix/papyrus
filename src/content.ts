import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    slug: z.string().optional(),
    pubDatetime: z.coerce.date(),
    modDatetime: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
    hidden: z.boolean().optional().default(false),
    pinned: z.union([z.boolean(), z.number()]).optional().default(false),
    cover: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { posts };
