export type VideoSource =
  | { kind: 'file'; src: string }
  | { kind: 'embed'; provider: 'YouTube' | 'Vimeo' | 'Google Drive'; src: string; original: string };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

function safeUrl(raw: string): URL | null {
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

/**
 * Works out how a lesson's video link should be played.
 * A plain <video> tag can only play direct video files, so YouTube, Vimeo and
 * Google Drive links (which are web pages, not files) are converted to their
 * embeddable player addresses instead.
 */
export function resolveVideoSource(rawUrl: string): VideoSource {
  const raw = rawUrl.trim();
  const url = safeUrl(raw);
  if (!url) return { kind: 'file', src: raw };

  const host = url.hostname.replace(/^www\.|^m\./, '').toLowerCase();

  // YouTube
  let ytId: string | null = null;
  if (host === 'youtu.be') ytId = url.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') ytId = url.searchParams.get('v');
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      if (m) ytId = m[1];
    }
  }
  if (ytId && YT_ID.test(ytId)) {
    return {
      kind: 'embed',
      provider: 'YouTube',
      src: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`,
      original: raw
    };
  }

  // Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = url.pathname.match(/(\d{6,})/);
    if (m) {
      const hash = url.searchParams.get('h');
      return {
        kind: 'embed',
        provider: 'Vimeo',
        src: `https://player.vimeo.com/video/${m[1]}${hash ? `?h=${encodeURIComponent(hash)}` : ''}`,
        original: raw
      };
    }
  }

  // Google Drive (file must be shared as "Anyone with the link")
  if (host === 'drive.google.com' || host === 'docs.google.com') {
    const m = url.pathname.match(/\/file\/d\/([^/]+)/) ?? null;
    const id = m ? m[1] : url.searchParams.get('id');
    if (id) {
      return {
        kind: 'embed',
        provider: 'Google Drive',
        src: `https://drive.google.com/file/d/${id}/preview`,
        original: raw
      };
    }
  }

  // Direct file. Browsers block http:// media on an https:// page, so upgrade it.
  let src = raw;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.protocol === 'http:') {
    src = raw.replace(/^http:\/\//i, 'https://');
  }
  return { kind: 'file', src };
}
