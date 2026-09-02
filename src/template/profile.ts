import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "smol-toml";
import { loadPapyrusConfig } from "../config";
import { normalizeJekyllCvUser } from "../utils/cv";
import { profileDataFromJekyllCvToml } from "../utils/cv-profile-data";
export { getTemplatePublicKeys, profilePublicKeys, type PapyrusPublicKeys } from "./public-keys";

export async function getTemplateProfile(path = "src/data/profile.toml") {
  const source = await readFile(resolve(process.cwd(), path), "utf8");
  return normalizeJekyllCvUser(parse(source));
}

export async function getTemplateProfileData(path = "src/data/profile.toml") {
  const [source, site] = await Promise.all([
    readFile(resolve(process.cwd(), path), "utf8"),
    loadPapyrusConfig(),
  ]);
  return profileDataFromJekyllCvToml(source, [], { imageEffect: site.profile.images.effect });
}
