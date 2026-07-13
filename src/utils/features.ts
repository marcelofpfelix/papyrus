export type PapyrusFeatureConfig = {
  header?: boolean;
  footer?: boolean;
  scrollHeader?: boolean;
  search?: boolean;
  rss?: boolean;
  poweredBy?: boolean;
  themeControls?: boolean;
  share?: boolean;
  toc?: boolean;
  postTags?: boolean;
  aiMetadata?: boolean;
  sourceActions?: boolean;
  postStats?: boolean;
  comments?: boolean;
  postSideLinks?: boolean;
  adjacentPosts?: boolean;
  backToTop?: boolean;
  markdownAlerts?: boolean;
  mermaid?: boolean;
  artifactLinks?: boolean;
  imageZoom?: boolean;
  notes?: boolean;
  projects?: boolean;
  graph?: boolean;
  cv?: boolean;
  linkPreviews?: boolean;
  contentIndex?: boolean;
  sectionMenu?: boolean;
};

export const defaultPapyrusFeatures = {
  header: true,
  footer: true,
  scrollHeader: true,
  search: true,
  rss: true,
  poweredBy: true,
  themeControls: true,
  share: true,
  toc: true,
  postTags: true,
  aiMetadata: true,
  sourceActions: true,
  postStats: true,
  comments: true,
  postSideLinks: true,
  adjacentPosts: true,
  backToTop: true,
  markdownAlerts: true,
  mermaid: true,
  artifactLinks: true,
  imageZoom: true,
  notes: true,
  projects: true,
  graph: true,
  cv: true,
  linkPreviews: true,
  contentIndex: true,
  sectionMenu: true,
} satisfies Required<PapyrusFeatureConfig>;

export function resolvePapyrusFeatures(features: PapyrusFeatureConfig = {}) {
  return {
    ...defaultPapyrusFeatures,
    ...features,
  };
}
