import { absoluteUrl } from "@/lib/site";

type Props = {
  title: string;
  description: string;
  slug: string;
  path?: string; // overrides /learn/${slug} when the page isn't under /learn
  datePublished: string; // ISO date string e.g. "2025-01-15"
  dateModified?: string;
};

export function ArticleSchema({ title, description, slug, path, datePublished, dateModified }: Props) {
  const url = absoluteUrl(path ?? `/learn/${slug}`);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description,
          url,
          datePublished,
          dateModified: dateModified ?? datePublished,
          author: {
            "@type": "Organization",
            name: "Shilajit Transparency Database",
            url: absoluteUrl("/"),
          },
          publisher: {
            "@type": "Organization",
            name: "Shilajit Transparency Database",
            url: absoluteUrl("/"),
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": url,
          },
        }),
      }}
    />
  );
}
