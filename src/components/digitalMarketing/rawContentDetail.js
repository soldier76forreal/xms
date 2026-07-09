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
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchRawContent, updateRawContent, deleteRawContent } from '../../store/store';
import RawContentChat from './rawContentChat';
import ReadyToUploadForm from './readyToUploadForm';

const STATUS_META = {
  working_on_it:   { label: 'Working on it', color: '#64b5f6' },
  rejected:        { label: 'Rejected',      color: '#e57373' },
  canceled:        { label: 'Canceled',      color: '#9e9e9e' },
  ready_to_upload: { label: 'Ready',         color: '#81c784' },
};

export default function RawContentDetail({ id, onClose, onDeleted }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const doc = useSelector(s => s.dmSelectedRawContent);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    CARD_BG:  isDark ? '#151515' : 'rgba(0,0,0,0.02)',
  };

  const [loading, setLoading] = useState(true);
  const [editingDesc, setEditingDesc] = useState(null);   // fileId being edited
  const [descDraft, setDescDraft] = useState('');
  const [readyFormOpen, setReadyFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    await dispatch(fetchRawContent({ authCtx, axiosGlobal, id }));
    setLoading(false);
  }, [id, authCtx, axiosGlobal, dispatch]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (status) => {
    const fd = new FormData();
    fd.append('status', status);
    await dispatch(updateRawContent({ authCtx, axiosGlobal, id, formData: fd }));
  };

  const removeFile = async (fileId) => {
    if (!window.confirm('Remove this file from the batch?')) return;
    const fd = new FormData();
    fd.append('removeFileIds', JSON.stringify([fileId]));
    await dispatch(updateRawContent({ authCtx, axiosGlobal, id, formData: fd }));
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    fd.append('descriptions', JSON.stringify(files.map(() => '')));
    fd.append('voiceDescriptionFlags', JSON.stringify(files.map(() => false)));
    await dispatch(updateRawContent({ authCtx, axiosGlobal, id, formData: fd }));
  };

  const saveDescription = async (fileId) => {
    const fd = new FormData();
    fd.append('updateDescriptionFileId', fileId);
    fd.append('updateDescriptionText', descDraft);
    await dispatch(updateRawContent({ authCtx, axiosGlobal, id, formData: fd }));
    setEditingDesc(null);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this raw content batch? This cannot be undone.')) return;
    await dispatch(deleteRawContent({ authCtx, axiosGlobal, id }));
    onDeleted && onDeleted();
  };

  // Files are served statically from /uploads/<diskName> — there is no generic
  // GET /files/:id route, so we always open by the snapshotted disk filename.
  const openFile = (diskName) => diskName && window.open(`${axiosGlobal.defaultTargetApi}/uploads/${diskName}`, '_blank');

  if (loading || !doc || String(doc._id) !== String(id)) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: '10px' }} />
      </Box>
    );
  }

  const status = STATUS_META[doc.status] || STATUS_META.working_on_it;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ px: 3, pt: 2, pb: 1.5, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: T.TEXT_PRI }}>
            {doc.files?.length || 0} file{doc.files?.length !== 1 ? 's' : ''} batch
          </Typography>
          <Box sx={{ px: 0.75, py: '1px', borderRadius: '5px', bgcolor: `${status.color}22` }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: status.color }}>{status.label}</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton size="small" onClick={onClose} sx={{ color: T.TEXT_TER }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, mt: 0.25 }}>
          {doc.language || '—'} · {doc.useCase} · {doc.platform}
          {doc.createdByName ? ` · by ${doc.createdByName}` : ''}
        </Typography>

        {/* status actions */}
        {can('digitalMarketing:rawContent:edit') && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.25 }}>
            {['working_on_it', 'rejected', 'canceled'].map((s) => (
              <Button key={s} size="small" variant={doc.status === s ? 'contained' : 'outlined'}
                onClick={() => setStatus(s)}
                sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px', minWidth: 0 }}>
                {STATUS_META[s].label}
              </Button>
            ))}
            {doc.status === 'ready_to_upload' && doc.readyToUploadId ? (
              <Button size="small" variant="outlined" startIcon={<CloudUploadIcon sx={{ fontSize: 14 }} />}
                disabled
                sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px' }}>
                Already ready to upload
              </Button>
            ) : (
              <Button size="small" variant="outlined" color="success" startIcon={<CloudUploadIcon sx={{ fontSize: 14 }} />}
                onClick={() => setReadyFormOpen(true)}
                sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px' }}>
                Mark ready to upload
              </Button>
            )}
          </Box>
        )}

        {can('digitalMarketing:rawContent:delete') && (
          <Button size="small" startIcon={<DeleteOutlineIcon sx={{ fontSize: 13 }} />} onClick={handleDelete}
            sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#EA005A', mt: 1, px: 0 }}>
            Delete batch
          </Button>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {/* ── File gallery ── */}
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: T.TEXT_TER, mb: 1 }}>
            Files
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {(doc.files || []).map((f) => (
              <Box key={f.fileId} sx={{ p: 1.25, borderRadius: '10px', bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InsertDriveFileIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />
                  <Typography onClick={() => openFile(f.diskName)}
                    sx={{ fontSize: '0.78rem', color: T.TEXT_PRI, flexGrow: 1, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}
                    noWrap>
                    <OpenInNewIcon sx={{ fontSize: 12, flexShrink: 0 }} /> {f.name || 'Open file'}
                  </Typography>
                  {f.voiceDescriptionDiskName && (
                    <Tooltip title="Play voice description">
                      <IconButton size="small" onClick={() => openFile(f.voiceDescriptionDiskName)}
                        sx={{ color: '#81c784', width: 24, height: 24 }}>
                        <PlayCircleIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {can('digitalMarketing:rawContent:edit') && (
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => removeFile(f.fileId)} sx={{ color: '#EA005A', width: 24, height: 24 }}>
                        <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {editingDesc === f.fileId ? (
                  <TextField size="small" fullWidth autoFocus value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    onBlur={() => saveDescription(f.fileId)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveDescription(f.fileId); }}
                    sx={{ mt: 0.75, '& .MuiOutlinedInput-root': { bgcolor: 'transparent', fontSize: '0.76rem' } }} />
                ) : (
                  <Typography onClick={() => can('digitalMarketing:rawContent:edit') && (setEditingDesc(f.fileId), setDescDraft(f.description || ''))}
                    sx={{ fontSize: '0.76rem', color: f.description ? T.TEXT_SEC : T.TEXT_TER, mt: 0.5,
                      cursor: can('digitalMarketing:rawContent:edit') ? 'pointer' : 'default' }}>
                    {f.description || 'No description — click to add'}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {can('digitalMarketing:rawContent:edit') && (
            <Button component="label" size="small" startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 14 }} />}
              sx={{ mt: 1.25, fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC }}>
              Add files
              <input type="file" hidden multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </Button>
          )}
        </Box>

        {/* ── Chat ── */}
        {can('digitalMarketing:rawContent:chat') && (
          <RawContentChat rawContentId={doc._id} T={T} isDark={isDark} />
        )}
      </Box>

      <ReadyToUploadForm open={readyFormOpen} onClose={() => setReadyFormOpen(false)} rawContentId={doc._id} />
    </Box>
  );
}
