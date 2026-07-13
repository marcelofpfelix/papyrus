import source from "../../papyrus.config.toml?raw";
import { parsePapyrusConfigToml } from "../config";

export const demoPapyrusConfig = parsePapyrusConfigToml(source);
export const demoNav = demoPapyrusConfig.nav;
export const demoSocialLinks = demoPapyrusConfig.socialLinks;
