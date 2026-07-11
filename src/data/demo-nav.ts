import source from "../../paper.config.toml?raw";
import { parsePaperConfigToml } from "../config";

export const demoPaperConfig = parsePaperConfigToml(source);
export const demoNav = demoPaperConfig.nav;
export const demoSocialLinks = demoPaperConfig.socialLinks;
