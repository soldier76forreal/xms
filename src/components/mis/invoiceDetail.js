import { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PaidIcon from '@mui/icons-material/Paid';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SendIcon from '@mui/icons-material/Send';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RestoreIcon from '@mui/icons-material/Restore';
import TerrainIcon from '@mui/icons-material/Terrain';
import { useHistory } from 'react-router-dom';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';
import { updateMisPayment, actions } from '../../store/store';
import SendToDialog from './sendToDialog';
import { getDocActions } from './docActions';
import CopyLinkButton from '../main/copyLinkButton';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
import UserAvatar from '../main/userAvatar';
import PackingListsForInvoice from './packingLists/packingListsForInvoice';
import DocPreviewFrame from '../../tools/docPreviewFrame';

// Phase 6 — MIS invoice/pre-invoice detail container (Session 45).
// Header (number/type/status/customer/total + actions) · live document preview
// (the SAME backend HTML template that drives the PDF — fetched via jwtInst and
// injected through iframe srcDoc, since an iframe src can't carry the JWT) ·
// payment quick-record (invoice, mis:payment:edit) · activity timeline.

const STATUS_META = {
  requested:      { labelKey: 'mis.statusRequested', color: '#f06292' },
  draft:          { labelKey: 'mis.statusDraft',     color: '#9e9e9e' },
  sent:           { labelKey: 'mis.statusSent',      color: '#64b5f6' },
  accepted:       { labelKey: 'mis.statusAccepted',  color: '#81c784' },
  converted:      { labelKey: 'mis.statusConverted', color: '#ba68c8' },
  expired:        { labelKey: 'mis.statusExpired',   color: '#ffb74d' },
  issued:         { labelKey: 'mis.statusIssued',    color: '#64b5f6' },
  paid:           { labelKey: 'mis.statusPaid',      color: '#81c784' },
  partially_paid: { labelKey: 'mis.statusPartial',   color: '#ffb74d' },
  cancelled:      { labelKey: 'mis.statusCancelled', color: '#e57373' },
};

// What the branch a request was sent to can move it through, in order.
// 'converted' is never picked by hand — converting the request sets it.
const REQUEST_STATUSES = ['requested', 'draft', 'sent', 'accepted', 'expired', 'cancelled'];

// A status shown as a coloured pill — the one visual for status everywhere in
// this panel, so the dropdown and the read-only view look the same.
function StatusPill({ status, t, size = 'md' }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ width: size === 'md' ? 8 : 7, height: size === 'md' ? 8 : 7, borderRadius: '50%',
        bgcolor: meta.color, boxShadow: `0 0 0 3px ${meta.color}33`, flexShrink: 0 }} />
      <Typography sx={{ fontSize: size === 'md' ? '0.78rem' : '0.74rem', fontWeight: 700, color: meta.color }}>
        {t(meta.labelKey)}
      </Typography>
    </Box>
  );
}

const ACTIVITY_META = {
  created:           { labelKey: 'mis.activityCreated',           Icon: AddCircleOutlineIcon },
  updated:           { labelKey: 'mis.activityUpdated',           Icon: EditIcon },
  status:            { labelKey: 'mis.activityStatusChanged',     Icon: SyncAltIcon },
  converted:         { labelKey: 'mis.activityConverted',         Icon: SwapHorizIcon },
  pdf_generated:     { labelKey: 'mis.activityPdfGenerated',      Icon: PictureAsPdfIcon },
  payment:           { labelKey: 'mis.activityPaymentRecorded',   Icon: PaidIcon },
  stock_decremented: { labelKey: 'mis.activityStockDecremented',  Icon: Inventory2Icon },
  stock_restored:    { labelKey: 'mis.activityStockRestored',     Icon: RestoreIcon },
  assigned:          { labelKey: 'mis.activitySentToUsers',       Icon: SendIcon },
  deleted:           { labelKey: 'mis.activityDeleted',           Icon: DeleteOutlineIcon },
};

const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

// onBack (phones): an inline back arrow at the start of the title row — it
// used to float over the title from outside.
export default function InvoiceDetail({ doc, onClose, onEdit, onPdf, onConvert, onDelete, onBack }) {
  const { t } = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can, ready } = usePermissions();
  const { activeBranchId } = useBranch();
  const history = useHistory();

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const [full, setFull]           = useState(null);   // full doc + activity (list rows exclude packingList/notes)
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLang, setPreviewLang] = useState('ar');   // template language: ar | en | fa
  const [loading, setLoading]     = useState(true);
  const [payOpen, setPayOpen]     = useState(false);
  const [pay, setPay]             = useState({ cash: '', chequeBank: '', card: '' });
  const [paySaving, setPaySaving] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [restricted, setRestricted] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const isInvoice = doc.docType === 'invoice';
  const permBase  = isInvoice ? 'mis:invoice' : 'mis:preinvoice';
  const status    = STATUS_META[(full || doc).status] || STATUS_META.draft;
  const live      = full || doc;
  const isInterBranch = live.tradeMode === 'interBranch';
  // A request = an inter-branch quotation. Its status belongs to the branch it
  // was sent to (live.branchId); the requesting side follows along read-only.
  const isRequest = !isInvoice && isInterBranch;
  const isTargetSide = isInterBranch && String(live.branchId) === String(activeBranchId);
  const canSetRequestStatus = isRequest && isTargetSide && can('mis:preinvoice:edit')
    && live.status !== 'converted' && !live.convertedToInvoiceId;
  // Every other action: only what this viewer can actually do (docActions.js).
  const allowed = getDocActions(live, { can, activeBranchId });
  const canConvertDoc = Boolean(onConvert) && allowed.convert;

  const loadDetail = useCallback(async (refetchDoc = true) => {
    setLoading(true);
    try {
      const [detailRes, htmlRes] = await Promise.all([
        refetchDoc
          ? authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/mis/invoices/${doc._id}` })
          : Promise.resolve({ data: full }),
        can(`${permBase}:pdf`) || can('mis:view')
          ? authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/mis/invoices/${doc._id}/html`,
              params: { lang: previewLang }, responseType: 'text' })
          : Promise.resolve({ data: '' }),
      ]);
      setFull(detailRes.data);
      setPreviewHtml(typeof htmlRes.data === 'string' ? htmlRes.data : '');
      const p = detailRes.data?.payment || {};
      setPay({ cash: p.cash || '', chequeBank: p.chequeBank || '', card: p.card || '' });
    } catch (err) {
      // A short-link/notification deep link can hand this component a doc the
      // viewer isn't scoped/permitted to see — show the full-page Restricted
      // Access screen instead of a blank/broken detail.
      if (err?.response?.status === 403) setRestricted(true);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx, axiosGlobal, doc._id, permBase, can, previewLang]);

  // `ready`: a deep link can open this before the permission set has loaded, and
  // loadDetail only asks for the preview when the viewer holds a permission —
  // so it has to run again once permissions arrive.
  useEffect(() => { setRestricted(false); loadDetail(true); }, [doc._id, ready]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (full) loadDetail(false); }, [previewLang]);   // eslint-disable-line react-hooks/exhaustive-deps

  const handleSavePayment = async () => {
    setPaySaving(true);
    await dispatch(updateMisPayment({ authCtx, axiosGlobal, id: doc._id, data: {
      cash:       Number(pay.cash)       || 0,
      chequeBank: Number(pay.chequeBank) || 0,
      card:       Number(pay.card)       || 0,
    } }));
    setPaySaving(false);
    setPayOpen(false);
    loadDetail();   // refresh totals/status/activity + preview
  };

  const changeRequestStatus = async (next) => {
    if (!next || next === live.status) return;
    setStatusSaving(true);
    try {
      const res = await authCtx.jwtInst({ method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/mis/invoices/${doc._id}`, data: { status: next } });
      dispatch(actions.misInvUpsert(res.data));
      dispatch(actions.setShowSnackBar({ status: true, type: 'success',
        msg: t('mis.requestStatusChangedMsg', { number: live.docNumber, status: t((STATUS_META[next] || STATUS_META.draft).labelKey) }) }));
      loadDetail();
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true, type: 'error',
        msg: err?.response?.data?.message || t('mis.requestStatusFailed') }));
    }
    setStatusSaving(false);
  };

  if (restricted) return <RestrictedAccessScreen />;

  const activity = full?.activity || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1.5, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {onBack && (
            <IconButton size="small" onClick={onBack} sx={{ ml: -0.75, color: T.TEXT_SEC }}>
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          <Typography sx={{ fontSize: '1.02rem', fontWeight: 700, color: T.TEXT_PRI }}>
            {isInvoice ? t('mis.invoiceType') : (isRequest ? t('supply.docKindRequest') : t('mis.quotationLong'))} #{live.docNumber}
          </Typography>
          <Box sx={{ px: 0.75, py: '1px', borderRadius: '5px', bgcolor: `${status.color}22` }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: status.color }}>
              {t(status.labelKey)}
            </Typography>
          </Box>
          {/* Stock taken out: a paid invoice, or an accepted quotation / request
              (and the invoice it was converted into). */}
          {live.stockDecremented && (
            <Tooltip title={isInvoice ? t('mis.stockDecrementedTooltip') : t('mis.stockReservedTooltip')}>
              <Inventory2Icon sx={{ fontSize: 14, color: isInvoice ? T.TEXT_TER : '#81c784' }} />
            </Tooltip>
          )}
          {(live.assignedTo || []).length > 0 && (
            <Tooltip title={live.assignedByName
              ? t('mis.sentByToUsers', { name: live.assignedByName, count: live.assignedTo.length })
              : t('mis.sentToUsers', { count: live.assignedTo.length })}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <PeopleAltIcon sx={{ fontSize: 14, color: T.TEXT_TER }} />
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.TEXT_TER }}>
                  {live.assignedTo.length}
                </Typography>
                {live.assignedByName && (
                  <>
                    <UserAvatar userId={live.assignedBy} size={14} fontSize="0.5rem" />
                    <Typography sx={{ fontSize: '0.68rem', color: '#64b5f6', fontWeight: 600 }}>
                      {t('mis.fromName', { name: live.assignedByName })}
                    </Typography>
                  </>
                )}
              </Box>
            </Tooltip>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <CopyLinkButton module="mis" entityType="invoice" entityId={doc._id} />
          <IconButton size="small" onClick={onClose} sx={{ color: T.TEXT_TER }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, mt: 0.25 }}>
          {isInterBranch
            ? t('mis.requestFromBranchLine', { branch: live.requestingBranchSnapshot?.name || '—' })
            : (live.customerSnapshot?.name || '—')}
          {!isInterBranch && live.customerSnapshot?.country ? ` · ${live.customerSnapshot.country}` : ''}
          {' · '}
          <Box component="span" sx={{ fontWeight: 700, color: T.TEXT_PRI }}>
            {fmtMoney(live.grandTotal)} AED
          </Box>
        </Typography>

        {/* The supply record this was raised against, by its code. The record
            lives in this doc's (fulfilling) branch — it opens from there. */}
        {full?.supplyRecord && (() => {
          const canOpen = String(live.branchId) === String(activeBranchId);
          return (
            <Box onClick={canOpen ? () => history.push(`/supply?open=${full.supplyRecord._id}`) : undefined}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, mt: 0.75, px: 0.9, py: '3px',
                maxWidth: '100%', borderRadius: '7px', border: `1px solid ${T.BD}`,
                cursor: canOpen ? 'pointer' : 'default', '&:hover': canOpen ? { borderColor: T.BD2 } : undefined }}>
              <TerrainIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC }} noWrap>
                <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#64b5f6' }}>
                  {full.supplyRecord.code || '—'}
                </Box>
                {full.supplyRecord.title ? ` · ${full.supplyRecord.title}` : ''}
              </Typography>
            </Box>
          );
        })()}

        {/* actions */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.25 }}>
          {onEdit && allowed.edit && (
            <Button size="small" variant="outlined" startIcon={<EditIcon sx={{ fontSize: 14 }} />}
              onClick={() => onEdit(live)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px',
                color: T.TEXT_SEC, borderColor: T.BD2 }}>
              {t('common.edit')}
            </Button>
          )}
          {can(`${permBase}:pdf`) && (
            <>
              <Select size="small" value={previewLang} onChange={(e) => setPreviewLang(e.target.value)}
                sx={{ fontSize: '0.72rem', height: 30, minWidth: 76,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD2 } }}>
                <MenuItem value="ar" sx={{ fontSize: '0.78rem' }}>عربي</MenuItem>
                <MenuItem value="en" sx={{ fontSize: '0.78rem' }}>English</MenuItem>
                <MenuItem value="fa" sx={{ fontSize: '0.78rem' }}>فارسی</MenuItem>
              </Select>
              <Button size="small" variant="contained" startIcon={<PictureAsPdfIcon sx={{ fontSize: 14 }} />}
                onClick={() => onPdf && onPdf(live, previewLang)}
                sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px' }}>
                {t('mis.savePdf')}
              </Button>
            </>
          )}
          {canConvertDoc && !isRequest && (
            <Button size="small" variant="outlined" startIcon={<SwapHorizIcon sx={{ fontSize: 14 }} />}
              onClick={() => onConvert(live)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px',
                color: T.TEXT_SEC, borderColor: T.BD2 }}>
              {t('mis.convertToInvoice')}
            </Button>
          )}
          {allowed.payment && (
            <Button size="small" variant="outlined" startIcon={<PaidIcon sx={{ fontSize: 14 }} />}
              onClick={() => setPayOpen(o => !o)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px',
                color: payOpen ? T.TEXT_PRI : T.TEXT_SEC, borderColor: T.BD2 }}>
              {t('mis.paymentButton')}
            </Button>
          )}
          {allowed.assign && (
            <Button size="small" variant="outlined" startIcon={<SendIcon sx={{ fontSize: 14 }} />}
              onClick={() => setAssignOpen(true)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px',
                color: T.TEXT_SEC, borderColor: T.BD2 }}>
              {t('mis.sendToEllipsis')}
            </Button>
          )}
          {onDelete && allowed.remove && (
            <Button size="small" startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
              onClick={() => onDelete(live)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px',
                color: '#EA005A', '&:hover': { bgcolor: 'rgba(234,0,90,0.07)' } }}>
              {t('common.delete')}
            </Button>
          )}
        </Box>

        {/* payment quick-record (invoice only) */}
        {payOpen && allowed.payment && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 1.25,
            p: 1.25, border: `1px solid ${T.BD}`, borderRadius: '10px', bgcolor: T.CTRL_BG }}>
            {[
              ['cash', t('mis.paymentCash')], ['chequeBank', t('mis.paymentChequeBank')], ['card', t('mis.paymentCard')],
            ].map(([key, label]) => (
              <TextField key={key} size="small" label={label} type="number" value={pay[key]}
                onChange={(e) => setPay(p => ({ ...p, [key]: e.target.value }))}
                inputProps={{ style: { fontSize: '0.78rem' }, min: 0, step: 'any' }}
                InputLabelProps={{ style: { fontSize: '0.75rem' } }}
                sx={{ width: 130, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }} />
            ))}
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>
              {t('mis.remainingLabel')}&nbsp;
              <Box component="span" sx={{ fontWeight: 700, color: T.TEXT_PRI }}>
                {fmtMoney((live.grandTotal || 0)
                  - (Number(pay.cash) || 0) - (Number(pay.chequeBank) || 0) - (Number(pay.card) || 0))}
              </Box>
            </Typography>
            <Button size="small" variant="contained" disabled={paySaving} onClick={handleSavePayment}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px', ml: 'auto' }}>
              {paySaving ? <CircularProgress size={13} sx={{ mr: 0.5 }} /> : null}
              {t('common.save')}
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Body: preview + activity ── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>

        {/* document preview — same HTML template the PDF uses */}
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
            textTransform: 'uppercase', color: T.TEXT_TER, mb: 1 }}>
            {t('mis.documentPreview')}
          </Typography>

          {loading && !previewHtml ? (
            <Skeleton variant="rectangular" height={420} sx={{ borderRadius: '10px' }} />
          ) : previewHtml ? (
            <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', overflow: 'hidden',
              bgcolor: '#ffffff' }}>
              <DocPreviewFrame html={previewHtml} title={`doc-${live.docNumber}`}
                height={{ xs: 480, md: 640 }} />
            </Box>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center', border: `1px dashed ${T.BD}`, borderRadius: '10px' }}>
              <DescriptionIcon sx={{ fontSize: 28, color: T.TEXT_TER, mb: 0.5 }} />
              <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER }}>
                {t('mis.previewUnavailable')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* packing lists linked to this invoice (Session 72, Phase 3) */}
        <PackingListsForInvoice invoiceId={doc._id} />

        {/* activity timeline */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
            textTransform: 'uppercase', color: T.TEXT_TER, mb: 1,
            display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HistoryIcon sx={{ fontSize: 13 }} /> {t('mis.activityHeader')}
          </Typography>

          {loading && activity.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="text" width="70%" height={18} />
              ))}
            </Box>
          ) : activity.length === 0 ? (
            <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER }}>{t('mis.noActivityYet')}</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {activity.map((a, i) => {
                const meta = ACTIVITY_META[a.type] || ACTIVITY_META.updated;
                const AIcon = meta.Icon;
                return (
                  <Box key={a._id || i} sx={{ display: 'flex', gap: 1.25, pb: i === activity.length - 1 ? 0 : 1.5,
                    position: 'relative' }}>
                    {/* timeline rail */}
                    {i !== activity.length - 1 && (
                      <Box sx={{ position: 'absolute', left: 11, top: 24, bottom: 0,
                        width: '1px', bgcolor: T.BD }} />
                    )}
                    <Box sx={{ width: 23, height: 23, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
                      <AIcon sx={{ fontSize: 12, color: T.TEXT_SEC }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_PRI, lineHeight: 1.3 }}>
                        {t(meta.labelKey)}
                        {a.type === 'status' && a.oldValue && a.newValue && (
                          <Box component="span" sx={{ color: T.TEXT_SEC }}>
                            {' '}— {String(a.oldValue).replace('_', ' ')} → {String(a.newValue).replace('_', ' ')}
                          </Box>
                        )}
                        {a.type === 'converted' && a.newValue && (
                          <Box component="span" sx={{ color: T.TEXT_SEC }}>{t('mis.convertedToInvoiceNum', { number: a.newValue })}</Box>
                        )}
                        {a.type === 'assigned' && typeof a.newValue === 'number' && (
                          <Box component="span" sx={{ color: T.TEXT_SEC }}>{t('mis.assignedCountUsers', { count: a.newValue })}</Box>
                        )}
                      </Typography>
                      {a.body && (
                        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, mt: 0.25 }}>
                          {a.body}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.25 }}>
                        {a.actorName && <UserAvatar userId={a.actorId} size={14} fontSize="0.5rem" />}
                        <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>
                          {a.actorName ? `${a.actorName} · ` : ''}{fmtDateTime(a.date)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Request status bar — pinned to the bottom of the panel ── */}
      {isRequest && (
        <Box sx={{ flexShrink: 0, borderTop: `1px solid ${T.BD}`, px: { xs: 2, sm: 3 }, py: 1.25,
          display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap',
          bgcolor: isDark ? '#0b0b0b' : 'background.paper' }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: 1,
            textTransform: 'uppercase', color: T.TEXT_TER }}>
            {t('mis.requestStatusLabel')}
          </Typography>

          {canSetRequestStatus ? (
            <Select size="small" value={live.status} disabled={statusSaving}
              onChange={(e) => changeRequestStatus(e.target.value)}
              renderValue={(v) => <StatusPill status={v} t={t} />}
              sx={{ minWidth: 176, height: 34, borderRadius: '9px',
                bgcolor: `${status.color}1a`,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: `${status.color}88` },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: status.color },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: status.color },
                '& .MuiSelect-icon': { color: status.color } }}
              MenuProps={{ PaperProps: { sx: { borderRadius: '10px', mt: 0.5 } } }}>
              {REQUEST_STATUSES.map((s) => (
                <MenuItem key={s} value={s} sx={{ py: 0.9, display: 'block',
                  '&.Mui-selected': { bgcolor: `${(STATUS_META[s] || STATUS_META.draft).color}1f` } }}>
                  <StatusPill status={s} t={t} size="sm" />
                  {/* what accepting does — it moves stock */}
                  {s === 'accepted' && (
                    <Typography sx={{ fontSize: '0.64rem', color: 'text.secondary', mt: 0.25, ml: 2 }}>
                      {t('mis.acceptedTakesStockHint')}
                    </Typography>
                  )}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Box sx={{ px: 1.25, py: 0.6, borderRadius: '9px', bgcolor: `${status.color}1a`,
              border: `1px solid ${status.color}55` }}>
              <StatusPill status={live.status} t={t} />
            </Box>
          )}
          {statusSaving && <CircularProgress size={14} sx={{ color: T.TEXT_TER }} />}

          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, flex: 1, minWidth: 160 }}>
            {isTargetSide
              ? t('mis.requestStatusHintTarget', { branch: live.requestingBranchSnapshot?.name || '—' })
              : t('mis.requestStatusHintRequester')}
          </Typography>

          {canConvertDoc && (
            <Button size="small" variant="contained" startIcon={<SwapHorizIcon sx={{ fontSize: 15 }} />}
              onClick={() => onConvert(live)}
              sx={{ fontSize: '0.74rem', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}>
              {t('mis.convertToInvoice')}
            </Button>
          )}
        </Box>
      )}

      <SendToDialog
        doc={live}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onDone={(updated) => {
          setAssignOpen(false);
          dispatch(actions.misInvUpsert(updated));
          loadDetail();
        }}
      />
    </Box>
  );
}
