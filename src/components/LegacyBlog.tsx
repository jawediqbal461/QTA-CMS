import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import posts from "../data/blog-legacy/index.json";
import { useSEO } from "../hooks/useSEO";

const articles = import.meta.glob<{ default: { html: string } }>(
  ["../data/blog-legacy/*.json", "!../data/blog-legacy/index.json"],
);
const categories = Array.from(new Set(posts.flatMap((post) => post.categories))).sort();

export default function LegacyBlog() {
  const { pathname, search, hash } = useLocation();
  const path = pathname.endsWith("/") ? pathname : pathname + "/";
  const post = posts.find((entry) => entry.path === path);
  const [category, setCategory] = useState("");
  const [article, setArticle] = useState<{ slug: string; html?: string }>();

  useSEO({
    title: post?.title ?? "Our Blog",
    description: post?.excerpt,
    image: post?.cover ? new URL(post.cover, window.location.origin).href : undefined,
  });

  useEffect(() => {
    if (!post) return;
    let active = true;
    const { slug } = post;
    articles[`../data/blog-legacy/${slug}.json`]().then(
      ({ default: { html } }) => { if (active) setArticle({ slug, html }); },
      () => { if (active) setArticle({ slug }); },
    );
    return () => { active = false; };
  }, [post]);

  if (path !== pathname) {
    return <Navigate replace to={{ pathname: path, search, hash }} />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
      {post && <Link className="text-emerald-400" to="/blog/">Our Blog</Link>}
      <h1 className="my-5 text-3xl font-bold" dir="auto">{post?.title ?? "Our Blog"}</h1>
      {post ? (
        <>
          <time className="text-sm text-neutral-400" dateTime={post.publishedAt}>{post.publishedAt}</time>
          {post.cover && <img className="my-5 max-h-96 w-full rounded-xl object-contain" src={post.cover} alt="" />}
          {article?.slug !== post.slug ? <p role="status">Loading article…</p>
            : article.html ? (
              <article
                className="legacy-blog-content legacy-quran-content my-5 space-y-4 rounded-xl border border-neutral-700 p-4 sm:p-6"
                dangerouslySetInnerHTML={{ __html: article.html }}
              />
            ) : <p role="alert">This article could not be loaded. Reload the page to try again.</p>}
        </>
      ) : (
        <>
          <label className="mb-6 flex flex-wrap items-center gap-3">
            Category
            <select className="rounded border border-neutral-700 bg-neutral-900 p-2" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.filter((entry) => !category || entry.categories.includes(category)).map((entry) => (
              <li key={entry.path}>
                <Link className="block h-full overflow-hidden rounded-xl border border-neutral-700 hover:border-emerald-400" to={entry.path}>
                  {entry.cover && <img className="aspect-video w-full object-cover" src={entry.cover} alt="" loading="lazy" />}
                  <div className="space-y-2 p-4">
                    <p className="text-sm text-neutral-400">{entry.categories.join(", ")}</p>
                    <h2 className="font-bold" dir="auto">{entry.title}</h2>
                    <p className="text-sm text-neutral-300">{entry.excerpt}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
