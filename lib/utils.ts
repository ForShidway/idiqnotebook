/**
 * Mengonversi berbagai format URL YouTube menjadi URL embed maupun ID video YouTube.
 * Mendukung:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Regex untuk menangkap 11-karakter YouTube Video ID
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = trimmed.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  // Jika user langsung memasukkan 11 karakter ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export function getYouTubeThumbnailUrl(url: string): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Memecah teks materi berdasarkan aturan:
 * - Enter 2 kali (\n\n atau baris kosong) -> dipisah menjadi elemen paragraf baru (<p>)
 * - Enter 1 kali (\n) di dalam paragraf yang sama -> dipisah menjadi baris baru (<br />)
 */
export function parseContentParagraphs(content: string): string[][] {
  if (!content) return [];

  // Normalisasi CRLF (\r\n) menjadi LF (\n)
  const normalized = content.replace(/\r\n/g, "\n");

  // Pisahkan berdasarkan 2 atau lebih newline (termasuk jika ada spasi di baris kosong)
  const rawParagraphs = normalized
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Untuk setiap paragraf, pecah lagi berdasarkan Enter 1x (\n)
  return rawParagraphs.map((paragraph) => paragraph.split("\n"));
}
