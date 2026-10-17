import { useState, useContext, useRef, useEffect } from 'react';
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

import LinearProgress from '@mui/material/LinearProgress';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';
import { createRawContent } from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import MediaViewer from './mediaViewer';
import {
  saveDraft, loadDraft, clearDraft, packFiles, unpackFiles, DRAFT_BLOB_BUDGET,
} from './draftStore';
import ProductVarietyPicker from './productVarietyPicker';

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
  const { branches } = useBranch();

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
  const [branchId, setBranchId] = useState('');
  const [products, setProducts] = useState([]);   // tagged Inventory varieties — see productVarietyPicker.js
  const [pendingFiles, setPendingFiles] = useState([]);   // [{ key, file, name, description, voiceFile }]
  // Text-format content — the alternative to uploading files: type it and/or
  // speak it. textVoiceFile mirrors pendingFiles' per-file voiceFile pattern,
  // just at the batch level instead of per-file.
  const [textContent, setTextContent] = useState('');
  const [textVoiceFile, setTextVoiceFile] = useState(null);
  const [recordingText, setRecordingText] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);   // 0-100 during submit
  const [error, setError]       = useState('');
  const [recordingKey, setRecordingKey] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [viewerMedia, setViewerMedia] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const textRecorderRef  = useRef(null);
  const textChunksRef    = useRef([]);
  const replaceInputRef  = useRef(null);
  const replaceTargetKey = useRef(null);

  // Branch default: when the creator belongs to exactly ONE branch there is no
  // real choice to make, so it is preselected. With two or more it stays empty
  // on purpose — guessing which one a batch is for would silently mistag it.
  const autoBranchId = branches.length === 1 ? String(branches[0]._id) : '';
  const [branchTouched, setBranchTouched] = useState(false);

  // ── Unsent draft ────────────────────────────────────────────────────────
  // Nothing here reaches the server until Upload is pressed — uploading a file
  // IS the record. The draft only exists so a closed tab or a crash does not
  // cost the typing. See draftStore.js for why it is IndexedDB.
  const DRAFT_KEY = 'rawContent';
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [restored, setRestored] = useState(false);
  const hydrating = useRef(false);     // never autosave over a draft while loading it
  const prevOpen = useRef(false);

  useEffect(() => {
    if (open && !prevOpen.current) setBranchTouched(false);   // fresh open
    prevOpen.current = open;
  }, [open]);

  // Re-runs when `branches` arrives, so a late context fetch still gets applied
  // — but never overwrites a choice the user has already made.
  useEffect(() => {
    if (!open || branchTouched) return;
    setBranchId(autoBranchId);
  }, [open, autoBranchId, branchTouched]);

  // Reopening picks up exactly where it was left, files included when they
  // fit the budget (draftStore.js).
  useEffect(() => {
    if (!open) { setRestored(false); return; }
    let cancelled = false;
    hydrating.current = true;
    (async () => {
      const draft = await loadDraft(DRAFT_KEY);
      if (cancelled) { hydrating.current = false; return; }
      if (draft && draft.fields) {
        const f = draft.fields;
        setTitle(f.title || '');
        setLanguage(f.language || '');
        setUseCase(f.useCase || 'Anything');
        setPlatform(f.platform || 'Anything');
        if (f.branchId) { setBranchId(f.branchId); setBranchTouched(true); }
        setProducts(f.products || []);
        setTextContent(f.textContent || '');
        setPendingFiles(unpackFiles(draft.files, nextLocalKey));
        setDraftSavedAt(draft.updatedAt || null);
        setRestored(true);
      }
      // Let the restored values settle before autosave is allowed to run,
      // otherwise the first pass writes the half-applied state back.
      setTimeout(() => { hydrating.current = false; }, 0);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetForm = () => {
    setTitle(''); setLanguage(''); setUseCase('Anything'); setPlatform('Anything');
    setBranchId(autoBranchId); setBranchTouched(false);
    setProducts([]); setPendingFiles([]); setTextContent(''); setTextVoiceFile(null); setError('');
  };

  // Default a friendly per-file name from the filename (extension stripped).
  const baseName = (filename) => (filename || '').replace(/\.[^.]+$/, '');

  const isEmptyForm = () => !title.trim() && !textContent.trim() && !textVoiceFile
    && !pendingFiles.length && !products.length;

  // Autosaved on a pause rather than a keystroke: writing a batch of video
  // Blobs to disk is not something to do on every character.
  useEffect(() => {
    if (!open || hydrating.current) return undefined;
    const id = setTimeout(async () => {
      if (isEmptyForm()) { await clearDraft(DRAFT_KEY); setDraftSavedAt(null); return; }
      const { entries, droppedContent } = packFiles(pendingFiles);
      const ok = await saveDraft(DRAFT_KEY, {
        kind: 'rawContent',
        fields: { title, language, useCase, platform, branchId, products, textContent },
        files: entries,
        droppedContent,
      });
      if (ok) setDraftSavedAt(Date.now());
    }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, language, useCase, platform, branchId, products, textContent, pendingFiles]);

  const handleClose = () => {
    if (pendingFiles.length || textContent.trim() || textVoiceFile) { setConfirmDiscard(true); return; }
    resetForm();
    onClose();
  };
  const discardAndClose = async () => {
    await clearDraft(DRAFT_KEY);
    setDraftSavedAt(null); setRestored(false);
    resetForm();
    onClose();
  };

  // Reset empties the form AND throws the draft away — one button, one
  // meaning, so nothing is left behind to reappear on the next open.
  const handleReset = async () => {
    setConfirmReset(false);
    hydrating.current = true;            // stop autosave re-writing what we just cleared
    await clearDraft(DRAFT_KEY);
    resetForm();
    setTextVoiceFile(null);
    setDraftSavedAt(null); setRestored(false);
    setTimeout(() => { hydrating.current = false; }, 0);
  };

  const addFiles = (fileList) => {
    const newEntries = Array.from(fileList).map((file) => ({
      key: nextLocalKey(), file, name: baseName(file.name), description: '', voiceFile: null,
    }));
    setPendingFiles((prev) => [...prev, ...newEntries]);
  };

  const removeFile = (key) => setPendingFiles((prev) => prev.filter((f) => f.key !== key));

  // Files the draft kept by name only: their bytes were too big to store, so
  // there is nothing to preview or send until each one is picked again.
  const missingFiles = pendingFiles.filter((f) => !f.file);

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
    setPendingFiles((prev) => prev.map((f) => (f.key === replaceTargetKey.current
      // Picking a draft's missing file again goes through here too, so the
      // saved name and the "missing" mark have to follow the new File.
      ? { ...f, file, missingContent: false, fileName: file.name, fileType: file.type, fileSize: file.size }
      : f)));
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

  // Voice recording for the batch-level text content — same MediaRecorder
  // pattern as startVoiceDescription/stopVoiceDescription above, just not
  // keyed to a particular file.
  const startTextVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      textChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) textChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(textChunksRef.current, { type: 'audio/webm' });
        setTextVoiceFile(new File([blob], `voice-content-${Date.now()}.webm`, { type: 'audio/webm' }));
      };
      recorder.start();
      textRecorderRef.current = recorder;
      setRecordingText(true);
    } catch (_) {
      setError(t('dm.micAccessDenied'));
    }
  };
  const stopTextVoice = () => {
    textRecorderRef.current?.stop();
    setRecordingText(false);
  };

  const handleSave = async () => {
    // Either mode is valid: real files, or typed/spoken text content — never neither.
    if (!pendingFiles.length && !textContent.trim() && !textVoiceFile) {
      setError(t('dm.addFilesOrTextRequired'));
      return;
    }
    // Sending the rest would quietly upload an incomplete batch.
    if (missingFiles.length) {
      setError(t('dm.draftRepickBeforeSend', { names: missingFiles.map((f) => f.fileName || f.name).join(', ') }));
      return;
    }
    setSaving(true); setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('language', language);
      formData.append('useCase', useCase);
      formData.append('platform', platform);
      formData.append('branchId', branchId);
      formData.append('textContent', textContent);
      formData.append('products', JSON.stringify(products.map((p) => ({ productId: p.productId, variantId: p.variantId }))));
      if (textVoiceFile) formData.append('textVoice', textVoiceFile);

      const descriptions = [];
      const names         = [];
      const voiceFlags    = [];
      pendingFiles.forEach((f) => {
        formData.append('files', f.file);
        names.push(f.name || baseName(f.file.name));
        descriptions.push(f.description || '');
        voiceFlags.push(!!f.voiceFile);
      });
      formData.append('names', JSON.stringify(names));
      formData.append('descriptions', JSON.stringify(descriptions));
      formData.append('voiceDescriptionFlags', JSON.stringify(voiceFlags));
      pendingFiles.forEach((f) => { if (f.voiceFile) formData.append('voiceDescriptions', f.voiceFile); });

      setUploadProgress(0);
      await dispatch(createRawContent({
        authCtx, axiosGlobal, formData,
        onProgress: (e) => setUploadProgress(e.total ? Math.round((100 * e.loaded) / e.total) : null),
      })).unwrap();
      // Sent — the record exists now, so the draft has nothing left to protect.
      await clearDraft(DRAFT_KEY);
      setDraftSavedAt(null); setRestored(false);
      resetForm();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('dm.failedToUpload'));
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}
      PaperProps={{ sx: { width: isXs ? '100vw' : 480, bgcolor: T.DIALOG_BG, backgroundImage: 'none' } }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
            {t('dm.newRawContentBatch')}
          </Typography>
          {draftSavedAt && (
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
              {t('dm.draftKeptAt', {
                time: new Date(draftSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              })}
            </Typography>
          )}
        </Box>
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

        {/* ── Tagged Inventory varieties — branch-scoped, see productVarietyPicker.js ── */}
        <ProductVarietyPicker value={products} onChange={setProducts} T={T} />

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
              <Box key={f.key} sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.CARD_BG,
                border: f.file ? `1px solid ${T.CARD_BD}` : '1px dashed #B26A00' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {f.file ? (
                    <Typography onClick={() => openPreview(f.file)} noWrap
                      sx={{ fontSize: '0.78rem', color: T.TEXT_PRI, flexGrow: 1, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}>
                      <OpenInNewIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />
                      {f.file.name}
                    </Typography>
                  ) : (
                    // In the draft by name only. Nothing to preview — the one
                    // useful thing to offer is picking it again.
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontSize: '0.78rem', color: T.TEXT_PRI }}>
                        {f.fileName || f.name || t('dm.draftUntitled')}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#B26A00' }}>
                        {t('dm.draftFileMissing')}
                      </Typography>
                    </Box>
                  )}
                  {f.file ? (
                    <Tooltip title={t('dm.replaceFile')}>
                      <IconButton size="small" onClick={() => openReplace(f.key)} sx={{ color: T.TEXT_TER, width: 26, height: 26 }}>
                        <ChangeCircleIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Button size="small" onClick={() => openReplace(f.key)}
                      sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#B26A00', flexShrink: 0, minWidth: 0, px: 1 }}>
                      {t('dm.draftPickAgain')}
                    </Button>
                  )}
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

        {/* ── Text-format content — the alternative to uploading files: type
            it and/or record a voice message about it. Submitting requires
            EITHER at least one file above OR something here (see handleSave). ── */}
        <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`,
          display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('dm.textContentSectionLabel')}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
            {t('dm.orEnterTextInstead')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TextField size="small" fullWidth multiline minRows={3} placeholder={t('dm.textContentPlaceholder')}
              value={textContent} onChange={(e) => setTextContent(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', fontSize: '0.8rem' } }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
              {textVoiceFile && !recordingText ? (
                <>
                  <Tooltip title={t('dm.playTextVoiceTip')}>
                    <IconButton size="small"
                      onClick={() => setViewerMedia({ url: URL.createObjectURL(textVoiceFile), name: t('dm.voiceDescriptionFallback'), kind: 'audio' })}
                      sx={{ color: '#81c784' }}>
                      <PlayCircleIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('dm.removeTextVoiceTip')}>
                    <IconButton size="small" onClick={() => setTextVoiceFile(null)} sx={{ color: T.ERR_CLR }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <Tooltip title={recordingText ? t('dm.stopRecordingTip2') : t('dm.recordTextVoiceTip')}>
                  <IconButton size="small" onClick={recordingText ? stopTextVoice : startTextVoice}
                    sx={{ color: recordingText ? T.ERR_CLR : T.TEXT_TER }}>
                    {recordingText ? <StopCircleIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: T.DIVIDER }} />

        {/* ── Batch-level fields ── */}
        <TextField select label={t('dm.languageLabel')} size="small" fullWidth value={language}
          onChange={(e) => setLanguage(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}>
          <option value="">{t('dm.selectLanguageEllipsis')}</option>
          {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{t(l.labelKey)}</option>)}
        </TextField>

        <TextField select label={t('dm.suggestedUseCaseLabel')} size="small" fullWidth value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}>
          {USE_CASES.map((u) => <option key={u.value} value={u.value}>{t(u.labelKey)}</option>)}
        </TextField>

        <TextField select label={t('dm.suggestedPlatformLabel')} size="small" fullWidth value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}>
          {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.labelKey ? t(p.labelKey) : p.label}</option>)}
        </TextField>

        {/* Optional tag — which branch this batch is FOR. Doesn't restrict who
            can see the record (DM stays one shared org-wide pool); it's only
            for filtering the list later. */}
        {branches.length > 0 && (
          <TextField select label={t('dm.branchLabel')} size="small" fullWidth value={branchId}
            onChange={(e) => { setBranchId(e.target.value); setBranchTouched(true); }}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
            helperText={branches.length > 1 ? t('dm.branchPickHelper') : undefined}>
            <option value="">{t('dm.noBranchOption')}</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </TextField>
        )}

        {restored && (
          <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC }}>
            {t('dm.draftRestoredNotice')}
          </Typography>
        )}
        {missingFiles.length > 0 && (
          <Typography sx={{ fontSize: '0.75rem', color: '#B26A00' }}>
            {t('dm.draftRepickNotice', { count: missingFiles.length, mb: Math.round(DRAFT_BLOB_BUDGET / 1024 / 1024) })}
          </Typography>
        )}

        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </Box>

      <Box sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${T.DIVIDER}` }}>
        {uploadProgress !== null && (
          <Box sx={{ mb: 1.25 }}>
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 2, height: 6 }} />
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mt: 0.5 }}>
              {t('dm.uploadingBatchPercent', { percent: uploadProgress })}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>{t('common.cancel')}</Button>
          <Button onClick={() => setConfirmReset(true)} disabled={saving || isEmptyForm()}
            sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>
            {t('common.reset')}
          </Button>
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
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title={t('dm.resetFormTitle')}
        message={t('dm.resetFormMessage')}
        confirmLabel={t('common.reset')}
        destructive
      />

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
