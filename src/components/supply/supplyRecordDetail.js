import { useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import {
  fetchSupplyRecord, fetchSupplyDealLetters, deleteSupplyRecord, deleteSupplyDealLetter,
  setMisInvoiceSupplyRecord,
} from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import SupplyRecordForm from './supplyRecordForm';
import DealLetterForm from './dealLetterForm';
import DealLetterDetail from './dealLetterDetail';
import LinkInvoiceDialog from './linkInvoiceDialog';
import CrossBranchRequestForm from '../mis/crossBranchRequestForm';
import InvoiceDetailDialog from '../mis/invoiceDetailDialog';
import PackingListForm from '../mis/packingLists/packingListForm';
import StorefrontIcon from '@mui/icons-material/Storefront';

const STAGE = {
  purchasing:    { color: '#64b5f6', labelKey: 'supply.statusPurchasing' },
  processing:    { color: '#ffb74d', labelKey: 'supply.statusProcessing' },
  final_product: { color: '#81c784', labelKey: 'supply.statusFinalProduct' },
};

// Mirrors invoiceCard.js's STATUS map so a linked document reads the same here
// as it does in MIS itself.
const DOC_STATUS = {
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

// The four kinds of document a supply record can carry. A request is an
// inter-branch quotation — one branch asking this one for stock.
const DOC_KINDS = {
  quote:       { labelKey: 'supply.docKindQuote',       filterKey: 'supply.docFilterQuotes',       Icon: RequestQuoteIcon,  color: '#64b5f6' },
  invoice:     { labelKey: 'supply.docKindInvoice',     filterKey: 'supply.docFilterInvoices',     Icon: ReceiptLongIcon,   color: '#81c784' },
  request:     { labelKey: 'supply.docKindRequest',     filterKey: 'supply.docFilterRequests',     Icon: StorefrontIcon,    color: '#ba68c8' },
  packingList: { labelKey: 'supply.docKindPackingList', filterKey: 'supply.docFilterPackingLists', Icon: LocalShippingIcon, color: '#ffb74d' },
};
const kindOf = (d) => (d.docType === 'invoice' ? 'invoice' : (d.tradeMode === 'interBranch' ? 'request' : 'quote'));
const PL_STATUS = {
  draft: { labelKey: 'mis.plStatusDraft', color: '#9e9e9e' },
  final: { labelKey: 'mis.plStatusFinal', color: '#81c784' },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '');
const fmtMoney = (n, c = 'AED') =>
  `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Small section header used throughout the detail panel.
function SectionHead({ label, T, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 1, color: T.TEXT_TER }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: T.BD }} />
      {children}
    </Box>
  );
}

// readOnly: this record belongs to a branch that merely SHARED its Supply.
// Everything is visible so the viewer can decide what to ask for, but nothing
// here is theirs to change — the only action offered is a stock request.
export default function SupplyRecordDetail({ recordId, onBack, T: TProp, readOnly = false, branchName = '' }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const history = useHistory();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  // Falls back to a local token set when rendered outside the new shell.
  const T = TProp || {
    APP_BG:   isDark ? '#060606' : theme.palette.background.default,
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const record = useSelector((s) => s.supplySelectedRecord);
  const loading = useSelector((s) => s.supplySelectedRecordLoading);
  const dealLetters = useSelector((s) => s.supplyDealLetters);
  const dealLettersLoading = useSelector((s) => s.supplyDealLettersLoading);
  const refreshKey = useSelector((s) => s.supplyRefreshKey);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [newDealLetterOpen, setNewDealLetterOpen] = useState(false);
  const [openDealLetterId, setOpenDealLetterId] = useState(null);
  const [dealLetterDeleteTarget, setDealLetterDeleteTarget] = useState(null);

  // Everything raised against this record — quotations, invoices, requests and
  // packing lists (reverse lookup — local state, not Redux, same pattern as the
  // other reverse-lookup panels). A visitor from another branch only gets back
  // the requests their own branches sent (enforced server-side).
  const [documents, setDocuments] = useState([]);
  const [packingLists, setPackingLists] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docFilter, setDocFilter] = useState('all');
  const [addDocAnchor, setAddDocAnchor] = useState(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);   // cross-branch stock request
  const [viewDoc, setViewDoc] = useState(null);            // quotation / invoice / request, opened in place
  const [plFormOpen, setPlFormOpen] = useState(false);

  const loadLinkedDocs = useCallback(async () => {
    if (!recordId) return;
    setDocsLoading(true);
    try {
      const res = await authCtx.jwtInst({ method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/supply/records/${recordId}/documents` });
      setDocuments(res.data?.data?.documents || []);
      setPackingLists(res.data?.data?.packingLists || []);
    } catch (_) {
      setDocuments([]); setPackingLists([]);
    } finally {
      setDocsLoading(false);
    }
  }, [authCtx, axiosGlobal, recordId]);

  useEffect(() => {
    if (!recordId) return;
    dispatch(fetchSupplyRecord({ authCtx, axiosGlobal, id: recordId }));
    dispatch(fetchSupplyDealLetters({ authCtx, axiosGlobal, supplyId: recordId }));
    loadLinkedDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, refreshKey]);

  const handleDeleteRecord = async () => {
    await dispatch(deleteSupplyRecord({ authCtx, axiosGlobal, id: recordId })).unwrap();
    setDeleteConfirm(false);
    onBack();
  };

  const handleDeleteDealLetter = async () => {
    await dispatch(deleteSupplyDealLetter({ authCtx, axiosGlobal, id: dealLetterDeleteTarget, supplyId: recordId })).unwrap();
    setDealLetterDeleteTarget(null);
  };

  const handleUnlink = async () => {
    const id = unlinkTarget;
    setUnlinkTarget(null);
    await dispatch(setMisInvoiceSupplyRecord({ authCtx, axiosGlobal, id, supplyRecordId: null })).unwrap();
    loadLinkedDocs();
  };

  // Creating a document FROM this record: hand MIS a deep link carrying the
  // supply record id (and the product code as a starting product search), so
  // the new doc is saved already linked.
  const createDoc = (docType) => {
    setAddDocAnchor(null);
    const qs = new URLSearchParams({
      newDoc: docType,
      supplyRecord: recordId,
      ...(record?.productCode ? { productSearch: record.productCode } : {}),
    });
    history.push(`/mis?${qs.toString()}`);
  };

  const openPackingList = (pl) => history.push(`/mis?openPackingList=${pl._id}`);

  if (loading && !record) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={20} /></Box>;
  }
  if (!record) return null;

  // What the Add menu offers depends on whose record this is. A visitor from
  // another branch can only ask for stock; the record's own branch raises the
  // paperwork — including packing lists, which are theirs alone to make.
  const canRequestHere = readOnly && can('mis:crossBranch:quote') && can('mis:preinvoice:create');
  const canQuote = !readOnly && can('mis:preinvoice:create');
  const canInvoice = !readOnly && can('mis:invoice:create');
  const canPackingList = !readOnly && can('mis:packingList:create');
  const canLinkExisting = !readOnly && (can('mis:invoice:edit') || can('mis:preinvoice:edit'));
  const canAddDoc = canRequestHere || canQuote || canInvoice || canPackingList || canLinkExisting;

  const counts = documents.reduce((acc, d) => { acc[kindOf(d)] += 1; return acc; },
    { quote: 0, invoice: 0, request: 0, packingList: packingLists.length });
  const totalDocs = documents.length + packingLists.length;
  const visibleDocs = docFilter === 'all' || docFilter === 'packingList'
    ? (docFilter === 'packingList' ? [] : documents)
    : documents.filter((d) => kindOf(d) === docFilter);
  const visiblePls = docFilter === 'all' || docFilter === 'packingList' ? packingLists : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 2, py: 1.25,
        borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <IconButton size="small" onClick={onBack} sx={{ mt: '-2px' }}>
          <ArrowBackIcon sx={{ fontSize: 18, color: T.TEXT_SEC }} />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
            <Box sx={{ fontFamily: 'monospace', fontSize: '0.66rem', fontWeight: 700, letterSpacing: 0.5,
              px: 0.75, py: '2px', borderRadius: '5px',
              bgcolor: T.CTRL_BG, color: T.TEXT_PRI, border: `1px solid ${T.BD}` }}>
              {record.productCode || '—'}
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI, minWidth: 0 }} noWrap>
              {record.title}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.73rem', color: T.TEXT_SEC }} noWrap>
            {record.code && (
              <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#64b5f6', mr: 0.75 }}>
                {record.code}
              </Box>
            )}
            {record.productName}
            {record.date ? ` · ${fmtDate(record.date)}` : ''}
          </Typography>
        </Box>
        {/* On a shared branch the one thing you CAN do is ask them for stock. */}
        {readOnly && can('mis:crossBranch:quote') && can('mis:preinvoice:create') && (
          <Tooltip title={t('supply.requestRecordTip', { branch: branchName || t('inventory.thisBranch') })}>
            <Button size="small" variant="contained"
              startIcon={<StorefrontIcon sx={{ fontSize: 14 }} />}
              onClick={() => setRequestOpen(true)}
              sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '8px', mr: 0.5 }}>
              {t('mis.reqButton')}
            </Button>
          </Tooltip>
        )}
        {!readOnly && can('supply:record:edit') && (
          <Tooltip title={t('common.edit')}>
            <IconButton size="small" onClick={() => setEditOpen(true)}>
              <EditIcon sx={{ fontSize: 16, color: T.TEXT_SEC }} />
            </IconButton>
          </Tooltip>
        )}
        {!readOnly && can('supply:record:delete') && (
          <Tooltip title={t('common.delete')}>
            <IconButton size="small" onClick={() => setDeleteConfirm(true)}>
              <DeleteOutlineIcon sx={{ fontSize: 16, color: T.TEXT_SEC }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ── Scrollable body ── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 2 }}>

        {record.notes && (
          <Box sx={{ mb: 2.5, p: 1.25, borderRadius: '9px', bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
            <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, whiteSpace: 'pre-wrap' }}>
              {record.notes}
            </Typography>
          </Box>
        )}

        {/* ── Deal letters ── */}
        <SectionHead label={t('supply.dealLettersLabel')} T={T}>
          {!readOnly && can('supply:dealLetter:create') && (
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 13 }} />}
              onClick={() => setNewDealLetterOpen(true)}
              sx={{ fontSize: '0.68rem', textTransform: 'none', minWidth: 0, py: 0.15, color: T.TEXT_SEC }}>
              {t('supply.newDealLetter')}
            </Button>
          )}
        </SectionHead>

        {dealLettersLoading && dealLetters.length === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}><CircularProgress size={16} /></Box>
        ) : dealLetters.length === 0 ? (
          <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER, mb: 3 }}>
            {t('supply.noDealLettersYet')}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 3 }}>
            {dealLetters.map((dl) => {
              const st = STAGE[dl.status] || { color: T.TEXT_SEC, labelKey: dl.status };
              const lines = dl.varietyLines || [];
              const forecast = lines.reduce((a, l) => a + (Number(l.forecastQty) || 0), 0);
              const final = lines.reduce((a, l) => a + (Number(l.finalQty) || 0), 0);
              return (
                <Box key={dl._id} onClick={() => setOpenDealLetterId(dl._id)}
                  sx={{ px: 1.25, py: 1, borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${T.BD}`, bgcolor: T.CTRL_BG,
                    '&:hover': { borderColor: T.BD2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4,
                      px: 0.6, py: '1px', borderRadius: '4px', bgcolor: `${st.color}1a`, flexShrink: 0 }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: st.color }} />
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: st.color }}>
                        {t(st.labelKey)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: T.TEXT_PRI, flex: 1, minWidth: 0 }} noWrap>
                      {dl.coupeSeller?.name || t('supply.unnamedSeller')}
                    </Typography>
                    {!readOnly && can('supply:dealLetter:delete') && (
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDealLetterDeleteTarget(dl._id); }}>
                        <DeleteOutlineIcon sx={{ fontSize: 14, color: T.TEXT_TER }} />
                      </IconButton>
                    )}
                    <ChevronRightIcon sx={{ fontSize: 15, color: T.TEXT_TER }} />
                  </Box>
                  {dl.coupeSpec && (
                    <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC, mb: 0.4 }} noWrap>
                      {dl.coupeSpec}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>
                      {t('supply.varietiesCount', { count: lines.length })}
                    </Typography>
                    {forecast > 0 && (
                      <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>
                        {t('supply.forecastShort')} {forecast.toLocaleString()}
                      </Typography>
                    )}
                    {final > 0 && (
                      <Typography sx={{ fontSize: '0.66rem', color: '#81c784' }}>
                        {t('supply.finalShort')} {final.toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {/* ── Documents: quotations, invoices, requests, packing lists ── */}
        <SectionHead label={readOnly ? t('supply.yourRequestsLabel') : t('supply.documentsLabel')} T={T}>
          {canAddDoc && (
            <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={(e) => setAddDocAnchor(e.currentTarget)}
              sx={{ fontSize: '0.7rem', textTransform: 'none', minWidth: 0, height: 26, borderRadius: '7px',
                color: T.TEXT_PRI, borderColor: T.BD2 }}>
              {readOnly ? t('supply.newRequest') : t('supply.addDocument')}
            </Button>
          )}
        </SectionHead>

        {/* Kind filter — only worth showing when there's more than one kind. */}
        {!readOnly && totalDocs > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1, overflowX: 'auto', pb: 0.25,
            '&::-webkit-scrollbar': { display: 'none' } }}>
            {[['all', t('common.all'), totalDocs],
              ...Object.entries(DOC_KINDS).map(([k, m]) => [k, t(m.filterKey), counts[k]])]
              .filter(([k, , n]) => k === 'all' || n > 0)
              .map(([k, label, n]) => {
                const sel = docFilter === k;
                return (
                  <Box key={k} onClick={() => setDocFilter(k)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, height: 26, flexShrink: 0,
                      borderRadius: '7px', cursor: 'pointer', userSelect: 'none',
                      border: `1px solid ${sel ? T.BD2 : T.BD}`, bgcolor: sel ? T.CTRL_BG : 'transparent' }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: sel ? 700 : 500,
                      color: sel ? T.TEXT_PRI : T.TEXT_SEC }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.64rem', color: T.TEXT_TER, fontVariantNumeric: 'tabular-nums' }}>
                      {n}
                    </Typography>
                  </Box>
                );
              })}
          </Box>
        )}

        {docsLoading && totalDocs === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}><CircularProgress size={16} /></Box>
        ) : totalDocs === 0 ? (
          <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER }}>
            {readOnly ? t('supply.noRequestsHere') : t('supply.noDocuments')}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {visibleDocs.map((doc) => {
              const kind = DOC_KINDS[kindOf(doc)];
              const st = DOC_STATUS[doc.status] || { color: T.TEXT_SEC, labelKey: null };
              const party = doc.tradeMode === 'interBranch'
                ? t('supply.docFromBranch', { branch: doc.requestingBranchSnapshot?.name || '—' })
                : (doc.customerSnapshot?.name || '—');
              return (
                <Box key={doc._id} onClick={() => setViewDoc(doc)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.1, px: 1.25, py: 0.9,
                    borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${T.BD}`, bgcolor: T.CTRL_BG,
                    '&:hover': { borderColor: T.BD2 } }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${kind.color}1a` }}>
                    <kind.Icon sx={{ fontSize: 15, color: kind.color }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI }}>
                        {t(kind.labelKey)} #{doc.docNumber}
                      </Typography>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: st.color,
                        px: 0.5, py: '1px', borderRadius: '4px', bgcolor: `${st.color}1a` }}>
                        {st.labelKey ? t(st.labelKey) : doc.status}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }} noWrap>
                      {party}{doc.issueDate ? ` · ${fmtDate(doc.issueDate)}` : ''}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0,
                    display: { xs: 'none', sm: 'block' } }}>
                    {fmtMoney(doc.grandTotal, doc.currency)}
                  </Typography>
                  {!readOnly && kindOf(doc) !== 'request' && canLinkExisting && (
                    <Tooltip title={t('supply.unlinkDoc')}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setUnlinkTarget(doc._id); }}>
                        <LinkOffIcon sx={{ fontSize: 14, color: T.TEXT_TER }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  <ChevronRightIcon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />
                </Box>
              );
            })}

            {visiblePls.map((pl) => {
              const kind = DOC_KINDS.packingList;
              const st = PL_STATUS[pl.status] || PL_STATUS.draft;
              const totals = pl.totals || {};
              return (
                <Box key={pl._id} onClick={() => openPackingList(pl)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.1, px: 1.25, py: 0.9,
                    borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${T.BD}`, bgcolor: T.CTRL_BG,
                    '&:hover': { borderColor: T.BD2 } }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${kind.color}1a` }}>
                    <kind.Icon sx={{ fontSize: 15, color: kind.color }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI }}>
                        {t(kind.labelKey)} #{pl.docNumber}
                      </Typography>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: st.color,
                        px: 0.5, py: '1px', borderRadius: '4px', bgcolor: `${st.color}1a` }}>
                        {t(st.labelKey)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }} noWrap>
                      {t('supply.plSummary', { pallets: totals.totalPallets || 0, sqm: Number(totals.totalSqm || 0).toFixed(2) })}
                      {pl.insertDate ? ` · ${fmtDate(pl.insertDate)}` : ''}
                    </Typography>
                  </Box>
                  <OpenInNewIcon sx={{ fontSize: 14, color: T.TEXT_TER, flexShrink: 0 }} />
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Add menu — what's offered depends on whose record this is (see canAddDoc) */}
      <Menu anchorEl={addDocAnchor} open={Boolean(addDocAnchor)} onClose={() => setAddDocAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { borderRadius: '10px', minWidth: 230 } }}>
        {canRequestHere && (
          <MenuItem onClick={() => { setAddDocAnchor(null); setRequestOpen(true); }}>
            <ListItemIcon><StorefrontIcon sx={{ fontSize: 18, color: DOC_KINDS.request.color }} /></ListItemIcon>
            <ListItemText primary={t('supply.newRequest')}
              secondary={t('supply.newRequestHint', { branch: branchName || t('inventory.thisBranch') })}
              primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: '0.68rem' }} />
          </MenuItem>
        )}
        {canQuote && (
          <MenuItem onClick={() => createDoc('pre_invoice')}>
            <ListItemIcon><RequestQuoteIcon sx={{ fontSize: 18, color: DOC_KINDS.quote.color }} /></ListItemIcon>
            <ListItemText primary={t('supply.createQuotation')} primaryTypographyProps={{ fontSize: '0.8rem' }} />
          </MenuItem>
        )}
        {canInvoice && (
          <MenuItem onClick={() => createDoc('invoice')}>
            <ListItemIcon><ReceiptLongIcon sx={{ fontSize: 18, color: DOC_KINDS.invoice.color }} /></ListItemIcon>
            <ListItemText primary={t('supply.createInvoice')} primaryTypographyProps={{ fontSize: '0.8rem' }} />
          </MenuItem>
        )}
        {canPackingList && (
          <MenuItem onClick={() => { setAddDocAnchor(null); setPlFormOpen(true); }}>
            <ListItemIcon><LocalShippingIcon sx={{ fontSize: 18, color: DOC_KINDS.packingList.color }} /></ListItemIcon>
            <ListItemText primary={t('supply.createPackingList')} primaryTypographyProps={{ fontSize: '0.8rem' }} />
          </MenuItem>
        )}
        {canLinkExisting && (canQuote || canInvoice || canPackingList) && <Divider />}
        {canLinkExisting && (
          <MenuItem onClick={() => { setAddDocAnchor(null); setLinkDialogOpen(true); }}>
            <ListItemIcon><LinkIcon sx={{ fontSize: 18, color: T.TEXT_SEC }} /></ListItemIcon>
            <ListItemText primary={t('supply.linkExistingDoc')} primaryTypographyProps={{ fontSize: '0.8rem' }} />
          </MenuItem>
        )}
      </Menu>

      <LinkInvoiceDialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)}
        supplyRecordId={recordId} onLinked={loadLinkedDocs} />

      {/* Branch comes from the record being viewed — nothing to pick. The
          search starts on this record's product, so its lots are listed. */}
      <CrossBranchRequestForm
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSaved={loadLinkedDocs}
        preset={{ branchId: record.branchId, branchName, source: 'supply',
          search: record.productCode || '', supplyRecordId: record._id }} />

      {/* A quotation / invoice / request opens right here — edit and convert work in place too. */}
      <InvoiceDetailDialog doc={viewDoc} open={Boolean(viewDoc)}
        onClose={() => setViewDoc(null)} onChanged={loadLinkedDocs} />

      <PackingListForm open={plFormOpen}
        onClose={() => { setPlFormOpen(false); loadLinkedDocs(); }}
        preset={{ supplyRecordId: record._id,
          recordTitle: record.code ? `${record.code} · ${record.title}` : record.title,
          productCode: record.productCode }} />

      <SupplyRecordForm open={editOpen} onClose={() => setEditOpen(false)} record={record} />
      <DealLetterForm open={newDealLetterOpen} onClose={() => setNewDealLetterOpen(false)}
        supplyId={recordId} productId={record.productId} />

      <Dialog open={Boolean(openDealLetterId)} onClose={() => setOpenDealLetterId(null)}
        maxWidth="md" fullWidth fullScreen={isMob}>
        {openDealLetterId && (
          <DealLetterDetail dealLetterId={openDealLetterId} onClose={() => setOpenDealLetterId(null)}
            readOnly={readOnly} branchName={branchName} onRequested={loadLinkedDocs} />
        )}
      </Dialog>

      <ConfirmDialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} onConfirm={handleDeleteRecord}
        title={t('supply.deleteRecordTitle')} message={t('supply.deleteRecordMessage')} destructive
        confirmLabel={t('common.delete')} cancelLabel={t('common.cancel')} />

      <ConfirmDialog open={Boolean(dealLetterDeleteTarget)} onClose={() => setDealLetterDeleteTarget(null)}
        onConfirm={handleDeleteDealLetter}
        title={t('supply.deleteDealLetterTitle')} message={t('supply.deleteDealLetterMessage')} destructive
        confirmLabel={t('common.delete')} cancelLabel={t('common.cancel')} />

      <ConfirmDialog open={Boolean(unlinkTarget)} onClose={() => setUnlinkTarget(null)} onConfirm={handleUnlink}
        title={t('supply.unlinkDocTitle')} message={t('supply.unlinkDocMessage')}
        confirmLabel={t('supply.unlinkDoc')} cancelLabel={t('common.cancel')} />
    </Box>
  );
}
