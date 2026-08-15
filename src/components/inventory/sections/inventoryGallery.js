import { useState, useContext, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageIcon from '@mui/icons-material/Image';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useDispatch } from 'react-redux';
import { actions } from '../../../store/store';
import ConfirmDialog from '../../../tools/modal/confirmDialog';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { downloadFile } from '../../digitalMarketing/mediaViewer';

// ── format resolution — thumbnail -> converted web preview (HEIC->JPEG /
// HEVC->H.264) -> original. Never shows a broken-image icon for a format the
// browser can't natively decode once its conversion has landed. See
// api/utils/mediaConvert.js for how webPreview/videoPreview get generated.
function resolveKind(file) {
  const mime = file.metaData?.mimetype || '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'other';
}
function resolveThumbUrl(file, apiBase) {
  if (file.thumbnail) return `${apiBase}/uploads/${file.thumbnail}`;
  if (resolveKind(file) === 'image' && file.webPreview) return `${apiBase}/uploads/${file.webPreview}`;
  return null;
}
function resolveFullUrl(file, apiBase) {
  const kind = resolveKind(file);
  if (kind === 'video' && file.videoPreview) return `${apiBase}/uploads/${file.videoPreview}`;
  if (kind === 'image' && file.webPreview) return `${apiBase}/uploads/${file.webPreview}`;
  return file.metaData?.filename ? `${apiBase}/uploads/${file.metaData.filename}` : null;
}
function displayName(file) {
  return file.format ? `${file.name}.${file.format}` : file.name;
}

// ── per-item overflow menu (Download / Pin as cover / Delete) ─────────────────
function ItemMenu({ file, isCover, canSetCover, onDownload, onSetCover, onDelete, anchorEl, onClose }) {
  const { t } = useTranslation();
  const kind = resolveKind(file);
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <MenuItem onClick={() => { onClose(); onDownload(); }}>
        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
        <ListItemText>{t('inventory.downloadButton')}</ListItemText>
      </MenuItem>
      {canSetCover && kind === 'image' && (
        <MenuItem onClick={() => { onClose(); onSetCover(); }} disabled={isCover}>
          <ListItemIcon>{isCover ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}</ListItemIcon>
          <ListItemText>{isCover ? t('inventory.currentCover') : t('inventory.pinAsCover')}</ListItemText>
        </MenuItem>
      )}
      <MenuItem onClick={() => { onClose(); onDelete(); }} sx={{ color: '#EA005A' }}>
        <ListItemIcon><DeleteOutlineIcon fontSize="small" sx={{ color: '#EA005A' }} /></ListItemIcon>
        <ListItemText>{t('common.delete')}</ListItemText>
      </MenuItem>
    </Menu>
  );
}

// ── one grid tile ──────────────────────────────────────────────────────────────
function GalleryTile({
  file, isCover, canSetCover, apiBase, selected, selectMode,
  onToggleSelect, onOpen, onDownload, onSetCover, onDeleteOne,
}) {
  const { t } = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [menuAnchor, setMenuAnchor] = useState(null);

  const kind = resolveKind(file);
  const thumbUrl = resolveThumbUrl(file, apiBase);
  const isPending = file.transcodeStatus === 'pending';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box
        onClick={() => (selectMode ? onToggleSelect() : onOpen())}
        sx={{
          position: 'relative', width: '100%', aspectRatio: '1 / 1',
          border: isCover ? '2.5px solid' : '1.5px solid',
          borderColor: selected ? 'primary.main' : (isCover ? 'text.primary' : 'divider'),
          borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        }}
      >
        {thumbUrl ? (
          <Box component="img" src={thumbUrl} alt={file.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : kind === 'video' ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlayCircleOutlineIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
          </Box>
        )}

        {kind === 'video' && (
          <PlayCircleOutlineIcon sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            fontSize: 30, color: '#fff', filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.6))',
          }} />
        )}

        {isPending && (
          <Chip label={t('inventory.processingVideo')} size="small" sx={{
            position: 'absolute', bottom: 4, left: 4, height: 18, fontSize: '0.58rem',
            bgcolor: 'rgba(0,0,0,0.65)', color: '#fff',
          }} />
        )}

        {isCover && (
          <Box sx={{ position: 'absolute', top: 4, left: 4, bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '4px', px: 0.5, py: 0.125 }}>
            <Typography sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 700 }}>{t('inventory.coverBadge')}</Typography>
          </Box>
        )}

        {/* selection checkbox — always present so it works identically on
            touch and mouse (no hover/long-press gesture to get wrong) */}
        <Checkbox
          checked={selected}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          icon={<Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.85)', bgcolor: 'rgba(0,0,0,0.25)' }} />}
          checkedIcon={<CheckCircleIcon sx={{ color: 'primary.main', bgcolor: '#fff', borderRadius: '50%', fontSize: 20 }} />}
          sx={{ position: 'absolute', top: 2, right: 2, p: 0.5 }}
        />

        {/* per-item overflow menu — wrapped in its own stopPropagation box
            because MUI's Menu renders its popup (including the backdrop you
            click to dismiss it) through a React Portal. Portal content still
            bubbles synthetic events up through its REACT ancestors (not its
            DOM ancestors) — without this wrapper, dismissing the menu (or
            picking an item) also bubbles up to the tile's own onClick and
            opens the viewer, which is exactly the "menu dismiss opens the
            photo/video" bug this fixes. */}
        <Box onClick={(e) => e.stopPropagation()}
          sx={{ position: 'absolute', bottom: 2, right: 2 }}>
          <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', p: 0.4,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' } }}>
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <ItemMenu file={file} isCover={isCover} canSetCover={canSetCover}
            anchorEl={menuAnchor} onClose={() => setMenuAnchor(null)}
            onDownload={onDownload} onSetCover={onSetCover} onDelete={onDeleteOne} />
        </Box>
      </Box>
      <Tooltip title={displayName(file)}>
        <Typography noWrap sx={{ fontSize: '0.66rem', color: 'text.secondary', textAlign: 'center' }}>
          {displayName(file)}
        </Typography>
      </Tooltip>
    </Box>
  );
}

// ── fullscreen single-item viewer, swipeable prev/next ────────────────────────
function ItemViewer({ files, index, apiBase, onClose, onIndexChange }) {
  const { t } = useTranslation();
  const [touchStartX, setTouchStartX] = useState(null);

  const file = files[index];

  const goPrev = useCallback(() => { if (index > 0) onIndexChange(index - 1); }, [index, onIndexChange]);
  const goNext = useCallback(() => { if (index < files.length - 1) onIndexChange(index + 1); }, [index, files.length, onIndexChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, onClose]);

  if (!file) return null;
  const kind = resolveKind(file);
  const url = resolveFullUrl(file, apiBase);

  return (
    <Dialog open fullScreen onClose={onClose}
      PaperProps={{ sx: { bgcolor: '#000' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX;
          if (dx > 60) goPrev();
          else if (dx < -60) goNext();
          setTouchStartX(null);
        }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, flexShrink: 0 }}>
          <Typography noWrap sx={{ color: '#fff', fontSize: '0.85rem', flexGrow: 1, mr: 2 }}>
            {displayName(file)} · {index + 1}/{files.length}
          </Typography>
          <IconButton onClick={() => url && downloadFile(url, displayName(file))} sx={{ color: '#fff' }}>
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0 }}>
          {index > 0 && (
            <IconButton onClick={goPrev} sx={{ position: 'absolute', left: 8, color: '#fff', display: { xs: 'none', sm: 'flex' } }}>
              <ChevronLeftIcon sx={{ fontSize: 36 }} />
            </IconButton>
          )}
          {kind === 'image' && url && (
            <Box component="img" src={url} alt={file.name}
              sx={{ maxWidth: '92vw', maxHeight: '85vh', objectFit: 'contain' }} />
          )}
          {kind === 'video' && url && (
            <Box component="video" src={url} controls autoPlay
              sx={{ maxWidth: '92vw', maxHeight: '85vh' }} />
          )}
          {kind === 'other' && (
            <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>{t('common.noInlinePreview')}</Typography>
          )}
          {index < files.length - 1 && (
            <IconButton onClick={goNext} sx={{ position: 'absolute', right: 8, color: '#fff', display: { xs: 'none', sm: 'flex' } }}>
              <ChevronRightIcon sx={{ fontSize: 36 }} />
            </IconButton>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

// ── the grid + header + bulk toolbar (reused for both inline and fullscreen) ──
function GalleryBody({
  files, coverMediaId, canSetCover, apiBase, loading, emptyHint, onEmptyClick,
  selectMode, setSelectMode, selectedIds, setSelectedIds,
  onOpenViewer, onSetCover, onDeleteOne, onBulkDelete, onBulkZip, dispatch,
}) {
  const { t } = useTranslation();

  const toggleSelect = (id) => setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleDownloadOne = (file) => {
    const url = resolveFullUrl(file, apiBase);
    if (url) downloadFile(url, displayName(file));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 1.5 }}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ aspectRatio: '1 / 1', borderRadius: '12px', bgcolor: 'action.hover' }} />
        ))}
      </Box>
    );
  }

  if (files.length === 0) {
    return (
      <Box onClick={onEmptyClick} sx={{
        py: 4, textAlign: 'center', border: '1.5px dashed', borderColor: 'divider',
        borderRadius: '10px', cursor: onEmptyClick ? 'pointer' : 'default',
      }}>
        <ImageIcon sx={{ color: 'text.disabled', fontSize: 32, mb: 0.5 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{emptyHint}</Typography>
      </Box>
    );
  }

  return (
    <>
      {selectedIds.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1, borderRadius: '8px', bgcolor: 'action.selected' }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, flexGrow: 1 }}>
            {t('inventory.itemsSelected', { count: selectedIds.length })}
          </Typography>
          <Button size="small" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} onClick={() => onBulkZip(selectedIds)}>
            {t('inventory.bulkDownload')}
          </Button>
          <Button size="small" color="error" startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />} onClick={() => onBulkDelete(selectedIds)}>
            {t('inventory.bulkDelete')}
          </Button>
          <Button size="small" onClick={() => { setSelectedIds([]); setSelectMode(false); }}>
            {t('inventory.cancelSelection')}
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 1.5 }}>
        {files.map((file, i) => (
          <GalleryTile
            key={file._id}
            file={file}
            isCover={canSetCover && String(file._id) === String(coverMediaId)}
            canSetCover={canSetCover}
            apiBase={apiBase}
            selected={selectedIds.includes(file._id)}
            selectMode={selectMode || selectedIds.length > 0}
            onToggleSelect={() => toggleSelect(file._id)}
            onOpen={() => onOpenViewer(i)}
            onDownload={() => handleDownloadOne(file)}
            onSetCover={() => onSetCover(file._id)}
            onDeleteOne={() => onBulkDelete([file._id])}
          />
        ))}
      </Box>
    </>
  );
}

// ── InventoryGallery — the shared mobile-style gallery ─────────────────────────
// Used by both product-level media (mediaGallery.js) and variant-level media
// batches (variantMediaBatch.js). Pin-as-cover is available from either
// context (any image can become the product's cover) — pass coverMediaId +
// onSetCover to enable it, omit both to hide the action entirely.
const InventoryGallery = ({
  files = [], loading = false, coverMediaId = null, onSetCover = null,
  onDeleteSelected, onBulkZip: onBulkZipProp, emptyHint, onEmptyClick,
  extraHeaderAction = null,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const axiosGlobal = useContext(AxiosGlobal);
  const apiBase = axiosGlobal.defaultTargetApi || '';
  const canSetCover = typeof onSetCover === 'function';

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [fullscreenSection, setFullscreenSection] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Reset selection if the underlying file list changes shape (e.g. after a
  // delete/upload refresh) so stale ids never linger in the selection.
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => files.some((f) => f._id === id)));
  }, [files]);

  const handleBulkDelete = (ids) => setConfirmDeleteIds(ids);

  const confirmDelete = async () => {
    const ids = confirmDeleteIds;
    setConfirmDeleteIds(null);
    if (!ids || !ids.length) return;
    setBulkBusy(true);
    try {
      await onDeleteSelected(ids);
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } catch (_) {
      dispatch(actions.setShowSnackBar({ status: true, msg: t('inventory.bulkActionFailed'), type: 'error' }));
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkZip = async (ids) => {
    if (!onBulkZipProp) return;
    setBulkBusy(true);
    try {
      await onBulkZipProp(ids);
    } finally {
      setBulkBusy(false);
    }
  };

  const bodyProps = {
    files, coverMediaId, canSetCover, apiBase, loading, emptyHint, onEmptyClick,
    selectMode, setSelectMode, selectedIds, setSelectedIds,
    onOpenViewer: setViewerIndex,
    onSetCover, onDeleteOne: handleBulkDelete,
    onBulkDelete: handleBulkDelete, onBulkZip: handleBulkZip, dispatch,
  };

  return (
    <Box>
      <ConfirmDialog
        open={!!confirmDeleteIds}
        onClose={() => setConfirmDeleteIds(null)}
        onConfirm={confirmDelete}
        title={confirmDeleteIds?.length > 1 ? t('inventory.deleteMultipleTitle', { count: confirmDeleteIds.length }) : t('inventory.deleteOneTitle')}
        message={t('inventory.deleteMediaMessage')}
        confirmLabel={t('common.delete')}
        destructive
      />

      {/* header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'text.disabled', flexGrow: 1 }}>
          {t('inventory.mediaCount', { count: files.length })}
        </Typography>
        {bulkBusy && <CircularProgress size={14} />}
        {extraHeaderAction}
        {files.length > 0 && (
          <Button size="small" onClick={() => { setSelectMode((v) => !v); if (selectMode) setSelectedIds([]); }}
            sx={{ fontSize: '0.7rem', textTransform: 'none' }}>
            {selectMode ? t('common.cancel') : t('inventory.selectItems')}
          </Button>
        )}
        <Tooltip title={t('inventory.fullscreenGallery')}>
          <IconButton size="small" onClick={() => setFullscreenSection(true)}>
            <FullscreenIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <GalleryBody {...bodyProps} />

      {viewerIndex !== null && (
        <ItemViewer files={files} index={viewerIndex} apiBase={apiBase}
          onClose={() => setViewerIndex(null)} onIndexChange={setViewerIndex} />
      )}

      {/* fullscreen SECTION mode — the whole gallery, larger, full-viewport */}
      <Dialog open={fullscreenSection} fullScreen onClose={() => setFullscreenSection(false)}>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', flexGrow: 1 }}>
              {t('inventory.mediaCount', { count: files.length })}
            </Typography>
            {extraHeaderAction}
            {files.length > 0 && (
              <Button size="small" onClick={() => { setSelectMode((v) => !v); if (selectMode) setSelectedIds([]); }}
                sx={{ fontSize: '0.72rem', textTransform: 'none' }}>
                {selectMode ? t('common.cancel') : t('inventory.selectItems')}
              </Button>
            )}
            <IconButton onClick={() => setFullscreenSection(false)}>
              <FullscreenExitIcon />
            </IconButton>
          </Box>
          <GalleryBody {...bodyProps} />
        </Box>
      </Dialog>
    </Box>
  );
};

export default InventoryGallery;
