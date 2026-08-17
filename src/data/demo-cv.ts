import { parse } from "smol-toml";
import profileSource from "./profile.toml?raw";
import { cvToJsonResume, cvToMarkdown, normalizeJekyllCvUser } from "../utils/cv";

export const demoCvUser = normalizeJekyllCvUser(parse(profileSource));
export const demoCvJson = cvToJsonResume(demoCvUser);
export const demoCvMarkdown = cvToMarkdown(demoCvUser);

export const demoCvTemplates = [
  {
    id: "terminal",
    title: "Terminal profile",
    description: "Compact profile sections, monospace defaults, and strong metadata for a developer homepage.",
  },
  {
    id: "timeline",
    title: "Timeline profile",
    description: "Experience-first layout that turns section groups into a readable vertical career timeline.",
  },
  {
    id: "a4-classic",
    title: "A4 classic",
    description: "Print-oriented layout that reuses the same data and targets A4 output.",
  },
  {
    id: "jekyll-default",
    title: "jekyllcv default",
    description: "Compatibility template that keeps a jekyllcv-style print page available.",
  },
  {
    id: "cards",
    title: "Project cards",
    description: "Mobile-first profile with cards for projects, experience, skills, and public links.",
  },
] as const;
