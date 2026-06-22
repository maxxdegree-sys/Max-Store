// Re-export industry SEO engine for server routes.
export {
  stripMarkdownArtifacts,
  buildIndustryProductSeo,
  buildProductSeoPrompt,
  buildProductSchema,
  buildProductBreadcrumbSchema,
  buildProductPageSchema,
  deriveFocusKeyword,
  buildSeoTitle,
  buildMetaDescription
} from './productSeoEngine.js';

/** @deprecated use buildIndustryProductSeo */
export { buildIndustryProductSeo as buildCleanProductSeo } from './productSeoEngine.js';
