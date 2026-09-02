export interface PapyrusGithubRepository {
  owner: string;
  name: string;
  slug: string;
  url: string;
}

export function parseGithubRepository(value: string): PapyrusGithubRepository;
export function renderGithubCard(repoValue: string, description?: string): string;
