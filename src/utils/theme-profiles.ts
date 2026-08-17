export const papyrusThemeProfiles = [
  "pure",
  "catppuccin",
  "tokyo-night",
  "kanagawa",
  "rose-pine",
  "everforest",
  "dracula",
  "gruvbox",
  "nord",
] as const;

export type PapyrusThemeProfile = typeof papyrusThemeProfiles[number];
