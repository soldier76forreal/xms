import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import FolderIcon from '@mui/icons-material/Folder';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { FileIcon, defaultStyles } from 'react-file-icon';
import { useTheme } from '@mui/material/styles';

// ── File / folder grid tile (Phase 9 shell) ───────────────────────────────────
// One card renders either a folder entry ({doc, subs}) or a file entry
// ({file}) — the exact same tree-entry shapes store.js has always used.
const FileCard = ({ entry, apiBase, selected, checked, pinned, tags,
  onOpen, onToggleCheck, onTogglePin }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CARD_BG:  isDark ? '#181818' : theme.palette.background.paper,
    SEL_BG:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  };

  const isFolder = entry.file === undefined;
  const doc  = isFolder ? entry.doc : entry.file;
  const name = doc?.name || 'Untitled';
  const format = !isFolder ? (doc.format || '').toLowerCase() : null;
  const thumbUrl = !isFolder && doc.thumbnail ? `${apiBase}/uploads/${doc.thumbnail}` : null;

  return (
    <Box
      onClick={onOpen}
      sx={{
        position: 'relative', p: 1.25, borderRadius: '12px', cursor: 'pointer',
        border: `1px solid ${selected ? (isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.3)') : T.BD}`,
        bgcolor: selected ? T.SEL_BG : T.CARD_BG,
        transition: 'border-color 0.15s, background-color 0.15s',
        display: 'flex', flexDirection: 'column', gap: 0.75,
        '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)',
          '& .cardCheckbox, & .cardPin': { opacity: 1 } },
      }}>

      {/* checkbox — always reachable, visible on hover/selected/select-mode */}
      <Checkbox
        className="cardCheckbox"
        size="small" checked={checked}
        onClick={(e) => { e.stopPropagation(); onToggleCheck(); }}
        sx={{
          position: 'absolute', top: 4, left: 4, p: '4px', zIndex: 1,
          opacity: checked ? 1 : 0, transition: 'opacity 0.12s',
          color: T.TEXT_TER, '&.Mui-checked': { color: T.TEXT_PRI },
        }}
      />

      {/* pin toggle */}
      <IconButton
        className="cardPin"
        size="small"
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        sx={{
          position: 'absolute', top: 2, right: 2, p: '5px', zIndex: 1,
          opacity: pinned ? 1 : 0, transition: 'opacity 0.12s',
          color: pinned ? '#FFB74D' : T.TEXT_TER,
        }}>
        {pinned ? <StarIcon sx={{ fontSize: 16 }} /> : <StarBorderIcon sx={{ fontSize: 16 }} />}
      </IconButton>

      {/* icon / thumbnail */}
      <Box sx={{
        height: 72, borderRadius: '8px', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
      }}>
        {isFolder ? (
          <FolderIcon sx={{ fontSize: 40, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }} />
        ) : thumbUrl ? (
          <Box component="img" src={thumbUrl} alt={name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ width: 34 }}>
            <FileIcon extension={format} {...(defaultStyles[format] || {})} />
          </Box>
        )}
      </Box>

      {/* name */}
      <Typography noWrap title={name} sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.TEXT_PRI }}>
        {name}
      </Typography>

      {/* tag chips */}
      {tags?.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
          {tags.slice(0, 3).map((t) => (
            <Chip key={t._id} label={t.tag} size="small"
              sx={{ height: 16, fontSize: '0.6rem', borderRadius: '4px',
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: T.TEXT_SEC, '& .MuiChip-label': { px: 0.6 } }} />
          ))}
          {tags.length > 3 && (
            <Typography sx={{ fontSize: '0.62rem', color: T.TEXT_TER }}>+{tags.length - 3}</Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FileCard;
