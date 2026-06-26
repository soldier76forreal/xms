import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ImageIcon from '@mui/icons-material/Image';

// Accent color per stone type (used as a subtle left border)
const STONE_ACCENT = {
  TR: '#c49a6c', MA: '#90afc5', GR: '#7a7a7a', ON: '#c9a84c',
  QU: '#6fa46f', LI: '#b8a882', BA: '#555555', AL: '#d6c4b0',
  CR: '#90c8d8', AN: '#8b7c65', TO: '#c49a6c', TM: '#9b8fa0', OT: '#888888',
};

const UNIT_LABELS = { M2: 'm²', ML: 'ml', PCS: 'pcs', SQFT: 'ft²', LNFT: 'lnft' };

function formatQty(num) {
  if (num == null) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(num);
}

const ProductCard = ({ product, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = STONE_ACCENT[product.stoneType] || '#888';

  const unitEntries = Object.entries(product.totalsByUnit || {}).filter(([, qty]) => qty > 0);

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        border: '1.5px solid',
        borderColor: 'divider',
        borderRadius: '14px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'text.primary' },
        bgcolor: 'background.paper',
      }}
    >
      {/* Stone-type accent bar */}
      <Box sx={{ width: 4, flexShrink: 0, bgcolor: accent }} />

      {/* Cover thumbnail */}
      <Box
        sx={{
          width: 72,
          flexShrink: 0,
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {product.coverMediaId ? (
          <Box
            component="img"
            src={`/uploads/thumb-${product.coverMediaId}`}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <ImageIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
        )}
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, minWidth: 0, px: 2, py: 1.5 }}>
        {/* Top row: code + stone type chip */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem', letterSpacing: 0.5 }}
          >
            {product.code}
          </Typography>
          <Chip
            label={product.stoneTypeName || product.stoneType}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: accent + (isDark ? '33' : '22'),
              color: accent,
              border: 'none',
            }}
          />
        </Box>

        {/* Name + quarry */}
        <Typography
          variant="body2"
          sx={{ color: 'text.primary', fontWeight: 500, mb: 0.25, lineHeight: 1.3 }}
          noWrap
        >
          {product.name || product.quarryName || '—'}
        </Typography>
        {product.quarryName && product.name && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {product.quarryName}
          </Typography>
        )}

        {/* Bottom row: qty per unit + variant count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {unitEntries.length > 0 ? (
            unitEntries.map(([unit, qty]) => (
              <Chip
                key={unit}
                label={`${formatQty(qty)} ${UNIT_LABELS[unit] || unit}`}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 500 }}
              />
            ))
          ) : (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              No stock
            </Typography>
          )}

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

      {/* Arrow */}
      <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5, color: 'text.disabled' }}>
        <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
      </Box>
    </Box>
  );
};

export default ProductCard;
