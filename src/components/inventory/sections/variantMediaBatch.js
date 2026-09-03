import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from 'react-redux';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import {
  uploadVariantMediaBatch, downloadVariantMediaBatchZip,
  deleteInventoryMedia, bulkDeleteInventoryMedia, bulkDownloadInventoryMediaZip, updateProduct,
} from '../../../store/store';
import InventoryGallery from './inventoryGallery';

function pad(n) { return String(n).padStart(2, '0'); }
function toDateInputValue(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

// ── upload / replace dialog — unchanged, already has real progress ────────────
function UploadBatchDialog({ open, onClose, variantId, productId, isReplace, onDone }) {
  const { t } = useTranslation();
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
        {isReplace ? t('inventory.deleteReplaceBatchTitle') : t('inventory.uploadBatchTitle')}
      </DialogTitle>
      <DialogContent sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 2, pt: '4px !important' }}>
        {isReplace && (
          <Typography variant="caption" sx={{ color: 'warning.main' }}>
            {t('inventory.replaceBatchWarning')}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField label={t('inventory.uploadDateLabel')} type="date" size="small" fullWidth
            InputLabelProps={{ shrink: true }} disabled={busy}
            value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} />
          <TextField label={t('inventory.expirationDateLabel')} type="date" size="small" fullWidth
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
            {t('inventory.dropFilesHint')}
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
              {t('inventory.uploadingProgress', { percent: progress })}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} size="small" disabled={busy}>{t('common.cancel')}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          color={isReplace ? 'error' : 'primary'}
          disabled={busy || !files.length}
          startIcon={busy ? <CircularProgress size={12} color="inherit" /> : null}
        >
          {isReplace ? t('inventory.deleteReplace') : t('inventory.upload')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── VariantMediaBatch ──────────────────────────────────────────────────────────
const VariantMediaBatch = ({ variantId, productId, variantCode }) => {
  const { t } = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const apiBase     = axiosGlobal.defaultTargetApi || '';
  // The product this variant belongs to is already loaded (variant detail is
  // only ever opened from within a product's page) — read it directly rather
  // than prop-drilling coverMediaId through variantDetail.js.
  const coverMediaId = useSelector((s) => s.invCurrentProduct?.coverMediaId);

  const [batch,       setBatch]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [formOpen,    setFormOpen]    = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const fetchBatch = useCallback(async (silent = false) => {
    if (!variantId) return;
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  useEffect(() => { fetchBatch(); }, [fetchBatch]);

  // While any video in the batch is still being converted server-side, quietly
  // re-poll until none are pending, so the "Processing…" chip clears itself.
  useEffect(() => {
    if (!batch.some((f) => f.transcodeStatus === 'pending')) return;
    const timer = setTimeout(() => fetchBatch(true), 4000);
    return () => clearTimeout(timer);
  }, [batch, fetchBatch]);

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

  // Any image in this variant's batch can be pinned as the PRODUCT cover —
  // covers aren't a per-variant concept, they belong to the parent product.
  const handleSetCover = async (fileId) => {
    try {
      await dispatch(updateProduct({ authCtx, axiosGlobal, id: productId, data: { coverMediaId: fileId } })).unwrap();
      fetchBatch();
    } catch {
      // error handled in thunk
    }
  };

  const handleDeleteSelected = async (fileIds) => {
    if (fileIds.length === 1) {
      await dispatch(deleteInventoryMedia({ authCtx, axiosGlobal, fileId: fileIds[0], productId })).unwrap();
    } else {
      await dispatch(bulkDeleteInventoryMedia({ authCtx, axiosGlobal, fileIds, productId })).unwrap();
    }
    fetchBatch();
  };

  const handleBulkZip = async (fileIds) => {
    await dispatch(bulkDownloadInventoryMediaZip({ authCtx, axiosGlobal, fileIds })).unwrap();
  };

  return (
    <Box sx={{
      border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
      bgcolor: 'background.paper', p: 2.5, mt: 2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1.5, gap: 1 }}>
        {batch.length > 0 && (
          <Button
            size="small" variant="outlined"
            startIcon={downloadingAll ? <CircularProgress size={12} /> : <DownloadIcon sx={{ fontSize: 14 }} />}
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            sx={{ borderRadius: 2, fontSize: '0.72rem' }}
          >
            {t('inventory.downloadAll')}
          </Button>
        )}
        <Button
          size="small" variant="outlined"
          color={batch.length ? 'error' : 'primary'}
          startIcon={<UploadFileIcon sx={{ fontSize: 14 }} />}
          onClick={() => setFormOpen(true)}
          sx={{ borderRadius: 2, fontSize: '0.72rem' }}
        >
          {batch.length ? t('inventory.deleteReplace') : t('inventory.uploadBatch')}
        </Button>
      </Box>

      {meta && (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('inventory.uploadedOn', { date: new Date(meta.uploadDate).toLocaleDateString() })}
          </Typography>
          {meta.expirationDate && (
            <Typography variant="caption" sx={{ color: isExpired ? 'error.main' : 'text.secondary', fontWeight: isExpired ? 700 : 400 }}>
              {isExpired
                ? t('inventory.expiredOn', { date: new Date(meta.expirationDate).toLocaleDateString() })
                : t('inventory.expiresOn', { date: new Date(meta.expirationDate).toLocaleDateString() })}
            </Typography>
          )}
          {meta.uploadedByName && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('inventory.byUploader', { name: meta.uploadedByName })}
            </Typography>
          )}
        </Box>
      )}

      <InventoryGallery
        files={batch}
        loading={loading}
        coverMediaId={coverMediaId}
        onSetCover={handleSetCover}
        onDeleteSelected={handleDeleteSelected}
        onBulkZip={handleBulkZip}
        emptyHint={t('inventory.noMediaBatchYet')}
        onEmptyClick={() => setFormOpen(true)}
      />

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
