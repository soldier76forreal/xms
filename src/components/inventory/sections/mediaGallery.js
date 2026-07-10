import { useRef, useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ImageIcon from '@mui/icons-material/Image';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useDispatch } from 'react-redux';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { uploadInventoryMedia, deleteInventoryMedia, updateProduct } from '../../../store/store';

// ── single media tile ─────────────────────────────────────────────────────────
function MediaTile({ file, isCover, apiBase, onDelete, onSetCover, deleting }) {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const [preview, setPreview] = useState(false);

  const isImage = file.metaData?.mimetype?.startsWith('image/');
  const isVideo = file.metaData?.mimetype?.startsWith('video/');
  const thumbUrl = file.thumbnail ? `${apiBase}/uploads/${file.thumbnail}` : null;
  const fileUrl  = file.metaData?.filename ? `${apiBase}/uploads/${file.metaData.filename}` : null;

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          width: 120,
          height: 100,
          border: isCover ? '2.5px solid' : '1.5px solid',
          borderColor: isCover ? 'text.primary' : 'divider',
          borderRadius: '10px',
          overflow: 'hidden',
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          cursor: 'pointer',
          flexShrink: 0,
          '&:hover .tile-actions': { opacity: 1 },
        }}
        onClick={() => fileUrl && setPreview(true)}
      >
        {/* Thumbnail / placeholder */}
        {thumbUrl ? (
          <Box
            component="img"
            src={thumbUrl}
            alt={file.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : isVideo && fileUrl ? (
          // No server-side thumbnail (BUG-07: ffprobe missing) — let the browser
          // render the first frame itself: preload="metadata" + #t=0.1 fetches
          // only enough of the file to paint a real preview, no extra package.
          <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: '#000' }}>
            <Box component="video" src={`${fileUrl}#t=0.1`} muted preload="metadata"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <PlayCircleOutlineIcon sx={{
              position: 'absolute', inset: 0, m: 'auto',
              fontSize: 28, color: 'rgba(255,255,255,0.9)',
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.6))',
            }} />
          </Box>
        ) : isVideo ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlayCircleOutlineIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
          </Box>
        )}

        {/* Cover badge */}
        {isCover && (
          <Box
            sx={{
              position: 'absolute', top: 4, left: 4,
              bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '4px',
              px: 0.5, py: 0.125,
            }}
          >
            <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 700 }}>
              COVER
            </Typography>
          </Box>
        )}

        {/* Hover actions */}
        <Box
          className="tile-actions"
          sx={{
            position: 'absolute', inset: 0,
            bgcolor: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
            opacity: 0, transition: 'opacity 0.15s',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isImage && (
            <Tooltip title={isCover ? 'Current cover' : 'Set as cover'}>
              <IconButton size="small" sx={{ color: '#fff', p: 0.5 }} onClick={onSetCover}>
                {isCover ? <StarIcon sx={{ fontSize: 18 }} /> : <StarBorderIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton size="small" sx={{ color: '#ff4d4d', p: 0.5 }} onClick={onDelete} disabled={deleting}>
              {deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Full preview dialog */}
      <Dialog open={preview} onClose={() => setPreview(false)} maxWidth="md">
        <DialogContent sx={{ p: 1 }}>
          {isImage && fileUrl && (
            <Box component="img" src={fileUrl} alt={file.name}
              sx={{ maxWidth: '80vw', maxHeight: '80vh', objectFit: 'contain' }} />
          )}
          {isVideo && fileUrl && (
            <Box component="video" src={fileUrl} controls
              sx={{ maxWidth: '80vw', maxHeight: '80vh' }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── MediaGallery ──────────────────────────────────────────────────────────────
const MediaGallery = ({ productId, coverMediaId, media, loading, onRefresh }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();

  const fileInput  = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const apiBase = axiosGlobal.defaultTargetApi || '';

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const formData = new FormData();
        formData.append('file', f);
        await dispatch(uploadInventoryMedia({
          authCtx, axiosGlobal,
          subjectType: 'product',
          subjectId: productId,
          productId,
          formData,
        })).unwrap();
      }
      onRefresh();
    } catch {
      // snackBar handled inside thunk
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (fileId) => {
    setDeletingId(fileId);
    try {
      await dispatch(deleteInventoryMedia({ authCtx, axiosGlobal, fileId, productId })).unwrap();
      onRefresh();
    } catch {
      // snackBar handled inside thunk
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetCover = async (fileId) => {
    try {
      await dispatch(updateProduct({
        authCtx, axiosGlobal,
        id: productId,
        data: { coverMediaId: fileId },
      })).unwrap();
      onRefresh();
    } catch {
      // error handled in thunk
    }
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
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'text.disabled' }}>
          Media ({media.length})
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={12} /> : <UploadFileIcon sx={{ fontSize: 14 }} />}
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          sx={{ borderRadius: 2, fontSize: '0.72rem' }}
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Box>

      {/* Gallery grid */}
      {loading ? (
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ width: 120, height: 100, borderRadius: '10px', bgcolor: 'action.hover' }} />
          ))}
        </Box>
      ) : media.length === 0 ? (
        <Box
          sx={{
            py: 4, textAlign: 'center', border: '1.5px dashed', borderColor: 'divider',
            borderRadius: '10px', cursor: 'pointer',
          }}
          onClick={() => fileInput.current?.click()}
        >
          <ImageIcon sx={{ color: 'text.disabled', fontSize: 32, mb: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            No media yet — click to upload
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {media.map((file) => (
            <MediaTile
              key={file._id}
              file={file}
              isCover={String(file._id) === String(coverMediaId)}
              apiBase={apiBase}
              onDelete={() => handleDelete(file._id)}
              onSetCover={() => handleSetCover(file._id)}
              deleting={deletingId === file._id}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MediaGallery;
