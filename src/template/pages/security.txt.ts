import { getTemplateSite } from "../site";

function line(name: string, value: string | undefined) {
  return value ? [`${name}: ${value}`] : [];
}

export async function GET() {
  const site = await getTemplateSite();
  const security = site.securityTxt;

  if (security.contacts.length === 0) {
    return new Response("security.txt is not configured.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const origin = site.site ?? "http://localhost:4321";
  const canonical = security.canonical ?? new URL("/.well-known/security.txt", origin).href;
  const body = [
    ...security.contacts.map(contact => `Contact: ${contact}`),
    ...line("Expires", security.expires),
    ...line("Preferred-Languages", security.preferredLanguages),
    ...line("Canonical", canonical),
    ...line("Policy", security.policy),
    ...line("Acknowledgments", security.acknowledgments),
    ...line("Encryption", security.encryption),
    ...line("Hiring", security.hiring),
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
