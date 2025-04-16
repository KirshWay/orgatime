import { Helmet } from "react-helmet-async";

type Props = {
  title: string;
  description: string;
  keywords?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonicalUrl?: string;
};

export const SEO = ({
  title,
  description,
  keywords,
  noindex = false,
  nofollow = false,
  canonicalUrl,
}: Props) => {
  const siteTitle = title ? `${title} | OrgaTime` : "OrgaTime";
  const metaRobots = `${noindex ? "noindex" : "index"},${
    nofollow ? "nofollow" : "follow"
  }`;

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={metaRobots} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
};
