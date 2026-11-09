// @ts-nocheck
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Params {
  slug: string;
}

interface Props {
  params: Params;
}

// 1. Dynamic Meta Generation for SEO (Fulfills Part 2 Search Index requirement)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tutor = await fetchTutorBySlug(params.slug);
  
  if (!tutor) {
    return {
      title: 'Scholarly Quran Tutor Not Found | Quran Tutors Academy'
    };
  }

  return {
    title: `${tutor.name} - Verified Recitation Scholar | Quran Tutors Academy`,
    description: `Book 1-on-1 trial with ${tutor.name}. Specialties: ${tutor.specialties.join(', ')}. Over ${tutor.experience} experience. Fully certified with official Ijazah qualifications.`,
    openGraph: {
      title: `${tutor.name} | Quran Tutors Academy`,
      description: tutor.bio,
      images: [{ url: tutor.avatar, width: 400, height: 400, alt: tutor.name }],
      url: `https://qurantutorsacademy.com/tutors/${tutor.slug}`,
      type: 'profile'
    }
  };
}

// 2. static dynamic paths generation (SSG) for ultra-fast, static caching
export async function generateStaticParams() {
  const { data, error } = await supabase
    .from('tutor_profiles')
    .select('slug');

  if (error || !data) return [];
  
  return data.map((tutor) => ({
    slug: tutor.slug
  }));
}

// 3. Mock Database query fetch using Supabase client syntax (As requested in prompt blueprint)
async function fetchTutorBySlug(slug: string) {
  const { data, error } = await supabase
    .from('tutor_profiles')
    .select(`
      id,
      name,
      slug,
      avatar,
      specialties,
      experience,
      rating,
      students_count,
      lessons_completed,
      bio,
      video_url,
      timezone,
      languages,
      hourly_rate,
      availability
    `)
    .eq('slug', slug)
    .single(); // Fulfills "SELECT * FROM tutor_profiles WHERE slug = 'slug'"

  if (error) {
    console.error('Error fetching tutor profile with Supabase client:', error.message);
    return null;
  }

  return data;
}

// 4. Next.js Page Server Component
export default async function TutorProfilePage({ params }: Props) {
  const tutor = await fetchTutorBySlug(params.slug);

  if (!tutor) {
    notFound(); // Triggers default 404 page if tutor slug is not in DB
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 py-12 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div>
          <Link 
            href="/tutors"
            className="inline-flex items-center space-x-2 text-xs font-bold text-neutral-400 hover:text-white transition bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl"
          >
            <span>← Back to Tutors Directory</span>
          </Link>
        </div>

        {/* Profile Card Header */}
        <div className="bg-gradient-to-r from-emerald-950/20 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
          <Image 
            src={tutor.avatar} 
            alt={tutor.name} 
            width={128} 
            height={128} 
            className="rounded-2xl object-cover border-4 border-emerald-500/30"
          />

          <div className="space-y-3 flex-1 text-center md:text-left">
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest font-mono">
              Verified Scholar
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white">{tutor.name}</h1>
            <p className="text-xs text-neutral-400">Experience: {tutor.experience} taught | Timezone: {tutor.timezone}</p>
            
            <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
              {tutor.specialties.map((spec: string, i: number) => (
                <span 
                  key={i}
                  className="bg-neutral-950 text-neutral-400 border border-neutral-850 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bio & Credentials */}
          <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono text-emerald-400">About Scholar Biography</h2>
            <p className="text-sm leading-relaxed text-neutral-300">{tutor.bio}</p>

            <div className="border-t border-neutral-800 pt-4 grid grid-cols-2 gap-4 text-xs text-neutral-400">
              <div>
                <strong className="text-neutral-200">Languages:</strong> {tutor.languages.join(', ')}
              </div>
              <div>
                <strong className="text-neutral-200">Classes Completed:</strong> {tutor.lessons_completed}+ Hours
              </div>
            </div>
          </div>

          {/* Sticky Session Booking Call To Action */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-fit space-y-4">
            <div className="flex justify-between items-baseline pb-3 border-b border-neutral-800">
              <span className="text-xs text-neutral-500 uppercase font-mono font-bold">Standard Rate</span>
              <div>
                <span className="text-2xl font-black text-emerald-400 font-mono">${tutor.hourly_rate}</span>
                <span className="text-xs text-neutral-500">/hr</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Every lesson includes a dynamic homework correction log, 1-on-1 virtual recitation diagnostics, and verified study metrics.
            </p>

            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black py-3 rounded-xl transition text-xs uppercase tracking-wider">
              Book 45-Minute Trial Session
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
