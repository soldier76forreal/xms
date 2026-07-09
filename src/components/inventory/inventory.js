import { useContext, useEffect, useState, useCallback } from 'react';
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
import ProductCard from './productCard';
import ShowProduct from './showProduct';
import ProductForm from './productForm';
import ImportExportDialog from './importExportDialog';
import ImportExportIcon from '@mui/icons-material/ImportExport';

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
  { label: 'Polished', value: 'P' },
  { label: 'Honed',    value: 'H' },
];
const CUT_OPTIONS = [
  { label: 'Veincut',   value: 'V' },
  { label: 'Crosscut',  value: 'C' },
];
const GRADE_OPTIONS = [
  { label: 'Super (Q)',   value: 'Q'  },
  { label: 'Super+ (QS)', value: 'QS' },
  { label: 'Momtaz (W)', value: 'W'  },
  { label: 'Grade 1 (E)',value: 'E'  },
  { label: 'Grade 2 (R)',value: 'R'  },
  { label: 'Grade 3 (T)',value: 'T'  },
];

function FilterGroup({ title, options, selected, onChange }) {
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
              <Chip key={opt.value} label={opt.label} size="small"
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
  const authCtx    = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch   = useDispatch();
  const { scopeFor, can } = usePermissions();
  const { activeBranchId } = useBranch();
  const [importExportOpen, setImportExportOpen] = useState(false);
  const inventoryScope = scopeFor('inventory');
  const createdByDisabled = inventoryScope === 'mine';

  const invProducts   = useSelector((s) => s.invProducts);
  const invTotal      = useSelector((s) => s.invTotal);
  const invLoading    = useSelector((s) => s.invLoading);
  const invRefreshKey = useSelector((s) => s.invRefreshKey);
  const invLookups    = useSelector((s) => s.invLookups);
  const invStats      = useSelector((s) => s.invStats);
  const invCategories = useSelector((s) => s.invCategories);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [fullView, setFullView] = useState(false);
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
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
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

  const loadMoreProducts = useCallback(() => {
    dispatch(fetchProducts({ authCtx, axiosGlobal, params: buildInvParams(invProducts.length) }));
  }, [dispatch, authCtx, axiosGlobal, buildInvParams, invProducts.length]);

  const handleNewProduct = useCallback(() => dispatch(actions.invToggleNewProduct()), [dispatch]);

  const uniqueStones = [...new Set(invProducts.map((p) => p.stoneType))].length;
  const stoneTypes   = invLookups?.stoneTypes || [];

  // Apply client-side filters (finish/cut/grade/category are variant-level — approximate filter on product)
  const filteredProducts = invProducts;

  // Stats
  const totalQtyDisplay = invStats?.totalByUnit
    ? Object.entries(invStats.totalByUnit).map(([u, q]) => `${q.toLocaleString()} ${UNIT_LABELS[u] || u}`).join(' · ')
    : '—';

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
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Inventory</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Products and Varieties
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(can('inventory:import') || can('inventory:export')) && (
            <Button variant="outlined" startIcon={<ImportExportIcon />} size="small"
              onClick={() => setImportExportOpen(true)} sx={{ borderRadius: 2 }}>
              Import / Export
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} size="small"
            onClick={handleNewProduct} sx={{ borderRadius: 2 }}>
            New product
          </Button>
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
          gridTemplateColumns: { xs: 'repeat(3, 1fr)' },
          gap: { xs: 2, sm: 0 },
          alignItems: 'center',
          flexWrap: 'nowrap',
        }}>
          {[
            { label: 'Varieties',     value: invTotal,                                      color: undefined },
            { label: 'Stone types',   value: uniqueStones,                                  color: undefined },
            { label: 'SKUs',          value: invProducts.reduce((a, p) => a + (p.variantCount || 0), 0), color: undefined },
            { label: 'Qty',           value: totalQtyDisplay,                               color: undefined, small: true },
            { label: 'Added (7d)',    value: `+${invStats?.addedThisWeek ?? '—'}`,          color: 'success.main' },
            { label: 'Sold (7d)',     value: `-${invStats?.soldThisWeek ?? '—'}`,           color: 'error.main' },
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
              <Box component="span" sx={CHROME_SX}>Full Analytics</Box>
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Search + Filter row ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth size="small"
            placeholder="Search by code or name…"
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
            Filters{hasFilters ? ` (${[stoneFilter, finishFilter, cutFilter, gradeFilter, catFilter].filter((f) => f.length > 0).length + (createdByFilter && !createdByDisabled ? 1 : 0)})` : ''}
          </Button>
          {/* Sort — visible inline on sm+ */}
          <TextField select size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            sx={{ width: 165, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
            <MenuItem value="code">Sort: Code</MenuItem>
            <MenuItem value="insertDate">Sort: Newest</MenuItem>
            <MenuItem value="variantCount">Sort: Variants</MenuItem>
          </TextField>
          <PageSizeSelect value={pageSize} onChange={setPageSize}
            sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />
        </Box>
        {/* Sort + page size — full-width below search on xs */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1 }}>
          <TextField select size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ flex: 1 }}>
            <MenuItem value="code">Sort: Code</MenuItem>
            <MenuItem value="insertDate">Sort: Newest</MenuItem>
            <MenuItem value="variantCount">Sort: Variants</MenuItem>
          </TextField>
          <PageSizeSelect value={pageSize} onChange={setPageSize} />
        </Box>
      </Box>

      {/* ── Expandable filter panel ── */}
      {filterOpen && (
        <Box sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
          bgcolor: 'background.paper', px: 2.5, pt: 1.5, pb: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Filters</Typography>
            {hasFilters && (
              <Button size="small" onClick={clearFilters} sx={{ fontSize: '0.7rem' }}>Clear all</Button>
            )}
          </Box>
          <Divider sx={{ mb: 1 }} />

          <FilterGroup title="Stone type"
            options={stoneTypes.map((s) => ({ label: s.name, value: s.code }))}
            selected={stoneFilter} onChange={setStoneFilter} />
          <Divider sx={{ my: 0.5 }} />

          <FilterGroup title="Finish" options={FINISH_OPTIONS}
            selected={finishFilter} onChange={setFinishFilter} />
          <Divider sx={{ my: 0.5 }} />

          <FilterGroup title="Cut" options={CUT_OPTIONS}
            selected={cutFilter} onChange={setCutFilter} />
          <Divider sx={{ my: 0.5 }} />

          <FilterGroup title="Quality / Grade" options={GRADE_OPTIONS}
            selected={gradeFilter} onChange={setGradeFilter} />

          {invCategories.length > 0 && (
            <>
              <Divider sx={{ my: 0.5 }} />
              <FilterGroup title="Category"
                options={invCategories.map((c) => ({ label: c.name, value: c._id }))}
                selected={catFilter} onChange={setCatFilter} />
            </>
          )}

          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', display: 'block', mb: 0.5 }}>
            Created by
          </Typography>
          <TextField select size="small" fullWidth
            value={createdByDisabled ? '' : createdByFilter}
            onChange={(e) => setCreatedByFilter(e.target.value)}
            disabled={createdByDisabled}>
            <MenuItem value="">Anyone</MenuItem>
            {creators.map((c) => (
              <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
            ))}
          </TextField>
          {createdByDisabled && (
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
              Disabled — your Inventory access is scoped to your own records
            </Typography>
          )}
        </Box>
      )}

      {/* ── Stone type quick-filter pills ── */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip label="All" size="small"
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
              {search || hasFilters ? 'No products match your filters.' : 'No products yet. Add the first one.'}
            </Typography>
            {!search && !hasFilters && (
              <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={handleNewProduct} sx={{ mt: 1 }}>
                New product
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
          width: { xs: '100%', md: fullView ? '100%' : 480 },
          flexShrink: 0,
          borderLeft: { md: fullView ? 'none' : '1px solid' },
          borderColor: { md: 'divider' },
          position: { md: 'sticky' },
          top: 0,
          maxHeight: { md: '100vh' },
          overflowY: { md: 'auto' },
          bgcolor: 'background.default',
        }}>
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
