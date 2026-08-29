import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { actions } from '../../store/store';
import { LANGUAGES } from '../../i18n';
import { buildShareText, normalizeWaNumber, countryFlag, formatQty, UNIT_LABELS } from '../inventory/util/whatsappTemplate';

// Same 13-entry catalog as api/routes/inventory/lookups.js's stoneTypes — kept
// as a local constant rather than fetching GET /inventory/lookups, since that
// route is gated by inventory:view (a permission this feature's users may not
// hold — they only need inventory:share:whatsapp).
const STONE_TYPES = [
  { code: 'TR', name: 'Travertine' }, { code: 'MA', name: 'Marble' }, { code: 'GR', name: 'Granite' },
  { code: 'ON', name: 'Onyx' }, { code: 'QU', name: 'Chinese Granite' }, { code: 'LI', name: 'Limestone' },
  { code: 'BA', name: 'Basalt' }, { code: 'AL', name: 'Alabaster' }, { code: 'CR', name: 'Crystal' },
  { code: 'AN', name: 'Andesite' }, { code: 'TO', name: 'Traonyx' }, { code: 'TM', name: 'Tramite' }, { code: 'OT', name: 'Other' },
];

// Two entry points:
//  - variantDetail.js (Inventory) passes `variantId` — skips straight to the form.
//  - whatsappShareSection.js (Digital Marketing) passes no `variantId` — opens
//    on a search step (product/variant picker) first.
// Every completed Copy text / Open in WhatsApp action persists a record via
// POST /digitalMarketing/whatsapp-shares — see models/whatsappShareModel.js.
export default function ShareWhatsAppDialog({ open, onClose, variantId: variantIdProp }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [step, setStep] = useState(variantIdProp ? 'form' : 'search');
  const [selectedVariantId, setSelectedVariantId] = useState(variantIdProp || null);

  // ── search step ──
  const [searchText, setSearchText] = useState('');
  const [stoneTypeFilter, setStoneTypeFilter] = useState('');
  const [branchOptionsAll, setBranchOptionsAll] = useState([]);
  const [branchFilterIds, setBranchFilterIds] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // ── form step ──
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState(null);
  const [product, setProduct] = useState(null);
  const [branchOptions, setBranchOptions] = useState([]);
  const [contactOptions, setContactOptions] = useState([]);

  // Multi-select — any subset of en/fa/ar. Sections are always rendered in
  // the fixed LANGUAGES catalog order (en -> fa -> ar) by buildShareText
  // regardless of pick order, matching the client's "must place after each
  // other" ask (English first, then the RTL language).
  const [langs, setLangs] = useState(['ar']);
  const toggleLang = (code) => {
    setLangs((prev) => {
      if (prev.includes(code)) {
        const next = prev.filter((c) => c !== code);
        return next.length ? next : prev; // never allow zero languages selected
      }
      return [...prev, code];
    });
  };
  const [nameLanguage, setNameLanguage] = useState('ar');
  const [includeName, setIncludeName] = useState(true);
  const [includeDimensions, setIncludeDimensions] = useState(true);
  const [includeCode, setIncludeCode] = useState(true);
  const [includeContact, setIncludeContact] = useState(true);
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);
  const [contacts, setContacts] = useState([]);   // multi-select — see contactSnapshots below
  const [previewText, setPreviewText] = useState('');
  const [manuallyEdited, setManuallyEdited] = useState(false);

  // Reset to the right starting step whenever the dialog (re)opens.
  useEffect(() => {
    if (!open) return;
    if (variantIdProp) {
      setSelectedVariantId(variantIdProp);
      setStep('form');
    } else {
      setSelectedVariantId(null);
      setStep('search');
      setSearchText(''); setStoneTypeFilter(''); setBranchFilterIds([]); setSearchResults([]);
    }
  }, [open, variantIdProp]);

  // Branch filter checklist options — any authenticated user can read GET /branches.
  useEffect(() => {
    if (!open || step !== 'search') return;
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/branches` })
      .then((res) => setBranchOptionsAll(res.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  // Debounced product/variant search.
  useEffect(() => {
    if (!open || step !== 'search') return;
    setSearching(true);
    const timer = setTimeout(() => {
      authCtx.jwtInst({
        method: 'get', url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/products-lookup`,
        params: { search: searchText, stoneType: stoneTypeFilter, branchId: branchFilterIds.join(',') },
      }).then((res) => setSearchResults(res.data || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, searchText, stoneTypeFilter, branchFilterIds]);

  const toggleBranchFilter = (id) => {
    setBranchFilterIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const pickVariant = (v) => {
    setSelectedVariantId(v._id);
    setStep('form');
  };
  const backToSearch = () => { setStep('search'); setSelectedVariantId(null); };

  // Split from a generic boolean so a permission gap (403 — role/seed hasn't
  // caught up on the server) shows a message distinct from a plain network/
  // server failure, instead of both collapsing into one unhelpful "failed to
  // load" — this is the second report of the contact list being empty, so
  // the next report should carry an actual diagnosis instead of a guess.
  const [contactsFailed, setContactsFailed] = useState(false);
  const [contactsFailedStatus, setContactsFailedStatus] = useState(null);

  const load = useCallback(async () => {
    if (!selectedVariantId) return;
    setLoading(true);
    try {
      const [detailRes, availRes] = await Promise.all([
        authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/inventory/variants/${selectedVariantId}` }),
        authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/inventory/variants/${selectedVariantId}/branch-availability` }),
      ]);
      const v = detailRes.data.data.variant;
      const p = detailRes.data.data.product;
      setVariant(v);
      setProduct(p);
      setBranchOptions(availRes.data.data || []);
      setSelectedBranchIds([v.branchId]);
      setContacts([]);
      setManuallyEdited(false);
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true, msg: t('inventory.shareFailedToLoad'), type: 'error' }));
      if (variantIdProp) onClose(); else backToSearch();
      setLoading(false);
      return;
    }
    // The contact picker is a separate, best-effort fetch — a hiccup here
    // must never take down the rest of the form (that used to be bundled
    // into the same Promise.all, so ANY failure — even just contacts —
    // silently bounced the whole dialog back to search/closed).
    setContactsFailed(false);
    setContactsFailedStatus(null);
    try {
      const contactsRes = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/inventory/share-contacts` });
      setContactOptions(contactsRes.data.data || []);
    } catch (err) {
      setContactOptions([]);
      setContactsFailed(true);
      setContactsFailedStatus(err?.response?.status || null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId]);

  useEffect(() => { if (open && step === 'form' && selectedVariantId) load(); }, [open, step, selectedVariantId, load]);

  const selectedBranches = useMemo(
    () => branchOptions.filter((b) => selectedBranchIds.includes(b.branchId)),
    [branchOptions, selectedBranchIds]
  );

  // contacts state holds the full picked user objects; contactSnapshots is
  // the {name, waNumber, branchNames} shape both the template and the saved
  // record need.
  const contactSnapshots = useMemo(() => contacts.map((c) => ({
    name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
    waNumber: normalizeWaNumber(c.countryCode, c.phoneNumber),
    branchNames: c.branchNames || [],
    userId: c._id,
  })), [contacts]);

  const generatedText = useMemo(() => {
    if (!variant || !product) return '';
    return buildShareText({
      product, variant, langs, nameLanguage, includeName, includeDimensions, includeCode, includeContact,
      branches: selectedBranches, contacts: contactSnapshots,
    });
  }, [product, variant, langs, nameLanguage, includeName, includeDimensions, includeCode, includeContact, selectedBranches, contactSnapshots]);

  // Keep the preview in sync with the field toggles/selections — unless the
  // rep has started hand-editing it, in which case their edits win until they
  // explicitly reset.
  useEffect(() => {
    if (!manuallyEdited) setPreviewText(generatedText);
  }, [generatedText, manuallyEdited]);

  const toggleBranch = (branchId) => {
    setSelectedBranchIds((prev) => prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]);
  };

  // Fire-and-forget — a failed save must never block the copy/open action the
  // user actually asked for.
  const saveShareRecord = (action) => {
    authCtx.jwtInst({
      method: 'post',
      url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/whatsapp-shares`,
      data: {
        variantId: variant?._id, productId: product?._id,
        productName: product?.name || '', productNameAr: product?.nameAr || '',
        variantCode: variant?.code || '',
        unsized: !!variant?.spec?.unsized, lengthCm: variant?.spec?.lengthCm ?? null,
        widthCm: variant?.spec?.widthCm ?? null, thicknessMm: variant?.spec?.thicknessMm ?? null,
        languages: langs, nameLanguage,
        includeName, includeDimensions, includeCode, includeContact,
        branches: selectedBranches,
        contacts: contactSnapshots,
        text: previewText, action,
      },
    }).catch(() => {});
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewText);
      dispatch(actions.setShowSnackBar({ status: true, msg: t('inventory.shareCopyTextSuccess'), type: 'success' }));
      saveShareRecord('copied');
    } catch (_) {
      dispatch(actions.setShowSnackBar({ status: true, msg: t('inventory.shareCopyFailed'), type: 'error' }));
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(previewText)}`, '_blank', 'noopener,noreferrer');
    saveShareRecord('openedWhatsApp');
  };

  return (
    // Opened from inside variantDetail.js's own Dialog (Inventory entry point)
    // — both default to the same theme.zIndex.modal, and DOM/paint-order
    // stacking for that case isn't something to gamble on untested (see
    // tutorialForm.js's Drawer for a real bug that came from exactly this
    // kind of nested-modal guesswork).
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
        {step === 'form' && !variantIdProp && (
          <IconButton size="small" onClick={backToSearch} sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        <WhatsAppIcon sx={{ color: '#25D366', fontSize: 20 }} />
        <Box component="span" sx={{ flexGrow: 1 }}>{t('inventory.shareDialogTitle')}</Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      {step === 'search' ? (
        <>
          <DialogContent sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 1.5, pt: '4px !important' }}>
            <TextField size="small" fullWidth autoFocus value={searchText} onChange={(e) => setSearchText(e.target.value)}
              placeholder={t('inventory.shareSearchPlaceholder')}
              InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 17, color: 'text.disabled', mr: 1 }} /> }} />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Button size="small" onClick={() => setStoneTypeFilter('')}
                variant={stoneTypeFilter === '' ? 'contained' : 'outlined'}
                sx={{ minWidth: 0, height: 24, px: 1, fontSize: '0.68rem', textTransform: 'none', borderRadius: '7px' }}>
                {t('common.all')}
              </Button>
              {STONE_TYPES.map((s) => (
                <Button key={s.code} size="small" onClick={() => setStoneTypeFilter(s.code)}
                  variant={stoneTypeFilter === s.code ? 'contained' : 'outlined'}
                  sx={{ minWidth: 0, height: 24, px: 1, fontSize: '0.68rem', textTransform: 'none', borderRadius: '7px' }}>
                  {s.name}
                </Button>
              ))}
            </Box>

            {branchOptionsAll.length > 1 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {branchOptionsAll.map((b) => (
                  <FormControlLabel key={b._id} sx={{ mr: 1 }}
                    control={<Checkbox size="small" checked={branchFilterIds.includes(b._id)} onChange={() => toggleBranchFilter(b._id)} />}
                    label={<Typography variant="body2">{countryFlag(b.country)} {b.name}</Typography>} />
                ))}
              </Box>
            )}

            <Divider />

            <Box sx={{ minHeight: 260, maxHeight: 360, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
              {searching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : searchResults.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: 'text.disabled', fontSize: '0.8rem', py: 4 }}>
                  {t('inventory.shareNoResults')}
                </Typography>
              ) : (
                searchResults.map((p) => (
                  <Box key={p._id} sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      {p.name} <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.disabled', fontFamily: 'monospace' }}>{p.code}</Typography>
                    </Typography>
                    {(p.variants || []).length === 0 ? (
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', pl: 1 }}>{t('inventory.shareNoVariants')}</Typography>
                    ) : (
                      p.variants.map((v) => (
                        <Box key={v._id} onClick={() => pickVariant(v)}
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.75, ml: 1, borderRadius: '6px',
                            cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                          <Typography sx={{ fontSize: '0.74rem', fontFamily: 'monospace', flexGrow: 1 }}>{v.code}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
                            {countryFlag(v.country)} {v.branchName} · {formatQty(v.quantity)} {UNIT_LABELS[v.unit] || v.unit}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                ))
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} size="small">{t('common.cancel')}</Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogContent sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 2, pt: '4px !important' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={22} />
              </Box>
            ) : (
              <>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}>
                    {t('inventory.shareTemplateLanguage')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {LANGUAGES.map((l) => (
                      <FormControlLabel key={l.code}
                        control={<Checkbox size="small" checked={langs.includes(l.code)} onChange={() => toggleLang(l.code)} />}
                        label={<Typography variant="body2">{l.nativeLabel}</Typography>} />
                    ))}
                  </Box>
                </Box>

                <TextField select size="small" fullWidth label={t('inventory.shareNameLanguage')} value={nameLanguage}
                  onChange={(e) => setNameLanguage(e.target.value)} SelectProps={{ native: true }}
                  disabled={!includeName || langs.length > 1}
                  helperText={langs.length > 1 ? t('inventory.shareNameLanguageMultiHint') : undefined}>
                  <option value="en">{t('inventory.shareNameLanguageEnglish')}</option>
                  <option value="ar">{t('inventory.shareNameLanguageArabic')}</option>
                </TextField>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}>
                    {t('inventory.shareFieldsLabel')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <FormControlLabel control={<Checkbox size="small" checked={includeName} onChange={(e) => setIncludeName(e.target.checked)} />}
                      label={<Typography variant="body2">{t('inventory.shareFieldName')}</Typography>} />
                    <FormControlLabel control={<Checkbox size="small" checked={includeDimensions} onChange={(e) => setIncludeDimensions(e.target.checked)} />}
                      label={<Typography variant="body2">{t('inventory.shareFieldDimensions')}</Typography>} />
                    <FormControlLabel control={<Checkbox size="small" checked={includeCode} onChange={(e) => setIncludeCode(e.target.checked)} />}
                      label={<Typography variant="body2">{t('inventory.shareFieldCode')}</Typography>} />
                    <FormControlLabel control={<Checkbox size="small" checked={includeContact} onChange={(e) => setIncludeContact(e.target.checked)} />}
                      label={<Typography variant="body2">{t('inventory.shareFieldContact')}</Typography>} />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}>
                    {t('inventory.shareBranchesLabel')}
                  </Typography>
                  {branchOptions.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>{t('inventory.shareNoBranchStock')}</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {branchOptions.map((b) => (
                        <FormControlLabel key={b.branchId}
                          control={<Checkbox size="small" checked={selectedBranchIds.includes(b.branchId)} onChange={() => toggleBranch(b.branchId)} />}
                          label={
                            <Typography variant="body2">
                              {countryFlag(b.country)} {b.branchName} — {formatQty(b.quantity)} {b.unit}
                            </Typography>
                          } />
                      ))}
                    </Box>
                  )}
                </Box>

                {includeContact && (
                  <Autocomplete
                    multiple
                    options={contactOptions}
                    value={contacts}
                    onChange={(_, val) => setContacts(val)}
                    getOptionLabel={(o) => `${o.firstName || ''} ${o.lastName || ''}`.trim()}
                    isOptionEqualToValue={(o, v) => o._id === v._id}
                    noOptionsText={contactsFailed
                      ? (contactsFailedStatus === 403 ? t('inventory.shareContactsForbidden') : t('inventory.shareContactsFailedToLoad'))
                      : t('inventory.shareNoResults')}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option._id}>
                        <Box>
                          <Typography variant="body2">{`${option.firstName || ''} ${option.lastName || ''}`.trim()}</Typography>
                          {option.branchNames?.length > 0 && (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              {option.branchNames.join(', ')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    renderTags={(value, getTagProps) => value.map((option, index) => (
                      <Chip size="small" {...getTagProps({ index })}
                        label={`${option.firstName || ''} ${option.lastName || ''}`.trim()} />
                    ))}
                    renderInput={(params) => (
                      <TextField {...params} size="small" label={t('inventory.shareContactLabel')}
                        helperText={contactsFailed
                          ? (contactsFailedStatus === 403 ? t('inventory.shareContactsForbidden') : t('inventory.shareContactsFailedToLoad'))
                          : t('inventory.shareContactHelper')}
                        FormHelperTextProps={contactsFailed ? { sx: { color: 'error.main' } } : undefined} />
                    )}
                  />
                )}

                <Divider />

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', flexGrow: 1 }}>
                      {t('inventory.sharePreviewLabel')}
                    </Typography>
                    {manuallyEdited && (
                      <Button size="small" startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                        onClick={() => { setManuallyEdited(false); setPreviewText(generatedText); }}
                        sx={{ fontSize: '0.7rem', textTransform: 'none' }}>
                        {t('inventory.shareResetToTemplate')}
                      </Button>
                    )}
                  </Box>
                  <TextField multiline minRows={6} fullWidth value={previewText}
                    onChange={(e) => { setPreviewText(e.target.value); setManuallyEdited(true); }}
                    // unicode-bidi:plaintext makes each LINE resolve its own
                    // direction from its own first strong character (per the
                    // Unicode bidi algorithm), independent of the box's base
                    // `direction` — the correct behavior once a message can
                    // mix English and Arabic/Farsi sections in one preview.
                    sx={{ '& textarea': { direction: 'ltr', unicodeBidi: 'plaintext' } }} />
                </Box>
              </>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} size="small">{t('common.cancel')}</Button>
            <Button onClick={handleCopy} variant="outlined" size="small" startIcon={<ContentCopyIcon sx={{ fontSize: 15 }} />}
              disabled={loading || !previewText}>
              {t('inventory.shareCopyText')}
            </Button>
            <Button onClick={handleOpenWhatsApp} variant="contained" size="small" startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
              disabled={loading || !previewText}
              sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1EBE59' } }}>
              {t('inventory.shareOpenInWhatsApp')}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
