import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';

import { useTheme } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import PersonIcon from '@mui/icons-material/Person';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';
import { actions } from '../../store/store';
import useForm, { required } from '../../tools/hooks/useForm';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import COUNTRIES from '../crm/util/countryData';
import CustomerForm from '../crm/customerForm';

// Phase 6 — invoice / pre-invoice Drawer form (Session 46).
// Sectioned + validated via the shared useForm hook (scalars) with manual
// validation for the line-item / packing arrays. Dirty-state guard on close.
// Customer comes from the CRM picker; lines from the Inventory picker — both
// snapshotted into the payload (the backend re-derives the authoritative
// snapshot + totals; what we send is advisory except trn/country overrides).
// NOTE: no payment section here BY DESIGN — payment figures move only through
// PUT /:id/payment (mis:payment:edit), covered by the detail quick-record.

const STATUS_BY_TYPE = {
  invoice:     ['draft', 'issued', 'paid', 'partially_paid', 'cancelled'],
  pre_invoice: ['draft', 'sent', 'accepted', 'expired'],
};

const STATUS_LABEL_KEYS = {
  draft: 'mis.statusDraft', sent: 'mis.statusSent', accepted: 'mis.statusAccepted',
  converted: 'mis.statusConverted', expired: 'mis.statusExpired', issued: 'mis.statusIssued',
  paid: 'mis.statusPaid', partially_paid: 'mis.statusPartial', cancelled: 'mis.statusCancelled',
};

const round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// client mirror of the backend computeTotals (display only — server is authoritative)
function computeTotals(lines, shipping) {
  let subtotal = 0, discountTotal = 0, vatTotal = 0;
  for (const li of lines) {
    const base = round2((Number(li.quantity) || 0) * (Number(li.unitPrice) || 0));
    const disc = li.discountType === 'percent'
      ? round2(base * (Number(li.discount) || 0) / 100)
      : round2(Number(li.discount) || 0);
    const vat  = round2((base - disc) * (Number(li.vatRate) || 0) / 100);
    subtotal += base; discountTotal += disc; vatTotal += vat;
  }
  subtotal = round2(subtotal); discountTotal = round2(discountTotal); vatTotal = round2(vatTotal);
  const grandTotal = round2(subtotal - discountTotal + vatTotal + round2(shipping));
  return { subtotal, discountTotal, vatTotal, grandTotal };
}

const toDateInput = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

function useDebounce(value, delay) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

const EMPTY_PACK_ROW = { pallet: '', productName: '', length: '', width: '', pcs: '', thickness: '', sqm: '', notes: '' };

export default function InvoiceForm({ open, mode = 'new', docType = 'invoice', doc = null, onClose, onSaved, preset = null }) {
  const { t } = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { activeBranchId } = useBranch();

  const T = {
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const isEdit    = mode === 'edit';
  const activeType = isEdit && doc ? doc.docType : docType;
  const isInvoice = activeType === 'invoice';

  const form = useForm(
    { issueDate: toDateInput(new Date()), status: 'draft',
      customerId: '', customerName: '', customerTrn: '', customerCountry: '',
      customerPhone: '', customerAddress: '',
      vatRate: 5, shipping: '', validityDays: '', notes: '' },
    // customerId is NOT in this static schema — it's required for invoices only
    // (pre-invoices/quotes can be drafted with no customer), so it's validated
    // manually in handleSave alongside the doc-type-conditional address check.
    { issueDate: [required(t('mis.required'))] }
  );
  const { values, setField, setValues, fieldError, handleBlur, validate, isDirty } = form;

  const [lines, setLines]         = useState([]);
  const [packRows, setPackRows]   = useState([]);
  const [packMeta, setPackMeta]   = useState({ truckNumber: '', driverName: '', driverMobile: '' });
  const [arraysBaseline, setArraysBaseline] = useState('[]|[]|{}');
  const [linesError, setLinesError] = useState('');
  const [saving, setSaving]       = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // customer picker
  const [custSearch, setCustSearch]   = useState('');
  const [custResults, setCustResults] = useState([]);
  const [custLoading, setCustLoading] = useState(false);
  const debCustSearch = useDebounce(custSearch, 350);

  // product picker
  const [prodSearch, setProdSearch]   = useState('');
  const [prodResults, setProdResults] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const debProdSearch = useDebounce(prodSearch, 350);

  // picked customer's shipping address (from CRM customer.address[0]) + add-address dialog
  const [custAddress, setCustAddress] = useState(null);
  const [addrDialogOpen, setAddrDialogOpen] = useState(false);
  const [custError, setCustError]     = useState('');
  const [addrError, setAddrError]     = useState('');

  // inline "customer not in CRM yet" creation — reuses the CRM Drawer form;
  // on save the new customer is auto-picked so the user keeps going without
  // leaving the invoice/pre-invoice form
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  // variants/products already on this document — lets the picker stay open
  // (no auto-clear) while still showing what's been added
  const addedKeys = useMemo(
    () => new Set(lines.map(l => l.variantId ? `v:${l.variantId}` : `p:${l.productId}`)),
    [lines]
  );

  const arraysDirty = `${JSON.stringify(lines)}|${JSON.stringify(packRows)}|${JSON.stringify(packMeta)}` !== arraysBaseline;
  const anyDirty    = isDirty || arraysDirty;

  // ── prefill / reset on open ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setLinesError(''); setAddrError(''); setCustAddress(null);
    setCustSearch(''); setCustResults([]); setProdSearch(''); setProdResults([]);

    const applyDoc = (d) => {
      setValues({
        issueDate: toDateInput(d.issueDate), status: d.status || 'draft',
        customerId: d.customerId || '', customerName: d.customerSnapshot?.name || '',
        customerTrn: d.customerSnapshot?.trn || '', customerCountry: d.customerSnapshot?.country || '',
        customerPhone: d.customerSnapshot?.phone || '', customerAddress: d.customerSnapshot?.address || '',
        vatRate: d.lineItems?.[0]?.vatRate ?? 5,
        shipping: d.shipping || '', validityDays: d.validityDays ?? '', notes: d.notes || '',
      });
      const ls = (d.lineItems || []).map(li => ({ ...li }));
      const pr = (d.packingList?.rows || []).map(r => ({ ...EMPTY_PACK_ROW, ...r }));
      const pm = { truckNumber: d.packingList?.truckNumber || '',
                   driverName: d.packingList?.driverName || '',
                   driverMobile: d.packingList?.driverMobile || '' };
      setLines(ls); setPackRows(pr); setPackMeta(pm);
      setArraysBaseline(`${JSON.stringify(ls)}|${JSON.stringify(pr)}|${JSON.stringify(pm)}`);
    };

    if (isEdit && doc) {
      // list rows exclude packingList/notes — fetch the full doc for a safe prefill
      (async () => {
        try {
          const res = await authCtx.jwtInst({ method: 'get',
            url: `${axiosGlobal.defaultTargetApi}/mis/invoices/${doc._id}` });
          applyDoc(res.data);
        } catch (_) { applyDoc(doc); }
      })();
    } else {
      setValues({
        issueDate: toDateInput(new Date()), status: 'draft',
        customerId: '', customerName: '', customerTrn: '', customerCountry: '',
        customerPhone: '', customerAddress: '',
        vatRate: 5, shipping: '', validityDays: '', notes: '',
      });
      setLines([]); setPackRows([]); setPackMeta({ truckNumber: '', driverName: '', driverMobile: '' });
      setArraysBaseline('[]|[]|{"truckNumber":"","driverName":"","driverMobile":""}');

      // Launched from CRM (customer details → Requests tab) or Inventory
      // (product detail → Invoices box): pre-fill but let the user change it.
      if (preset?.customer) pickCustomer(preset.customer);
      if (preset?.productSearch) setProdSearch(preset.productSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, doc?._id, preset]);

  // ── pickers ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !debCustSearch.trim()) { setCustResults([]); return; }
    (async () => {
      setCustLoading(true);
      try {
        const res = await authCtx.jwtInst({ method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/crm/customers`,
          params: { search: debCustSearch.trim(), limit: 8 } });
        setCustResults(res.data.data || []);
      } catch (err) {
        setCustResults([]);
        console.error('crm/customers search failed:', err?.response?.status, err?.response?.data || err.message);
        dispatch(actions.setShowSnackBar({ status: true,
          msg: err?.response?.status === 403
            ? t('mis.noPermSearchCustomers')
            : `${t('mis.couldNotSearchCustomers')}${err?.response?.status ? ` (${err.response.status})` : ''}`,
          type: 'error' }));
      }
      setCustLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debCustSearch, open]);

  useEffect(() => {
    if (!open || !debProdSearch.trim()) { setProdResults([]); return; }
    (async () => {
      setProdLoading(true);
      try {
        const res = await authCtx.jwtInst({ method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/mis/products-lookup`,
          params: { search: debProdSearch.trim(), branchId: activeBranchId } });
        setProdResults(res.data || []);
      } catch (err) {
        setProdResults([]);
        console.error('mis/products-lookup search failed:', err?.response?.status, err?.response?.data || err.message);
        dispatch(actions.setShowSnackBar({ status: true,
          msg: err?.response?.status === 403
            ? t('mis.noPermSearchProducts')
            : `${t('mis.couldNotSearchProducts')}${err?.response?.status ? ` (${err.response.status})` : ''}`,
          type: 'error' }));
      }
      setProdLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debProdSearch, open]);

  const formatAddress = (a) => {
    if (!a) return '';
    return [a.street, a.city, a.province, a.country, a.postalCode].filter(Boolean).join(', ');
  };

  const pickCustomer = (c) => {
    const pi = c.personalInformation || {};
    const isCompany = (pi.customerType || pi.personOrCompany) === 'company';
    const name = isCompany
      ? (pi.companyName || `${pi.firstName || ''} ${pi.lastName || ''}`.trim())
      : (`${pi.firstName || ''} ${pi.lastName || ''}`.trim() || pi.companyName || '');
    const addr = (c.address && c.address[0]) || null;
    setField('customerId', c._id);
    setField('customerName', name);
    setField('customerTrn', c.trn || '');
    setField('customerCountry', pi.country || '');
    setField('customerPhone', c.phoneNumber || '');
    setField('customerAddress', formatAddress(addr));
    setCustAddress(addr);
    setAddrError('');
    setCustError('');
    setCustSearch(''); setCustResults([]);
  };

  const handleAddressSaved = (addr) => {
    setCustAddress(addr);
    setField('customerAddress', formatAddress(addr));
    setAddrError('');
    setAddrDialogOpen(false);
  };

  // Kept intentionally NOT clearing prodSearch/prodResults after adding — lets the
  // user add several variants of the same root product in one search session
  // instead of forcing a re-search after every single click.
  const addLine = (product, variant) => {
    setLines(ls => [...ls, {
      productId: product._id,
      variantId: variant ? variant._id : undefined,
      code:      variant ? variant.code : product.code,
      name:      product.name,
      unit:      variant ? variant.unit : (product.defaultUnit || 'M2'),
      quantity:  1,
      unitPrice: variant && variant.price != null ? variant.price : 0,
      discount:  0,
      discountType: 'amount',
      vatRate:   Number(values.vatRate) || 0,
      // client-only — snapshot of stock available at add-time, used to block
      // over-selling; stripped before the save payload is built (not a schema field)
      availableQty: variant ? variant.quantity : null,
      // client-only — lets the packing list pick this line's product + seed its
      // nominal dimensions (the user still adjusts for the actual physical cut)
      spec: variant ? variant.spec : null,
    }]);
    setLinesError('');
  };

  const lineExceedsStock = (l) => l.availableQty != null && Number(l.quantity) > l.availableQty;

  const setLine = (idx, key, value) =>
    setLines(ls => ls.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  const removeLine = (idx) => setLines(ls => ls.filter((_, i) => i !== idx));

  // vatRate change applies to all lines (single-rate document, per-line stored)
  const handleVatChange = (v) => {
    setField('vatRate', v);
    setLines(ls => ls.map(l => ({ ...l, vatRate: Number(v) || 0 })));
  };

  const setPackRow = (idx, key, value) =>
    setPackRows(rs => rs.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const setPackRowMulti = (idx, patch) =>
    setPackRows(rs => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  // Picking a line item for a packing row auto-fills the product name + seeds
  // the nominal dimensions as a starting point — the user still adjusts L/W/T
  // for the actual physical cut piece (nominal code dims ≠ cut dims; see the
  // Inventory packing-list note in the spec).
  const applyLineToPackRow = (idx, line) => {
    if (!line) return;
    const spec = line.spec;
    setPackRowMulti(idx, {
      productName: `${line.code} — ${line.name}`,
      ...(spec && !spec.unsized ? {
        length:    spec.lengthCm    ?? '',
        width:     spec.widthCm     ?? '',
        thickness: spec.thicknessMm ?? '',
      } : {}),
    });
  };

  const totals = useMemo(
    () => computeTotals(lines, isInvoice ? values.shipping : 0),
    [lines, values.shipping, isInvoice]
  );
  const packTotals = useMemo(() => ({
    pcs: packRows.reduce((a, r) => a + (Number(r.pcs) || 0), 0),
    sqm: round2(packRows.reduce((a, r) => a + (Number(r.sqm) || 0), 0)),
  }), [packRows]);

  // ── save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const scalarsOk = validate();
    let linesOk = true;
    if (lines.length === 0) { setLinesError(t('mis.errAddLineItem')); linesOk = false; }
    else if (lines.some(l => !(Number(l.quantity) > 0))) { setLinesError(t('mis.errQuantityAboveZero')); linesOk = false; }
    else if (lines.some(l => Number(l.unitPrice) < 0)) { setLinesError(t('mis.errUnitPriceNegative')); linesOk = false; }
    else if (lines.some(lineExceedsStock)) { setLinesError(t('mis.errStockExceeded')); linesOk = false; }

    // Customer: required for invoices (goods need a destination), optional for quotes
    let custOk = true;
    if (isInvoice && !values.customerId) {
      setCustError(t('mis.selectCustomerError'));
      custOk = false;
    } else {
      setCustError('');
    }

    // Shipping address: required for invoices (the loads go somewhere), optional for quotes
    let addrOk = true;
    if (isInvoice && !values.customerAddress?.trim()) {
      setAddrError(t('mis.noAddressError'));
      addrOk = false;
    } else {
      setAddrError('');
    }

    if (!scalarsOk || !custOk || !linesOk || !addrOk) return;

    setSaving(true);
    const payload = {
      docType: activeType,
      branchId: activeBranchId,
      issueDate: values.issueDate,
      status: values.status,
      customerId: values.customerId,
      customerSnapshot: {
        name: values.customerName, trn: values.customerTrn,
        country: values.customerCountry, phone: values.customerPhone,
        address: values.customerAddress,
      },
      lineItems: lines.map(({ availableQty, spec, ...l }) => ({
        ...l,
        quantity:  Number(l.quantity)  || 0,
        unitPrice: Number(l.unitPrice) || 0,
        discount:  Number(l.discount)  || 0,
        vatRate:   Number(l.vatRate)   || 0,
      })),
      notes: values.notes,
      ...(isInvoice
        ? { shipping: Number(values.shipping) || 0,
            packingList: {
              rows: packRows
                .filter(r => Object.values(r).some(v => String(v).trim() !== ''))
                .map((r, i) => ({
                  no: i + 1, pallet: r.pallet, productName: r.productName,
                  length: Number(r.length) || undefined, width: Number(r.width) || undefined,
                  pcs: Number(r.pcs) || undefined, thickness: Number(r.thickness) || undefined,
                  sqm: Number(r.sqm) || undefined, notes: r.notes,
                })),
              totalPcs: packTotals.pcs || undefined,
              totalSqm: packTotals.sqm || undefined,
              ...packMeta,
            } }
        : { validityDays: values.validityDays === '' ? undefined : Number(values.validityDays) }),
    };

    try {
      if (isEdit && doc) {
        await authCtx.jwtInst({ method: 'put',
          url: `${axiosGlobal.defaultTargetApi}/mis/invoices/${doc._id}`, data: payload });
        dispatch(actions.setShowSnackBar({ status: true, msg: t('mis.docUpdatedMsg', { type: isInvoice ? t('mis.invoiceType') : t('mis.quoteType'), number: doc.docNumber }), type: 'success' }));
      } else {
        const res = await authCtx.jwtInst({ method: 'post',
          url: `${axiosGlobal.defaultTargetApi}/mis/invoices`, data: payload });
        dispatch(actions.setShowSnackBar({ status: true, msg: t('mis.docCreatedMsg', { type: isInvoice ? t('mis.invoiceType') : t('mis.quoteType'), number: res.data.docNumber }), type: 'success' }));
      }
      dispatch(actions.misInvBumpRefresh());
      onSaved && onSaved();
      onClose();
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true,
        msg: err?.response?.data?.message || t('mis.failedToSaveDoc'), type: 'error' }));
    }
    setSaving(false);
  };

  const handleClose = () => {
    if (anyDirty && !saving) setConfirmDiscard(true);
    else onClose();
  };

  // ── UI helpers ───────────────────────────────────────────────────────────────
  const SectionLabel = ({ children }) => (
    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
      textTransform: 'uppercase', color: T.TEXT_TER, mb: 1.25 }}>
      {children}
    </Typography>
  );

  const tfSx = { '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } };
  const tfInput = { style: { fontSize: '0.8rem' } };
  const tfLabel = { style: { fontSize: '0.75rem' } };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={handleClose}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 480, md: 540 },
          bgcolor: T.PANEL_BG, borderLeft: `1px solid ${T.BD}`,
          display: 'flex', flexDirection: 'column' } }}>

        {/* header */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5,
          borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
            {isEdit
              ? t(isInvoice ? 'mis.editInvoiceTitle' : 'mis.editQuoteTitle', { number: doc?.docNumber })
              : t(isInvoice ? 'mis.newInvoice' : 'mis.newQuote')}
          </Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: T.TEXT_TER }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* body */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 2,
          display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* ── Document ── */}
          <Box>
            <SectionLabel>{t('mis.sectionDocument')}</SectionLabel>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField size="small" label={t('mis.fieldIssueDate')} type="date" fullWidth
                value={values.issueDate}
                onChange={(e) => setField('issueDate', e.target.value)}
                onBlur={() => handleBlur('issueDate')}
                error={Boolean(fieldError('issueDate'))}
                helperText={fieldError('issueDate')}
                InputLabelProps={{ shrink: true, ...tfLabel }} inputProps={tfInput} sx={tfSx} />
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: '0.75rem' }}>{t('common.status')}</InputLabel>
                <Select value={values.status} label={t('common.status')}
                  onChange={(e) => setField('status', e.target.value)}
                  sx={{ fontSize: '0.8rem', ...tfSx }}>
                  {STATUS_BY_TYPE[activeType].map(s => (
                    <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>{t(STATUS_LABEL_KEYS[s] || s)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {isInvoice && values.status === 'paid' && (
              <Typography sx={{ fontSize: '0.68rem', color: '#ffb74d', mt: 0.75 }}>
                {t('mis.paidWarningNote')}
              </Typography>
            )}
          </Box>

          {/* ── Customer (CRM picker) ── */}
          <Box>
            <SectionLabel>{t('mis.sectionCustomer')}{!isInvoice ? t('mis.optionalSuffix') : ''}</SectionLabel>

            {values.customerId ? (
              <Box sx={{ mb: 1.5, border: `1px solid ${T.BD}`, borderRadius: '10px', bgcolor: T.CTRL_BG, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.25 }}>
                  <PersonIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />
                  <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, fontWeight: 600, flexGrow: 1 }} noWrap>
                    {values.customerName || '—'}
                  </Typography>
                  <Button size="small" onClick={() => {
                    setField('customerId', ''); setField('customerName', ''); setField('customerAddress', '');
                    setCustAddress(null); setAddrError('');
                  }} sx={{ fontSize: '0.68rem', textTransform: 'none', color: T.TEXT_TER, minWidth: 0 }}>
                    {t('crm.change')}
                  </Button>
                </Box>

                {/* Shipping address — where the loads for this customer are sent */}
                <Box sx={{ px: 1.25, pb: 1.25, pt: 0, borderTop: `1px solid ${T.BD}` }}>
                  {values.customerAddress ? (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pt: 1 }}>
                      <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, flexGrow: 1 }}>
                        {values.customerAddress}
                      </Typography>
                      <Button size="small" onClick={() => setAddrDialogOpen(true)}
                        sx={{ fontSize: '0.64rem', textTransform: 'none', color: T.TEXT_TER, minWidth: 0, flexShrink: 0 }}>
                        {t('common.edit')}
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
                      <Typography sx={{ fontSize: '0.7rem', color: addrError ? '#EA005A' : T.TEXT_TER, flexGrow: 1 }}>
                        {t('mis.noAddressOnFile')}{isInvoice ? t('mis.addressRequiredSuffix') : t('mis.addressOptionalSuffix')}
                      </Typography>
                      <Button size="small" onClick={() => setAddrDialogOpen(true)}
                        sx={{ fontSize: '0.64rem', textTransform: 'none', color: T.TEXT_PRI, minWidth: 0, flexShrink: 0 }}>
                        {t('mis.addAddressButton')}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ mb: 1.5 }}>
                <TextField size="small" fullWidth
                  placeholder={isInvoice ? t('mis.searchCrmCustomers') : t('mis.searchCrmCustomersOptional')}
                  value={custSearch} onChange={(e) => setCustSearch(e.target.value)}
                  error={Boolean(custError)}
                  helperText={custError}
                  InputProps={{ startAdornment: (
                    <InputAdornment position="start">
                      {custLoading
                        ? <CircularProgress size={13} sx={{ color: T.TEXT_TER }} />
                        : <SearchIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />}
                    </InputAdornment>
                  ), style: { fontSize: '0.8rem' } }}
                  sx={tfSx} />
                {custResults.length > 0 && (
                  <Box sx={{ mt: 0.5, border: `1px solid ${T.BD}`, borderRadius: '10px', overflow: 'hidden' }}>
                    {custResults.map(c => {
                      const pi = c.personalInformation || {};
                      const nm = (pi.customerType || pi.personOrCompany) === 'company'
                        ? (pi.companyName || `${pi.firstName || ''} ${pi.lastName || ''}`.trim())
                        : (`${pi.firstName || ''} ${pi.lastName || ''}`.trim() || pi.companyName || '—');
                      return (
                        <Box key={c._id} onClick={() => pickCustomer(c)}
                          sx={{ px: 1.5, py: 0.9, cursor: 'pointer',
                            borderBottom: `1px solid ${T.BD}`, '&:last-child': { borderBottom: 'none' },
                            '&:hover': { bgcolor: T.CTRL_BG } }}>
                          <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_PRI }}>{nm}</Typography>
                          <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>
                            {c.phoneNumber || ''}{pi.country ? ` · ${pi.country}` : ''}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
                {debCustSearch.trim() && !custLoading && custResults.length === 0 && (
                  <Box sx={{ mt: 0.5, px: 1.5, py: 1, border: `1px dashed ${T.BD}`, borderRadius: '10px' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mb: 0.5 }}>
                      {t('mis.noCustomerMatches', { term: debCustSearch.trim() })}
                    </Typography>
                    <Button size="small" onClick={() => setNewCustomerOpen(true)}
                      sx={{ fontSize: '0.7rem', textTransform: 'none', color: T.TEXT_PRI, minWidth: 0, p: 0 }}>
                      {t('mis.createNewCustomer')}
                    </Button>
                  </Box>
                )}
                {!debCustSearch.trim() && (
                  <Button size="small" onClick={() => setNewCustomerOpen(true)}
                    sx={{ mt: 0.5, fontSize: '0.7rem', textTransform: 'none', color: T.TEXT_TER, minWidth: 0, p: 0 }}>
                    {t('mis.newCustomerNotInCrm')}
                  </Button>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField size="small" label={t('mis.fieldCustomerTrn')} fullWidth value={values.customerTrn}
                onChange={(e) => setField('customerTrn', e.target.value)}
                InputLabelProps={tfLabel} inputProps={tfInput} sx={tfSx} />
              <TextField size="small" label={t('common.country')} fullWidth value={values.customerCountry}
                onChange={(e) => setField('customerCountry', e.target.value)}
                InputLabelProps={tfLabel} inputProps={tfInput} sx={tfSx} />
            </Box>
          </Box>

          {/* ── Line items (Inventory picker) ── */}
          <Box>
            <SectionLabel>{t('mis.sectionLineItems')}</SectionLabel>

            <TextField size="small" fullWidth placeholder={t('mis.searchInventoryPlaceholder')}
              value={prodSearch} onChange={(e) => setProdSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {prodLoading
                      ? <CircularProgress size={13} sx={{ color: T.TEXT_TER }} />
                      : <SearchIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />}
                  </InputAdornment>
                ),
                endAdornment: prodSearch ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setProdSearch(''); setProdResults([]); }}>
                      <CloseIcon sx={{ fontSize: 14, color: T.TEXT_TER }} />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
                style: { fontSize: '0.8rem' },
              }}
              sx={{ ...tfSx, mb: prodResults.length ? 0.5 : 1.5 }} />

            {prodResults.length > 0 && (
              <Box sx={{ mb: 1.5, border: `1px solid ${T.BD}`, borderRadius: '10px',
                overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
                {prodResults.map(p => {
                  const productAdded = addedKeys.has(`p:${p._id}`);
                  return (
                    <Box key={p._id} sx={{ borderBottom: `1px solid ${T.BD}`, '&:last-child': { borderBottom: 'none' } }}>
                      <Box sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: T.CTRL_BG }}>
                        <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }} noWrap>
                          {p.name} <Box component="span" sx={{ color: T.TEXT_TER, fontFamily: 'monospace' }}>{p.code}</Box>
                        </Typography>
                        <Button size="small" onClick={() => addLine(p, null)} startIcon={
                          productAdded ? <CheckIcon sx={{ fontSize: 13 }} /> : null
                        } sx={{ fontSize: '0.64rem', textTransform: 'none',
                          color: productAdded ? 'success.main' : T.TEXT_TER, minWidth: 0 }}>
                          {productAdded ? t('mis.productAdded') : t('mis.addProductButton')}
                        </Button>
                      </Box>
                      {(p.variants || []).map(v => {
                        const variantAdded = addedKeys.has(`v:${v._id}`);
                        return (
                          <Box key={v._id} onClick={() => addLine(p, v)}
                            sx={{ px: 1.5, py: 0.6, display: 'flex', alignItems: 'center', gap: 1,
                              cursor: 'pointer', '&:hover': { bgcolor: T.CTRL_BG } }}>
                            <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace',
                              color: variantAdded ? 'success.main' : T.TEXT_SEC, flexGrow: 1 }} noWrap>
                              {v.code}
                            </Typography>
                            <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, flexShrink: 0 }}>
                              {v.quantity != null ? `${v.quantity} ${v.unit}` : v.unit}
                              {v.price != null ? ` · ${fmtMoney(v.price)} AED` : ''}
                            </Typography>
                            {variantAdded
                              ? <CheckIcon sx={{ fontSize: 13, color: 'success.main' }} />
                              : <AddIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />}
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
              </Box>
            )}

            {lines.length === 0 ? (
              <Typography sx={{ fontSize: '0.72rem', color: linesError ? '#EA005A' : T.TEXT_TER,
                py: 1, textAlign: 'center', border: `1px dashed ${linesError ? '#EA005A' : T.BD}`,
                borderRadius: '10px' }}>
                {linesError || t('mis.noLineItemsYet')}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {linesError && (
                  <Typography sx={{ fontSize: '0.7rem', color: '#EA005A' }}>{linesError}</Typography>
                )}
                {lines.map((l, i) => (
                  <Box key={i} sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', p: 1.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography sx={{ fontSize: '0.72rem', fontFamily: 'monospace', color: T.TEXT_SEC }} noWrap>
                        {l.code}
                      </Typography>
                      <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_PRI, flexGrow: 1 }} noWrap>
                        {l.name}
                      </Typography>
                      <IconButton size="small" onClick={() => removeLine(i)}
                        sx={{ width: 22, height: 22, color: T.TEXT_TER }}>
                        <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField size="small" label={t('mis.qtyLabel', { unit: l.unit })} type="number" value={l.quantity}
                        onChange={(e) => setLine(i, 'quantity', e.target.value)}
                        error={lineExceedsStock(l)}
                        helperText={lineExceedsStock(l) ? t('mis.onlyInStock', { qty: l.availableQty }) : undefined}
                        inputProps={{ ...tfInput.style ? { style: tfInput.style } : {}, min: 0, step: 'any', style: { fontSize: '0.78rem' } }}
                        InputLabelProps={tfLabel} sx={{ ...tfSx, flex: 1 }} />
                      <TextField size="small" label={t('mis.fieldUnitPrice')} type="number" value={l.unitPrice}
                        onChange={(e) => setLine(i, 'unitPrice', e.target.value)}
                        inputProps={{ min: 0, step: 'any', style: { fontSize: '0.78rem' } }}
                        InputLabelProps={tfLabel} sx={{ ...tfSx, flex: 1 }} />
                      <TextField size="small" label={t('mis.fieldDiscountShort')} type="number" value={l.discount}
                        onChange={(e) => setLine(i, 'discount', e.target.value)}
                        inputProps={{ min: 0, step: 'any', style: { fontSize: '0.78rem' } }}
                        InputLabelProps={tfLabel} sx={{ ...tfSx, width: 76 }} />
                      <Select size="small" value={l.discountType}
                        onChange={(e) => setLine(i, 'discountType', e.target.value)}
                        sx={{ fontSize: '0.72rem', width: 72, ...tfSx }}>
                        <MenuItem value="amount" sx={{ fontSize: '0.75rem' }}>AED</MenuItem>
                        <MenuItem value="percent" sx={{ fontSize: '0.75rem' }}>%</MenuItem>
                      </Select>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* ── Totals & VAT ── */}
          <Box>
            <SectionLabel>{t('mis.sectionTotalsVat')}</SectionLabel>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
              <TextField size="small" label={t('mis.fieldVatRate')} type="number" value={values.vatRate}
                onChange={(e) => handleVatChange(e.target.value)}
                inputProps={{ min: 0, step: 'any', style: { fontSize: '0.8rem' } }}
                InputLabelProps={tfLabel} sx={{ ...tfSx, flex: 1 }} />
              {isInvoice && (
                <TextField size="small" label={t('mis.fieldShipping')} type="number" value={values.shipping}
                  onChange={(e) => setField('shipping', e.target.value)}
                  inputProps={{ min: 0, step: 'any', style: { fontSize: '0.8rem' } }}
                  InputLabelProps={tfLabel} sx={{ ...tfSx, flex: 1 }} />
              )}
              {!isInvoice && (
                <TextField size="small" label={t('mis.fieldValidityDays')} type="number" value={values.validityDays}
                  onChange={(e) => setField('validityDays', e.target.value)}
                  inputProps={{ min: 0, style: { fontSize: '0.8rem' } }}
                  InputLabelProps={tfLabel} sx={{ ...tfSx, flex: 1 }} />
              )}
            </Box>

            <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', p: 1.5 }}>
              {[
                [t('mis.subtotalLabel'), totals.subtotal],
                ...(totals.discountTotal ? [[t('mis.discountLabel'), totals.discountTotal]] : []),
                [t('mis.vatLabel'), totals.vatTotal],
                ...(isInvoice && Number(values.shipping) ? [[t('mis.shippingLabel'), Number(values.shipping)]] : []),
              ].map(([label, val]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.2 }}>
                  <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_SEC }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_SEC }}>{fmtMoney(val)}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 0.5, borderColor: T.BD }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI }}>{t('mis.grandTotalLabel')}</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI }}>
                  {fmtMoney(totals.grandTotal)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ── Packing list (invoice only) ── */}
          {isInvoice && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.25 }}>
                <SectionLabel>{t('mis.sectionPackingList')}</SectionLabel>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                  onClick={() => setPackRows(rs => [...rs, { ...EMPTY_PACK_ROW }])}
                  sx={{ fontSize: '0.68rem', textTransform: 'none', color: T.TEXT_TER, mb: 1.25 }}>
                  {t('mis.addRowButton')}
                </Button>
              </Box>

              {packRows.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
                  {packRows.map((r, i) => (
                    <Box key={i} sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', p: 1.25 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField size="small" label={t('mis.fieldPallet')} value={r.pallet}
                          onChange={(e) => setPackRow(i, 'pallet', e.target.value)}
                          inputProps={{ style: { fontSize: '0.76rem' } }}
                          InputLabelProps={tfLabel} sx={{ ...tfSx, width: 90 }} />
                        <Autocomplete
                          freeSolo
                          options={lines}
                          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : `${opt.code} — ${opt.name}`)}
                          inputValue={r.productName || ''}
                          onInputChange={(_, val, reason) => { if (reason !== 'reset') setPackRow(i, 'productName', val); }}
                          onChange={(_, val) => { if (val && typeof val === 'object') applyLineToPackRow(i, val); }}
                          sx={{ flex: 1 }}
                          renderInput={(params) => (
                            <TextField {...params} size="small" label={t('mis.fieldProductPick')}
                              inputProps={{ ...params.inputProps, style: { fontSize: '0.76rem' } }}
                              InputLabelProps={tfLabel} sx={tfSx} />
                          )}
                        />
                        <IconButton size="small" onClick={() => setPackRows(rs => rs.filter((_, j) => j !== i))}
                          sx={{ width: 24, height: 24, color: T.TEXT_TER, alignSelf: 'center' }}>
                          <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {[
                          ['length', t('mis.colLength')], ['width', t('mis.colWidth')], ['pcs', t('mis.colPcs')],
                          ['thickness', t('mis.colThickness')], ['sqm', t('mis.colSqm')],
                        ].map(([key, label]) => (
                          <TextField key={key} size="small" label={label} type="number" value={r[key]}
                            onChange={(e) => setPackRow(i, key, e.target.value)}
                            inputProps={{ min: 0, step: 'any', style: { fontSize: '0.76rem' } }}
                            InputLabelProps={tfLabel} sx={{ ...tfSx, flex: 1 }} />
                        ))}
                      </Box>
                    </Box>
                  ))}
                  <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, textAlign: 'right' }}>
                    {t('mis.packTotalsLine', { pcs: packTotals.pcs, sqm: fmtMoney(packTotals.sqm) })}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField size="small" label={t('mis.fieldTruckNo')} value={packMeta.truckNumber}
                  onChange={(e) => setPackMeta(m => ({ ...m, truckNumber: e.target.value }))}
                  inputProps={{ style: { fontSize: '0.78rem' } }}
                  InputLabelProps={tfLabel} sx={{ ...tfSx, flex: 1 }} />
                <TextField size="small" label={t('mis.fieldDriver')} value={packMeta.driverName}
                  onChange={(e) => setPackMeta(m => ({ ...m, driverName: e.target.value }))}
                  inputProps={{ style: { fontSize: '0.78rem' } }}
                  InputLabelProps={tfLabel} sx={{ ...tfSx, flex: 1 }} />
                <TextField size="small" label={t('mis.fieldDriverMobile')} value={packMeta.driverMobile}
                  onChange={(e) => setPackMeta(m => ({ ...m, driverMobile: e.target.value }))}
                  inputProps={{ style: { fontSize: '0.78rem' } }}
                  InputLabelProps={tfLabel} sx={{ ...tfSx, flex: 1 }} />
              </Box>
            </Box>
          )}

          {/* ── Notes ── */}
          <Box>
            <SectionLabel>{t('mis.sectionNotes')}</SectionLabel>
            <TextField size="small" fullWidth multiline minRows={2} value={values.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder={t('mis.internalNotesPlaceholder')}
              inputProps={{ style: { fontSize: '0.8rem' } }} sx={tfSx} />
          </Box>
        </Box>

        {/* footer */}
        <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${T.BD}`, display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button fullWidth variant="contained" size="small" disabled={saving} onClick={handleSave}
            sx={{ fontSize: '0.78rem', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}>
            {saving ? <CircularProgress size={14} sx={{ mr: 0.75 }} /> : null}
            {isEdit ? t('mis.saveChanges') : t(isInvoice ? 'mis.createInvoiceButton' : 'mis.createQuoteButton')}
          </Button>
        </Box>
      </Drawer>

      {/* dirty-state guard */}
      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
        title={t('mis.discardChangesTitle')}
        message={t('mis.discardChangesMessage')}
        confirmLabel={t('crm.discard')}
        destructive
      />

      {/* add/edit the picked customer's shipping address (writes back to CRM) */}
      <AddressDialog
        open={addrDialogOpen}
        onClose={() => setAddrDialogOpen(false)}
        customerId={values.customerId}
        initial={custAddress}
        onSaved={handleAddressSaved}
      />

      {/* customer not in CRM yet — create inline, then auto-pick it and keep going */}
      <CustomerForm
        open={newCustomerOpen}
        mode="new"
        customer={null}
        onClose={() => setNewCustomerOpen(false)}
        onSave={(saved) => { pickCustomer(saved); setNewCustomerOpen(false); }}
      />
    </>
  );
}

// ── Shipping address dialog ───────────────────────────────────────────────────
// Writes into the CRM customer's existing `address[]` array (PUT /crm/customers/:id,
// crm:customer:edit) — this is the address invoices/pre-invoices pull from, and
// where the loads for this customer are sent.
function AddressDialog({ open, onClose, customerId, initial, onSaved }) {
  const { t } = useTranslation();
  const theme      = useTheme();
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  // Mirrors CRM's customerForm.js Location section exactly: country is a full
  // COUNTRIES object (Autocomplete + flag) driving a dependent city list; city
  // falls back to free text when the country has none; State/postal/street
  // are plain text — same field set, same behavior, same shape on save.
  const [vals, setVals]     = useState({ country: null, city: '', province: '', street: '', postalCode: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const storedCountry = initial?.country || '';
    const countryObj = storedCountry
      ? (COUNTRIES.find((c) => c.name.toLowerCase() === storedCountry.toLowerCase()) || null)
      : null;
    setVals({
      country:    countryObj,
      city:       initial?.city       || '',
      province:   initial?.province   || '',
      street:     initial?.street     || '',
      postalCode: initial?.postalCode || '',
    });
  }, [open, initial]);

  const set = (k, v) => setVals((prev) => ({ ...prev, [k]: v }));

  const cityOptions = vals.country?.cities || [];

  const handleSave = async () => {
    if (!customerId) return;
    setSaving(true);
    try {
      const address = [{
        country:    vals.country?.name || '',
        city:       vals.city,
        province:   vals.province,
        street:     vals.street,
        postalCode: vals.postalCode,
      }];
      await authCtx.jwtInst({ method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/crm/customers/${customerId}`,
        data: { address } });
      dispatch(actions.setShowSnackBar({ status: true, msg: t('mis.addressSavedMsg'), type: 'success' }));
      onSaved(address[0]);
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true,
        msg: err?.response?.status === 403
          ? t('mis.noPermEditCustomer')
          : t('mis.couldNotSaveAddress'), type: 'error' }));
    }
    setSaving(false);
  };

  const fSx = { '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : undefined } };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '14px' } }}>
      <DialogTitle sx={{ fontSize: '0.95rem', fontWeight: 700 }}>{t('mis.shippingAddressTitle')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
        <Autocomplete
          value={vals.country}
          onChange={(_, val) => { set('country', val); set('city', ''); }}
          options={COUNTRIES}
          getOptionLabel={(opt) => (opt ? `${opt.flag} ${opt.name}` : '')}
          isOptionEqualToValue={(opt, val) => opt.code === val?.code}
          renderOption={(props, opt) => (
            <Box component="li" {...props} sx={{ fontSize: '0.8rem', py: '4px !important' }}>
              <Typography sx={{ mr: 0.75, fontSize: '1rem' }}>{opt.flag}</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>{opt.name}</Typography>
            </Box>
          )}
          renderInput={(params) => (
            <TextField {...params} size="small" label={t('common.country')} sx={fSx}
              inputProps={{ ...params.inputProps, style: { fontSize: '0.85rem' } }} />
          )}
        />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {cityOptions.length > 0 ? (
            <Autocomplete
              value={vals.city || null}
              onChange={(_, val) => set('city', val || '')}
              options={cityOptions}
              freeSolo
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <TextField {...params} size="small" label={t('crm.fieldCity')} sx={fSx}
                  inputProps={{ ...params.inputProps, style: { fontSize: '0.85rem' } }}
                  onChange={(e) => set('city', e.target.value)} />
              )}
            />
          ) : (
            <TextField size="small" label={t('crm.fieldCity')} fullWidth value={vals.city}
              onChange={(e) => set('city', e.target.value)} sx={fSx} />
          )}
          <TextField size="small" label={t('crm.fieldStateProvince')} fullWidth value={vals.province}
            onChange={(e) => set('province', e.target.value)} sx={fSx} />
        </Box>
        <TextField size="small" label={t('crm.fieldPostalCode')} fullWidth value={vals.postalCode}
          onChange={(e) => set('postalCode', e.target.value)} sx={fSx} />
        <TextField size="small" label={t('crm.fieldAddress')} fullWidth multiline minRows={2} value={vals.street}
          onChange={(e) => set('street', e.target.value)} sx={fSx} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button size="small" onClick={onClose} sx={{ textTransform: 'none' }}>{t('common.cancel')}</Button>
        <Button size="small" variant="contained" disabled={saving} onClick={handleSave}
          sx={{ textTransform: 'none' }}>
          {saving ? <CircularProgress size={14} sx={{ mr: 0.75 }} /> : null}
          {t('mis.saveAddressButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
