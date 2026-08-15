import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import CopyLinkButton from '../../main/copyLinkButton';

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

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

const ProductHeader = ({ product, coverThumbUrl, onBack, onEdit, onAddVariant, fullView, onToggleFullView }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = STONE_ACCENT[product?.stoneType] || '#888';

  const unitEntries = Object.entries(product?.totalsByUnit || {}).filter(([, qty]) => qty > 0);
  const coverUrl = coverThumbUrl || null;

  return (
    <Box>
      {/* Back + Edit row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'nowrap' }}>
        <IconButton size="small" onClick={onBack} sx={{ mr: 0.5, flexShrink: 0 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </IconButton>
        <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1, minWidth: 0 }} noWrap>
          {t('nav.inventory')}
        </Typography>
        <CopyLinkButton module="inventory" entityType="product" entityId={product?._id} />
        {onToggleFullView && (
          <Tooltip title={fullView ? t('inventory.collapseToSidebar') : t('inventory.openInFullView')}>
            <IconButton
              size="small"
              onClick={onToggleFullView}
              sx={{ display: { xs: 'none', md: 'inline-flex' }, flexShrink: 0 }}
            >
              {fullView
                ? <CloseFullscreenIcon sx={{ fontSize: 14 }} />
                : <OpenInFullIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          </Tooltip>
        )}
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon sx={{ fontSize: 14 }} />}
          onClick={onEdit}
          sx={{ borderRadius: 2, fontSize: '0.75rem', flexShrink: 0 }}
        >
          {t('common.edit')}
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={onAddVariant}
          sx={{ borderRadius: 2, fontSize: '0.75rem', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{t('inventory.addVariantFull')}</Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{t('inventory.addVariantShort')}</Box>
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
            height: '100%',
            maxHeight: 105,
            flexShrink: 0,
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {coverUrl ? (
            <Box
              component="img"
              src={coverUrl}
              alt=""
              sx={{ width: '100%', height: '100%', maxHeight: 105, objectFit: 'cover' }}
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
                label={t('inventory.archived')}
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
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>{t('inventory.noStock')}</Typography>
            )}

            {product?.priceRange?.min != null && (
              <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                {product.priceRange.min === product.priceRange.max
                  ? `${product.priceRange.min} AED`
                  : `${product.priceRange.min}–${product.priceRange.max} AED`}
              </Typography>
            )}

            <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto' }}>
              {t('inventory.variantCount', { count: product?.variantCount ?? 0 })}
            </Typography>
          </Box>

          {(product?.updateDate || product?.insertDate) && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
              {product?.updateDate ? t('inventory.lastUpdatedPrefix') : t('inventory.addedPrefix')}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {formatDate(product?.updateDate || product?.insertDate)}
              </Box>
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProductHeader;
