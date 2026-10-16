import { useState, useContext, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import LinearProgress from '@mui/material/LinearProgress';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';
import { submitReadyToUpload, createReadyToUpload } from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import { saveDraft, loadDraft, clearDraft, totalBytes, DRAFT_BLOB_BUDGET } from './draftStore';
import ProductVarietyPicker from './productVarietyPicker';

// Freeform suggestions — the field is freeSolo (extensible), so these stay literal
// English strings; translating them would split the stored `platform` value by UI language.
const PLACE_OPTIONS = ['Post', 'Reels', 'Story', 'YouTube Short', 'TikTok post', 'Carousel', 'Live'];
// value stays the literal English word (stored on the record); only the displayed label translates.
const LANGUAGES = [
  { value: 'English', labelKey: 'dm.langEnglish' },
  { value: 'Arabic',  labelKey: 'dm.langArabic' },
  { value: 'Farsi',   labelKey: 'dm.langFarsi' },
];

// Two launch modes, both handled here:
//  - rawContentId set  — opened from a raw content record's "Mark ready to
//    upload" action; submitting atomically creates the readyToUpload record
//    AND flips the source raw content's status server-side.
//  - rawContentId absent — opened standalone (Ready to Upload list "New"
//    button); submitting creates a readyToUpload record with no back-reference.
export default function ReadyToUploadForm({ open, onClose, rawContentId, defaultBranchId = '', defaultProducts = [] }) {
  const isStandalone = !rawContentId;
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
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    ERR_CLR:   '#FF4D8D',
  };

  const [title, setTitle]       = useState('');
  const [files, setFiles]       = useState([]);
  const [language, setLanguage] = useState('');
  const [platform, setPlatform] = useState('');
  const [caption, setCaption]   = useState('');
  // Graduating a raw content batch inherits its branch tag by default (see
  // the backend's POST .../ready-to-upload comment) — the field still opens
  // editable here in case this record is FOR a different branch than the
  // source batch was tagged with.
  const [branchId, setBranchId] = useState(defaultBranchId || '');
  const [products, setProducts] = useState([]);   // tagged Inventory varieties — see productVarietyPicker.js
  const [saving, setSaving]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError]       = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // ── Unsent draft ────────────────────────────────────────────────────────
  // Local until Save, same rule as the raw content form: uploading is what
  // creates the record. One draft per source batch, so two half-finished
  // hand-offs never overwrite each other.
  const DRAFT_KEY = `readyToUpload:${rawContentId || 'new'}`;
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [draftTruncated, setDraftTruncated] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [restored, setRestored] = useState(false);
  const hydrating = useRef(false);

  useEffect(() => { if (open) setBranchId(defaultBranchId || ''); }, [open, defaultBranchId]);
  // Pre-fills with the source raw content's already-tagged varieties when
  // opened from the "mark ready to upload" flow — a graduated record is the
  // same content further along, so starting from a blank picker would
  // silently drop what was already tagged unless the user re-picks by hand.
  // Still fully editable from here.
  useEffect(() => { if (open) setProducts(defaultProducts || []); }, [open, defaultProducts]);

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
        setPlatform(f.platform || '');
        setCaption(f.caption || '');
        if (f.branchId) setBranchId(f.branchId);
        setProducts(f.products || []);
        setFiles((draft.files || [])
          .filter((e) => e.blob)
          .map((e) => new File([e.blob], e.fileName || 'file', { type: e.fileType || undefined })));
        setDraftSavedAt(draft.updatedAt || null);
        setDraftTruncated(Boolean(draft.droppedContent));
        setRestored(true);
      }
      setTimeout(() => { hydrating.current = false; }, 0);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, DRAFT_KEY]);

  const isEmptyForm = () => !title.trim() && !caption.trim() && !files.length
    && !platform && !products.length;

  useEffect(() => {
    if (!open || hydrating.current) return undefined;
    const id = setTimeout(async () => {
      if (isEmptyForm()) { await clearDraft(DRAFT_KEY); setDraftSavedAt(null); return; }
      const withinBudget = totalBytes(files.map((f) => ({ file: f }))) <= DRAFT_BLOB_BUDGET;
      const ok = await saveDraft(DRAFT_KEY, {
        kind: 'readyToUpload',
        rawContentId: rawContentId || null,
        fields: { title, language, platform, caption, branchId, products },
        files: files.map((f) => ({
          fileName: f.name, fileType: f.type, fileSize: f.size,
          blob: withinBudget ? f : null,
        })),
        droppedContent: !withinBudget && files.length > 0,
      });
      if (ok) { setDraftSavedAt(Date.now()); setDraftTruncated(!withinBudget && files.length > 0); }
    }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, language, platform, caption, branchId, products, files]);

  const handleReset = async () => {
    setConfirmReset(false);
    hydrating.current = true;
    await clearDraft(DRAFT_KEY);
    resetForm();
    setDraftSavedAt(null); setDraftTruncated(false); setRestored(false);
    setTimeout(() => { hydrating.current = false; }, 0);
  };

  const resetForm = () => { setTitle(''); setFiles([]); setLanguage(''); setPlatform(''); setCaption(''); setBranchId(''); setProducts([]); setError(''); };
  const handleClose = () => {
    if (files.length) { setConfirmDiscard(true); return; }
    resetForm();
    onClose();
  };
  const discardAndClose = async () => {
    await clearDraft(DRAFT_KEY);
    setDraftSavedAt(null); setDraftTruncated(false); setRestored(false);
    resetForm(); onClose();
  };

  // Read the FileList into a real array HERE, not inside the state updater. The input's
  // onChange clears e.target.value straight after calling this, which empties the live
  // FileList — and a React updater runs later, during the re-render, so by the time it read
  // the list there was nothing left in it and the picked files silently vanished.
  // Every sibling picker (rawContentForm, rawContentDetail, readyToUploadDetail,
  // productGalleryManager) already reads it synchronously; this one did not.
  const addFiles = (fileList) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;
    setFiles((prev) => [...prev, ...picked]);
  };
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!files.length) { setError(t('dm.addAtLeastOneFile')); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('title', title);
      fd.append('language', language);
      fd.append('platform', platform);
      fd.append('caption', caption);
      fd.append('branchId', branchId);
      fd.append('products', JSON.stringify(products.map((p) => ({ productId: p.productId, variantId: p.variantId }))));
      setUploadProgress(0);
      const onProgress = (e) => setUploadProgress(e.total ? Math.round((100 * e.loaded) / e.total) : null);
      if (isStandalone) {
        await dispatch(createReadyToUpload({ authCtx, axiosGlobal, formData: fd, onProgress })).unwrap();
      } else {
        await dispatch(submitReadyToUpload({ authCtx, axiosGlobal, id: rawContentId, formData: fd, onProgress })).unwrap();
      }
      await clearDraft(DRAFT_KEY);
      setDraftSavedAt(null); setDraftTruncated(false); setRestored(false);
      resetForm();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('dm.failedToSubmit'));
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}
      PaperProps={{ sx: { width: isXs ? '100vw' : 440, bgcolor: T.DIALOG_BG, backgroundImage: 'none' } }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {isStandalone ? t('dm.newReadyToUploadContent') : t('dm.markReadyToUpload')}
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label={t('dm.titleLabel')} size="small" fullWidth value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('dm.titlePlaceholderExample')}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        <Button component="label" fullWidth startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 16 }} />}
          sx={{ borderRadius: '10px', border: `1.5px dashed ${T.INPUT_BD}`, py: 1.5,
            color: T.TEXT_SEC, textTransform: 'none', fontSize: '0.8rem',
            '&:hover': { borderColor: T.TEXT_PRI, color: T.TEXT_PRI } }}>
          {t('dm.selectEditedFinalFiles')}
          <input type="file" hidden multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        </Button>

        {files.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {files.map((f, i) => (
              <Chip key={i} size="small" label={f.name.length > 22 ? f.name.slice(0, 19) + '…' : f.name}
                onDelete={() => removeFile(i)} deleteIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                sx={{ height: 24, fontSize: '0.7rem', bgcolor: T.INPUT_BG, color: T.TEXT_PRI }} />
            ))}
          </Box>
        )}

        <TextField select label={t('dm.contentLanguageLabel')} size="small" fullWidth value={language}
          onChange={(e) => setLanguage(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}>
          <option value="">{t('dm.selectLanguageEllipsis')}</option>
          {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{t(l.labelKey)}</option>)}
        </TextField>

        <Autocomplete freeSolo options={PLACE_OPTIONS} value={platform}
          onInputChange={(e, v) => setPlatform(v)}
          renderInput={(params) => (
            <TextField {...params} label={t('dm.suggestedPlaceToUpload')} size="small"
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />
          )} />

        <TextField label={t('dm.captionLabel')} size="small" fullWidth multiline minRows={3} value={caption}
          onChange={(e) => setCaption(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        {/* ── Tagged Inventory varieties — branch-scoped, see productVarietyPicker.js ── */}
        <ProductVarietyPicker value={products} onChange={setProducts} T={T} />

        {branches.length > 0 && (
          <TextField select label={t('dm.branchLabel')} size="small" fullWidth value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
            SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}>
            <option value="">{t('dm.noBranchOption')}</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </TextField>
        )}

        {restored && (
          <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC }}>
            {t('dm.draftRestoredNotice')}
          </Typography>
        )}
        {draftTruncated && (
          <Typography sx={{ fontSize: '0.75rem', color: '#B26A00' }}>
            {t('dm.draftTooBigNotice', { mb: Math.round(DRAFT_BLOB_BUDGET / 1024 / 1024) })}
          </Typography>
        )}
        {draftSavedAt && (
          <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
            {t('dm.draftKeptAt', { time: new Date(draftSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
          </Typography>
        )}
        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </Box>

      <Box sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${T.DIVIDER}` }}>
        {uploadProgress !== null && (
          <Box sx={{ mb: 1.25 }}>
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 2, height: 6 }} />
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC, mt: 0.5 }}>
              {t('dm.uploadingPercent', { percent: uploadProgress })}
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
          <Button onClick={handleSave} disabled={saving} variant="contained" color="success"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700 }}>
            {saving ? t('dm.submitting') : t('dm.submit')}
          </Button>
        </Box>
      </Box>

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
        title={t('dm.discardSubmissionTitle')}
        message={t('dm.discardSubmissionMessage')}
        confirmLabel={t('common.discard')}
        destructive
      />
    </Drawer>
  );
}
