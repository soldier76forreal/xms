import { useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryIcon from '@mui/icons-material/Category';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import {
  createProductContentTaxonomy,
  deleteProductContent,
  deleteProductContentTaxonomy,
  fetchProductContent,
  fetchProductContents,
  fetchProductContentTaxonomy,
  updateProductContentTaxonomy,
} from '../../store/store';
import ProductContentEditor, { initialForm, toPayload } from './productContentEditor';
import ProductPagePreview from './productPagePreview';
import { assetUrl, thumbPath, productPageUrl, slugify, websiteBase } from './productPageUrl';

const STATUS_TABS = ['all', 'draft', 'published'];
const idsOf = (items) => (items || []).map((x) => String(x?._id || x)).filter(Boolean);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

// A small picture for a list row: the record's cover image, or its code.
function CoverThumb({ item, T }) {
  const axiosGlobal = useContext(AxiosGlobal);
  const [failed, setFailed] = useState(false);
  const thumb = thumbPath(item.cover);
  const src = item.cover && !failed ? assetUrl(thumb || item.cover, axiosGlobal) : '';
  return (
    <Box sx={{ width: 48, height: 48, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: T.CTRL_BG, flexShrink: 0, color: T.TEXT_PRI, fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 800,
      textAlign: 'center', lineHeight: 1.1, overflow: 'hidden', px: src ? 0 : 0.4 }}>
      {src
        ? <Box component="img" src={src} alt="" loading="lazy" onError={() => setFailed(true)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (item.source?.needsCodeMapping ? `WP ${item.source?.wordpressIds?.en || '?'}` : item.code)}
    </Box>
  );
}

function AvailabilityPanel({ availability, T, t }) {
  const branches = availability?.branches || [];
  if (!branches.length) {
    return <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER, py: 2 }}>{t('dm.pcNoStock')}</Typography>;
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {branches.map((branch) => (
        <Box key={String(branch.branchId)} sx={{ border: `1px solid ${T.BD}`, borderRadius: '8px', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 1, bgcolor: T.CTRL_BG }}>
            <Inventory2OutlinedIcon sx={{ fontSize: 16, color: T.TEXT_SEC }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>{branch.branchName || '-'}</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>{t('dm.pcCodeVarieties', { count: branch.variants?.length || 0 })}</Typography>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <Box component="thead">
                <Box component="tr" sx={{ '& th': { textAlign: 'start', color: T.TEXT_TER, fontSize: '0.66rem', px: 1.25, py: 0.8, borderBottom: `1px solid ${T.BD}` } }}>
                  <Box component="th">{t('dm.pcColVariety')}</Box>
                  <Box component="th">{t('dm.pcColSize')}</Box>
                  <Box component="th">{t('dm.pcColQty')}</Box>
                  <Box component="th">{t('dm.pcColUnit')}</Box>
                </Box>
              </Box>
              <Box component="tbody">
                {(branch.variants || []).map((v) => (
                  <Box component="tr" key={String(v._id)} sx={{ '& td': { color: T.TEXT_PRI, fontSize: '0.74rem', px: 1.25, py: 0.85, borderBottom: `1px solid ${T.BD}` } }}>
                    <Box component="td" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{v.code}</Box>
                    <Box component="td">{[v.spec?.lengthCm, v.spec?.widthCm, v.spec?.thicknessMm].filter(Boolean).join(' x ') || '-'}</Box>
                    <Box component="td" sx={{ color: v.inStock ? '#66bb6a' : T.TEXT_TER, fontWeight: 700 }}>{v.quantity || 0}</Box>
                    <Box component="td">{v.unit}</Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function TaxonomyManager({ open, onClose }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const taxonomy = useSelector((s) => s.dmProductTaxonomy);
  const { can } = usePermissions();
  const [type, setType] = useState('category');
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const T = {
    BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    INPUT_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    TEXT_PRI: isDark ? '#ffffff' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.48)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.32)',
    BD: isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
  };
  const items = taxonomy.filter((x) => x.type === type);

  const reset = () => { setEditing(null); setName(''); setSlug(''); };
  const save = async () => {
    if (!name.trim()) return;
    const data = { type, name: name.trim(), slug: slugify(slug || name) };
    if (editing) await dispatch(updateProductContentTaxonomy({ authCtx, axiosGlobal, id: editing._id, data })).unwrap();
    else await dispatch(createProductContentTaxonomy({ authCtx, axiosGlobal, data })).unwrap();
    reset();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: T.BG, backgroundImage: 'none' } }}>
      <DialogTitle sx={{ color: T.TEXT_PRI, fontSize: '0.95rem', fontWeight: 700 }}>{t('dm.pcTaxTitle')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 0.5, bgcolor: T.INPUT_BG, borderRadius: '9px', p: '3px', border: `1px solid ${T.BD}`, alignSelf: 'flex-start' }}>
          {['category', 'tag'].map((x) => (
            <Button key={x} onClick={() => { setType(x); reset(); }}
              startIcon={x === 'category' ? <CategoryIcon sx={{ fontSize: 14 }} /> : <SellOutlinedIcon sx={{ fontSize: 14 }} />}
              sx={{ height: 26, px: 1.25, borderRadius: '7px', fontSize: '0.72rem', textTransform: 'none',
                color: type === x ? T.TEXT_PRI : T.TEXT_TER,
                bgcolor: type === x ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent' }}>
              {x === 'category' ? t('dm.pcTaxCategories') : t('dm.pcTaxTags')}
            </Button>
          ))}
        </Box>
        {can('digitalMarketing:productContent:taxonomy') && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' }, gap: 1 }}>
            <TextField label={t('dm.pcTaxName')} size="small" value={name} onChange={(e) => { setName(e.target.value); if (!editing && !slug) setSlug(slugify(e.target.value)); }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '9px' } }} />
            <TextField label={t('dm.pcSlug')} size="small" value={slug} onChange={(e) => setSlug(slugify(e.target.value))}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '9px' } }} />
            <Button variant="contained" onClick={save} sx={{ borderRadius: '8px', textTransform: 'none' }}>
              {editing ? t('dm.pcTaxUpdate') : t('dm.pcTaxAdd')}
            </Button>
          </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxHeight: 360, overflowY: 'auto' }}>
          {items.map((item) => (
            <Box key={item._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 1, border: `1px solid ${T.BD}`, borderRadius: '8px' }}>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ color: T.TEXT_PRI, fontSize: '0.8rem', fontWeight: 700 }} noWrap>{item.name}</Typography>
                <Typography sx={{ color: T.TEXT_TER, fontSize: '0.68rem' }} noWrap>{item.slug}</Typography>
              </Box>
              {can('digitalMarketing:productContent:taxonomy') && (
                <>
                  <IconButton size="small" aria-label={t('common.edit')} onClick={() => { setEditing(item); setName(item.name || ''); setSlug(item.slug || ''); }}>
                    <EditIcon sx={{ fontSize: 16, color: T.TEXT_SEC }} />
                  </IconButton>
                  <IconButton size="small" aria-label={t('common.delete')} onClick={() => setConfirmDelete(item)}>
                    <DeleteIcon sx={{ fontSize: 16, color: '#FF4D8D' }} />
                  </IconButton>
                </>
              )}
            </Box>
          ))}
          {!items.length && <Typography sx={{ color: T.TEXT_TER, fontSize: '0.8rem', textAlign: 'center', py: 3 }}>{t('dm.pcTaxEmpty')}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>{t('common.close')}</Button>
      </DialogActions>
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          await dispatch(deleteProductContentTaxonomy({ authCtx, axiosGlobal, id: confirmDelete._id }));
          setConfirmDelete(null);
        }}
        title={t('dm.pcTaxDeleteTitle')}
        message={t('dm.pcTaxDeleteMessage', { name: confirmDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        destructive
      />
    </Dialog>
  );
}

export default function ProductContentSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const items = useSelector((s) => s.dmProductContents);
  const total = useSelector((s) => s.dmProductContentsTotal);
  const loading = useSelector((s) => s.dmProductContentsLoading);
  const selectedDoc = useSelector((s) => s.dmSelectedProductContent);
  const taxonomy = useSelector((s) => s.dmProductTaxonomy);

  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [taxonomyOpen, setTaxonomyOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [detailTab, setDetailTab] = useState('page');

  const T = {
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD: isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.33)',
    CTRL_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const params = useMemo(() => ({
    status: status === 'all' ? undefined : status,
    search: search.trim() || undefined,
    page: 1,
    limit: 80,
  }), [status, search]);

  useEffect(() => {
    dispatch(fetchProductContentTaxonomy({ authCtx, axiosGlobal }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch(fetchProductContents({ authCtx, axiosGlobal, params }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const taxonomyName = (id) => taxonomy.find((x) => String(x._id) === String(id?._id || id))?.name || '';

  const selectItem = (item) => {
    setSelected(item);
    setDetailTab('page');
    dispatch(fetchProductContent({ authCtx, axiosGlobal, id: item._id }));
    if (isMob) setMobileDetail(true);
  };

  const closeDetail = () => {
    setSelected(null);
    if (isMob) setMobileDetail(false);
  };

  const ready = selectedDoc && selected && String(selectedDoc._id) === String(selected._id);
  const editTarget = creating ? null : (ready ? selectedDoc : selected);
  const previewPayload = useMemo(() => (ready ? toPayload(initialForm(selectedDoc)) : null), [ready, selectedDoc]);
  const stockBranchIds = useMemo(() => (ready
    ? (selectedDoc.availability?.branches || []).filter((b) => (b.variants || []).some((v) => v.inStock)).map((b) => b.branchId)
    : []), [ready, selectedDoc]);
  const canEdit = can('digitalMarketing:productContent:edit');
  const canCreate = can('digitalMarketing:productContent:create');

  const openEditor = (create) => { setCreating(create); setEditorOpen(true); };

  const afterSave = (doc) => {
    // keep the saved record selected and its preview/details fresh
    if (doc && doc._id) {
      setSelected({ _id: doc._id, code: doc.code, title: doc.title, slug: doc.slug, status: doc.status });
      setDetailTab('page');
      dispatch(fetchProductContent({ authCtx, axiosGlobal, id: doc._id }));
      if (isMob) setMobileDetail(true);
    }
    dispatch(fetchProductContents({ authCtx, axiosGlobal, params }));
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {(!isMob || !mobileDetail) && (
        <Box sx={{ width: isMob ? '100%' : (selected ? 380 : '100%'), flexShrink: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRight: (!isMob && selected) ? `1px solid ${T.BD}` : 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
              {t('dm.pcSectionCount', { count: total })}
            </Typography>
            {can('digitalMarketing:productContent:taxonomy') && (
              <Button size="small" startIcon={<SettingsSuggestOutlinedIcon sx={{ fontSize: 14 }} />} onClick={() => setTaxonomyOpen(true)}
                sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px', color: T.TEXT_SEC }}>
                {t('dm.pcTaxonomy')}
              </Button>
            )}
            {canCreate && (
              <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => openEditor(true)}
                sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px' }}>
                {t('dm.pcNewProduct')}
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, px: 2, pb: 1, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder={t('dm.pcSearchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 200, flexGrow: 1, '& .MuiOutlinedInput-root': { height: 32, bgcolor: T.CTRL_BG, borderRadius: '8px', fontSize: '0.78rem' } }} />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {STATUS_TABS.map((s) => {
                const active = status === s;
                return (
                  <Button key={s} size="small" onClick={() => setStatus(s)}
                    sx={{ minWidth: 0, height: 30, px: 1.1, py: 0, borderRadius: '7px',
                      fontSize: '0.68rem', fontWeight: active ? 700 : 400, textTransform: 'none',
                      color: active ? T.TEXT_PRI : T.TEXT_TER,
                      bgcolor: active ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
                      border: `1px solid ${active ? T.BD2 : 'transparent'}` }}>
                    {s === 'all' ? t('common.all') : (s === 'draft' ? t('dm.pcStatusDraft') : t('dm.pcStatusPublished'))}
                  </Button>
                );
              })}
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
            {loading && !items.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={22} sx={{ color: T.TEXT_TER }} /></Box>
            ) : !items.length ? (
              <Typography sx={{ textAlign: 'center', color: T.TEXT_TER, py: 6, fontSize: '0.82rem' }}>{t('dm.pcListEmpty')}</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {items.map((item) => {
                  const isSel = selected && String(selected._id) === String(item._id);
                  return (
                    <Box key={item._id} onClick={() => selectItem(item)}
                      sx={{ display: 'flex', gap: 1.25, p: 1.25, borderRadius: '10px', cursor: 'pointer',
                        bgcolor: isSel ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent',
                        border: `1px solid ${isSel ? T.BD2 : 'transparent'}`,
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' } }}>
                      <CoverThumb item={item} T={T} />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }} noWrap>
                            {item.title || item.code}
                          </Typography>
                          <Chip label={item.status === 'published' ? t('dm.pcStatusPublished') : t('dm.pcStatusDraft')} size="small"
                            sx={{ height: 17, fontSize: '0.6rem', fontWeight: 700,
                              bgcolor: item.status === 'published' ? '#81c78422' : '#9e9e9e22',
                              color: item.status === 'published' ? '#81c784' : '#9e9e9e', '& .MuiChip-label': { px: 0.6 } }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, mt: 0.3 }} noWrap>
                          {item.code} · /{item.slug || '-'} · {fmtDate(item.updateDate)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {selected && (!isMob || mobileDetail) && (
        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: T.PANEL_BG }}>
          {!ready ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={22} sx={{ color: T.TEXT_TER }} /></Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: { xs: 1.5, md: 2.5 }, pt: 1.5, pb: 1 }}>
                {isMob && (
                  <IconButton size="small" onClick={closeDetail} aria-label={t('common.back')}
                    sx={{ color: T.TEXT_TER, bgcolor: T.CTRL_BG, borderRadius: '8px', width: 30, height: 30 }}>
                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '1.1rem', color: T.TEXT_PRI, fontWeight: 800 }} noWrap>{selectedDoc.title || selectedDoc.code}</Typography>
                  <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_TER, fontFamily: 'monospace' }} noWrap>
                    {selectedDoc.code} · /{selectedDoc.slug}
                  </Typography>
                </Box>
                <Chip label={selectedDoc.status === 'published' ? t('dm.pcStatusPublished') : t('dm.pcStatusDraft')} size="small"
                  sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700,
                    bgcolor: selectedDoc.status === 'published' ? '#81c78422' : '#9e9e9e22',
                    color: selectedDoc.status === 'published' ? '#81c784' : '#9e9e9e' }} />
                {selectedDoc.status === 'published' && (
                  <IconButton size="small" component="a" target="_blank" rel="noopener noreferrer" aria-label={t('dm.pcOpenSite')} title={t('dm.pcOpenSite')}
                    href={productPageUrl({ base: websiteBase(axiosGlobal), slug: selectedDoc.slug })}>
                    <OpenInNewIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                )}
                {canEdit && (
                  <Button size="small" variant="contained" startIcon={<EditIcon sx={{ fontSize: 14 }} />} onClick={() => openEditor(false)}
                    sx={{ textTransform: 'none', borderRadius: '8px' }}>{t('common.edit')}</Button>
                )}
                {can('digitalMarketing:productContent:delete') && (
                  <IconButton size="small" onClick={() => setConfirmDelete(true)} aria-label={t('common.delete')}><DeleteIcon sx={{ fontSize: 17, color: '#FF4D8D' }} /></IconButton>
                )}
              </Box>
              <Tabs value={detailTab} onChange={(e, v) => setDetailTab(v)} sx={{ minHeight: 34, px: { xs: 1, md: 2 }, borderBottom: `1px solid ${T.BD}`,
                '& .MuiTab-root': { minHeight: 34, py: 0, textTransform: 'none', fontSize: '0.78rem' } }}>
                <Tab value="page" label={t('dm.pcTabPage')} />
                <Tab value="content" label={t('dm.pcTabContent')} />
              </Tabs>

              {detailTab === 'page' ? (
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <ProductPagePreview key={selectedDoc._id} payload={previewPayload} contentId={selectedDoc._id}
                    published={selectedDoc.status === 'published'} canPreview={canEdit || canCreate}
                    preferredBranchIds={stockBranchIds} active />
                </Box>
              ) : (
                <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: { xs: 1.5, md: 3 }, py: 2 }}>
                  <Box sx={{ maxWidth: 980, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selectedDoc.source?.needsCodeMapping && (
                        <Chip label={t('dm.pcNeedsCode')} size="small" sx={{ height: 22, fontSize: '0.68rem', color: '#FF4D8D', bgcolor: '#FF4D8D18' }} />
                      )}
                      {idsOf(selectedDoc.categories).map((id) => taxonomyName(id)).filter(Boolean).map((name) => (
                        <Chip key={`c-${name}`} label={name} size="small" icon={<CategoryIcon sx={{ fontSize: 13 }} />} sx={{ height: 22, fontSize: '0.68rem' }} />
                      ))}
                      {idsOf(selectedDoc.tags).map((id) => taxonomyName(id)).filter(Boolean).map((name) => (
                        <Chip key={`t-${name}`} label={name} size="small" icon={<SellOutlinedIcon sx={{ fontSize: 13 }} />} sx={{ height: 22, fontSize: '0.68rem' }} />
                      ))}
                    </Box>
                    {selectedDoc.excerpt && (
                      <Box sx={{ fontSize: '0.86rem', color: T.TEXT_SEC }} dangerouslySetInnerHTML={{ __html: selectedDoc.excerpt }} />
                    )}
                    {(selectedDoc.gallery || []).length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
                        {selectedDoc.gallery.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((img, index) => (
                          <Box key={`${img.url}-${index}`} component="img" src={assetUrl(thumbPath(img.url) || img.url, axiosGlobal)} alt={img.alt || ''}
                            onError={(e) => { const full = assetUrl(img.url, axiosGlobal); if (e.currentTarget.src !== full) e.currentTarget.src = full; }}
                            sx={{ width: 96, height: 72, objectFit: 'cover', borderRadius: '8px', flexShrink: 0, bgcolor: T.CTRL_BG }} />
                        ))}
                      </Box>
                    )}
                    <Divider sx={{ borderColor: T.BD }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: T.TEXT_TER, mb: 1 }}>{t('dm.pcStockTitle')}</Typography>
                      <AvailabilityPanel availability={selectedDoc.availability} T={T} t={t} />
                    </Box>
                    {selectedDoc.body && (
                      <Box>
                        <Typography sx={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: T.TEXT_TER, mb: 1 }}>{t('dm.pcBody')}</Typography>
                        <Box sx={{ color: T.TEXT_PRI, fontSize: '0.86rem', '& img': { maxWidth: '100%', borderRadius: '8px' } }}
                          dangerouslySetInnerHTML={{ __html: selectedDoc.body }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {!selected && !isMob && items.length > 0 && (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Inventory2OutlinedIcon sx={{ fontSize: 40, color: T.TEXT_TER, mb: 1 }} />
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>{t('dm.pcSelectHint')}</Typography>
          </Box>
        </Box>
      )}

      <ProductContentEditor open={editorOpen} onClose={() => setEditorOpen(false)} content={editorOpen ? editTarget : null}
        taxonomy={taxonomy} onSaved={afterSave} />
      <TaxonomyManager open={taxonomyOpen} onClose={() => setTaxonomyOpen(false)} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await dispatch(deleteProductContent({ authCtx, axiosGlobal, id: selected._id }));
          setConfirmDelete(false);
          closeDetail();
        }}
        title={t('dm.pcDeleteTitle')}
        message={t('dm.pcDeleteMessage', { code: selected?.code || '' })}
        confirmLabel={t('common.delete')}
        destructive
      />
    </Box>
  );
}
