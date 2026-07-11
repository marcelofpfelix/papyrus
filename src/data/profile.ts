import profileSource from "./profile.toml?raw";
import { profileDataFromJekyllCvToml } from "../utils/cv-profile-data";

const profileData = profileDataFromJekyllCvToml(profileSource, [
  {
    repo: "marcelofpfelix/papyrus",
    description: "Reusable Astro theme package for posts, docs, projects, profile/CV pages, search, RSS, and generated metadata.",
  },
  {
    repo: "marcelofpfelix/astrocv",
    description: "Astro CV theme direction inspired by jekyllcv, with data-driven sections and A4 print output.",
  },
  {
    repo: "marcelofpfelix/jekyllcv",
    description: "Original Jekyll CV data model used as a compatibility reference for Papyrus profile imports.",
  },
]);

export const { profile, profileLinks, printProfileLinks, cvSections, profilePages, timelineEvents, profileProjects } = profileData;
