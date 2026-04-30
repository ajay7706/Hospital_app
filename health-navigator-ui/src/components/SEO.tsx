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
    </Helmet>
  );
};
