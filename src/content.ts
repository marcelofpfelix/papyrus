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
    robots: z.string().optional(),
    pinned: z.union([z.boolean(), z.number()]).optional().default(false),
    cover: z.string().optional(),
    ogImage: z.string().optional(),
    ogSourceImage: z.string().optional(),
    coverEffect: z.enum(["none", "duotone", "tritone", "dither", "dithernoise"]).optional(),
    cover_effect: z.enum(["none", "duotone", "tritone", "dither", "dithernoise"]).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
  }).refine(data => data.pubDatetime || data.date, {
    message: "Posts require either pubDatetime or date.",
    path: ["date"],
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    layout: z.literal("page").optional().default("page"),
    permalink: z.string().regex(/^\/[A-Za-z0-9][A-Za-z0-9/_-]*\/?$/, "Use an absolute path such as /uses/ or /notes/setup/.").optional(),
    draft: z.boolean().optional().default(false),
    robots: z.string().optional(),
  }),
});

export const collections = { pages, posts };
