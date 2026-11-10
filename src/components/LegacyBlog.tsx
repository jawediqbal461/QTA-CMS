import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Sparkles, Search, Calendar, ArrowRight, ArrowLeft, FileText } from "lucide-react";
import posts from "../data/blog-legacy/index.json";
import { useSEO } from "../hooks/useSEO";

const articles = import.meta.glob<{ default: { html: string } }>(
  ["../data/blog-legacy/*.json", "!../data/blog-legacy/index.json"],
);
const categories = Array.from(new Set(posts.flatMap((post) => post.categories))).sort();

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

function BlogIndexPage() {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  useSEO({
    title: "Academy Insights — Quran, Tajweed & Hifz Articles",
    description: "Guides and tips on Tajweed, Hifz memorization, and getting the most out of your Quran lessons.",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((entry) => {
      const matchesCategory = !category || entry.categories.includes(category);
      const matchesQuery = !q || entry.title.toLowerCase().includes(q) || entry.excerpt.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-8 text-neutral-200">
      <div className="relative bg-gradient-to-r from-emerald-950/30 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-mono">
            <Sparkles size={11} />
            <span>Academy Insights</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">Guides, Tips &amp; Updates</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Articles on Tajweed, Hifz, and Quranic study — written to help you get the most out of your lessons.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
            <Search size={14} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-600 outline-none transition"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition ${
              category === "" ? "bg-emerald-500 text-neutral-950 border-emerald-500" : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
            }`}
          >
            All
          </button>
          {categories.map((name) => (
            <button
              key={name}
              onClick={() => setCategory(name)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition ${
                category === name ? "bg-emerald-500 text-neutral-950 border-emerald-500" : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((entry) => (
            <Link
              key={entry.path}
              to={entry.path}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition duration-300 flex flex-col"
            >
              {entry.cover && (
                <img src={entry.cover} alt="" loading="lazy" className="w-full h-40 object-cover" />
              )}
              <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-[10px] text-neutral-500">
                    <Calendar size={10} />
                    <span>{formatDate(entry.publishedAt)}</span>
                  </div>
                  <h2 className="text-sm font-bold text-white leading-snug line-clamp-2" dir="auto">{entry.title}</h2>
                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">{entry.excerpt}</p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1">
                    {entry.categories.slice(0, 2).map((c) => (
                      <span key={c} className="bg-neutral-950 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold">{c}</span>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1 shrink-0">
                    <span>Read</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center text-xs text-neutral-500 space-y-2">
          <FileText size={22} className="mx-auto text-neutral-600" />
          <p>No articles match your search.</p>
        </div>
      )}
    </div>
  );
}

function BlogPostLayout({ post }: { post: (typeof posts)[number] }) {
  const [article, setArticle] = useState<{ slug: string; html?: string }>();

  useSEO({
    title: post.title,
    description: post.excerpt,
    image: post.cover ? new URL(post.cover, window.location.origin).href : undefined,
  });

  useEffect(() => {
    setArticle(undefined);
    let active = true;
    const { slug } = post;
    articles[`../data/blog-legacy/${slug}.json`]().then(
      ({ default: { html } }) => { if (active) setArticle({ slug, html }); },
      () => { if (active) setArticle({ slug }); },
    );
    return () => { active = false; };
  }, [post]);

  const related = posts
    .filter((p) => p.slug !== post.slug && p.categories.some((c) => post.categories.includes(c)))
    .slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-neutral-200">
      <Link to="/blog/" className="inline-flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300">
        <ArrowLeft size={14} />
        <span>Academy Insights</span>
      </Link>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {post.categories.map((c) => (
            <span key={c} className="bg-neutral-900 border border-neutral-800 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold">{c}</span>
          ))}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight" dir="auto">{post.title}</h1>
        <div className="flex items-center space-x-1.5 text-xs text-neutral-500">
          <Calendar size={12} />
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        </div>
      </div>

      {post.cover && (
        <img src={post.cover} alt="" className="w-full max-h-96 object-cover rounded-3xl border border-neutral-800" />
      )}

      {article?.slug !== post.slug ? (
        <p role="status" className="text-sm text-neutral-500 py-10 text-center">Loading article…</p>
      ) : article.html ? (
        <article
          className="legacy-blog-content legacy-quran-content rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 leading-relaxed text-neutral-200"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      ) : (
        <p role="alert" className="text-sm text-rose-400 py-10 text-center">This article could not be loaded. Reload the page to try again.</p>
      )}

      {related.length > 0 && (
        <div className="pt-6 border-t border-neutral-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Related Articles</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((entry) => (
              <Link
                key={entry.path}
                to={entry.path}
                className="block rounded-2xl border border-neutral-800 bg-neutral-900 p-4 hover:border-emerald-500/50 transition"
              >
                <p className="text-xs font-bold text-white line-clamp-2" dir="auto">{entry.title}</p>
                <p className="mt-1 text-[10px] text-neutral-500">{formatDate(entry.publishedAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LegacyBlog() {
  const { pathname, search, hash } = useLocation();
  const path = pathname.endsWith("/") ? pathname : pathname + "/";
  const post = posts.find((entry) => entry.path === path);

  if (path !== pathname) {
    return <Navigate replace to={{ pathname: path, search, hash }} />;
  }

  return post ? <BlogPostLayout post={post} /> : <BlogIndexPage />;
}
