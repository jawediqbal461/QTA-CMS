import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, ArrowRight } from "lucide-react";
import { BlogPost, INITIAL_BLOGS } from "../data/mockData";
import Breadcrumbs from "./Breadcrumbs";
import { useSEO } from "../hooks/useSEO";

export default function BlogPostPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [blogs] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem("qta_blogs");
      return saved ? JSON.parse(saved) : INITIAL_BLOGS;
    } catch {
      return INITIAL_BLOGS;
    }
  });

  const post = blogs.find(b => b.slug === slug && b.status === "Published");

  useSEO({
    title: post ? (post.seoTitle || post.title) : "Article Not Found",
    description: post ? (post.seoDescription || post.excerpt) : undefined,
    image: post ? (post.seoImage || post.coverImage) : undefined,
    noindex: !post,
    schema: post ? {
      "@type": "BlogPosting",
      headline: post.title,
      description: post.seoDescription || post.excerpt,
      image: post.seoImage || post.coverImage,
      author: { "@type": "Person", name: post.author },
      datePublished: post.publishedAt,
      keywords: post.tags.join(", ")
    } : undefined
  });

  if (!post) {
    return (
      <div className="max-w-md mx-auto mt-24 bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">Article not found</h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          We couldn't find an article at this address. It may have been unpublished or the link is out of date.
        </p>
        <button
          onClick={() => navigate("/blogs")}
          className="bg-emerald-600 hover:bg-emerald-500 text-neutral-950 hover:text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
        >
          Back to Insights
        </button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Academy Insights", action: () => navigate("/blogs"), icon: <FileText size={12} className="text-emerald-400" /> },
    { label: post.title }
  ];

  const related = blogs.filter(b => b.status === "Published" && b.id !== post.id).slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6 text-neutral-200">

      <Breadcrumbs items={breadcrumbItems} onHomeAction={() => navigate("/")} showBackButton />

      <article className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        <img src={post.coverImage} alt={post.title} className="w-full h-56 md:h-72 object-cover" />

        <div className="p-6 md:p-10 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs text-neutral-400">
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                {post.author}
              </span>
              <span>•</span>
              <span>Published on {post.publishedAt}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-snug">{post.title}</h1>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t, idx) => (
                <span key={idx} className="bg-neutral-950 text-neutral-400 border border-neutral-850 px-2 py-0.5 rounded text-[10px]">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="text-sm text-neutral-300 space-y-4 leading-relaxed whitespace-pre-line prose prose-invert font-sans">
            {post.content}
          </div>

          <div className="bg-neutral-950 border border-neutral-850/80 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">Ready to start learning?</p>
              <p className="text-[11px] text-neutral-500">Browse our certified scholars and book a trial lesson.</p>
            </div>
            <button
              onClick={() => navigate("/tutors")}
              className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-xl transition shrink-0"
            >
              Find a Tutor
            </button>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">More Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map(r => (
              <button
                key={r.id}
                onClick={() => navigate(`/blogs/${r.slug}`)}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 text-left transition flex items-center justify-between space-x-3"
              >
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white line-clamp-2">{r.title}</h3>
                  <p className="text-[10px] text-neutral-500">{r.author}</p>
                </div>
                <ArrowRight size={14} className="text-emerald-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
