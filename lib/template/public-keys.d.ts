export type PapyrusPublicKeys = {
    ssh?: string;
    gpg?: string;
};
export declare function profilePublicKeys(input: unknown): PapyrusPublicKeys;
export declare function getTemplatePublicKeys(path?: string): Promise<PapyrusPublicKeys>;
