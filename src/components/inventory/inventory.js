import { useContext, useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from 'react-redux';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import {
  fetchProducts,
  fetchInventoryLookups,
  actions,
} from '../../store/store';
import SkeletonWrapper from '../../tools/loader/skeletonWrapper';
import ProductCard from './productCard';
import ShowProduct from './showProduct';
import ProductForm from './productForm';

const Inventory = () => {
  const authCtx    = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch   = useDispatch();

  const invProducts    = useSelector((s) => s.invProducts);
  const invTotal       = useSelector((s) => s.invTotal);
  const invLoading     = useSelector((s) => s.invLoading);
  const invRefreshKey  = useSelector((s) => s.invRefreshKey);
  const invLookups     = useSelector((s) => s.invLookups);

  const [selectedProductId, setSelectedProductId] = useState(null);

  const [search, setSearch]           = useState('');
  const [stoneFilter, setStoneFilter] = useState('');   // '' = All

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch lookups once
  useEffect(() => {
    dispatch(fetchInventoryLookups({ authCtx, axiosGlobal }));
  }, []);

  // Fetch products when filters or refresh key change
  useEffect(() => {
    dispatch(fetchProducts({
      authCtx,
      axiosGlobal,
      params: {
        ...(stoneFilter && { stoneType: stoneFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
        limit: 100,
        sort: 'code',
        order: 'asc',
      },
    }));
  }, [stoneFilter, debouncedSearch, invRefreshKey]);

  const handleNewProduct = useCallback(() => {
    dispatch(actions.invToggleNewProduct());
  }, [dispatch]);

  // If a product is selected, render the detail page instead of the list
  if (selectedProductId) {
    return (
      <ShowProduct
        productId={selectedProductId}
        onBack={() => setSelectedProductId(null)}
      />
    );
  }

  // Simple stats derived from current page
  const uniqueStones = [...new Set(invProducts.map((p) => p.stoneType))].length;

  const stoneTypes = invLookups?.stoneTypes || [];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Inventory
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Stone &amp; marble product catalog
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={handleNewProduct}
          sx={{ borderRadius: 2 }}
        >
          New product
        </Button>
      </Box>

      {/* ── Stats strip ── */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          mb: 3,
          p: 2,
          border: '1.5px solid',
          borderColor: 'divider',
          borderRadius: '14px',
          bgcolor: 'background.paper',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {invTotal}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Varieties
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {uniqueStones}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Stone types
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {invProducts.reduce((acc, p) => acc + (p.variantCount || 0), 0)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            SKUs (variants)
          </Typography>
        </Box>
      </Box>

      {/* ── Search ── */}
      <TextField
        fullWidth
        size="small"
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
        sx={{ mb: 2 }}
      />

      {/* ── Stone-type filter pills ── */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip
          label="All"
          size="small"
          onClick={() => setStoneFilter('')}
          variant={stoneFilter === '' ? 'filled' : 'outlined'}
          sx={{ fontWeight: stoneFilter === '' ? 700 : 400 }}
        />
        {stoneTypes.map((st) => (
          <Chip
            key={st.code}
            label={st.name}
            size="small"
            onClick={() => setStoneFilter(stoneFilter === st.code ? '' : st.code)}
            variant={stoneFilter === st.code ? 'filled' : 'outlined'}
            sx={{ fontWeight: stoneFilter === st.code ? 700 : 400 }}
          />
        ))}
      </Box>

      {/* ── Product list ── */}
      <SkeletonWrapper loading={invLoading} variant="table" count={6}>
        {invProducts.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {search || stoneFilter ? 'No products match your filters.' : 'No products yet. Add the first one.'}
            </Typography>
            {!search && !stoneFilter && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                size="small"
                onClick={handleNewProduct}
                sx={{ mt: 2 }}
              >
                New product
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {invProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onClick={() => setSelectedProductId(product._id)}
              />
            ))}
          </Box>
        )}
      </SkeletonWrapper>

      {/* Product form (new/edit) — always rendered so it can open from Redux state */}
      <ProductForm />
    </Box>
  );
};

export default Inventory;
