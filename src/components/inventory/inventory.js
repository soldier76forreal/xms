import { useContext, useEffect, useState, useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import { useDispatch, useSelector } from 'react-redux';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';
import {
  fetchProducts, fetchInventoryLookups, fetchInvStats, fetchCategories, actions,
} from '../../store/store';
import SkeletonWrapper from '../../tools/loader/skeletonWrapper';
import InfiniteScrollSentinel from '../../tools/loader/infiniteScrollSentinel';
import PageSizeSelect from '../../tools/inputs/pageSizeSelect';
import SectionTutorials from '../tutorials/sectionTutorials';
import ProductCard from './productCard';
import ShowProduct from './showProduct';
import { useSidebarWidth } from '../../tools/hooks/useSidebarWidth';
import { useUnreadRecords } from '../../tools/hooks/useUnreadRecords';
import SidebarResizer from '../../tools/navs/sidebarResizer';
import ProductForm from './productForm';
import ImportExportDialog from './importExportDialog';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';

const UNIT_LABELS = { M2: 'm²', ML: 'ml', PCS: 'pcs', SQFT: 'ft²', LNFT: 'lnft' };

// Chrome breathing animation for Analytics
const CHROME_SX = {
  '@keyframes chromePulse': {
    '0%, 100%': { backgroundPosition: '0% 50%' },
    '50%':      { backgroundPosition: '100% 50%' },
  },
  background: 'linear-gradient(90deg, #9e9e9e, #ffffff, #bdbdbd, #e0e0e0, #9e9e9e)',
  backgroundSize: '300% auto',
  animation: 'chromePulse 3s ease infinite',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 700,
  display: 'inline',
};

// Filter section with expandable accordion list
const FINISH_OPTIONS = [
  { labelKey: 'inventory.finishPolished', value: 'P' },
  { labelKey: 'inventory.finishHoned',    value: 'H' },
];
const CUT_OPTIONS = [
  { labelKey: 'inventory.cutVeincut',   value: 'V' },
  { labelKey: 'inventory.cutCrosscut',  value: 'C' },
];
const GRADE_OPTIONS = [
  { labelKey: 'inventory.gradeSuper',     value: 'Q'  },
  { labelKey: 'inventory.gradeSuperPlus', value: 'QS' },
  { labelKey: 'inventory.gradeMomtaz',    value: 'W'  },
  { labelKey: 'inventory.gradeGrade1',    value: 'E'  },
  { labelKey: 'inventory.gradeGrade2',    value: 'R'  },
  { labelKey: 'inventory.gradeGrade3',    value: 'T'  },
];

function FilterGroup({ title, options, selected, onChange }) {
  const { t } = useTranslation();
  return (
    <Accordion disableGutters elevation={0}
      sx={{ border: 'none', bgcolor: 'transparent', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
        sx={{ px: 0, py: 0, minHeight: 36, '& .MuiAccordionSummary-content': { my: 0 } }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled' }}>
          {title}
          {selected.length > 0 && (
            <Chip label={selected.length} size="small"
              sx={{ ml: 1, height: 16, fontSize: '0.6rem', fontWeight: 700 }} />
          )}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0, pt: 0.5, pb: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {options.map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <Chip key={opt.value} label={opt.labelKey ? t(opt.labelKey) : opt.label} size="small"
                onClick={() => onChange(active
                  ? selected.filter((v) => v !== opt.value)
                  : [...selected, opt.value])}
                variant={active ? 'filled' : 'outlined'}
                sx={{ height: 24, fontSize: '0.72rem', fontWeight: active ? 700 : 400, cursor: 'pointer' }} />
            );
          })}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

const Inventory = () => {
  const { t } = useTranslation();
  const location   = useLocation();
  const history    = useHistory();
  const authCtx    = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch   = useDispatch();
  const { scopeFor, can } = usePermissions();
  const { activeBranchId } = useBranch();
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [openRestricted, setOpenRestricted] = useState(false);
  const inventoryScope = scopeFor('inventory');
  const createdByDisabled = inventoryScope === 'mine';

  const invProducts   = useSelector((s) => s.invProducts);
  const invTotal      = useSelector((s) => s.invTotal);
  const invLoading    = useSelector((s) => s.invLoading);
  const invRefreshKey = useSelector((s) => s.invRefreshKey);

  // Flags a product inserted by someone else since this user's last visit to
  // Inventory as unread (dot + tinted card) — see useUnreadRecords.js.
  const { isUnread } = useUnreadRecords('inventory');
  const invLookups    = useSelector((s) => s.invLookups);
  const invStats      = useSelector((s) => s.invStats);
  const invCategories = useSelector((s) => s.invCategories);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [fullView, setFullView] = useState(false);

  // Resizable detail panel, persisted per user (see useSidebarWidth). Not
  // meaningful in fullView (width is forced to 100% there) — the resizer only
  // renders otherwise.
  const { width: detailWidth, setWidth: setDetailWidth, resetWidth: resetDetailWidth } =
    useSidebarWidth('inventoryDetail', 480, { min: 320, max: 800 });
  const [detailResizing, setDetailResizing] = useState(false);
  useEffect(() => {
    if (!detailResizing) return;
    const stop = () => setDetailResizing(false);
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, [detailResizing]);
  const [search,      setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters
  const [stoneFilter,   setStoneFilter]   = useState([]);
  const [finishFilter,  setFinishFilter]  = useState([]);
  const [cutFilter,     setCutFilter]     = useState([]);
  const [gradeFilter,   setGradeFilter]   = useState([]);
  const [catFilter,     setCatFilter]     = useState([]);
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [creators,      setCreators]      = useState([]);
  const [sortBy,        setSortBy]        = useState('code');
  const [filterOpen,    setFilterOpen]    = useState(false);
  const [pageSize,      setPageSize]      = useState(40);
  const [hasMore,       setHasMore]       = useState(false);

  const hasFilters = stoneFilter.length || finishFilter.length || cutFilter.length || gradeFilter.length
    || catFilter.length || (createdByFilter && !createdByDisabled);

  const clearFilters = () => {
    setStoneFilter([]); setFinishFilter([]); setCutFilter([]);
    setGradeFilter([]); setCatFilter([]); setCreatedByFilter('');
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    dispatch(fetchInventoryLookups({ authCtx, axiosGlobal }));
    dispatch(fetchCategories({ authCtx, axiosGlobal }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeBranchId) return;
    dispatch(fetchInvStats({ authCtx, axiosGlobal, params: { branchId: activeBranchId } }));
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/inventory/products/creators`,
      params: { branchId: activeBranchId } })
      .then((res) => setCreators(res.data.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId]);

  const buildInvParams = useCallback((skip = 0) => ({
    limit: pageSize, skip, sort: sortBy, order: 'asc', branchId: activeBranchId,
    ...(stoneFilter.length   && { stoneType: stoneFilter.join(',') }),
    ...(debouncedSearch      && { search: debouncedSearch }),
    ...(createdByFilter && !createdByDisabled && { createdBy: createdByFilter }),
    // Note: finish/cut/grade/category filters applied client-side since backend
    // doesn't yet support multi-value variant-level filters on product list
  }), [pageSize, sortBy, stoneFilter, debouncedSearch, createdByFilter, createdByDisabled, activeBranchId]);

  useEffect(() => {
    if (!activeBranchId) return;
    dispatch(fetchProducts({ authCtx, axiosGlobal, params: buildInvParams(0) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stoneFilter, debouncedSearch, sortBy, createdByFilter, pageSize, invRefreshKey, activeBranchId]);

  useEffect(() => {
    setHasMore(invProducts.length < invTotal);
  }, [invProducts, invTotal]);

  // Deep link from a notification click or a "copy link" short link:
  // /inventory?open=<productId> opens that product's detail (ShowProduct
  // self-fetches by id). /inventory?open=<variantId>&variant=1 means the id
  // is a VARIANT — resolve it first to find its parent product, open that
  // product underneath, then pop the variant detail dialog on top. Cleared
  // from the URL afterwards so it doesn't re-trigger on later re-renders.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openId = params.get('open');
    if (!openId) return;
    const isVariant = params.get('variant') === '1';
    history.replace('/inventory');

    if (!isVariant) {
      setSelectedProductId(openId);
      return;
    }

    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/inventory/variants/${openId}` })
      .then((res) => {
        const { variant, product } = res.data?.data || {};
        if (product?._id) setSelectedProductId(product._id);
        if (variant) {
          dispatch(actions.invSetCurrentVariant(variant));
          dispatch(actions.invToggleVariantDetail());
        }
      })
      .catch((err) => {
        if (err?.response?.status === 403) setOpenRestricted(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadMoreProducts = useCallback(() => {
    dispatch(fetchProducts({ authCtx, axiosGlobal, params: buildInvParams(invProducts.length) }));
  }, [dispatch, authCtx, axiosGlobal, buildInvParams, invProducts.length]);

  const handleNewProduct = useCallback(() => dispatch(actions.invToggleNewProduct()), [dispatch]);

  const stoneTypes   = invLookups?.stoneTypes || [];

  // Apply client-side filters (finish/cut/grade/category are variant-level — approximate filter on product)
  const filteredProducts = invProducts;

  // Stats
  const totalQtyDisplay = invStats?.totalByUnit
    ? Object.entries(invStats.totalByUnit).map(([u, q]) => `${q.toLocaleString()} ${UNIT_LABELS[u] || u}`).join(' · ')
    : '—';

  if (openRestricted) return <RestrictedAccessScreen />;

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>

      {/* ── List pane ── */}
      <Box sx={{
        flex: 1, minWidth: 0,
        display: { xs: selectedProductId ? 'none' : 'block', md: fullView ? 'none' : 'block' },
      }}>
        <Box sx={{ maxWidth: selectedProductId ? '100%' : 960, mx: selectedProductId ? 0 : 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{t('nav.inventory')}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('inventory.productsAndVarieties')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(can('inventory:import') || can('inventory:export')) && (
            <Button variant="outlined" startIcon={<ImportExportIcon />} size="small"
              onClick={() => setImportExportOpen(true)} sx={{ borderRadius: 2 }}>
              {t('inventory.importExportButton')}
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} size="small"
            onClick={handleNewProduct} sx={{ borderRadius: 2 }}>
            {t('inventory.newProductButton')}
          </Button>
          <SectionTutorials section="inventory" tag="inventory:product:create" />
        </Box>
      </Box>

      {/* ── Stats strip ── */}
      <Box sx={{
        mb: 3, p: 2,
        border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
        bgcolor: 'background.paper',
      }}>
        {/* 3-col grid on mobile, single flex row on sm+ */}
        <Box sx={{
          display: { xs: 'grid', sm: 'flex' },
          gridTemplateColumns: { xs: 'repeat(2, 1fr)' },
          gap: { xs: 2, sm: 0 },
          alignItems: 'center',
          flexWrap: 'nowrap',
        }}>
          {[
            { label: t('inventory.statBalance'),           value: totalQtyDisplay,                        color: undefined, small: true },
            { label: t('inventory.statAvailableProducts'), value: invStats?.inStockProductCount ?? '—',  color: undefined },
            { label: t('inventory.statAvailableSkus'),     value: invStats?.inStockVariantCount ?? '—',   color: undefined },
            { label: t('inventory.statTotalSkus'),         value: invStats?.variantCount ?? '—',          color: undefined },
          ].map((stat, i) => (
            <Box key={i} sx={{
              flex: { sm: 1 },
              px: { sm: i === 0 ? 0 : 2 },
              borderLeft: { sm: i > 0 ? '1px solid' : 'none' },
              borderColor: { sm: 'divider' },
              minWidth: 0,
            }}>
              <Typography variant={stat.small ? 'body2' : 'h5'}
                sx={{ fontWeight: 700, lineHeight: 1.1, color: stat.color || 'text.primary',
                  fontSize: stat.small ? '0.82rem' : undefined }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stat.label}</Typography>
            </Box>
          ))}

          {/* Full Analytics button */}
          <Box sx={{ ml: { sm: 'auto' }, mt: { xs: 1, sm: 0 }, gridColumn: { xs: '1 / -1', sm: 'auto' },
            pl: { sm: 2 }, borderLeft: { sm: '1px solid' }, borderColor: { sm: 'divider' } }}>
            <Button
              size="small" variant="outlined"
              startIcon={<AutoGraphIcon sx={{ fontSize: 15 }} />}
              sx={{
                borderRadius: 2, border: '1px solid #9e9e9e',
                color: 'text.primary', fontSize: '0.72rem',
                position: 'relative', overflow: 'hidden',
                '&::before': {
                  content: '""', position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg,#9e9e9e 0%,#ffffff 30%,#bdbdbd 50%,#ffffff 70%,#9e9e9e 100%)',
                  backgroundSize: '300% auto', opacity: 0.15,
                  animation: 'chromePulse 3s ease infinite',
                },
                '@keyframes chromePulse': {
                  '0%,100%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                },
              }}
            >
              <Box component="span" sx={CHROME_SX}>{t('inventory.fullAnalytics')}</Box>
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Search + Filter row ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth size="small"
            placeholder={t('inventory.searchByCodeOrName')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            size="small" variant={filterOpen || hasFilters ? 'contained' : 'outlined'}
            startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
            onClick={() => setFilterOpen((p) => !p)}
            sx={{ borderRadius: 2, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {t('common.filters')}{hasFilters ? ` (${[stoneFilter, finishFilter, cutFilter, gradeFilter, catFilter].filter((f) => f.length > 0).length + (createdByFilter && !createdByDisabled ? 1 : 0)})` : ''}
          </Button>
          {/* Sort — visible inline on sm+ */}
          <TextField select size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            sx={{ width: 165, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
            <MenuItem value="code">{t('inventory.sortCode')}</MenuItem>
            <MenuItem value="insertDate">{t('inventory.sortNewest')}</MenuItem>
            <MenuItem value="variantCount">{t('inventory.sortVariants')}</MenuItem>
          </TextField>
          <PageSizeSelect value={pageSize} onChange={setPageSize}
            sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />
        </Box>
        {/* Sort + page size — full-width below search on xs */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1 }}>
          <TextField select size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ flex: 1 }}>
            <MenuItem value="code">{t('inventory.sortCode')}</MenuItem>
            <MenuItem value="insertDate">{t('inventory.sortNewest')}</MenuItem>
            <MenuItem value="variantCount">{t('inventory.sortVariants')}</MenuItem>
          </TextField>
          <PageSizeSelect value={pageSize} onChange={setPageSize} />
        </Box>
      </Box>

      {/* ── Expandable filter panel ── */}
      {filterOpen && (
        <Box sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
          bgcolor: 'background.paper', px: 2.5, pt: 1.5, pb: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>{t('common.filters')}</Typography>
            {hasFilters && (
              <Button size="small" onClick={clearFilters} sx={{ fontSize: '0.7rem' }}>{t('inventory.clearAll')}</Button>
            )}
          </Box>
          <Divider sx={{ mb: 1 }} />

          <FilterGroup title={t('inventory.stoneTypeLabel')}
            options={stoneTypes.map((s) => ({ label: s.name, value: s.code }))}
            selected={stoneFilter} onChange={setStoneFilter} />
          <Divider sx={{ my: 0.5 }} />

          <FilterGroup title={t('inventory.finishFilterLabel')} options={FINISH_OPTIONS}
            selected={finishFilter} onChange={setFinishFilter} />
          <Divider sx={{ my: 0.5 }} />

          <FilterGroup title={t('inventory.cutLabel')} options={CUT_OPTIONS}
            selected={cutFilter} onChange={setCutFilter} />
          <Divider sx={{ my: 0.5 }} />

          <FilterGroup title={t('inventory.qualityGradeLabel')} options={GRADE_OPTIONS}
            selected={gradeFilter} onChange={setGradeFilter} />

          {invCategories.length > 0 && (
            <>
              <Divider sx={{ my: 0.5 }} />
              <FilterGroup title={t('inventory.categoryLabel')}
                options={invCategories.map((c) => ({ label: c.name, value: c._id }))}
                selected={catFilter} onChange={setCatFilter} />
            </>
          )}

          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', display: 'block', mb: 0.5 }}>
            {t('common.createdBy')}
          </Typography>
          <TextField select size="small" fullWidth
            value={createdByDisabled ? '' : createdByFilter}
            onChange={(e) => setCreatedByFilter(e.target.value)}
            disabled={createdByDisabled}>
            <MenuItem value="">{t('common.anyone')}</MenuItem>
            {creators.map((c) => (
              <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
            ))}
          </TextField>
          {createdByDisabled && (
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
              {t('inventory.scopeDisabledNoteInventory')}
            </Typography>
          )}
        </Box>
      )}

      {/* ── Stone type quick-filter pills ── */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip label={t('common.all')} size="small"
          onClick={() => setStoneFilter([])}
          variant={stoneFilter.length === 0 ? 'filled' : 'outlined'}
          sx={{ fontWeight: stoneFilter.length === 0 ? 700 : 400 }} />
        {stoneTypes.map((st) => {
          const active = stoneFilter.includes(st.code);
          return (
            <Chip key={st.code} label={st.name} size="small"
              onClick={() => setStoneFilter(active ? stoneFilter.filter((v) => v !== st.code) : [...stoneFilter, st.code])}
              variant={active ? 'filled' : 'outlined'}
              sx={{ fontWeight: active ? 700 : 400 }} />
          );
        })}
      </Box>

      {/* ── Product list ── */}
      <SkeletonWrapper loading={invLoading && filteredProducts.length === 0} variant="table" count={6}>
        {filteredProducts.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {search || hasFilters ? t('inventory.noProductsMatchFilters') : t('inventory.noProductsYetAddFirst')}
            </Typography>
            {!search && !hasFilters && (
              <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={handleNewProduct} sx={{ mt: 1 }}>
                {t('inventory.newProductButton')}
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                apiBase={axiosGlobal.defaultTargetApi}
                selected={product._id === selectedProductId}
                unread={isUnread(product)}
                onClick={() => setSelectedProductId(product._id)}
              />
            ))}
            <InfiniteScrollSentinel onIntersect={loadMoreProducts} hasMore={hasMore} loading={invLoading} />
          </Box>
        )}
      </SkeletonWrapper>
        </Box>
      </Box>

      {/* ── Detail pane (sidebar, or full view when toggled) ── */}
      {selectedProductId && (
        <Box sx={{
          width: { xs: '100%', md: fullView ? '100%' : detailWidth },
          flexShrink: 0,
          borderLeft: { md: fullView ? 'none' : '1px solid' },
          borderColor: { md: 'divider' },
          position: { md: 'sticky' },
          top: 0,
          maxHeight: { md: '100vh' },
          overflowY: { md: 'auto' },
          bgcolor: 'background.default',
          transition: detailResizing ? 'none' : undefined,
        }}>
          {!fullView && (
            <SidebarResizer width={detailWidth} side="left"
              onResize={(w) => { setDetailResizing(true); setDetailWidth(w); }}
              onDoubleClick={resetDetailWidth} />
          )}
          <ShowProduct
            productId={selectedProductId}
            onBack={() => { setSelectedProductId(null); setFullView(false); }}
            fullView={fullView}
            onToggleFullView={() => setFullView((v) => !v)}
          />
        </Box>
      )}

      <ProductForm />

      <ImportExportDialog
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        onImportSuccess={() => dispatch(actions.invRefresh())}
        branchId={activeBranchId}
      />
    </Box>
  );
};

export default Inventory;
