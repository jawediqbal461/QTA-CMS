// The migrated WordPress page for each Surah is a single opaque HTML blob
// (intro paragraph, a stats table, the Arabic text, and a "popular surahs"
// link block). The structured per-ayah data (src/data/quran-verses) now
// supplies the Arabic text and translation directly, so this only pulls
// out the two things worth keeping from the original page: its unique
// SEO intro copy, and the legacy site's own recitation audio file.
export interface SurahIntro {
  introHtml: string;
  audioUrl?: string;
}

export function extractSurahIntro(html: string): SurahIntro {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const audioUrl = doc.querySelector("audio[src]")?.getAttribute("src") || undefined;

  const firstBlock = doc.body.firstElementChild;
  let introHtml = "";
  if (firstBlock) {
    const clone = firstBlock.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("h2, h3, audio, table").forEach((el) => el.remove());
    introHtml = clone.innerHTML.trim();
  }
  return { introHtml, audioUrl };
}
