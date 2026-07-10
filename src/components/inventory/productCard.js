import { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ImageIcon from '@mui/icons-material/Image';
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch } from 'react-redux';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { actions, fetchVariants } from '../../store/store';

const STONE_ACCENT = {
  TR: '#c49a6c', MA: '#90afc5', GR: '#7a7a7a', ON: '#c9a84c',
  QU: '#6fa46f', LI: '#b8a882', BA: '#555555', AL: '#d6c4b0',
  CR: '#90c8d8', AN: '#8b7c65', TO: '#c49a6c', TM: '#9b8fa0', OT: '#888888',
};
const UNIT_LABELS  = { M2: 'm²', ML: 'ml', PCS: 'pcs', SQFT: 'ft²', LNFT: 'lnft' };
const GRADE_COLOR  = { Q: '#c49a6c', QS: '#c49a6c', W: '#90afc5', E: '#6fa46f', R: '#aaaaaa', T: '#888888' };

function formatQty(num) {
  if (num == null) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(num);
}

// Mini variant row shown inside the accordion
function MiniVariantRow({ variant }) {
  const spec = variant.spec || {};
  const gc = GRADE_COLOR[spec.grade] || '#888';
  const dims = spec.unsized
    ? `${spec.thicknessMm}mm`
    : `${spec.lengthCm}×${spec.widthCm}cm·${spec.thicknessMm}mm`;
  const finish = [spec.cut, spec.fill, spec.finish].filter(Boolean).join('/');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 2, minWidth: 0 }}>
      <Typography variant="caption"
        sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0, maxWidth: { xs: 140, sm: 'none' } }}
        noWrap>
        {variant.code}
      </Typography>
      <Chip label={spec.grade || '?'} size="small"
        sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: gc + '22', color: gc, border: 'none', px: 0.25, flexShrink: 0 }} />
      <Typography variant="caption"
        sx={{ color: 'text.secondary', fontSize: '0.7rem', display: { xs: 'none', sm: 'block' }, flex: 1 }} noWrap>
        {dims}
      </Typography>
      {finish && (
        <Typography variant="caption"
          sx={{ color: 'text.disabled', fontSize: '0.68rem', display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
          {finish}
        </Typography>
      )}
      <Typography variant="caption" sx={{ fontWeight: 600, ml: 'auto', flexShrink: 0 }}>
        {formatQty(variant.quantity)} {UNIT_LABELS[variant.unit] || variant.unit}
      </Typography>
    </Box>
  );
}

const ProductCard = ({ product, onClick, apiBase, selected }) => {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const accent = STONE_ACCENT[product.stoneType] || '#888';
  const thumbUrl = product.coverThumbnail && apiBase
    ? `${apiBase}/uploads/${product.coverThumbnail}`
    : null;

  const unitEntries = Object.entries(product.totalsByUnit || {}).filter(([, qty]) => qty > 0);

  // Three-dot menu
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Accordion for variants
  const [expanded,       setExpanded]       = useState(false);
  const [variantList,    setVariantList]    = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const handleExpandToggle = async (e) => {
    e.stopPropagation();
    if (!expanded && variantList.length === 0) {
      setVariantsLoading(true);
      try {
        const res = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/inventory/products/${product._id}/variants`,
        });
        setVariantList((res.data.data || []).filter((v) => !v.deleteDate && v.status !== 'archived'));
      } catch { /* silently fail */ }
      finally { setVariantsLoading(false); }
    }
    setExpanded((prev) => !prev);
  };

  const handleMenuOpen  = (e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); };
  const handleMenuClose = (e) => { e?.stopPropagation(); setMenuAnchor(null); };

  const handleEdit = (e) => {
    e.stopPropagation();
    handleMenuClose();
    dispatch(actions.invSetEditProduct(product));
  };

  return (
    <Box
      sx={{
        border: '1.5px solid', borderColor: selected ? 'text.primary' : 'divider', borderRadius: '14px',
        overflow: 'hidden', bgcolor: 'background.paper',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: selected ? 'text.primary' : 'text.disabled' },
      }}
    >
      {/* Main card row */}
      <Box
        onClick={onClick}
        sx={{ display: 'flex', alignItems: 'stretch', cursor: 'pointer' }}
      >
        {/* Stone-type accent bar */}
        <Box sx={{ width: 4, flexShrink: 0, bgcolor: accent }} />

        {/* Cover thumbnail — alignSelf:stretch (not height:100%) so the image
            area always fills the card's real height, placeholder included */}
        <Box
          sx={{
            width: 72, alignSelf: 'stretch', flexShrink: 0,
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {thumbUrl ? (
            <Box component="img" src={thumbUrl} alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <ImageIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
          )}
        </Box>

        {/* Main content */}
        <Box sx={{ flex: 1, minWidth: 0, px: 2, py: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
            <Typography variant="body2"
              sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem', letterSpacing: 0.5 }}>
              {product.code}
            </Typography>
            <Chip label={product.stoneTypeName || product.stoneType} size="small"
              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600,
                bgcolor: accent + (isDark ? '33' : '22'), color: accent, border: 'none' }} />
          </Box>
          <Typography variant="body2"
            sx={{ color: 'text.primary', fontWeight: 500, lineHeight: 1.3 }} noWrap>
            {product.name || product.quarryName || '—'}
          </Typography>
          {product.quarryName && product.name && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{product.quarryName}</Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
            {unitEntries.length > 0
              ? unitEntries.map(([unit, qty]) => (
                  <Chip key={unit} label={`${formatQty(qty)} ${UNIT_LABELS[unit] || unit}`}
                    size="small" variant="outlined"
                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 500 }} />
                ))
              : <Typography variant="caption" sx={{ color: 'text.disabled' }}>No stock</Typography>
            }
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              {product.priceRange?.min != null && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {product.priceRange.min === product.priceRange.max
                    ? `${product.priceRange.min} AED`
                    : `${product.priceRange.min}–${product.priceRange.max} AED`}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {product.variantCount ?? 0} variant{product.variantCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', pr: 0.5, gap: 0.25 }}
          onClick={(e) => e.stopPropagation()}>
          {/* Expand toggle */}
          <IconButton size="small" onClick={handleExpandToggle} title="Show variants">
            {variantsLoading
              ? <CircularProgress size={14} />
              : expanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />
            }
          </IconButton>
          {/* Three-dot menu */}
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
          {/* Arrow to detail */}
          <IconButton size="small" onClick={onClick} title="Open detail">
            <ArrowForwardIosIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
          </IconButton>
        </Box>
      </Box>

      {/* Accordion: variant mini-list */}
      <Collapse in={expanded} timeout="auto">
        <Divider />
        {variantList.length === 0 && !variantsLoading ? (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>No variants</Typography>
          </Box>
        ) : (
          variantList.map((v, i) => (
            <Box key={v._id}>
              <MiniVariantRow variant={v} />
              {i < variantList.length - 1 && <Divider />}
            </Box>
          ))
        )}
      </Collapse>

      {/* Three-dot quick action menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 160 } }}>
        <MenuItem onClick={handleEdit} dense>
          <EditIcon sx={{ fontSize: 15, mr: 1.5, color: 'text.secondary' }} />
          Edit product
        </MenuItem>
        <MenuItem onClick={(e) => { e.stopPropagation(); handleMenuClose(); onClick(); }} dense>
          <ArrowForwardIosIcon sx={{ fontSize: 13, mr: 1.5, color: 'text.secondary' }} />
          Open detail
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProductCard;
