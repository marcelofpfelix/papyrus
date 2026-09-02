import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "smol-toml";

export type PapyrusPublicKeys = {
  ssh?: string;
  gpg?: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function publicKey(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return `${value.trim()}\n`;
}

export function profilePublicKeys(input: unknown): PapyrusPublicKeys {
  const root = record(input);
  const user = record(root.user ?? input);
  const keys = record(user.public_keys);
  return {
    ssh: publicKey(keys.ssh),
    gpg: publicKey(keys.gpg),
  };
}

export async function getTemplatePublicKeys(path = "src/data/profile.toml"): Promise<PapyrusPublicKeys> {
  const source = await readFile(resolve(process.cwd(), path), "utf8");
  return profilePublicKeys(parse(source));
}
