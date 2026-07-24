import { useState, useEffect, useContext } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// File-type categories — FIXED order + the validated categorical palette
// (dataviz skill: dark set passes CVD in the 6–8 band, light set has 3 sub-3:1
// hues → both require secondary encoding, which we supply via 2px segment gaps
// AND a fully direct-labelled legend below the bar).
const CATEGORIES = [
  { key: 'image',    labelKey: 'files.catImages',    dark: '#3987e5', light: '#2a78d6', Icon: ImageIcon },
  { key: 'video',    labelKey: 'files.catVideos',    dark: '#008300', light: '#008300', Icon: MovieIcon },
  { key: 'audio',    labelKey: 'files.catAudio',     dark: '#d55181', light: '#e87ba4', Icon: AudiotrackIcon },
  { key: 'document', labelKey: 'files.catDocuments', dark: '#c98500', light: '#eda100', Icon: DescriptionIcon },
  { key: 'archive',  labelKey: 'files.catArchives',  dark: '#199e70', light: '#1baf7a', Icon: FolderZipIcon },
  { key: 'other',    labelKey: 'files.catOther',     dark: '#d95926', light: '#eb6834', Icon: InsertDriveFileIcon },
];

const SECTION_LABEL_KEYS = {
  file_manager: 'files.sectionFileManager', inventory: 'nav.inventory', users: 'files.sectionUsers',
  crm: 'files.sectionCrm', mis: 'nav.invoices', digitalMarketing: 'nav.digitalMarketing',
  jobReport: 'files.sectionJobReport', projectManager: 'files.sectionProjectManager',
};

const formatBytes = (b) => {
  if (!b || b < 1) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
  return `${(b / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export default function StorageManagement({ open, onClose }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const T = {
    BG:       isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    TRACK:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    CARD_BG:  isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.55)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.4)',
    DIVIDER:  isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
  };

  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const res = await authCtx.jwtInst({
          method: 'get', url: `${axiosGlobal.defaultTargetApi}/files/storageStats`,
        });
        setStats(res.data);
      } catch { setStats(null); }
      setLoading(false);
    })();
  }, [open]);   // eslint-disable-line react-hooks/exhaustive-deps

  const color = (c) => (isDark ? c.dark : c.light);

  // Ordered category rows with size/count/pct (only those that have data).
  const total = stats?.totalSize || 0;
  const rows = CATEGORIES
    .map((c) => ({ ...c, ...(stats?.byType?.[c.key] || { size: 0, count: 0 }) }))
    .map((c) => ({ ...c, pct: total ? (c.size / total) * 100 : 0 }));
  const present = rows.filter((r) => r.size > 0 || r.count > 0);

  const HeaderStat = ({ value, label }) => (
    <Box>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: T.TEXT_PRI, lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.8, mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isXs}
      PaperProps={{ sx: { bgcolor: T.BG, border: `1px solid ${T.BD}`,
        borderRadius: isXs ? 0 : '14px', backgroundImage: 'none' } }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2,
        borderBottom: `1px solid ${T.DIVIDER}` }}>
        <StorageIcon sx={{ fontSize: 18, color: T.TEXT_SEC }} />
        <Typography sx={{ flexGrow: 1, fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {t('files.storageHeader')}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={26} sx={{ color: T.TEXT_TER }} />
        </Box>
      ) : !stats ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_TER }}>{t('files.failedLoadStorageStats')}</Typography>
        </Box>
      ) : (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Headline totals */}
          <Box sx={{ display: 'flex', gap: 4 }}>
            <HeaderStat value={formatBytes(total)} label={t('files.totalUsedLabel')} />
            <Box sx={{ width: '1px', bgcolor: T.DIVIDER }} />
            <HeaderStat value={(stats.totalCount || 0).toLocaleString()} label={t('files.filesCountLabel')} />
          </Box>

          {present.length === 0 ? (
            <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_TER, textAlign: 'center', py: 2 }}>
              {t('files.noFilesStoredYet')}
            </Typography>
          ) : (
            <>
              {/* Stacked proportion bar — 2px gaps between segments (secondary
                  encoding for the palette's CVD/contrast bands). */}
              <Box sx={{ display: 'flex', gap: '2px', height: 14, borderRadius: '7px',
                overflow: 'hidden', bgcolor: T.TRACK }}>
                {present.map((c) => (
                  <Tooltip key={c.key} arrow
                    title={t('files.categorySummaryTooltip', { label: t(c.labelKey), size: formatBytes(c.size), fileCount: t('dm.fileCount', { count: c.count }), pct: c.pct.toFixed(1) })}>
                    <Box sx={{ flexGrow: c.size, flexBasis: 0, minWidth: c.size ? 3 : 0, bgcolor: color(c),
                      transition: 'opacity 0.15s', '&:hover': { opacity: 0.8 } }} />
                  </Tooltip>
                ))}
              </Box>

              {/* Legend — every type directly labelled (size + count + %). This is
                  the required direct-label channel AND doubles as the table view. */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {present.map((c, i) => (
                  <Box key={c.key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color(c), flexShrink: 0 }} />
                      <c.Icon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_PRI, flexGrow: 1 }}>{t(c.labelKey)}</Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, fontVariantNumeric: 'tabular-nums' }}>
                        {t('dm.fileCount', { count: c.count })}
                      </Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.TEXT_SEC, minWidth: 64,
                        textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {formatBytes(c.size)}
                      </Typography>
                    </Box>
                    {i < present.length - 1 && <Divider sx={{ borderColor: T.DIVIDER }} />}
                  </Box>
                ))}
              </Box>

              {/* By section */}
              {(stats.bySection || []).length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
                    textTransform: 'uppercase', color: T.TEXT_TER, mb: 1.25 }}>
                    {t('files.bySectionHeader')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {stats.bySection.filter((s) => s.size > 0).map((s) => {
                      const pct = total ? (s.size / total) * 100 : 0;
                      return (
                        <Box key={s.scope}>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.4 }}>
                            <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, flexGrow: 1 }}>
                              {SECTION_LABEL_KEYS[s.scope] ? t(SECTION_LABEL_KEYS[s.scope]) : s.scope}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, fontVariantNumeric: 'tabular-nums' }}>
                              {formatBytes(s.size)}
                            </Typography>
                          </Box>
                          <Box sx={{ height: 6, borderRadius: '3px', bgcolor: T.TRACK, overflow: 'hidden' }}>
                            <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '3px',
                              bgcolor: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Largest files */}
              {(stats.largest || []).length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
                    textTransform: 'uppercase', color: T.TEXT_TER, mb: 1.25 }}>
                    {t('files.largestFilesHeader')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {stats.largest.map((f, i) => (
                      <Box key={f._id || i}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.85 }}>
                          <InsertDriveFileIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />
                          <Typography noWrap sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, flexGrow: 1, minWidth: 0 }}>
                            {f.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, flexShrink: 0 }}>
                            {SECTION_LABEL_KEYS[f.scope] ? t(SECTION_LABEL_KEYS[f.scope]) : f.scope}
                          </Typography>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.TEXT_SEC, flexShrink: 0,
                            minWidth: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {formatBytes(f.size)}
                          </Typography>
                        </Box>
                        {i < stats.largest.length - 1 && <Divider sx={{ borderColor: T.DIVIDER }} />}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      )}
    </Dialog>
  );
}
