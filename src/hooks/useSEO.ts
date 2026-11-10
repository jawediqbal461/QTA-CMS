import { useEffect } from "react";

export interface SEOOptions {
  /** Page title. The site name is appended automatically unless it's already included. */
  title: string;
  /** Meta description shown in search results. Falls back to a site-wide default. */
  description?: string;
  /** Social share image (absolute or relative URL) used for og:image. */
  image?: string;
  /** Set true for private/account pages (portals, admin, classroom) that shouldn't be indexed. */
  noindex?: boolean;
  /** Optional schema.org JSON-LD object (without "@context" — that's added automatically). */
  schema?: Record<string, any>;
}

const SITE_NAME = "Quran Tutors Academy";
const DEFAULT_DESCRIPTION =
  "Learn the Holy Quran online with certified Tajweed tutors — live lessons, Hifz memorization tracking, and a free Quran reading & audio companion.";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertSchema(schema: Record<string, any> | undefined) {
  const existing = document.getElementById("seo-jsonld");
  if (!schema) {
    if (existing) existing.remove();
    return;
  }
  let el = existing as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = "seo-jsonld";
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify({ "@context": "https://schema.org", ...schema });
}

// Updates the document <head> for the currently mounted page: title, meta description,
// canonical link, Open Graph / Twitter tags, robots directive, and JSON-LD structured data.
// This is a client-side SPA, so these tags update after JS runs (not on the initial server
// response) — real for any crawler that executes JavaScript, but not equivalent to
// server-rendered meta tags for crawlers that don't.
export function useSEO(options: SEOOptions) {
  const schemaKey = options.schema ? JSON.stringify(options.schema) : "";

  useEffect(() => {
    const pageUrl = new URL(window.location.href);
    pageUrl.hash = "";
    const fullTitle = options.title.includes(SITE_NAME) ? options.title : `${options.title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const description = options.description || DEFAULT_DESCRIPTION;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", pageUrl.href);
    if (options.image) {
      upsertMeta("property", "og:image", options.image);
    }
    upsertMeta("name", "twitter:card", options.image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);

    upsertLink("canonical", pageUrl.href);
    upsertMeta("name", "robots", options.noindex ? "noindex, nofollow" : "index, follow");

    upsertSchema(options.schema);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.title, options.description, options.image, options.noindex, schemaKey]);
}

export { SITE_NAME };
