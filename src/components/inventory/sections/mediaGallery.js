import { useRef, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDispatch } from 'react-redux';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import {
  deleteInventoryMedia, bulkDeleteInventoryMedia,
  bulkDownloadInventoryMediaZip, updateProduct,
} from '../../../store/store';
import { enqueueUpload, onUploadCompleted } from '../../../tools/uploadCenter/uploadManager';
import InventoryGallery from './inventoryGallery';
import SectionTutorials from '../../tutorials/sectionTutorials';

// ── upload dialog — files are handed to the Upload Center and land in the
// background, so this closes right away instead of blocking on the transfer.
function UploadDialog({ open, onClose, productId, onDone }) {
  const { t } = useTranslation();
  const fileInput = useRef(null);

  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!open) return;
    setFiles([]);
  }, [open]);

  const handlePick = (e) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    e.target.value = '';
  };
  const removePending = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (!files.length) return;
    files.forEach((file) => {
      enqueueUpload({ purpose: 'inventoryProductMedia', targetId: productId, file, sectionLabel: t('nav.inventory') });
    });
    onDone();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700, fontSize: '1rem' }}>
        {t('inventory.uploadBatchTitle')}
      </DialogTitle>
      <DialogContent sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 2, pt: '4px !important' }}>
        <Box
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = Array.from(e.dataTransfer.files || []);
            if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
          }}
          sx={{
            py: 3, textAlign: 'center', border: '1.5px dashed', borderColor: 'divider',
            borderRadius: '10px', cursor: 'pointer',
          }}
        >
          <UploadFileIcon sx={{ color: 'text.disabled', fontSize: 28, mb: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {t('inventory.dropFilesHint')}
          </Typography>
        </Box>
        <input ref={fileInput} type="file" multiple accept="image/*,video/*"
          style={{ display: 'none' }} onChange={handlePick} />

        {files.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 150, overflowY: 'auto' }}>
            {files.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" noWrap sx={{ flex: 1 }}>{f.name}</Typography>
                <IconButton size="small" onClick={() => removePending(i)}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} size="small">{t('common.cancel')}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={!files.length}
        >
          {t('inventory.upload')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── MediaGallery — product-level, accumulating gallery ─────────────────────────
const MediaGallery = ({ productId, coverMediaId, media, loading, onRefresh }) => {
  const { t } = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();

  const [uploadOpen, setUploadOpen] = useState(false);

  // Each file lands independently via the Upload Center — refresh as each
  // one completes for THIS product.
  useEffect(() => onUploadCompleted(({ purpose, targetId }) => {
    if (purpose === 'inventoryProductMedia' && String(targetId) === String(productId)) onRefresh();
  }), [productId, onRefresh]);

  const handleSetCover = async (fileId) => {
    try {
      await dispatch(updateProduct({ authCtx, axiosGlobal, id: productId, data: { coverMediaId: fileId } })).unwrap();
      onRefresh();
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
    onRefresh();
  };

  const handleBulkZip = async (fileIds) => {
    await dispatch(bulkDownloadInventoryMediaZip({ authCtx, axiosGlobal, fileIds })).unwrap();
  };

  return (
    <Box
      sx={{
        border: '1.5px solid',
        borderColor: 'divider',
        borderRadius: '14px',
        bgcolor: 'background.paper',
        p: 2.5,
        mb: 3,
      }}
    >
      <InventoryGallery
        files={media}
        loading={loading}
        coverMediaId={coverMediaId}
        onSetCover={handleSetCover}
        onDeleteSelected={handleDeleteSelected}
        onBulkZip={handleBulkZip}
        emptyHint={t('inventory.noMediaYet')}
        onEmptyClick={() => setUploadOpen(true)}
        extraHeaderAction={
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadFileIcon sx={{ fontSize: 14 }} />}
              onClick={() => setUploadOpen(true)}
              sx={{ borderRadius: 2, fontSize: '0.72rem' }}
            >
              {t('inventory.upload')}
            </Button>
            <SectionTutorials section="inventory" tag="inventory:media:edit" />
          </>
        }
      />

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} productId={productId} onDone={onRefresh} />
    </Box>
  );
};

export default MediaGallery;
