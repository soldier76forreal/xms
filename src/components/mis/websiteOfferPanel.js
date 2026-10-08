import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SendIcon from '@mui/icons-material/Send';
import UndoIcon from '@mui/icons-material/Undo';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import InvoiceDetailDialog from './invoiceDetailDialog';
import OfferCountdown from './offerCountdown';

// Answering a customer's website purchase request with prices.
//
// The answer is a quotation that EXPIRES: the associate prices each requested
// item, picks how long the offer stays valid (2 hours unless they change it),
// and sends it. The customer is e-mailed the quantities and prices and finds the
// invoice itself on the website, where they can accept until the time runs out —
// accepting turns it into an invoice. The whole flow lives in the API
// (utils/websiteOffers.js); this panel only prices, sends, shows where it stands
// and lets the associate withdraw or replace an offer.

const round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtWhen = (d) => (d ? new Date(d).toLocaleString([], {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—');

const PRESET_HOURS = [1, 2, 4, 8, 12, 24, 48, 72, 168];
const UNIT_FACTOR = { minutes: 1 / 60, hours: 1, days: 24 };
const MIN_MINUTES = 5;
const MAX_HOURS = 24 * 60;

export const OFFER_STATE_COLOR = { open: '#64b5f6', expired: '#ffb74d', accepted: '#81c784' };
export const OFFER_STATE_KEY = { open: 'mis.offerStateOpen', expired: 'mis.offerStateExpired', accepted: 'mis.offerStateAccepted' };

const durationLabel = (t, hours) => (hours % 24 === 0 ? t('mis.offerDays', { count: hours / 24 }) : t('mis.offerHours', { count: hours }));

// Same arithmetic the API uses, so the figures on screen are the figures that go out.
function previewTotals(lines, deliveryCharge, vatRate) {
  const vat = Number(vatRate) || 0;
  let subtotal = 0;
  let discountTotal = 0;
  let vatTotal = 0;
  lines.forEach((line) => {
    if (!line.include) return;
    const base = round2((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0));
    const discount = round2(base * (Number(line.discount) || 0) / 100);
    subtotal += base;
    discountTotal += discount;
    vatTotal += round2((base - discount) * vat / 100);
  });
  const delivery = Number(deliveryCharge) || 0;
  if (delivery > 0) {
    subtotal += delivery;
    vatTotal += round2(delivery * vat / 100);
  }
  subtotal = round2(subtotal);
  discountTotal = round2(discountTotal);
  vatTotal = round2(vatTotal);
  return { subtotal, discountTotal, vatTotal, grandTotal: round2(subtotal - discountTotal + vatTotal) };
}

function lineBase(line) {
  const base = round2((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0));
  return round2(base - round2(base * (Number(line.discount) || 0) / 100));
}

function StatePill({ state, t }) {
  const color = OFFER_STATE_COLOR[state] || OFFER_STATE_COLOR.expired;
  return (
    <Box sx={{ px: 0.9, py: '2px', borderRadius: '6px', bgcolor: `${color}26`, display: 'inline-flex' }}>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color }}>{t(OFFER_STATE_KEY[state] || OFFER_STATE_KEY.expired)}</Typography>
    </Box>
  );
}

// One requested item with its price inputs.
function ItemRow({ item, line, onChange, t, border }) {
  const quantity = Number(line.quantity) || 0;
  const overStock = item.stock != null && quantity > Number(item.stock);
  const set = (field) => (e) => onChange({ ...line, [field]: e.target.value });
  return (
    <Box sx={{ border: `1px solid ${border}`, borderRadius: '10px', p: 1.25, opacity: line.include ? 1 : 0.55 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Checkbox size="small" checked={line.include} sx={{ p: 0.5 }}
          onChange={(e) => onChange({ ...line, include: e.target.checked })}
          inputProps={{ 'aria-label': t('mis.offerInclude') }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }} noWrap>{item.variantCode}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap component="div">{item.productName}</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
          {t('mis.offerRequested')}: <b>{item.quantity} {item.unit}</b>
        </Typography>
      </Box>
      {line.include && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 1, mt: 1 }}>
            <TextField size="small" type="number" label={t('mis.offerQuantity')} value={line.quantity}
              onChange={set('quantity')} inputProps={{ min: 0, step: 'any' }} error={overStock}
              InputProps={{ endAdornment: <InputAdornment position="end">{item.unit}</InputAdornment> }} />
            <TextField size="small" type="number" label={t('mis.fieldUnitPrice')} value={line.unitPrice}
              onChange={set('unitPrice')} inputProps={{ min: 0, step: 'any' }} />
            <TextField size="small" type="number" label={t('mis.offerDiscountPercent')} value={line.discount}
              onChange={set('discount')} inputProps={{ min: 0, max: 100, step: 'any' }} />
            <Box sx={{ textAlign: 'end', alignSelf: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{t('mis.offerLineTotal')}</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{fmtMoney(lineBase(line))}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: overStock ? 'error.main' : 'text.secondary' }}>
              {overStock
                ? t('mis.offerExceedsStock', { stock: item.stock, unit: item.unit })
                : (item.stock != null ? t('mis.offerInStock', { stock: item.stock, unit: item.unit }) : '')}
            </Typography>
            {item.listPrice != null && (!item.listCurrency || item.listCurrency === 'AED') && (
              <Button size="small" onClick={() => onChange({ ...line, unitPrice: String(item.listPrice) })}
                sx={{ textTransform: 'none', p: 0, minWidth: 0, fontSize: '0.72rem' }}>
                {t('mis.offerUseListPrice', { price: fmtMoney(item.listPrice) })}
              </Button>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

// The pricing form. Its state starts from the request's own items and the
// branch's defaults; a different request remounts it (the panel is keyed).
function OfferForm({ detail, replacing, onSent, onCancel }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const border = theme.palette.divider;

  const [lines, setLines] = useState(() => detail.items.map((item) => ({
    include: true,
    quantity: String(item.quantity),
    // The price is the associate's to enter. The inventory list price is offered as
    // a one-click suggestion on each item, never filled in (and sent) by itself.
    unitPrice: '',
    discount: '',
  })));
  const [delivery, setDelivery] = useState('');
  const [vat, setVat] = useState(String(detail.defaults.vatRate));
  const [duration, setDuration] = useState(String(detail.defaults.validForHours));
  const [customAmount, setCustomAmount] = useState('');
  const [customUnit, setCustomUnit] = useState('hours');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const hours = duration === 'custom' ? (Number(customAmount) || 0) * UNIT_FACTOR[customUnit] : Number(duration);
  const durationOk = hours * 60 >= MIN_MINUTES && hours <= MAX_HOURS;
  const included = lines.filter((line) => line.include);
  const pricesOk = included.length > 0 && included.every((line) => Number(line.unitPrice) > 0 && Number(line.quantity) > 0);
  const stockOk = detail.items.every((item, i) => !lines[i].include || item.stock == null || Number(lines[i].quantity) <= Number(item.stock));
  const totals = useMemo(() => previewTotals(lines, delivery, vat), [lines, delivery, vat]);
  const validUntil = durationOk ? new Date(Date.now() + hours * 3600 * 1000) : null;

  const problem = !included.length ? t('mis.offerNeedOne')
    : !pricesOk ? t('mis.offerPriceRequired')
      : !stockOk ? t('mis.offerStockProblem')
        : !durationOk ? t('mis.offerDurationInvalid') : '';

  const send = async () => {
    setSending(true);
    setError('');
    try {
      const res = await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/price-requests/${detail._id}/offer`,
        data: {
          lines: lines.map((line, index) => ({
            index, include: line.include, quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice), discount: Number(line.discount) || 0, discountType: 'percent',
          })),
          deliveryCharge: Number(delivery) || 0,
          vatRate: Number(vat),
          validForHours: hours,
          note: note.trim(),
        },
      });
      onSent(res.data);
    } catch (err) {
      const data = err?.response?.data;
      const extra = Array.isArray(data?.overages) && data.overages.length
        ? ' ' + data.overages.map((o) => `${o.code}: ${o.available}`).join(', ') : '';
      setError((data?.message || t('mis.offerSendFailed')) + extra);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ mt: 3, maxWidth: 760 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('mis.offerPricingHeading')}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
        {t('mis.offerSendHint')}
      </Typography>
      {replacing && <Alert severity="info" sx={{ mb: 1.5 }}>{t('mis.offerReplaces')}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {detail.items.map((item, i) => (
          <ItemRow key={i} item={item} line={lines[i]} t={t} border={border}
            onChange={(next) => setLines((old) => old.map((line, j) => (j === i ? next : line)))} />
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1.25, mt: 2 }}>
        <TextField size="small" type="number" label={t('mis.offerDelivery')} value={delivery}
          onChange={(e) => setDelivery(e.target.value)} inputProps={{ min: 0, step: 'any' }}
          helperText={t('mis.offerDeliveryHint')} sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }} />
        <TextField size="small" type="number" label={t('mis.fieldVatRate')} value={vat}
          onChange={(e) => setVat(e.target.value)} inputProps={{ min: 0, max: 100, step: 'any' }} />
        <TextField select size="small" label={t('mis.offerValidFor')} value={duration}
          onChange={(e) => setDuration(e.target.value)}>
          {PRESET_HOURS.map((h) => <MenuItem key={h} value={String(h)}>{durationLabel(t, h)}</MenuItem>)}
          <MenuItem value="custom">{t('mis.offerCustom')}</MenuItem>
        </TextField>
        {duration === 'custom' && (
          <>
            <TextField size="small" type="number" label={t('mis.offerCustomAmount')} value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)} inputProps={{ min: 0, step: 'any' }} />
            <TextField select size="small" label={t('mis.offerCustomUnit')} value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}>
              <MenuItem value="minutes">{t('mis.offerUnitMinutes')}</MenuItem>
              <MenuItem value="hours">{t('mis.offerUnitHours')}</MenuItem>
              <MenuItem value="days">{t('mis.offerUnitDays')}</MenuItem>
            </TextField>
          </>
        )}
      </Box>
      {validUntil && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
          {t('mis.offerValidUntil', { when: fmtWhen(validUntil) })}
        </Typography>
      )}

      <TextField size="small" multiline minRows={2} fullWidth sx={{ mt: 2 }} value={note}
        onChange={(e) => setNote(e.target.value)} label={t('mis.offerNote')} helperText={t('mis.offerNoteHint')}
        inputProps={{ maxLength: 2000 }} />

      <Box sx={{ mt: 2, p: 1.5, border: `1px solid ${border}`, borderRadius: '10px', maxWidth: 360, ml: { sm: 'auto' } }}>
        {[
          [t('mis.subtotalLabel'), totals.subtotal],
          totals.discountTotal > 0 ? [t('mis.discountLabel'), -totals.discountTotal] : null,
          [`${t('mis.vatLabel')} (${Number(vat) || 0}%)`, totals.vatTotal],
        ].filter(Boolean).map(([label, value]) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
            <Typography variant="body2">{fmtMoney(value)}</Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, pt: 0.5, borderTop: `1px solid ${border}` }}>
          <Typography sx={{ fontWeight: 700 }}>{t('mis.grandTotalLabel')}</Typography>
          <Typography sx={{ fontWeight: 700 }}>{fmtMoney(totals.grandTotal)}</Typography>
        </Box>
      </Box>

      {(error || problem) && (
        <Alert severity={error ? 'error' : 'warning'} sx={{ mt: 1.5 }}>{error || problem}</Alert>
      )}
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
        <Button variant="contained" size="small" startIcon={sending ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
          disabled={sending || Boolean(problem)} onClick={send} sx={{ textTransform: 'none' }}>
          {t('mis.offerSend')}
        </Button>
        {onCancel && <Button size="small" onClick={onCancel} disabled={sending} sx={{ textTransform: 'none' }}>{t('common.cancel')}</Button>}
      </Box>
    </Box>
  );
}

// Where the offer stands, and what the associate can still do about it.
function OfferStatusCard({ offer, canSend, canWithdraw, onOpen, onWithdraw, onNew, onExpire, t, border }) {
  const state = offer.state;
  return (
    <Box sx={{ mt: 3, p: 2, border: `1px solid ${border}`, borderLeft: `4px solid ${OFFER_STATE_COLOR[state] || OFFER_STATE_COLOR.expired}`, borderRadius: '10px', maxWidth: 760 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 700 }}>{t('mis.offerNumber', { number: offer.docNumber })}</Typography>
        <StatePill state={state} t={t} />
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontWeight: 700 }}>{fmtMoney(offer.grandTotal)} {offer.currency}</Typography>
      </Box>

      {state === 'open' && (
        <Typography variant="body2" sx={{ mt: 0.75 }}>
          {t('mis.offerExpiresIn')}{' '}
          <OfferCountdown validUntil={offer.validUntil} serverNow={offer.serverNow} onExpire={onExpire} />
          <Typography component="span" variant="caption" sx={{ color: 'text.secondary', marginInlineStart: 1 }}>
            {t('mis.offerValidUntil', { when: fmtWhen(offer.validUntil) })}
          </Typography>
        </Typography>
      )}
      {state === 'expired' && (
        <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary' }}>
          {t('mis.offerExpiredOn', { when: fmtWhen(offer.validUntil) })}
        </Typography>
      )}
      {state === 'accepted' && (
        <Typography variant="body2" sx={{ mt: 0.75 }}>
          {t('mis.offerAcceptedOn', { when: fmtWhen(offer.customerAcceptedAt) })}
          {offer.invoice && <b>{' — '}{t('mis.offerInvoiceNumber', { number: offer.invoice.docNumber })}</b>}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
        <Button size="small" variant="outlined" startIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
          onClick={() => onOpen({ _id: offer._id, docType: 'pre_invoice', docNumber: offer.docNumber, status: offer.status })}
          sx={{ textTransform: 'none' }}>
          {t('mis.offerOpenQuotation')}
        </Button>
        {offer.invoice && (
          <Button size="small" variant="outlined" startIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
            onClick={() => onOpen({ _id: offer.invoice._id, docType: 'invoice', docNumber: offer.invoice.docNumber, status: offer.invoice.status })}
            sx={{ textTransform: 'none' }}>
            {t('mis.offerOpenInvoice')}
          </Button>
        )}
        {state === 'open' && canWithdraw && (
          <Button size="small" color="warning" startIcon={<UndoIcon sx={{ fontSize: 15 }} />} onClick={onWithdraw} sx={{ textTransform: 'none' }}>
            {t('mis.offerWithdraw')}
          </Button>
        )}
        {state !== 'accepted' && canSend && (
          <Button size="small" variant="contained" startIcon={<SendIcon sx={{ fontSize: 15 }} />} onClick={onNew} sx={{ textTransform: 'none' }}>
            {t('mis.offerNew')}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default function WebsiteOfferPanel({ requestId, onOfferChanged }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState(null);          // { severity, text }
  const [viewDoc, setViewDoc] = useState(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const border = theme.palette.divider;

  const canSend = can('mis:preinvoice:create');
  const canWithdraw = can('mis:preinvoice:edit');

  const load = useCallback(async () => {
    try {
      const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/price-requests/${requestId}` });
      setDetail(res.data.data);
      setError('');
      return res.data.data;
    } catch (err) {
      setError(err?.response?.data?.message || t('mis.offerLoadFailed'));
      return null;
    }
  }, [authCtx, axiosGlobal.defaultTargetApi, requestId, t]);

  useEffect(() => {
    setDetail(null);
    setShowForm(false);
    setNotice(null);
    load();
  }, [requestId]);   // eslint-disable-line react-hooks/exhaustive-deps

  const handleSent = async (payload) => {
    setShowForm(false);
    setNotice({
      severity: payload.mailWarning ? 'warning' : 'success',
      text: payload.mailWarning || t('mis.offerSentTo', { number: payload.data.docNumber, email: detail?.email || '' }),
    });
    await load();
    if (onOfferChanged) onOfferChanged(payload.data);
  };

  const withdraw = async () => {
    try {
      const res = await authCtx.jwtInst({ method: 'put', url: `${axiosGlobal.defaultTargetApi}/price-requests/${requestId}/offer/withdraw` });
      setNotice({ severity: 'info', text: t('mis.offerWithdrawn') });
      await load();
      if (onOfferChanged) onOfferChanged(res.data.data);
    } catch (err) {
      setNotice({ severity: 'error', text: err?.response?.data?.message || t('mis.offerSendFailed') });
    }
  };

  // The countdown reached zero while the associate was looking: pull the fresh state.
  const handleExpire = useCallback(async () => {
    const fresh = await load();
    if (fresh && onOfferChanged) onOfferChanged(fresh.offer);
  }, [load, onOfferChanged]);

  if (error && !detail) return <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>;
  if (!detail) return <Box sx={{ mt: 3 }}><CircularProgress size={20} /></Box>;

  const offer = detail.offer;
  const formVisible = canSend && (!offer || (offer.state !== 'accepted' && showForm));

  return (
    <>
      {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mt: 3, maxWidth: 760 }}>{notice.text}</Alert>}

      {offer && (
        <OfferStatusCard offer={offer} canSend={canSend} canWithdraw={canWithdraw} t={t} border={border}
          onOpen={setViewDoc} onWithdraw={() => setConfirmWithdraw(true)} onNew={() => setShowForm(true)}
          onExpire={handleExpire} />
      )}

      {formVisible && (
        <OfferForm key={`${detail._id}:${offer ? offer._id : 'new'}`} detail={detail}
          replacing={Boolean(offer && offer.state === 'open')} onSent={handleSent}
          onCancel={offer ? () => setShowForm(false) : undefined} />
      )}

      {!canSend && !offer && <Alert severity="info" sx={{ mt: 3, maxWidth: 760 }}>{t('mis.offerNoPermission')}</Alert>}

      <InvoiceDetailDialog doc={viewDoc} open={Boolean(viewDoc)} onClose={() => setViewDoc(null)} onChanged={load} />
      <ConfirmDialog open={confirmWithdraw} onClose={() => setConfirmWithdraw(false)} onConfirm={withdraw}
        title={t('mis.offerWithdrawTitle')} message={t('mis.offerWithdrawMessage')}
        confirmLabel={t('mis.offerWithdraw')} destructive />
    </>
  );
}
