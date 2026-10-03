import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DownloadIcon from '@mui/icons-material/Download';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { playbackUrl } from '../../tools/videoSource';
import { resolveMediaKind, downloadFile } from './mediaViewer';

// Telegram-style media view for a record's attachments: a dense thumbnail grid
// with type filters, opening into a full-screen viewer you can page through.
//
// Thumbnails load lazily and show a placeholder until the browser has enough of
// the file to paint a frame — which is why videos use preload="metadata" and a
// #t=0.1 fragment rather than downloading the whole clip up front.

const KINDS = [
  { key: 'all',   labelKey: 'dm.mediaFilterAll' },
  { key: 'image', labelKey: 'dm.mediaFilterImages' },
  { key: 'video', labelKey: 'dm.mediaFilterVideos' },
  { key: 'audio', labelKey: 'dm.mediaFilterAudio' },
  { key: 'other', labelKey: 'dm.mediaFilterFiles' },
];

const fmtDuration = (secs) => {
  if (!Number.isFinite(secs) || secs <= 0) return '';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Normalises a record's `files[]` into what the grid and viewer both consume.
export function toMediaItems(files, apiBase) {
  return (files || [])
    .filter((f) => f && f.diskName)
    .map((f) => {
      const url = `${apiBase}/uploads/${f.diskName}`;
      return {
        id: String(f.fileId || f.diskName),
        url,
        diskName: f.diskName,
        name: f.name || '',
        description: f.description || '',
        voiceDescriptionDiskName: f.voiceDescriptionDiskName || null,
        kind: resolveMediaKind(f.name || f.diskName || ''),
      };
    });
}

// ── one grid tile ────────────────────────────────────────────────────────────
function Tile({ item, onOpen, onDuration, duration, T }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const common = {
    onClick: () => onOpen(item),
    sx: {
      position: 'relative', width: '100%', aspectRatio: '1 / 1', cursor: 'pointer',
      borderRadius: '6px', overflow: 'hidden', bgcolor: T.CTRL_BG,
      border: `1px solid ${T.BD}`,
      '&:hover': { borderColor: T.BD2 },
    },
  };

  const Placeholder = ({ Icon }) => (
    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 0.5, px: 0.5 }}>
      <Icon sx={{ fontSize: 22, color: T.TEXT_TER }} />
      <Typography sx={{ fontSize: '0.58rem', color: T.TEXT_TER, textAlign: 'center',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {item.name}
      </Typography>
    </Box>
  );

  if (item.kind === 'image' && !failed) {
    return (
      <Box {...common}>
        {!loaded && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center' }}>
            <CircularProgress size={16} sx={{ color: T.TEXT_TER }} />
          </Box>
        )}
        <Box component="img" src={item.url} alt="" loading="lazy"
          onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0, transition: 'opacity 0.2s' }} />
      </Box>
    );
  }

  if (item.kind === 'video' && !failed) {
    return (
      <Box {...common}>
        {!loaded && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center' }}>
            <CircularProgress size={16} sx={{ color: T.TEXT_TER }} />
          </Box>
        )}
        <Box component="video" src={`${playbackUrl(item.url)}#t=0.1`}
          muted preload="metadata" playsInline
          onLoadedMetadata={(e) => { setLoaded(true); onDuration(item.id, e.target.duration); }}
          onError={() => setFailed(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', bgcolor: '#000',
            opacity: loaded ? 1 : 0, transition: 'opacity 0.2s' }} />
        {/* play + duration badge, bottom-left, as in the reference */}
        <Box sx={{ position: 'absolute', left: 4, bottom: 4, display: 'flex', alignItems: 'center',
          gap: 0.25, px: 0.5, py: '1px', borderRadius: '4px', bgcolor: 'rgba(0,0,0,0.6)' }}>
          <PlayArrowIcon sx={{ fontSize: 11, color: '#fff' }} />
          <Typography sx={{ fontSize: '0.6rem', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {fmtDuration(duration)}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (item.kind === 'audio') {
    return (
      <Box {...common}>
        <Placeholder Icon={AudiotrackIcon} />
        {duration > 0 && (
          <Box sx={{ position: 'absolute', left: 4, bottom: 4, px: 0.5, py: '1px',
            borderRadius: '4px', bgcolor: 'rgba(0,0,0,0.6)' }}>
            <Typography sx={{ fontSize: '0.6rem', color: '#fff' }}>{fmtDuration(duration)}</Typography>
          </Box>
        )}
        {/* metadata-only load, purely to get the duration badge */}
        <Box component="audio" src={item.url} preload="metadata"
          onLoadedMetadata={(e) => onDuration(item.id, e.target.duration)}
          sx={{ display: 'none' }} />
      </Box>
    );
  }

  return (
    <Box {...common}>
      <Placeholder Icon={item.kind === 'pdf' ? PictureAsPdfIcon : InsertDriveFileIcon} />
    </Box>
  );
}

// ── the grid ─────────────────────────────────────────────────────────────────
export function MediaGrid({ items, T, onOpen, columns }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [filter, setFilter] = useState('all');
  const [durations, setDurations] = useState({});

  const onDuration = useCallback((id, secs) => {
    setDurations((prev) => (prev[id] ? prev : { ...prev, [id]: secs }));
  }, []);

  const counts = useMemo(() => {
    const c = { all: items.length };
    for (const it of items) c[it.kind] = (c[it.kind] || 0) + 1;
    return c;
  }, [items]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.kind === filter)),
    [items, filter]);

  if (!items.length) return null;

  const cols = columns || (isXs ? 3 : 4);

  return (
    <Box>
      {/* Type filters — only kinds actually present are offered. */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
        {KINDS.filter((k) => counts[k.key] > 0).map((k) => {
          const active = filter === k.key;
          return (
            <Box key={k.key} onClick={() => setFilter(k.key)}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 0.9, py: '3px',
                borderRadius: '7px', cursor: 'pointer', userSelect: 'none',
                border: `1px solid ${active ? T.BD2 : T.BD}`,
                bgcolor: active ? T.CTRL_BG : 'transparent',
                '&:hover': { bgcolor: T.CTRL_BG } }}>
              <Typography sx={{ fontSize: '0.66rem', fontWeight: active ? 700 : 500,
                color: active ? T.TEXT_PRI : T.TEXT_SEC }}>
                {t(k.labelKey)}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', color: T.TEXT_TER }}>{counts[k.key]}</Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0.5 }}>
        {visible.map((item) => (
          <Tile key={item.id} item={item} T={T} onOpen={onOpen}
            duration={durations[item.id]} onDuration={onDuration} />
        ))}
      </Box>
    </Box>
  );
}

// ── full-screen viewer ───────────────────────────────────────────────────────
// Paging is by arrow keys, the on-screen chevrons, the filmstrip, or a wheel /
// horizontal swipe — the wheel is throttled so one trackpad flick moves one item
// rather than racing to the end.
export function MediaGalleryViewer({ open, items, index, onClose, onIndexChange }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const wheelLock = useRef(false);
  const touchStart = useRef(null);
  const [buffering, setBuffering] = useState(false);

  const count = items.length;
  const item = count > 0 && index >= 0 && index < count ? items[index] : null;

  const go = useCallback((delta) => {
    if (!count) return;
    onIndexChange((index + delta + count) % count);
  }, [index, count, onIndexChange]);

  useEffect(() => { setBuffering(item?.kind === 'video' || item?.kind === 'audio'); }, [item?.id, item?.kind]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, onClose]);

  const onWheel = (e) => {
    if (wheelLock.current) return;
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(d) < 12) return;
    wheelLock.current = true;
    go(d > 0 ? 1 : -1);
    setTimeout(() => { wheelLock.current = false; }, 320);
  };

  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };

  if (!item) return null;

  const stop = (e) => e.stopPropagation();

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <Fade in={open}>
        <Box onClick={onClose} onWheel={onWheel}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.94)',
            display: 'flex', flexDirection: 'column', outline: 'none' }}>

          {/* header */}
          <Box onClick={stop} sx={{ display: 'flex', alignItems: 'center', gap: 1,
            px: 2, py: 1.25, flexShrink: 0 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }} noWrap>
                {item.name || t('dm.previewFileFallback')}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                {t('dm.mediaCounter', { index: index + 1, total: count })}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
              <Tooltip title={t('common.download')}>
                <IconButton onClick={() => downloadFile(item.url, item.name)} sx={{ color: '#fff' }}>
                  <DownloadIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              <IconButton onClick={onClose} sx={{ color: '#fff' }}>
                <CloseIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Box>
          </Box>

          {/* stage */}
          <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', position: 'relative', px: { xs: 1, sm: 6 } }}>

            {count > 1 && (
              <IconButton onClick={(e) => { stop(e); go(-1); }}
                sx={{ position: 'absolute', left: 6, color: '#fff', bgcolor: 'rgba(255,255,255,0.08)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' } }}>
                <ChevronLeftIcon />
              </IconButton>
            )}

            <Box onClick={stop} sx={{ maxWidth: '100%', maxHeight: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center' }}>
              {buffering && (item.kind === 'video' || item.kind === 'audio') && (
                <CircularProgress size={26} sx={{ color: 'rgba(255,255,255,0.7)', position: 'absolute' }} />
              )}

              {item.kind === 'image' && (
                <Box component="img" src={item.url} alt=""
                  sx={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: '6px' }} />
              )}

              {item.kind === 'video' && (
                <Box component="video" key={item.id} src={playbackUrl(item.url)} controls autoPlay
                  onCanPlay={() => setBuffering(false)} onWaiting={() => setBuffering(true)}
                  onPlaying={() => setBuffering(false)}
                  sx={{ maxWidth: '100%', maxHeight: '78vh', borderRadius: '6px', bgcolor: '#000' }} />
              )}

              {item.kind === 'audio' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
                  <AudiotrackIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.5)' }} />
                  <Box component="audio" key={item.id} src={item.url} controls autoPlay
                    onCanPlay={() => setBuffering(false)} onWaiting={() => setBuffering(true)}
                    sx={{ width: { xs: 280, sm: 420 } }} />
                </Box>
              )}

              {item.kind === 'pdf' && (
                <Box component="iframe" title={item.name} src={item.url}
                  sx={{ width: { xs: '92vw', sm: '80vw' }, height: '78vh', border: 'none',
                    borderRadius: '6px', bgcolor: '#fff' }} />
              )}

              {!['image', 'video', 'audio', 'pdf'].includes(item.kind) && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: 5 }}>
                  <InsertDriveFileIcon sx={{ fontSize: 54, color: 'rgba(255,255,255,0.4)' }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                    {item.name}
                  </Typography>
                </Box>
              )}
            </Box>

            {count > 1 && (
              <IconButton onClick={(e) => { stop(e); go(1); }}
                sx={{ position: 'absolute', right: 6, color: '#fff', bgcolor: 'rgba(255,255,255,0.08)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' } }}>
                <ChevronRightIcon />
              </IconButton>
            )}
          </Box>

          {/* the file's own description, straight from the record */}
          {item.description && (
            <Box onClick={stop} sx={{ px: 3, pb: 1, flexShrink: 0 }}>
              <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)',
                textAlign: 'center', maxWidth: 720, mx: 'auto' }}>
                {item.description}
              </Typography>
            </Box>
          )}

          {/* filmstrip */}
          {count > 1 && !isXs && (
            <Box onClick={stop} sx={{ display: 'flex', gap: 0.5, px: 2, py: 1.25, flexShrink: 0,
              overflowX: 'auto', justifyContent: 'center' }}>
              {items.map((it, i) => (
                <Box key={it.id} onClick={() => onIndexChange(i)}
                  sx={{ width: 46, height: 46, flexShrink: 0, borderRadius: '5px', cursor: 'pointer',
                    overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.08)',
                    border: `2px solid ${i === index ? '#fff' : 'transparent'}`,
                    opacity: i === index ? 1 : 0.55,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {it.kind === 'image' ? (
                    <Box component="img" src={it.url} alt="" loading="lazy"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : it.kind === 'video' ? (
                    <PlayArrowIcon sx={{ fontSize: 18, color: '#fff' }} />
                  ) : it.kind === 'audio' ? (
                    <AudiotrackIcon sx={{ fontSize: 16, color: '#fff' }} />
                  ) : (
                    <InsertDriveFileIcon sx={{ fontSize: 16, color: '#fff' }} />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
}

export default MediaGrid;
