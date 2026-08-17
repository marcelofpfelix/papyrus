import type { PapyrusCvLink } from "./cv";

const icons: Record<string, string> = {
  award: `<path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="m9 14-1 7 4-2 4 2-1-7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  back: `<path d="m12 19-7-7 7-7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M19 12H5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  briefcase: `<rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  calendar: `<rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></rect><path d="M16 2v4M8 2v4M3 10h18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  computer: `<rect x="3" y="4" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></rect><path d="M8 21h8M12 17v4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  copy: `<rect x="8" y="8" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></rect><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  document: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M14 2v6h6M8 13h8M8 17h5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  earth: `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  email: `<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></rect><path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  flag: `<path d="M5 3v18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M5 4h12l-2 4 2 4H5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  github: `<path d="M15 21v-3.5a3.2 3.2 0 0 0-.9-2.5c3-.3 6.1-1.5 6.1-6.5A5 5 0 0 0 18.8 5a4.7 4.7 0 0 0-.1-3.4s-1.1-.4-3.6 1.3a12.2 12.2 0 0 0-6.2 0C6.4 1.7 5.3 2.1 5.3 2.1a4.7 4.7 0 0 0-.1 3.4A5 5 0 0 0 3.8 9c0 5 3.1 6.2 6.1 6.5a2.8 2.8 0 0 0-.8 1.7c-.7.3-2.5.8-3.6-1a2.6 2.6 0 0 0-1.9-1.3s-1.2 0-.1.7a3.3 3.3 0 0 1 1.4 1.8s.8 2.5 4.1 1.6V21" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  hands: `<path d="M7 11V7a2 2 0 0 1 4 0v5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M11 10V6a2 2 0 0 1 4 0v6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M15 11V8a2 2 0 0 1 4 0v5c0 5-3 8-7 8h-1a7 7 0 0 1-6-3.5L3 14a2 2 0 0 1 3.5-2l1.5 2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  keybase: `<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M14.5 8.5a2.5 2.5 0 1 1-1.8 4.2L9 16.4H7v-2l3.7-3.7a2.5 2.5 0 0 1 3.8-2.2Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  key: `<circle cx="7.5" cy="14.5" r="3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle><path d="M10.2 12 21 1.2M14 5l2 2M17 2l2 2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  link: `<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  linkedin: `<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4v2a5 5 0 0 1 2-3Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M2 9h4v12H2z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><circle cx="4" cy="4" r="2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle>`,
  location: `<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle>`,
  mountain: `<path d="m3 20 7-14 5 10 2-4 4 8Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="m10 6 2.5 5h-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  repo: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  school: `<path d="m22 10-10-5-10 5 10 5 10-5Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M6 12v5c3 2 9 2 12 0v-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  share: `<circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle><circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle><circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  source: `<path d="m16 18 6-6-6-6M8 6l-6 6 6 6M14 4l-4 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  telegram: `<path d="m21.5 4.5-4 15a1.5 1.5 0 0 1-2.3.9l-5.1-3.7-2.8 2.7.5-4.1L3.5 13a1.5 1.5 0 0 1 .2-2.7l15.8-7a1.5 1.5 0 0 1 2 1.2Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="m8 15 13-11" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  timeline: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  tools: `<path d="m14.7 6.3 3-3a3.5 3.5 0 0 1-4.9 4.9l-6.6 6.6a2 2 0 1 0 2.8 2.8l6.6-6.6a3.5 3.5 0 0 1 4.9-4.9l-3 3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  university: `<path d="m3 10 9-6 9 6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M5 10h14M7 10v7M11 10v7M15 10v7M19 10v7M4 20h16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  user: `<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle><path d="M4 22a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
  version: `<path d="M4 7h10M4 17h10M17 4l3 3-3 3M20 7h-6M7 14l-3 3 3 3M4 17h6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>`,
};

function inferIconName(link: Pick<PapyrusCvLink, "href" | "label" | "icon">): string {
  const value = `${link.icon ?? ""} ${link.label} ${link.href ?? ""}`.toLowerCase();

  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("github")) return "github";
  if (value.includes("telegram") || value.includes("t.me")) return "telegram";
  if (value.includes("keybase")) return "keybase";
  if (value.includes("pgp") || value.includes("openpgp")) return "key";
  if (value.startsWith("mailto:") || value.includes("email")) return "email";
  return "link";
}

export function cvLinkIcon(link: Pick<PapyrusCvLink, "href" | "label" | "icon">): string {
  return cvIconSvg(inferIconName(link));
}

export function cvIconSvg(iconName: string | undefined): string {
  if (!iconName) return icons.link;
  return icons[iconName] ?? icons.link;
}
