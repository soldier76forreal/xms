import { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MovieIcon from '@mui/icons-material/Movie';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchReadyToUpload, updateReadyToUpload, deleteReadyToUpload } from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import MediaViewer, { resolveMediaKind } from './mediaViewer';

export default function ReadyToUploadDetail({ id, onClose, onDeleted }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const doc = useSelector(s => s.dmSelectedReadyToUpload);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    INPUT_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  };

  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState('');
  const [captionDirty, setCaptionDirty] = useState(false);
  const [confirmRemoveFile, setConfirmRemoveFile] = useState(null);
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState(false);
  const [viewerMedia, setViewerMedia] = useState(null);
  const [addProgress, setAddProgress] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    await dispatch(fetchReadyToUpload({ authCtx, axiosGlobal, id }));
    setLoading(false);
  }, [id, authCtx, axiosGlobal, dispatch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (doc && String(doc._id) === String(id)) { setCaption(doc.caption || ''); setCaptionDirty(false); } }, [doc, id]);

  const saveCaption = async () => {
    if (!captionDirty) return;
    const fd = new FormData();
    fd.append('caption', caption);
    await dispatch(updateReadyToUpload({ authCtx, axiosGlobal, id, formData: fd }));
    setCaptionDirty(false);
  };

  const removeFile = async (fileId) => {
    const fd = new FormData();
    fd.append('removeFileIds', JSON.stringify([fileId]));
    await dispatch(updateReadyToUpload({ authCtx, axiosGlobal, id, formData: fd }));
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    setAddProgress(0);
    await dispatch(updateReadyToUpload({
      authCtx, axiosGlobal, id, formData: fd,
      onProgress: (e) => setAddProgress(e.total ? Math.round((100 * e.loaded) / e.total) : null),
    }));
    setAddProgress(null);
  };

  const handleDelete = async () => {
    await dispatch(deleteReadyToUpload({ authCtx, axiosGlobal, id }));
    onDeleted && onDeleted();
  };

  // In-app viewer — never window.open.
  const viewFile = (diskName, name, kindHint) => {
    if (!diskName) return;
    setViewerMedia({
      url: `${axiosGlobal.defaultTargetApi}/uploads/${diskName}`,
      name: name || diskName,
      kind: kindHint || resolveMediaKind(name || diskName),
    });
  };

  if (loading || !doc || String(doc._id) !== String(id)) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: '10px' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ px: 3, pt: 2, pb: 1.5, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: T.TEXT_PRI }}>
            {doc.files?.length || 0} file{doc.files?.length !== 1 ? 's' : ''} ready
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton size="small" onClick={onClose} sx={{ color: T.TEXT_TER }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, mt: 0.25 }}>
          {doc.language || '—'} · {doc.platform || '—'}
          {doc.createdByName ? ` · by ${doc.createdByName}` : ''}
        </Typography>

        {doc.rawContent && (
          <Box sx={{ mt: 1, p: 1, borderRadius: '8px', bgcolor: T.CTRL_BG }}>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              From raw content batch
            </Typography>
            <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_SEC, mt: 0.25 }}>
              {doc.rawContent.language} · {doc.rawContent.useCase} · {doc.rawContent.platform}
            </Typography>
          </Box>
        )}

        {can('digitalMarketing:readyToUpload:delete') && (
          <Button size="small" startIcon={<DeleteOutlineIcon sx={{ fontSize: 13 }} />} onClick={() => setConfirmDeleteRecord(true)}
            sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#EA005A', mt: 1, px: 0 }}>
            Delete record
          </Button>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          color: T.TEXT_TER, mb: 1 }}>
          Files
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
          {(doc.files || []).map((f) => (
            <Box key={f.fileId} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.1,
              borderRadius: '10px', bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
              {(f.mimetype || '').startsWith('video/')
                ? <MovieIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />
                : <InsertDriveFileIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />}
              <Typography onClick={() => viewFile(f.diskName, f.name)} noWrap
                sx={{ fontSize: '0.78rem', color: T.TEXT_PRI, flexGrow: 1, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}>
                <OpenInNewIcon sx={{ fontSize: 12, flexShrink: 0 }} /> {f.name || 'Preview file'}
              </Typography>
              {can('digitalMarketing:readyToUpload:edit') && (
                <Tooltip title="Remove">
                  <IconButton size="small" onClick={() => setConfirmRemoveFile(f.fileId)} sx={{ color: '#EA005A', width: 24, height: 24 }}>
                    <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}
        </Box>

        {can('digitalMarketing:readyToUpload:edit') && (
          <Box sx={{ mb: 2 }}>
            <Button component="label" size="small" startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 14 }} />}
              disabled={addProgress !== null}
              sx={{ fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC }}>
              Add files
              <input type="file" hidden multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </Button>
            {addProgress !== null && (
              <Box sx={{ mt: 0.75 }}>
                <LinearProgress variant="determinate" value={addProgress} sx={{ borderRadius: 2, height: 5 }} />
                <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, mt: 0.25 }}>
                  Uploading… {addProgress}%
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          color: T.TEXT_TER, mb: 1 }}>
          Caption
        </Typography>
        <TextField fullWidth multiline minRows={3} size="small" value={caption}
          disabled={!can('digitalMarketing:readyToUpload:edit')}
          onChange={(e) => { setCaption(e.target.value); setCaptionDirty(true); }}
          onBlur={saveCaption}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px', fontSize: '0.8rem' } }} />
      </Box>

      <MediaViewer open={Boolean(viewerMedia)} onClose={() => setViewerMedia(null)} media={viewerMedia} />

      <ConfirmDialog
        open={Boolean(confirmRemoveFile)}
        onClose={() => setConfirmRemoveFile(null)}
        onConfirm={() => removeFile(confirmRemoveFile)}
        title="Remove file"
        message="Remove this file?"
        confirmLabel="Remove"
        destructive
      />
      <ConfirmDialog
        open={confirmDeleteRecord}
        onClose={() => setConfirmDeleteRecord(false)}
        onConfirm={handleDelete}
        title="Delete record"
        message="Delete this ready-to-upload record? This cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </Box>
  );
}
