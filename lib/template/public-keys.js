import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "smol-toml";
function record(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}
function publicKey(value) {
    if (typeof value !== "string" || !value.trim())
        return undefined;
    return `${value.trim()}\n`;
}
export function profilePublicKeys(input) {
    const root = record(input);
    const user = record(root.user ?? input);
    const keys = record(user.public_keys);
    return {
        ssh: publicKey(keys.ssh),
        gpg: publicKey(keys.gpg),
    };
}
export async function getTemplatePublicKeys(path = "src/data/profile.toml") {
    const source = await readFile(resolve(process.cwd(), path), "utf8");
    return profilePublicKeys(parse(source));
}
