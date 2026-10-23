/**
 * Search-engine indexing is allowed only for Netlify production builds.
 * Deploy previews, branch deploys, local builds and the review preview
 * are marked `noindex`. Set NOINDEX=true to block indexing in production too.
 */
export const allowIndexing =
  process.env.CONTEXT === 'production' && process.env.NOINDEX !== 'true' && !process.env.ARTIFACT_BUILD;

export const isArtifactBuild = Boolean(process.env.ARTIFACT_BUILD);
