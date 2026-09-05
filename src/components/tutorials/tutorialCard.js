import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';
import MovieIcon from '@mui/icons-material/Movie';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import UserAvatar from '../main/userAvatar';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useContext } from 'react';
import { sectionLabel } from './sectionLabels';
import UnreadDot, { unreadRowTint } from '../../tools/unreadDot';

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

const kindIcon = (kind, sx) => {
  if (kind === 'image') return <ImageIcon sx={sx} />;
  if (kind === 'video') return <MovieIcon sx={sx} />;
  if (kind === 'pdf')   return <PictureAsPdfIcon sx={sx} />;
  return <InsertDriveFileIcon sx={sx} />;
};

// Reused in both the full Tutorial Center list (tutorials.js) and the compact
// per-section widget dialog (sectionTutorials.js) — `dense` trims it down to
// thumbnail + title + file-type icon for the smaller surface.
export default function TutorialCard({ tutorial, T, isDark, dense = false, selected = false, unread = false, onClick }) {
  const { t } = useTranslation();
  const axiosGlobal = useContext(AxiosGlobal);

  const firstFile = (tutorial.files || [])[0];
  const thumbUrl  = firstFile?.thumbnail ? `${axiosGlobal.defaultTargetApi}/uploads/${firstFile.thumbnail}` : null;

  return (
    <Box onClick={onClick}
      sx={{ position: 'relative', display: 'flex', gap: 1.25, p: 1.25, borderRadius: '10px', cursor: 'pointer',
        bgcolor: selected ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : unread ? unreadRowTint(isDark) : 'transparent',
        border: `1px solid ${selected ? T.BD2 : 'transparent'}`,
        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' } }}>
      {unread && <UnreadDot />}
      <Box sx={{ width: dense ? 40 : 52, height: dense ? 40 : 52, borderRadius: '8px', flexShrink: 0,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
        {thumbUrl
          ? <Box component="img" src={thumbUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : kindIcon(firstFile?.kind, { fontSize: dense ? 18 : 22, color: T.TEXT_TER })}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: dense ? '0.76rem' : '0.82rem', fontWeight: 600, color: T.TEXT_PRI }} noWrap>
          {tutorial.title}
        </Typography>
        {!dense && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4, flexWrap: 'wrap' }}>
            <Chip label={sectionLabel(tutorial.section, t)} size="small"
              sx={{ height: 17, fontSize: '0.6rem', fontWeight: 700, bgcolor: T.CTRL_BG, color: T.TEXT_SEC,
                '& .MuiChip-label': { px: 0.6 } }} />
            {(tutorial.tags || []).slice(0, 2).map((tag) => (
              <Chip key={tag} label={tag} size="small"
                sx={{ height: 17, fontSize: '0.58rem', bgcolor: 'transparent', color: T.TEXT_TER,
                  border: `1px solid ${T.BD}`, '& .MuiChip-label': { px: 0.6 } }} />
            ))}
            {(tutorial.tags || []).length > 2 && (
              <Typography sx={{ fontSize: '0.6rem', color: T.TEXT_TER }}>
                +{tutorial.tags.length - 2}
              </Typography>
            )}
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.3 }}>
          {tutorial.createdByName && !dense && <UserAvatar userId={tutorial.createdBy} size={14} fontSize="0.5rem" />}
          <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }} noWrap>
            {!dense && tutorial.createdByName ? `${tutorial.createdByName} · ` : ''}
            {t('tutorials.fileCount', { count: tutorial.files?.length || 0 })} · {fmtDate(tutorial.insertDate)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
