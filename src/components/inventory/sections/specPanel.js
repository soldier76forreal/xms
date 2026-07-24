import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';

const UNIT_LABELS = { M2: 'm²', ML: 'ml', PCS: 'pcs', SQFT: 'ft²', LNFT: 'lnft' };
const GRADE_COLOR = { Q: '#c49a6c', QS: '#c49a6c', W: '#90afc5', E: '#6fa46f', R: '#aaaaaa', T: '#888888' };

function formatQty(n) {
  if (n == null) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n);
}

function SpecRow({ label, children }) {
  if (!children) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.5 }}>
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', minWidth: 110, flexShrink: 0, pt: 0.3, lineHeight: 1.6 }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

const SpecPanel = ({ product, variants }) => {
  const { t } = useTranslation();
  if (!product) return null;

  const activeVariants = (variants || []).filter((v) => !v.deleteDate && v.status !== 'archived');

  // Unique dimensions across all active variants
  const dimMap = new Map();
  for (const v of activeVariants) {
    const s = v.spec;
    if (!s) continue;
    if (s.unsized) {
      dimMap.set(`slab-${s.thicknessMm}`, { unsized: true, thicknessMm: s.thicknessMm });
    } else if (s.lengthCm != null && s.widthCm != null && s.thicknessMm != null) {
      dimMap.set(`${s.lengthCm}-${s.widthCm}-${s.thicknessMm}`, {
        lengthCm: s.lengthCm, widthCm: s.widthCm, thicknessMm: s.thicknessMm,
      });
    }
  }
  const dims = [...dimMap.values()].sort((a, b) =>
    (b.lengthCm || 0) - (a.lengthCm || 0)
  );

  // Unique grades across all active variants
  const gradeMap = new Map();
  for (const v of activeVariants) {
    const s = v.spec;
    if (s?.grade) gradeMap.set(s.grade, s.gradeName || s.grade);
  }
  const grades = [...gradeMap.entries()];

  // Overall quantities (pre-computed rollup on product)
  const unitEntries = Object.entries(product.totalsByUnit || {}).filter(([, qty]) => qty > 0);

  return (
    <Box
      sx={{
        border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
        bgcolor: 'background.paper', p: 2.5, mb: 3,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'text.disabled', display: 'block', mb: 1.5 }}
      >
        {t('inventory.specification')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>

        {/* Identity */}
        <SpecRow label={t('inventory.productCodeLabel')}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 0.5 }}>
            {product.code}
          </Typography>
        </SpecRow>

        {product.name && (
          <SpecRow label={t('inventory.nameLabel')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{product.name}</Typography>
          </SpecRow>
        )}

        {product.nameAr && (
          <SpecRow label={t('inventory.arabicNameLabel')}>
            <Typography variant="body2" sx={{ fontWeight: 500, direction: 'rtl' }}>
              {product.nameAr}
            </Typography>
          </SpecRow>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Stock */}
        <SpecRow label={t('inventory.overallQtyLabel')}>
          {unitEntries.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {unitEntries.map(([unit, qty]) => (
                <Chip
                  key={unit}
                  size="small"
                  variant="outlined"
                  label={`${formatQty(qty)} ${UNIT_LABELS[unit] || unit}`}
                  sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>{t('inventory.noStock')}</Typography>
          )}
        </SpecRow>

        {/* Dimensions */}
        {dims.length > 0 && (
          <SpecRow label={t('inventory.dimensionsLabel')}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {dims.map((d, i) => (
                <Chip
                  key={i}
                  size="small"
                  label={
                    d.unsized
                      ? t('inventory.slabThickness', { mm: d.thicknessMm })
                      : `${d.lengthCm} × ${d.widthCm} cm · ${d.thicknessMm} mm`
                  }
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </SpecRow>
        )}

        {/* Qualities */}
        {grades.length > 0 && (
          <SpecRow label={t('inventory.qualitiesLabel')}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {grades.map(([grade, gradeName]) => {
                const color = GRADE_COLOR[grade] || '#888';
                return (
                  <Chip
                    key={grade}
                    size="small"
                    label={`${grade} — ${gradeName}`}
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: color + '22', color, border: 'none' }}
                  />
                );
              })}
            </Box>
          </SpecRow>
        )}

        {/* Category */}
        {product.category && (
          <SpecRow label={t('inventory.categoryLabel')}>
            <Chip
              size="small"
              label={product.category}
              sx={{ height: 22, fontSize: '0.72rem' }}
            />
          </SpecRow>
        )}

      </Box>
    </Box>
  );
};

export default SpecPanel;
