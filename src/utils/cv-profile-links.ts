import { normalizeJekyllCvUser } from "./cv";

type TomlValue = string | string[];

interface TomlRecord {
  [key: string]: TomlValue | TomlRecord;
}

function parseValue(value: string): TomlValue {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
  }

  return trimmed.replace(/^"|"$/g, "");
}

export function parseCvProfileLinksToml(source: string) {
  const root: TomlRecord = {};
  let current: TomlRecord = root;

  source.split(/\r?\n/).forEach((line) => {
    const cleanLine = line.replace(/\s+#.*$/, "").trim();
    if (!cleanLine) return;

    const section = cleanLine.match(/^\[([^\]]+)\]$/);
    if (section) {
      current = section[1].split(".").reduce((record, key) => {
        const existing = record[key];
        if (existing && typeof existing === "object" && !Array.isArray(existing)) return existing;
        const next: TomlRecord = {};
        record[key] = next;
        return next;
      }, root);
      return;
    }

    const assignment = cleanLine.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (!assignment) return;
    current[assignment[1]] = parseValue(assignment[2]);
  });

  return normalizeJekyllCvUser(root).links ?? [];
}
