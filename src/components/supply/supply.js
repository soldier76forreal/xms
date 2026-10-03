import { useContext, useEffect, useState, useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import TerrainIcon from '@mui/icons-material/Terrain';
import { useDispatch, useSelector } from 'react-redux';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';
import { fetchSupplyRecords, actions } from '../../store/store';
import SkeletonWrapper from '../../tools/loader/skeletonWrapper';
import InfiniteScrollSentinel from '../../tools/loader/infiniteScrollSentinel';
import { useSidebarWidth } from '../../tools/hooks/useSidebarWidth';
import SidebarResizer from '../../tools/navs/sidebarResizer';
import SectionBranchSelect from '../../tools/navs/sectionBranchSelect';
import SupplyRecordCard from './supplyRecordCard';
import SupplyRecordDetail from './supplyRecordDetail';
import SupplyRecordForm from './supplyRecordForm';

// Local debounce — same shape as the one in mis.js (kept per-file, as there is
// no shared hook for it yet).
const DEFAULT_FILTER = { status: 'active', stage: '', productId: '', createdBy: '', dateFrom: '', dateTo: '' };
const STATUS_OPTIONS = [
  { value: 'active',   labelKey: 'supply.filterStatusActive' },
  { value: 'archived', labelKey: 'supply.filterStatusArchived' },
  { value: 'all',      labelKey: 'common.all' },
];
// Where the record's lots stand (at least one deal letter in that stage).
const STAGE_OPTIONS = [
  { value: '',              labelKey: 'supply.filterStageAny' },
  { value: 'purchasing',    labelKey: 'supply.statusPurchasing' },
  { value: 'processing',    labelKey: 'supply.statusProcessing' },
  { value: 'final_product', labelKey: 'supply.statusFinalProduct' },
  { value: 'none',          labelKey: 'supply.filterStageNone' },
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Supply — master/detail shell. Rebuilt on the SAME architecture as mis.js /
// crm.js: a full-height flex column that owns its own scrolling regions, a
// fixed-width list panel and a detail panel that GROWS into the remaining
// space. The earlier version inverted that (page-scroll, flex:1 list + fixed
// detail), which squeezed the list every time a record was opened.
const Supply = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const history = useHistory();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch = useDispatch();
  const { can, scopeFor } = usePermissions();
  const { activeBranchId } = useBranch();

  const supplyRecords = useSelector((s) => s.supplyRecords);
  const supplyRecordsTotal = useSelector((s) => s.supplyRecordsTotal);
  const supplyRecordsLoading = useSelector((s) => s.supplyRecordsLoading);
  const supplyRefreshKey = useSelector((s) => s.supplyRefreshKey);
  const showNewRecord = useSelector((s) => s.supplyShowNewRecord);

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  // Filter drawer (CRM / MIS pattern). status 'all' = active + archived.
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ products: [], creators: [] });
  const [hasMore, setHasMore] = useState(false);
  const [listResizing, setListResizing] = useState(false);

  // Which branch's supply records to show. Mirrors Inventory: the app-wide
  // active branch by default, or a branch that shared its Supply (read-only,
  // enforced by requireBranchRead() on the server).
  const [viewBranchId, setViewBranchId] = useState(activeBranchId);
  const [branchReadOnly, setBranchReadOnly] = useState(false);
  const [viewBranchName, setViewBranchName] = useState('');
  useEffect(() => {
    setViewBranchId(activeBranchId); setBranchReadOnly(false); setViewBranchName(''); setSelectedId(null);
  }, [activeBranchId]);

  const debouncedSearch = useDebounce(search, 350);

  const { width: listWidth, setWidth: setListWidth, resetWidth: resetListWidth } =
    useSidebarWidth('supplyList', 400, { min: 300, max: 640 });

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

  // 'mine'-scoped users only ever see their own records, so "created by"
  // has nothing to choose between (the server ignores it too).
  const createdByDisabled = scopeFor('supply') === 'mine' && !branchReadOnly;

  const buildParams = useCallback((skip = 0) => ({
    limit: 40, skip, branchId: viewBranchId,
    ...(debouncedSearch && { search: debouncedSearch }),
    status: filter.status,
    ...(filter.stage && { stage: filter.stage }),
    ...(filter.productId && { productId: filter.productId }),
    ...(filter.createdBy && !createdByDisabled && { createdBy: filter.createdBy }),
    ...(filter.dateFrom && { dateFrom: filter.dateFrom }),
    ...(filter.dateTo && { dateTo: filter.dateTo }),
  }), [debouncedSearch, viewBranchId, filter, createdByDisabled]);

  useEffect(() => {
    if (!viewBranchId) return;
    dispatch(fetchSupplyRecords({ authCtx, axiosGlobal, params: buildParams(0) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, supplyRefreshKey, viewBranchId, filter]);

  // A different branch has different products/creators — start clean.
  useEffect(() => { setFilter(DEFAULT_FILTER); }, [viewBranchId]);

  // Products that have records here, and who created them — for the drawer.
  useEffect(() => {
    if (!viewBranchId) return;
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/supply/records/filter-options`,
      params: { branchId: viewBranchId } })
      .then((res) => setFilterOptions(res.data?.data || { products: [], creators: [] }))
      .catch(() => setFilterOptions({ products: [], creators: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewBranchId, supplyRefreshKey]);

  const setF = (key, value) => setFilter((f) => ({ ...f, [key]: value }));
  const activeFilterCount = [
    filter.status !== DEFAULT_FILTER.status, filter.stage, filter.productId,
    filter.createdBy && !createdByDisabled, filter.dateFrom, filter.dateTo,
  ].filter(Boolean).length;

  useEffect(() => { setHasMore(supplyRecords.length < supplyRecordsTotal); }, [supplyRecords, supplyRecordsTotal]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openId = params.get('open');
    if (!openId) return;
    history.replace('/supply');
    setSelectedId(openId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadMore = () => dispatch(fetchSupplyRecords({ authCtx, axiosGlobal, params: buildParams(supplyRecords.length) }));

  // On mobile the detail takes over the screen entirely (drill-down).
  const mobileDetail = isMob && Boolean(selectedId);

  return (
    // Pinned to the viewport below the 60px top bar (same as MIS): the list
    // and the record detail scroll on their own instead of the whole page.
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)',
      '@supports (height: 100dvh)': { height: 'calc(100dvh - 60px)' },
      bgcolor: T.APP_BG, overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
        bgcolor: isDark ? '#0d0d0d' : 'background.paper',
        borderBottom: `1px solid ${T.BD}`, flexShrink: 0, flexWrap: 'wrap' }}>

        <TerrainIcon sx={{ fontSize: 17, color: T.TEXT_SEC, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
          {t('nav.supply')}
        </Typography>

        {/* Search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexGrow: 1, maxWidth: 360,
          bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}`, borderRadius: '9px', px: 1, height: 30 }}>
          <SearchIcon sx={{ fontSize: 15, color: T.TEXT_TER }} />
          <InputBase value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('supply.searchPlaceholder')}
            sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, flex: 1,
              '& input::placeholder': { color: T.TEXT_TER, opacity: 1 } }} />
          {search && (
            <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.25 }}>
              <CloseIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />
            </IconButton>
          )}
        </Box>

        <Tooltip title={t('common.filters')}>
          <IconButton size="small" onClick={() => setFilterOpen(true)}
            sx={{ color: activeFilterCount > 0 ? T.TEXT_PRI : T.TEXT_TER,
              border: `1px solid ${activeFilterCount > 0 ? T.BD2 : T.BD}`,
              borderRadius: '8px', width: 30, height: 30, position: 'relative', flexShrink: 0 }}>
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

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <SectionBranchSelect value={viewBranchId} readOnly={branchReadOnly}
            onChange={({ branchId, readOnly, branchName }) => {
              setViewBranchId(branchId); setBranchReadOnly(readOnly); setViewBranchName(branchName || '');
              setSelectedId(null);
            }} />

          {!branchReadOnly && can('supply:record:create') && (
            <Tooltip title={isMob ? t('supply.newRecord') : ''}>
              <Button variant="contained" size="small" startIcon={!isMob ? <AddIcon sx={{ fontSize: 15 }} /> : null}
                onClick={() => dispatch(actions.supplyToggleNewRecord())}
                sx={{ height: 28, minWidth: 0, px: isMob ? 1 : 1.5, borderRadius: '8px',
                  fontSize: '0.72rem', textTransform: 'none', fontWeight: 700 }}>
                {isMob ? <AddIcon sx={{ fontSize: 16 }} /> : t('supply.newRecord')}
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Split ── */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

        {/* List panel */}
        {!mobileDetail && (
          <Box sx={{
            width: isMob ? '100%' : (selectedId ? listWidth : '100%'),
            flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            borderRight: (!isMob && selectedId) ? `1px solid ${T.BD}` : 'none',
            bgcolor: T.PANEL_BG,
            overflow: 'hidden', position: 'relative',
            transition: listResizing ? 'none' : 'width 0.2s',
          }}>

            {!isMob && selectedId && (
              <SidebarResizer width={listWidth} side="right"
                onResize={(w) => { setListResizing(true); setListWidth(w); }}
                onDoubleClick={resetListWidth} />
            )}

            {/* List header */}
            <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
              borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
              <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
                {supplyRecordsTotal > 0
                  ? t('supply.recordsCount', { count: supplyRecordsTotal })
                  : t('supply.noRecordsYet')}
              </Typography>
            </Box>

            {/* Scrollable list body */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 0.75 }}>
              <SkeletonWrapper loading={supplyRecordsLoading && supplyRecords.length === 0} variant="table" count={6}>
                {supplyRecords.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', py: 8, px: 3, gap: 1 }}>
                    <TerrainIcon sx={{ fontSize: 30, color: T.TEXT_TER }} />
                    <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC, textAlign: 'center' }}>
                      {search ? t('supply.noRecordsMatchSearch') : t('supply.noRecordsYet')}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ px: 1, py: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {supplyRecords.map((record) => (
                      <SupplyRecordCard key={record._id} record={record} T={T}
                        selected={record._id === selectedId} onClick={() => setSelectedId(record._id)} />
                    ))}
                    <InfiniteScrollSentinel onIntersect={loadMore} hasMore={hasMore} loading={supplyRecordsLoading} />
                  </Box>
                )}
              </SkeletonWrapper>
            </Box>
          </Box>
        )}

        {/* Detail panel — grows into the remaining space */}
        {selectedId && (
          <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden', position: 'relative', bgcolor: T.PANEL_BG }}>
            <SupplyRecordDetail recordId={selectedId} onBack={() => setSelectedId(null)} T={T}
              readOnly={branchReadOnly} branchName={viewBranchName} />
          </Box>
        )}
      </Box>

      <SupplyRecordForm open={showNewRecord} onClose={() => dispatch(actions.supplyToggleNewRecord())} />
      {/* ── Filter drawer ── */}
      <Drawer anchor="right" open={filterOpen} onClose={() => setFilterOpen(false)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 340 }, bgcolor: T.PANEL_BG,
          borderLeft: `1px solid ${T.BD}`, display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
            {t('common.filters')}
          </Typography>
          <IconButton size="small" onClick={() => setFilterOpen(false)} sx={{ color: T.TEXT_TER }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2.25, overflowY: 'auto', flex: 1 }}>
          {/* Record status */}
          <Box>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              color: T.TEXT_TER, mb: 0.75 }}>
              {t('supply.filterStatusLabel')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {STATUS_OPTIONS.map((o) => {
                const sel = filter.status === o.value;
                return (
                  <Button key={o.value} size="small" onClick={() => setF('status', o.value)}
                    sx={{ flex: 1, height: 30, borderRadius: '8px', fontSize: '0.72rem', textTransform: 'none',
                      fontWeight: sel ? 700 : 400, color: sel ? T.TEXT_PRI : T.TEXT_TER,
                      bgcolor: sel ? T.CTRL_BG : 'transparent', border: `1px solid ${sel ? T.BD2 : T.BD}` }}>
                    {t(o.labelKey)}
                  </Button>
                );
              })}
            </Box>
          </Box>

          <TextField select size="small" fullWidth label={t('supply.filterStageLabel')} value={filter.stage}
            onChange={(e) => setF('stage', e.target.value)}
            InputLabelProps={{ shrink: true, style: { fontSize: '0.78rem' } }}
            SelectProps={{ displayEmpty: true, sx: { fontSize: '0.8rem' } }}>
            {STAGE_OPTIONS.map((o) => (
              <MenuItem key={o.value || 'any'} value={o.value} sx={{ fontSize: '0.8rem' }}>{t(o.labelKey)}</MenuItem>
            ))}
          </TextField>

          <Autocomplete
            options={filterOptions.products}
            value={filterOptions.products.find((p) => String(p._id) === String(filter.productId)) || null}
            onChange={(_, v) => setF('productId', v ? v._id : '')}
            getOptionLabel={(p) => (p ? `${p.code} — ${p.name}` : '')}
            isOptionEqualToValue={(o, v) => String(o._id) === String(v?._id)}
            renderInput={(params) => (
              <TextField {...params} size="small" label={t('supply.filterProductLabel')}
                placeholder={t('supply.filterProductAny')}
                InputLabelProps={{ ...params.InputLabelProps, shrink: true, style: { fontSize: '0.78rem' } }}
                inputProps={{ ...params.inputProps, style: { fontSize: '0.8rem' } }} />
            )}
          />

          <TextField select size="small" fullWidth label={t('common.createdBy')} disabled={createdByDisabled}
            value={createdByDisabled ? '' : filter.createdBy}
            onChange={(e) => setF('createdBy', e.target.value)}
            helperText={createdByDisabled ? t('supply.filterScopeMineNote') : undefined}
            InputLabelProps={{ shrink: true, style: { fontSize: '0.78rem' } }}
            SelectProps={{ displayEmpty: true, sx: { fontSize: '0.8rem' } }}>
            <MenuItem value="" sx={{ fontSize: '0.8rem' }}><em>{t('common.anyone')}</em></MenuItem>
            {filterOptions.creators.map((c) => (
              <MenuItem key={c._id} value={c._id} sx={{ fontSize: '0.8rem' }}>{c.name}</MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', gap: 1.25 }}>
            <TextField size="small" type="date" fullWidth label={t('supply.filterDateFrom')} value={filter.dateFrom}
              onChange={(e) => setF('dateFrom', e.target.value)}
              InputLabelProps={{ shrink: true, style: { fontSize: '0.78rem' } }}
              inputProps={{ style: { fontSize: '0.8rem' } }} />
            <TextField size="small" type="date" fullWidth label={t('supply.filterDateTo')} value={filter.dateTo}
              onChange={(e) => setF('dateTo', e.target.value)}
              InputLabelProps={{ shrink: true, style: { fontSize: '0.78rem' } }}
              inputProps={{ style: { fontSize: '0.8rem' } }} />
          </Box>
        </Box>

        <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${T.BD}`, display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button size="small" disabled={activeFilterCount === 0} onClick={() => setFilter(DEFAULT_FILTER)}
            sx={{ fontSize: '0.75rem', textTransform: 'none', color: T.TEXT_SEC }}>
            {t('supply.filterClear')}
          </Button>
          <Button size="small" variant="contained" onClick={() => setFilterOpen(false)}
            sx={{ ml: 'auto', fontSize: '0.75rem', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}>
            {t('supply.filterShowResults', { count: supplyRecordsTotal })}
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Supply;
