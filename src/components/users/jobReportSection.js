import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageIcon from '@mui/icons-material/Image';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DownloadIcon from '@mui/icons-material/Download';
import EventIcon from '@mui/icons-material/Event';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import MediaViewer, { downloadFile } from '../digitalMarketing/mediaViewer';

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtDateTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

// ── Attachment gallery — shared between the compact list row and the paper
// detail view (just a bigger tile size there).
const ReportAttachments = ({ files, T, isDark, axiosGlobal, onOpen, size = 68 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
    {files.filter((f) => f.kind === 'audio').map((f, i) => (
      <audio key={i} controls preload="none" style={{ height: 32, maxWidth: 280 }}
        src={`${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`} />
    ))}
    {files.some((f) => f.kind !== 'audio') && (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {files.filter((f) => f.kind !== 'audio').map((f, i) => {
          const thumbUrl = f.kind === 'image'
            ? `${axiosGlobal.defaultTargetApi}/uploads/${f.thumbnail || f.diskName}`
            : (f.thumbnail ? `${axiosGlobal.defaultTargetApi}/uploads/${f.thumbnail}` : null);
          return (
            <Box key={i} onClick={() => onOpen(f)}
              sx={{ width: size, display: 'flex', flexDirection: 'column', gap: 0.4, cursor: 'pointer' }}>
              <Box sx={{ width: size, height: size, borderRadius: '8px', overflow: 'hidden',
                border: `1px solid ${T.DIVIDER}`, position: 'relative',
                bgcolor: isDark ? '#111' : '#f2f2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {thumbUrl ? (
                  <Box component="img" src={thumbUrl} alt={f.name}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : f.kind === 'document' ? (
                  <DescriptionIcon sx={{ fontSize: size * 0.35, color: T.TEXT_TER }} />
                ) : (
                  <ImageIcon sx={{ fontSize: size * 0.35, color: T.TEXT_TER }} />
                )}
                {f.kind === 'video' && (
                  <PlayCircleIcon sx={{ position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)', fontSize: size * 0.32, color: '#fff',
                    filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.6))' }} />
                )}
                {f.kind === 'document' && (
                  <DownloadIcon sx={{ position: 'absolute', bottom: 3, right: 3, fontSize: 12, color: T.TEXT_SEC }} />
                )}
              </Box>
              <Typography noWrap sx={{ fontSize: '0.6rem', color: T.TEXT_TER, width: size }}>{f.name}</Typography>
            </Box>
          );
        })}
      </Box>
    )}
  </Box>
);

// ── Follow-up / reply thread — shared shape for both, distinguished by an
// accent color (follow-ups = the report owner's own updates; replies = an
// admin's response). Chronologically merged so the whole conversation reads
// as one timeline rather than two separate lists.
const ReportThread = ({ report, T }) => {
  const { t } = useTranslation();
  const entries = [
    ...(report.followUps || []).map((f) => ({ ...f, kind: 'followUp' })),
    ...(report.replies || []).map((r) => ({ ...r, kind: 'reply' })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!entries.length) return null;

  return (
    <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase',
        letterSpacing: 1, fontWeight: 600 }}>
        {t('users.reportThreadLabel')}
      </Typography>
      {entries.map((e, i) => (
        <Box key={i} sx={{
          p: 1.25, borderRadius: '10px',
          bgcolor: e.kind === 'reply' ? 'rgba(178,106,0,0.08)' : 'rgba(100,181,246,0.08)',
          borderLeft: `3px solid ${e.kind === 'reply' ? '#B26A00' : '#64b5f6'}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.TEXT_PRI }}>
              {e.authorName || '—'}
            </Typography>
            <Chip size="small" label={e.kind === 'reply' ? t('users.replyChip') : t('users.followUpChip')}
              sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700,
                bgcolor: e.kind === 'reply' ? '#B26A00' : '#64b5f6', color: '#fff', '& .MuiChip-label': { px: 0.6 } }} />
            <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, ml: 'auto' }}>
              {fmtDateTime(e.date)}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {e.body}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// Compact composer reused for both "add a follow-up" (report owner) and
// "reply" (admin) — same shape, different verb/handler.
const ThreadComposer = ({ label, buttonLabel, onSubmit, T, accent }) => {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async () => {
    if (!value.trim()) return;
    setSending(true);
    try { await onSubmit(value.trim()); setValue(''); } finally { setSending(false); }
  };
  return (
    <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
      <TextField size="small" fullWidth multiline maxRows={4} placeholder={label} value={value}
        onChange={(e) => setValue(e.target.value)}
        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '8px' },
          '& textarea': { fontSize: '0.8rem', color: T.TEXT_PRI } }} />
      <Button size="small" variant="contained" onClick={submit} disabled={sending || !value.trim()}
        sx={{ flexShrink: 0, textTransform: 'none', fontSize: '0.75rem', borderRadius: '8px',
          bgcolor: accent, color: '#fff', '&:hover': { bgcolor: accent, opacity: 0.9 } }}>
        {sending ? <CircularProgress size={13} sx={{ color: 'inherit' }} /> : buttonLabel}
      </Button>
    </Box>
  );
};

// ── Report Details — a paper-like single-record view (bold date header,
// full body, attachments, and the "any possible information" footer).
// onAddFollowUp: provided only when the viewer OWNS the report.
// onReply: provided only when the viewer holds jobReports:reply (admin mode).
const JobReportDetail = ({ open, onClose, report, T, isXs, isDark, axiosGlobal, onOpenAttachment,
  onAddFollowUp, onReply, authorName }) => {
  const { t } = useTranslation();
  if (!report) return null;
  return (
    <Dialog open={open} onClose={onClose} fullScreen={isXs} maxWidth="sm" fullWidth
      PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', backgroundImage: 'none' } }}>
      <Paper elevation={0} sx={{
        bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: isXs ? 0 : '16px', overflow: 'hidden',
        boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.55)' : '0 16px 40px rgba(0,0,0,0.14)',
      }}>
        {/* Paper accent edge */}
        <Box sx={{ height: 4, bgcolor: '#64b5f6' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          px: { xs: 2.5, sm: 4 }, pt: 3, pb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase',
              letterSpacing: 1.5, mb: 0.5, fontWeight: 600 }}>
              {t('users.jobReportsHeader')}
            </Typography>
            <Typography sx={{ fontSize: { xs: '1.3rem', sm: '1.7rem' }, fontWeight: 800,
              color: T.TEXT_PRI, lineHeight: 1.15 }}>
              {fmtDate(report.reportDate)}
            </Typography>
            {authorName && (
              <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC, mt: 0.5 }}>
                {t('users.reportByAuthor', { name: authorName })}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: T.TEXT_SEC, flexShrink: 0 }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: T.DIVIDER }} />

        <Box sx={{ px: { xs: 2.5, sm: 4 }, py: 3, maxHeight: '60vh', overflowY: 'auto' }}>
          {report.title && (
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: T.TEXT_PRI, mb: 1.5 }}>
              {report.title}
            </Typography>
          )}

          {report.body ? (
            <Typography sx={{ fontSize: '0.9rem', color: T.TEXT_SEC, lineHeight: 1.85,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {report.body}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_TER, fontStyle: 'italic' }}>
              {t('users.noReportBody')}
            </Typography>
          )}

          {(report.files || []).length > 0 && (
            <Box sx={{ mt: 2.5 }}>
              <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase',
                letterSpacing: 1, mb: 1, fontWeight: 600 }}>
                {t('users.attachmentsLabel')}
              </Typography>
              <ReportAttachments files={report.files} T={T} isDark={isDark} axiosGlobal={axiosGlobal}
                onOpen={onOpenAttachment} size={84} />
            </Box>
          )}

          <ReportThread report={report} T={T} />

          {onAddFollowUp && (
            <ThreadComposer label={t('users.followUpPlaceholder')} buttonLabel={t('users.addFollowUp')}
              onSubmit={onAddFollowUp} T={T} accent="#64b5f6" />
          )}
          {onReply && (
            <ThreadComposer label={t('users.replyPlaceholder')} buttonLabel={t('users.sendReply')}
              onSubmit={onReply} T={T} accent="#B26A00" />
          )}

          <Divider sx={{ my: 2.5, borderColor: T.DIVIDER }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
              {t('users.reportLoggedOn', { date: fmtDateTime(report.insertDate) })}
            </Typography>
            {report.updateDate && (
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
                {t('users.reportLastEdited', { date: fmtDateTime(report.updateDate) })}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Dialog>
  );
};

// ── The add/edit composer — a Dialog so it can be reused for both flows ───────
const JobReportForm = ({ open, onClose, onSaved, userId, editingReport, T, isXs, isDark }) => {
  const { t }       = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [reportDate, setReportDate] = useState(todayStr());
  const [title, setTitle]           = useState('');
  const [body, setBody]             = useState('');
  const [existingFiles, setExistingFiles] = useState([]);   // files already on the report
  const [removedFileIds, setRemovedFileIds] = useState([]); // existing fileIds queued for removal
  const [pendingFiles, setPendingFiles]     = useState([]); // new File[] to upload
  const [recording, setRecording]   = useState(false);
  const [recordError, setRecordError] = useState('');
  const [saving, setSaving]         = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);

  useEffect(() => {
    if (!open) return;
    if (editingReport) {
      setReportDate(editingReport.reportDate ? new Date(editingReport.reportDate).toISOString().slice(0, 10) : todayStr());
      setTitle(editingReport.title || '');
      setBody(editingReport.body || '');
      setExistingFiles(editingReport.files || []);
    } else {
      setReportDate(todayStr());
      setTitle('');
      setBody('');
      setExistingFiles([]);
    }
    setRemovedFileIds([]);
    setPendingFiles([]);
    setRecordError('');
  }, [open, editingReport]);

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
        const file = new File([blob], `voice-report-${Date.now()}.webm`, { type: 'audio/webm' });
        setPendingFiles((prev) => [...prev, file]);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (_) {
      setRecordError(t('crm.micDenied'));
    }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const handleAttach = (e) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };
  const removePendingFile = (idx) => setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  const removeExistingFile = (fileId) => {
    setExistingFiles((prev) => prev.filter((f) => String(f.fileId) !== String(fileId)));
    setRemovedFileIds((prev) => [...prev, fileId]);
  };

  const save = async () => {
    if (!title.trim() && !body.trim() && pendingFiles.length === 0 && existingFiles.length === 0) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('reportDate', reportDate);
      fd.append('title', title.trim());
      fd.append('body', body.trim());
      pendingFiles.forEach((f) => fd.append('files', f));
      if (editingReport) {
        fd.append('removeFileIds', JSON.stringify(removedFileIds));
        await authCtx.jwtInst({
          method: 'put',
          url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/${editingReport._id}`,
          data: fd, headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await authCtx.jwtInst({
          method: 'post',
          url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports`,
          data: fd, headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSaved();
      onClose();
    } catch (_) { /* keep the draft open on failure */ }
    setSaving(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isXs} maxWidth="sm" fullWidth
      PaperProps={{ sx: {
        bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: isXs ? 0 : '14px', backgroundImage: 'none',
      }}}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {editingReport ? t('users.editJobReport') : t('users.newJobReport')}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField label={t('users.reportDateLabel')} type="date" size="small" fullWidth
          value={reportDate} onChange={(e) => setReportDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI },
            '& input': { color: T.TEXT_PRI } }} />

        <TextField label={t('users.reportTitleLabel')} size="small" fullWidth
          value={title} onChange={(e) => setTitle(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI },
            '& input': { color: T.TEXT_PRI } }} />

        <TextField multiline minRows={4} fullWidth size="small"
          placeholder={t('users.reportBodyPlaceholder')}
          value={body} onChange={(e) => setBody(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' },
            '& textarea': { fontSize: '0.85rem', color: T.TEXT_PRI } }} />

        {recordError && <Typography sx={{ fontSize: '0.7rem', color: '#EA005A' }}>{recordError}</Typography>}

        {existingFiles.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {existingFiles.map((f) => (
              <Chip key={String(f.fileId)} size="small"
                label={f.name?.length > 22 ? f.name.slice(0, 19) + '…' : f.name}
                onDelete={() => removeExistingFile(f.fileId)}
                sx={{ height: 22, fontSize: '0.68rem', bgcolor: T.INPUT_BG, color: T.TEXT_SEC }} />
            ))}
          </Box>
        )}
        {pendingFiles.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {pendingFiles.map((f, i) => (
              <Chip key={i} size="small"
                label={f.name.length > 22 ? f.name.slice(0, 19) + '…' : f.name}
                onDelete={() => removePendingFile(i)}
                sx={{ height: 22, fontSize: '0.68rem', bgcolor: 'rgba(100,181,246,0.15)', color: '#64b5f6' }} />
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
            <Typography sx={{ fontSize: '0.7rem', color: '#EA005A', fontWeight: 600 }}>{t('crm.recording')}</Typography>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onClose} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={save} disabled={saving}
            startIcon={saving ? <CircularProgress size={13} color="inherit" /> : null}
            sx={{ fontSize: '0.78rem', textTransform: 'none', borderRadius: '8px', px: 2.5,
              bgcolor: T.BTN_BG, color: T.BTN_CLR,
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
            {saving ? t('users.saving') : t('common.save')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

// ── Job Reports section — rendered as a card on the user's profile ────────────
const JobReportSection = ({ userId, isSelf }) => {
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

  const [reports, setReports] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [viewerMedia, setViewerMedia] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/users/${userId}/jobReports`,
        params: { page: pg, limit: 20, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
      });
      setReports((prev) => (pg === 1 ? (res.data.data || []) : [...prev, ...(res.data.data || [])]));
      setTotal(res.data.total || 0);
      setPage(pg);
    } catch (_) { /* non-fatal */ }
    setLoading(false);
  }, [authCtx, axiosGlobal, userId, dateFrom, dateTo]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => { setHasMore(reports.length < total); }, [reports, total]);

  const openAdd = () => { setEditingReport(null); setFormOpen(true); };
  const openEdit = (report) => { setEditingReport(report); setFormOpen(true); };

  const doDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!id) return;
    try {
      await authCtx.jwtInst({ method: 'delete', url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/${id}` });
      setReports((prev) => prev.filter((r) => r._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (_) { /* non-fatal */ }
  };

  // Follow-ups are additive (never overwrite the original entry — see
  // touchLastActivity on the backend), so the response already carries the
  // full updated report; just swap it into both the list and the open detail
  // view rather than re-fetching.
  const addFollowUp = async (reportId, body) => {
    const res = await authCtx.jwtInst({
      method: 'post',
      url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/${reportId}/followUp`,
      data: { body },
    });
    const updated = res.data;
    setReports((prev) => prev.map((r) => (r._id === reportId ? updated : r)));
    setViewingReport((prev) => (prev && prev._id === reportId ? updated : prev));
  };

  const openAttachment = (f) => {
    const url = `${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`;
    if (f.kind === 'document') { downloadFile(url, f.name); return; }
    setViewerMedia({ url, name: f.name, kind: f.kind });
  };

  const clearFilters = () => { setDateFrom(''); setDateTo(''); };

  return (
    <Box sx={{ p: 2.5, bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: '14px' }}>
      <MediaViewer open={!!viewerMedia} onClose={() => setViewerMedia(null)} media={viewerMedia} />
      <JobReportForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => load(1)}
        userId={userId} editingReport={editingReport} T={T} isXs={isXs} isDark={isDark} />
      <JobReportDetail open={!!viewingReport} onClose={() => setViewingReport(null)}
        report={viewingReport} T={T} isXs={isXs} isDark={isDark} axiosGlobal={axiosGlobal}
        onOpenAttachment={openAttachment}
        onAddFollowUp={isSelf ? (body) => addFollowUp(viewingReport._id, body) : undefined} />
      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={doDelete}
        title={t('users.deleteReportTitle')}
        message={t('users.deleteReportMessage')}
        confirmLabel={t('common.delete')}
        destructive
      />

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <AssignmentIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, flexGrow: 1 }}>
          {t('users.jobReportsHeader')}
        </Typography>
        {total > 0 && (
          <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
            {t('users.entriesCount', { count: total })}
          </Typography>
        )}
        {isSelf && (
          <Button size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />} onClick={openAdd}
            sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px', px: 1.5,
              bgcolor: T.BTN_BG, color: T.BTN_CLR,
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
            {t('users.newJobReport')}
          </Button>
        )}
      </Box>

      {/* Date filter */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <EventIcon sx={{ fontSize: 15, color: T.TEXT_TER }} />
        <TextField type="date" size="small" label={t('users.dateFromLabel')} value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 160 },
            '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', color: T.TEXT_PRI, fontSize: '0.78rem' } }} />
        <TextField type="date" size="small" label={t('users.dateToLabel')} value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 160 },
            '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', color: T.TEXT_PRI, fontSize: '0.78rem' } }} />
        {(dateFrom || dateTo) && (
          <Tooltip title={t('users.clearDateFilter')}>
            <IconButton size="small" onClick={clearFilters} sx={{ color: T.TEXT_TER }}>
              <FilterAltOffIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* List */}
      {loading && reports.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: '10px' }} />
          ))}
        </Box>
      ) : reports.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1, opacity: 0.4 }}>
          <AssignmentIcon sx={{ fontSize: 32, color: T.TEXT_TER }} />
          <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_TER }}>{t('users.noJobReportsYet')}</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {reports.map((report) => (
            <Box key={report._id} onClick={() => setViewingReport(report)}
              sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.ROW_BG, border: `1px solid ${T.DIVIDER}`,
                cursor: 'pointer', transition: 'border-color 0.15s',
                '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip icon={<EventIcon sx={{ fontSize: '13px !important' }} />} label={fmtDate(report.reportDate)}
                  size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700,
                    bgcolor: 'rgba(100,181,246,0.12)', color: '#64b5f6' }} />
                {report.title && (
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.TEXT_PRI }}>
                    {report.title}
                  </Typography>
                )}
                <Box sx={{ flexGrow: 1 }} />
                {isSelf && (
                  <>
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(report); }}
                        sx={{ color: T.TEXT_TER, width: 24, height: 24, '&:hover': { color: T.TEXT_PRI } }}>
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(report._id); }}
                        sx={{ color: T.TEXT_TER, width: 24, height: 24, '&:hover': { color: '#EA005A' } }}>
                        <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>

              {report.body && (
                <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC, mt: 0.5,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {report.body}
                </Typography>
              )}

              {(report.files || []).length > 0 && (
                <Box sx={{ mt: 0.75 }} onClick={(e) => e.stopPropagation()}>
                  <ReportAttachments files={report.files} T={T} isDark={isDark} axiosGlobal={axiosGlobal}
                    onOpen={openAttachment} size={68} />
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
  );
};

// Named exports — reused by jobReportsAdminList.js so the admin-mode list
// (rendered inside the new top-level jobReportsMainSection.js) shares the
// exact same detail dialog, attachment gallery and date formatting instead of
// forking a second copy.
export { JobReportDetail, ReportAttachments, fmtDate, fmtDateTime, todayStr };
export default JobReportSection;
