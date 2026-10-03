import { useState, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';
import { usePermissions } from '../../contextApi/PermissionContext';
import { actions } from '../../store/store';
import CrossBranchTargetPicker from './crossBranchTargetPicker';

const STAGE_LABEL_KEY = {
  purchasing: 'supply.statusPurchasing',
  processing: 'supply.statusProcessing',
  final_product: 'supply.statusFinalProduct',
};

// Cross-branch stock REQUEST.
//
// Laid out exactly like the inter-branch quotation (invoiceForm.js with
// tradeMode 'interBranch') — same drawer, same sections, same target-branch
// picker, same catalogue search and line cards — but WITHOUT everything the
// fulfilling branch fills in: status, unit price, discount, VAT and totals. The
// requester says what and how much; the branch receiving it prices it and moves
// it through its statuses. It lands in their MIS as a quotation with status
// 'requested'.
//
// preset (all optional):
//   branchId / branchName — the target, detected from the record the user
//                           opened; locks the branch picker
//   source                — 'inventory' | 'supply'
//   search                — initial catalogue search (e.g. a product code)
//   lines                 — lines to start with (e.g. a deal letter's lot)
//   supplyRecordId        — the supply record it's about; the request is linked to it
export default function CrossBranchRequestForm({ open, onClose, preset = null, onSaved }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { activeBranchId, activeBranch } = useBranch();
  const { can } = usePermissions();
  // The general cross-branch key may request anything; inventory:forecast:request
  // alone may only ask for forecast (Supply) lots — the server enforces the same.
  const inventoryAllowed = can('mis:crossBranch:quote');

  // Same tokens as invoiceForm, so the two read as one family.
  const T = {
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const [branches, setBranches] = useState([]);
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [source, setSource] = useState('inventory');
  const [issueDate, setIssueDate] = useState(today());
  const [search, setSearch] = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [prodResults, setProdResults] = useState([]);
  const [supplyResults, setSupplyResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // The preset as it was when the drawer opened. Parents may clear theirs on
  // close; reading this copy keeps the drawer steady through its exit.
  const [opened, setOpened] = useState(null);
  const locked = Boolean(opened?.branchId);

  // ── hydrate — once per opening ────────────────────────────────────────────
  // Parents pass `preset` as an inline object, i.e. a new one on every render;
  // re-hydrating on each of those would wipe what the user has typed. So only
  // the closed → open transition reads it. A layout effect, so the drawer never
  // paints a frame with the previous opening's state.
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (open && !wasOpen.current) {
      setOpened(preset || null);
      setError(''); setIssueDate(today()); setNotes('');
      setProdResults([]); setSupplyResults([]);
      setTargetBranchId(preset?.branchId ? String(preset.branchId) : '');
      setSource(preset?.source === 'supply' || !can('mis:crossBranch:quote') ? 'supply' : 'inventory');
      setSearch(preset?.search || '');
      setDebSearch(preset?.search || '');
      setLines(Array.isArray(preset?.lines) ? preset.lines.map((l) => ({ ...l })) : []);
    }
    wasOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset]);

  // Branches that have shared with the branch we're requesting FROM — the
  // active one. Same question the server asks on create (default-deny).
  useEffect(() => {
    if (!open || !activeBranchId) return;
    let cancelled = false;
    setBranchesLoaded(false);
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/mis/cross-branch/branches`,
      params: { requestingBranchId: activeBranchId } })
      .then((res) => { if (!cancelled) setBranches(res.data?.data || []); })
      .catch(() => { if (!cancelled) setBranches([]); })
      .finally(() => { if (!cancelled) setBranchesLoaded(true); });
    return () => { cancelled = true; };
  }, [open, activeBranchId, authCtx, axiosGlobal]);

  useEffect(() => {
    const id = setTimeout(() => setDebSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  // ── catalogue lookup — identical to invoiceForm's inter-branch branch ─────
  // NB the two routes answer differently: /cross-branch/inventory returns a
  // bare ARRAY of products (each carrying its variants), /cross-branch/supply
  // wraps its rows in { data }. Reading inventory as res.data.data is what left
  // the earlier version of this form permanently showing no results.
  useEffect(() => {
    if (!open || !targetBranchId || !debSearch.trim()) { setProdResults([]); setSupplyResults([]); return; }
    const usingSupply = source === 'supply';
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const res = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/mis/cross-branch/${usingSupply ? 'supply' : 'inventory'}`,
          params: { search: debSearch.trim(), branchId: targetBranchId, requestingBranchId: activeBranchId },
        });
        if (cancelled) return;
        if (usingSupply) { setSupplyResults(res.data?.data || []); setProdResults([]); }
        else { setProdResults(Array.isArray(res.data) ? res.data : (res.data?.data || [])); setSupplyResults([]); }
      } catch (err) {
        if (cancelled) return;
        setProdResults([]); setSupplyResults([]);
        setError(err?.response?.data?.message || t('mis.couldNotSearchProducts'));
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, targetBranchId, activeBranchId, source, debSearch, authCtx, axiosGlobal, t]);

  // One key per thing that can be requested. A variety can be on the shelf AND
  // in one or more lots at the same time, so a supply line is keyed by its
  // deal letter too — adding one lot must not mark the others as added.
  const lineKey = (l) => (l.sourceType === 'supply'
    ? `s:${l.supplyDealLetterId}:${l.variantId}`
    : (l.variantId ? `v:${l.variantId}` : `p:${l.productId}`));
  const addedKeys = useMemo(() => new Set(lines.map(lineKey)), [lines]);

  // No unit price: pricing belongs to the branch receiving the request.
  const addLine = (product, variant) => {
    const key = variant ? `v:${variant._id}` : `p:${product._id}`;
    if (addedKeys.has(key)) return;
    setLines((ls) => [...ls, {
      productId: product._id,
      variantId: variant ? variant._id : undefined,
      code: variant ? variant.code : product.code,
      name: product.name,
      unit: variant ? variant.unit : (product.defaultUnit || 'M2'),
      quantity: '',
      available: variant && variant.quantity != null ? variant.quantity : null,
      forecast: variant && variant.supply ? (variant.supply.forecastQty || 0) : 0,
      sourceType: 'inventory',
    }]);
    setError('');
  };

  // What the lot can still give: the server's figure, net of what's already
  // promised to accepted quotations / requests.
  const lotLeft = (row) => (row.left != null
    ? Number(row.left) || 0
    : Math.max(0, (row.status === 'final_product'
      ? (Number(row.finalQty) || 0) - (Number(row.receivedQty) || 0)
      : Number(row.forecastQty) || 0) - (Number(row.allocatedQty) || 0)));

  const addSupplyLine = (row) => {
    if (addedKeys.has(`s:${row.dealLetterId}:${row.variantId}`)) return;
    const remaining = lotLeft(row);
    if (!(remaining > 0)) return;   // nothing left in that lot to ask for
    setLines((ls) => [...ls, {
      productId: row.productId,
      variantId: row.variantId,
      code: row.variantCode,
      name: row.variantCode,
      unit: row.unit,
      quantity: '',
      available: remaining,
      supplyStage: row.status,
      lotLabel: [row.recordCode, row.contractNumber || row.seller].filter(Boolean).join(' · '),
      sourceType: 'supply',
      supplyDealLetterId: row.dealLetterId,
    }]);
    setError('');
  };

  const removeLine = (i) => setLines((ls) => ls.filter((_, j) => j !== i));
  const setQty = (i, value) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, quantity: value } : l)));

  const target = branches.find((b) => String(b._id) === String(targetBranchId));
  const targetName = target?.name || opened?.branchName || '';
  const sameBranch = Boolean(targetBranchId) && String(targetBranchId) === String(activeBranchId);
  // The branch was detected from what the user opened, but it hasn't shared
  // with the branch they're working as right now (a multi-branch user can
  // browse a branch shared with one of their OTHER branches) — the create
  // would be refused, so say why up front instead.
  const notShared = locked && branchesLoaded && !sameBranch && !target;

  // Real stock is a hard limit — the server refuses an inventory line above
  // it, same rule as any quotation. A supply line's figure is a forecast, so
  // going over it is only flagged, never blocked.
  const isOverStock = (l) => l.sourceType !== 'supply' && l.available != null
    && Number(l.quantity) > Number(l.available);
  const isOverForecast = (l) => l.sourceType === 'supply' && l.available != null
    && Number(l.quantity) > Number(l.available);

  const handleClose = () => { if (!saving) onClose(); };

  const handleSave = async () => {
    if (!activeBranchId) { setError(t('mis.reqNoActiveBranch')); return; }
    if (!targetBranchId) { setError(t('mis.reqPickBranchError')); return; }
    if (sameBranch) { setError(t('mis.reqSameBranchError')); return; }
    if (notShared) { setError(t('mis.reqNotSharedWithActive', { branch: targetName, active: activeBranch?.name || '' })); return; }
    if (!lines.length) { setError(t('mis.reqNoLinesError')); return; }
    if (lines.some((l) => !(Number(l.quantity) > 0))) { setError(t('mis.reqQtyError')); return; }
    const over = lines.find(isOverStock);
    if (over) { setError(t('mis.reqOverStockError', { code: over.code, qty: over.available, unit: over.unit })); return; }

    setSaving(true); setError('');
    try {
      const res = await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/mis/invoices`,
        data: {
          docType: 'pre_invoice',
          tradeMode: 'interBranch',
          status: 'requested',
          branchId: targetBranchId,           // fulfilling branch
          requestingBranchId: activeBranchId, // us
          issueDate,
          // Priced at 0 on purpose — the receiving branch sets prices, VAT and
          // discounts when it actions the request.
          lineItems: lines.map((l) => ({
            productId: l.productId, variantId: l.variantId,
            code: l.code, name: l.name, unit: l.unit,
            quantity: Number(l.quantity) || 0,
            unitPrice: 0, discount: 0, discountType: 'amount', vatRate: 0,
            sourceType: l.sourceType,
            ...(l.supplyDealLetterId ? { supplyDealLetterId: l.supplyDealLetterId } : {}),
          })),
          notes,
          // Raised from a supply record / deal letter: link it, so the request
          // shows under that record for both branches. Re-validated server-side
          // against the target branch.
          ...(opened?.supplyRecordId ? { supplyRecordId: opened.supplyRecordId } : {}),
        },
      });
      dispatch(actions.setShowSnackBar({ status: true, type: 'success',
        msg: t('mis.reqSentMsg', { number: res.data?.docNumber, branch: targetName }) }));
      dispatch(actions.misInvBumpRefresh());
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('mis.reqSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // ── UI helpers (same as invoiceForm) ──────────────────────────────────────
  const SectionLabel = ({ children }) => (
    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
      textTransform: 'uppercase', color: T.TEXT_TER, mb: 1.25 }}>
      {children}
    </Typography>
  );
  const tfSx = { '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } };
  const tfLabel = { style: { fontSize: '0.75rem' } };

  return (
    // Above modal level: this drawer also opens from INSIDE a Dialog (the deal
    // letter detail), where a default-z-index Drawer (1200) would render
    // invisibly behind the Dialog (1300). See the portal z-index trap in
    // CLAUDE.md — the branch picker's dropdown is raised to match.
    <Drawer anchor="right" open={open} onClose={handleClose}
      sx={{ zIndex: (th) => th.zIndex.modal + 1 }}
      PaperProps={{ sx: { width: { xs: '100vw', sm: 480, md: 540 },
        bgcolor: T.PANEL_BG, borderLeft: `1px solid ${T.BD}`,
        display: 'flex', flexDirection: 'column' } }}>

      {/* header */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5,
        borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
          {t('mis.reqTitle')}
        </Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: T.TEXT_TER }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* body */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 2,
        display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* What the requester does NOT fill, and why. */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', px: 1.25, py: 1,
          border: `1px solid ${T.BD}`, borderRadius: '10px', bgcolor: T.CTRL_BG }}>
          <InfoOutlinedIcon sx={{ fontSize: 15, color: T.TEXT_SEC, mt: '1px' }} />
          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, lineHeight: 1.6 }}>
            {targetName
              ? t('mis.reqFilledByTarget', { branch: targetName })
              : t('mis.reqFilledByTargetGeneric')}
          </Typography>
        </Box>

        {/* ── Document ── */}
        <Box>
          <SectionLabel>{t('mis.sectionDocument')}</SectionLabel>
          <TextField size="small" label={t('mis.fieldIssueDate')} type="date" fullWidth
            value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
            InputLabelProps={{ shrink: true, ...tfLabel }}
            inputProps={{ style: { fontSize: '0.8rem' } }} sx={tfSx} />
        </Box>

        {/* ── Target branch ── */}
        <Box>
          <SectionLabel>{t('mis.sectionTargetBranch')}</SectionLabel>
          <CrossBranchTargetPicker
            branches={branches}
            branchId={targetBranchId}
            locked={locked}
            lockedName={opened?.branchName}
            onBranchChange={(id) => { setTargetBranchId(id); setLines([]); setProdResults([]); setSupplyResults([]); setError(''); }}
            source={source}
            onSourceChange={(s) => { setSource(s); setProdResults([]); setSupplyResults([]); }}
            allowInventory={inventoryAllowed}
          />
          {!locked && branches.length === 0 && (
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mt: 0.75, lineHeight: 1.6 }}>
              {t('mis.reqNoSharedBranchesHelp')}
            </Typography>
          )}
          {sameBranch && (
            <Alert severity="warning" sx={{ mt: 1, fontSize: '0.72rem', py: 0.25 }}>
              {t('mis.reqSameBranchError')}
            </Alert>
          )}
          {notShared && (
            <Alert severity="warning" sx={{ mt: 1, fontSize: '0.72rem', py: 0.25 }}>
              {t('mis.reqNotSharedWithActive', { branch: targetName, active: activeBranch?.name || '' })}
            </Alert>
          )}
          {/* Who the request comes from — always the active branch. */}
          {activeBranch && (
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mt: 0.75 }}>
              {t('mis.reqFromBranch', { branch: activeBranch.name })}
            </Typography>
          )}
        </Box>

        {/* ── Line items ── */}
        <Box>
          <SectionLabel>{t('mis.sectionLineItems')}</SectionLabel>

          <TextField size="small" fullWidth disabled={!targetBranchId}
            placeholder={targetBranchId ? t('mis.reqSearchPlaceholder') : t('mis.reqPickBranchFirst')}
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {searching
                    ? <CircularProgress size={13} sx={{ color: T.TEXT_TER }} />
                    : <SearchIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />}
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setSearch(''); setProdResults([]); setSupplyResults([]); }}>
                    <CloseIcon sx={{ fontSize: 14, color: T.TEXT_TER }} />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
              style: { fontSize: '0.8rem' },
            }}
            sx={{ ...tfSx, mb: (prodResults.length || supplyResults.length) ? 0.5 : 1.5 }} />

          {/* Inventory results — product header + its varieties, as in the quotation */}
          {prodResults.length > 0 && (
            <Box sx={{ mb: 1.5, border: `1px solid ${T.BD}`, borderRadius: '10px',
              overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
              {prodResults.map((p) => {
                const productAdded = addedKeys.has(`p:${p._id}`);
                return (
                  <Box key={p._id} sx={{ borderBottom: `1px solid ${T.BD}`, '&:last-child': { borderBottom: 'none' } }}>
                    <Box sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, bgcolor: T.CTRL_BG }}>
                      <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }} noWrap>
                        {p.name} <Box component="span" sx={{ color: T.TEXT_TER, fontFamily: 'monospace' }}>{p.code}</Box>
                      </Typography>
                      <Button size="small" onClick={() => addLine(p, null)}
                        startIcon={productAdded ? <CheckIcon sx={{ fontSize: 13 }} /> : null}
                        sx={{ fontSize: '0.64rem', textTransform: 'none',
                          color: productAdded ? 'success.main' : T.TEXT_TER, minWidth: 0 }}>
                        {productAdded ? t('mis.productAdded') : t('mis.addProductButton')}
                      </Button>
                    </Box>
                    {(p.variants || []).map((v) => {
                      const added = addedKeys.has(`v:${v._id}`);
                      const fc = v.supply ? Number(v.supply.forecastQty) || 0 : 0;
                      return (
                        <Box key={v._id} onClick={() => addLine(p, v)}
                          sx={{ px: 1.5, py: 0.6, display: 'flex', alignItems: 'center', gap: 1,
                            cursor: 'pointer', '&:hover': { bgcolor: T.CTRL_BG } }}>
                          <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace',
                            color: added ? 'success.main' : T.TEXT_SEC, flexGrow: 1 }} noWrap>
                            {v.code}
                          </Typography>
                          <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, flexShrink: 0 }}>
                            {v.quantity != null ? `${v.quantity} ${v.unit}` : v.unit}
                            {fc > 0 ? ` · ${t('mis.reqForecastShort', { qty: fc })}` : ''}
                          </Typography>
                          {added
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

          {/* Supply results — the lots being prepared */}
          {supplyResults.length > 0 && (
            <Box sx={{ mb: 1.5, border: `1px solid ${T.BD}`, borderRadius: '10px',
              overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
              {supplyResults.map((row) => {
                const added = addedKeys.has(`s:${row.dealLetterId}:${row.variantId}`);
                const left = lotLeft(row);
                const empty = !(left > 0);
                const lot = [row.recordCode, row.contractNumber || row.seller].filter(Boolean).join(' · ');
                return (
                  <Box key={`${row.dealLetterId}-${row.variantId}`}
                    onClick={empty ? undefined : () => addSupplyLine(row)}
                    sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
                      cursor: empty ? 'default' : 'pointer', opacity: empty ? 0.45 : 1,
                      borderBottom: `1px solid ${T.BD}`, '&:last-child': { borderBottom: 'none' },
                      '&:hover': empty ? undefined : { bgcolor: T.CTRL_BG } }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace',
                        color: added ? 'success.main' : T.TEXT_SEC }} noWrap>
                        {row.variantCode}
                      </Typography>
                      {/* Which lot — the same variety can sit in several. */}
                      <Typography sx={{ fontSize: '0.62rem', color: T.TEXT_TER }} noWrap>
                        {lot ? `${t('mis.reqLotLabel', { lot })} · ` : ''}{t(STAGE_LABEL_KEY[row.status] || 'mis.reqTagForecast')}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.64rem', color: T.TEXT_TER, flexShrink: 0 }}>
                      {empty
                        ? t('mis.reqNothingLeft')
                        : row.status === 'final_product'
                          ? t('mis.supplyRowFinal', { qty: left, unit: row.unit })
                          : t('mis.supplyRowForecast', { qty: left, unit: row.unit })}
                    </Typography>
                    {empty ? null : added
                      ? <CheckIcon sx={{ fontSize: 13, color: 'success.main' }} />
                      : <AddIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />}
                  </Box>
                );
              })}
            </Box>
          )}

          {targetBranchId && debSearch.trim() && !searching
            && prodResults.length === 0 && supplyResults.length === 0 && (
            <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, mb: 1.5 }}>
              {t('mis.reqNoMatches', { term: debSearch.trim() })}
            </Typography>
          )}

          {lines.length === 0 ? (
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER,
              py: 1, textAlign: 'center', border: `1px dashed ${T.BD}`, borderRadius: '10px' }}>
              {t('mis.reqNoLines')}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {lines.map((l, i) => {
                const overStock = isOverStock(l);
                const overForecast = isOverForecast(l);
                return (
                  <Box key={`${lineKey(l)}-${i}`}
                    sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', p: 1.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography sx={{ fontSize: '0.72rem', fontFamily: 'monospace', color: T.TEXT_SEC }} noWrap>
                        {l.code}
                      </Typography>
                      <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_PRI, flexGrow: 1 }} noWrap>
                        {l.sourceType === 'supply'
                          ? (l.lotLabel ? t('mis.reqLotLabel', { lot: l.lotLabel }) : '')
                          : (l.name !== l.code ? l.name : '')}
                      </Typography>
                      {l.sourceType === 'supply' && (
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, px: 0.6, py: '1px',
                          borderRadius: '4px', color: '#ffb74d', bgcolor: '#ffb74d1a', flexShrink: 0 }}>
                          {l.supplyStage === 'final_product' ? t('mis.reqTagFinal') : t('mis.reqTagForecast')}
                        </Typography>
                      )}
                      <IconButton size="small" onClick={() => removeLine(i)}
                        sx={{ width: 22, height: 22, color: T.TEXT_TER }}>
                        <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                    {/* Quantity only — price, discount and VAT are the
                        receiving branch's to set. */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField size="small" type="number" value={l.quantity}
                        label={t('mis.qtyLabel', { unit: l.unit })}
                        onChange={(e) => setQty(i, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        error={overStock}
                        helperText={overStock
                          ? t('mis.reqOverStockShort', { qty: l.available })
                          : overForecast ? t('mis.reqOverForecastShort', { qty: l.available }) : undefined}
                        FormHelperTextProps={overForecast ? { sx: { color: '#ffb74d' } } : undefined}
                        inputProps={{ min: 0, step: 'any', inputMode: 'decimal', style: { fontSize: '0.78rem' } }}
                        InputLabelProps={tfLabel} sx={{ ...tfSx, flex: 1 }} />
                      <Box sx={{ flex: 1, px: 1.25, py: 0.85, borderRadius: '8px',
                        border: `1px dashed ${T.BD}` }}>
                        <Typography sx={{ fontSize: '0.6rem', color: T.TEXT_TER, textTransform: 'uppercase',
                          letterSpacing: 0.5 }}>
                          {l.sourceType === 'supply' ? t('mis.reqAvailableLot') : t('mis.reqAvailableStock')}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC,
                          fontVariantNumeric: 'tabular-nums' }}>
                          {l.available != null ? `${l.available} ${l.unit}` : '—'}
                          {l.sourceType !== 'supply' && l.forecast > 0
                            ? ` · ${t('mis.reqForecastShort', { qty: l.forecast })}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* ── Notes ── */}
        <Box>
          <SectionLabel>{t('mis.sectionNotes')}</SectionLabel>
          <TextField size="small" fullWidth multiline minRows={3} value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('mis.reqNotePlaceholder')}
            inputProps={{ style: { fontSize: '0.8rem' } }} sx={tfSx} />
        </Box>

        {error && <Alert severity="error" sx={{ fontSize: '0.75rem', py: 0.25 }}>{error}</Alert>}
      </Box>

      {/* footer */}
      <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${T.BD}`, display: 'flex', gap: 1, flexShrink: 0 }}>
        <Button fullWidth variant="contained" size="small" disabled={saving || sameBranch || notShared} onClick={handleSave}
          sx={{ fontSize: '0.78rem', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}>
          {saving ? <CircularProgress size={14} sx={{ mr: 0.75 }} /> : null}
          {t('mis.reqSend')}{lines.length ? ` · ${t('mis.reqLineCount', { count: lines.length })}` : ''}
        </Button>
      </Box>
    </Drawer>
  );
}
