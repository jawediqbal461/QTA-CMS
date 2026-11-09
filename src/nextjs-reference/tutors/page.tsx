// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

// Define SEO metadata for indexable tutors directory list
export const metadata: Metadata = {
  title: 'Find Online Quran Tutors & Scholars | Quran Tutors Academy',
  description: 'Connect with verified Al-Azhar graduate scholars for 1-on-1 Tajweed, Hifz, and Arabic lessons. Browse schedules, ratings, and student reviews.',
  keywords: ['Quran Tutor', 'Learn Tajweed', 'Hifz Memorization', 'Quran Reading Online', 'Ijazah Academy'],
  openGraph: {
    title: 'Find Online Quran Tutors & Scholars | Quran Tutors Academy',
    description: 'Learn Tajweed and Hifz with verified graduate scholars. 100% satisfaction guarantee.',
    url: 'https://qurantutorsacademy.com/tutors',
    type: 'website',
  }
};

// Interface for database schema matching
interface TutorProfile {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  specialties: string[];
  experience: string;
  rating: number;
  lessons_completed: number;
  bio: string;
  hourly_rate: number;
  languages: string[];
}

// Next.js Server Side Fetch
async function getTutorProfiles(): Promise<TutorProfile[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Secure server-side access
  );

  const { data, error } = await supabase
    .from('tutor_profiles')
    .select('id, name, slug, avatar, specialties, experience, rating, lessons_completed, bio, hourly_rate, languages')
    .order('rating', { ascending: false });

  if (error) {
    console.error('Failed to load tutors directory list:', error);
    return [];
  }

  return data || [];
}

// Server Component (Renders on the server for speed and optimal search index visibility)
export default async function TutorsDirectoryPage() {
  const tutors = await getTutorProfiles();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-10">
        
        {/* Page Title & Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full uppercase font-mono font-bold tracking-widest border border-emerald-500/20">
            Verified Scholar Registry
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Our Certified Quranic Scholars
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Every tutor undergoes extensive recitation diagnostic auditing. Learn Tajweed and Hifz securely from the comfort of your home.
          </p>
        </div>

        {/* Dynamic List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map((t) => (
            <div 
              key={t.id}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between hover:border-neutral-700 transition"
            >
              <div className="space-y-4">
                
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Image 
                      src={t.avatar} 
                      alt={t.name} 
                      width={56} 
                      height={56} 
                      className="rounded-2xl object-cover border border-emerald-500/25"
                    />
                    <div>
                      <h2 className="text-base font-bold text-white">{t.name}</h2>
                      <p className="text-xs text-neutral-400">Experience: {t.experience}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-amber-400 space-x-1">
                    <span className="text-xs font-bold text-white font-mono">{t.rating}</span>
                    <span>★</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {t.specialties.map((spec, i) => (
                    <span 
                      key={i}
                      className="bg-neutral-950 text-emerald-400 border border-emerald-500/10 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider font-mono"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Excerpt */}
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                  {t.bio}
                </p>

                {/* Meta details */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-neutral-500 block">LANGUAGES</span>
                    <span className="text-neutral-300 font-bold">{t.languages.join(', ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-neutral-500 block">RATE</span>
                    <span className="text-emerald-400 font-extrabold">${t.hourly_rate}/hr</span>
                  </div>
                </div>

              </div>

              {/* Dynamic Link triggering slug page (/tutors/[slug]) */}
              <div className="pt-6 mt-6 border-t border-neutral-850 flex items-center gap-2">
                <Link 
                  href={`/tutors/${t.slug}`}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-bold py-3 px-4 rounded-xl text-center transition"
                >
                  View Profile & Ijazah
                </Link>
                <Link 
                  href={`/tutors/${t.slug}?book=trial`}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black py-3 px-4 rounded-xl text-center transition shadow"
                >
                  Book Session
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
