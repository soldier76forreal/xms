import { useState, useSyncExternalStore, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloudOffIcon from '@mui/icons-material/CloudOff';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import {
  subscribe, getSnapshot, initUploadManager,
  pauseUpload, resumeUpload, cancelUpload, retryUpload, clearFinishedUploads,
} from '../../tools/uploadCenter/uploadManager';

const fmtBytes = (n) => {
  if (!n && n !== 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

// Where each purpose's uploads belong, for the panel's "related section" line
// and click-through. Mirrors the notifPath/shortLinkPath convention.
const PURPOSE_ROUTES = {
  fileManager:     { labelKey: 'nav.files',            path: '/files' },
  tutorial:        { labelKey: 'nav.tutorials',        path: '/tutorials' },
  dmRawContent:    { labelKey: 'nav.digitalMarketing', path: '/digitalMarketing?dm=raw' },
  dmReadyToUpload: { labelKey: 'nav.digitalMarketing', path: '/digitalMarketing?dm=ready' },
  inventoryMedia:  { labelKey: 'nav.inventory',        path: '/inventory' },
  crmCommunication:{ labelKey: 'nav.customers',        path: '/crm' },
  jobReport:       { labelKey: 'nav.jobReports',       path: '/jobReports' },
  personalNote:    { labelKey: 'nav.people',           path: '/myActivity' },
  avatar:          { labelKey: 'nav.people',           path: '/users' },
};

// The Upload Center — the one place every transfer in the app is visible.
// Sits beside the notification bell (the app's other always-present top-bar
// control) so it is reachable from every section rather than living inside
// one, which is what the old file-manager-only transfer panel did.
export default function UploadCenter() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const history = useHistory();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const uploads = useSyncExternalStore(subscribe, getSnapshot);
  const [anchorEl, setAnchorEl] = useState(null);

  // Boot the engine once the app has a token — this is also what reloads any
  // unfinished uploads left in IndexedDB by a previous session.
  useEffect(() => {
    if (authCtx.isLoggedIn === true) {
      initUploadManager({ authCtx, axiosGlobal });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx.isLoggedIn]);

  const active = uploads.filter((u) => ['queued', 'uploading', 'paused', 'offline', 'error'].includes(u.status));
  const inFlight = uploads.filter((u) => u.status === 'uploading' || u.status === 'queued');
  const hasFinished = uploads.some((u) => u.status === 'done');

  // Nothing to show and nothing to say — stay out of the top bar entirely.
  if (uploads.length === 0) return null;

  const T = {
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)',
    BD:       isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    ROW_BG:   isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
  };

  const totalPct = (() => {
    if (inFlight.length === 0) return 0;
    const sent = inFlight.reduce((a, u) => a + u.sentBytes, 0);
    const total = inFlight.reduce((a, u) => a + u.totalBytes, 0);
    return total ? Math.round((sent / total) * 100) : 0;
  })();

  const statusIcon = (u) => {
    if (u.status === 'done')    return <CheckCircleIcon sx={{ fontSize: 15, color: '#4CAF50' }} />;
    if (u.status === 'error')   return <ErrorOutlineIcon sx={{ fontSize: 15, color: '#EA005A' }} />;
    if (u.status === 'offline') return <CloudOffIcon sx={{ fontSize: 15, color: '#B26A00' }} />;
    return null;
  };

  const statusText = (u) => {
    if (u.status === 'done')      return t('uploads.statusDone');
    if (u.status === 'error')     return u.error || t('uploads.statusError');
    if (u.status === 'offline')   return t('uploads.statusOffline');
    if (u.status === 'paused')    return t('uploads.statusPaused');
    if (u.status === 'queued')    return t('uploads.statusQueued');
    return `${fmtBytes(u.sentBytes)} / ${fmtBytes(u.totalBytes)}`;
  };

  return (
    <>
      <Tooltip title={t('uploads.centerTitle')}>
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ color: T.TEXT_SEC, '&:hover': { color: T.TEXT_PRI } }}>
          <Badge badgeContent={active.length} color="primary"
            sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 15, minWidth: 15 } }}>
            <CloudUploadIcon sx={{ fontSize: 19 }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover open={!!anchorEl} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: {
          width: { xs: 300, sm: 380 }, maxHeight: '70vh',
          bgcolor: T.PANEL_BG, border: `1px solid ${T.BD}`,
          borderRadius: '12px', backgroundImage: 'none', mt: 0.5,
        }}}>

        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${T.BD}`, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
            {t('uploads.centerTitle')}
          </Typography>
          {hasFinished && (
            <Button size="small" onClick={() => clearFinishedUploads()}
              sx={{ fontSize: '0.68rem', textTransform: 'none', color: T.TEXT_TER, minWidth: 0 }}>
              {t('uploads.clearFinished')}
            </Button>
          )}
        </Box>

        {inFlight.length > 0 && (
          <Box sx={{ px: 2, pt: 1.25 }}>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mb: 0.5 }}>
              {t('uploads.overallProgress', { count: inFlight.length, pct: totalPct })}
            </Typography>
            <LinearProgress variant="determinate" value={totalPct}
              sx={{ height: 4, borderRadius: 2, bgcolor: T.ROW_BG }} />
          </Box>
        )}

        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5, overflowY: 'auto' }}>
          {uploads.map((u) => {
            const pct = u.totalBytes ? Math.round((u.sentBytes / u.totalBytes) * 100) : 0;
            const route = PURPOSE_ROUTES[u.purpose];
            return (
              <Box key={u.localId} sx={{ p: 1, borderRadius: '9px', bgcolor: T.ROW_BG, border: `1px solid ${T.BD}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {statusIcon(u)}
                  <Typography noWrap sx={{ fontSize: '0.76rem', color: T.TEXT_PRI, flexGrow: 1, minWidth: 0 }}>
                    {u.filename}
                  </Typography>

                  {(u.status === 'uploading' || u.status === 'queued') && (
                    <Tooltip title={t('uploads.pause')}>
                      <IconButton size="small" onClick={() => pauseUpload(u.localId)} sx={{ color: T.TEXT_TER, width: 22, height: 22 }}>
                        <PauseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {u.status === 'paused' && (
                    <Tooltip title={t('uploads.resume')}>
                      <IconButton size="small" onClick={() => resumeUpload(u.localId)} sx={{ color: T.TEXT_TER, width: 22, height: 22 }}>
                        <PlayArrowIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {u.status === 'error' && (
                    <Tooltip title={t('uploads.retry')}>
                      <IconButton size="small" onClick={() => retryUpload(u.localId)} sx={{ color: T.TEXT_TER, width: 22, height: 22 }}>
                        <RefreshIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {u.status !== 'done' && (
                    <Tooltip title={t('uploads.cancel')}>
                      <IconButton size="small" onClick={() => cancelUpload(u.localId)}
                        sx={{ color: T.TEXT_TER, width: 22, height: 22, '&:hover': { color: '#EA005A' } }}>
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {u.status !== 'done' && (
                  <LinearProgress variant={u.status === 'uploading' ? 'determinate' : 'determinate'} value={pct}
                    sx={{ height: 3, borderRadius: 2, my: 0.6, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.66rem', color: u.status === 'error' ? '#EA005A' : T.TEXT_TER, flexGrow: 1, minWidth: 0 }} noWrap>
                    {statusText(u)}
                  </Typography>
                  {route && (
                    <Typography
                      onClick={() => { setAnchorEl(null); history.push(route.path); }}
                      sx={{ fontSize: '0.64rem', color: T.TEXT_TER, cursor: 'pointer', flexShrink: 0,
                        '&:hover': { color: T.TEXT_PRI, textDecoration: 'underline' } }}>
                      {u.sectionLabel || t(route.labelKey)}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}
