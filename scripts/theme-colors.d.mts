export function themeTokens(profile?: string | undefined, mode?: string): Promise<{
    "--papyrus-bg": string;
    "--papyrus-fg": string;
    "--papyrus-muted": string;
    "--papyrus-panel": string;
    "--papyrus-border": string;
    "--papyrus-accent": string;
}>;
export function hexToRgba(value: any): number[];
