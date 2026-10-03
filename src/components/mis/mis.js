import { useState, useEffect, useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useLocation, useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, useMediaQuery } from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';
import {
  fetchMisInvoices, deleteMisInvoice, downloadMisInvoicePdf, actions,
} from '../../store/store';

import InvoiceCard          from './invoiceCard';
import InvoiceDetail        from './invoiceDetail';
import InvoiceForm          from './invoiceForm';
import CrossBranchRequestForm from './crossBranchRequestForm';
import StorefrontIcon       from '@mui/icons-material/Storefront';
import AllInboxIcon         from '@mui/icons-material/AllInbox';
import SendToDialog         from './sendToDialog';
import DeleteInvoiceDialog  from './deleteInvoiceDialog';
import CompanyProfileDrawer from './settings/companyProfile';
import PackingListsSection  from './packingLists/packingListsSection';
import { useSidebarWidth } from '../../tools/hooks/useSidebarWidth';
import { useUnreadRecords } from '../../tools/hooks/useUnreadRecords';
import SidebarResizer from '../../tools/navs/sidebarResizer';
import InfiniteScrollSentinel from '../../tools/loader/infiniteScrollSentinel';
import PageSizeSelect        from '../../tools/inputs/pageSizeSelect';
import SectionTutorials      from '../tutorials/sectionTutorials';

// Phase 6 — MIS / Invoices master-detail page (Session 44).
// Tabs, in order: Quote · Invoice · Packing lists · Requests · All. Quote,
// Invoice, Requests and All are filters over ONE collection — a request is an
// inter-branch quotation (one branch asking another for stock), so Quote shows
// the customer quotations and Requests the inter-branch ones, both filtered
// server-side. Packing lists is its own sub-section and collection.
// Detail = invoiceDetail.js, new/edit/convert = invoiceForm.js (Drawer).

const STATUS_BY_TAB = {
  quote:   ['draft', 'sent', 'accepted', 'converted', 'expired'],
  invoice: ['draft', 'issued', 'paid', 'partially_paid', 'cancelled'],
  request: ['requested', 'draft', 'sent', 'accepted', 'converted', 'expired'],
  all:     ['requested', 'draft', 'sent', 'accepted', 'converted', 'expired', 'issued', 'paid', 'partially_paid', 'cancelled'],
};

// tab → list-route params (docType + tradeMode)
const TAB_PARAMS = {
  quote:   { docType: 'pre_invoice', tradeMode: 'customer' },
  invoice: { docType: 'invoice' },
  request: { docType: 'pre_invoice', tradeMode: 'interBranch' },
  all:     { docType: 'all' },
};

const SORT_OPTIONS = [
  { value: 'issueDate',   labelKey: 'mis.sortNewestFirst' },
  { value: '-issueDate',  labelKey: 'mis.sortOldestFirst' },
  { value: 'docNumber',   labelKey: 'mis.sortNumberHighLow' },
  { value: '-docNumber',  labelKey: 'mis.sortNumberLowHigh' },
  { value: 'grandTotal',  labelKey: 'mis.sortTotalHighLow' },
  { value: '-grandTotal', labelKey: 'mis.sortTotalLowHigh' },
];

const STATUS_LABEL_KEYS = {
  requested: 'mis.statusRequested',
  draft: 'mis.statusDraft', sent: 'mis.statusSent', accepted: 'mis.statusAccepted',
  converted: 'mis.statusConverted', expired: 'mis.statusExpired', issued: 'mis.statusIssued',
  paid: 'mis.statusPaid', partially_paid: 'mis.statusPartial', cancelled: 'mis.statusCancelled',
};

const DEFAULT_FILTER = { search: '', status: '', dateFrom: '', dateTo: '', sort: 'issueDate', createdBy: '' };

function useDebounce(value, delay) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

export default function Mis() {
  const { t } = useTranslation();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const isMob   = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const location    = useLocation();
  const history     = useHistory();
  const { can, scopeFor } = usePermissions();
  const { activeBranchId } = useBranch();
  const misScope = scopeFor('mis');
  const createdByDisabled = misScope === 'mine';

  const invoices   = useSelector(s => s.misInvoices);
  const total      = useSelector(s => s.misInvoicesTotal);
  const loading    = useSelector(s => s.misInvoicesLoading);
  const refreshKey = useSelector(s => s.misRefreshKey);

  // Flags an invoice/pre-invoice inserted by someone else since this user's
  // last visit to MIS as unread (dot + tinted row) — see useUnreadRecords.js.
  const { isUnread } = useUnreadRecords('mis');

  const [tab, setTab]                 = useState('all');            // 'quote' | 'invoice' | 'request' | 'all'
  // Session 72 (Phase 3) — which MIS sub-section is showing: the existing
  // invoice/pre-invoice master-detail, or the new standalone Packing Lists.
  const [misSection, setMisSection]   = useState('invoices');
  const [openPackingListId, setOpenPackingListId] = useState(null);
  const [filter, setFilter]           = useState(DEFAULT_FILTER);
  const [filterOpen, setFilterOpen]   = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(40);
  const [hasMore, setHasMore]         = useState(false);
  const [creators, setCreators]       = useState([]);
  const [mobileDetail, setMobileDetail] = useState(false);

  // Resizable master list, persisted per user (see useSidebarWidth).
  const { width: listWidth, setWidth: setListWidth, resetWidth: resetListWidth } =
    useSidebarWidth('misList', 400, { min: 260, max: 720 });
  const [listResizing, setListResizing] = useState(false);
  useEffect(() => {
    if (!listResizing) return;
    const stop = () => setListResizing(false);
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, [listResizing]);
  const [confirmDelete, setConfirmDelete]   = useState(null);   // doc pending delete
  const [assignDoc, setAssignDoc]           = useState(null);   // doc pending "Send to"
  const [settingsOpen, setSettingsOpen]     = useState(false);
  const [formOpen, setFormOpen]             = useState(false);
  const [formMode, setFormMode]             = useState('new');
  const [formDocType, setFormDocType]       = useState('invoice');
  const [formDoc, setFormDoc]               = useState(null);
  const [formPreset, setFormPreset]         = useState(null);   // Supply → new doc deep link
  const [requestOpen, setRequestOpen]       = useState(false);  // cross-branch stock request

  const debouncedSearch = useDebounce(filter.search, 350);

  const T = {
    APP_BG:   isDark ? '#060606' : theme.palette.background.default,
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const buildParams = useCallback((pg = 1) => {
    const sortVal = filter.sort || 'issueDate';
    const isDesc  = !sortVal.startsWith('-');
    const p = {
      page: pg, limit: pageSize,
      ...TAB_PARAMS[tab],
      sort: sortVal.replace(/^-/, ''),
      order: isDesc ? 'desc' : 'asc',
      branchId: activeBranchId,
    };
    if (debouncedSearch)  p.search     = debouncedSearch;
    if (filter.status)    p.status     = filter.status;
    if (filter.dateFrom)  p.dateFrom   = filter.dateFrom;
    if (filter.dateTo)    p.dateTo     = filter.dateTo;
    if (filter.createdBy && !createdByDisabled) p.createdBy = filter.createdBy;
    return p;
  }, [tab, filter, debouncedSearch, pageSize, createdByDisabled, activeBranchId]);

  const load = useCallback((pg = 1) => {
    dispatch(fetchMisInvoices({ authCtx, axiosGlobal, params: buildParams(pg) }));
    setPage(pg);
  }, [dispatch, authCtx, axiosGlobal, buildParams]);

  useEffect(() => {
    if (!activeBranchId) return;
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/mis/invoices/creators`,
      params: { branchId: activeBranchId } })
      .then(res => setCreators(res.data.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId]);

  useEffect(() => {
    if (!activeBranchId) return;
    setSelectedDoc(null);
    setMobileDetail(false);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debouncedSearch, filter.status, filter.dateFrom, filter.dateTo,
      filter.sort, filter.createdBy, pageSize, refreshKey, activeBranchId]);

  useEffect(() => {
    setHasMore(invoices.length < total);
  }, [invoices, total]);

  // Deep link from a notification click: /mis?open=<invoiceId> opens that doc's
  // detail (invoiceDetail re-fetches by id). The param is cleared afterwards so
  // it doesn't re-trigger on later re-renders.
  useEffect(() => {
    const openId = new URLSearchParams(location.search).get('open');
    if (!openId) return;
    setSelectedDoc({ _id: openId });
    if (isMob) setMobileDetail(true);
    history.replace('/mis');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Session 72 (Phase 3) — /mis?openPackingList=<id>, used by the invoice
  // detail's "Packing lists" reverse-lookup chips.
  useEffect(() => {
    const openPlId = new URLSearchParams(location.search).get('openPackingList');
    if (!openPlId) return;
    setMisSection('packingLists');
    setOpenPackingListId(openPlId);
    history.replace('/mis');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // /mis?newDoc=invoice|pre_invoice&supplyRecord=<id>&productSearch=<code>
  // Used by the Supply record detail's "New quotation / New invoice" buttons,
  // so the document is created already linked to that sourcing record.
  useEffect(() => {
    const params  = new URLSearchParams(location.search);
    const newDoc  = params.get('newDoc');
    if (newDoc !== 'invoice' && newDoc !== 'pre_invoice') return;
    const supplyRecordId = params.get('supplyRecord') || null;
    const productSearch  = params.get('productSearch') || '';
    setMisSection('invoices');
    setFormPreset(supplyRecordId || productSearch ? { supplyRecordId, productSearch } : null);
    setFormMode('new'); setFormDocType(newDoc); setFormDoc(null); setFormOpen(true);
    history.replace('/mis');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const setF = (key, value) => setFilter(f => ({ ...f, [key]: value }));
  const clearFilters = () => setFilter(DEFAULT_FILTER);

  const activeFilterCount = [filter.status, filter.dateFrom, filter.dateTo, filter.createdBy && !createdByDisabled].filter(Boolean).length;
  const visibleInvoices = invoices;
  // A status filter from another tab may not exist on this one.
  const switchTab = (id) => {
    setMisSection('invoices');
    setTab(id);
    setFilter((f) => (f.status && !STATUS_BY_TAB[id].includes(f.status) ? { ...f, status: '' } : f));
  };

  const handleSelect = (doc) => {
    setSelectedDoc(doc);
    if (isMob) setMobileDetail(true);
  };
  const handleDetailClose = () => {
    setSelectedDoc(null);
    if (isMob) setMobileDetail(false);
  };

  const loadMore = () => load(page + 1);

  const openNewForm = (docType) => {
    setFormPreset(null);
    setFormMode('new'); setFormDocType(docType); setFormDoc(null); setFormOpen(true);
  };
  const openEditForm = (doc) => {
    setFormMode('edit'); setFormDocType(doc.docType); setFormDoc(doc); setFormOpen(true);
  };

  const handlePdf = (doc, lang) =>
    dispatch(downloadMisInvoicePdf({ authCtx, axiosGlobal, id: doc._id, docType: doc.docType, docNumber: doc.docNumber, lang }));

  const handleDelete = async (restoreStock) => {
    const doc = confirmDelete;
    setConfirmDelete(null);
    if (!doc) return;
    await dispatch(deleteMisInvoice({ authCtx, axiosGlobal, id: doc._id, restoreStock }));
    if (selectedDoc && String(selectedDoc._id) === String(doc._id)) handleDetailClose();
  };

  // Converting opens the invoice form filled in from the quotation — the user
  // completes it (customer, address, prices, shipping…) and saving creates the
  // linked invoice. The form itself is the confirmation step.
  const openConvertForm = (doc) => {
    setFormPreset(null);
    setFormMode('convert'); setFormDocType('invoice'); setFormDoc(doc); setFormOpen(true);
  };

  return (
    // Pinned to the viewport (below the 60px top bar): the shell only sets a
    // MIN height, so without this the page grew to the list's length and the
    // whole window scrolled — the list and detail never scrolled on their own
    // and the detail's bottom bar (request status) fell below the fold.
    // dvh where supported, so a phone's browser chrome doesn't cut it off.
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)',
      '@supports (height: 100dvh)': { height: 'calc(100dvh - 60px)' },
      bgcolor: T.APP_BG, overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
        bgcolor: isDark ? '#0d0d0d' : 'background.paper',
        borderBottom: `1px solid ${T.BD}`, flexShrink: 0, flexWrap: 'wrap' }}>

        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
          {t('mis.pageTitle')}
        </Typography>

        {/* Tabs: Quote · Invoice · Packing lists · Requests · All */}
        <Box sx={{ display: 'flex', gap: 0.5, bgcolor: T.CTRL_BG, borderRadius: '9px',
          p: '3px', border: `1px solid ${T.BD}`, flexShrink: 0 }}>
          {[
            { id: 'quote',        Icon: RequestQuoteIcon,  labelKey: 'mis.quoteTab' },
            { id: 'invoice',      Icon: ReceiptLongIcon,   labelKey: 'mis.invoiceType' },
            { id: 'packingLists', Icon: LocalShippingIcon, labelKey: 'mis.plTabLabel' },
            { id: 'request',      Icon: StorefrontIcon,    labelKey: 'mis.requestsTab' },
            { id: 'all',          Icon: AllInboxIcon,      labelKey: 'mis.allTab' },
          ].map(({ id, Icon, labelKey }) => {
            const active = id === 'packingLists'
              ? misSection === 'packingLists'
              : misSection === 'invoices' && tab === id;
            return (
              <Tooltip key={id} title={isMob ? t(labelKey) : ''}>
                <Button size="small"
                  onClick={() => (id === 'packingLists' ? setMisSection('packingLists') : switchTab(id))}
                  sx={{ minWidth: 0, height: 24, px: isMob ? '6px' : 1, py: 0, borderRadius: '7px',
                    fontSize: '0.7rem', fontWeight: active ? 700 : 400, textTransform: 'none',
                    color: active ? T.TEXT_PRI : T.TEXT_TER,
                    bgcolor: active ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', color: T.TEXT_PRI },
                    gap: 0.5,
                  }}>
                  <Icon sx={{ fontSize: 14 }} />
                  {/* Phones: icons, plus the name of the tab you're on. */}
                  {(!isMob || active) && t(labelKey)}
                </Button>
              </Tooltip>
            );
          })}
        </Box>

        {/* Invoice-specific controls. The Packing Lists tab carries its own
            search / type filter / New button, so none of this applies there. */}
        {misSection === 'invoices' && (<>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexGrow: 1, maxWidth: 360,
          bgcolor: T.CTRL_BG, borderRadius: '8px', px: 1.25, py: '4px',
          border: `1px solid ${T.BD}` }}>
          <SearchIcon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />
          <InputBase value={filter.search} onChange={(e) => setF('search', e.target.value)}
            placeholder={t('mis.searchPlaceholder')}
            sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, flex: 1,
              '& input::placeholder': { color: T.TEXT_TER } }} />
          {filter.search && (
            <IconButton size="small" onClick={() => setF('search', '')} sx={{ p: 0, color: T.TEXT_TER }}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>

        <Tooltip title={t('common.filters')}>
          <IconButton size="small" onClick={() => setFilterOpen(!filterOpen)}
            sx={{ color: activeFilterCount > 0 ? T.TEXT_PRI : T.TEXT_TER,
              bgcolor: filterOpen ? T.CTRL_BG : 'transparent',
              border: `1px solid ${activeFilterCount > 0 ? T.BD2 : T.BD}`,
              borderRadius: '8px', width: 32, height: 32, position: 'relative' }}>
            <FilterListIcon sx={{ fontSize: 16 }} />
            {activeFilterCount > 0 && (
              <Box sx={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14,
                borderRadius: '50%', bgcolor: 'text.primary', display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.55rem', color: isDark ? '#000' : '#fff', fontWeight: 700 }}>
                  {activeFilterCount}
                </Typography>
              </Box>
            )}
          </IconButton>
        </Tooltip>

        {loading && <CircularProgress size={14} sx={{ color: T.TEXT_TER }} />}

        <Box sx={{ flexGrow: 1 }} />

        {(tab === 'invoice' || tab === 'all') && can('mis:invoice:create') && (
          <Tooltip title={isMob ? t('mis.newInvoice') : ''}>
            <Button variant="contained" size="small"
              onClick={() => openNewForm('invoice')}
              sx={{ fontSize: '0.75rem', height: 30, borderRadius: '8px',
                textTransform: 'none', fontWeight: 600, flexShrink: 0,
                minWidth: 'auto', px: isMob ? 1 : undefined }}>
              <AddIcon sx={{ fontSize: 17 }} />
              <Box component="span" sx={{ ml: 0.5 }}>{isMob ? t('mis.invoiceType') : t('mis.newInvoice')}</Box>
            </Button>
          </Tooltip>
        )}
        <SectionTutorials section="mis" tag="mis:invoice:create" />

        {(tab === 'quote' || tab === 'all') && can('mis:preinvoice:create') && (
          <Tooltip title={isMob ? t('mis.newQuote') : ''}>
            <Button variant={tab === 'quote' ? 'contained' : 'outlined'} size="small"
              onClick={() => openNewForm('pre_invoice')}
              sx={{ fontSize: '0.75rem', height: 30, borderRadius: '8px',
                textTransform: 'none', fontWeight: 600, flexShrink: 0,
                ...(tab === 'quote' ? {} : { color: T.TEXT_SEC, borderColor: T.BD2 }),
                minWidth: 'auto', px: isMob ? 1 : undefined }}>
              <AddIcon sx={{ fontSize: 17 }} />
              <Box component="span" sx={{ ml: 0.5 }}>{isMob ? t('mis.quoteTab') : t('mis.newQuote')}</Box>
            </Button>
          </Tooltip>
        )}
        {/* Requests tab — raise a new stock request: a trimmed quotation sent
            to a branch that has shared its Inventory/Supply with us. */}
        {tab === 'request' && can('mis:crossBranch:quote') && can('mis:preinvoice:create') && (
          <Tooltip title={isMob ? t('mis.newRequest') : ''}>
            <Button variant="contained" size="small"
              onClick={() => setRequestOpen(true)}
              sx={{ fontSize: '0.75rem', height: 30, borderRadius: '8px',
                textTransform: 'none', fontWeight: 600, flexShrink: 0,
                minWidth: 'auto', px: isMob ? 1 : undefined }}>
              <AddIcon sx={{ fontSize: 17 }} />
              <Box component="span" sx={{ ml: 0.5 }}>{isMob ? t('supply.docKindRequest') : t('mis.newRequest')}</Box>
            </Button>
          </Tooltip>
        )}

        <SectionTutorials section="mis" tag="mis:preinvoice:create" />
        </>)}

        {/* Keeps the settings gear right-aligned when the invoice controls above
            are hidden. */}
        {misSection !== 'invoices' && <Box sx={{ flexGrow: 1 }} />}

        {can('mis:settings:edit') && (
          <Tooltip title={t('mis.templateSettingsTitle')}>
            <IconButton size="small" onClick={() => setSettingsOpen(true)}
              sx={{ color: T.TEXT_TER, border: `1px solid ${T.BD}`,
                borderRadius: '8px', width: 30, height: 30, flexShrink: 0 }}>
              <SettingsIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ borderColor: T.BD }} />

      {misSection === 'packingLists' ? (
        <PackingListsSection openId={openPackingListId} onOpenIdConsumed={() => setOpenPackingListId(null)} />
      ) : (
      <>
      {/* ── Main content ── */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

        {/* ── List panel ── */}
        {(!isMob || !mobileDetail) && (
          <Box sx={{
            width: isMob ? '100%' : (selectedDoc ? listWidth : '100%'),
            flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            borderRight: (!isMob && selectedDoc) ? `1px solid ${T.BD}` : 'none',
            bgcolor: T.PANEL_BG,
            overflow: 'hidden',
            position: 'relative',
            transition: listResizing ? 'none' : 'width 0.2s',
          }}>

            {!isMob && selectedDoc && (
              <SidebarResizer width={listWidth} side="right"
                onResize={(w) => { setListResizing(true); setListWidth(w); }}
                onDoubleClick={resetListWidth} />
            )}

            {/* List header row */}
            <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
              borderBottom: `1px solid ${T.BD}` }}>
              <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
                {total > 0 ? t('mis.documentsCount', { count: total }) : t('mis.noDocuments')}
              </Typography>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <PageSizeSelect value={pageSize} onChange={setPageSize}
                  sx={{ height: 26, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
                    '& .MuiSelect-select': { color: T.TEXT_TER }, '& .MuiSvgIcon-root': { color: T.TEXT_TER } }} />
                <Select value={filter.sort} size="small"
                  onChange={(e) => setF('sort', e.target.value)}
                  sx={{ fontSize: '0.72rem', height: 26, color: T.TEXT_TER,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
                    '& .MuiSvgIcon-root': { color: T.TEXT_TER } }}>
                  {SORT_OPTIONS.map(o => (
                    <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.75rem' }}>
                      {t(o.labelKey)}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>

            {/* Cards */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 0.75 }}>
              {loading && invoices.length === 0 ? (
                <Box sx={{ px: 1, py: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Box key={i} sx={{ borderRadius: '12px', border: `1px solid ${T.BD}`, p: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                        <Skeleton variant="text" width="30%" height={18} />
                        <Skeleton variant="rectangular" width={50} height={16} sx={{ borderRadius: '4px' }} />
                      </Box>
                      <Skeleton variant="text" width="60%" height={14} />
                    </Box>
                  ))}
                </Box>
              ) : visibleInvoices.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', py: 8, px: 3, textAlign: 'center' }}>
                  <ReceiptLongIcon sx={{ fontSize: 48, color: T.TEXT_TER, mb: 1.5 }} />
                  <Typography sx={{ fontSize: '0.875rem', color: T.TEXT_SEC, fontWeight: 600, mb: 0.5 }}>
                    {activeFilterCount > 0 || filter.search
                      ? t('mis.noDocumentsMatchFilters')
                      : tab === 'request' ? t('mis.noRequestsYet') : t('mis.noInvoicesYet')}
                  </Typography>
                  {(activeFilterCount > 0 || filter.search) && (
                    <Button size="small" onClick={clearFilters}
                      sx={{ mt: 1.5, fontSize: '0.75rem', textTransform: 'none', color: T.TEXT_TER }}>
                      {t('mis.clearFilters')}
                    </Button>
                  )}
                </Box>
              ) : (
                <>
                  {visibleInvoices.map(doc => (
                    <InvoiceCard key={doc._id} doc={doc}
                      unread={isUnread(doc)}
                      selected={selectedDoc && String(doc._id) === String(selectedDoc._id)}
                      onSelect={handleSelect}
                      onEdit={openEditForm}
                      onPdf={handlePdf}
                      onConvert={openConvertForm}
                      onDelete={(d) => setConfirmDelete(d)}
                      onAssign={(d) => setAssignDoc(d)}
                    />
                  ))}
                  <InfiniteScrollSentinel onIntersect={loadMore} hasMore={hasMore} loading={loading} />
                </>
              )}
            </Box>
          </Box>
        )}

        {/* ── Detail panel (invoiceDetail.js — Session 45) ── */}
        {selectedDoc && (!isMob || mobileDetail) && (
          <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative', bgcolor: T.PANEL_BG }}>
            <InvoiceDetail
              onBack={isMob ? handleDetailClose : undefined}
              key={selectedDoc._id}
              doc={selectedDoc}
              onClose={handleDetailClose}
              onEdit={openEditForm}
              onPdf={handlePdf}
              onConvert={openConvertForm}
              onDelete={(d) => setConfirmDelete(d)}
            />
          </Box>
        )}

        {/* Desktop empty detail placeholder */}
        {!selectedDoc && !isMob && invoices.length > 0 && (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center',
            justifyContent: 'center', bgcolor: T.APP_BG }}>
            <Box sx={{ textAlign: 'center' }}>
              <ReceiptLongIcon sx={{ fontSize: 40, color: T.TEXT_TER, mb: 1 }} />
              <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
                {t('mis.selectDocumentPrompt')}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Filter Drawer ── */}
      <Drawer anchor="right" open={filterOpen} onClose={() => setFilterOpen(false)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 320 },
          bgcolor: T.PANEL_BG, borderLeft: `1px solid ${T.BD}` } }}>

        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5,
          borderBottom: `1px solid ${T.BD}` }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
            {t('common.filters')}
          </Typography>
          <IconButton size="small" onClick={() => setFilterOpen(false)} sx={{ color: T.TEXT_TER }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto' }}>

          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: '0.78rem' }}>{t('common.status')}</InputLabel>
            <Select value={filter.status} onChange={(e) => setF('status', e.target.value)} label={t('common.status')}
              sx={{ fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }}>
              <MenuItem value=""><em>{t('common.all')}</em></MenuItem>
              {STATUS_BY_TAB[tab].map(s => (
                <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>
                  {t(STATUS_LABEL_KEYS[s] || s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField size="small" label={t('mis.fromDateLabel')} type="date" value={filter.dateFrom}
            onChange={(e) => setF('dateFrom', e.target.value)}
            InputLabelProps={{ shrink: true, style: { fontSize: '0.78rem' } }}
            inputProps={{ style: { fontSize: '0.8rem' } }}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }} />

          <TextField size="small" label={t('mis.toDateLabel')} type="date" value={filter.dateTo}
            onChange={(e) => setF('dateTo', e.target.value)}
            InputLabelProps={{ shrink: true, style: { fontSize: '0.78rem' } }}
            inputProps={{ style: { fontSize: '0.8rem' } }}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }} />

          <FormControl size="small" fullWidth disabled={createdByDisabled}>
            <InputLabel sx={{ fontSize: '0.78rem' }}>{t('common.createdBy')}</InputLabel>
            <Select value={createdByDisabled ? '' : filter.createdBy} onChange={(e) => setF('createdBy', e.target.value)} label={t('common.createdBy')}
              sx={{ fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }}>
              <MenuItem value=""><em>{t('common.anyone')}</em></MenuItem>
              {creators.map(c => (
                <MenuItem key={c._id} value={c._id} sx={{ fontSize: '0.8rem' }}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {createdByDisabled && (
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
              {t('mis.scopeDisabledNote')}
            </Typography>
          )}

          {activeFilterCount > 0 && (
            <Button size="small" onClick={clearFilters}
              sx={{ fontSize: '0.75rem', textTransform: 'none', color: T.TEXT_TER, alignSelf: 'flex-start' }}>
              {t('mis.clearAll')}
            </Button>
          )}
        </Box>
      </Drawer>

      {/* ── Confirm dialogs ── */}
      <DeleteInvoiceDialog
        doc={confirmDelete}
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />

      {/* ── Send to — assign a document to one or more users (card menu) ── */}
      <SendToDialog
        doc={assignDoc}
        open={Boolean(assignDoc)}
        onClose={() => setAssignDoc(null)}
        onDone={(updated) => {
          setAssignDoc(null);
          dispatch(actions.misInvUpsert(updated));
          if (selectedDoc && String(selectedDoc._id) === String(updated._id)) {
            setSelectedDoc(updated);
          }
        }}
      />

      {/* ── New / Edit Drawer form ── */}
      <InvoiceForm
        open={formOpen}
        mode={formMode}
        docType={formDocType}
        doc={formDoc}
        preset={formPreset}
        onClose={() => { setFormOpen(false); setFormPreset(null); }}
        onSaved={() => { if (formMode === 'edit' || formMode === 'convert') setSelectedDoc(null); }}
      />

      <CrossBranchRequestForm
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
      />
      </>
      )}

      {/* ── Template settings (companyProfile — admin) — always mounted,
          regardless of which section (Invoices/Packing Lists) is active ── */}
      <CompanyProfileDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}
