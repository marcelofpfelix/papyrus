export type PapyrusCollectionMetadataSection = {
  name: string;
  description: string;
};

export type PapyrusCollectionMetadata = {
  slug: string;
  path: string;
  directory: string;
  name: string;
  description: string;
  settings: {
    postFooter: "collection" | "none";
    postFooterCollapsible: boolean;
  };
  sections: PapyrusCollectionMetadataSection[];
};

export function collectionSectionSlug(name: string): string;
export function readPostCollectionMetadata(postsDir?: string): Promise<PapyrusCollectionMetadata[]>;
export function collectionContainsPost(collection: PapyrusCollectionMetadata, postPath: string, postsDir?: string): boolean;
export function collectionSectionForPost(collection: PapyrusCollectionMetadata, postPath: string, postsDir?: string): string | undefined;
export function primaryCollectionForPost(collections: PapyrusCollectionMetadata[], postPath: string, postsDir?: string): PapyrusCollectionMetadata | undefined;
