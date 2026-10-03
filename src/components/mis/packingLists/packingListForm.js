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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import TerrainIcon from '@mui/icons-material/Terrain';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../../contextApi/BranchContext';
import { saveMisPackingList } from '../../../store/store';

const EMPTY_ITEM = { code: '', lengthCm: '', widthCm: '', thicknessCm: '', pcs: '', sqm: '', sqmTouched: false };
const EMPTY_PALLET = { palletId: '', reference: '', productCode: '', processingType: '', items: [{ ...EMPTY_ITEM }] };

// Common processing descriptions seen on the real packing lists. freeSolo —
// the typed text IS the stored value, so these are only suggestions.
const PROCESSING_SUGGESTIONS = ['FLD (tile)', 'UNFLD (slab)', 'CRSCT (tile)', 'VNCT (tile)', 'Blocks', 'Cut-to-size'];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// IBAN is stored unspaced + uppercased, displayed grouped in fours.
const ibanRaw = (v) => String(v || '').replace(/[\s-]+/g, '').toUpperCase();
const ibanDisplay = (v) => ibanRaw(v).replace(/(.{4})/g, '$1 ').trim();

// Mirrors the server's productPrefix() in routes/mis/packingLists.js — a
// packing item's code is a NOMINAL product code (TR09), so scope is validated
// as a product-code prefix match, not a foreign key. Kept in sync so the form
// can warn before the save round-trips into a 400.
const productPrefix = (code) => {
  if (!code) return '';
  const m = String(code).toUpperCase().match(/^([A-Z]{2}\d{2})/);
  return m ? m[1] : String(code).toUpperCase();
};

// m² for one item row. Unsized slabs (L or W = 0) can't be derived, so those
// keep whatever was typed.
const deriveSqm = (it) => {
  const l = Number(it.lengthCm) || 0, w = Number(it.widthCm) || 0, p = Number(it.pcs) || 0;
  if (!l || !w || !p) return null;
  return round2((l / 100) * (w / 100) * p);
};

// preset (new lists only, optional) — raised from a Supply record:
//   supplyRecordId — the list is linked to that record (shows under it)
//   recordTitle    — shown in the banner, so it's clear where it will land
//   productCode    — seeds the first pallet with the record's product
export default function PackingListForm({ open, onClose, packingList = null, preset = null }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { activeBranchId } = useBranch();

  const isEdit = Boolean(packingList);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const [type, setType] = useState('free');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [selectedInvoices, setSelectedInvoices] = useState([]);   // full docs (need lineItems for scope)
  const [driverInfo, setDriverInfo] = useState({ fullName: '', nationalId: '', smartNumber: '', phone: '', iban: '' });
  const [vehicleInfo, setVehicleInfo] = useState({ trailerPlateNumber: '', trailerSmartNumber: '' });
  const [customsAgent, setCustomsAgent] = useState({ name: '', phone: '' });
  const [loadingOfficer, setLoadingOfficer] = useState({ name: '', phone: '' });
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [shippingDestination, setShippingDestination] = useState('');
  const [standardThicknessCm, setStandardThicknessCm] = useState('');
  const [pallets, setPallets] = useState([{ ...EMPTY_PALLET }]);
  const [status, setStatus] = useState('draft');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── hydrate ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setError('');
    if (packingList) {
      setType(packingList.type);
      setDriverInfo({ fullName: '', nationalId: '', smartNumber: '', phone: '', iban: '', ...packingList.driverInfo });
      setVehicleInfo({ trailerPlateNumber: '', trailerSmartNumber: '', ...packingList.vehicleInfo });
      setCustomsAgent({ name: '', phone: '', ...packingList.customsAgent });
      setLoadingOfficer({ name: '', phone: '', ...packingList.loadingOfficer });
      setOriginAddress(packingList.originAddress || '');
      setDestinationAddress(packingList.destinationAddress || '');
      setShippingDestination(packingList.shippingDestination || '');
      setStandardThicknessCm(packingList.standardThicknessCm ?? '');
      setPallets(packingList.pallets?.length
        ? packingList.pallets.map((p) => ({
            ...p,
            items: p.items?.length
              ? p.items.map((it) => ({ ...it, sqmTouched: true }))   // stored values win until edited
              : [{ ...EMPTY_ITEM }],
          }))
        : [{ ...EMPTY_PALLET }]);
      setStatus(packingList.status || 'draft');
      setNotes(packingList.notes || '');
      setSelectedInvoices([]);   // resolved by the effect below (needs real docs, not bare ids)
    } else {
      setType('free'); setSelectedInvoices([]);
      setDriverInfo({ fullName: '', nationalId: '', smartNumber: '', phone: '', iban: '' });
      setVehicleInfo({ trailerPlateNumber: '', trailerSmartNumber: '' });
      setCustomsAgent({ name: '', phone: '' });
      setLoadingOfficer({ name: '', phone: '' });
      setOriginAddress(''); setDestinationAddress(''); setShippingDestination('');
      setStandardThicknessCm('');
      setPallets(preset?.productCode
        ? [{ ...EMPTY_PALLET, palletId: 'P1', productCode: preset.productCode,
            items: [{ ...EMPTY_ITEM, code: preset.productCode }] }]
        : [{ ...EMPTY_PALLET }]);
      setStatus('draft'); setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, packingList]);

  // Edit mode: turn stored invoiceIds into REAL documents, so the chips show
  // "#12 — Customer" instead of a raw ObjectId (and so scope suggestions work).
  useEffect(() => {
    const ids = packingList?.invoiceIds || [];
    if (!open || !isEdit || ids.length === 0) return;
    let cancelled = false;
    Promise.all(ids.map((id) =>
      authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/mis/invoices/${id}` })
        .then((r) => r.data.data || r.data)
        .catch(() => null)
    )).then((docs) => {
      if (!cancelled) setSelectedInvoices(docs.filter(Boolean));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, packingList?._id]);

  // Invoice search (linked mode only)
  useEffect(() => {
    if (!open || type !== 'linked' || !activeBranchId) { setInvoiceOptions([]); return; }
    const timer = setTimeout(() => {
      authCtx.jwtInst({
        method: 'get', url: `${axiosGlobal.defaultTargetApi}/mis/invoices`,
        params: { branchId: activeBranchId, docType: 'invoice', limit: 10,
          ...(invoiceSearch.trim() ? { search: invoiceSearch.trim() } : {}) },
      })
        .then((res) => setInvoiceOptions(res.data.data || []))
        .catch(() => setInvoiceOptions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [open, type, invoiceSearch, activeBranchId, authCtx, axiosGlobal]);

  // ── scope: what codes the linked invoices actually allow ──────────────────
  const scope = useMemo(() => {
    const codes = new Set(), prefixes = new Set();
    for (const inv of selectedInvoices) {
      for (const li of (inv.lineItems || [])) {
        if (!li.code) continue;
        codes.add(li.code);
        prefixes.add(productPrefix(li.code));
      }
    }
    return { codes: [...codes], prefixes };
  }, [selectedInvoices]);

  // Suggestions offered on the item code field: the exact SKUs from the linked
  // invoices first, then their bare product codes (a packing item is often the
  // nominal code, not the full SKU).
  const codeOptions = useMemo(() => {
    if (type !== 'linked') return [];
    return [...scope.codes, ...[...scope.prefixes].filter((p) => !scope.codes.includes(p))];
  }, [type, scope]);

  const outOfScope = useMemo(() => {
    if (type !== 'linked' || scope.prefixes.size === 0) return [];
    const bad = [];
    for (const p of pallets) {
      for (const it of (p.items || [])) {
        if (it.code && it.code.trim() && !scope.prefixes.has(productPrefix(it.code))) bad.push(it.code);
      }
    }
    return [...new Set(bad)];
  }, [type, pallets, scope]);

  // ── totals ────────────────────────────────────────────────────────────────
  const palletTotals = (p) => (p.items || []).reduce((acc, it) => {
    acc.pcs += Number(it.pcs) || 0;
    acc.sqm += Number(it.sqm) || 0;
    return acc;
  }, { pcs: 0, sqm: 0 });

  const totals = pallets.reduce((acc, p) => {
    const pt = palletTotals(p);
    acc.pcs += pt.pcs; acc.sqm += pt.sqm;
    return acc;
  }, { pcs: 0, sqm: 0 });

  // ── mutators ──────────────────────────────────────────────────────────────
  const addPallet = () => setPallets((ps) => [...ps, {
    ...EMPTY_PALLET,
    palletId: `P${ps.length + 1}`,
    items: [{ ...EMPTY_ITEM, thicknessCm: standardThicknessCm }],
  }]);

  const duplicatePallet = (idx) => setPallets((ps) => {
    const src = ps[idx];
    const copy = {
      ...src,
      palletId: `${src.palletId || 'P'}-copy`,
      reference: '',
      items: src.items.map((it) => ({ ...it })),
    };
    return [...ps.slice(0, idx + 1), copy, ...ps.slice(idx + 1)];
  });

  const removePallet = (idx) => setPallets((ps) => ps.filter((_, i) => i !== idx));
  const setPalletField = (idx, key, value) =>
    setPallets((ps) => ps.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));

  const addItem = (pIdx) => setPallets((ps) => ps.map((p, i) => (
    i === pIdx
      ? { ...p, items: [...p.items, { ...EMPTY_ITEM, thicknessCm: standardThicknessCm, code: p.productCode || '' }] }
      : p
  )));

  const removeItem = (pIdx, iIdx) => setPallets((ps) => ps.map((p, i) => (
    i === pIdx ? { ...p, items: p.items.filter((_, j) => j !== iIdx) } : p
  )));

  // Editing L / W / Pcs re-derives m² unless the user has typed their own.
  const setItemField = (pIdx, iIdx, key, value) => setPallets((ps) => ps.map((p, i) => {
    if (i !== pIdx) return p;
    return {
      ...p,
      items: p.items.map((it, j) => {
        if (j !== iIdx) return it;
        const next = { ...it, [key]: value };
        if (key === 'sqm') { next.sqmTouched = value !== ''; return next; }
        if (!next.sqmTouched && ['lengthCm', 'widthCm', 'pcs'].includes(key)) {
          const derived = deriveSqm(next);
          if (derived !== null) next.sqm = derived;
        }
        return next;
      }),
    };
  }));

  const resetSqm = (pIdx, iIdx) => setPallets((ps) => ps.map((p, i) => {
    if (i !== pIdx) return p;
    return { ...p, items: p.items.map((it, j) => {
      if (j !== iIdx) return it;
      const derived = deriveSqm(it);
      return { ...it, sqmTouched: false, sqm: derived === null ? '' : derived };
    }) };
  }));

  // Applying a standard thickness fills every blank thickness cell.
  const applyStandardThickness = (value) => {
    setStandardThicknessCm(value);
    if (value === '') return;
    setPallets((ps) => ps.map((p) => ({
      ...p,
      items: p.items.map((it) => (it.thicknessCm === '' || it.thicknessCm === undefined || it.thicknessCm === null
        ? { ...it, thicknessCm: value } : it)),
    })));
  };

  const handleClose = () => { if (!saving) onClose(); };

  const handleSave = async () => {
    if (type === 'linked' && selectedInvoices.length === 0) { setError(t('mis.plSelectInvoiceError')); return; }
    if (pallets.every((p) => !String(p.palletId || '').trim())) { setError(t('mis.plAddPalletError')); return; }
    if (outOfScope.length) { setError(t('mis.plOutOfScopeError', { codes: outOfScope.join(', ') })); return; }

    setSaving(true); setError('');
    try {
      const data = {
        type,
        invoiceIds: type === 'linked' ? selectedInvoices.map((i) => i._id) : [],
        branchId: activeBranchId,
        driverInfo, vehicleInfo, customsAgent, loadingOfficer,
        originAddress, destinationAddress, shippingDestination,
        standardThicknessCm: standardThicknessCm === '' ? undefined : Number(standardThicknessCm),
        pallets: pallets.filter((p) => String(p.palletId || '').trim()).map((p) => ({
          palletId: p.palletId, reference: p.reference,
          productCode: p.productCode, processingType: p.processingType,
          items: p.items.filter((it) => String(it.code || '').trim()).map((it) => ({
            code: it.code,
            lengthCm:    it.lengthCm    === '' ? undefined : Number(it.lengthCm),
            widthCm:     it.widthCm     === '' ? undefined : Number(it.widthCm),
            thicknessCm: it.thicknessCm === '' ? undefined : Number(it.thicknessCm),
            pcs:         it.pcs         === '' ? undefined : Number(it.pcs),
            sqm:         it.sqm         === '' ? undefined : Number(it.sqm),
          })),
        })),
        status,
        notes,
        // Raised from a Supply record — link it there (re-validated server-side
        // against this branch).
        ...(!isEdit && preset?.supplyRecordId ? { supplyRecordId: preset.supplyRecordId } : {}),
      };
      await dispatch(saveMisPackingList({ authCtx, axiosGlobal, id: packingList?._id, data })).unwrap();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('mis.plSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // ── shared field styling ──────────────────────────────────────────────────
  const field = { size: 'small', InputLabelProps: { shrink: true } };

  // Identifiers (IBAN, national ID, smart numbers, plates, phones) are always
  // latin digits read left-to-right, even when the UI is in Arabic or Farsi —
  // forcing dir=ltr stops them rendering reversed in an RTL layout.
  const idField = {
    ...field,
    inputProps: { dir: 'ltr', inputMode: 'numeric' },
    sx: { '& input': { fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: 0.3 } },
  };
  const telField = {
    ...field,
    type: 'tel',
    inputProps: { dir: 'ltr', inputMode: 'tel' },
    sx: { '& input': { fontFamily: 'monospace', fontSize: '0.8rem' } },
  };

  // Number cells in the item grid: right-aligned tabular figures, and the value
  // selects on focus so a wrong entry can just be overtyped.
  const numCell = (w) => ({
    width: w,
    '& input': { textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  });
  const selectOnFocus = { onFocus: (e) => e.target.select() };

  const Section = ({ label, hint, children }) => (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.25 }}>
        <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 1, color: T.TEXT_TER }}>{label}</Typography>
        {hint && <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>{hint}</Typography>}
        <Box sx={{ flex: 1, height: '1px', bgcolor: T.BD }} />
      </Box>
      {children}
    </Box>
  );

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}
      PaperProps={{ sx: { width: isXs ? '100vw' : 760, maxWidth: '100vw' } }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 2, sm: 3 }, py: 2, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
            {isEdit ? t('mis.plEditTitle') : t('mis.plNewTitle')}
          </Typography>
          {isEdit && (
            <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }}>#{packingList.docNumber}</Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} size="small"><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5, flex: 1, overflowY: 'auto' }}>

        {!isEdit && preset?.supplyRecordId && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 1.25, py: 1,
            borderRadius: '10px', border: `1px solid ${T.BD}`, bgcolor: T.CTRL_BG }}>
            <TerrainIcon sx={{ fontSize: 16, color: T.TEXT_SEC }} />
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>
              {t('mis.plLinkedToRecord', { record: preset.recordTitle || '—' })}
            </Typography>
          </Box>
        )}

        {/* ── Scope ── */}
        <Section label={t('mis.plScopeSection')}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            mb: type === 'linked' ? 1.5 : 0 }}>
            <ToggleButtonGroup size="small" exclusive value={type} disabled={isEdit}
              onChange={(_, v) => v && setType(v)}>
              <ToggleButton value="free" sx={{ fontSize: '0.72rem', textTransform: 'none', px: 2 }}>
                {t('mis.plTypeFree')}
              </ToggleButton>
              <ToggleButton value="linked" sx={{ fontSize: '0.72rem', textTransform: 'none', px: 2 }}>
                {t('mis.plTypeLinked')}
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Draft vs final — the list shows this as a status rail, so it has
                to be settable here. */}
            <ToggleButtonGroup size="small" exclusive value={status}
              onChange={(_, v) => v && setStatus(v)}>
              {[
                { v: 'draft', l: t('mis.plStatusDraft'), c: '#ffb74d' },
                { v: 'final', l: t('mis.plStatusFinal'), c: '#81c784' },
              ].map((o) => (
                <ToggleButton key={o.v} value={o.v}
                  sx={{ fontSize: '0.72rem', textTransform: 'none', px: 2, gap: 0.6,
                    '&.Mui-selected': { color: o.c } }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%',
                    bgcolor: status === o.v ? o.c : T.TEXT_TER }} />
                  {o.l}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {type === 'linked' && (
            <>
              <Autocomplete
                multiple options={invoiceOptions} value={selectedInvoices}
                onChange={(_, v) => setSelectedInvoices(v)}
                onInputChange={(_, v) => setInvoiceSearch(v)}
                getOptionLabel={(o) => `#${o.docNumber}${o.customerSnapshot?.name ? ' — ' + o.customerSnapshot.name : ''}`}
                isOptionEqualToValue={(o, v) => String(o._id) === String(v._id)}
                renderInput={(params) => (
                  <TextField {...params} {...field} label={t('mis.plLinkedInvoicesLabel')} />
                )}
              />
              <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, mt: 0.75 }}>
                {scope.prefixes.size > 0
                  ? t('mis.plScopeActive', { codes: [...scope.prefixes].join(', ') })
                  : t('mis.plScopeHelper')}
              </Typography>
            </>
          )}
        </Section>

        {/* ── Driver & vehicle ── */}
        <Section label={t('mis.plDriverSection')}>
          <Box sx={{ display: 'grid', gridTemplateColumns: isXs ? '1fr' : '1fr 1fr', gap: 1.25 }}>
            <TextField {...field} label={t('mis.driverFullNameField')} value={driverInfo.fullName}
              onChange={(e) => setDriverInfo((d) => ({ ...d, fullName: e.target.value }))} />
            <TextField {...telField} label={t('mis.driverPhoneField')} value={driverInfo.phone}
              onChange={(e) => setDriverInfo((d) => ({ ...d, phone: e.target.value }))} />
            <TextField {...idField} label={t('mis.driverNationalIdField')} value={driverInfo.nationalId}
              onChange={(e) => setDriverInfo((d) => ({ ...d, nationalId: e.target.value }))} />
            <TextField {...idField} label={t('mis.driverSmartNumberField')} value={driverInfo.smartNumber}
              onChange={(e) => setDriverInfo((d) => ({ ...d, smartNumber: e.target.value }))} />
            <TextField {...field} label={t('mis.trailerPlateField')} value={vehicleInfo.trailerPlateNumber}
              inputProps={{ dir: 'ltr' }}
              onChange={(e) => setVehicleInfo((v) => ({ ...v, trailerPlateNumber: e.target.value }))} />
            <TextField {...idField} label={t('mis.trailerSmartNumberField')} value={vehicleInfo.trailerSmartNumber}
              onChange={(e) => setVehicleInfo((v) => ({ ...v, trailerSmartNumber: e.target.value }))} />

            {/* IBAN is ~24-34 characters — it gets the full row, a monospace
                LTR input, and is shown grouped in fours the way a bank prints
                it. The stored value stays unspaced and uppercased. */}
            <TextField {...field} label={t('mis.driverIbanField')}
              value={ibanDisplay(driverInfo.iban)}
              onChange={(e) => setDriverInfo((d) => ({ ...d, iban: ibanRaw(e.target.value) }))}
              placeholder="IR00 0000 0000 0000 0000 0000 00"
              inputProps={{ dir: 'ltr', spellCheck: false, autoCapitalize: 'characters' }}
              helperText={driverInfo.iban
                ? t('mis.plIbanChars', { count: driverInfo.iban.length })
                : t('mis.plIbanHelp')}
              sx={{ gridColumn: isXs ? 'auto' : '1 / -1',
                '& input': { fontFamily: 'monospace', fontSize: '0.82rem', letterSpacing: 1 } }} />
          </Box>
        </Section>

        {/* ── Route & handlers ── */}
        <Section label={t('mis.plLogisticsSection')}>
          <Box sx={{ display: 'grid', gridTemplateColumns: isXs ? '1fr' : '1fr 1fr', gap: 1.25 }}>
            <TextField {...field} label={t('mis.loadingOfficerNameField')} value={loadingOfficer.name}
              onChange={(e) => setLoadingOfficer((o) => ({ ...o, name: e.target.value }))} />
            <TextField {...telField} label={t('mis.loadingOfficerPhoneField')} value={loadingOfficer.phone}
              onChange={(e) => setLoadingOfficer((o) => ({ ...o, phone: e.target.value }))} />
            <TextField {...field} label={t('mis.customsAgentNameField')} value={customsAgent.name}
              onChange={(e) => setCustomsAgent((c) => ({ ...c, name: e.target.value }))} />
            <TextField {...telField} label={t('mis.customsAgentPhoneField')} value={customsAgent.phone}
              onChange={(e) => setCustomsAgent((c) => ({ ...c, phone: e.target.value }))} />

            {/* Addresses run long — full row, and multiline so a wrapped
                address stays readable instead of scrolling inside one line. */}
            <TextField {...field} label={t('mis.originAddressField')} value={originAddress}
              multiline minRows={2} sx={{ gridColumn: isXs ? 'auto' : '1 / -1' }}
              onChange={(e) => setOriginAddress(e.target.value)} />
            <TextField {...field} label={t('mis.destinationAddressField')} value={destinationAddress}
              multiline minRows={2} sx={{ gridColumn: isXs ? 'auto' : '1 / -1' }}
              onChange={(e) => setDestinationAddress(e.target.value)} />

            <TextField {...field} label={t('mis.shippingDestinationField')} value={shippingDestination}
              helperText={t('mis.plShippingDestHelp')}
              onChange={(e) => setShippingDestination(e.target.value)} />
            <TextField {...field} type="number" label={t('mis.standardThicknessField')}
              value={standardThicknessCm} helperText={t('mis.plStandardThicknessHelp')}
              inputProps={{ inputMode: 'decimal', step: '0.1', min: 0 }}
              sx={{ '& input': { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } }}
              onChange={(e) => applyStandardThickness(e.target.value)} />
          </Box>
        </Section>

        {/* ── Pallets ── */}
        <Section label={t('mis.plPalletsSection')}
          hint={t('mis.plTotalsSummary', { pcs: totals.pcs, sqm: totals.sqm.toFixed(2) })}>

          {outOfScope.length > 0 && (
            <Alert severity="warning" sx={{ mb: 1.5, fontSize: '0.72rem', py: 0.25 }}>
              {t('mis.plOutOfScopeWarning', { codes: outOfScope.join(', ') })}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {pallets.map((pallet, pIdx) => {
              const pt = palletTotals(pallet);
              return (
                <Box key={pIdx} sx={{ border: `1px solid ${T.BD}`, borderRadius: '12px', overflow: 'hidden' }}>

                  {/* Pallet head */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1,
                    bgcolor: T.CTRL_BG, borderBottom: `1px solid ${T.BD}` }}>
                    <TextField {...field} label={t('mis.palletIdField')} value={pallet.palletId}
                      onChange={(e) => setPalletField(pIdx, 'palletId', e.target.value)}
                      sx={{ width: 96 }} />
                    <TextField {...field} label={t('mis.referenceField')} value={pallet.reference}
                      onChange={(e) => setPalletField(pIdx, 'reference', e.target.value)}
                      sx={{ width: 110 }} />
                    <Autocomplete freeSolo options={PROCESSING_SUGGESTIONS}
                      value={pallet.processingType || ''}
                      onInputChange={(_, v) => setPalletField(pIdx, 'processingType', v)}
                      sx={{ flex: 1, minWidth: 130 }}
                      renderInput={(params) => (
                        <TextField {...params} {...field} label={t('mis.processingTypeField')} />
                      )} />
                    <Tooltip title={t('mis.plDuplicatePallet')}>
                      <IconButton size="small" onClick={() => duplicatePallet(pIdx)}>
                        <ContentCopyIcon sx={{ fontSize: 15, color: T.TEXT_TER }} />
                      </IconButton>
                    </Tooltip>
                    {pallets.length > 1 && (
                      <Tooltip title={t('mis.plRemovePallet')}>
                        <IconButton size="small" onClick={() => removePallet(pIdx)}>
                          <DeleteOutlineIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  {/* Column headers — so a row of numbers is readable */}
                  <Box sx={{ display: 'flex', gap: 0.75, px: 1.5, pt: 1.25, pb: 0.5, alignItems: 'center' }}>
                    {[
                      { label: t('mis.plColCode'), w: isXs ? 100 : 150, align: 'left' },
                      { label: t('mis.plColLength'), w: 62 },
                      { label: t('mis.plColWidth'), w: 62 },
                      { label: t('mis.plColThickness'), w: 62 },
                      { label: t('mis.plColPcs'), w: 62 },
                      { label: t('mis.plColSqm'), w: 84 },
                    ].map((c) => (
                      <Typography key={c.label} sx={{ width: c.w, flexShrink: 0,
                        fontSize: '0.6rem', fontWeight: 700, letterSpacing: 0.4,
                        textTransform: 'uppercase', color: T.TEXT_TER,
                        textAlign: c.align === 'left' ? 'left' : 'right' }}>
                        {c.label}
                      </Typography>
                    ))}
                    <Box sx={{ width: 28, flexShrink: 0 }} />
                  </Box>

                  {/* Item rows */}
                  <Box sx={{ px: 1.5, pb: 1 }}>
                    {pallet.items.map((it, iIdx) => {
                      const derived = deriveSqm(it);
                      const isAuto = !it.sqmTouched && derived !== null;
                      const badCode = type === 'linked' && it.code && scope.prefixes.size > 0
                        && !scope.prefixes.has(productPrefix(it.code));
                      return (
                        <Box key={iIdx} sx={{ display: 'flex', gap: 0.75, mb: 0.75, alignItems: 'center' }}>
                          {type === 'linked' ? (
                            <Autocomplete freeSolo options={codeOptions}
                              value={it.code || ''}
                              onInputChange={(_, v) => setItemField(pIdx, iIdx, 'code', v)}
                              sx={{ width: isXs ? 100 : 150, flexShrink: 0 }}
                              renderInput={(params) => (
                                <TextField {...params} size="small" error={Boolean(badCode)}
                                  placeholder={t('mis.itemCodePlaceholder')}
                                  sx={{ '& input': { fontFamily: 'monospace', fontSize: '0.75rem' } }} />
                              )} />
                          ) : (
                            <TextField size="small" value={it.code}
                              placeholder={t('mis.itemCodePlaceholder')}
                              onChange={(e) => setItemField(pIdx, iIdx, 'code', e.target.value)}
                              sx={{ width: isXs ? 100 : 150, flexShrink: 0,
                                '& input': { fontFamily: 'monospace', fontSize: '0.75rem' } }} />
                          )}
                          <TextField size="small" type="number" value={it.lengthCm} sx={numCell(62)}
                            {...selectOnFocus} inputProps={{ inputMode: 'decimal', min: 0 }}
                            onChange={(e) => setItemField(pIdx, iIdx, 'lengthCm', e.target.value)} />
                          <TextField size="small" type="number" value={it.widthCm} sx={numCell(62)}
                            {...selectOnFocus} inputProps={{ inputMode: 'decimal', min: 0 }}
                            onChange={(e) => setItemField(pIdx, iIdx, 'widthCm', e.target.value)} />
                          <TextField size="small" type="number" value={it.thicknessCm} sx={numCell(62)}
                            {...selectOnFocus} inputProps={{ inputMode: 'decimal', step: '0.1', min: 0 }}
                            onChange={(e) => setItemField(pIdx, iIdx, 'thicknessCm', e.target.value)} />
                          <TextField size="small" type="number" value={it.pcs} sx={numCell(62)}
                            {...selectOnFocus} inputProps={{ inputMode: 'numeric', step: '1', min: 0 }}
                            onChange={(e) => setItemField(pIdx, iIdx, 'pcs', e.target.value)} />
                          <Tooltip title={isAuto ? t('mis.plSqmAuto') : t('mis.plSqmManual')}>
                            <TextField size="small" type="number" value={it.sqm} sx={{
                              ...numCell(84),
                              '& .MuiOutlinedInput-root': isAuto ? { bgcolor: T.CTRL_BG } : {},
                            }}
                              {...selectOnFocus} inputProps={{ inputMode: 'decimal', min: 0 }}
                              onChange={(e) => setItemField(pIdx, iIdx, 'sqm', e.target.value)}
                              InputProps={{ endAdornment: isAuto
                                ? <AutoAwesomeIcon sx={{ fontSize: 11, color: T.TEXT_TER, ml: 0.25 }} />
                                : (derived !== null && (
                                    <Tooltip title={t('mis.plSqmRecalc')}>
                                      <IconButton size="small" sx={{ p: 0.15 }}
                                        onClick={() => resetSqm(pIdx, iIdx)}>
                                        <AutoAwesomeIcon sx={{ fontSize: 12 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )) }} />
                          </Tooltip>
                          <Box sx={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                            {pallet.items.length > 1 && (
                              <IconButton size="small" onClick={() => removeItem(pIdx, iIdx)}>
                                <DeleteOutlineIcon sx={{ fontSize: 14, color: T.TEXT_TER }} />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      );
                    })}

                    {/* Pallet footer — add row + subtotal */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Button size="small" startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                        onClick={() => addItem(pIdx)}
                        sx={{ fontSize: '0.66rem', textTransform: 'none', color: T.TEXT_SEC }}>
                        {t('mis.addItemRowButton')}
                      </Button>
                      <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5, pr: 3.5 }}>
                        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC }}>
                          {t('mis.plColPcs')} <b style={{ color: T.TEXT_PRI }}>{pt.pcs}</b>
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC }}>
                          {t('mis.plColSqm')} <b style={{ color: T.TEXT_PRI }}>{pt.sqm.toFixed(2)}</b>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Button size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={addPallet}
            sx={{ fontSize: '0.7rem', textTransform: 'none', mt: 1.25 }}>
            {t('mis.addPalletButton')}
          </Button>
        </Section>

        <TextField {...field} label={t('mis.sectionNotes')} value={notes} multiline minRows={2} fullWidth
          onChange={(e) => setNotes(e.target.value)} />

        {error && (
          <Alert severity="error" sx={{ mt: 1.5, fontSize: '0.75rem', py: 0.25 }}>{error}</Alert>
        )}
      </Box>

      {/* Footer — running totals stay visible while saving */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2,
        borderTop: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          <Chip size="small" label={t('mis.plPalletCount', { count: pallets.filter((p) => String(p.palletId || '').trim()).length })}
            sx={{ height: 22, fontSize: '0.65rem' }} />
          <Chip size="small" label={`${totals.pcs} ${t('mis.plColPcs')}`} sx={{ height: 22, fontSize: '0.65rem' }} />
          <Chip size="small" label={`${totals.sqm.toFixed(2)} ${t('mis.plColSqm')}`} sx={{ height: 22, fontSize: '0.65rem' }} />
        </Box>
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
