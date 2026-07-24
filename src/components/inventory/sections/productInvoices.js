import { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';

import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../../contextApi/PermissionContext';
import { downloadMisInvoicePdf } from '../../../store/store';
import InvoiceDetailDialog from '../../mis/invoiceDetailDialog';
import InvoiceForm from '../../mis/invoiceForm';

// Phase 6 (Session 46) — product → Invoices reverse lookup.
// GET /inventory/products/:id/invoices returns every invoice/pre-invoice whose
// lineItems.productId (or .variantId, incl. the product's variants) matches —
// the symmetric mirror of the CRM Requests tab. Rendered only when the user
// holds mis:view (the backend gates with inventory:view + mis:view anyway).

const STATUS_META = {
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

const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate  = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

const PREVIEW_COUNT = 5;
const TYPE_TABS = [
  { id: 'all',         labelKey: 'inventory.typeAll' },
  { id: 'invoice',     labelKey: 'mis.invoiceType' },
  { id: 'pre_invoice', labelKey: 'mis.quoteType' },
];

export default function ProductInvoices({ productId, productCode }) {
  const { t } = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [order, setOrder]     = useState('desc'); // 'desc' = newest first
  const [formOpen, setFormOpen] = useState(false);
  const [formDocType, setFormDocType] = useState('invoice');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({ method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/inventory/products/${productId}/invoices`,
        params: { docType: typeFilter, order } });
      setDocs(res.data.data || []);
    } catch (_) { setDocs([]); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx, axiosGlobal, productId, typeFilter, order]);

  useEffect(() => { if (can('mis:view')) load(); }, [load, can]);

  // backend is the real gate; without mis:view the call 403s — don't render at all
  if (!can('mis:view')) return null;

  const handlePdf = (doc) =>
    dispatch(downloadMisInvoicePdf({ authCtx, axiosGlobal, id: doc._id, docType: doc.docType, docNumber: doc.docNumber }));

  const openNewForm = (docType) => { setFormDocType(docType); setFormOpen(true); };

  const shown = expanded ? docs : docs.slice(0, PREVIEW_COUNT);

  return (
    <Box sx={{
      mt: 3, border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
      bgcolor: 'background.paper', px: 2.5, py: 2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 1, color: 'text.disabled' }}>
          {docs.length > 0
            ? t('inventory.invoicesContainingCount', { count: docs.length })
            : t('inventory.invoicesContaining')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {can('mis:invoice:create') && (
            <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => openNewForm('invoice')}
              sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '8px' }}>
              {t('inventory.newInvoice')}
            </Button>
          )}
          {can('mis:preinvoice:create') && (
            <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => openNewForm('pre_invoice')}
              sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '8px' }}>
              {t('inventory.newQuote')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter row — doc type tabs + inserted-date sort */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {TYPE_TABS.map((tab) => (
            <Button key={tab.id} size="small" onClick={() => setTypeFilter(tab.id)}
              variant={typeFilter === tab.id ? 'contained' : 'outlined'}
              sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '8px', minWidth: 0, px: 1.25 }}>
              {t(tab.labelKey)}
            </Button>
          ))}
        </Box>
        <Tooltip title={order === 'desc' ? t('inventory.sortNewestTip') : t('inventory.sortOldestTip')}>
          <Button size="small" onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            startIcon={order === 'desc' ? <ArrowDownwardIcon sx={{ fontSize: 13 }} /> : <ArrowUpwardIcon sx={{ fontSize: 13 }} />}
            sx={{ fontSize: '0.68rem', textTransform: 'none', color: 'text.secondary' }}>
            {order === 'desc' ? t('inventory.sortNewestShort') : t('inventory.sortOldestShort')}
          </Button>
        </Tooltip>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={42} sx={{ borderRadius: '10px' }} />
          ))}
        </Box>
      ) : docs.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.78rem', py: 1 }}>
          {t('inventory.noInvoicesForProduct')}
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {shown.map(doc => {
              const isInvoice = doc.docType === 'invoice';
              const status    = STATUS_META[doc.status] || STATUS_META.draft;
              const pdfKey    = isInvoice ? 'mis:invoice:pdf' : 'mis:preinvoice:pdf';
              return (
                <Box key={doc._id} onClick={() => setViewDoc(doc)}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, cursor: 'pointer',
                  px: 1.5, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: '10px',
                  '&:hover': { borderColor: 'text.disabled' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isInvoice
                      ? <ReceiptLongIcon  sx={{ fontSize: 15, color: 'text.disabled', flexShrink: 0 }} />
                      : <RequestQuoteIcon sx={{ fontSize: 15, color: 'text.disabled', flexShrink: 0 }} />}
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                      #{doc.docNumber}
                    </Typography>
                    <Box sx={{ px: 0.6, py: '1px', borderRadius: '5px', border: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: 0.5,
                        textTransform: 'uppercase', color: 'text.secondary' }}>
                        {isInvoice ? t('mis.invoiceType') : t('mis.quoteType')}
                      </Typography>
                    </Box>
                    <Box sx={{ px: 0.6, py: '1px', borderRadius: '5px', bgcolor: `${status.color}22`, flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: status.color }}>
                        {t(status.labelKey)}
                      </Typography>
                    </Box>
                    <Typography noWrap sx={{ fontSize: '0.72rem', color: 'text.secondary', flexGrow: 1, minWidth: 0 }}>
                      {doc.customerSnapshot?.name || ''}
                    </Typography>
                    <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', flexShrink: 0 }}>
                      {fmtDate(doc.issueDate)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                      {fmtMoney(doc.grandTotal)}
                      <Box component="span" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}> AED</Box>
                    </Typography>
                    {can(pdfKey) && (
                      <Tooltip title={t('mis.savePdf')}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handlePdf(doc); }}
                          sx={{ width: 24, height: 24, color: 'text.disabled' }}>
                          <PictureAsPdfIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  {doc.matchedCodes?.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', pl: 3 }}>
                      {doc.matchedCodes.map((code, i) => (
                        <Box key={i} sx={{ px: 0.6, py: '1px', borderRadius: '4px',
                          bgcolor: 'action.hover' }}>
                          <Typography sx={{ fontSize: '0.62rem', fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary' }}>
                            {code}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
          {docs.length > PREVIEW_COUNT && (
            <Button size="small" onClick={() => setExpanded(e => !e)}
              startIcon={expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
              sx={{ mt: 1, fontSize: '0.7rem', textTransform: 'none', color: 'text.disabled' }}>
              {expanded ? t('inventory.showLess') : t('inventory.showAllCount', { count: docs.length })}
            </Button>
          )}
        </>
      )}

      <InvoiceDetailDialog doc={viewDoc} open={Boolean(viewDoc)} onClose={() => setViewDoc(null)} />

      {/* New invoice/quote — defaults to this product (via a pre-filled line
          search), customer left blank; user can change either before saving */}
      <InvoiceForm
        open={formOpen}
        mode="new"
        docType={formDocType}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        preset={{ productSearch: productCode }}
      />
    </Box>
  );
}
