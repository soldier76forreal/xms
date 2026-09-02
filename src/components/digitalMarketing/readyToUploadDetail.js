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
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MovieIcon from '@mui/icons-material/Movie';
import DownloadIcon from '@mui/icons-material/Download';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchReadyToUpload, updateReadyToUpload, deleteReadyToUpload, actions } from '../../store/store';
import { copyText } from '../../tools/clipboard';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import MediaViewer, { resolveMediaKind, downloadFile } from './mediaViewer';
import DmFileEditDialog from './dmFileEditDialog';
import DmActivityLog from './dmActivityLog';
import RawContentChat from './rawContentChat';
import CopyLinkButton from '../main/copyLinkButton';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
import UserAvatar from '../main/userAvatar';
import { enqueueUpload, onUploadCompleted } from '../../tools/uploadCenter/uploadManager';

// A stored file `name` may have had its extension stripped, so fall back to
// the disk filename's extension for the download (same helper as raw content).
const extOf = (s = '') => { const m = String(s).match(/\.[^./]+$/); return m ? m[0] : ''; };
const downloadFileName = (f) => {
  const base = f.name || f.diskName || 'file';
  return extOf(base) ? base : base + (extOf(f.diskName) || '');
};

export default function ReadyToUploadDetail({ id, onClose, onDeleted }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const doc = useSelector(s => s.dmSelectedReadyToUpload);
  const errorStatus = useSelector(s => s.dmSelectedReadyToUploadErrorStatus);

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [confirmRemoveFile, setConfirmRemoveFile] = useState(null);
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState(false);
  const [viewerMedia, setViewerMedia] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    await dispatch(fetchReadyToUpload({ authCtx, axiosGlobal, id }));
    setLoading(false);
  }, [id, authCtx, axiosGlobal, dispatch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (doc && String(doc._id) === String(id)) { setCaption(doc.caption || ''); setCaptionDirty(false); } }, [doc, id]);

  // Background files (added here, after the record already exists) land via
  // the Upload Center — refresh once one finishes, same pattern as raw content.
  useEffect(() => onUploadCompleted(({ purpose, targetId }) => {
    if (String(targetId) !== String(id)) return;
    if (['dmReadyToUpload', 'dmReadyToUploadReplace'].includes(purpose)) load();
  }), [id, load]);

  const saveCaption = async () => {
    if (!captionDirty) return;
    const fd = new FormData();
    fd.append('caption', caption);
    await dispatch(updateReadyToUpload({ authCtx, axiosGlobal, id, formData: fd }));
    setCaptionDirty(false);
  };

  const copyCaption = async () => {
    if (!caption) return;
    const copied = await copyText(caption);
    dispatch(actions.setShowSnackBar({
      status: true,
      msg: copied ? t('files.copied') : caption,
      type: copied ? 'success' : 'info',
    }));
  };

  const saveTitle = async () => {
    const fd = new FormData();
    fd.append('title', titleDraft);
    await dispatch(updateReadyToUpload({ authCtx, axiosGlobal, id, formData: fd }));
    setEditingTitle(false);
  };

  const removeFile = async (fileId) => {
    const fd = new FormData();
    fd.append('removeFileIds', JSON.stringify([fileId]));
    await dispatch(updateReadyToUpload({ authCtx, axiosGlobal, id, formData: fd }));
  };

  // Handed to the Upload Center — each file finishes in the background and
  // the record refreshes as each one lands (see the onUploadCompleted
  // subscription above), rather than blocking this button on the transfer.
  const addFiles = (fileList) => {
    Array.from(fileList || []).forEach((file) => {
      enqueueUpload({
        purpose: 'dmReadyToUpload', targetId: id,
        file, sectionLabel: t('nav.digitalMarketing'),
      });
    });
  };

  const handleDelete = async () => {
    await dispatch(deleteReadyToUpload({ authCtx, axiosGlobal, id }));
    onDeleted && onDeleted();
  };

  // Native download (real browser progress) + a separate fire-and-forget
  // authenticated call to record who downloaded it — same split as raw content.
  const handleDownload = (f) => {
    downloadFile(`${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`, downloadFileName(f));
    authCtx.jwtInst({ method: 'post',
      url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/ready-to-upload/${id}/files/${f.fileId}/log-download` })
      .catch(() => {});
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

  if (!loading && errorStatus === 403) return <RestrictedAccessScreen />;

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
          {editingTitle ? (
            <TextField size="small" autoFocus fullWidth value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
              placeholder={t('dm.titleLabel')}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '1rem', fontWeight: 700 } }} />
          ) : (
            <Typography
              onClick={() => can('digitalMarketing:readyToUpload:edit') && (setEditingTitle(true), setTitleDraft(doc.title || ''))}
              sx={{ fontSize: '1rem', fontWeight: 700, color: doc.title ? T.TEXT_PRI : T.TEXT_TER,
                cursor: can('digitalMarketing:readyToUpload:edit') ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {doc.title?.trim() || t('dm.filesReady', { count: doc.files?.length || 0 })}
              {can('digitalMarketing:readyToUpload:edit') && <EditOutlinedIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />}
            </Typography>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <CopyLinkButton module="digitalMarketing" entityType="readyToUpload" entityId={doc._id} />
          <IconButton size="small" onClick={onClose} sx={{ color: T.TEXT_TER, flexShrink: 0 }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.25, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC }}>
            {doc.title?.trim() ? `${t('dm.fileCount', { count: doc.files?.length || 0 })} · ` : ''}
            {doc.language || '—'} · {doc.platform || '—'}
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

        {doc.rawContent && (
          <Box sx={{ mt: 1, p: 1, borderRadius: '8px', bgcolor: T.CTRL_BG }}>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('dm.fromRawContentBatch')}
            </Typography>
            <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_SEC, mt: 0.25 }}>
              {doc.rawContent.language} · {doc.rawContent.useCase} · {doc.rawContent.platform}
            </Typography>
          </Box>
        )}

        {can('digitalMarketing:readyToUpload:delete') && (
          <Button size="small" startIcon={<DeleteOutlineIcon sx={{ fontSize: 13 }} />} onClick={() => setConfirmDeleteRecord(true)}
            sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#EA005A', mt: 1, px: 0 }}>
            {t('dm.deleteRecord')}
          </Button>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          color: T.TEXT_TER, mb: 1 }}>
          {t('dm.filesLabel')}
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
                <OpenInNewIcon sx={{ fontSize: 12, flexShrink: 0 }} /> {f.name || t('dm.previewFileFallback')}
              </Typography>
              {f.diskName && (
                <Tooltip title={t('common.download')}>
                  <IconButton size="small" onClick={() => handleDownload(f)} sx={{ color: T.TEXT_SEC, width: 24, height: 24 }}>
                    <DownloadIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              )}
              {can('digitalMarketing:readyToUpload:edit') && (
                <Tooltip title={t('dm.editFileTip')}>
                  <IconButton size="small" onClick={() => setEditFile(f)} sx={{ color: T.TEXT_SEC, width: 24, height: 24 }}>
                    <EditOutlinedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              )}
              {can('digitalMarketing:readyToUpload:edit') && (
                <Tooltip title={t('dm.removeTip')}>
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
              sx={{ fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC }}>
              {t('dm.addFiles')}
              <input type="file" hidden multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: T.TEXT_TER }}>
            {t('dm.captionSectionLabel')}
          </Typography>
          <Tooltip title={t('common.copyToClipboard')}>
            <span>
              <IconButton size="small" onClick={copyCaption} disabled={!caption}
                sx={{ color: T.TEXT_TER, width: 24, height: 24, '&:hover': { color: T.TEXT_PRI } }}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <TextField fullWidth multiline minRows={3} size="small" value={caption}
          disabled={!can('digitalMarketing:readyToUpload:edit')}
          onChange={(e) => { setCaption(e.target.value); setCaptionDirty(true); }}
          onBlur={saveCaption}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px', fontSize: '0.8rem' } }} />

        {/* ── Activity (who viewed / downloaded) ── */}
        <Box sx={{ mt: 2.5, mb: 1 }}>
          <DmActivityLog endpointBase="ready-to-upload" id={doc._id} T={T} />
        </Box>
      </Box>

      {/* ── Chat — a graduated record reuses the SAME thread as its source raw
          content batch (one conversation about this content, not a forked
          parallel chat); a standalone record (no rawContentId) gets its own
          thread keyed by its own id instead. Rendered by RawContentChat
          itself, which carries its own px:3 padding + border-top, matching
          the raw-content detail exactly. ── */}
      {can('digitalMarketing:rawContent:chat') && (
        <Box sx={{ flexShrink: 0, overflowY: 'auto', maxHeight: '45%' }}>
          {doc.rawContentId
            ? <RawContentChat rawContentId={doc.rawContentId} T={T} isDark={isDark} />
            : <RawContentChat readyToUploadId={doc._id} T={T} isDark={isDark} />}
        </Box>
      )}

      <DmFileEditDialog open={Boolean(editFile)} onClose={() => setEditFile(null)}
        file={editFile} recordId={doc._id} kind="readyToUpload" />

      <MediaViewer open={Boolean(viewerMedia)} onClose={() => setViewerMedia(null)} media={viewerMedia} />

      <ConfirmDialog
        open={Boolean(confirmRemoveFile)}
        onClose={() => setConfirmRemoveFile(null)}
        onConfirm={() => removeFile(confirmRemoveFile)}
        title={t('dm.removeFileTitle')}
        message={t('dm.removeFileMessage')}
        confirmLabel={t('common.remove')}
        destructive
      />
      <ConfirmDialog
        open={confirmDeleteRecord}
        onClose={() => setConfirmDeleteRecord(false)}
        onConfirm={handleDelete}
        title={t('dm.deleteRecordTitle')}
        message={t('dm.deleteRecordMessage')}
        confirmLabel={t('common.delete')}
        destructive
      />
    </Box>
  );
}
