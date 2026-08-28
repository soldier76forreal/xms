import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

// ── In-app media viewer (Digital Marketing) ───────────────────────────────────
// Everything plays/renders INSIDE the app — no window.open, no browser tabs.
// Handles image / video / audio / PDF inline; anything else gets a download row.
// media: { url, name, kind } — kind resolved by resolveMediaKind below.

export const resolveMediaKind = (nameOrMime = '') => {
  const s = String(nameOrMime).toLowerCase();
  if (/(^image\/)|\.(jpe?g|png|gif|webp|bmp|svg)$/.test(s)) return 'image';
  if (/(^video\/)|\.(mp4|webm|mov|mkv|avi|m4v)$/.test(s))   return 'video';
  if (/(^audio\/)|\.(mp3|wav|ogg|m4a|aac|webm;codecs)$/.test(s)) return 'audio';
  if (/(^application\/pdf)|\.pdf$/.test(s))                 return 'pdf';
  return 'other';
};

// Native browser download WITH progress. We route a /uploads/<diskName> URL
// through the API's /download/<diskName> endpoint, which sets
// `Content-Disposition: attachment` — so the browser saves the file with its OWN
// download manager (progress bar, resumable) instead of us blob-fetching the
// whole thing into memory first (no progress, delayed, opens a tab).
// The cross-origin `download` attribute is ignored, but Content-Disposition
// forces the save regardless of origin.
export const downloadFile = (url, name) => {
  let href = url;
  const marker = '/uploads/';
  const i = url.indexOf(marker);
  if (i !== -1) {
    href = url.slice(0, i) + '/download/' + url.slice(i + marker.length);
    if (name) href += (href.includes('?') ? '&' : '?') + 'name=' + encodeURIComponent(name);
  }
  const a = document.createElement('a');
  a.href = href;
  if (name) a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

// sx — optional passthrough to the root Dialog (e.g. a zIndex bump when this
// viewer can be opened from inside another Dialog/Drawer — see tutorialForm.js
// / tutorialDetail.js, which nest it inside sectionTutorials.js's Dialog).
const MediaViewer = ({ open, onClose, media, sx }) => {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!media) return null;

  const { url, name = '', kind = resolveMediaKind(name) } = media;

  const handleDownload = () => downloadFile(url, name);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={sx}
      PaperProps={{ sx: {
        bgcolor: isDark ? '#0d0d0d' : theme.palette.background.paper,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
        borderRadius: '14px', backgroundImage: 'none', overflow: 'hidden',
      }}}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25,
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider}` }}>
        <Typography noWrap sx={{ flexGrow: 1, fontSize: '0.82rem', fontWeight: 600,
          color: isDark ? 'rgba(255,255,255,0.85)' : 'text.primary' }}>
          {name || t('common.preview')}
        </Typography>
        <IconButton size="small" onClick={handleDownload}
          sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>
          <DownloadIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <IconButton size="small" onClick={onClose}
          sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>
          <CloseIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: isDark ? '#000' : 'rgba(0,0,0,0.03)', minHeight: 220 }}>
        {kind === 'image' && (
          <Box component="img" src={url} alt={name}
            sx={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', display: 'block' }} />
        )}
        {kind === 'video' && (
          <Box component="video" src={url} controls autoPlay
            sx={{ maxWidth: '100%', maxHeight: '72vh', display: 'block', outline: 'none' }} />
        )}
        {kind === 'audio' && (
          <Box sx={{ py: 5, px: 3, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Box component="audio" src={url} controls autoPlay sx={{ width: '100%', maxWidth: 420 }} />
          </Box>
        )}
        {kind === 'pdf' && (
          <Box component="iframe" src={url} title={name}
            sx={{ width: '100%', height: '72vh', border: 'none', bgcolor: '#fff' }} />
        )}
        {kind === 'other' && (
          <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <InsertDriveFileIcon sx={{ fontSize: 44, color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }} />
            <Typography sx={{ fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.45)' : 'text.secondary' }}>
              {t('common.noInlinePreview')}
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default MediaViewer;
