import { useState, useContext, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Autocomplete from '@mui/material/Autocomplete';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StraightenIcon from '@mui/icons-material/Straighten';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { actions, createSupplyDealLetter, updateSupplyDealLetter } from '../../store/store';
import SpecCodeBuilder from '../inventory/specCodeBuilder';

// A deal letter tracks ONE coupe purchase for its parent supply record's
// product, AND is the source of the printed stone sales contract
// (قرارداد فروش سنگ). The form is tabbed because those are two genuinely
// different jobs: the operational coupe/forecast data, and the contract that
// gets signed. Everything on the Contract tabs is optional — a deal letter is
// usable as an internal record long before anyone prints a contract from it.
// Defined at MODULE scope on purpose. A component declared inside another
// component body is a NEW component type on every render, so React unmounts and
// remounts its whole subtree each time — which drops keyboard focus (the caret
// jumps out of the input mid-typing) and resets tab position.
function SubHead({ children, T }) {
  return (
    <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: 1, color: T.TEXT_TER, mt: 0.5 }}>
      {children}
    </Typography>
  );
}
export default function DealLetterForm({ open, onClose, supplyId, productId, dealLetter = null }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const isEdit = Boolean(dealLetter);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const EMPTY_CONTRACT = {
    number: '', date: '',
    seller: { party: '', addressPhone: '' },
    buyer: { name: '', position: '', representedBy: '', onBehalfOf: '', nationalId: '', addressPhone: '' },
    currency: 'IRR', totalInWords: '', paymentTerms: '',
    guarantee: '', validityDays: 3, settlementDays: '', loadingDays: '',
  };

  const [tab, setTab] = useState(0);
  const [coupeSpec, setCoupeSpec] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [variantOptions, setVariantOptions] = useState([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [product, setProduct] = useState(null);              // the record's product, as the variety lookup describes it
  const [lookupVersion, setLookupVersion] = useState(0);     // bumped when the builder adds a variety, so the list refreshes
  const [specOpen, setSpecOpen] = useState(false);           // the other way to a variety: its specification
  const [lines, setLines] = useState([]);
  const [contract, setContract] = useState(EMPTY_CONTRACT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── hydrate ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setError(''); setTab(0); setSpecOpen(false);
    if (dealLetter) {
      setCoupeSpec(dealLetter.coupeSpec || '');
      setSellerName(dealLetter.coupeSeller?.name || '');
      setSellerPhone(dealLetter.coupeSeller?.phone || '');
      setSellerNotes(dealLetter.coupeSeller?.notes || '');
      setLines((dealLetter.varietyLines || []).map((l) => ({
        variantId: String(l.variantId), code: l.variantCode, unit: l.unit,
        forecastQty: l.forecastQty ?? 0,
        finalQty: l.finalQty ?? '',
        price: l.price ?? '',
        stoneTypeLabel: l.stoneTypeLabel || l.variantCode || '',
        count: l.count ?? '', widthCm: l.widthCm ?? '', lengthCm: l.lengthCm ?? '',
      })));
      const c = dealLetter.contract || {};
      setContract({
        ...EMPTY_CONTRACT, ...c,
        date: c.date ? String(c.date).slice(0, 10) : '',
        seller: { ...EMPTY_CONTRACT.seller, ...(c.seller || {}) },
        buyer:  { ...EMPTY_CONTRACT.buyer,  ...(c.buyer  || {}) },
        validityDays:   c.validityDays ?? 3,
        settlementDays: c.settlementDays ?? '',
        loadingDays:    c.loadingDays ?? '',
      });
    } else {
      setCoupeSpec(''); setSellerName(''); setSellerPhone(''); setSellerNotes('');
      setLines([]); setContract(EMPTY_CONTRACT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dealLetter?._id]);

  useEffect(() => {
    if (!open || !productId) return;
    setVariantLoading(true);
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/supply/variants-lookup`, params: { productId } })
      .then((res) => { setVariantOptions(res.data.data || []); setProduct(res.data.product || null); })
      .catch(() => { setVariantOptions([]); setProduct(null); })
      .finally(() => setVariantLoading(false));
  }, [open, productId, lookupVersion, authCtx, axiosGlobal]);

  const availableOptions = variantOptions.filter((v) => !lines.some((l) => l.variantId === String(v._id)));
  // what the specification builder works on: this record's product, with the varieties it has now
  const fixedProduct = useMemo(() => (product ? { ...product, variants: variantOptions } : null), [product, variantOptions]);
  const usedCodes = useMemo(() => new Set(lines.map((l) => String(l.code || '').toUpperCase())), [lines]);

  // ── line helpers ──────────────────────────────────────────────────────────
  // A new line seeds نوع سنگ and the dimensions from the variant's parsed stone
  // code, so the contract table is mostly filled before anyone types.
  const addLine = (variant) => {
    if (!variant) return;
    setLines((prev) => [...prev, {
      variantId: String(variant._id), code: variant.code, unit: variant.unit,
      forecastQty: 0, finalQty: '', price: '',
      stoneTypeLabel: variant.code,
      count: '',
      widthCm: variant.spec?.widthCm ?? '',
      lengthCm: variant.spec?.lengthCm ?? '',
    }]);
  };
  // a variety found / added by the specification builder: one the letter already has is not added twice
  const useBuiltVariety = (builtProduct, variant) => {
    if (!variant) return;
    if (lines.some((l) => l.variantId === String(variant._id))) {
      dispatch(actions.setShowSnackBar({ status: true, type: 'info', msg: `${variant.code} — ${t('inventory.specAlreadyUsed')}` }));
      return;
    }
    addLine(variant);
  };
  const removeLine = (variantId) => setLines((p) => p.filter((l) => l.variantId !== variantId));
  const setLineField = (variantId, key, value) =>
    setLines((p) => p.map((l) => (l.variantId === variantId ? { ...l, [key]: value } : l)));

  const setC = (key, value) => setContract((c) => ({ ...c, [key]: value }));
  const setCSeller = (key, value) => setContract((c) => ({ ...c, seller: { ...c.seller, [key]: value } }));
  const setCBuyer = (key, value) => setContract((c) => ({ ...c, buyer: { ...c.buyer, [key]: value } }));

  // متر مربع / مبلغ کل mirror exactly what the template derives, so the form
  // shows the same figures the printed contract will.
  const rows = useMemo(() => lines.map((l) => {
    const sqm = l.finalQty !== '' && l.finalQty !== null ? Number(l.finalQty) : Number(l.forecastQty) || 0;
    const unitPrice = Number(l.price) || 0;
    return { ...l, sqm, unitPrice, total: sqm * unitPrice };
  }), [lines]);

  const totals = useMemo(() => rows.reduce((a, r) => ({
    sqm: a.sqm + (Number(r.sqm) || 0),
    count: a.count + (Number(r.count) || 0),
    amount: a.amount + (Number(r.total) || 0),
  }), { sqm: 0, count: 0, amount: 0 }), [rows]);

  const fmt = (n) => (Number(n) || 0).toLocaleString('en-US');

  const handleClose = () => { if (!saving) onClose(); };

  const handleSave = async () => {
    if (!sellerName.trim()) { setTab(0); setError(t('supply.sellerNameRequired')); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        coupeSpec,
        coupeSeller: { name: sellerName.trim(), phone: sellerPhone, notes: sellerNotes },
        varietyLines: lines.map((l) => ({
          variantId: l.variantId,
          forecastQty: Number(l.forecastQty) || 0,
          ...(isEdit ? {} : {}),
          finalQty: l.finalQty === '' ? null : Number(l.finalQty),
          stoneTypeLabel: l.stoneTypeLabel,
          count:    l.count    === '' ? null : Number(l.count),
          widthCm:  l.widthCm  === '' ? null : Number(l.widthCm),
          lengthCm: l.lengthCm === '' ? null : Number(l.lengthCm),
        })),
        contract: {
          ...contract,
          date: contract.date || null,
          validityDays:   contract.validityDays   === '' ? null : Number(contract.validityDays),
          settlementDays: contract.settlementDays === '' ? null : Number(contract.settlementDays),
          loadingDays:    contract.loadingDays    === '' ? null : Number(contract.loadingDays),
        },
      };
      if (isEdit) {
        await dispatch(updateSupplyDealLetter({
          authCtx, axiosGlobal, id: dealLetter._id, supplyId, data: payload,
        })).unwrap();
      } else {
        await dispatch(createSupplyDealLetter({
          authCtx, axiosGlobal, data: { supplyId, ...payload },
        })).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('supply.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const field = { size: 'small', InputLabelProps: { shrink: true } };
  // Identifiers and phone numbers are latin digits read left-to-right even in
  // an RTL locale.
  const idField = { ...field, inputProps: { dir: 'ltr', inputMode: 'numeric' },
    sx: { '& input': { fontFamily: 'monospace', fontSize: '0.8rem' } } };
  const telField = { ...field, type: 'tel', inputProps: { dir: 'ltr', inputMode: 'tel' },
    sx: { '& input': { fontFamily: 'monospace', fontSize: '0.8rem' } } };
  const selectOnFocus = { onFocus: (e) => e.target.select() };
  const numCell = (w) => ({ width: w, '& input': { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } });

  const tabSx = { minHeight: 38, textTransform: 'none', fontSize: '0.76rem', fontWeight: 600,
    color: T.TEXT_TER, '&.Mui-selected': { color: T.TEXT_PRI } };


  return (
    // This drawer opens from INSIDE the deal letter detail, which is itself a Dialog.
    // A Drawer sits at theme.zIndex.drawer (1200) and a Dialog at modal (1300), so without
    // this it opened behind the dialog it was launched from. Raising it means every
    // portalled child inside it (the variety picker, the specification builder's menus)
    // has to be raised too - see the MUI portal z-index trap in CLAUDE.md.
    <Drawer anchor="right" open={open} onClose={handleClose}
      sx={{ zIndex: (th) => th.zIndex.modal + 1 }}
      PaperProps={{ sx: { width: isXs ? '100vw' : 780, maxWidth: '100vw' } }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, pt: 2, pb: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {isEdit ? t('supply.editDealLetter') : t('supply.newDealLetter')}
        </Typography>
        <IconButton onClick={handleClose} size="small"><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{ px: 3, minHeight: 38, borderBottom: `1px solid ${T.BD}`,
          '& .MuiTabs-indicator': { bgcolor: T.TEXT_PRI, height: 2 } }}>
        <Tab label={t('supply.tabParties')} sx={tabSx} />
        <Tab label={t('supply.tabOrder')} sx={tabSx} />
        <Tab label={t('supply.tabTerms')} sx={tabSx} />
      </Tabs>

      <Box sx={{ px: 3, py: 2.5, flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* ── 0 · parties (incl. the coupe and its seller) ── */}
        {tab === 0 && (<>
          <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, lineHeight: 1.6 }}>
            {t('supply.contractPartiesHelper')}
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: isXs ? '1fr' : '1fr 1fr', gap: 1.5 }}>
            <TextField {...field} label={t('supply.contractNumberLabel')} value={contract.number}
              inputProps={{ dir: 'ltr' }}
              onChange={(e) => setC('number', e.target.value)} />
            <TextField {...field} type="date" label={t('supply.contractDateLabel')} value={contract.date}
              onChange={(e) => setC('date', e.target.value)}
              helperText={t('supply.contractDateHelper')} />
          </Box>

          {/* The coupe's seller IS the contract's فروشنده, so the two live
              together here rather than on a separate tab. */}
          <SubHead T={T}>{t('supply.contractSellerSection')}</SubHead>
          <Box sx={{ display: 'grid', gridTemplateColumns: isXs ? '1fr' : '1fr 1fr', gap: 1.5 }}>
            <TextField {...field} label={t('supply.sellerNameLabel')} value={sellerName}
              required onChange={(e) => { setSellerName(e.target.value); setError(''); }} />
            <TextField {...telField} label={t('supply.sellerPhoneLabel')} value={sellerPhone}
              onChange={(e) => setSellerPhone(e.target.value)} />
          </Box>
          <TextField {...field} label={t('supply.contractSellerParty')} value={contract.seller.party}
            onChange={(e) => setCSeller('party', e.target.value)} fullWidth
            placeholder={sellerName || undefined}
            helperText={t('supply.contractSellerPartyHelper')} />
          <TextField {...field} label={t('supply.contractSellerAddress')} value={contract.seller.addressPhone}
            onChange={(e) => setCSeller('addressPhone', e.target.value)} fullWidth multiline minRows={2} />

          <SubHead T={T}>{t('supply.coupeSectionLabel')}</SubHead>
          <TextField {...field} label={t('supply.coupeSpecLabel')} value={coupeSpec}
            onChange={(e) => setCoupeSpec(e.target.value)} multiline minRows={2} fullWidth
            placeholder={t('supply.coupeSpecPlaceholder')} />
          <TextField {...field} label={t('supply.sellerNotesLabel')} value={sellerNotes}
            onChange={(e) => setSellerNotes(e.target.value)} multiline minRows={2} fullWidth />

          <SubHead T={T}>{t('supply.contractBuyerSection')}</SubHead>
          <TextField {...field} label={t('supply.contractBuyerName')} value={contract.buyer.name}
            onChange={(e) => setCBuyer('name', e.target.value)} fullWidth
            helperText={t('supply.contractBuyerNameHelper')} />
          <Box sx={{ display: 'grid', gridTemplateColumns: isXs ? '1fr' : '1fr 1fr 1fr', gap: 1.5 }}>
            <TextField {...field} label={t('supply.contractBuyerPosition')} value={contract.buyer.position}
              onChange={(e) => setCBuyer('position', e.target.value)} />
            <TextField {...field} label={t('supply.contractBuyerRepresentedBy')} value={contract.buyer.representedBy}
              onChange={(e) => setCBuyer('representedBy', e.target.value)} />
            <TextField {...field} label={t('supply.contractBuyerOnBehalfOf')} value={contract.buyer.onBehalfOf}
              onChange={(e) => setCBuyer('onBehalfOf', e.target.value)} />
          </Box>
          <TextField {...idField} label={t('supply.contractBuyerNationalId')} value={contract.buyer.nationalId}
            onChange={(e) => setCBuyer('nationalId', e.target.value)} fullWidth />
          <TextField {...field} label={t('supply.contractBuyerAddress')} value={contract.buyer.addressPhone}
            onChange={(e) => setCBuyer('addressPhone', e.target.value)} fullWidth multiline minRows={2} />
        </>)}

        {/* ── 1 · order table ── */}
        {tab === 1 && (<>
          <Autocomplete
            options={availableOptions} loading={variantLoading} value={null}
            slotProps={{ popper: { sx: { zIndex: (th) => th.zIndex.modal + 2 } } }}
            onChange={(_, v) => addLine(v)}
            getOptionLabel={(o) => o?.code || ''}
            isOptionEqualToValue={(o, v) => String(o._id) === String(v?._id)}
            renderInput={(params) => (
              <TextField {...params} {...field} label={t('supply.addVarietyLabel')}
                InputProps={{ ...params.InputProps, endAdornment: (
                  <>{variantLoading ? <CircularProgress size={14} /> : null}{params.InputProps.endAdornment}</>
                ) }} />
            )} />

          {fixedProduct && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                <Button size="small" onClick={() => setSpecOpen((o) => !o)} startIcon={<StraightenIcon sx={{ fontSize: 14 }} />}
                  aria-expanded={specOpen}
                  sx={{ fontSize: '0.68rem', textTransform: 'none', color: specOpen ? T.TEXT_PRI : T.TEXT_TER }}>
                  {specOpen ? t('inventory.specHide') : t('inventory.specToggle')}
                </Button>
              </Box>
              {specOpen && (
                <SpecCodeBuilder fixedProduct={fixedProduct} showInventory={false}
                  canCreate={can('inventory:subproduct:create')} noPermissionHint={t('inventory.specCannotAdd')}
                  usedCodes={usedCodes} onUse={useBuiltVariety}
                  onCreated={() => setLookupVersion((n) => n + 1)} />
              )}
            </>
          )}

          {lines.length === 0 ? (
            <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, py: 2, textAlign: 'center' }}>
              {t('supply.noVarietyLines')}
            </Typography>
          ) : (
            <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '12px', overflow: 'hidden' }}>
              {/* Column headers mirror the printed contract table exactly. */}
              <Box sx={{ display: 'flex', gap: 0.75, px: 1.5, py: 0.9, alignItems: 'center',
                bgcolor: T.CTRL_BG, borderBottom: `1px solid ${T.BD}` }}>
                {[
                  { l: t('supply.colStoneType'), w: isXs ? 120 : 190, a: 'left' },
                  { l: t('supply.colCount'), w: 58 },
                  { l: t('supply.colWidth'), w: 58 },
                  { l: t('supply.colLength'), w: 58 },
                  { l: t('supply.colSqm'), w: 74 },
                  { l: t('supply.colUnitPrice'), w: 96 },
                  { l: t('supply.colLineTotal'), w: 104 },
                ].map((c) => (
                  <Typography key={c.l} sx={{ width: c.w, flexShrink: 0, fontSize: '0.6rem',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
                    color: T.TEXT_TER, textAlign: c.a === 'left' ? 'left' : 'right' }}>
                    {c.l}
                  </Typography>
                ))}
                <Box sx={{ width: 28, flexShrink: 0 }} />
              </Box>

              <Box sx={{ px: 1.5, py: 1 }}>
                {rows.map((r) => (
                  <Box key={r.variantId} sx={{ display: 'flex', gap: 0.75, mb: 0.75, alignItems: 'center' }}>
                    <TextField size="small" value={r.stoneTypeLabel}
                      onChange={(e) => setLineField(r.variantId, 'stoneTypeLabel', e.target.value)}
                      sx={{ width: isXs ? 120 : 190, flexShrink: 0 }} />
                    <TextField size="small" type="number" value={r.count} sx={numCell(58)} {...selectOnFocus}
                      inputProps={{ inputMode: 'numeric', min: 0 }}
                      onChange={(e) => setLineField(r.variantId, 'count', e.target.value)} />
                    <TextField size="small" type="number" value={r.widthCm} sx={numCell(58)} {...selectOnFocus}
                      inputProps={{ inputMode: 'decimal', min: 0 }}
                      onChange={(e) => setLineField(r.variantId, 'widthCm', e.target.value)} />
                    <TextField size="small" type="number" value={r.lengthCm} sx={numCell(58)} {...selectOnFocus}
                      inputProps={{ inputMode: 'decimal', min: 0 }}
                      onChange={(e) => setLineField(r.variantId, 'lengthCm', e.target.value)} />
                    {/* متر مربع is the deal letter's own quantity, edited on the
                        forecast/final controls in the detail view — shown here
                        read-only so the two can never disagree. */}
                    <Tooltip title={t('supply.colSqmHelp')}>
                      <Typography sx={{ width: 74, flexShrink: 0, textAlign: 'right',
                        fontSize: '0.78rem', color: T.TEXT_SEC, fontVariantNumeric: 'tabular-nums' }}>
                        {r.sqm ? fmt(r.sqm) : '—'}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={t('supply.colUnitPriceHelp')}>
                      <Typography sx={{ width: 96, flexShrink: 0, textAlign: 'right',
                        fontSize: '0.78rem', color: T.TEXT_SEC, fontVariantNumeric: 'tabular-nums' }}>
                        {r.unitPrice ? fmt(r.unitPrice) : '—'}
                      </Typography>
                    </Tooltip>
                    <Typography sx={{ width: 104, flexShrink: 0, textAlign: 'right',
                      fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI,
                      fontVariantNumeric: 'tabular-nums' }}>
                      {r.total ? fmt(r.total) : '—'}
                    </Typography>
                    <Box sx={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                      <IconButton size="small" onClick={() => removeLine(r.variantId)}>
                        <DeleteOutlineIcon sx={{ fontSize: 15, color: T.TEXT_TER }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}

                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1, pr: 3.5,
                  borderTop: `1px solid ${T.BD}`, mt: 0.5 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }}>
                    {t('supply.colCount')} <b style={{ color: T.TEXT_PRI }}>{fmt(totals.count)}</b>
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }}>
                    {t('supply.colSqm')} <b style={{ color: T.TEXT_PRI }}>{fmt(totals.sqm)}</b>
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }}>
                    {t('supply.colLineTotal')} <b style={{ color: T.TEXT_PRI }}>{fmt(totals.amount)}</b>
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Alert severity="info" sx={{ fontSize: '0.72rem', py: 0.25 }}>
            {t('supply.orderQtyNote')}
          </Alert>
        </>)}

        {/* ── 2 · totals & terms ── */}
        {tab === 2 && (<>
          <SubHead T={T}>{t('supply.contractTotalsSection')}</SubHead>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', px: 1.5, py: 1.25,
            borderRadius: '10px', bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
            <Chip size="small" label={`${t('supply.colSqm')} ${fmt(totals.sqm)}`} sx={{ height: 22, fontSize: '0.66rem' }} />
            <Chip size="small" label={`${t('supply.colCount')} ${fmt(totals.count)}`} sx={{ height: 22, fontSize: '0.66rem' }} />
            <Chip size="small" label={`${t('supply.contractGrandTotal')} ${fmt(totals.amount)}`}
              sx={{ height: 22, fontSize: '0.66rem', fontWeight: 700 }} />
          </Box>

          <TextField {...field} label={t('supply.contractTotalInWords')} value={contract.totalInWords}
            onChange={(e) => setC('totalInWords', e.target.value)} fullWidth multiline minRows={2}
            placeholder={t('supply.contractTotalInWordsAuto')}
            InputProps={{ endAdornment: !contract.totalInWords
              ? <Tooltip title={t('supply.contractTotalInWordsAuto')}>
                  <AutoAwesomeIcon sx={{ fontSize: 14, color: T.TEXT_TER }} />
                </Tooltip>
              : null }}
            helperText={t('supply.contractTotalInWordsHelper')} />

          <TextField {...field} label={t('supply.contractPaymentTerms')} value={contract.paymentTerms}
            onChange={(e) => setC('paymentTerms', e.target.value)} fullWidth multiline minRows={3} />

          <SubHead T={T}>{t('supply.contractArticleBlanks')}</SubHead>
          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, lineHeight: 1.6 }}>
            {t('supply.contractArticleBlanksHelper')}
          </Typography>
          <TextField {...field} label={t('supply.contractGuarantee')} value={contract.guarantee}
            onChange={(e) => setC('guarantee', e.target.value)} fullWidth
            helperText={t('supply.contractGuaranteeHelper')} />
          <Box sx={{ display: 'grid', gridTemplateColumns: isXs ? '1fr' : '1fr 1fr 1fr', gap: 1.5 }}>
            <TextField {...field} type="number" label={t('supply.contractValidityDays')}
              value={contract.validityDays} {...selectOnFocus}
              inputProps={{ inputMode: 'numeric', min: 0 }}
              onChange={(e) => setC('validityDays', e.target.value)}
              helperText={t('supply.contractArticle3')} />
            <TextField {...field} type="number" label={t('supply.contractSettlementDays')}
              value={contract.settlementDays} {...selectOnFocus}
              inputProps={{ inputMode: 'numeric', min: 0 }}
              onChange={(e) => setC('settlementDays', e.target.value)}
              helperText={t('supply.contractArticle12')} />
            <TextField {...field} type="number" label={t('supply.contractLoadingDays')}
              value={contract.loadingDays} {...selectOnFocus}
              inputProps={{ inputMode: 'numeric', min: 0 }}
              onChange={(e) => setC('loadingDays', e.target.value)}
              helperText={t('supply.contractArticle13')} />
          </Box>
        </>)}

        {error && <Alert severity="error" sx={{ fontSize: '0.75rem', py: 0.25 }}>{error}</Alert>}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2,
        borderTop: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
          {t('supply.linesCount', { count: lines.length })}
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} disabled={saving} sx={{ textTransform: 'none' }}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ textTransform: 'none', minWidth: 90 }}>
            {t('common.save')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
