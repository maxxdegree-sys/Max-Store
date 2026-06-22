import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, image, url, schema, type = 'website' }) {
  const pageTitle = title || 'Maxx — Premium Online Shopping in Pakistan';
  const fullTitle = title && !title.includes('Maxx') ? `${title} | Maxx` : pageTitle;
  const canonical = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {description && <meta name="robots" content="index, follow" />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Maxx" />
      <meta property="og:locale" content="en_PK" />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {canonical && <meta property="og:url" content={canonical} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
      {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}
    </Helmet>
  );
}
