import { useState, useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';


import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { createRawContent } from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import MediaViewer from './mediaViewer';
import { enqueueUpload, waitForUploadResult } from '../../tools/uploadCenter/uploadManager';

// value stays the literal English word (stored on the record); only the displayed label translates.
const USE_CASES = [
  { value: 'Anything',          labelKey: 'dm.optAnything' },
  { value: 'Ad campaign',       labelKey: 'dm.optAdCampaign' },
  { value: 'Organic post',      labelKey: 'dm.optOrganicPost' },
  { value: 'Product showcase',  labelKey: 'dm.optProductShowcase' },
  { value: 'Behind the scenes', labelKey: 'dm.optBehindTheScenes' },
  { value: 'Announcement',      labelKey: 'dm.optAnnouncement' },
];
// Platform names are brand names — never translated, only "Anything" is a real label.
const PLATFORMS = [
  { value: 'Anything',  labelKey: 'dm.optAnything' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'TikTok',    label: 'TikTok' },
  { value: 'YouTube',   label: 'YouTube' },
  { value: 'Facebook',  label: 'Facebook' },
  { value: 'LinkedIn',  label: 'LinkedIn' },
  { value: 'X',         label: 'X' },
];
const LANGUAGES = [
  { value: 'English', labelKey: 'dm.langEnglish' },
  { value: 'Arabic',  labelKey: 'dm.langArabic' },
  { value: 'Farsi',   labelKey: 'dm.langFarsi' },
];

// Local (not-yet-uploaded) File → viewer kind, from its MIME type.
const kindFromFile = (file) => {
  const t = file?.type || '';
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  if (t === 'application/pdf') return 'pdf';
  return 'other';
};

let localKeyCounter = 0;
const nextLocalKey = () => `f${Date.now()}_${localKeyCounter++}`;

// Batch-upload Drawer form — pick any number of files, each openable/previewable
// with per-file Delete/Replace, a text description field, and a voice-message
// button (native MediaRecorder — no new package) as an alternative to typing.
export default function RawContentForm({ open, onClose }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    CARD_BG:   isDark ? '#151515'                : 'rgba(0,0,0,0.02)',
    CARD_BD:   isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    ERR_CLR:   '#FF4D8D',
  };

  const [title, setTitle]       = useState('');
  const [language, setLanguage] = useState('');
  const [useCase, setUseCase]   = useState('Anything');
  const [platform, setPlatform] = useState('Anything');
  const [pendingFiles, setPendingFiles] = useState([]);   // [{ key, file, name, description, voiceFile }]
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [recordingKey, setRecordingKey] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [viewerMedia, setViewerMedia] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const replaceInputRef  = useRef(null);
  const replaceTargetKey = useRef(null);

  const resetForm = () => {
    setTitle(''); setLanguage(''); setUseCase('Anything'); setPlatform('Anything');
    setPendingFiles([]); setError('');
  };

  // Default a friendly per-file name from the filename (extension stripped).
  const baseName = (filename) => (filename || '').replace(/\.[^.]+$/, '');

  const handleClose = () => {
    if (pendingFiles.length) { setConfirmDiscard(true); return; }
    resetForm();
    onClose();
  };
  const discardAndClose = () => {
    resetForm();
    onClose();
  };

  const addFiles = (fileList) => {
    const newEntries = Array.from(fileList).map((file) => ({
      key: nextLocalKey(), file, name: baseName(file.name), description: '', voiceFile: null,
    }));
    setPendingFiles((prev) => [...prev, ...newEntries]);
  };

  const removeFile = (key) => setPendingFiles((prev) => prev.filter((f) => f.key !== key));

  const updateName = (key, name) =>
    setPendingFiles((prev) => prev.map((f) => (f.key === key ? { ...f, name } : f)));

  const updateDescription = (key, text) =>
    setPendingFiles((prev) => prev.map((f) => (f.key === key ? { ...f, description: text } : f)));

  const openReplace = (key) => {
    replaceTargetKey.current = key;
    replaceInputRef.current?.click();
  };
  const handleReplaceChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPendingFiles((prev) => prev.map((f) => (f.key === replaceTargetKey.current ? { ...f, file } : f)));
  };

  // Preview a not-yet-uploaded file IN-APP via an object URL — no browser tab.
  const openPreview = (file) => {
    setViewerMedia({ url: URL.createObjectURL(file), name: file.name, kind: kindFromFile(file) });
  };

  const startVoiceDescription = async (key) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const voiceFile = new File([blob], `voice-desc-${Date.now()}.webm`, { type: 'audio/webm' });
        setPendingFiles((prev) => prev.map((f) => (f.key === key ? { ...f, voiceFile } : f)));
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingKey(key);
    } catch (_) {
      setError(t('dm.micAccessDenied'));
    }
  };
  const stopVoiceDescription = () => {
    mediaRecorderRef.current?.stop();
    setRecordingKey(null);
  };

  // The record is created immediately (no files yet) and every file is
  // handed to the Upload Center to finish IN THE BACKGROUND — the whole
  // point is that the user doesn't sit here watching a batch upload. A voice
  // note is sequenced to enqueue only once its main file's real fileId is
  // known (see api/routes/uploads/purposes.js's dmRawContentVoice), so there
  // is nothing to correlate or race — just "after", in order.
  const handleSave = async () => {
    if (!pendingFiles.length) { setError(t('dm.addAtLeastOneFileGeneric')); return; }
    setSaving(true); setError('');
    try {
      const created = await dispatch(createRawContent({
        authCtx, axiosGlobal,
        formData: { title, language, useCase, platform },
      })).unwrap();

      pendingFiles.forEach((f) => {
        (async () => {
          const mainLocalId = await enqueueUpload({
            purpose: 'dmRawContent', targetId: created._id,
            extra: { description: f.description, name: f.name || baseName(f.file.name) },
            file: f.file,
            sectionLabel: t('nav.digitalMarketing'),
          });
          if (!f.voiceFile) return;
          const mainResult = await waitForUploadResult(mainLocalId);
          if (!mainResult?.fileId) return;   // main upload failed/cancelled — skip the orphaned voice note
          await enqueueUpload({
            purpose: 'dmRawContentVoice', targetId: created._id,
            extra: { mainFileId: mainResult.fileId },
            file: f.voiceFile,
            sectionLabel: t('nav.digitalMarketing'),
          });
        })();
      });

      resetForm();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('dm.failedToUpload'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}
      PaperProps={{ sx: { width: isXs ? '100vw' : 480, bgcolor: T.DIALOG_BG, backgroundImage: 'none' } }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {t('dm.newRawContentBatch')}
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* ── Batch title ── */}
        <TextField label={t('dm.batchTitleLabel')} size="small" fullWidth value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('dm.batchTitlePlaceholderExample')}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        {/* ── File picker ── */}
        <Box>
          <Button component="label" fullWidth startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: '10px', border: `1.5px dashed ${T.INPUT_BD}`, py: 1.5,
              color: T.TEXT_SEC, textTransform: 'none', fontSize: '0.8rem',
              '&:hover': { borderColor: T.TEXT_PRI, color: T.TEXT_PRI } }}>
            {t('dm.selectFilesPrompt')}
            <input type="file" hidden multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </Button>
          <input ref={replaceInputRef} type="file" hidden onChange={handleReplaceChosen} />
        </Box>

        {/* ── Per-file list ── */}
        {pendingFiles.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {pendingFiles.map((f) => (
              <Box key={f.key} sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography onClick={() => openPreview(f.file)} noWrap
                    sx={{ fontSize: '0.78rem', color: T.TEXT_PRI, flexGrow: 1, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}>
                    <OpenInNewIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />
                    {f.file.name}
                  </Typography>
                  <Tooltip title={t('dm.replaceFile')}>
                    <IconButton size="small" onClick={() => openReplace(f.key)} sx={{ color: T.TEXT_TER, width: 26, height: 26 }}>
                      <ChangeCircleIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('dm.removeFileTitle')}>
                    <IconButton size="small" onClick={() => removeFile(f.key)} sx={{ color: T.ERR_CLR, width: 26, height: 26 }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <TextField size="small" fullWidth placeholder={t('dm.fileNamePlaceholder')}
                  value={f.name} onChange={(e) => updateName(f.key, e.target.value)}
                  sx={{ mt: 1, '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', fontSize: '0.78rem' } }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <TextField size="small" fullWidth placeholder={t('dm.descriptionPlaceholder')}
                    value={f.description} onChange={(e) => updateDescription(f.key, e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', fontSize: '0.78rem' } }} />
                  {f.voiceFile && !((recordingKey === f.key)) ? (
                    <Tooltip title={t('dm.playVoiceDescriptionTip')}>
                      <PlayCircleIcon sx={{ fontSize: 20, color: '#81c784', flexShrink: 0, cursor: 'pointer' }}
                        onClick={() => setViewerMedia({ url: URL.createObjectURL(f.voiceFile), name: t('dm.voiceDescriptionFallback'), kind: 'audio' })} />
                    </Tooltip>
                  ) : (
                    <Tooltip title={recordingKey === f.key ? t('dm.stopRecordingTip') : t('dm.recordVoiceDescriptionTip')}>
                      <IconButton size="small"
                        onClick={() => (recordingKey === f.key ? stopVoiceDescription() : startVoiceDescription(f.key))}
                        sx={{ color: recordingKey === f.key ? T.ERR_CLR : T.TEXT_TER, flexShrink: 0 }}>
                        {recordingKey === f.key ? <StopCircleIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Divider sx={{ borderColor: T.DIVIDER }} />

        {/* ── Batch-level fields ── */}
        <TextField select label={t('dm.languageLabel')} size="small" fullWidth value={language}
          onChange={(e) => setLanguage(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}>
          <option value="">{t('dm.selectLanguageEllipsis')}</option>
          {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{t(l.labelKey)}</option>)}
        </TextField>

        <TextField select label={t('dm.suggestedUseCaseLabel')} size="small" fullWidth value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}>
          {USE_CASES.map((u) => <option key={u.value} value={u.value}>{t(u.labelKey)}</option>)}
        </TextField>

        <TextField select label={t('dm.suggestedPlatformLabel')} size="small" fullWidth value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}>
          {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.labelKey ? t(p.labelKey) : p.label}</option>)}
        </TextField>

        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </Box>

      <Box sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${T.DIVIDER}` }}>
        {/* Uploads finish in the background (Upload Center, beside the bell)
            once the record is created — this button only waits on that
            create call, not on any file transfer. */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>{t('common.cancel')}</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={handleSave} disabled={saving} variant="contained"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700 }}>
            {saving ? t('dm.uploadingEllipsis') : t('dm.uploadBatch')}
          </Button>
        </Box>
      </Box>

      <MediaViewer open={Boolean(viewerMedia)} onClose={() => setViewerMedia(null)} media={viewerMedia} />

      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={discardAndClose}
        title={t('dm.discardBatchTitle')}
        message={t('dm.discardBatchMessage')}
        confirmLabel={t('common.discard')}
        destructive
      />
    </Drawer>
  );
}
