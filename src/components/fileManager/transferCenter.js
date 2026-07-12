import { useState, useEffect, useContext, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import LinearProgress from '@mui/material/LinearProgress';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTheme, useMediaQuery } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { actions, uploadFile, setFileForRetry, startDownload } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

const fmtBytes = (n) => {
  if (!n) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n, i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

// Derives one of: uploading | paused | done | canceled | error — mirrors the
// legacy bottomUploadList's boolean-flag branching, named for readability.
const uploadState = (e) => {
  if (e.paused) return 'paused';
  if (e.uploading) return 'uploading';
  if (e.uploaded === true) return 'done';
  if (e.cancel === true) return 'canceled';
  if (e.error?.status) return 'error';
  return 'queued';
};

const StatusIcon = ({ state, size = 16 }) => {
  if (state === 'done')     return <CheckCircleIcon sx={{ fontSize: size, color: '#81c784' }} />;
  if (state === 'error')    return <ErrorOutlineIcon sx={{ fontSize: size, color: '#EA005A' }} />;
  if (state === 'canceled') return <ErrorOutlineIcon sx={{ fontSize: size, color: 'rgba(255,255,255,0.35)' }} />;
  if (state === 'paused')   return <PauseIcon sx={{ fontSize: size, color: '#FFB74D' }} />;
  return <CircularProgress size={size - 2} thickness={5} />;
};

// ── Row (shared shape for upload + download entries) ──────────────────────────
const TransferRow = ({ icon, name, sub, progress, state, T, onPause, onResume, onCancel, onRetry, onDismiss }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 1, px: 1.5,
    borderBottom: `1px solid ${T.DIVIDER}`,
    '&:last-of-type': { borderBottom: 'none' } }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.TEXT_PRI }}>{name}</Typography>
        <Typography noWrap sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>{sub}</Typography>
      </Box>
      <StatusIcon state={state} />
      <Box sx={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
        {state === 'uploading' && onPause && (
          <Tooltip title="Pause"><IconButton size="small" onClick={onPause} sx={{ p: '3px', color: T.TEXT_SEC }}><PauseIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
        )}
        {state === 'downloading' && onPause && (
          <Tooltip title="Cancel"><IconButton size="small" onClick={onPause} sx={{ p: '3px', color: T.TEXT_SEC }}><CloseIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
        )}
        {state === 'paused' && onResume && (
          <Tooltip title="Resume"><IconButton size="small" onClick={onResume} sx={{ p: '3px', color: '#64b5f6' }}><PlayArrowIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
        )}
        {(state === 'canceled' || state === 'error') && onRetry && (
          <Tooltip title="Retry"><IconButton size="small" onClick={onRetry} sx={{ p: '3px', color: '#64b5f6' }}><ReplayIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
        )}
        {state === 'uploading' && onCancel && (
          <Tooltip title="Cancel"><IconButton size="small" onClick={onCancel} sx={{ p: '3px', color: T.TEXT_SEC }}><CloseIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
        )}
        {(state === 'done' || state === 'canceled' || state === 'error' || state === 'paused') && onDismiss && (
          <Tooltip title="Remove"><IconButton size="small" onClick={onDismiss} sx={{ p: '3px', color: T.TEXT_TER }}><CloseIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
        )}
      </Box>
    </Box>
    {(state === 'uploading' || state === 'downloading') && (
      progress === undefined
        ? <LinearProgress sx={{ height: 3, borderRadius: 2 }} />
        : <LinearProgress variant="determinate" value={progress} sx={{ height: 3, borderRadius: 2 }} />
    )}
  </Box>
);

// ── Transfer center — Dropbox-style floating panel (File section only) ────────
export default function TransferCenter() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob  = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const uploadQueue   = useSelector((s) => s.uploadQueue);
  const downloadQueue = useSelector((s) => s.downloadQueue);
  const currentDisplay = useSelector((s) => s.currentDisplay);

  const [open, setOpen] = useState(false);
  const seenCount = useRef(0);

  const T = {
    PANEL_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    DIVIDER:  isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.5)'  : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.35)',
    HVR_BG:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
  };

  const visibleUploads = uploadQueue.filter((e) => e.show !== false);
  const activeCount = visibleUploads.filter((e) => ['uploading', 'paused', 'queued'].includes(uploadState(e))).length
    + downloadQueue.filter((d) => d.status === 'downloading' || d.status === 'paused').length;
  const total = visibleUploads.length + downloadQueue.length;

  // Auto-open on new activity so it's never silently working in the background.
  useEffect(() => {
    if (total > seenCount.current) setOpen(true);
    seenCount.current = total;
  }, [total]);

  if (total === 0) return null;

  const retryUpload = (i) => {
    dispatch(setFileForRetry({ index: i })).then(() => {
      dispatch(uploadFile({ authCtx, axiosGlobal, files: uploadQueue, currentDisplay }));
    });
  };

  const clearFinished = () => {
    dispatch(actions.clearFinishedDownloads());
    // Uploads have no bulk-clear reducer — hide finished/dead rows locally by
    // marking show:false the same way retry already does (re-using the exact
    // mechanism the legacy list relied on).
    uploadQueue.forEach((e, i) => {
      const st = uploadState(e);
      if (st === 'done' || st === 'canceled') dispatch(actions.updateUploadOveralStatus({ index: i, status: e.uploaded }));
    });
  };

  return (
    <Box sx={{ position: 'fixed', bottom: { xs: 76, sm: 20 }, right: { xs: 12, sm: 20 }, zIndex: 1250 }}>
      <Collapse in={open} unmountOnExit>
        <Box sx={{
          width: isMob ? '92vw' : 340, maxWidth: '92vw', maxHeight: '60vh',
          display: 'flex', flexDirection: 'column',
          bgcolor: T.PANEL_BG, border: `1px solid ${T.BD}`, borderRadius: '14px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.35)', overflow: 'hidden', mb: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.75, py: 1.25, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
              Transfers {activeCount > 0 ? `(${activeCount})` : ''}
            </Typography>
            <Tooltip title="Clear finished">
              <IconButton size="small" onClick={clearFinished} sx={{ color: T.TEXT_TER }}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: T.TEXT_SEC }}>
              <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Box sx={{ overflowY: 'auto' }}>
            {visibleUploads.map((e, i) => {
              const st = uploadState(e);
              return (
                <TransferRow key={`up-${i}`} T={T}
                  icon={<CloudUploadIcon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />}
                  name={e.file?.name} sub={st === 'uploading' ? `${e.progress || 0}% · ${fmtBytes(e.file?.size)}` : st}
                  progress={e.progress} state={st}
                  onPause={() => dispatch(actions.pauseTheUploading({ index: i }))}
                  onResume={() => retryUpload(i)}
                  onCancel={() => dispatch(actions.cancelTheUploading({ index: i, uploading: false, cancel: true, uploaded: false }))}
                  onRetry={() => retryUpload(i)}
                  onDismiss={() => dispatch(actions.updateUploadOveralStatus({ index: i, status: e.uploaded }))}
                />
              );
            })}
            {downloadQueue.map((d) => (
              <TransferRow key={d.id} T={T}
                icon={<CloudDownloadIcon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />}
                name={d.label} sub={d.status === 'downloading' ? `${d.progress ?? '…'}${d.progress !== undefined ? '%' : ''} · ${fmtBytes(d.receivedBytes)}` : d.status}
                progress={d.progress} state={d.status === 'downloading' ? 'downloading' : d.status}
                onPause={() => dispatch(actions.cancelDownload({ id: d.id, paused: false }))}
                onResume={() => dispatch(startDownload({ authCtx, axiosGlobal, id: d.id, kind: d.kind, label: d.label }))}
                onCancel={() => dispatch(actions.cancelDownload({ id: d.id, paused: false }))}
                onRetry={() => dispatch(startDownload({ authCtx, axiosGlobal, id: d.id, kind: d.kind, label: d.label }))}
                onDismiss={() => dispatch(actions.removeDownload(d.id))}
              />
            ))}
          </Box>
        </Box>
      </Collapse>

      {/* Floating toggle pill */}
      <Box onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
          bgcolor: T.PANEL_BG, border: `1px solid ${T.BD}`, borderRadius: '999px',
          px: 1.75, py: 1, boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          '&:hover': { bgcolor: T.HVR_BG },
        }}>
        <Badge color="primary" variant="dot" invisible={activeCount === 0}
          sx={{ '& .MuiBadge-dot': { bgcolor: '#64b5f6' } }}>
          {activeCount > 0
            ? <CircularProgress size={16} thickness={5} sx={{ color: T.TEXT_PRI }} />
            : <CheckCircleIcon sx={{ fontSize: 17, color: '#81c784' }} />}
        </Badge>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: T.TEXT_PRI }}>
          {activeCount > 0 ? `${activeCount} transfer${activeCount !== 1 ? 's' : ''}` : 'Transfers complete'}
        </Typography>
        {open ? <KeyboardArrowDownIcon sx={{ fontSize: 16, color: T.TEXT_TER }} /> : <KeyboardArrowUpIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />}
      </Box>
    </Box>
  );
}
