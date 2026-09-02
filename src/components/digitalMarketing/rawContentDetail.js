import { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
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
import DownloadIcon from '@mui/icons-material/Download';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchRawContent, updateRawContent, deleteRawContent } from '../../store/store';
import RawContentChat from './rawContentChat';
import ReadyToUploadForm from './readyToUploadForm';
import DmFileEditDialog from './dmFileEditDialog';
import DmActivityLog from './dmActivityLog';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import MediaViewer, { resolveMediaKind, downloadFile } from './mediaViewer';
import CopyLinkButton from '../main/copyLinkButton';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
import UserAvatar from '../main/userAvatar';
import { enqueueUpload, onUploadCompleted } from '../../tools/uploadCenter/uploadManager';

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
  };

  const [loading, setLoading] = useState(true);
  const [editingDesc, setEditingDesc] = useState(null);   // fileId being edited
  const [descDraft, setDescDraft] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editFile, setEditFile] = useState(null);         // file entry open in the full edit dialog
  const [readyFormOpen, setReadyFormOpen] = useState(false);
  const [confirmRemoveFile, setConfirmRemoveFile] = useState(null);   // fileId pending removal
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState(false);
  const [viewerMedia, setViewerMedia] = useState(null);   // { url, name, kind }

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

  // Handed to the Upload Center — each file finishes in the background and
  // the record refreshes as each one lands (see the onUploadCompleted
  // subscription below), rather than blocking this button on the transfer.
  const addFiles = (fileList) => {
    Array.from(fileList || []).forEach((file) => {
      enqueueUpload({
        purpose: 'dmRawContent', targetId: id, extra: { description: '' },
        file, sectionLabel: t('nav.digitalMarketing'),
      });
    });
  };

  // Re-fetch when one of THIS record's uploads (a new file, a replace, a
  // voice note) completes — the detail view otherwise never learns a
  // background upload finished while it was open.
  useEffect(() => onUploadCompleted(({ purpose, targetId }) => {
    if (String(targetId) !== String(id)) return;
    if (['dmRawContent', 'dmRawContentReplace', 'dmRawContentVoice'].includes(purpose)) load();
  }), [id, load]);

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
              <Button size="small" variant="outlined" color="success" startIcon={<CloudUploadIcon sx={{ fontSize: 14 }} />}
                onClick={() => setReadyFormOpen(true)}
                sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px' }}>
                {t('dm.markReadyToUpload')}
              </Button>
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
        {/* ── File gallery ── */}
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: T.TEXT_TER, mb: 1 }}>
            {t('dm.filesLabel')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                          <Box component="video" src={`${url}#t=0.1`} muted preload="metadata"
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
            <Button component="label" size="small" startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 14 }} />}
              sx={{ mt: 1.25, fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC }}>
              {t('dm.addFiles')}
              <input type="file" hidden multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </Button>
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

      <ReadyToUploadForm open={readyFormOpen} onClose={() => setReadyFormOpen(false)} rawContentId={doc._id} />

      <DmFileEditDialog open={Boolean(editFile)} onClose={() => setEditFile(null)}
        file={editFile} recordId={doc._id} kind="rawContent" />

      <MediaViewer open={Boolean(viewerMedia)} onClose={() => setViewerMedia(null)} media={viewerMedia} />

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
