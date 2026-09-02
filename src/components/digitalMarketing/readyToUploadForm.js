import { useState, useContext } from 'react';
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

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { submitReadyToUpload, createReadyToUpload } from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import { enqueueUpload } from '../../tools/uploadCenter/uploadManager';

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
export default function ReadyToUploadForm({ open, onClose, rawContentId }) {
  const isStandalone = !rawContentId;
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

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
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const resetForm = () => { setTitle(''); setFiles([]); setLanguage(''); setPlatform(''); setCaption(''); setError(''); };
  const handleClose = () => {
    if (files.length) { setConfirmDiscard(true); return; }
    resetForm();
    onClose();
  };
  const discardAndClose = () => { resetForm(); onClose(); };

  const addFiles = (fileList) => setFiles((prev) => [...prev, ...Array.from(fileList)]);
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  // Same pattern as the raw content batch form: the record is created
  // immediately with no files, and each file is handed to the Upload Center
  // to finish in the background — this button only waits on the create call.
  const handleSave = async () => {
    if (!files.length) { setError(t('dm.addAtLeastOneFile')); return; }
    setSaving(true); setError('');
    try {
      const metadata = { title, language, platform, caption };
      const created = isStandalone
        ? await dispatch(createReadyToUpload({ authCtx, axiosGlobal, formData: metadata })).unwrap()
        : (await dispatch(submitReadyToUpload({ authCtx, axiosGlobal, id: rawContentId, formData: metadata })).unwrap()).readyToUpload;

      const sectionLabel = t('nav.digitalMarketing');
      files.forEach((file) => {
        enqueueUpload({ purpose: 'dmReadyToUpload', targetId: created._id, file, sectionLabel });
      });

      resetForm();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('dm.failedToSubmit'));
    } finally {
      setSaving(false);
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
          SelectProps={{ native: true }}>
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

        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </Box>

      <Box sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${T.DIVIDER}` }}>
        {/* Uploads finish in the background (Upload Center, beside the bell)
            once the record is created. */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>{t('common.cancel')}</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={handleSave} disabled={saving} variant="contained" color="success"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700 }}>
            {saving ? t('dm.submitting') : t('dm.submit')}
          </Button>
        </Box>
      </Box>

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
