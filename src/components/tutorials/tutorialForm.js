import { useState, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { createTutorial, updateTutorial, fetchTutorialActionTags } from '../../store/store';
import { enqueueUpload } from '../../tools/uploadCenter/uploadManager';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import MediaViewer, { resolveMediaKind } from '../digitalMarketing/mediaViewer';
import { SECTIONS, sectionLabel } from './sectionLabels';

const LANGUAGES = ['en', 'fa', 'ar'];

let localKeyCounter = 0;
const nextLocalKey = () => `f${Date.now()}_${localKeyCounter++}`;

// Create/edit Drawer form. `initialSection`/`initialTags` let an entry point
// inside a section (e.g. CRM's "New customer" button) pre-fill the form so the
// uploader doesn't have to hunt for the right tag — see sectionTutorials.js.
// `tutorial` (existing doc) switches the form into edit mode.
export default function TutorialForm({ open, onClose, initialSection = 'general', initialTags = [], tutorial = null }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const actionTagsByModule = useSelector((s) => s.tutorialActionTags);
  const isEdit = Boolean(tutorial);

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

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage]       = useState('');
  const [section, setSection]         = useState(initialSection);
  const [tags, setTags]               = useState(initialTags);
  const [pendingFiles, setPendingFiles] = useState([]);   // [{ key, file }]
  const [existingFiles, setExistingFiles] = useState([]); // edit mode: files already saved
  const [removedFileIds, setRemovedFileIds] = useState([]);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [viewerMedia, setViewerMedia] = useState(null);

  useEffect(() => {
    if (!open) return;
    dispatch(fetchTutorialActionTags({ authCtx, axiosGlobal }));
    if (tutorial) {
      setTitle(tutorial.title || '');
      setDescription(tutorial.description || '');
      setLanguage(tutorial.language || '');
      setSection(tutorial.section || 'general');
      setTags(tutorial.tags || []);
      setExistingFiles(tutorial.files || []);
    } else {
      setTitle(''); setDescription(''); setLanguage('');
      setSection(initialSection); setTags(initialTags);
      setExistingFiles([]);
    }
    setPendingFiles([]); setRemovedFileIds([]); setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tutorial]);

  // Tags are tied to the selected section — a tutorial's `section` value is
  // exactly a permission-catalog module name (crm/mis/inventory/.../files),
  // so the tag picker only ever shows that section's own action tags. 'general'
  // has no matching module (it's cross-cutting orientation content, not tied
  // to one section's actions), so it offers no tags at all.
  const tagOptions = useMemo(() => {
    const keys = (actionTagsByModule || {})[section] || [];
    return keys.map((k) => ({ ...k, module: section }));
  }, [actionTagsByModule, section]);

  // Switching section can orphan previously-picked tags that belonged to the
  // old section — drop anything no longer valid for the new one. Guarded on
  // the catalog having actually loaded: right after the Drawer opens,
  // actionTagsByModule is still {} while fetchTutorialActionTags is in
  // flight, and tagOptions is briefly empty as a result — pruning against
  // that would wipe out a tutorial's real saved tags (or initialTags from a
  // section entry point) before the catalog ever arrives.
  const catalogLoaded = Object.keys(actionTagsByModule || {}).length > 0;
  useEffect(() => {
    if (!catalogLoaded) return;
    setTags((prev) => prev.filter((tag) => tagOptions.some((o) => o.key === tag)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, tagOptions, catalogLoaded]);

  const hasUnsaved = pendingFiles.length > 0 || (!isEdit && (title || description));

  const handleClose = () => {
    if (hasUnsaved) { setConfirmDiscard(true); return; }
    onClose();
  };
  const discardAndClose = () => onClose();

  const addFiles = (fileList) => {
    const entries = Array.from(fileList).map((file) => ({ key: nextLocalKey(), file }));
    setPendingFiles((prev) => [...prev, ...entries]);
  };
  const removeFile = (key) => setPendingFiles((prev) => prev.filter((f) => f.key !== key));
  const removeExistingFile = (fileId) => {
    setExistingFiles((prev) => prev.filter((f) => String(f.fileId) !== String(fileId)));
    setRemovedFileIds((prev) => [...prev, fileId]);
  };

  const openPreview = (file) => {
    setViewerMedia({ url: URL.createObjectURL(file), name: file.name, kind: resolveMediaKind(file.type) });
  };
  const openExistingPreview = (f) => {
    setViewerMedia({ url: `${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`, name: f.name, kind: resolveMediaKind(f.name) });
  };

  const handleSave = async () => {
    if (!title.trim())    { setError(t('tutorials.titleRequired')); return; }
    if (!language)        { setError(t('tutorials.languageRequired')); return; }
    if (!isEdit && !pendingFiles.length) { setError(t('tutorials.addAtLeastOneFile')); return; }

    setSaving(true); setError('');
    try {
      const metadata = {
        title: title.trim(), description, language, section, tags,
        ...(isEdit && removedFileIds.length ? { removeFileIds: removedFileIds } : {}),
      };

      let targetId = tutorial?._id;
      if (isEdit) {
        await dispatch(updateTutorial({ authCtx, axiosGlobal, id: tutorial._id, formData: metadata })).unwrap();
      } else {
        const created = await dispatch(createTutorial({ authCtx, axiosGlobal, formData: metadata })).unwrap();
        targetId = created._id;
      }

      // Files are handed to the Upload Center and land in the background —
      // the record already exists by the time any of them completes, so this
      // doesn't block the Drawer closing.
      pendingFiles.forEach(({ file }) => {
        enqueueUpload({ purpose: 'tutorial', targetId, file, sectionLabel: t('nav.tutorials') });
      });

      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('tutorials.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    // Drawer defaults to theme.zIndex.drawer (1200) — LOWER than Dialog's
    // theme.zIndex.modal (1300). This form can be opened from inside
    // sectionTutorials.js's compact Dialog, so without this explicit bump it
    // rendered fully behind that Dialog (the reported bug) — MUI's Drawer
    // z-index is not auto-raised just because it opened on top of something.
    <Drawer anchor="right" open={open} onClose={handleClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      PaperProps={{ sx: { width: isXs ? '100vw' : 480, bgcolor: T.DIALOG_BG, backgroundImage: 'none' } }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {isEdit ? t('tutorials.editTutorial') : t('tutorials.newTutorial')}
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        <TextField label={t('tutorials.titleLabel')} size="small" fullWidth value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        <TextField label={t('tutorials.descriptionLabel')} size="small" fullWidth multiline minRows={2}
          value={description} onChange={(e) => setDescription(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        <TextField select label={t('tutorials.languageLabel')} size="small" fullWidth value={language}
          onChange={(e) => setLanguage(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}>
          <option value="">{t('tutorials.selectLanguageEllipsis')}</option>
          {LANGUAGES.map((l) => <option key={l} value={l}>{t(`tutorials.lang${l.toUpperCase()}`)}</option>)}
        </TextField>

        <TextField select label={t('tutorials.sectionLabel')} size="small" fullWidth value={section}
          onChange={(e) => setSection(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}>
          {SECTIONS.map((s) => <option key={s} value={s}>{sectionLabel(s, t)}</option>)}
        </TextField>

        <Autocomplete multiple size="small"
          // Same portal/z-index trap as the Drawer above: MUI's Autocomplete
          // popper defaults to theme.zIndex.modal (1300), which is BELOW this
          // Drawer's own bumped modal + 1 — so the tag list would open behind
          // the form it belongs to.
          slotProps={{ popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 2 } } }}
          options={tagOptions}
          disabled={section === 'general'}
          noOptionsText={t('tutorials.noTagsForSection')}
          getOptionLabel={(o) => (typeof o === 'string' ? o : (o.description || o.key))}
          isOptionEqualToValue={(o, v) => o.key === (typeof v === 'string' ? v : v.key)}
          value={tagOptions.filter((o) => tags.includes(o.key))}
          onChange={(e, val) => setTags(val.map((v) => (typeof v === 'string' ? v : v.key)))}
          renderTags={(value, getTagProps) => value.map((option, index) => (
            <Chip label={option.description || option.key} size="small" {...getTagProps({ index })}
              sx={{ height: 20, fontSize: '0.65rem' }} />
          ))}
          renderInput={(params) => (
            <TextField {...params} label={t('tutorials.tagsLabel')}
              placeholder={section === 'general' ? '' : t('tutorials.tagsPlaceholder')}
              helperText={section === 'general' ? t('tutorials.generalHasNoTags') : ''}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />
          )} />

        <Divider sx={{ borderColor: T.DIVIDER }} />

        {/* ── File picker ── */}
        <Box>
          <Button component="label" fullWidth startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: '10px', border: `1.5px dashed ${T.INPUT_BD}`, py: 1.5,
              color: T.TEXT_SEC, textTransform: 'none', fontSize: '0.8rem',
              '&:hover': { borderColor: T.TEXT_PRI, color: T.TEXT_PRI } }}>
            {t('tutorials.selectFilesPrompt')}
            <input type="file" hidden multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </Button>
        </Box>

        {(existingFiles.length > 0 || pendingFiles.length > 0) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {existingFiles.map((f) => (
              <Box key={f.fileId} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: '8px',
                bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}` }}>
                <Typography onClick={() => openExistingPreview(f)} noWrap
                  sx={{ fontSize: '0.76rem', color: T.TEXT_PRI, flexGrow: 1, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}>
                  <OpenInNewIcon sx={{ fontSize: 12, color: T.TEXT_TER }} />
                  {f.name}
                </Typography>
                <Tooltip title={t('tutorials.removeFileTitle')}>
                  <IconButton size="small" onClick={() => removeExistingFile(f.fileId)} sx={{ color: T.ERR_CLR, width: 24, height: 24 }}>
                    <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            {pendingFiles.map((f) => (
              <Box key={f.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: '8px',
                bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}` }}>
                <Typography onClick={() => openPreview(f.file)} noWrap
                  sx={{ fontSize: '0.76rem', color: T.TEXT_PRI, flexGrow: 1, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}>
                  <OpenInNewIcon sx={{ fontSize: 12, color: T.TEXT_TER }} />
                  {f.file.name}
                </Typography>
                <Tooltip title={t('tutorials.removeFileTitle')}>
                  <IconButton size="small" onClick={() => removeFile(f.key)} sx={{ color: T.ERR_CLR, width: 24, height: 24 }}>
                    <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        )}

        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </Box>

      <Box sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${T.DIVIDER}` }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>{t('common.cancel')}</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={handleSave} disabled={saving} variant="contained"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700 }}>
            {saving ? t('tutorials.savingEllipsis') : (isEdit ? t('common.save') : t('tutorials.uploadTutorial'))}
          </Button>
        </Box>
      </Box>

      <MediaViewer open={Boolean(viewerMedia)} onClose={() => setViewerMedia(null)} media={viewerMedia}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }} />

      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={discardAndClose}
        title={t('tutorials.discardTitle')}
        message={t('tutorials.discardMessage')}
        confirmLabel={t('common.discard')}
        destructive
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      />
    </Drawer>
  );
}
