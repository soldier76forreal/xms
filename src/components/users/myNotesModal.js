import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageIcon from '@mui/icons-material/Image';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DownloadIcon from '@mui/icons-material/Download';
import LockIcon from '@mui/icons-material/Lock';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import MediaViewer, { resolveMediaKind, downloadFile } from '../digitalMarketing/mediaViewer';

function relativeDate(d, t) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)   return t('crm.relativeJustNow');
  const min = Math.floor(sec / 60);
  if (min < 60)   return t('crm.relativeMinutesAgo', { count: min });
  const hr  = Math.floor(min / 60);
  if (hr  < 24)   return t('crm.relativeHoursAgo', { count: hr });
  const days = Math.floor(hr / 24);
  if (days < 30)  return t('crm.relativeDaysAgo', { count: days });
  if (days < 365) return t('crm.relativeMonthsAgo', { count: Math.floor(days / 30) });
  return t('crm.relativeYearsAgo', { count: Math.floor(days / 365) });
}

// ── My Notes — strictly personal, never visible to anyone else (not even
// superAdmin — enforced server-side, see api/routes/users/users.js). Reuses
// the CRM communication-tab pattern for voice recording + attach, and DM's
// shared MediaViewer for in-app preview/download of images/video/audio/PDF.
const MyNotesModal = ({ open, onClose }) => {
  const { t }       = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const theme       = useTheme();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark      = theme.palette.mode === 'dark';

  const T = {
    CARD_BG:  isDark ? '#0d0d0d'                : theme.palette.background.paper,
    ROW_BG:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    INPUT_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD: isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:  isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    CARD_BD:  isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    BTN_BG:   isDark ? '#ffffff'                : '#000000',
    BTN_CLR:  isDark ? '#000000'                : '#ffffff',
  };

  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const [body, setBody] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [recording, setRecording]       = useState(false);
  const [recordError, setRecordError]   = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [viewerMedia, setViewerMedia]   = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/users/me/notes`,
        params: { page: pg, limit: 20 },
      });
      setNotes((prev) => (pg === 1 ? (res.data.data || []) : [...prev, ...(res.data.data || [])]));
      setTotal(res.data.total || 0);
      setPage(pg);
    } catch (_) { /* non-fatal */ }
    setLoading(false);
  }, [authCtx, axiosGlobal]);

  useEffect(() => {
    if (!open) return;
    setBody(''); setPendingFiles([]); setRecordError('');
    load(1);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setHasMore(notes.length < total); }, [notes, total]);

  const startRecording = async () => {
    setRecordError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        setPendingFiles((prev) => [...prev, file]);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (_) {
      setRecordError(t('crm.micDenied'));
    }
  };
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleAttach = (e) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };
  const removePendingFile = (idx) => setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  const submitNote = async () => {
    if (!body.trim() && pendingFiles.length === 0) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('body', body.trim());
      pendingFiles.forEach((f) => fd.append('files', f));
      const res = await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/users/me/notes`,
        data: fd,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNotes((prev) => [res.data, ...prev]);
      setTotal((prev) => prev + 1);
      setBody(''); setPendingFiles([]);
    } catch (_) { /* keep the draft on failure */ }
    setSubmitting(false);
  };

  const doDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!id) return;
    try {
      await authCtx.jwtInst({ method: 'delete', url: `${axiosGlobal.defaultTargetApi}/users/me/notes/${id}` });
      setNotes((prev) => prev.filter((n) => n._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (_) { /* non-fatal */ }
  };

  const openAttachment = (f) => {
    const url = `${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`;
    if (f.kind === 'document') { downloadFile(url, f.name); return; }
    setViewerMedia({ url, name: f.name, kind: f.kind === 'document' ? 'other' : (resolveMediaKind(f.name) === 'other' ? f.kind : resolveMediaKind(f.name)) });
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isXs} maxWidth="sm" fullWidth
      PaperProps={{ sx: {
        bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: isXs ? 0 : '14px', backgroundImage: 'none',
        height: isXs ? '100%' : '80vh', display: 'flex', flexDirection: 'column',
      }}}>

      <MediaViewer open={!!viewerMedia} onClose={() => setViewerMedia(null)} media={viewerMedia} />
      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={doDelete}
        title={t('users.deleteNoteTitle')}
        message={t('users.deleteNoteMessage')}
        confirmLabel={t('common.delete')}
        destructive
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NoteAltIcon sx={{ fontSize: 18, color: T.TEXT_SEC }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
            {t('users.myNotes')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, pt: 1, pb: 0.5, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <LockIcon sx={{ fontSize: 12, color: T.TEXT_TER }} />
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
          {t('users.notesPrivateHint')}
        </Typography>
      </Box>

      {/* ── Composer ── */}
      <Box sx={{ px: 3, py: 1.5, flexShrink: 0 }}>
        <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.ROW_BG, border: `1px solid ${T.DIVIDER}` }}>
          <TextField multiline minRows={2} fullWidth size="small"
            placeholder={t('users.notePlaceholder')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            sx={{ mb: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.INPUT_BD },
              '& textarea': { fontSize: '0.8rem', color: T.TEXT_PRI } }} />

          {recordError && (
            <Typography sx={{ fontSize: '0.7rem', color: '#EA005A', mb: 1 }}>{recordError}</Typography>
          )}

          {pendingFiles.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {pendingFiles.map((f, i) => (
                <Chip key={i} size="small"
                  label={f.name.length > 22 ? f.name.slice(0, 19) + '…' : f.name}
                  onDelete={() => removePendingFile(i)}
                  sx={{ height: 22, fontSize: '0.68rem',
                    bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', color: T.TEXT_SEC }} />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={recording ? t('crm.stopRecording') : t('crm.recordVoiceMessage')}>
              <IconButton size="small" onClick={recording ? stopRecording : startRecording}
                sx={{ color: recording ? '#EA005A' : T.TEXT_TER, width: 28, height: 28 }}>
                {recording ? <StopCircleIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title={t('crm.attachImageVideo')}>
              <IconButton size="small" component="label" sx={{ color: T.TEXT_TER, width: 28, height: 28 }}>
                <AttachFileIcon sx={{ fontSize: 17 }} />
                <input type="file" hidden multiple accept="image/*,video/*" onChange={handleAttach} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('users.attachDocument')}>
              <IconButton size="small" component="label" sx={{ color: T.TEXT_TER, width: 28, height: 28 }}>
                <DescriptionIcon sx={{ fontSize: 17 }} />
                <input type="file" hidden multiple onChange={handleAttach} />
              </IconButton>
            </Tooltip>
            {recording && (
              <Typography sx={{ fontSize: '0.7rem', color: '#EA005A', fontWeight: 600 }}>
                {t('crm.recording')}
              </Typography>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" variant="contained" startIcon={<SendIcon sx={{ fontSize: 13 }} />}
              onClick={submitNote} disabled={submitting || (!body.trim() && pendingFiles.length === 0)}
              sx={{ fontSize: '0.72rem', height: 28, textTransform: 'none', borderRadius: '7px', px: 1.5,
                bgcolor: T.BTN_BG, color: T.BTN_CLR,
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
              {submitting ? <CircularProgress size={12} color="inherit" /> : t('users.saveNote')}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Notes list ── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, pb: 2 }}>
        {loading && notes.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={54} sx={{ borderRadius: '10px' }} />
            ))}
          </Box>
        ) : notes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <NoteAltIcon sx={{ fontSize: 32, color: T.TEXT_TER, mb: 1 }} />
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>{t('users.noNotesYet')}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {notes.map((note) => (
              <Box key={note._id} sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.ROW_BG, border: `1px solid ${T.DIVIDER}` }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, flexGrow: 1 }}>
                    {relativeDate(note.insertDate, t)}
                  </Typography>
                  <IconButton size="small" onClick={() => setConfirmDeleteId(note._id)}
                    sx={{ color: T.TEXT_TER, width: 22, height: 22, '&:hover': { color: '#EA005A' } }}>
                    <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>

                {note.body && (
                  <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_PRI, mt: 0.25,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {note.body}
                  </Typography>
                )}

                {(note.files || []).length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.75 }}>
                    {note.files.filter((f) => f.kind === 'audio').map((f, i) => (
                      <audio key={i} controls preload="none" style={{ height: 32, maxWidth: 260 }}
                        src={`${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`} />
                    ))}
                    {note.files.some((f) => f.kind !== 'audio') && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {note.files.filter((f) => f.kind !== 'audio').map((f, i) => {
                          const thumbUrl = f.kind === 'image'
                            ? `${axiosGlobal.defaultTargetApi}/uploads/${f.thumbnail || f.diskName}`
                            : (f.thumbnail ? `${axiosGlobal.defaultTargetApi}/uploads/${f.thumbnail}` : null);
                          return (
                            <Box key={i} onClick={() => openAttachment(f)}
                              sx={{ width: 72, display: 'flex', flexDirection: 'column', gap: 0.4, cursor: 'pointer' }}>
                              <Box sx={{ width: 72, height: 72, borderRadius: '8px', overflow: 'hidden',
                                border: `1px solid ${T.DIVIDER}`, position: 'relative',
                                bgcolor: isDark ? '#111' : '#f2f2f2',
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {thumbUrl ? (
                                  <Box component="img" src={thumbUrl} alt={f.name}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : f.kind === 'document' ? (
                                  <DescriptionIcon sx={{ fontSize: 26, color: T.TEXT_TER }} />
                                ) : (
                                  <ImageIcon sx={{ fontSize: 26, color: T.TEXT_TER }} />
                                )}
                                {f.kind === 'video' && (
                                  <PlayCircleIcon sx={{ position: 'absolute', top: '50%', left: '50%',
                                    transform: 'translate(-50%,-50%)', fontSize: 24, color: '#fff',
                                    filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.6))' }} />
                                )}
                                {f.kind === 'document' && (
                                  <DownloadIcon sx={{ position: 'absolute', bottom: 3, right: 3, fontSize: 13,
                                    color: T.TEXT_SEC }} />
                                )}
                              </Box>
                              <Typography noWrap sx={{ fontSize: '0.62rem', color: T.TEXT_TER }}>
                                {f.name}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            ))}

            {hasMore && (
              <Box sx={{ textAlign: 'center', pt: 0.5 }}>
                <Button size="small" onClick={() => load(page + 1)} disabled={loading}
                  sx={{ fontSize: '0.72rem', color: T.TEXT_TER, textTransform: 'none' }}>
                  {loading ? <CircularProgress size={12} sx={{ mr: 0.5 }} /> : null}
                  {t('crm.loadMore')}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default MyNotesModal;
