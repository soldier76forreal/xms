import { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';
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

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { updateMisPayment, actions } from '../../store/store';
import SendToDialog from './sendToDialog';

// Phase 6 — MIS invoice/pre-invoice detail container (Session 45).
// Header (number/type/status/customer/total + actions) · live document preview
// (the SAME backend HTML template that drives the PDF — fetched via jwtInst and
// injected through iframe srcDoc, since an iframe src can't carry the JWT) ·
// payment quick-record (invoice, mis:payment:edit) · activity timeline.

const STATUS_META = {
  draft:          { label: 'Draft',     color: '#9e9e9e' },
  sent:           { label: 'Sent',      color: '#64b5f6' },
  accepted:       { label: 'Accepted',  color: '#81c784' },
  converted:      { label: 'Converted', color: '#ba68c8' },
  expired:        { label: 'Expired',   color: '#ffb74d' },
  issued:         { label: 'Issued',    color: '#64b5f6' },
  paid:           { label: 'Paid',      color: '#81c784' },
  partially_paid: { label: 'Partial',   color: '#ffb74d' },
  cancelled:      { label: 'Cancelled', color: '#e57373' },
};

const ACTIVITY_META = {
  created:           { label: 'Created',            Icon: AddCircleOutlineIcon },
  updated:           { label: 'Updated',            Icon: EditIcon },
  status:            { label: 'Status changed',     Icon: SyncAltIcon },
  converted:         { label: 'Converted',          Icon: SwapHorizIcon },
  pdf_generated:     { label: 'PDF generated',      Icon: PictureAsPdfIcon },
  payment:           { label: 'Payment recorded',   Icon: PaidIcon },
  stock_decremented: { label: 'Stock decremented',  Icon: Inventory2Icon },
  stock_restored:    { label: 'Stock restored',     Icon: RestoreIcon },
  assigned:          { label: 'Sent to user(s)',    Icon: SendIcon },
  deleted:           { label: 'Deleted',            Icon: DeleteOutlineIcon },
};

const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

export default function InvoiceDetail({ doc, onClose, onEdit, onPdf, onConvert, onDelete }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

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

  const isInvoice = doc.docType === 'invoice';
  const permBase  = isInvoice ? 'mis:invoice' : 'mis:preinvoice';
  const status    = STATUS_META[(full || doc).status] || STATUS_META.draft;
  const live      = full || doc;

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
    } catch (_) { /* snackbar handled globally on 401; detail keeps list data */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx, axiosGlobal, doc._id, permBase, can, previewLang]);

  useEffect(() => { loadDetail(true); }, [doc._id]);   // eslint-disable-line react-hooks/exhaustive-deps
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

  const activity = full?.activity || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <Box sx={{ px: 3, pt: 2, pb: 1.5, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1.02rem', fontWeight: 700, color: T.TEXT_PRI }}>
            {isInvoice ? 'Invoice' : 'Quotation'} #{live.docNumber}
          </Typography>
          <Box sx={{ px: 0.75, py: '1px', borderRadius: '5px', bgcolor: `${status.color}22` }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: status.color }}>
              {status.label}
            </Typography>
          </Box>
          {isInvoice && live.stockDecremented && (
            <Tooltip title="Stock decremented on payment">
              <Inventory2Icon sx={{ fontSize: 14, color: T.TEXT_TER }} />
            </Tooltip>
          )}
          {(live.assignedTo || []).length > 0 && (
            <Tooltip title={`Sent to ${live.assignedTo.length} user(s)`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <PeopleAltIcon sx={{ fontSize: 14, color: T.TEXT_TER }} />
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.TEXT_TER }}>
                  {live.assignedTo.length}
                </Typography>
              </Box>
            </Tooltip>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton size="small" onClick={onClose} sx={{ color: T.TEXT_TER }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, mt: 0.25 }}>
          {live.customerSnapshot?.name || '—'}
          {live.customerSnapshot?.country ? ` · ${live.customerSnapshot.country}` : ''}
          {' · '}
          <Box component="span" sx={{ fontWeight: 700, color: T.TEXT_PRI }}>
            {fmtMoney(live.grandTotal)} AED
          </Box>
        </Typography>

        {/* actions */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.25 }}>
          {can(`${permBase}:edit`) && (
            <Button size="small" variant="outlined" startIcon={<EditIcon sx={{ fontSize: 14 }} />}
              onClick={() => onEdit && onEdit(live)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px',
                color: T.TEXT_SEC, borderColor: T.BD2 }}>
              Edit
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
                Download PDF
              </Button>
            </>
          )}
          {!isInvoice && can('mis:preinvoice:convert') && live.status !== 'converted' && !live.convertedToInvoiceId && (
            <Button size="small" variant="outlined" startIcon={<SwapHorizIcon sx={{ fontSize: 14 }} />}
              onClick={() => onConvert && onConvert(live)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px',
                color: T.TEXT_SEC, borderColor: T.BD2 }}>
              Convert
            </Button>
          )}
          {isInvoice && can('mis:payment:edit') && (
            <Button size="small" variant="outlined" startIcon={<PaidIcon sx={{ fontSize: 14 }} />}
              onClick={() => setPayOpen(o => !o)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px',
                color: payOpen ? T.TEXT_PRI : T.TEXT_SEC, borderColor: T.BD2 }}>
              Payment
            </Button>
          )}
          {can(`${permBase}:edit`) && (
            <Button size="small" variant="outlined" startIcon={<SendIcon sx={{ fontSize: 14 }} />}
              onClick={() => setAssignOpen(true)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px',
                color: T.TEXT_SEC, borderColor: T.BD2 }}>
              Send to…
            </Button>
          )}
          {can(`${permBase}:delete`) && (
            <Button size="small" startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
              onClick={() => onDelete && onDelete(live)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px',
                color: '#EA005A', '&:hover': { bgcolor: 'rgba(234,0,90,0.07)' } }}>
              Delete
            </Button>
          )}
        </Box>

        {/* payment quick-record (invoice only) */}
        {payOpen && isInvoice && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 1.25,
            p: 1.25, border: `1px solid ${T.BD}`, borderRadius: '10px', bgcolor: T.CTRL_BG }}>
            {[
              ['cash', 'Cash'], ['chequeBank', 'Cheque / bank'], ['card', 'Card'],
            ].map(([key, label]) => (
              <TextField key={key} size="small" label={label} type="number" value={pay[key]}
                onChange={(e) => setPay(p => ({ ...p, [key]: e.target.value }))}
                inputProps={{ style: { fontSize: '0.78rem' }, min: 0, step: 'any' }}
                InputLabelProps={{ style: { fontSize: '0.75rem' } }}
                sx={{ width: 130, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }} />
            ))}
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>
              Remaining:&nbsp;
              <Box component="span" sx={{ fontWeight: 700, color: T.TEXT_PRI }}>
                {fmtMoney((live.grandTotal || 0)
                  - (Number(pay.cash) || 0) - (Number(pay.chequeBank) || 0) - (Number(pay.card) || 0))}
              </Box>
            </Typography>
            <Button size="small" variant="contained" disabled={paySaving} onClick={handleSavePayment}
              sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px', ml: 'auto' }}>
              {paySaving ? <CircularProgress size={13} sx={{ mr: 0.5 }} /> : null}
              Save
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
            Document preview
          </Typography>

          {loading && !previewHtml ? (
            <Skeleton variant="rectangular" height={420} sx={{ borderRadius: '10px' }} />
          ) : previewHtml ? (
            <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', overflow: 'hidden',
              bgcolor: '#ffffff' }}>
              <Box component="iframe" srcDoc={previewHtml} title={`doc-${live.docNumber}`}
                sandbox=""
                sx={{ display: 'block', width: '100%', height: { xs: 480, md: 640 },
                  border: 'none', bgcolor: '#ffffff' }} />
            </Box>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center', border: `1px dashed ${T.BD}`, borderRadius: '10px' }}>
              <DescriptionIcon sx={{ fontSize: 28, color: T.TEXT_TER, mb: 0.5 }} />
              <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER }}>
                Preview unavailable
              </Typography>
            </Box>
          )}
        </Box>

        {/* activity timeline */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
            textTransform: 'uppercase', color: T.TEXT_TER, mb: 1,
            display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HistoryIcon sx={{ fontSize: 13 }} /> Activity
          </Typography>

          {loading && activity.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="text" width="70%" height={18} />
              ))}
            </Box>
          ) : activity.length === 0 ? (
            <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER }}>No activity yet.</Typography>
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
                        {meta.label}
                        {a.type === 'status' && a.oldValue && a.newValue && (
                          <Box component="span" sx={{ color: T.TEXT_SEC }}>
                            {' '}— {String(a.oldValue).replace('_', ' ')} → {String(a.newValue).replace('_', ' ')}
                          </Box>
                        )}
                        {a.type === 'converted' && a.newValue && (
                          <Box component="span" sx={{ color: T.TEXT_SEC }}> — invoice #{a.newValue}</Box>
                        )}
                        {a.type === 'assigned' && typeof a.newValue === 'number' && (
                          <Box component="span" sx={{ color: T.TEXT_SEC }}> — {a.newValue} user(s)</Box>
                        )}
                      </Typography>
                      {a.body && (
                        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, mt: 0.25 }}>
                          {a.body}
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, mt: 0.25 }}>
                        {a.actorName ? `${a.actorName} · ` : ''}{fmtDateTime(a.date)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

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
