import { useContext, useEffect, useState } from 'react';
import AxiosGlobal from '../components/authAndConnections/axiosGlobalUrl';

// ── One source of truth for "what URL do I put in a <video> tag" ──────────────
//
// Every player in the app used to point straight at `${api}/uploads/<diskName>`
// — the untouched original upload. That works for an h264/aac .mp4 and for
// nothing else: an .mkv, .avi, .wmv, .flv, a 3gp, an HEVC .mp4, an AC-3 audio
// track, or an h264 .mov opened in Firefox all leave the browser with a
// container or codec it refuses to decode, and the user sees a black box with
// working controls and no picture.
//
// The backend already writes a universally-playable H.264/AAC MP4 copy next to
// those uploads (api/utils/mediaConvert.js). `GET /media/video/<diskName>`
// redirects to that copy when it exists and to the original when it doesn't,
// so callers need no knowledge of which case they're in, and nothing has to be
// re-fetched or re-embedded when a transcode finishes later.
//
// Use videoSrc() for the PLAYABLE source. Keep pointing downloads at
// /uploads/<diskName> — a download should hand over the real file the user
// uploaded, not a re-encoded proxy.
export function videoSrc(diskName, apiBase) {
  if (!diskName || !apiBase) return null;
  return `${apiBase}/media/video/${encodeURIComponent(diskName)}`;
}

export function originalSrc(diskName, apiBase) {
  if (!diskName || !apiBase) return null;
  return `${apiBase}/uploads/${diskName}`;
}

// Same idea as videoSrc(), but for the many call sites that already hold a
// fully-built `${api}/uploads/<diskName>` URL rather than the bare disk name —
// it rewrites the path in place, exactly the way downloadFile() rewrites
// /uploads/ to /download/. Any `#t=0.1` poster hint or query string is carried
// across untouched. A URL that isn't an /uploads/ one is returned unchanged.
export function playbackUrl(url) {
  if (!url) return url;
  const marker = '/uploads/';
  const i = url.indexOf(marker);
  if (i === -1) return url;
  const rest = url.slice(i + marker.length);
  const cut = rest.search(/[?#]/);
  const diskName = cut === -1 ? rest : rest.slice(0, cut);
  const suffix = cut === -1 ? '' : rest.slice(cut);
  return `${url.slice(0, i)}/media/video/${encodeURIComponent(diskName)}${suffix}`;
}

// The disk name out of a `${api}/uploads/<diskName>` URL — what
// useTranscodeStatus() needs from a call site that only has the built URL.
export function diskNameFromUrl(url) {
  if (!url) return null;
  const marker = '/uploads/';
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const rest = url.slice(i + marker.length);
  const cut = rest.search(/[?#]/);
  return cut === -1 ? rest : rest.slice(0, cut);
}

const VIDEO_EXT = /\.(mp4|webm|ogv|ogg|mov|m4v|mkv|avi|wmv|flv|3gp|3g2|mpg|mpeg|ts|m2ts|mts|f4v|asf|rm|rmvb|divx|vob)$/i;

// Whether a file should be treated as a video. Checks the mimetype (the
// reliable signal) AND the extension, because browsers and OSes hand up
// `application/octet-stream` for plenty of the less common containers — which
// is exactly the set that needed transcoding in the first place, so keying
// only off `video/` would skip the files this whole path exists for.
export function isVideoFile({ mimetype, name, format } = {}) {
  if (mimetype && String(mimetype).toLowerCase().startsWith('video/')) return true;
  if (format && VIDEO_EXT.test(`.${String(format).replace(/^\./, '')}`)) return true;
  return Boolean(name && VIDEO_EXT.test(String(name)));
}

// Reports whether a web-playable copy of this video is still being produced,
// so a player can say "preparing…" instead of showing a stalled black frame.
// Most surfaces embed a snapshot of the file taken at UPLOAD time — before the
// transcode has finished — so the status can't come from the record itself; it
// is looked up by disk name, the one field every snapshot shape carries.
// Returns 'none' | 'pending' | 'ready' | 'failed' ('none' on any error, which
// is the "just play the original" case and matches pre-existing behaviour).
export function useTranscodeStatus(diskName, enabled = true) {
  const axiosGlobal = useContext(AxiosGlobal);
  const apiBase = axiosGlobal.defaultTargetApi;
  const [status, setStatus] = useState('none');

  useEffect(() => {
    if (!enabled || !diskName || !apiBase) { setStatus('none'); return undefined; }
    let cancelled = false;
    let timer = null;

    const check = async () => {
      try {
        const res = await fetch(`${apiBase}/media/video-status/${encodeURIComponent(diskName)}`);
        if (!res.ok) throw new Error('status lookup failed');
        const data = await res.json();
        if (cancelled) return;
        setStatus(data.transcodeStatus || 'none');
        // Only a pending transcode is worth re-checking; every other state is
        // terminal, so this stops polling on its own rather than running for
        // as long as the component stays mounted.
        if (data.transcodeStatus === 'pending') timer = setTimeout(check, 5000);
      } catch (_) {
        if (!cancelled) setStatus('none');
      }
    };
    check();

    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [diskName, enabled, apiBase]);

  return status;
}
