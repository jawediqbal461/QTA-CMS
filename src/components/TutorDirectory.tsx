import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, Globe, Star, Award, ArrowRight,
  BookOpen, RotateCcw, CheckCircle,
  Users, Check as CheckIcon
} from "lucide-react";
import { Tutor } from "../data/mockData";
import Breadcrumbs from "./Breadcrumbs";
import { useSEO } from "../hooks/useSEO";

interface TutorDirectoryProps {
  tutors: Tutor[];
  onBookTrial: (tutorId: string) => void;
}

export default function TutorDirectory({ tutors, onBookTrial }: TutorDirectoryProps) {
  const navigate = useNavigate();

  useSEO({
    title: "Find a Certified Quran Tutor",
    description: "Browse certified Quran tutors specializing in Tajweed, Hifz memorization, and Arabic. Filter by rate, rating, and weekly availability.",
    schema: { "@type": "CollectionPage", name: "Scholars Registry" }
  });

  // Search & Filter State (Sidebar Requirements)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number>(50);
  const [sortBy, setSortBy] = useState<"rating" | "experience" | "rate_low" | "rate_high">("rating");

  // Constants for checkboxes
  const AVAILABLE_SUBJECTS = ["Tajweed", "Hifz", "Arabic"];
  const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Toggle helpers for checkboxes
  const handleToggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleToggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSubjects([]);
    setSelectedDays([]);
    setPriceRange(50);
    setSortBy("rating");
  };

  // Filtered tutors list
  const filteredTutors = useMemo(() => {
    return tutors.filter(t => {
      // 1. Search text query
      const matchesSearch = searchQuery === "" ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.specialties.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.languages.some(lang => lang.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.bio.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Subjects Filter Checkboxes
      let matchesSubjects = true;
      if (selectedSubjects.length > 0) {
        matchesSubjects = selectedSubjects.some(subject => {
          if (subject.toLowerCase() === "tajweed") {
            return t.specialties.some(spec => spec.toLowerCase().includes("tajweed"));
          }
          if (subject.toLowerCase() === "hifz") {
            return t.specialties.some(spec => spec.toLowerCase().includes("hifz") || spec.toLowerCase().includes("memorization"));
          }
          if (subject.toLowerCase() === "arabic") {
            return t.languages.some(lang => lang.toLowerCase() === "arabic") ||
                   t.specialties.some(spec => spec.toLowerCase().includes("arabic") || spec.toLowerCase().includes("qira'at") || spec.toLowerCase().includes("qaida"));
          }
          return false;
        });
      }

      // 3. Availability Filter Checkboxes
      let matchesDays = true;
      if (selectedDays.length > 0) {
        matchesDays = selectedDays.some(day => {
          return t.availability && t.availability[day] && t.availability[day].length > 0;
        });
      }

      // 4. Max hourly rate filter
      const matchesPrice = t.hourlyRate <= priceRange;

      return matchesSearch && matchesSubjects && matchesDays && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "experience") {
        const expA = parseInt(a.experience) || 0;
        const expB = parseInt(b.experience) || 0;
        return expB - expA;
      }
      if (sortBy === "rate_low") return a.hourlyRate - b.hourlyRate;
      if (sortBy === "rate_high") return b.hourlyRate - a.hourlyRate;
      return 0;
    });
  }, [tutors, searchQuery, selectedSubjects, selectedDays, priceRange, sortBy]);

  const breadcrumbItems = [
    {
      label: "Scholars Registry",
      icon: <Users size={12} className="text-emerald-400" />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 text-neutral-200">

      <Breadcrumbs
        items={breadcrumbItems}
        onHomeAction={() => navigate("/")}
        showBackButton={false}
      />

      {/* SECTION EXPLAINER CARD */}
      <div className="bg-gradient-to-r from-emerald-950/20 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-mono">
              <Award size={11} className="text-amber-400" />
              <span>Verified Academy Scholars</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Find Your Perfect Quran Tutor
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Select from our network of certified scholars specializing in Tajweed rules, Quranic Memorization (Hifz), and Arabic linguistics. Filter by lesson rates, student ratings, and matching weekly availabilities to fit your global schedule seamlessly.
            </p>
          </div>
          <div className="shrink-0 flex space-x-2">
            <button
              onClick={() => navigate("/quran")}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <BookOpen size={13} className="text-emerald-400" />
              <span>Quran Explorer</span>
            </button>
            <button
              onClick={() => navigate("/student")}
              className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold px-4 py-2.5 rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Student Dashboard</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* SCHOLARS REGISTRY CONTENT AREA */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 md:p-6 bg-neutral-950/40 relative min-h-[500px]">

          <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-850 pb-5">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
                  <Globe size={18} className="text-emerald-400" />
                  <span>Quran Tutors Registry</span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Showing certified Al-Azhar graduate scholars with authentic reciter credentials.
                </p>
              </div>

              <div className="text-[11px] text-neutral-400 font-mono">
                Showing <strong className="text-emerald-400">{filteredTutors.length}</strong> of {tutors.length} scholars matching filters
              </div>
            </div>

            {/* DUAL-COLUMN GRID: SIDEBAR & MAIN CARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

              {/* 1. STICKY SIDEBAR FILTER COMPONENT */}
              <aside id="tutors-filter-sidebar" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-6 lg:sticky lg:top-4 self-start">

                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Filter size={13} className="text-emerald-400" />
                    <span>Search & Filters</span>
                  </h3>

                  {(searchQuery || selectedSubjects.length > 0 || selectedDays.length > 0 || priceRange < 50 || sortBy !== "rating") && (
                    <button
                      onClick={handleResetFilters}
                      className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-400 transition flex items-center space-x-1 cursor-pointer"
                      title="Clear all filters"
                    >
                      <RotateCcw size={10} />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Filter Sub-Section: Text Search */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono flex items-center">
                    <Search size={10} className="mr-1 text-emerald-400" /> Scholar Keyword
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Ahmed, Tajweed, Hafs..."
                      className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-750 focus:border-emerald-500/40 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition"
                    />
                    <Search size={12} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-neutral-500" />
                  </div>
                </div>

                {/* Filter Sub-Section: Subjects (Tajweed, Hifz, Arabic checkboxes) */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    📚 Subjects
                  </h4>
                  <div className="space-y-1.5">
                    {AVAILABLE_SUBJECTS.map(subject => {
                      const isChecked = selectedSubjects.includes(subject);
                      return (
                        <button
                          key={subject}
                          onClick={() => handleToggleSubject(subject)}
                          className="w-full flex items-center space-x-2 text-xs text-neutral-300 hover:text-white transition py-1 text-left cursor-pointer"
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                            isChecked ? "bg-emerald-500 border-emerald-400 text-neutral-950" : "bg-neutral-950 border-neutral-800"
                          }`}>
                            {isChecked && <CheckIcon size={11} className="stroke-[3]" />}
                          </span>
                          <span className={isChecked ? "font-bold text-emerald-400" : ""}>{subject} Lessons</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Sub-Section: Availability Days */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    📅 Weekly Availability
                  </h4>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {WEEK_DAYS.map(day => {
                      const isChecked = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => handleToggleDay(day)}
                          className="w-full flex items-center space-x-2 text-xs text-neutral-300 hover:text-white transition py-1 text-left cursor-pointer"
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                            isChecked ? "bg-emerald-500 border-emerald-400 text-neutral-950" : "bg-neutral-950 border-neutral-800"
                          }`}>
                            {isChecked && <CheckIcon size={11} className="stroke-[3]" />}
                          </span>
                          <span className={isChecked ? "font-bold text-emerald-400" : ""}>{day}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Sub-Section: Hourly Rate Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    <span>Max Hourly Budget</span>
                    <span className="text-emerald-400 text-xs font-mono font-black">${priceRange}/hr</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[9px] text-neutral-500 font-mono">$15</span>
                    <input
                      type="range"
                      min="15"
                      max="50"
                      value={priceRange}
                      onChange={(e) => setPriceRange(Number(e.target.value))}
                      className="flex-1 accent-emerald-500 h-1 bg-neutral-950 rounded-lg cursor-pointer appearance-none"
                    />
                    <span className="text-[9px] text-neutral-500 font-mono">$50</span>
                  </div>
                </div>

                {/* Filter Sub-Section: Sorting Order */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    ⚡️ Sorting order
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-750 focus:border-emerald-500/40 rounded-xl px-2.5 py-2 text-xs text-white outline-none transition cursor-pointer"
                  >
                    <option value="rating">⭐️ Highest Rated First</option>
                    <option value="experience">💼 Most Experienced First</option>
                    <option value="rate_low">💵 Budget (Low to High)</option>
                    <option value="rate_high">💎 Premium (High to Low)</option>
                  </select>
                </div>

                {/* Direct Reset Button at bottom of sidebar */}
                <button
                  onClick={handleResetFilters}
                  className="w-full bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-750 text-neutral-400 hover:text-white text-[11px] font-bold py-2 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset All Filters</span>
                </button>

              </aside>

              {/* 2. RIGHT CONTENT AREA: GRID DISPLAY OF TUTORS */}
              <div className="space-y-6">

                {filteredTutors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTutors.map((t) => (
                      <div
                        key={t.id}
                        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl hover:border-neutral-700/80 transition duration-300 flex flex-col justify-between group relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition duration-300" />

                        <div className="space-y-4">
                          {/* Headshot & Rating Row */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="relative shrink-0">
                                <img
                                  src={t.avatar}
                                  alt={t.name}
                                  className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/20 group-hover:border-emerald-500/50 transition duration-300"
                                />
                                <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-neutral-950 rounded-full p-0.5 shadow">
                                  <CheckCircle size={10} className="fill-emerald-500" />
                                </span>
                              </div>
                              <div>
                                <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Graduated Scholar</h3>
                                <h2 className="text-sm font-bold text-white group-hover:text-emerald-400 transition leading-snug">
                                  {t.name}
                                </h2>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center justify-end text-amber-400 space-x-1">
                                <Star size={12} className="fill-amber-400" />
                                <span className="text-xs font-black text-white font-mono">{t.rating}</span>
                              </div>
                              <span className="text-[9px] text-neutral-500 font-mono block uppercase">{t.experience} Experience</span>
                            </div>
                          </div>

                          {/* Subjects (Badges Requirement) */}
                          <div className="flex flex-wrap gap-1">
                            {t.specialties.map((spec, idx) => (
                              <span
                                key={idx}
                                className="bg-neutral-950 text-neutral-400 border border-neutral-850 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wide font-mono"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>

                          {/* Bio Description */}
                          <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                            {t.bio}
                          </p>

                          {/* Meta Rate row */}
                          <div className="bg-neutral-950/60 border border-neutral-850 p-2.5 rounded-xl flex items-center justify-between text-[11px] font-mono">
                            <div>
                              <span className="text-[8px] text-neutral-500 block">LANGUAGES</span>
                              <span className="text-neutral-300 font-semibold">{t.languages.join(", ")}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-neutral-500 block">HOURLY RATE</span>
                              <span className="text-emerald-400 font-extrabold text-xs">${t.hourlyRate}/hr</span>
                            </div>
                          </div>

                        </div>

                        {/* View Profile Action buttons */}
                        <div className="pt-4 mt-4 border-t border-neutral-850/60 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => navigate(`/tutors/${t.slug}`)}
                            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 hover:border-neutral-600 text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer text-center"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => onBookTrial(t.id)}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black py-2 px-3 rounded-xl transition text-center shadow shadow-emerald-500/10 cursor-pointer"
                          >
                            Book Trial
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                    <div className="w-12 h-12 bg-neutral-950 text-amber-500 border border-neutral-850 rounded-full flex items-center justify-center mx-auto">
                      <Search size={18} />
                    </div>
                    <h4 className="text-sm font-bold text-white">No scholars matches your filters</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Try adjusting your search keywords, raising your hourly budget, or clearing subject filters.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="bg-emerald-500 text-neutral-950 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
