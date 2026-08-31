export type PapyrusImageEffect = "none" | "duotone" | "tritone" | "dither" | "dithernoise";
export declare function isPapyrusImageEffect(value: unknown): value is PapyrusImageEffect;
export declare function imageEffectClass(effect: PapyrusImageEffect | undefined): string | undefined;
export declare function ditherMaskPath(assetPath: string, mode?: "dark" | "light", effect?: "dither" | "dithernoise", frame?: number): string;
export declare function imageEffectStyle(effect: PapyrusImageEffect | undefined, assetPath: string | undefined): string | undefined;
