import { request } from "./api";

export type PostSummary = {
  id: string; title: string; slug: string; excerpt: string; author: string;
  coverImage: string; publishedAt: string; tags: string[];
};
export type PostDetail = PostSummary & {
  content: string; seoTitle: string | null; seoDescription: string | null; seoImage: string | null;
};

export const fetchPosts = () => request<PostSummary[]>("/blog");
export const fetchPost = (slug: string) => request<PostDetail>(`/blog/${encodeURIComponent(slug)}`);

export const formatDate = (iso: string) => iso.slice(0, 10);

export type SurahOverrideSummary = {
  number: number; nameArabic: string | null; nameEnglish: string | null; englishNameTranslation: string | null;
  revelationType: string | null; audioUrl: string | null; seoTitle: string | null; seoDescription: string | null;
};
export type SurahOverride = SurahOverrideSummary & {
  ayahs: Array<{ numberInSurah: number; arabic: string; translation: string }> | null;
};
export type JuzRow = { number: number; nameArabic: string; nameEnglish: string; startInfo: string };
