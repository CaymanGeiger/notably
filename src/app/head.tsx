import { siteConfig } from "@/lib/site";

const shareImageUrl = `${siteConfig.url}/opengraph-image`;

export default function Head() {
  return (
    <>
      <meta name="application-name" content={siteConfig.name} />
      <meta name="apple-mobile-web-app-title" content={siteConfig.name} />
      <meta name="keywords" content={siteConfig.keywords.join(", ")} />
      <meta name="theme-color" content="#f6f0e5" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#16181f" media="(prefers-color-scheme: dark)" />
      <link rel="manifest" href="/manifest.webmanifest" />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:locale" content={siteConfig.locale} />
      <meta property="og:image" content={shareImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content="Notably team notes interface with warm editorial styling and controlled collaboration messaging."
      />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={shareImageUrl} />
      <meta
        name="twitter:image:alt"
        content="Notably team notes interface with warm editorial styling and controlled collaboration messaging."
      />
    </>
  );
}
