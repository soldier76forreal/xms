import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { LANGUAGES, isRtlLang } from '../../i18n';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import { createProductContent, createProductContentTaxonomy, updateProductContent } from '../../store/store';
import RichTextEditor from './richTextEditor';
import ProductGalleryManager from './productGalleryManager';
import ProductPagePreview from './productPagePreview';
import { normalizeCode, slugify, websiteBase } from './productPageUrl';

// The product page editor. It follows the page it produces: the inventory product it
// belongs to (and the varieties that will appear in its availability table), the
// images, the title / short description / description in each language, the
// categories and tags, and how it reads in a search result - with the REAL page
// alongside, refreshing as you type.

const LANG_CODES = ['en', 'ar', 'fa'];
const emptyByLang = () => ({ en: '', ar: '', fa: '' });
const idsOf = (items) => (items || []).map((x) => String(x?._id || x)).filter(Boolean);
const plainText = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;

function initialForm(content) {
  const seo = (content && content.seo) || {};
  return {
    code: (content && content.code) || '',
    slug: (content && content.slug) || '',
    slugTouched: Boolean(content && content._id),         // an existing page keeps its address
    title: { en: (content && content.title) || '', ar: (content && content.titleAr) || '', fa: (content && content.titleFa) || '' },
    excerpt: { en: (content && content.excerpt) || '', ar: (content && content.excerptAr) || '', fa: (content && content.excerptFa) || '' },
    body: { en: (content && content.body) || '', ar: (content && content.bodyAr) || '', fa: (content && content.bodyFa) || '' },
    metaTitle: { en: seo.metaTitle || '', ar: seo.metaTitleAr || '', fa: seo.metaTitleFa || '' },
    metaDescription: { en: seo.metaDescription || '', ar: seo.metaDescriptionAr || '', fa: seo.metaDescriptionFa || '' },
    categoryIds: idsOf(content && content.categories),
    tagIds: idsOf(content && content.tags),
    gallery: ((content && content.gallery) || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((g, order) => ({ url: g.url, alt: g.alt || '', order })),
  };
}

// The record's fields as the API takes them (also what the live preview shows).
function toPayload(form) {
  return {
    code: normalizeCode(form.code),
    slug: slugify(form.slug || form.title.en || form.code),
    title: form.title.en.trim(), titleAr: form.title.ar.trim(), titleFa: form.title.fa.trim(),
    excerpt: form.excerpt.en, excerptAr: form.excerpt.ar, excerptFa: form.excerpt.fa,
    body: form.body.en || '', bodyAr: form.body.ar || '', bodyFa: form.body.fa || '',
    seo: {
      metaTitle: form.metaTitle.en.trim(), metaTitleAr: form.metaTitle.ar.trim(), metaTitleFa: form.metaTitle.fa.trim(),
      metaDescription: form.metaDescription.en.trim(), metaDescriptionAr: form.metaDescription.ar.trim(), metaDescriptionFa: form.metaDescription.fa.trim(),
    },
    categories: form.categoryIds,
    tags: form.tagIds,
    gallery: form.gallery.map((g, order) => ({ url: g.url, alt: (g.alt || '').trim(), order })),
  };
}

function Section({ step, title, hint, children, T }) {
  return (
    <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '12px', p: 2, bgcolor: T.CARD }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.25 }}>
        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: T.CTRL_BG, color: T.TEXT_SEC, fontSize: '0.68rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step}</Box>
        <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: T.TEXT_PRI }}>{title}</Typography>
        {hint && <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, flex: 1 }}>{hint}</Typography>}
      </Box>
      {children}
    </Box>
  );
}

// Which inventory product this page is for. Typing searches the inventory (by code,
// name, stone, quarry); a code that already has a page can't be picked again.
function CodePicker({ value, onPick, currentContentId, t, T }) {
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const [input, setInput] = useState(value || '');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setInput(value || ''); }, [value]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await authCtx.jwtInst({
          method: 'get', url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/product-content/code-lookup`,
          params: { search: String(input || '').trim() },
        });
        if (alive) setOptions(res.data.data || []);
      } catch (_) { if (alive) setOptions([]); }
      if (alive) setLoading(false);
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [input, authCtx, axiosGlobal.defaultTargetApi]);

  const taken = (option) => Boolean(option.content && String(option.content._id) !== String(currentContentId || ''));
  return (
    <Autocomplete freeSolo options={options} loading={loading} filterOptions={(x) => x}
      inputValue={input}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.code)}
      getOptionDisabled={taken}
      onInputChange={(e, text, reason) => {
        setInput(text);
        if (reason === 'input') onPick(normalizeCode(text), null);
      }}
      onChange={(e, option) => { if (option && typeof option !== 'string') onPick(option.code, option); }}
      renderOption={(props, option) => (
        <li {...props} key={option.code}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', minWidth: 0 }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>{option.code}</Typography>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }} noWrap>{option.name || '-'}</Typography>
              <Typography sx={{ fontSize: '0.66rem', color: 'text.secondary' }} noWrap>
                {[option.stoneTypeName, option.quarryName].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
            {option.content
              ? <Chip size="small" label={t('dm.pcCodeHasPage')} sx={{ height: 18, fontSize: '0.6rem' }} />
              : <Typography sx={{ fontSize: '0.64rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {t('dm.pcCodeVarieties', { count: option.variants })} · {t('dm.pcCodeBranches', { count: option.branches })}
              </Typography>}
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField {...params} size="small" label={t('dm.pcCode')} placeholder={t('dm.pcCodePlaceholder')}
          InputProps={{ ...params.InputProps, sx: { fontFamily: 'monospace', fontWeight: 700 } }}
          helperText={t('dm.pcCodeHint')} />
      )} />
  );
}

// What the page's availability table will list for this code - straight from inventory.
function InventorySummary({ code, onBranches, t, T }) {
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const report = useRef(onBranches);
  report.current = onBranches;

  useEffect(() => {
    const clean = normalizeCode(code);
    if (!/^[A-Z]{2}\d{2}$/.test(clean)) { setInfo(null); return undefined; }
    let alive = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/product-content/availability`, params: { code: clean } });
        if (!alive) return;
        setInfo(res.data);
        report.current((res.data.branches || []).filter((b) => (b.variants || []).some((v) => v.inStock)).map((b) => b.branchId));
      } catch (_) { if (alive) setInfo(null); }
      if (alive) setLoading(false);
    }, 350);
    return () => { alive = false; clearTimeout(timer); };
  }, [code, authCtx, axiosGlobal.defaultTargetApi]);

  if (!/^[A-Z]{2}\d{2}$/.test(normalizeCode(code))) return null;
  if (loading && !info) return <CircularProgress size={16} />;
  const branches = (info && info.branches) || [];
  if (!branches.length) {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', p: 1.25, borderRadius: '10px', bgcolor: 'rgba(255,183,77,0.1)', border: '1px solid rgba(255,183,77,0.35)' }}>
        <ErrorOutlineIcon sx={{ fontSize: 17, color: '#ffb74d', mt: '1px' }} />
        <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_PRI }}>{t('dm.pcNoStock')}</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.75, bgcolor: T.CTRL_BG }}>
        <Inventory2OutlinedIcon sx={{ fontSize: 15, color: T.TEXT_SEC }} />
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.TEXT_PRI }}>{branches[0].productName || normalizeCode(code)}</Typography>
        <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, flex: 1 }}>{t('dm.pcStockHint')}</Typography>
      </Box>
      {branches.map((branch) => (
        <Box key={String(branch.branchId)} sx={{ px: 1.25, py: 0.75, borderTop: `1px solid ${T.BD}`, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: T.TEXT_PRI, minWidth: 90 }}>{branch.branchName}</Typography>
          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }}>{t('dm.pcCodeVarieties', { count: (branch.variants || []).length })}</Typography>
          {Object.entries(branch.totalsByUnit || {}).map(([unit, qty]) => (
            <Chip key={unit} size="small" label={`${qty} ${unit}`} sx={{ height: 18, fontSize: '0.62rem' }} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

// Categories or tags: pick from what exists, or make a new one on the spot.
function TaxonomyPicker({ label, helper, items, value, onChange, canCreate, onCreate, t }) {
  const [input, setInput] = useState('');
  // MUI resets the typed text whenever the `value` array it is given is a NEW array, so
  // this must keep its identity between renders (a fresh filter() each time wiped the
  // input after every keystroke).
  const selected = useMemo(() => items.filter((item) => value.includes(String(item._id))), [items, value]);
  const exists = (name) => items.some((item) => String(item.name).trim().toLowerCase() === String(name).trim().toLowerCase());
  return (
    <Autocomplete multiple options={items} value={selected} inputValue={input} onInputChange={(e, text) => setInput(text)}
      getOptionLabel={(option) => (option._create ? t('dm.pcCreateNew', { name: option.name }) : option.name)}
      isOptionEqualToValue={(a, b) => String(a._id) === String(b._id)}
      filterOptions={(options, state) => {
        const q = state.inputValue.trim().toLowerCase();
        const found = options.filter((o) => !q || String(o.name).toLowerCase().includes(q));
        return canCreate && q && !exists(state.inputValue) ? [...found, { _create: true, name: state.inputValue.trim(), _id: '__new' }] : found;
      }}
      onChange={async (e, next) => {
        const created = next.find((option) => option._create);
        const kept = next.filter((option) => !option._create).map((option) => String(option._id));
        if (created) {
          const doc = await onCreate(created.name);
          onChange(doc ? [...kept, String(doc._id)] : kept);
          setInput('');
        } else onChange(kept);
      }}
      renderTags={(tags, getTagProps) => tags.map((option, index) => <Chip size="small" label={option.name} {...getTagProps({ index })} key={option._id} />)}
      renderInput={(params) => <TextField {...params} size="small" label={label} helperText={helper} />} />
  );
}

// A search result as the page will appear in one, with the lengths search engines show.
function SnippetPreview({ url, title, description, T, t }) {
  const titleLength = title.length;
  const descLength = description.length;
  const counter = (n, max) => (
    <Typography component="span" sx={{ fontSize: '0.64rem', color: n > max ? '#ef5350' : T.TEXT_TER, marginInlineStart: 0.75 }}>{n}/{max}</Typography>
  );
  return (
    <Box>
      <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#fff', border: `1px solid ${T.BD}`, direction: 'ltr' }}>
        <Typography sx={{ color: '#1a0dab', fontSize: '1rem', fontFamily: 'Arial, sans-serif', lineHeight: 1.3 }} noWrap>{title || '-'}</Typography>
        <Typography sx={{ color: '#006621', fontSize: '0.74rem', fontFamily: 'Arial, sans-serif' }} noWrap>{url}</Typography>
        <Typography sx={{ color: '#545454', fontSize: '0.8rem', fontFamily: 'Arial, sans-serif', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description || t('dm.pcSeoNoDescription')}
        </Typography>
      </Box>
      <Box sx={{ mt: 0.5 }}>{counter(titleLength, SEO_TITLE_MAX)}{counter(descLength, SEO_DESC_MAX)}</Box>
    </Box>
  );
}

function ChecklistItem({ done, label, T }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
      {done
        ? <CheckCircleIcon sx={{ fontSize: 15, color: '#66bb6a' }} />
        : <RadioButtonUncheckedIcon sx={{ fontSize: 15, color: T.TEXT_TER }} />}
      <Typography sx={{ fontSize: '0.7rem', color: done ? T.TEXT_SEC : T.TEXT_PRI }}>{label}</Typography>
    </Box>
  );
}

export { initialForm, toPayload };

export default function ProductContentEditor({ open, onClose, content = null, taxonomy = [], onSaved }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isNarrow = useMediaQuery(theme.breakpoints.down('lg'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const T = {
    BG: isDark ? '#0a0a0a' : theme.palette.background.default,
    CARD: isDark ? '#111' : theme.palette.background.paper,
    BD: isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    CTRL_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.9)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.5)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.38)',
  };
  const field = { '& .MuiOutlinedInput-root': { bgcolor: T.CTRL_BG, borderRadius: '9px' } };

  const isEdit = Boolean(content && content._id);
  const isPublished = Boolean(content && content.status === 'published');
  const categories = useMemo(() => taxonomy.filter((x) => x.type === 'category'), [taxonomy]);
  const tags = useMemo(() => taxonomy.filter((x) => x.type === 'tag'), [taxonomy]);

  const [form, setForm] = useState(() => initialForm(content));
  const [baseline, setBaseline] = useState(() => JSON.stringify(toPayload(initialForm(content))));
  const [lang, setLang] = useState('en');
  const [pane, setPane] = useState('edit');               // narrow screens: edit | preview
  const [saving, setSaving] = useState('');               // '' | 'draft' | 'published'
  const [error, setError] = useState('');
  const [slugState, setSlugState] = useState({ checking: false, available: null, takenBy: null });
  const [stockBranchIds, setStockBranchIds] = useState([]);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = initialForm(content);
    setForm(next);
    setBaseline(JSON.stringify(toPayload(next)));
    setLang('en'); setPane('edit'); setError(''); setSaving('');
    setSlugState({ checking: false, available: null, takenBy: null });
  }, [open, content && content._id]);   // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setLangField = (name) => (value) => setForm((f) => ({ ...f, [name]: { ...f[name], [lang]: value } }));
  const dir = isRtlLang(lang) ? 'rtl' : 'ltr';

  // the address follows the title until someone edits it (an existing page never moves on its own)
  const onTitle = (value) => setForm((f) => {
    const title = { ...f.title, [lang]: value };
    const slug = f.slugTouched || lang !== 'en' ? f.slug : slugify(value || f.code);
    return { ...f, title, slug };
  });

  const payload = useMemo(() => toPayload(form), [form]);
  const dirty = JSON.stringify(payload) !== baseline;

  // is the page address free?
  const slugValue = payload.slug;
  useEffect(() => {
    if (!open || !slugValue) { setSlugState({ checking: false, available: null, takenBy: null }); return undefined; }
    let alive = true;
    setSlugState((s) => ({ ...s, checking: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/product-content/check-slug`, params: { slug: slugValue, excludeId: isEdit ? content._id : undefined } });
        if (alive) setSlugState({ checking: false, available: res.data.available, takenBy: res.data.takenBy });
      } catch (_) { if (alive) setSlugState({ checking: false, available: null, takenBy: null }); }
    }, 450);
    return () => { alive = false; clearTimeout(timer); };
  }, [slugValue, open, isEdit, content, authCtx, axiosGlobal.defaultTargetApi]);

  // Picking a product from inventory suggests its names as the (empty) titles.
  const pickCode = (code, option) => setForm((f) => {
    const title = { ...f.title };
    if (option) {
      if (!title.en.trim() && option.name) title.en = option.name;
      if (!title.ar.trim() && option.nameAr) title.ar = option.nameAr;
      if (!title.fa.trim() && option.nameFa) title.fa = option.nameFa;
    }
    const slug = f.slugTouched ? f.slug : slugify(title.en || code);
    return { ...f, code, title, slug };
  });

  const createTaxon = (type) => async (name) => {
    try {
      return await dispatch(createProductContentTaxonomy({ authCtx, axiosGlobal, data: { type, name, slug: slugify(name) } })).unwrap();
    } catch (_) { return null; }
  };

  // ── completeness ───────────────────────────────────────────────────────────
  const langDone = (code) => {
    const parts = [form.title[code].trim(), plainText(form.excerpt[code]), plainText(form.body[code])];
    return parts.filter(Boolean).length;
  };
  const checks = {
    code: /^[A-Z]{2}\d{2}$/.test(payload.code),
    title: Boolean(form.title.en.trim()),
    image: form.gallery.length > 0,
    excerpt: Boolean(plainText(form.excerpt.en)),
    body: Boolean(plainText(form.body.en)),
    alt: form.gallery.length > 0 && form.gallery.every((g) => String(g.alt || '').trim()),
    seo: Boolean(form.metaDescription.en.trim()),
    categories: form.categoryIds.length > 0,
  };
  const doneCount = Object.values(checks).filter(Boolean).length;

  // ── saving ─────────────────────────────────────────────────────────────────
  const blocker = !payload.code ? t('dm.pcErrCode') : (!form.title.en.trim() ? t('dm.pcErrTitle') : (slugState.available === false ? t('dm.pcErrSlugTaken') : ''));
  const save = async (status) => {
    if (blocker) { setError(blocker); return; }
    setSaving(status);
    setError('');
    try {
      const data = { ...payload, status };
      const doc = isEdit
        ? await dispatch(updateProductContent({ authCtx, axiosGlobal, id: content._id, data })).unwrap()
        : await dispatch(createProductContent({ authCtx, axiosGlobal, data })).unwrap();
      setBaseline(JSON.stringify(payload));
      if (onSaved) onSaved(doc);
      onClose();
    } catch (err) {
      setError((err && err.response && err.response.data && err.response.data.message) || t('dm.pcSaveFailed'));
    } finally {
      setSaving('');
    }
  };

  const requestClose = () => { if (dirty && !saving) setConfirmClose(true); else onClose(); };
  const base = websiteBase(axiosGlobal);
  const pageUrl = `${base}/product/${slugValue || '…'}/`;
  const canWrite = isEdit ? can('digitalMarketing:productContent:edit') : can('digitalMarketing:productContent:create');

  const editPane = (
    <Box sx={{ height: '100%', overflowY: 'auto', p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Section step={1} title={t('dm.pcSecProduct')} hint={t('dm.pcSecProductHint')} T={T}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <CodePicker value={form.code} onPick={pickCode} currentContentId={isEdit ? content._id : ''} t={t} T={T} />
          <InventorySummary code={form.code} onBranches={setStockBranchIds} t={t} T={T} />
          <TextField size="small" label={t('dm.pcSlug')} value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value), slugTouched: true }))}
            sx={field} InputProps={{ startAdornment: <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_TER, mr: 0.25 }}>/product/</Typography>,
              endAdornment: slugState.checking ? <CircularProgress size={14} /> : (slugState.available === true
                ? <CheckCircleIcon sx={{ fontSize: 17, color: '#66bb6a' }} /> : (slugState.available === false ? <ErrorOutlineIcon sx={{ fontSize: 17, color: '#ef5350' }} /> : null)) }}
            error={slugState.available === false}
            helperText={slugState.available === false
              ? t('dm.pcSlugTaken', { code: slugState.takenBy && slugState.takenBy.code, title: slugState.takenBy && slugState.takenBy.title })
              : t('dm.pcSlugHint')} />
        </Box>
      </Section>

      <Section step={2} title={t('dm.pcSecImages')} hint={t('dm.pcSecImagesHint')} T={T}>
        <ProductGalleryManager value={form.gallery} title={form.title.en}
          onChange={(updater) => setForm((f) => ({ ...f, gallery: updater(f.gallery) }))} />
      </Section>

      <Section step={3} title={t('dm.pcSecText')} hint={t('dm.pcSecTextHint')} T={T}>
        <Tabs value={lang} onChange={(e, v) => setLang(v)} variant="scrollable" sx={{ minHeight: 34, mb: 1.5, '& .MuiTab-root': { minHeight: 34, py: 0, textTransform: 'none', fontSize: '0.78rem' } }}>
          {LANGUAGES.map((l) => {
            const n = langDone(l.code);
            return (
              <Tab key={l.code} value={l.code} label={(
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {l.nativeLabel}
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: n === 3 ? '#66bb6a' : (n > 0 ? '#ffb74d' : T.TEXT_TER) }} />
                </Box>
              )} />
            );
          })}
        </Tabs>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField size="small" fullWidth label={t('dm.pcTitle')} value={form.title[lang]} onChange={(e) => onTitle(e.target.value)} dir={dir}
            required={lang === 'en'} sx={field} helperText={lang === 'en' ? t('dm.pcTitleHint') : t('dm.pcOptionalLang')} />
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.TEXT_SEC, mb: 0.5 }}>{t('dm.pcExcerpt')}</Typography>
            <RichTextEditor value={form.excerpt[lang]} onChange={setLangField('excerpt')} dir={dir} minHeight={90} placeholder={t('dm.pcExcerptPlaceholder')} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.TEXT_SEC, mb: 0.5 }}>{t('dm.pcBody')}</Typography>
            <RichTextEditor value={form.body[lang]} onChange={setLangField('body')} dir={dir} placeholder={t('dm.pcBodyPlaceholder')} />
          </Box>
        </Box>
      </Section>

      <Section step={4} title={t('dm.pcSecOrganise')} hint={t('dm.pcSecOrganiseHint')} T={T}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.25 }}>
          <TaxonomyPicker label={t('dm.pcCategories')} helper={t('dm.pcCategoriesHint')} items={categories} value={form.categoryIds}
            onChange={(ids) => setField('categoryIds', ids)} canCreate={can('digitalMarketing:productContent:taxonomy')} onCreate={createTaxon('category')} t={t} />
          <TaxonomyPicker label={t('dm.pcTags')} helper={t('dm.pcTagsHint')} items={tags} value={form.tagIds}
            onChange={(ids) => setField('tagIds', ids)} canCreate={can('digitalMarketing:productContent:taxonomy')} onCreate={createTaxon('tag')} t={t} />
        </Box>
      </Section>

      <Section step={5} title={t('dm.pcSecSeo')} hint={t('dm.pcSecSeoHint')} T={T}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <TextField size="small" fullWidth label={t('dm.pcSeoTitle')} value={form.metaTitle[lang]} onChange={(e) => setLangField('metaTitle')(e.target.value)} dir={dir}
            placeholder={form.title[lang]} sx={field} helperText={t('dm.pcSeoTitleHint', { max: SEO_TITLE_MAX })} />
          <TextField size="small" fullWidth multiline minRows={2} label={t('dm.pcSeoDescription')} value={form.metaDescription[lang]} dir={dir}
            onChange={(e) => setLangField('metaDescription')(e.target.value)} placeholder={plainText(form.excerpt[lang]).slice(0, SEO_DESC_MAX)} sx={field}
            helperText={t('dm.pcSeoDescriptionHint', { max: SEO_DESC_MAX })} />
          <SnippetPreview url={pageUrl} title={form.metaTitle[lang] || form.title[lang]} description={form.metaDescription[lang] || plainText(form.excerpt[lang])} T={T} t={t} />
        </Box>
      </Section>

      <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '12px', p: 1.5, bgcolor: T.CARD }}>
        <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: T.TEXT_PRI, mb: 0.75 }}>{t('dm.pcChecklist', { done: doneCount, total: Object.keys(checks).length })}</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.5 }}>
          <ChecklistItem done={checks.code} label={t('dm.pcCheckCode')} T={T} />
          <ChecklistItem done={checks.title} label={t('dm.pcCheckTitle')} T={T} />
          <ChecklistItem done={checks.image} label={t('dm.pcCheckImage')} T={T} />
          <ChecklistItem done={checks.alt} label={t('dm.pcCheckAlt')} T={T} />
          <ChecklistItem done={checks.excerpt} label={t('dm.pcCheckExcerpt')} T={T} />
          <ChecklistItem done={checks.body} label={t('dm.pcCheckBody')} T={T} />
          <ChecklistItem done={checks.categories} label={t('dm.pcCheckCategory')} T={T} />
          <ChecklistItem done={checks.seo} label={t('dm.pcCheckSeo')} T={T} />
        </Box>
      </Box>
    </Box>
  );

  const previewPane = (
    <ProductPagePreview payload={payload} contentId={isEdit ? content._id : ''} published={isPublished} canPreview={canWrite}
      lang={lang} onLangChange={setLang} preferredBranchIds={stockBranchIds} active={open && (!isNarrow || pane === 'preview')} />
  );

  return (
    <>
      <Dialog open={open} onClose={requestClose} fullScreen={isXs} maxWidth={false}
        PaperProps={{ sx: { width: isXs ? '100%' : 'min(1560px, 97vw)', height: isXs ? '100%' : '94vh', maxHeight: 'none', m: isXs ? 0 : 1,
          bgcolor: T.BG, backgroundImage: 'none', borderRadius: isXs ? 0 : '14px', display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.25, borderBottom: `1px solid ${T.BD}`, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: T.TEXT_PRI }} noWrap>
              {isEdit ? t('dm.pcEditTitle', { title: content.title || content.code }) : t('dm.pcNewTitle')}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
              {dirty ? t('dm.pcUnsaved') : t('dm.pcAllSaved')}
              {' · '}{isPublished ? t('dm.pcStatusPublished') : t('dm.pcStatusDraft')}
            </Typography>
          </Box>
          {canWrite && (
            <>
              <Button size="small" variant="outlined" disabled={Boolean(saving)} onClick={() => save('draft')}
                startIcon={saving === 'draft' ? <CircularProgress size={13} color="inherit" /> : null}
                sx={{ textTransform: 'none', borderRadius: '8px' }}>
                {isPublished ? t('dm.pcUnpublish') : t('dm.pcSaveDraft')}
              </Button>
              <Button size="small" variant="contained" disabled={Boolean(saving)} onClick={() => save('published')}
                startIcon={saving === 'published' ? <CircularProgress size={13} color="inherit" /> : null}
                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}>
                {isPublished ? t('dm.pcSaveChanges') : t('dm.pcPublish')}
              </Button>
            </>
          )}
          <IconButton onClick={requestClose} size="small" aria-label={t('common.close')}><CloseIcon sx={{ fontSize: 19 }} /></IconButton>
        </Box>

        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mx: 2, mt: 1 }}>{error}</Alert>}

        {isNarrow ? (
          <>
            <Tabs value={pane} onChange={(e, v) => setPane(v)} variant="fullWidth" sx={{ minHeight: 38, borderBottom: `1px solid ${T.BD}`, '& .MuiTab-root': { minHeight: 38, textTransform: 'none' } }}>
              <Tab value="edit" label={t('dm.pcTabEdit')} />
              <Tab value="preview" label={t('dm.pcTabPreview')} />
            </Tabs>
            <Box sx={{ flex: 1, minHeight: 0 }}>{pane === 'edit' ? editPane : previewPane}</Box>
          </>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(560px, 1fr) minmax(480px, 1fr)' }}>
            <Box sx={{ minHeight: 0, borderRight: `1px solid ${T.BD}` }}>{editPane}</Box>
            <Box sx={{ minHeight: 0 }}>{previewPane}</Box>
          </Box>
        )}
      </Dialog>
      <ConfirmDialog open={confirmClose} onClose={() => setConfirmClose(false)} onConfirm={onClose}
        title={t('dm.pcDiscardTitle')} message={t('dm.pcDiscardMessage')} confirmLabel={t('dm.pcDiscard')} destructive />
    </>
  );
}
