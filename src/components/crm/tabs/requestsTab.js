import { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material';

import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../../contextApi/PermissionContext';
import { downloadMisInvoicePdf } from '../../../store/store';
import InvoiceDetailDialog from '../../mis/invoiceDetailDialog';
import InvoiceForm from '../../mis/invoiceForm';

// Phase 6 (Session 46) — the CRM customer Requests tab, WIRED to MIS.
// GET /crm/customers/:id/requests → this customer's invoices + pre-invoices
// (newest first, reverse lookup by customerId). Compact rows: docType chip,
// number, date, total, status (+ PDF download when the user holds the key).

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

const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate  = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

const TYPE_TABS = [
  { id: 'all',         label: 'All' },
  { id: 'invoice',     label: 'Invoice' },
  { id: 'pre_invoice', label: 'Quote' },
];

export default function RequestsTab({ customer }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [order, setOrder]     = useState('desc');
  const [formOpen, setFormOpen] = useState(false);
  const [formDocType, setFormDocType] = useState('invoice');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({ method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/crm/customers/${customer._id}/requests`,
        params: { docType: typeFilter, order } });
      setDocs(res.data.data || []);
    } catch (_) { setDocs([]); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx, axiosGlobal, customer._id, typeFilter, order]);

  useEffect(() => { load(); }, [load]);

  const handlePdf = (doc) =>
    dispatch(downloadMisInvoicePdf({ authCtx, axiosGlobal, id: doc._id, docType: doc.docType, docNumber: doc.docNumber }));

  const openNewForm = (docType) => { setFormDocType(docType); setFormOpen(true); };

  const FilterBar = (
    <Box sx={{ px: 2.5, pt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {TYPE_TABS.map((t) => (
          <Button key={t.id} size="small" onClick={() => setTypeFilter(t.id)}
            variant={typeFilter === t.id ? 'contained' : 'outlined'}
            sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '8px', minWidth: 0, px: 1.25 }}>
            {t.label}
          </Button>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
        <Tooltip title={order === 'desc' ? 'Newest first' : 'Oldest first'}>
          <Button size="small" onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            startIcon={order === 'desc' ? <ArrowDownwardIcon sx={{ fontSize: 13 }} /> : <ArrowUpwardIcon sx={{ fontSize: 13 }} />}
            sx={{ fontSize: '0.68rem', textTransform: 'none', color: T.TEXT_SEC }}>
            {order === 'desc' ? 'Newest' : 'Oldest'}
          </Button>
        </Tooltip>
        {can('mis:invoice:create') && (
          <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            onClick={() => openNewForm('invoice')}
            sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '8px' }}>
            New invoice
          </Button>
        )}
        {can('mis:preinvoice:create') && (
          <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            onClick={() => openNewForm('pre_invoice')}
            sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '8px' }}>
            New quote
          </Button>
        )}
      </Box>
    </Box>
  );

  const invoiceFormDialog = (
    <InvoiceForm
      open={formOpen}
      mode="new"
      docType={formDocType}
      onClose={() => setFormOpen(false)}
      onSaved={load}
      preset={{ customer }}
    />
  );

  if (loading) {
    return (
      <Box>
        {FilterBar}
        <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: '10px' }} />
          ))}
        </Box>
        {invoiceFormDialog}
      </Box>
    );
  }

  if (docs.length === 0) {
    return (
      <Box>
        {FilterBar}
        <Box sx={{ px: 2.5, py: 4, textAlign: 'center' }}>
          <ReceiptLongIcon sx={{ fontSize: 40, color: T.TEXT_TER, mb: 1 }} />
          <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
            No invoices or quotes for this customer yet
          </Typography>
        </Box>
        {invoiceFormDialog}
      </Box>
    );
  }

  return (
    <Box>
      {FilterBar}
      <Box sx={{ px: 2.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {docs.map(doc => {
          const isInvoice = doc.docType === 'invoice';
          const status    = STATUS_META[doc.status] || STATUS_META.draft;
          const pdfKey    = isInvoice ? 'mis:invoice:pdf' : 'mis:preinvoice:pdf';
          return (
            <Box key={doc._id} onClick={() => setViewDoc(doc)}
              sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, cursor: 'pointer',
              px: 1.5, py: 1, border: `1px solid ${T.BD}`, borderRadius: '10px',
              '&:hover': { borderColor: T.TEXT_TER } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isInvoice
                  ? <ReceiptLongIcon  sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />
                  : <RequestQuoteIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />}

                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
                  #{doc.docNumber}
                </Typography>

                <Box sx={{ px: 0.6, py: '1px', borderRadius: '5px', border: `1px solid ${T.BD}`, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: 0.5,
                    textTransform: 'uppercase', color: T.TEXT_SEC }}>
                    {isInvoice ? 'Invoice' : 'Quote'}
                  </Typography>
                </Box>

                <Box sx={{ px: 0.6, py: '1px', borderRadius: '5px', bgcolor: `${status.color}22`, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: status.color }}>
                    {status.label}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, flexGrow: 1, textAlign: 'right' }}>
                  {fmtDate(doc.issueDate)}
                </Typography>

                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
                  {fmtMoney(doc.grandTotal)}
                  <Box component="span" sx={{ fontSize: '0.6rem', color: T.TEXT_TER }}> AED</Box>
                </Typography>

                {can(pdfKey) && (
                  <Tooltip title="Download PDF">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handlePdf(doc); }}
                      sx={{ width: 24, height: 24, color: T.TEXT_TER }}>
                      <PictureAsPdfIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {doc.codes?.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', pl: 3 }}>
                  {doc.codes.map((code, i) => (
                    <Box key={i} sx={{ px: 0.6, py: '1px', borderRadius: '4px', bgcolor: T.CTRL_BG }}>
                      <Typography sx={{ fontSize: '0.62rem', fontFamily: 'monospace', fontWeight: 700, color: T.TEXT_SEC }}>
                        {code}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}

        <InvoiceDetailDialog doc={viewDoc} open={Boolean(viewDoc)} onClose={() => setViewDoc(null)} />
      </Box>
      {invoiceFormDialog}
    </Box>
  );
}
