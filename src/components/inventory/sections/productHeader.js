import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';

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

const ProductHeader = ({ product, coverThumbUrl, onBack, onEdit, onAddVariant }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = STONE_ACCENT[product?.stoneType] || '#888';

  const unitEntries = Object.entries(product?.totalsByUnit || {}).filter(([, qty]) => qty > 0);
  const coverUrl = coverThumbUrl || null;

  return (
    <Box>
      {/* Back + Edit row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton size="small" onClick={onBack} sx={{ mr: 0.5 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </IconButton>
        <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
          Inventory
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon sx={{ fontSize: 14 }} />}
          onClick={onEdit}
          sx={{ borderRadius: 2, fontSize: '0.75rem' }}
        >
          Edit
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={onAddVariant}
          sx={{ borderRadius: 2, fontSize: '0.75rem' }}
        >
          + Add variant
        </Button>
      </Box>

      {/* Card with accent bar + cover */}
      <Box
        sx={{
          display: 'flex',
          gap: 0,
          border: '1.5px solid',
          borderColor: 'divider',
          borderRadius: '14px',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          mb: 3,
        }}
      >
        {/* Left accent bar */}
        <Box sx={{ width: 5, flexShrink: 0, bgcolor: accent }} />

        {/* Cover image */}
        <Box
          sx={{
            width: { xs: 100, sm: 140 },
            flexShrink: 0,
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 110,
          }}
        >
          {coverUrl ? (
            <Box
              component="img"
              src={coverUrl}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <ImageIcon sx={{ color: 'text.disabled', fontSize: 36 }} />
          )}
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0, px: 2.5, py: 2 }}>
          {/* Code + stone type */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 800, fontFamily: 'monospace', letterSpacing: 1 }}
            >
              {product?.code}
            </Typography>
            <Chip
              label={product?.stoneTypeName || product?.stoneType}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 600,
                bgcolor: accent + (isDark ? '33' : '22'),
                color: accent,
                border: 'none',
              }}
            />
            {product?.status === 'archived' && (
              <Chip
                label="Archived"
                size="small"
                sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'action.disabledBackground' }}
              />
            )}
          </Box>

          {/* Name */}
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.25 }}>
            {product?.name || product?.quarryName || '—'}
          </Typography>
          {product?.quarryName && product?.name && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              {product.quarryName}
            </Typography>
          )}

          {/* Aggregate qty chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {unitEntries.length > 0 ? (
              unitEntries.map(([unit, qty]) => (
                <Chip
                  key={unit}
                  label={`${formatQty(qty)} ${UNIT_LABELS[unit] || unit}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
                />
              ))
            ) : (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>No stock</Typography>
            )}

            {product?.priceRange?.min != null && (
              <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                {product.priceRange.min === product.priceRange.max
                  ? `${product.priceRange.min} AED`
                  : `${product.priceRange.min}–${product.priceRange.max} AED`}
              </Typography>
            )}

            <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto' }}>
              {product?.variantCount ?? 0} variant{product?.variantCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProductHeader;
