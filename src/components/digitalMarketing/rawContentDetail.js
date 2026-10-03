import { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LinkIcon from '@mui/icons-material/Link';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchRawContent, updateRawContent, deleteRawContent } from '../../store/store';
import RawContentChat from './rawContentChat';
import ReadyToUploadForm from './readyToUploadForm';
import LinkReadyToUploadDialog from './linkReadyToUploadDialog';
import ProductVarietyPicker from './productVarietyPicker';
import DmFileEditDialog from './dmFileEditDialog';
import DmActivityLog from './dmActivityLog';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import MediaViewer, { resolveMediaKind, downloadFile } from './mediaViewer';
import { MediaGrid, MediaGalleryViewer, toMediaItems } from './mediaGallery';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import { playbackUrl } from '../../tools/videoSource';
import CopyLinkButton from '../main/copyLinkButton';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
import UserAvatar from '../main/userAvatar';

// A stored file `name` may have had its extension stripped (friendly name),
// so append the real extension from the disk filename for the download.
const extOf = (s = '') => { const m = String(s).match(/\.[^./]+$/); return m ? m[0] : ''; };
const downloadName = (f) => {
  const base = f.name || f.diskName || 'file';
  return extOf(base) ? base : base + (extOf(f.diskName) || '');
};

const STATUS_META = {
  working_on_it:   { labelKey: 'dm.statusWorkingOnIt', color: '#64b5f6' },
  rejected:        { labelKey: 'dm.statusRejected',    color: '#e57373' },
  canceled:        { labelKey: 'dm.statusCanceled',    color: '#9e9e9e' },
  ready_to_upload: { labelKey: 'dm.statusReady',       color: '#81c784' },
};

export default function RawContentDetail({ id, onClose, onDeleted }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const history     = useHistory();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const doc = useSelector(s => s.dmSelectedRawContent);
  const errorStatus = useSelector(s => s.dmSelectedRawContentErrorStatus);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    CARD_BG:  isDark ? '#151515' : 'rgba(0,0,0,0.02)',
    DIALOG_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
  };

  const [loading, setLoading] = useState(true);
  const [editingDesc, setEditingDesc] = useState(null);   // fileId being edited
  const [descDraft, setDescDraft] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editFile, setEditFile] = useState(null);         // file entry open in the full edit dialog
  const [readyFormOpen, setReadyFormOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [readyMenuAnchor, setReadyMenuAnchor] = useState(null);
  const [confirmRemoveFile, setConfirmRemoveFile] = useState(null);   // fileId pending removal
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState(false);
  const [viewerMedia, setViewerMedia] = useState(null);   // { url, name, kind }
  const [fileView, setFileView] = useState('grid');       // 'grid' | 'list'
  const [galleryIndex, setGalleryIndex] = useState(-1);   // -1 = viewer closed

  // The record's attachments, normalised once for both the grid and the viewer.
  const mediaItems = useMemo(
    () => toMediaItems(doc?.files, axiosGlobal.defaultTargetApi),
    [doc?.files, axiosGlobal.defaultTargetApi]);
  const [addProgress, setAddProgress] = useState(null);   // 0-100 while "Add files" uploads

  const [editingProducts, setEditingProducts] = useState(false);
  const [productsDraft, setProductsDraft] = useState([]);
  const [editingTextContent, setEditingTextContent] = useState(false);
  const [textContentDraft, setTextContentDraft] = useState('');
  const [textVoiceEditFile, setTextVoiceEditFile] = useState(null);   // a freshly-recorded replacement, pending save
  const [recordingTextEdit, setRecordingTextEdit] = useState(false);
  const textEditRecorderRef = useRef(null);
  const textEditChunksRef   = useRef([]);

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
    setAddProgress(0);
    await dispatch(updateRawContent({
      authCtx, axiosGlobal, id, formData: fd,
      onProgress: (e) => setAddProgress(e.total ? Math.round((100 * e.loaded) / e.total) : null),
    }));
    setAddProgress(null);
  };

  const saveDescription = async (fileId) => {
    const fd = new FormData();
    fd.append('updateDescriptionFileId', fileId);
    fd.append('updateDescriptionText', descDraft);
    await dispatch(updateRawContent({ authCtx, axiosGlobal, id, formData: fd }));
    setEditingDesc(null);
  };

  const saveTitle = async () => {
    const fd = new FormData();
    fd.append('title', titleDraft);
    await dispatch(updateRawContent({ authCtx, axiosGlobal, id, formData: fd }));
    setEditingTitle(false);
  };

  const openEditProducts = () => { setProductsDraft(doc.products || []); setEditingProducts(true); };
  const saveProducts = async () => {
    const fd = new FormData();
    fd.append('products', JSON.stringify(productsDraft.map((p) => ({ productId: p.productId, variantId: p.variantId }))));
    await dispatch(updateRawContent({ authCtx, axiosGlobal, id, formData: fd }));
    setEditingProducts(false);
  };

  const openEditTextContent = () => {
    setTextContentDraft(doc.textContent || '');
    setTextVoiceEditFile(null);
    setEditingTextContent(true);
  };
  const startTextEditVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      textEditChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) textEditChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(textEditChunksRef.current, { type: 'audio/webm' });
        setTextVoiceEditFile(new File([blob], `voice-content-${Date.now()}.webm`, { type: 'audio/webm' }));
      };
      recorder.start();
      textEditRecorderRef.current = recorder;
      setRecordingTextEdit(true);
    } catch (_) { /* mic denied — non-fatal, same as the create form */ }
  };
  const stopTextEditVoice = () => { textEditRecorderRef.current?.stop(); setRecordingTextEdit(false); };
  const saveTextContent = async () => {
    const fd = new FormData();
    fd.append('textContent', textContentDraft);
    if (textVoiceEditFile) fd.append('textVoice', textVoiceEditFile);
    await dispatch(updateRawContent({ authCtx, axiosGlobal, id, formData: fd }));
    setEditingTextContent(false);
  };

  const handleDelete = async () => {
    await dispatch(deleteRawContent({ authCtx, axiosGlobal, id }));
    onDeleted && onDeleted();
  };

  // Files are served statically from /uploads/<diskName>. Viewing happens
  // IN-APP via MediaViewer — never window.open / a browser tab.
  const viewFile = (diskName, name, kindHint) => {
    if (!diskName) return;
    setViewerMedia({
      url: `${axiosGlobal.defaultTargetApi}/uploads/${diskName}`,
      name: name || diskName,
      kind: kindHint || resolveMediaKind(name || diskName),
    });
  };

  // Native download (keeps the browser's own progress UI) + a separate
  // fire-and-forget authenticated call to record who downloaded it — the
  // actual bytes deliberately stay on the untracked public /download route so
  // a plain <a> click still works (it can't carry a bearer token).
  const handleDownload = (f) => {
    downloadFile(`${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`, downloadName(f));
    authCtx.jwtInst({ method: 'post',
      url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/raw-contents/${doc._id}/files/${f.fileId}/log-download` })
      .catch(() => {});
  };

  if (!loading && errorStatus === 403) return <RestrictedAccessScreen />;

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
          {editingTitle ? (
            <TextField size="small" autoFocus fullWidth value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
              placeholder={t('dm.batchTitleLabel')}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '1rem', fontWeight: 700 } }} />
          ) : (
            <Typography
              onClick={() => can('digitalMarketing:rawContent:edit') && (setEditingTitle(true), setTitleDraft(doc.title || ''))}
              sx={{ fontSize: '1rem', fontWeight: 700, color: doc.title ? T.TEXT_PRI : T.TEXT_TER,
                cursor: can('digitalMarketing:rawContent:edit') ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {doc.title?.trim() || t('dm.filesBatchFallback', { count: doc.files?.length || 0 })}
              {can('digitalMarketing:rawContent:edit') && <EditOutlinedIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />}
            </Typography>
          )}
          <Box sx={{ px: 0.75, py: '1px', borderRadius: '5px', bgcolor: `${status.color}22`, flexShrink: 0 }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: status.color }}>{t(status.labelKey)}</Typography>
          </Box>
          <CopyLinkButton module="digitalMarketing" entityType="rawContent" entityId={doc._id} />
          <IconButton size="small" onClick={onClose} sx={{ color: T.TEXT_TER, flexShrink: 0 }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.25, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC }}>
            {doc.title?.trim() ? `${t('dm.fileCount', { count: doc.files?.length || 0 })} · ` : ''}
            {doc.language || '—'} · {doc.useCase} · {doc.platform}
          </Typography>
          {doc.createdByName && (
            <>
              <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC }}>·</Typography>
              <UserAvatar userId={doc.createdBy} size={14} fontSize="0.5rem" />
              <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC }}>
                {t('crm.byActor', { name: doc.createdByName })}
              </Typography>
            </>
          )}
        </Box>

        {/* status actions */}
        {can('digitalMarketing:rawContent:edit') && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.25 }}>
            {['working_on_it', 'rejected', 'canceled'].map((s) => (
              <Button key={s} size="small" variant={doc.status === s ? 'contained' : 'outlined'}
                onClick={() => setStatus(s)}
                sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px', minWidth: 0 }}>
                {t(STATUS_META[s].labelKey)}
              </Button>
            ))}
            {doc.status === 'ready_to_upload' && doc.readyToUploadId ? (
              <Button size="small" variant="outlined" startIcon={<CloudUploadIcon sx={{ fontSize: 14 }} />}
                disabled
                sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px' }}>
                {t('dm.alreadyReadyToUpload')}
              </Button>
            ) : (
              <>
                <Button size="small" variant="outlined" color="success"
                  startIcon={<CloudUploadIcon sx={{ fontSize: 14 }} />}
                  endIcon={<ArrowDropDownIcon sx={{ fontSize: 16 }} />}
                  onClick={(e) => setReadyMenuAnchor(e.currentTarget)}
                  sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px' }}>
                  {t('dm.markReadyToUpload')}
                </Button>
                <Menu anchorEl={readyMenuAnchor} open={!!readyMenuAnchor} onClose={() => setReadyMenuAnchor(null)}>
                  <MenuItem onClick={() => { setReadyMenuAnchor(null); setReadyFormOpen(true); }}>
                    <ListItemIcon><AddCircleOutlineIcon sx={{ fontSize: 17 }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>{t('dm.createNewReadyToUpload')}</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { setReadyMenuAnchor(null); setLinkDialogOpen(true); }}>
                    <ListItemIcon><LinkIcon sx={{ fontSize: 17 }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>{t('dm.linkExistingReadyToUpload')}</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        )}

        {can('digitalMarketing:rawContent:delete') && (
          <Button size="small" startIcon={<DeleteOutlineIcon sx={{ fontSize: 13 }} />} onClick={() => setConfirmDeleteBatch(true)}
            sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#EA005A', mt: 1, px: 0 }}>
            {t('dm.deleteBatch')}
          </Button>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {/* ── Ready-to-upload content — shown at the TOP once this batch has
            graduated, whether linked via the create-new flow or the
            link-existing flow (both set readyToUploadId the same way). ── */}
        {doc.status === 'ready_to_upload' && doc.readyToUpload && (
          <Box sx={{ px: 3, pt: 2.5 }}>
            <Box sx={{ p: 1.75, borderRadius: '12px', bgcolor: 'rgba(129,199,132,0.08)', border: '1px solid rgba(129,199,132,0.3)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <CloudUploadIcon sx={{ fontSize: 15, color: '#81c784' }} />
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#81c784' }}>
                  {t('dm.readyToUploadContentLabel')}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, mb: 0.5 }}>
                {doc.readyToUpload.title?.trim() || t('dm.filesBatchFallback', { count: doc.readyToUpload.files?.length || 0 })}
              </Typography>
              <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_SEC, mb: 1.25 }}>
                {[doc.readyToUpload.language, doc.readyToUpload.platform].filter(Boolean).join(' · ') || '—'}
                {doc.readyToUpload.caption ? ` — ${doc.readyToUpload.caption}` : ''}
              </Typography>
              <Button size="small" variant="outlined" startIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                onClick={() => history.push(`/digitalMarketing?dm=ready&open=${doc.readyToUpload._id}`)}
                sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '8px', borderColor: 'rgba(129,199,132,0.4)', color: '#81c784' }}>
                {t('dm.openReadyToUpload')}
              </Button>
            </Box>
          </Box>
        )}

        {/* ── Tagged Inventory varieties ── */}
        <Box sx={{ px: 3, pt: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.TEXT_TER, flexGrow: 1 }}>
              {t('dm.taggedVarietiesLabel')}
            </Typography>
            {can('digitalMarketing:rawContent:edit') && !editingProducts && (
              <IconButton size="small" onClick={openEditProducts} sx={{ color: T.TEXT_TER, width: 22, height: 22 }}>
                <EditOutlinedIcon sx={{ fontSize: 13 }} />
              </IconButton>
            )}
          </Box>
          {editingProducts ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <ProductVarietyPicker value={productsDraft} onChange={setProductsDraft} T={T} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" onClick={saveProducts}
                  sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px' }}>{t('common.save')}</Button>
                <Button size="small" onClick={() => setEditingProducts(false)}
                  sx={{ fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC }}>{t('common.cancel')}</Button>
              </Box>
            </Box>
          ) : (doc.products || []).length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {doc.products.map((p) => (
                <Tooltip key={String(p.variantId)} title={[p.productName, p.branchName].filter(Boolean).join(' · ')}>
                  <Chip size="small" label={p.code}
                    sx={{ height: 24, fontSize: '0.72rem', bgcolor: T.CTRL_BG, color: T.TEXT_PRI, fontFamily: 'monospace' }} />
                </Tooltip>
              ))}
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, fontStyle: 'italic' }}>
              {t('dm.noneTaggedYet')}
            </Typography>
          )}
        </Box>

        {/* ── Text-format content ── */}
        {(editingTextContent || doc.textContent || doc.textVoiceDiskName) && (
          <Box sx={{ px: 3, pt: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.TEXT_TER, flexGrow: 1 }}>
                {t('dm.textContentSectionLabel')}
              </Typography>
              {can('digitalMarketing:rawContent:edit') && !editingTextContent && (
                <IconButton size="small" onClick={openEditTextContent} sx={{ color: T.TEXT_TER, width: 22, height: 22 }}>
                  <EditOutlinedIcon sx={{ fontSize: 13 }} />
                </IconButton>
              )}
            </Box>
            {editingTextContent ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <TextField size="small" fullWidth multiline minRows={3} placeholder={t('dm.textContentPlaceholder')}
                    value={textContentDraft} onChange={(e) => setTextContentDraft(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.CTRL_BG, borderRadius: '8px', fontSize: '0.8rem' } }} />
                  <Tooltip title={recordingTextEdit ? t('dm.stopRecordingTip2') : t('dm.recordTextVoiceTip')}>
                    <IconButton size="small" onClick={recordingTextEdit ? stopTextEditVoice : startTextEditVoice}
                      sx={{ color: recordingTextEdit ? '#EA005A' : T.TEXT_TER, flexShrink: 0 }}>
                      {recordingTextEdit ? <StopCircleIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>
                {textVoiceEditFile && (
                  <Typography sx={{ fontSize: '0.7rem', color: '#81c784' }}>{t('dm.newVoiceRecordedNote')}</Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="contained" onClick={saveTextContent}
                    sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px' }}>{t('common.save')}</Button>
                  <Button size="small" onClick={() => setEditingTextContent(false)}
                    sx={{ fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC }}>{t('common.cancel')}</Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}`,
                display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC, whiteSpace: 'pre-wrap', wordBreak: 'break-word', flexGrow: 1 }}>
                  {doc.textContent || ''}
                </Typography>
                {doc.textVoiceDiskName && (
                  <Tooltip title={t('dm.playVoiceDescriptionTip')}>
                    <IconButton size="small"
                      onClick={() => viewFile(doc.textVoiceDiskName, t('dm.voiceDescriptionFallback'), 'audio')}
                      sx={{ color: '#81c784', flexShrink: 0 }}>
                      <PlayCircleIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* ── File gallery ── */}
        <Box sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', color: T.TEXT_TER }}>
              {t('dm.filesLabel')}
            </Typography>
            {/* Media grid vs the detailed list — the list keeps the per-file
                description / replace / delete controls, the grid is for looking. */}
            {(doc.files || []).length > 0 && (
              <ToggleButtonGroup size="small" exclusive value={fileView}
                onChange={(_, v) => v && setFileView(v)} sx={{ ml: 'auto' }}>
                <ToggleButton value="grid" sx={{ px: 0.9, py: 0.15 }}>
                  <Tooltip title={t('dm.mediaViewGrid')}><GridViewIcon sx={{ fontSize: 14 }} /></Tooltip>
                </ToggleButton>
                <ToggleButton value="list" sx={{ px: 0.9, py: 0.15 }}>
                  <Tooltip title={t('dm.mediaViewList')}><ViewListIcon sx={{ fontSize: 14 }} /></Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>

          {fileView === 'grid' && mediaItems.length > 0 && (
            <MediaGrid items={mediaItems} T={T}
              onOpen={(it) => setGalleryIndex(mediaItems.findIndex((m) => m.id === it.id))} />
          )}

          <Box sx={{ display: fileView === 'list' ? 'flex' : 'none', flexDirection: 'column', gap: 1 }}>
            {(doc.files || []).map((f) => (
              <Box key={f.fileId} sx={{ p: 1.25, borderRadius: '10px', bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* inline thumbnail for images/videos; icon for the rest — click opens the in-app viewer */}
                  {(() => {
                    const kind = resolveMediaKind(f.name || f.diskName || '');
                    const url  = f.diskName ? `${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}` : null;
                    if (kind === 'image' && url) {
                      return <Box component="img" src={url} alt="" onClick={() => viewFile(f.diskName, f.name, kind)}
                        sx={{ width: 34, height: 34, borderRadius: '6px', objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }} />;
                    }
                    if (kind === 'video' && url) {
                      return (
                        <Box onClick={() => viewFile(f.diskName, f.name, kind)}
                          sx={{ position: 'relative', width: 34, height: 34, borderRadius: '6px', overflow: 'hidden',
                            cursor: 'pointer', flexShrink: 0, bgcolor: '#000' }}>
                          <Box component="video" src={`${playbackUrl(url)}#t=0.1`} muted preload="metadata" playsInline
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <PlayCircleIcon sx={{ position: 'absolute', inset: 0, m: 'auto', fontSize: 18, color: 'rgba(255,255,255,0.9)' }} />
                        </Box>
                      );
                    }
                    return <InsertDriveFileIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />;
                  })()}
                  <Typography onClick={() => viewFile(f.diskName, f.name)}
                    sx={{ fontSize: '0.78rem', color: T.TEXT_PRI, flexGrow: 1, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}
                    noWrap>
                    <OpenInNewIcon sx={{ fontSize: 12, flexShrink: 0 }} /> {f.name || t('dm.previewFileFallback')}
                  </Typography>
                  {f.voiceDescriptionDiskName && (
                    <Tooltip title={t('dm.playVoiceDescriptionTip')}>
                      <IconButton size="small"
                        onClick={() => viewFile(f.voiceDescriptionDiskName, t('dm.voiceDescriptionFallback'), 'audio')}
                        sx={{ color: '#81c784', width: 24, height: 24 }}>
                        <PlayCircleIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {f.diskName && (
                    <Tooltip title={t('common.download')}>
                      <IconButton size="small"
                        onClick={() => handleDownload(f)}
                        sx={{ color: T.TEXT_SEC, width: 24, height: 24 }}>
                        <DownloadIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {can('digitalMarketing:rawContent:edit') && (
                    <Tooltip title={t('dm.editFileTip')}>
                      <IconButton size="small" onClick={() => setEditFile(f)} sx={{ color: T.TEXT_SEC, width: 24, height: 24 }}>
                        <EditOutlinedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {can('digitalMarketing:rawContent:edit') && (
                    <Tooltip title={t('dm.removeTip')}>
                      <IconButton size="small" onClick={() => setConfirmRemoveFile(f.fileId)} sx={{ color: '#EA005A', width: 24, height: 24 }}>
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
                    {f.description || t('dm.noDescriptionClickToAdd')}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {can('digitalMarketing:rawContent:edit') && (
            <>
              <Button component="label" size="small" startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 14 }} />}
                disabled={addProgress !== null}
                sx={{ mt: 1.25, fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC }}>
                {t('dm.addFiles')}
                <input type="file" hidden multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              </Button>
              {addProgress !== null && (
                <Box sx={{ mt: 0.75 }}>
                  <LinearProgress variant="determinate" value={addProgress} sx={{ borderRadius: 2, height: 5 }} />
                  <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, mt: 0.25 }}>
                    {t('dm.uploadingPercent', { percent: addProgress })}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* ── Activity (who viewed / downloaded) ── */}
        <Box sx={{ px: 3, pb: 2 }}>
          <DmActivityLog endpointBase="raw-contents" id={doc._id} T={T} />
        </Box>

        {/* ── Chat ── */}
        {can('digitalMarketing:rawContent:chat') && (
          <RawContentChat rawContentId={doc._id} T={T} isDark={isDark} />
        )}
      </Box>

      <ReadyToUploadForm open={readyFormOpen} onClose={() => setReadyFormOpen(false)} rawContentId={doc._id}
        defaultBranchId={doc.branchId || ''} defaultProducts={doc.products || []} />
      <LinkReadyToUploadDialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} rawContentId={doc._id} T={T} isDark={isDark} />

      <DmFileEditDialog open={Boolean(editFile)} onClose={() => setEditFile(null)}
        file={editFile} recordId={doc._id} kind="rawContent" />

      <MediaViewer open={Boolean(viewerMedia)} onClose={() => setViewerMedia(null)} media={viewerMedia} />

      <MediaGalleryViewer open={galleryIndex >= 0} items={mediaItems} index={galleryIndex}
        onIndexChange={setGalleryIndex} onClose={() => setGalleryIndex(-1)} />

      <ConfirmDialog
        open={Boolean(confirmRemoveFile)}
        onClose={() => setConfirmRemoveFile(null)}
        onConfirm={() => removeFile(confirmRemoveFile)}
        title={t('dm.removeFileTitle')}
        message={t('dm.removeFileFromBatchMessage')}
        confirmLabel={t('common.remove')}
        destructive
      />
      <ConfirmDialog
        open={confirmDeleteBatch}
        onClose={() => setConfirmDeleteBatch(false)}
        onConfirm={handleDelete}
        title={t('dm.deleteBatch')}
        message={t('dm.deleteBatchMessage')}
        confirmLabel={t('common.delete')}
        destructive
      />
    </Box>
  );
}
