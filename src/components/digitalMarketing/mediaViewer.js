import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTheme } from '@mui/material/styles';

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

const MediaViewer = ({ open, onClose, media }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!media) return null;

  const { url, name = '', kind = resolveMediaKind(name) } = media;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
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
          {name || 'Preview'}
        </Typography>
        <IconButton size="small" component="a" href={url} download={name || true}
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
              No inline preview for this file type — use the download button above.
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default MediaViewer;
