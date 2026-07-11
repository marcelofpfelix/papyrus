import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "smol-toml";
import { normalizeJekyllCvUser } from "../utils/cv";

export async function getTemplateProfile(path = "src/data/profile.toml") {
  const source = await readFile(resolve(process.cwd(), path), "utf8");
  return normalizeJekyllCvUser(parse(source));
}
