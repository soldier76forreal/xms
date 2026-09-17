import { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../../contextApi/PermissionContext';
import { updateProductWebsite, fetchInvTags } from '../../../store/store';
import { LANGUAGES, isRtlLang } from '../../../i18n';
import RichTextEditor from '../../digitalMarketing/richTextEditor';

const CONTENT_SECTION_KEYS = ['introduction', 'features', 'applications', 'whyUs', 'careTips', 'conclusion'];
const emptyContent = () => CONTENT_SECTION_KEYS.reduce((acc, k) => {
  acc[k] = ''; acc[`${k}Ar`] = ''; acc[`${k}Fa`] = ''; return acc;
}, {});

const slugify = (s) => (s || '')
  .toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// The public-website side of a product — published toggle, slug, the
// non-English descriptions (English description is the existing field on the
// main product edit dialog; not duplicated here), an ordered gallery picked
// from the product's ALREADY-uploaded media (MediaGallery above owns
// upload/delete — this only picks + orders a subset of what's already
// there), tags, and per-language SEO meta. Gated by inventory:website:manage
// for every write; visible read-only to anyone who can view the product.
export default function WebsitePanel({ product, media }) {
  const { t }  = useTranslation();
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();
  const canManage = can('inventory:website:manage');

  const allTags = useSelector((s) => s.invTags) || [];

  const website = product?.website || {};
  const [published, setPublished] = useState(Boolean(website.published));
  const [slug, setSlug] = useState(website.slug || '');
  const [descriptionAr, setDescriptionAr] = useState(product?.descriptionAr || '');
  const [descriptionFa, setDescriptionFa] = useState(product?.descriptionFa || '');
  const [tags, setTags] = useState(website.tags || []);
  const [gallery, setGallery] = useState(website.gallery || []);
  const [seo, setSeo] = useState({
    metaTitle: website.seo?.metaTitle || '', metaDescription: website.seo?.metaDescription || '',
    metaTitleAr: website.seo?.metaTitleAr || '', metaDescriptionAr: website.seo?.metaDescriptionAr || '',
    metaTitleFa: website.seo?.metaTitleFa || '', metaDescriptionFa: website.seo?.metaDescriptionFa || '',
  });
  const [content, setContent] = useState({ ...emptyContent(), ...website.content });
  const [contentLang, setContentLang] = useState('en');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    dispatch(fetchInvTags({ authCtx, axiosGlobal }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync from the product whenever a fresh copy arrives (e.g. after save,
  // or switching to a different product) — but not on every keystroke.
  useEffect(() => {
    const w = product?.website || {};
    setPublished(Boolean(w.published));
    setSlug(w.slug || '');
    setDescriptionAr(product?.descriptionAr || '');
    setDescriptionFa(product?.descriptionFa || '');
    setTags(w.tags || []);
    setGallery(w.gallery || []);
    setSeo({
      metaTitle: w.seo?.metaTitle || '', metaDescription: w.seo?.metaDescription || '',
      metaTitleAr: w.seo?.metaTitleAr || '', metaDescriptionAr: w.seo?.metaDescriptionAr || '',
      metaTitleFa: w.seo?.metaTitleFa || '', metaDescriptionFa: w.seo?.metaDescriptionFa || '',
    });
    setContent({ ...emptyContent(), ...w.content });
    setContentLang('en');
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const markDirty = useCallback((setter) => (value) => { setter(value); setDirty(true); }, []);

  const galleryMediaIds = new Set(gallery.map((g) => String(g.fileId)));
  const availableMedia = (media || []).filter((m) => !galleryMediaIds.has(String(m._id)));

  const addToGallery = (m) => {
    setGallery((prev) => [...prev, { fileId: m._id, diskName: m.metaData?.filename, order: prev.length }]);
    setDirty(true);
  };
  const removeFromGallery = (fileId) => {
    setGallery((prev) => prev.filter((g) => String(g.fileId) !== String(fileId)).map((g, i) => ({ ...g, order: i })));
    setDirty(true);
  };
  const moveGallery = (index, dir) => {
    setGallery((prev) => {
      const next = [...prev];
      const swapWith = index + dir;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next.map((g, i) => ({ ...g, order: i }));
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(updateProductWebsite({
        authCtx, axiosGlobal, id: product._id,
        data: {
          descriptionAr, descriptionFa,
          website: {
            published, slug: slug.trim() || undefined,
            gallery: gallery.map(({ fileId, diskName, order }) => ({ fileId, diskName, order })),
            tags, seo, content,
          },
        },
      })).unwrap();
      setDirty(false);
    } catch (_) { /* snackbar dispatched by the thunk */ } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Box sx={{ mt: 3, border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
      bgcolor: 'background.paper', px: 2.5, py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 1, color: 'text.disabled' }}>
          {t('inventory.websitePanelTitle')}
        </Typography>
        {canManage && (
          <Button size="small" variant="contained" onClick={handleSave} disabled={!dirty || saving}
            startIcon={saving ? <CircularProgress size={12} color="inherit" /> : null}
            sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px' }}>
            {t('common.save')}
          </Button>
        )}
      </Box>

      <FormControlLabel
        control={<Switch checked={published} disabled={!canManage}
          onChange={(e) => markDirty(setPublished)(e.target.checked)} />}
        label={<Typography sx={{ fontSize: '0.82rem' }}>{t('inventory.websitePublishedLabel')}</Typography>}
      />

      <TextField size="small" fullWidth disabled={!canManage} value={slug}
        onChange={(e) => markDirty(setSlug)(slugify(e.target.value))}
        label={t('inventory.websiteSlugLabel')}
        placeholder={slugify(product.name || product.code)}
        helperText={t('inventory.websiteSlugHelper')}
        sx={{ mt: 2 }} />

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <TextField size="small" fullWidth multiline minRows={2} disabled={!canManage}
          value={descriptionAr} onChange={(e) => markDirty(setDescriptionAr)(e.target.value)}
          label={t('inventory.websiteDescriptionArLabel')} inputProps={{ dir: 'rtl' }} />
        <TextField size="small" fullWidth multiline minRows={2} disabled={!canManage}
          value={descriptionFa} onChange={(e) => markDirty(setDescriptionFa)(e.target.value)}
          label={t('inventory.websiteDescriptionFaLabel')} inputProps={{ dir: 'rtl' }} />
      </Box>

      <Autocomplete
        multiple size="small" disabled={!canManage} sx={{ mt: 2 }}
        options={allTags.map((tg) => tg._id)}
        getOptionLabel={(id) => allTags.find((tg) => tg._id === id)?.name || ''}
        value={tags}
        onChange={(e, val) => markDirty(setTags)(val)}
        renderTags={(value, getTagProps) => value.map((id, i) => (
          <Chip size="small" label={allTags.find((tg) => tg._id === id)?.name || ''} {...getTagProps({ index: i })} />
        ))}
        renderInput={(params) => <TextField {...params} label={t('inventory.websiteTagsLabel')} />}
      />

      {/* ── Gallery — order the product's already-uploaded media for the website ── */}
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.disabled', mt: 2.5, mb: 1 }}>
        {t('inventory.websiteGalleryLabel')}
      </Typography>
      {gallery.length === 0 ? (
        <Typography sx={{ fontSize: '0.76rem', color: 'text.disabled' }}>{t('inventory.websiteGalleryEmpty')}</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {gallery.map((g, i) => {
            const m = (media || []).find((x) => String(x._id) === String(g.fileId));
            return (
              <Box key={String(g.fileId)} sx={{ display: 'flex', alignItems: 'center', gap: 1,
                px: 1.25, py: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
                {m?.thumbnail && (
                  <Box component="img" src={`${axiosGlobal.defaultTargetApi}/uploads/${m.thumbnail}`}
                    sx={{ width: 28, height: 28, borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <Typography noWrap sx={{ fontSize: '0.76rem', flexGrow: 1 }}>{m?.name || g.diskName || t('inventory.websiteGalleryMissingFile')}</Typography>
                {canManage && (
                  <>
                    <IconButton size="small" disabled={i === 0} onClick={() => moveGallery(i, -1)} sx={{ width: 24, height: 24 }}>
                      <ArrowUpwardIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                    <IconButton size="small" disabled={i === gallery.length - 1} onClick={() => moveGallery(i, 1)} sx={{ width: 24, height: 24 }}>
                      <ArrowDownwardIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => removeFromGallery(g.fileId)} sx={{ width: 24, height: 24, color: '#EA005A' }}>
                      <RemoveCircleOutlineIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      )}
      {canManage && availableMedia.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
          {availableMedia.map((m) => (
            <Chip key={m._id} size="small" label={m.name} icon={<AddCircleOutlineIcon sx={{ fontSize: 14 }} />}
              onClick={() => addToGallery(m)} sx={{ fontSize: '0.7rem' }} />
          ))}
        </Box>
      )}

      {/* ── SEO ── */}
      <Accordion disableGutters elevation={0} sx={{ mt: 2.5, border: 'none', bgcolor: 'transparent', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ px: 0, minHeight: 32 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase' }}>
            {t('inventory.websiteSeoLabel')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[
            { key: '', dir: 'ltr', label: t('inventory.websiteSeoEnglish') },
            { key: 'Ar', dir: 'rtl', label: t('inventory.websiteSeoArabic') },
            { key: 'Fa', dir: 'rtl', label: t('inventory.websiteSeoFarsi') },
          ].map(({ key, dir, label }) => (
            <Box key={key || 'en'}>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', mb: 0.5 }}>{label}</Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField size="small" fullWidth disabled={!canManage}
                  value={seo[`metaTitle${key}`]}
                  onChange={(e) => markDirty(setSeo)({ ...seo, [`metaTitle${key}`]: e.target.value })}
                  label={t('inventory.websiteSeoMetaTitle')} inputProps={{ dir }} />
                <TextField size="small" fullWidth disabled={!canManage}
                  value={seo[`metaDescription${key}`]}
                  onChange={(e) => markDirty(setSeo)({ ...seo, [`metaDescription${key}`]: e.target.value })}
                  label={t('inventory.websiteSeoMetaDescription')} inputProps={{ dir }} />
              </Box>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>

      {/* ── Long-form SEO content (Introduction/Features/Applications/Why Us/
          Care/Conclusion) — matches the real production site's per-product
          template. Content migration is a separate pass; this just gives it
          a home so it can be authored per-language via TipTap. ── */}
      <Accordion disableGutters elevation={0} sx={{ mt: 1.5, border: 'none', bgcolor: 'transparent', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ px: 0, minHeight: 32 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase' }}>
            {t('inventory.websiteContentLabel')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 0.5, bgcolor: 'action.hover', borderRadius: '9px', p: '3px', alignSelf: 'flex-start' }}>
            {LANGUAGES.map((l) => (
              <Button key={l.code} onClick={() => setContentLang(l.code)}
                sx={{ minWidth: 0, height: 26, px: 1.5, py: 0, borderRadius: '7px', fontSize: '0.72rem',
                  fontWeight: contentLang === l.code ? 700 : 400, textTransform: 'none',
                  color: contentLang === l.code ? 'text.primary' : 'text.disabled',
                  bgcolor: contentLang === l.code ? 'action.selected' : 'transparent' }}>
                {l.nativeLabel}
              </Button>
            ))}
          </Box>
          {CONTENT_SECTION_KEYS.map((key) => {
            const suffix = contentLang === 'ar' ? 'Ar' : contentLang === 'fa' ? 'Fa' : '';
            const fieldKey = `${key}${suffix}`;
            return (
              <Box key={key}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.secondary', mb: 0.75 }}>
                  {t(`inventory.websiteContent_${key}`)}
                </Typography>
                {canManage ? (
                  <RichTextEditor
                    value={content[fieldKey]}
                    onChange={(html) => markDirty(setContent)({ ...content, [fieldKey]: html })}
                    dir={isRtlLang(contentLang) ? 'rtl' : 'ltr'}
                  />
                ) : (
                  <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}
                    dangerouslySetInnerHTML={{ __html: content[fieldKey] || `<em>${t('inventory.websiteContentEmpty')}</em>` }} />
                )}
              </Box>
            );
          })}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
