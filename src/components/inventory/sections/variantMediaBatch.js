import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch } from 'react-redux';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { uploadVariantMediaBatch, downloadInventoryMediaFile, downloadVariantMediaBatchZip } from '../../../store/store';

function pad(n) { return String(n).padStart(2, '0'); }
function toDateInputValue(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function fileDisplayName(file) { return file.format ? `${file.name}.${file.format}` : file.name; }

// ── single batch tile (image full-size / video full-size player) ──────────────
function BatchTile({ file, apiBase }) {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const authCtx  = useContext(AuthContext);
  const [preview, setPreview]   = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isImage  = file.metaData?.mimetype?.startsWith('image/');
  const isVideo  = file.metaData?.mimetype?.startsWith('video/');
  const thumbUrl = file.thumbnail ? `${apiBase}/uploads/${file.thumbnail}` : null;
  const fileUrl  = file.metaData?.filename ? `${apiBase}/uploads/${file.metaData.filename}` : null;
  const displayName = fileDisplayName(file);

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!fileUrl) return;
    setDownloading(true);
    try {
      await dispatch(downloadInventoryMediaFile({ authCtx, fileUrl, fileName: displayName })).unwrap();
    } catch {
      // snackBar handled inside thunk
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Box sx={{ width: 120, flexShrink: 0 }}>
        <Box
          onClick={() => fileUrl && setPreview(true)}
          sx={{
            position: 'relative', width: 120, height: 100,
            border: '1.5px solid', borderColor: 'divider', borderRadius: '10px',
            overflow: 'hidden', cursor: fileUrl ? 'pointer' : 'default',
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            '&:hover .tile-actions': { opacity: 1 },
          }}
        >
          {thumbUrl ? (
            <Box component="img" src={thumbUrl} alt={displayName}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isVideo
                ? <PlayCircleOutlineIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                : <ImageIcon sx={{ fontSize: 32, color: 'text.disabled' }} />}
            </Box>
          )}
          {isVideo && thumbUrl && (
            <Box sx={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.25)',
            }}>
              <PlayCircleOutlineIcon sx={{ fontSize: 30, color: '#fff' }} />
            </Box>
          )}

          {/* hover download action */}
          <Box
            className="tile-actions"
            sx={{
              position: 'absolute', top: 4, right: 4, opacity: 0, transition: 'opacity 0.15s',
            }}
          >
            <Tooltip title="Download">
              <IconButton size="small" onClick={handleDownload} disabled={downloading}
                sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', p: 0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' } }}>
                {downloading ? <CircularProgress size={12} color="inherit" /> : <DownloadIcon sx={{ fontSize: 14 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* filename caption — identifies the file without needing to click it */}
        <Tooltip title={displayName}>
          <Typography variant="caption" noWrap
            sx={{ display: 'block', mt: 0.5, fontSize: '0.66rem', color: 'text.secondary', textAlign: 'center' }}>
            {displayName}
          </Typography>
        </Tooltip>
      </Box>

      <Dialog open={preview} onClose={() => setPreview(false)} maxWidth="md">
        <DialogContent sx={{ p: 1 }}>
          {isImage && fileUrl && (
            <Box component="img" src={fileUrl} alt={displayName}
              sx={{ maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain', display: 'block' }} />
          )}
          {isVideo && fileUrl && (
            <Box component="video" src={fileUrl} controls autoPlay
              sx={{ maxWidth: '85vw', maxHeight: '85vh', display: 'block' }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── upload / replace dialog ────────────────────────────────────────────────────
function UploadBatchDialog({ open, onClose, variantId, productId, isReplace, onDone }) {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const fileInput   = useRef(null);

  const [files,          setFiles]          = useState([]);
  const [uploadDate,     setUploadDate]     = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [busy,           setBusy]           = useState(false);
  const [progress,       setProgress]       = useState(0);

  useEffect(() => {
    if (!open) return;
    const now        = new Date();
    const weekLater   = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setUploadDate(toDateInputValue(now));
    setExpirationDate(toDateInputValue(weekLater));
    setFiles([]);
    setProgress(0);
  }, [open]);

  const handlePick = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    e.target.value = '';
  };
  const removePending = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!files.length) return;
    setBusy(true);
    setProgress(0);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      formData.append('uploadDate', uploadDate);
      formData.append('expirationDate', expirationDate);
      await dispatch(uploadVariantMediaBatch({
        authCtx, axiosGlobal, variantId, productId, formData,
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      })).unwrap();
      onDone();
      onClose();
    } catch {
      // snackBar handled inside thunk
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700, fontSize: '1rem' }}>
        {isReplace ? 'Delete & replace media batch' : 'Upload media batch'}
      </DialogTitle>
      <DialogContent sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 2, pt: '4px !important' }}>
        {isReplace && (
          <Typography variant="caption" sx={{ color: 'warning.main' }}>
            This removes the current batch — all existing images/videos for this variant will be replaced.
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField label="Upload date" type="date" size="small" fullWidth
            InputLabelProps={{ shrink: true }} disabled={busy}
            value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} />
          <TextField label="Expiration date" type="date" size="small" fullWidth
            InputLabelProps={{ shrink: true }} disabled={busy}
            value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
        </Box>

        <Box
          onClick={() => !busy && fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (busy) return;
            const dropped = Array.from(e.dataTransfer.files || []);
            if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
          }}
          sx={{
            py: 3, textAlign: 'center', border: '1.5px dashed', borderColor: 'divider',
            borderRadius: '10px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
          }}
        >
          <UploadFileIcon sx={{ color: 'text.disabled', fontSize: 28, mb: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Drop images/videos here or click to select
          </Typography>
        </Box>
        <input ref={fileInput} type="file" multiple accept="image/*,video/*"
          style={{ display: 'none' }} onChange={handlePick} disabled={busy} />

        {files.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 150, overflowY: 'auto' }}>
            {files.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" noWrap sx={{ flex: 1 }}>{f.name}</Typography>
                <IconButton size="small" onClick={() => removePending(i)} disabled={busy}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {busy && (
          <Box>
            <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4, height: 6 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, textAlign: 'right' }}>
              Uploading… {progress}%
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} size="small" disabled={busy}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          color={isReplace ? 'error' : 'primary'}
          disabled={busy || !files.length}
          startIcon={busy ? <CircularProgress size={12} color="inherit" /> : null}
        >
          {isReplace ? 'Delete & Replace' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── VariantMediaBatch ──────────────────────────────────────────────────────────
const VariantMediaBatch = ({ variantId, productId, variantCode }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const apiBase     = axiosGlobal.defaultTargetApi || '';

  const [batch,       setBatch]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [formOpen,    setFormOpen]    = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const fetchBatch = useCallback(async () => {
    if (!variantId) return;
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${apiBase}/inventory/media`,
        params: { attachedToType: 'inventoryVariant', attachedToId: variantId },
      });
      setBatch(res.data.data || []);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  useEffect(() => { fetchBatch(); }, [fetchBatch]);

  const meta = batch[0];
  const isExpired = meta?.expirationDate && new Date(meta.expirationDate) < new Date();

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      await dispatch(downloadVariantMediaBatchZip({ authCtx, axiosGlobal, variantId, variantCode })).unwrap();
    } catch {
      // snackBar handled inside thunk
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <Box sx={{
      border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
      bgcolor: 'background.paper', p: 2.5, mt: 2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'text.disabled' }}>
          Media batch{batch.length ? ` (${batch.length})` : ''}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {batch.length > 0 && (
            <Button
              size="small" variant="outlined"
              startIcon={downloadingAll ? <CircularProgress size={12} /> : <DownloadIcon sx={{ fontSize: 14 }} />}
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              sx={{ borderRadius: 2, fontSize: '0.72rem' }}
            >
              Download all
            </Button>
          )}
          <Button
            size="small" variant="outlined"
            color={batch.length ? 'error' : 'primary'}
            startIcon={<UploadFileIcon sx={{ fontSize: 14 }} />}
            onClick={() => setFormOpen(true)}
            sx={{ borderRadius: 2, fontSize: '0.72rem' }}
          >
            {batch.length ? 'Delete & Replace' : 'Upload batch'}
          </Button>
        </Box>
      </Box>

      {meta && (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Uploaded {new Date(meta.uploadDate).toLocaleDateString()}
          </Typography>
          {meta.expirationDate && (
            <Typography variant="caption" sx={{ color: isExpired ? 'error.main' : 'text.secondary', fontWeight: isExpired ? 700 : 400 }}>
              {isExpired ? 'Expired' : 'Expires'} {new Date(meta.expirationDate).toLocaleDateString()}
            </Typography>
          )}
          {meta.uploadedByName && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              By {meta.uploadedByName}
            </Typography>
          )}
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ width: 120, height: 100, borderRadius: '10px', bgcolor: 'action.hover' }} />
          ))}
        </Box>
      ) : batch.length === 0 ? (
        <Box
          onClick={() => setFormOpen(true)}
          sx={{
            py: 4, textAlign: 'center', border: '1.5px dashed', borderColor: 'divider',
            borderRadius: '10px', cursor: 'pointer',
          }}
        >
          <ImageIcon sx={{ color: 'text.disabled', fontSize: 32, mb: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            No media batch yet — click to upload
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {batch.map((file) => (
            <BatchTile key={file._id} file={file} apiBase={apiBase} />
          ))}
        </Box>
      )}

      <UploadBatchDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        variantId={variantId}
        productId={productId}
        isReplace={batch.length > 0}
        onDone={fetchBatch}
      />
    </Box>
  );
};

export default VariantMediaBatch;
