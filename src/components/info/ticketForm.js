import { useState, useEffect, useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { actions } from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import useVoiceRecorder from '../../tools/hooks/useVoiceRecorder';
import uploadErrorMessage from '../../tools/uploadError';
import { lastPath } from '../../tools/lastPath';
import { APP_VERSION } from './changelog';
import { createTicket, updateTicket } from './feedbackApi';
import { TICKET_TYPES, TICKET_AREAS, LIMITS, areaForPath } from './ticketMeta';

// ── at MODULE scope: a component declared inside another is a new type on every
// render and would remount its subtree (the caret leaves the field mid-typing).

const fmtSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function BlockTitle({ title, hint, T }) {
  return (
    <Box sx={{ mb: 0.75 }}>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.TEXT_SEC }}>
        {title}
      </Typography>
      {hint && <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_TER, mt: 0.25 }}>{hint}</Typography>}
    </Box>
  );
}

function TypeOption({ option, selected, onSelect, T, t }) {
  const { Icon, color } = option;
  return (
    <Box role="radio" aria-checked={selected} tabIndex={0}
      onClick={() => onSelect(option.value)}
      onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); onSelect(option.value); } }}
      sx={{
        flex: 1, p: 1.25, borderRadius: '12px', cursor: 'pointer', userSelect: 'none',
        border: `1.5px solid ${selected ? color : T.CARD_BD}`,
        bgcolor: selected ? `${color}14` : T.INPUT_BG,
        display: 'flex', flexDirection: 'column', gap: 0.25,
        '&:hover': { borderColor: selected ? color : T.TEXT_TER },
        transition: 'border-color 0.12s, background-color 0.12s',
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Icon sx={{ fontSize: 18, color: selected ? color : T.TEXT_SEC }} />
        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: T.TEXT_PRI }}>{t(option.labelKey)}</Typography>
      </Box>
      <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>{t(option.hintKey)}</Typography>
    </Box>
  );
}

function FileRow({ entry, onRemove, T, t }) {
  const isImage = String(entry.file.type).startsWith('image/');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: '10px',
      bgcolor: T.INPUT_BG, border: `1px solid ${T.CARD_BD}` }}>
      <Box sx={{ width: 36, height: 36, borderRadius: '7px', overflow: 'hidden', flexShrink: 0, bgcolor: T.CARD_BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isImage
          ? <Box component="img" src={entry.url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <AttachFileIcon sx={{ fontSize: 17, color: T.TEXT_TER }} />}
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography noWrap sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>{entry.file.name}</Typography>
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>{fmtSize(entry.file.size)}</Typography>
      </Box>
      <IconButton size="small" aria-label={t('info.removeFile')} onClick={() => onRemove(entry.id)}
        sx={{ color: T.TEXT_TER, '&:hover': { color: T.ERR_CLR } }}>
        <DeleteOutlineIcon sx={{ fontSize: 17 }} />
      </IconButton>
    </Box>
  );
}

// An attachment the ticket already holds (edit mode). Removing it only marks it:
// nothing is deleted until Save, and "Undo" brings it back.
function ExistingRow({ att, removed, onToggle, apiBase, T, t }) {
  const isImage = att.kind === 'image';
  const thumb = att.thumbnail || att.diskName;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: '10px',
      bgcolor: T.INPUT_BG, border: `1px solid ${T.CARD_BD}`, opacity: removed ? 0.5 : 1 }}>
      {att.isVoice ? (
        <>
          <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_SEC, flexShrink: 0, pl: 0.5,
            textDecoration: removed ? 'line-through' : 'none' }}>
            {t('info.voiceNoteSaved')}
          </Typography>
          {!removed && <Box component="audio" controls preload="metadata" src={`${apiBase}/uploads/${att.diskName}`}
            sx={{ flexGrow: 1, minWidth: 0, height: 32 }} />}
          {removed && <Box sx={{ flexGrow: 1 }} />}
        </>
      ) : (
        <>
          <Box sx={{ width: 36, height: 36, borderRadius: '7px', overflow: 'hidden', flexShrink: 0, bgcolor: T.CARD_BG,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isImage
              ? <Box component="img" src={`${apiBase}/uploads/${thumb}`} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <AttachFileIcon sx={{ fontSize: 17, color: T.TEXT_TER }} />}
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography noWrap sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, textDecoration: removed ? 'line-through' : 'none' }}>{att.name}</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>{fmtSize(att.size)}</Typography>
          </Box>
        </>
      )}
      {removed ? (
        <Button size="small" onClick={() => onToggle(String(att.fileId))}
          sx={{ textTransform: 'none', fontSize: '0.72rem', color: T.TEXT_SEC, minWidth: 0, flexShrink: 0 }}>
          {t('info.undoRemove')}
        </Button>
      ) : (
        <IconButton size="small" aria-label={t('info.removeFile')} onClick={() => onToggle(String(att.fileId))}
          sx={{ color: T.TEXT_TER, '&:hover': { color: T.ERR_CLR } }}>
          <DeleteOutlineIcon sx={{ fontSize: 17 }} />
        </IconButton>
      )}
    </Box>
  );
}

// Creates a report — or, given `ticket`, edits one the person already sent.
export default function TicketForm({ open, onClose, onCreated, ticket, onSaved, onLocked }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const apiBase = axiosGlobal.defaultTargetApi;
  const editing = Boolean(ticket);

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    CARD_BG:   isDark ? '#151515'                : 'rgba(0,0,0,0.02)',
    CARD_BD:   isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    ERR_CLR:   '#FF4D8D',
  };
  const fieldSx = { '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } };

  const [type, setType] = useState('bug');
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('other');
  const [description, setDescription] = useState('');
  const [voiceNotes, setVoiceNotes] = useState([]);   // [{ id, file, url }]
  const [files, setFiles] = useState([]);             // [{ id, file, url }]
  const [includeContext, setIncludeContext] = useState(true);
  const [existing, setExisting] = useState([]);        // attachments the ticket already holds (edit)
  const [removed, setRemoved] = useState([]);          // ids of those the person took off
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Every object URL made for a preview, so none outlives the form.
  const urlsRef = useRef(new Set());
  const idRef = useRef(0);
  const nextId = () => { idRef.current += 1; return idRef.current; };
  const makeEntry = (file) => {
    const url = URL.createObjectURL(file);
    urlsRef.current.add(url);
    return { id: nextId(), file, url };
  };
  const releaseUrls = () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current.clear();
  };

  const recorder = useVoiceRecorder({
    filePrefix: 'voice',
    onRecorded: (file) => setVoiceNotes((prev) => [...prev, makeEntry(file)]),
  });

  // A fresh form each time it opens: empty and pointed at the section the person
  // was in — or, when editing, filled with the report as it was sent. Keyed on the
  // ticket's id, not the object: a refetch behind the form must not wipe typing.
  useEffect(() => {
    if (!open) return undefined;
    releaseUrls();
    setVoiceNotes([]); setFiles([]); setRemoved([]);
    setSaving(false); setProgress(null); setError('');
    if (ticket) {
      setType(ticket.type); setTitle(ticket.title); setDescription(ticket.description || '');
      setArea(ticket.area || 'other'); setExisting(ticket.attachments || []);
    } else {
      setType('bug'); setTitle(''); setDescription(''); setExisting([]);
      setIncludeContext(true);
      setArea(areaForPath(lastPath()));
    }
    return releaseUrls;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket && ticket._id]);

  // What the report will hold once saved: what it has, minus what was taken off,
  // plus what is new. The limits apply to THAT, not to this request alone.
  const keptExisting = existing.filter((a) => !removed.includes(String(a.fileId)));
  const keptFileCount = keptExisting.filter((a) => !a.isVoice).length;
  const keptVoiceCount = keptExisting.filter((a) => a.isVoice).length;
  const fileTotal = keptFileCount + files.length;
  const voiceTotal = keptVoiceCount + voiceNotes.length;

  const dirty = editing
    ? Boolean(type !== ticket.type || title.trim() !== ticket.title
      || description.trim() !== String(ticket.description || '').trim()
      || area !== (ticket.area || 'other') || removed.length || voiceNotes.length || files.length)
    : Boolean(title.trim() || description.trim() || voiceNotes.length || files.length);

  const toggleRemoved = (id) => setRemoved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleClose = () => {
    if (saving) return;
    if (recorder.recording) recorder.stop();
    if (dirty) { setConfirmDiscard(true); return; }
    onClose();
  };
  const discardAndClose = () => { setConfirmDiscard(false); onClose(); };

  const addFiles = (list) => {
    // A real array BEFORE the caller clears the input — clearing it empties the
    // live FileList, and a state updater runs later, during the re-render.
    const picked = Array.from(list || []);
    if (!picked.length) return;
    setError('');
    setFiles((prev) => {
      const room = Math.max(0, LIMITS.maxFiles - keptFileCount - prev.length);
      return [...prev, ...picked.slice(0, room).map(makeEntry)];
    });
    if (fileTotal + picked.length > LIMITS.maxFiles) setError(t('info.tooManyFiles', { count: LIMITS.maxFiles }));
  };
  const removeFile = (id) => setFiles((prev) => {
    const gone = prev.find((f) => f.id === id);
    if (gone) { URL.revokeObjectURL(gone.url); urlsRef.current.delete(gone.url); }
    return prev.filter((f) => f.id !== id);
  });
  const removeVoice = (id) => setVoiceNotes((prev) => {
    const gone = prev.find((v) => v.id === id);
    if (gone) { URL.revokeObjectURL(gone.url); urlsRef.current.delete(gone.url); }
    return prev.filter((v) => v.id !== id);
  });

  // A screenshot pasted from the clipboard is the usual attachment to a bug.
  const handlePaste = (e) => {
    const pasted = Array.from((e.clipboardData && e.clipboardData.files) || []);
    if (!pasted.length) return;           // plain text: let the field have it
    addFiles(pasted.map((f, i) => (/^image\.\w+$/i.test(f.name)
      ? new File([f], `screenshot-${Date.now()}-${i}.${f.type.split('/')[1] || 'png'}`, { type: f.type })
      : f)));
  };

  const buildContext = () => ({
    appVersion: APP_VERSION,
    path: lastPath(),
    language: (i18n.language || 'en').slice(0, 2),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: navigator.userAgent,
  });
  const contextSummary = [`v${APP_VERSION}`, lastPath() || '—', `${window.innerWidth}×${window.innerHeight}`].join(' · ');

  const handleSend = async () => {
    if (!title.trim()) { setError(t('info.needTitle')); return; }
    if (!description.trim() && !voiceTotal && !fileTotal) { setError(t('info.needSomething')); return; }
    if (recorder.recording) recorder.stop();

    setSaving(true); setError(''); setProgress(0);
    try {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('title', title.trim());
      fd.append('area', area);
      fd.append('description', description.trim());
      // The technical details were captured when the report was first sent; an
      // edit never re-captures (or drops) them.
      if (!editing) {
        fd.append('includeContext', String(includeContext));
        if (includeContext) fd.append('context', JSON.stringify(buildContext()));
      } else {
        fd.append('removeFileIds', JSON.stringify(removed));
      }
      files.forEach((f) => fd.append('attachments', f.file));
      voiceNotes.forEach((v) => fd.append('voice', v.file));

      const onProgress = (e) => setProgress(e.total ? Math.round((100 * e.loaded) / e.total) : null);
      if (editing) {
        const saved = await updateTicket(authCtx, axiosGlobal, ticket._id, fd, onProgress);
        dispatch(actions.setShowSnackBar({ status: true, msg: t('info.savedToast', { code: saved.code }), type: 'success' }));
        if (onSaved) onSaved(saved);
      } else {
        const created = await createTicket(authCtx, axiosGlobal, fd, onProgress);
        dispatch(actions.setShowSnackBar({ status: true, msg: t('info.sentToast', { code: created.code }), type: 'success' }));
        if (onCreated) onCreated(created);
      }
      onClose();
    } catch (err) {
      // uploadErrorMessage names a proxy's size cap or a dropped connection;
      // the API's own messages (validation, the hourly limit, "already being
      // handled") win over it.
      setError(uploadErrorMessage(err, editing ? t('info.saveFailed') : t('info.sendFailed')));
      // Somebody picked the report up while it was open on screen: tell the page
      // behind, so it stops offering Edit.
      if (editing && err && err.response && err.response.data && err.response.data.code === 'FEEDBACK_LOCKED' && onLocked) onLocked();
    } finally {
      setSaving(false);
    }
  };

  const voiceFull = voiceTotal >= LIMITS.maxVoice;
  const micMessage = recorder.error === 'denied' ? t('info.micDenied')
    : (recorder.error === 'unsupported' || !recorder.supported) ? t('info.micUnsupported') : '';

  return (
    <>
      <Drawer anchor="right" open={open} onClose={handleClose}
        PaperProps={{ sx: { width: isXs ? '100vw' : 480, bgcolor: T.DIALOG_BG, backgroundImage: 'none' } }}>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
            {editing ? t('info.editTitle', { code: ticket.code }) : t('info.formTitle')}
          </Typography>
          <IconButton size="small" onClick={handleClose} aria-label={t('common.close')} sx={{ color: T.TEXT_SEC }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box onPaste={handlePaste}
          sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          <Box>
            <BlockTitle T={T} title={t('info.formTypeLabel')} />
            <Box role="radiogroup" sx={{ display: 'flex', gap: 1 }}>
              {TICKET_TYPES.map((option) => (
                <TypeOption key={option.value} option={option} T={T} t={t}
                  selected={type === option.value} onSelect={setType} />
              ))}
            </Box>
          </Box>

          <TextField label={t('info.fieldTitle')} size="small" fullWidth value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'bug' ? t('info.titlePlaceholderBug') : t('info.titlePlaceholderSuggestion')}
            inputProps={{ maxLength: LIMITS.titleMax }}
            helperText={`${title.length}/${LIMITS.titleMax}`} sx={fieldSx} />

          <TextField select label={t('info.fieldSection')} size="small" fullWidth value={area}
            onChange={(e) => setArea(e.target.value)}
            SelectProps={{ native: true }} InputLabelProps={{ shrink: true }} sx={fieldSx}>
            {TICKET_AREAS.map((a) => <option key={a.value} value={a.value}>{t(a.labelKey)}</option>)}
          </TextField>

          <TextField label={t('info.fieldDescription')} size="small" fullWidth multiline minRows={5} maxRows={14}
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={type === 'bug' ? t('info.descPlaceholderBug') : t('info.descPlaceholderSuggestion')}
            inputProps={{ maxLength: LIMITS.descriptionMax }} sx={fieldSx} />

          {/* ── voice ── */}
          <Box>
            <BlockTitle T={T} title={t('info.voiceTitle')} hint={t('info.voiceHint')} />
            {recorder.supported && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                {recorder.recording ? (
                  <Button onClick={recorder.stop} startIcon={<StopCircleIcon />} variant="contained"
                    sx={{ textTransform: 'none', borderRadius: '10px', bgcolor: T.ERR_CLR, '&:hover': { bgcolor: T.ERR_CLR } }}>
                    {t('info.stop')}
                  </Button>
                ) : (
                  <Button onClick={recorder.start} startIcon={<MicIcon />} disabled={voiceFull || saving}
                    sx={{ textTransform: 'none', borderRadius: '10px', color: T.TEXT_PRI, bgcolor: T.INPUT_BG,
                      border: `1px solid ${T.INPUT_BD}`, '&:hover': { bgcolor: T.CARD_BD } }}>
                    {t('info.record')}
                  </Button>
                )}
                {recorder.recording && (
                  <Typography sx={{ fontSize: '0.8rem', color: T.ERR_CLR, fontVariantNumeric: 'tabular-nums' }}>
                    {t('info.recordingNow', { time: fmtClock(recorder.seconds) })}
                  </Typography>
                )}
                {voiceFull && !recorder.recording && (
                  <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>{t('info.voiceLimit', { count: LIMITS.maxVoice })}</Typography>
                )}
              </Box>
            )}
            {micMessage && <Typography sx={{ fontSize: '0.76rem', color: T.ERR_CLR, mt: 0.75 }}>{micMessage}</Typography>}
            {existing.some((a) => a.isVoice) && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1.25 }}>
                {existing.filter((a) => a.isVoice).map((a) => (
                  <ExistingRow key={a.fileId} att={a} removed={removed.includes(String(a.fileId))}
                    onToggle={toggleRemoved} apiBase={apiBase} T={T} t={t} />
                ))}
              </Box>
            )}
            {voiceNotes.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1.25 }}>
                {voiceNotes.map((v, i) => (
                  <Box key={v.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: '10px',
                    bgcolor: T.INPUT_BG, border: `1px solid ${T.CARD_BD}` }}>
                    <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_SEC, flexShrink: 0, pl: 0.5 }}>
                      {t('info.voiceNoteN', { n: i + 1 })}
                    </Typography>
                    <Box component="audio" controls src={v.url} sx={{ flexGrow: 1, minWidth: 0, height: 32 }} />
                    <IconButton size="small" aria-label={t('info.removeFile')} onClick={() => removeVoice(v.id)}
                      sx={{ color: T.TEXT_TER, '&:hover': { color: T.ERR_CLR } }}>
                      <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* ── files ── */}
          <Box>
            <BlockTitle T={T} title={t('info.attachTitle')} hint={t('info.attachHint')} />
            <Button component="label" fullWidth startIcon={<AttachFileIcon sx={{ fontSize: 16 }} />}
              disabled={fileTotal >= LIMITS.maxFiles || saving}
              sx={{ borderRadius: '10px', border: `1.5px dashed ${T.INPUT_BD}`, py: 1.25, color: T.TEXT_SEC,
                textTransform: 'none', fontSize: '0.8rem', '&:hover': { borderColor: T.TEXT_PRI, color: T.TEXT_PRI } }}>
              {t('info.attachButton')}
              <input type="file" hidden multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </Button>
            {(existing.some((a) => !a.isVoice) || files.length > 0) && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1.25 }}>
                {existing.filter((a) => !a.isVoice).map((a) => (
                  <ExistingRow key={a.fileId} att={a} removed={removed.includes(String(a.fileId))}
                    onToggle={toggleRemoved} apiBase={apiBase} T={T} t={t} />
                ))}
                {files.map((entry) => <FileRow key={entry.id} entry={entry} onRemove={removeFile} T={T} t={t} />)}
              </Box>
            )}
          </Box>

          {/* ── technical details (new reports only) ── */}
          {!editing && (
          <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}` }}>
            <FormControlLabel
              control={<Checkbox size="small" checked={includeContext} onChange={(e) => setIncludeContext(e.target.checked)} />}
              label={<Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.TEXT_PRI }}>{t('info.techCheckbox')}</Typography>} />
            <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_SEC, ml: 4 }}>{t('info.techHint')}</Typography>
            {includeContext && (
              <Typography dir="ltr" sx={{ fontSize: '0.72rem', color: T.TEXT_TER, ml: 4, mt: 0.5, wordBreak: 'break-all' }}>
                {contextSummary}
              </Typography>
            )}
          </Box>
          )}

          {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
        </Box>

        {saving && <LinearProgress variant={progress == null ? 'indeterminate' : 'determinate'} value={progress || 0} />}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, py: 2,
          borderTop: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
          <Button onClick={handleClose} disabled={saving} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSend} disabled={saving || (editing && !dirty)} variant="contained"
            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700,
              bgcolor: isDark ? '#fff' : '#000', color: isDark ? '#000' : '#fff',
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)' } }}>
            {saving ? (editing ? t('info.saving') : t('info.sending')) : (editing ? t('info.saveChanges') : t('info.send'))}
          </Button>
        </Box>
      </Drawer>

      <ConfirmDialog open={confirmDiscard} onClose={() => setConfirmDiscard(false)} onConfirm={discardAndClose}
        title={t('info.discardTitle')} message={t('info.discardMessage')}
        confirmLabel={t('info.discard')} cancelLabel={t('info.keepEditing')} destructive />
    </>
  );
}
