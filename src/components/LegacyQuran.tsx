import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import index from "../data/quran-legacy/index.json";
import { useSEO } from "../hooks/useSEO";

const pages = import.meta.glob<{ default: { html: string } }>(
  "../data/quran-legacy/surah-*.json",
);

export default function LegacyQuran() {
  const { surahSlug } = useParams();
  const { pathname, search, hash } = useLocation();
  const lookupSlug = surahSlug === "surah-yasin" ? "surah-yaseen" : surahSlug;
  const surah = index.find((entry) => entry.slug === lookupSlug);
  const [content, setContent] = useState<{ slug: string; html?: string }>();
  useSEO({ title: surah?.title ?? "Quran", noindex: !!surahSlug && !surah });

  useEffect(() => {
    if (!surah) return;
    let active = true;
    const slug = surah.slug;
    pages[`../data/quran-legacy/${slug}.json`]().then(
      (page) => { if (active) setContent({ slug, html: page.default.html }); },
      () => { if (active) setContent({ slug }); },
    );
    return () => { active = false; };
  }, [surah]);

  if (!pathname.endsWith("/")) {
    return <Navigate replace to={{ pathname: pathname + "/", search, hash }} />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
      {surahSlug && <Link className="text-emerald-400" to="/quran/">Quran index</Link>}
      <h1 className="my-5 text-3xl font-bold" dir="auto">
        {surah?.title ?? (surahSlug ? "Surah not found" : "Quran")}
      </h1>
      {!surahSlug && (
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {index.map(({ slug, title, number }) => (
            <li key={slug}>
              <Link className="block rounded-xl border border-neutral-700 p-4 hover:border-emerald-400" to={`/quran/${slug}/`}>
                <span className="block text-sm text-neutral-400">{number}</span>
                <span dir="auto">{title}</span>
                <span className="mt-2 block text-sm text-emerald-400">Listen &amp; Read</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      {surah && (content?.slug !== surah.slug ? (
        <p role="status">Loading Surah…</p>
      ) : content.html ? (
        <article
          className="legacy-quran-content space-y-4 rounded-xl border border-neutral-700 p-4 sm:p-6"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      ) : (
        <p role="alert">This Surah could not be loaded. Reload the page to try again.</p>
      ))}
    </main>
  );
}
