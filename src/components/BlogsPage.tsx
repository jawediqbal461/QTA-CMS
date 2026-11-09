import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowRight, Search, Sparkles } from "lucide-react";
import { BlogPost, INITIAL_BLOGS } from "../data/mockData";
import Breadcrumbs from "./Breadcrumbs";
import { useSEO } from "../hooks/useSEO";

export default function BlogsPage() {
  const navigate = useNavigate();

  useSEO({
    title: "Academy Insights — Quran, Tajweed & Hifz Articles",
    description: "Guides and tips from our tutors on Tajweed, Hifz memorization, and getting the most out of your Quran lessons.",
    schema: { "@type": "CollectionPage", name: "Academy Insights" }
  });

  const [blogs] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem("qta_blogs");
      return saved ? JSON.parse(saved) : INITIAL_BLOGS;
    } catch {
      return INITIAL_BLOGS;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  const published = blogs.filter(b => b.status === "Published");

  const filtered = published.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const breadcrumbItems = [
    { label: "Academy Insights", icon: <FileText size={12} className="text-emerald-400" /> }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6 text-neutral-200">

      <Breadcrumbs items={breadcrumbItems} onHomeAction={() => navigate("/")} showBackButton={false} />

      {/* HEADER */}
      <div className="relative bg-gradient-to-r from-emerald-950/30 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-mono">
            <Sparkles size={11} />
            <span>Academy Insights</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">Guides, Tips & Updates</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Articles from our tutors on Tajweed, Hifz, and getting the most out of your lessons.
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
          <Search size={14} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles by title, topic, or tag..."
          className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-600 outline-none transition"
        />
      </div>

      {/* GRID */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(blog => (
            <div
              key={blog.id}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden hover:border-neutral-700 transition duration-300 flex flex-col"
            >
              <img src={blog.coverImage} alt={blog.title} className="w-full h-40 object-cover" />
              <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-[10px] text-neutral-500">
                    <span className="font-bold text-emerald-400">{blog.author}</span>
                    <span>•</span>
                    <span>{blog.publishedAt}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{blog.title}</h3>
                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">{blog.excerpt}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1">
                    {blog.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="bg-neutral-950 text-neutral-400 px-2 py-0.5 rounded text-[9px]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(`/blogs/${blog.slug}`)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 shrink-0"
                  >
                    <span>Read</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
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
