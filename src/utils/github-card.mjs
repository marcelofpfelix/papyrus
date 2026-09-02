function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function parseGithubRepository(value) {
  const trimmed = value.trim().replace(/\/$/, "");
  const slug = trimmed.startsWith("https://github.com/")
    ? trimmed.slice("https://github.com/".length)
    : trimmed;

  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9._-]+$/.test(slug)) {
    throw new Error(`Invalid GitHub repository "${value}". Use owner/name or https://github.com/owner/name.`);
  }

  const [owner, name] = slug.split("/");
  return { owner, name, slug, url: `https://github.com/${slug}` };
}

export function renderGithubCard(repoValue, description = "") {
  const repo = parseGithubRepository(repoValue);
  const descriptionMarkup = description ? `<p>${escapeHtml(description)}</p>` : "";

  return `<github-card class="papyrus-github-preview" data-repo="${escapeHtml(repo.slug)}"><a href="${escapeHtml(repo.url)}" target="_blank" rel="noreferrer"><header><strong><span>${escapeHtml(repo.owner)}</span><span>/</span><span>${escapeHtml(repo.name)}</span></strong><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15 21v-3.5a3.2 3.2 0 0 0-.9-2.5c3-.3 6.1-1.5 6.1-6.5a5 5 0 0 0-1.4-3.5 4.7 4.7 0 0 0-.1-3.4s-1.1-.4-3.6 1.3a12.2 12.2 0 0 0-6.2 0C6.4 1.7 5.3 2.1 5.3 2.1a4.7 4.7 0 0 0-.1 3.4 5 5 0 0 0-1.4 3.5c0 5 3.1 6.2 6.1 6.5a2.8 2.8 0 0 0-.8 1.7c-.7.3-2.5.8-3.6-1a2.6 2.6 0 0 0-1.9-1.3s-1.2 0-.1.7a3.3 3.3 0 0 1 1.4 1.8s.8 2.5 4.1 1.6V21"></path></svg></header>${descriptionMarkup}</a></github-card>`;
}
