import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  noIndex?: boolean;
}

export const SEO = ({ title, description, noIndex }: SEOProps) => {
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex" />}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content="/logo.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content="/logo.png" />
    </Helmet>
  );
};
