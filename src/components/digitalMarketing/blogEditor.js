import { useState, useContext, useEffect } from 'react';
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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { createBlogPost, updateBlogPost } from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import { LANGUAGES, isRtlLang } from '../../i18n';
import RichTextEditor from './richTextEditor';

const slugify = (s) => String(s || '').trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Create/edit Drawer for a Blog post (see blogSection.js). One EN/AR/FA
// language tab bar drives title/excerpt/body/SEO for all three languages —
// TipTap only ever renders one live editor instance at a time (the active
// tab's), the other two languages' HTML just sits in local state.
export default function BlogEditor({ open, onClose, post = null }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const isEdit = Boolean(post);

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    ERR_CLR:   '#FF4D8D',
  };

  const emptyByLang = () => ({ en: '', fa: '', ar: '' });

  const [lang, setLang] = useState('en');
  const [titles, setTitles] = useState(emptyByLang());
  const [excerpts, setExcerpts] = useState(emptyByLang());
  const [bodies, setBodies] = useState(emptyByLang());
  const [metaTitles, setMetaTitles] = useState(emptyByLang());
  const [metaDescriptions, setMetaDescriptions] = useState(emptyByLang());
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [published, setPublished] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (post) {
      setTitles({ en: post.title || '', fa: post.titleFa || '', ar: post.titleAr || '' });
      setExcerpts({ en: post.excerpt || '', fa: post.excerptFa || '', ar: post.excerptAr || '' });
      setBodies({ en: post.body || '', fa: post.bodyFa || '', ar: post.bodyAr || '' });
      const seo = post.seo || {};
      setMetaTitles({ en: seo.metaTitle || '', fa: seo.metaTitleFa || '', ar: seo.metaTitleAr || '' });
      setMetaDescriptions({ en: seo.metaDescription || '', fa: seo.metaDescriptionFa || '', ar: seo.metaDescriptionAr || '' });
      setSlug(post.slug || '');
      setSlugTouched(true);
      setPublished(post.status === 'published');
      setCoverPreview(post.coverImage?.diskName ? `${axiosGlobal.defaultTargetApi}/uploads/${post.coverImage.diskName}` : null);
    } else {
      setTitles(emptyByLang()); setExcerpts(emptyByLang()); setBodies(emptyByLang());
      setMetaTitles(emptyByLang()); setMetaDescriptions(emptyByLang());
      setSlug(''); setSlugTouched(false); setPublished(false); setCoverPreview(null);
    }
    setLang('en'); setCoverFile(null); setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(titles.en));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titles.en]);

  const hasUnsaved = titles.en || titles.ar || titles.fa || coverFile;

  const handleClose = () => {
    if (hasUnsaved) { setConfirmDiscard(true); return; }
    onClose();
  };
  const discardAndClose = () => onClose();

  const pickCover = (file) => {
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!titles.en.trim()) { setError(t('dm.blogTitleRequired')); return; }
    if (published && !slug.trim()) { setError(t('dm.blogSlugRequiredToPublish')); return; }

    setSaving(true); setError('');
    try {
      const formData = new FormData();
      formData.append('title', titles.en.trim());
      formData.append('titleAr', titles.ar.trim());
      formData.append('titleFa', titles.fa.trim());
      formData.append('excerpt', excerpts.en.trim());
      formData.append('excerptAr', excerpts.ar.trim());
      formData.append('excerptFa', excerpts.fa.trim());
      formData.append('body', bodies.en || '');
      formData.append('bodyAr', bodies.ar || '');
      formData.append('bodyFa', bodies.fa || '');
      formData.append('slug', slug.trim());
      formData.append('status', published ? 'published' : 'draft');
      formData.append('seo', JSON.stringify({
        metaTitle: metaTitles.en.trim(), metaDescription: metaDescriptions.en.trim(),
        metaTitleAr: metaTitles.ar.trim(), metaDescriptionAr: metaDescriptions.ar.trim(),
        metaTitleFa: metaTitles.fa.trim(), metaDescriptionFa: metaDescriptions.fa.trim(),
      }));
      if (coverFile) formData.append('cover', coverFile);

      setUploadProgress(0);
      const onProgress = (e) => setUploadProgress(e.total ? Math.round((100 * e.loaded) / e.total) : null);

      if (isEdit) {
        await dispatch(updateBlogPost({ authCtx, axiosGlobal, id: post._id, formData, onProgress })).unwrap();
      } else {
        await dispatch(createBlogPost({ authCtx, axiosGlobal, formData, onProgress })).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('dm.blogFailedToSave'));
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const setField = (setter) => (val) => setter((prev) => ({ ...prev, [lang]: val }));

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}
      PaperProps={{ sx: { width: isXs ? '100vw' : 620, bgcolor: T.DIALOG_BG, backgroundImage: 'none' } }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {isEdit ? t('dm.blogEditPost') : t('dm.blogNewPost')}
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* ── Cover image ── */}
        <Box>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.TEXT_TER, mb: 1 }}>
            {t('dm.blogCoverImage')}
          </Typography>
          {coverPreview ? (
            <Box sx={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', height: 140 }}>
              <Box component="img" src={coverPreview} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <Button component="label" size="small"
                sx={{ position: 'absolute', bottom: 8, right: 8, fontSize: '0.68rem', textTransform: 'none',
                  bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '6px', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                {t('dm.blogChangeCover')}
                <input type="file" hidden accept="image/*" onChange={(e) => { pickCover(e.target.files?.[0]); e.target.value = ''; }} />
              </Button>
            </Box>
          ) : (
            <Button component="label" fullWidth startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 16 }} />}
              sx={{ borderRadius: '10px', border: `1.5px dashed ${T.INPUT_BD}`, py: 1.5,
                color: T.TEXT_SEC, textTransform: 'none', fontSize: '0.8rem',
                '&:hover': { borderColor: T.TEXT_PRI, color: T.TEXT_PRI } }}>
              {t('dm.blogSelectCover')}
              <input type="file" hidden accept="image/*" onChange={(e) => { pickCover(e.target.files?.[0]); e.target.value = ''; }} />
            </Button>
          )}
        </Box>

        {/* ── Language tabs ── */}
        <Box sx={{ display: 'flex', gap: 0.5, bgcolor: T.INPUT_BG, borderRadius: '9px', p: '3px', border: `1px solid ${T.DIVIDER}`, alignSelf: 'flex-start' }}>
          {LANGUAGES.map((l) => (
            <Button key={l.code} onClick={() => setLang(l.code)}
              sx={{ minWidth: 0, height: 26, px: 1.5, py: 0, borderRadius: '7px',
                fontSize: '0.72rem', fontWeight: lang === l.code ? 700 : 400, textTransform: 'none',
                color: lang === l.code ? T.TEXT_PRI : T.TEXT_TER,
                bgcolor: lang === l.code ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent' }}>
              {l.nativeLabel}
            </Button>
          ))}
        </Box>

        <TextField label={t('dm.blogTitleLabel')} size="small" fullWidth
          value={titles[lang]} onChange={(e) => setField(setTitles)(e.target.value)}
          dir={isRtlLang(lang) ? 'rtl' : 'ltr'}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        <TextField label={t('dm.blogExcerptLabel')} size="small" fullWidth multiline minRows={2}
          value={excerpts[lang]} onChange={(e) => setField(setExcerpts)(e.target.value)}
          dir={isRtlLang(lang) ? 'rtl' : 'ltr'}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        <Box>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.TEXT_TER, mb: 1 }}>
            {t('dm.blogBodyLabel')}
          </Typography>
          <RichTextEditor
            value={bodies[lang]}
            onChange={setField(setBodies)}
            dir={isRtlLang(lang) ? 'rtl' : 'ltr'}
            placeholder={t('dm.blogBodyPlaceholder')}
          />
        </Box>

        <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' }, border: `1px solid ${T.DIVIDER}`, borderRadius: '10px !important' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: T.TEXT_SEC }} />}>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI }}>{t('dm.blogSeoSection')}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField label={t('dm.blogSeoMetaTitle')} size="small" fullWidth
              value={metaTitles[lang]} onChange={(e) => setField(setMetaTitles)(e.target.value)}
              dir={isRtlLang(lang) ? 'rtl' : 'ltr'}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px' } }} />
            <TextField label={t('dm.blogSeoMetaDescription')} size="small" fullWidth multiline minRows={2}
              value={metaDescriptions[lang]} onChange={(e) => setField(setMetaDescriptions)(e.target.value)}
              dir={isRtlLang(lang) ? 'rtl' : 'ltr'}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px' } }} />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ borderColor: T.DIVIDER }} />

        <TextField label={t('dm.blogSlugLabel')} size="small" fullWidth
          value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
          helperText={t('dm.blogSlugHelper')}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        <FormControlLabel
          control={<Switch checked={published} onChange={(e) => setPublished(e.target.checked)} />}
          label={<Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>
            {published ? t('dm.blogStatusPublished') : t('dm.blogStatusDraft')}
          </Typography>} />

        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </Box>

      <Box sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${T.DIVIDER}` }}>
        {uploadProgress !== null && (
          <Box sx={{ mb: 1.25 }}>
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 2, height: 6 }} />
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>{t('common.cancel')}</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={handleSave} disabled={saving} variant="contained"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700 }}>
            {saving ? t('dm.blogSavingEllipsis') : (isEdit ? t('common.save') : t('dm.blogCreateButton'))}
          </Button>
        </Box>
      </Box>

      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={discardAndClose}
        title={t('dm.blogDiscardTitle')}
        message={t('dm.blogDiscardMessage')}
        confirmLabel={t('common.discard')}
        destructive
      />
    </Drawer>
  );
}
