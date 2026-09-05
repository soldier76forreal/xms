import { useState, useEffect, useCallback, useContext } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import LabelIcon from '@mui/icons-material/Label';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { actions, fetchCrmCustomers } from '../../store/store';

import CustomerCard          from './customerCard';
import CustomerDetail        from './customerDetail';
import CustomerForm          from './customerForm';
import { useSidebarWidth } from '../../tools/hooks/useSidebarWidth';
import SidebarResizer from '../../tools/navs/sidebarResizer';
import { useUnreadRecords } from '../../tools/hooks/useUnreadRecords';
import MyDesk                from './myDesk';
import AssignCustomersDialog from './assignCustomersDialog';
import ConfirmDialog         from '../../tools/modal/confirmDialog';
import InfiniteScrollSentinel from '../../tools/loader/infiniteScrollSentinel';
import PageSizeSelect        from '../../tools/inputs/pageSizeSelect';
import SectionTutorials      from '../tutorials/sectionTutorials';
import COUNTRIES             from './util/countryData';

import TableRowsIcon from '@mui/icons-material/TableRows';
import DashboardIcon from '@mui/icons-material/Dashboard';

const CHANNEL_OPTIONS = ['whatsApp', 'phone', 'email', 'telegram', 'instagram'];
const STATUS_OPTIONS  = ['new', 'active', 'follow_up', 'won', 'lost'];
const STATUS_KEY = {
  new: 'statusNew', active: 'statusActive', follow_up: 'statusFollowUp', won: 'statusWon', lost: 'statusLost',
};

// Labels translated at render time via t(`crm.${key}`) — bare values here since
// this is module scope, outside any component/hook.
const SORT_OPTIONS = [
  { value: 'insertDate',  key: 'sortNewestFirst' },
  { value: '-insertDate', key: 'sortOldestFirst' },
  { value: 'lastCallAt',  key: 'sortLastCallNewest' },
  { value: '-lastCallAt', key: 'sortLastCallOldest' },
];

const DEFAULT_FILTER = {
  search: '', type: '', country: '', channels: [], status: '', tags: '',
  sort: 'insertDate', dateFrom: '', dateTo: '', createdBy: '',
};

function useDebounce(value, delay) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

export default function Crm() {
  const { t }   = useTranslation();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const isMob   = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch    = useDispatch();
  const location    = useLocation();
  const history     = useHistory();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can, scopeFor } = usePermissions();
  const currentUserId = authCtx.decode?.id || authCtx.decode?._id;
  const crmScope = scopeFor('crm');
  const createdByDisabled = crmScope === 'mine';

  const customers  = useSelector(s => s.crmCustomers);
  const total      = useSelector(s => s.crmTotal);
  const loading    = useSelector(s => s.crmLoading);
  const refreshKey = useSelector(s => s.crmRefreshKey);

  // Flags a customer inserted by someone else since this user's last visit
  // to CRM as unread (dot + tinted row) — see useUnreadRecords.js.
  const { isUnread } = useUnreadRecords('crm');

  const [view, setView]               = useState('customers'); // 'customers' | 'myDesk'
  const [filter, setFilter]           = useState(DEFAULT_FILTER);
  const [filterOpen, setFilterOpen]   = useState(false);
  const [formOpen, setFormOpen]       = useState(false);
  const [formMode, setFormMode]       = useState('new');
  const [formCustomer, setFormCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [focusTab, setFocusTab]       = useState(0);   // which CustomerDetail tab to open on (0=Details,1=Communication,2=Requests)
  const [checkedIds, setCheckedIds]   = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(40);
  const [hasMore, setHasMore]         = useState(false);
  const [creators, setCreators]       = useState([]);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [assignOpen, setAssignOpen]       = useState(false);

  // Resizable master list, persisted per user (see useSidebarWidth).
  const { width: listWidth, setWidth: setListWidth, resetWidth: resetListWidth } =
    useSidebarWidth('crmList', 380, { min: 260, max: 720 });
  const [listResizing, setListResizing] = useState(false);
  useEffect(() => {
    if (!listResizing) return;
    const stop = () => setListResizing(false);
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, [listResizing]);
  const [addingToDesk, setAddingToDesk]   = useState(false);
  const [bulkDeleting, setBulkDeleting]   = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
    // sort values: 'insertDate' → sort=insertDate&order=desc, '-insertDate' → sort=insertDate&order=asc
    const sortVal = filter.sort || 'insertDate';
    const isDesc  = !sortVal.startsWith('-');
    const p = {
      page: pg, limit: pageSize,
      sort: sortVal.replace(/^-/, ''),
      order: isDesc ? 'desc' : 'asc',
    };
    if (debouncedSearch)        p.search     = debouncedSearch;
    if (filter.type)            p.type       = filter.type;
    if (filter.country)         p.country    = filter.country;
    if (filter.channels.length) p.channels   = filter.channels.join(',');
    if (filter.status)          p.status     = filter.status;
    if (filter.tags)            p.tags       = filter.tags;
    if (filter.dateFrom)        p.dateFrom   = filter.dateFrom;
    if (filter.dateTo)          p.dateTo     = filter.dateTo;
    if (filter.createdBy && !createdByDisabled) p.createdBy = filter.createdBy;
    return p;
  }, [filter, debouncedSearch, pageSize, createdByDisabled]);

  useEffect(() => {
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/crm/customers/creators` })
      .then(res => setCreators(res.data.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback((pg = 1) => {
    const params = buildParams(pg);
    dispatch(fetchCrmCustomers({ authCtx, axiosGlobal, params }));
    setPage(pg);
  }, [dispatch, authCtx, axiosGlobal, buildParams]);

  useEffect(() => {
    setCheckedIds(new Set());
    setSelectedCustomer(null);
    setMobileDetail(false);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter.type, filter.country, filter.channels.join(','),
      filter.status, filter.tags, filter.dateFrom, filter.dateTo, filter.sort,
      filter.createdBy, pageSize, refreshKey]);

  useEffect(() => {
    setHasMore(customers.length < total);
  }, [customers, total]);

  // Deep link from a notification click or a "copy link" short link:
  // /crm?open=<customerId> opens that customer's detail (customerDetail
  // self-fetches the full doc by id). Cleared afterwards so it doesn't
  // re-trigger on later re-renders.
  useEffect(() => {
    const openId = new URLSearchParams(location.search).get('open');
    if (!openId) return;
    setSelectedCustomer({ _id: openId });
    setFocusTab(0);
    if (isMob) setMobileDetail(true);
    history.replace('/crm');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const setF = (key, value) => setFilter(f => ({ ...f, [key]: value }));

  const toggleChannel = (ch) =>
    setFilter(f => ({
      ...f,
      channels: f.channels.includes(ch)
        ? f.channels.filter(c => c !== ch)
        : [...f.channels, ch],
    }));

  const clearFilters = () => setFilter(DEFAULT_FILTER);

  const activeFilterCount = [
    filter.type, filter.country, filter.channels.length > 0,
    filter.status, filter.tags, filter.dateFrom, filter.dateTo,
    filter.createdBy && !createdByDisabled,
  ].filter(Boolean).length;

  const handleSelect = (customer, tab = 0) => {
    setSelectedCustomer(customer);
    setFocusTab(tab);
    if (isMob) setMobileDetail(true);
  };

  const handleDetailClose = () => {
    setSelectedCustomer(null);
    if (isMob) setMobileDetail(false);
  };

  const handleCheck = (id, checked) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleCheckAll = (checked) => {
    if (checked) setCheckedIds(new Set(customers.map(c => c._id)));
    else setCheckedIds(new Set());
  };

  const handleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const loadMore = () => load(page + 1);

  // idsParam: optional explicit list (from card quick menu); falls back to checkedIds
  const handleAddToMyDesk = async (idsParam) => {
    const ids = idsParam || Array.from(checkedIds);
    if (!currentUserId || ids.length === 0) return;
    setAddingToDesk(true);
    try {
      await authCtx.jwtInst({ method: 'post', url: `${axiosGlobal.defaultTargetApi}/tasks`,
        data: {
          title:        `My Desk — ${ids.length} customer${ids.length !== 1 ? 's' : ''}`,
          module:       'crm',
          assigneeType: 'user',
          assignedUser: currentUserId,
          subjects: ids.map(id => ({ subjectType: 'customer', subjectId: id })),
        },
      });
      dispatch(actions.setShowSnackBar({ status: true,
        msg: t('crm.addedToMyDesk', { count: ids.length }),
        type: 'success' }));
      if (!idsParam) setCheckedIds(new Set()); // only clear bulk selection if bulk action
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true,
        msg: err?.response?.data?.message || t('crm.failedAddToMyDesk'), type: 'error' }));
    }
    setAddingToDesk(false);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(checkedIds);
    if (!ids.length) return;
    setBulkDeleting(true);
    try {
      await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/crm/customers/bulk`,
        data: { action: 'delete', ids },
      });
      dispatch(actions.setShowSnackBar({
        status: true,
        msg: t('crm.deletedCustomers', { count: ids.length }),
        type: 'success',
      }));
      setCheckedIds(new Set());
      if (selectedCustomer && ids.includes(String(selectedCustomer._id))) {
        setSelectedCustomer(null);
        setMobileDetail(false);
      }
      dispatch(actions.crmBumpRefresh());
    } catch (err) {
      dispatch(actions.setShowSnackBar({
        status: true,
        msg: err?.response?.data?.message || t('crm.failedDelete'),
        type: 'error',
      }));
    }
    setBulkDeleting(false);
    setConfirmDeleteOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: T.APP_BG, overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
        bgcolor: isDark ? '#0d0d0d' : 'background.paper',
        borderBottom: `1px solid ${T.BD}`, flexShrink: 0, flexWrap: 'wrap' }}>

        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
          {t('crm.title')}
        </Typography>

        {/* View toggle: Customers | My Desk */}
        <Box sx={{ display: 'flex', gap: 0.5, bgcolor: T.CTRL_BG, borderRadius: '9px',
          p: '3px', border: `1px solid ${T.BD}`, flexShrink: 0 }}>
          {[
            { id: 'customers', Icon: TableRowsIcon, label: t('crm.customers') },
            { id: 'myDesk',    Icon: DashboardIcon, label: t('crm.myDesk')   },
          ].map(({ id, Icon, label }) => (
            <Tooltip key={id} title={isMob ? label : ''}>
              <Button size="small" onClick={() => setView(id)}
                sx={{ minWidth: 0, height: 24, px: isMob ? '6px' : 1, py: 0, borderRadius: '7px',
                  fontSize: '0.7rem', fontWeight: view === id ? 700 : 400, textTransform: 'none',
                  color: view === id ? T.TEXT_PRI : T.TEXT_TER,
                  bgcolor: view === id ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', color: T.TEXT_PRI },
                  gap: isMob ? 0 : 0.5,
                }}>
                <Icon sx={{ fontSize: 14 }} />
                {!isMob && label}
              </Button>
            </Tooltip>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexGrow: 1, maxWidth: 360,
          bgcolor: T.CTRL_BG, borderRadius: '8px', px: 1.25, py: '4px',
          border: `1px solid ${T.BD}` }}>
          <SearchIcon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />
          <InputBase value={filter.search} onChange={(e) => setF('search', e.target.value)}
            placeholder={t('crm.searchPlaceholder')}
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

        {can('crm:customer:create') && (
          <Tooltip title={isMob ? t('crm.newCustomer') : ''}>
            <Button variant="contained" size="small"
              onClick={() => { setFormMode('new'); setFormCustomer(null); setFormOpen(true); }}
              sx={{ fontSize: '0.75rem', height: 30, borderRadius: '8px',
                textTransform: 'none', fontWeight: 600, flexShrink: 0,
                minWidth: isMob ? 30 : 'auto', px: isMob ? '5px' : undefined }}>
              <AddIcon sx={{ fontSize: 17 }} />
              {!isMob && <Box component="span" sx={{ ml: 0.5 }}>{t('crm.newCustomer')}</Box>}
            </Button>
          </Tooltip>
        )}
        <SectionTutorials section="crm" tag="crm:customer:create" />
      </Box>

      {/* ── Bulk actions bar ── */}
      {checkedIds.size > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.75,
          bgcolor: T.CTRL_BG, borderBottom: `1px solid ${T.BD}`, flexShrink: 0, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_PRI, fontWeight: 600 }}>
            {t('common.selected', { count: checkedIds.size })}
          </Typography>

          <Button size="small" startIcon={<LabelIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC, minWidth: 0 }}>
            {t('crm.addTag')}
          </Button>

          <Button size="small" startIcon={<DashboardIcon sx={{ fontSize: 13 }} />}
            disabled={addingToDesk}
            onClick={handleAddToMyDesk}
            sx={{ fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC, minWidth: 0 }}>
            {addingToDesk ? <CircularProgress size={11} sx={{ mr: 0.5 }} /> : null}
            {t('crm.addToMyDesk')}
          </Button>

          {can('crm:task:assign') && (
            <Button size="small" startIcon={<AssignmentIndIcon sx={{ fontSize: 14 }} />}
              onClick={() => setAssignOpen(true)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC, minWidth: 0 }}>
              {t('common.assign')}
            </Button>
          )}

          {can('crm:customer:delete') && (
            <Button size="small"
              startIcon={bulkDeleting
                ? <CircularProgress size={12} sx={{ color: '#EA005A' }} />
                : <DeleteOutlineIcon sx={{ fontSize: 14 }} />}
              disabled={bulkDeleting}
              onClick={() => setConfirmDeleteOpen(true)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', color: '#EA005A', minWidth: 0,
                '&:hover': { bgcolor: 'rgba(234,0,90,0.07)' } }}>
              {t('common.delete')}
            </Button>
          )}

          <Box sx={{ flexGrow: 1 }} />
          <IconButton size="small" onClick={() => setCheckedIds(new Set())}
            sx={{ color: T.TEXT_TER, width: 26, height: 26 }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      )}

      <Divider sx={{ borderColor: T.BD }} />

      {/* ── Main content ── */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

        {/* ── My Desk view ── */}
        {view === 'myDesk' && (
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <MyDesk onAddToMyDesk={handleAddToMyDesk} />
          </Box>
        )}

        {/* ── List panel ── */}
        {view === 'customers' && (!isMob || !mobileDetail) && (
          <Box sx={{
            width: isMob ? '100%' : (selectedCustomer ? listWidth : '100%'),
            flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            borderRight: (!isMob && selectedCustomer) ? `1px solid ${T.BD}` : 'none',
            bgcolor: T.PANEL_BG,
            overflow: 'hidden',
            position: 'relative',
            transition: listResizing ? 'none' : 'width 0.2s',
          }}>

            {/* Drag to resize the list against the detail panel; double-click
                resets. Only meaningful once the split is actually showing. */}
            {!isMob && selectedCustomer && (
              <SidebarResizer width={listWidth} side="right"
                onResize={(w) => { setListResizing(true); setListWidth(w); }}
                onDoubleClick={resetListWidth} />
            )}

            {/* List header row */}
            <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
              borderBottom: `1px solid ${T.BD}` }}>
              <FormControlLabel
                control={
                  <Checkbox size="small"
                    checked={checkedIds.size === customers.length && customers.length > 0}
                    indeterminate={checkedIds.size > 0 && checkedIds.size < customers.length}
                    onChange={(e) => handleCheckAll(e.target.checked)}
                    sx={{ p: 0.25, color: T.TEXT_TER, '&.Mui-checked': { color: T.TEXT_PRI } }} />
                }
                label={
                  <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, ml: 0.5 }}>
                    {total > 0 ? t('crm.customersCount', { count: total }) : t('crm.noCustomers')}
                  </Typography>
                }
                sx={{ m: 0 }} />

              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <PageSizeSelect value={pageSize} onChange={setPageSize}
                  sx={{ height: 26, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
                    '& .MuiSelect-select': { color: T.TEXT_TER }, '& .MuiSvgIcon-root': { color: T.TEXT_TER } }} />
                <Select value={filter.sort} size="small"
                  onChange={(e) => setF('sort', e.target.value)}
                  sx={{ fontSize: '0.72rem', height: 26,
                    color: T.TEXT_TER,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
                    '& .MuiSvgIcon-root': { color: T.TEXT_TER } }}>
                  {SORT_OPTIONS.map(o => (
                    <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.75rem' }}>
                      {t(`crm.${o.key}`)}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>

            {/* Customer cards */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 0.75 }}>
              {loading && customers.length === 0 ? (
                <Box sx={{ px: 1, py: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Box key={i} sx={{ borderRadius: '12px', border: `1px solid ${T.BD}`, p: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                        <Skeleton variant="text" width="40%" height={18} />
                        <Skeleton variant="rectangular" width={50} height={16} sx={{ borderRadius: '4px' }} />
                      </Box>
                      <Skeleton variant="text" width="60%" height={14} />
                    </Box>
                  ))}
                </Box>
              ) : customers.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', py: 8, px: 3, textAlign: 'center' }}>
                  <PersonIcon sx={{ fontSize: 48, color: T.TEXT_TER, mb: 1.5 }} />
                  <Typography sx={{ fontSize: '0.875rem', color: T.TEXT_SEC, fontWeight: 600, mb: 0.5 }}>
                    {activeFilterCount > 0 ? t('crm.noCustomersMatchFilters') : t('crm.noCustomersYet')}
                  </Typography>
                  {activeFilterCount > 0 && (
                    <Button size="small" onClick={clearFilters}
                      sx={{ mt: 1.5, fontSize: '0.75rem', textTransform: 'none', color: T.TEXT_TER }}>
                      {t('common.clearFilters')}
                    </Button>
                  )}
                </Box>
              ) : (
                <>
                  {customers.map(c => (
                    <CustomerCard key={c._id} customer={c}
                      unread={isUnread(c)}
                      selected={selectedCustomer && String(c._id) === String(selectedCustomer._id)}
                      checked={checkedIds.has(c._id)}
                      showCheckbox={checkedIds.size > 0}
                      expanded={expandedIds.has(c._id)}
                      onSelect={handleSelect}
                      onCheck={handleCheck}
                      onExpand={handleExpand}
                      onEdit={(cust) => {
                        setFormMode('edit');
                        setFormCustomer(cust);
                        setFormOpen(true);
                      }}
                      onAddToMyDesk={handleAddToMyDesk}
                    />
                  ))}
                  <InfiniteScrollSentinel onIntersect={loadMore} hasMore={hasMore} loading={loading} />
                </>
              )}
            </Box>
          </Box>
        )}

        {/* ── Detail panel ── */}
        {view === 'customers' && selectedCustomer && (!isMob || mobileDetail) && (
          <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative', bgcolor: T.PANEL_BG }}>
            {isMob && (
              <IconButton size="small" onClick={handleDetailClose}
                sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10,
                  color: T.TEXT_TER, bgcolor: T.CTRL_BG, borderRadius: '8px', width: 30, height: 30 }}>
                <ArrowBackIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            <CustomerDetail customer={selectedCustomer}
              initialTab={focusTab}
              onClose={handleDetailClose}
              onLoaded={setSelectedCustomer}
              onEdit={() => {
                setFormMode('edit');
                setFormCustomer(selectedCustomer);
                setFormOpen(true);
              }}
              onDeleted={handleDetailClose} />
          </Box>
        )}

        {/* Desktop empty detail placeholder */}
        {view === 'customers' && !selectedCustomer && !isMob && customers.length > 0 && (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center',
            justifyContent: 'center', bgcolor: T.APP_BG }}>
            <Box sx={{ textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 40, color: T.TEXT_TER, mb: 1 }} />
              <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
                {t('crm.selectCustomer')}
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
          <IconButton size="small" onClick={() => setFilterOpen(false)}
            sx={{ color: T.TEXT_TER }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto' }}>

          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: '0.78rem' }}>{t('common.type')}</InputLabel>
            <Select value={filter.type} onChange={(e) => setF('type', e.target.value)} label={t('common.type')}
              sx={{ fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }}>
              <MenuItem value=""><em>{t('common.all')}</em></MenuItem>
              <MenuItem value="individual">{t('crm.individual')}</MenuItem>
              <MenuItem value="company">{t('crm.company')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: '0.78rem' }}>{t('common.country')}</InputLabel>
            <Select value={filter.country} onChange={(e) => setF('country', e.target.value)} label={t('common.country')}
              sx={{ fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }}>
              <MenuItem value=""><em>{t('common.all')}</em></MenuItem>
              {COUNTRIES.map((c) => (
                <MenuItem key={c.code} value={c.name}>{c.flag} {c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: '0.78rem' }}>{t('common.status')}</InputLabel>
            <Select value={filter.status} onChange={(e) => setF('status', e.target.value)} label={t('common.status')}
              sx={{ fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }}>
              <MenuItem value=""><em>{t('common.all')}</em></MenuItem>
              {STATUS_OPTIONS.map(s => (
                <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>
                  {t(`crm.${STATUS_KEY[s]}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mb: 1,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t('crm.channels')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {CHANNEL_OPTIONS.map(ch => (
                <Chip key={ch} label={ch} size="small" clickable
                  onClick={() => toggleChannel(ch)}
                  sx={{ height: 24, fontSize: '0.72rem', borderRadius: '6px',
                    bgcolor: filter.channels.includes(ch)
                      ? (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)')
                      : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    color: filter.channels.includes(ch) ? T.TEXT_PRI : T.TEXT_TER,
                    border: `1px solid ${filter.channels.includes(ch) ? T.BD2 : T.BD}`,
                    '& .MuiChip-label': { px: 1 } }} />
              ))}
            </Box>
          </Box>

          <TextField size="small" label={t('crm.tagsCommaSeparated')} value={filter.tags}
            onChange={(e) => setF('tags', e.target.value)}
            inputProps={{ style: { fontSize: '0.8rem' } }}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }} />

          <Box>
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mb: 1,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t('crm.lastCallRange')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" type="date" label={t('common.from')} value={filter.dateFrom}
                onChange={(e) => setF('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
                  '& input': { fontSize: '0.78rem' } }} />
              <TextField size="small" type="date" label={t('common.to')} value={filter.dateTo}
                onChange={(e) => setF('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
                  '& input': { fontSize: '0.78rem' } }} />
            </Box>
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, mb: 0.75, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t('common.createdBy')}
            </Typography>
            <FormControl size="small" fullWidth disabled={createdByDisabled}>
              <Select value={createdByDisabled ? '' : filter.createdBy} displayEmpty
                onChange={(e) => setF('createdBy', e.target.value)}
                sx={{ fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }}>
                <MenuItem value="" sx={{ fontSize: '0.8rem' }}>{t('common.anyone')}</MenuItem>
                {creators.map(c => (
                  <MenuItem key={c._id} value={c._id} sx={{ fontSize: '0.8rem' }}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {createdByDisabled && (
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mt: 0.5 }}>
                {t('crm.disabledScopeNote')}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${T.BD}` }}>
          <Button fullWidth size="small" onClick={clearFilters}
            sx={{ fontSize: '0.75rem', textTransform: 'none', color: T.TEXT_SEC,
              border: `1px solid ${T.BD}`, borderRadius: '8px' }}>
            {t('common.clearAllFilters')}
          </Button>
        </Box>
      </Drawer>

      {/* ── Customer Form Drawer ── */}
      <CustomerForm
        open={formOpen}
        mode={formMode}
        customer={formCustomer}
        onClose={() => setFormOpen(false)}
        onSave={(saved) => {
          if (formMode === 'edit' && selectedCustomer &&
              String(selectedCustomer._id) === String(saved?._id)) {
            setSelectedCustomer(saved);
          }
          dispatch(actions.crmBumpRefresh());
        }}
      />

      {/* ── Assign customers dialog ── */}
      <AssignCustomersDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        customerIds={Array.from(checkedIds)}
        onSave={() => {
          setCheckedIds(new Set());
          dispatch(actions.crmBumpRefresh());
        }}
      />

      {/* ── Bulk delete confirm ── */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={t('crm.deleteConfirmTitle', { count: checkedIds.size })}
        message={t('crm.deleteConfirmMessage', { count: checkedIds.size })}
        confirmLabel={t('common.delete')}
        destructive
      />
    </Box>
  );
}
