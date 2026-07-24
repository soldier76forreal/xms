import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';
import VariantMediaBatch from './sections/variantMediaBatch';
import ChangeLog from './sections/changeLog';

const UNIT_LABELS   = { M2: 'm²', ML: 'ml', PCS: 'pcs', SQFT: 'ft²', LNFT: 'lnft' };
const GRADE_COLOR   = { Q: '#c49a6c', QS: '#c49a6c', W: '#90afc5', E: '#6fa46f', R: '#aaaaaa', T: '#888888' };
const CUT_LABEL_KEYS    = { V: 'inventory.cutVeincut',    C: 'inventory.cutCrosscut' };
const FILL_LABEL_KEYS   = { F: 'inventory.fillFilled',    U: 'inventory.fillUnfilled' };
const FINISH_LABEL_KEYS = { P: 'inventory.finishPolished', H: 'inventory.finishHoned' };

function formatQty(n) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n ?? 0);
}

function Row({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
      <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 110, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

const VariantDetail = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const open     = useSelector((s) => s.invShowVariantDetail);
  const variant  = useSelector((s) => s.invCurrentVariant);
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClose = useCallback(() => {
    dispatch(actions.invToggleVariantDetail());
  }, [dispatch]);

  const handleEdit = () => {
    dispatch(actions.invSetEditVariant(variant));
    dispatch(actions.invToggleVariantDetail());
    dispatch(actions.invToggleNewVariant());
  };

  if (!variant) return null;

  const spec = variant.spec || {};
  const gradeColor = GRADE_COLOR[spec.grade] || '#888';

  const dims = spec.unsized
    ? t('inventory.unsizedSlabThick', { mm: spec.thicknessMm })
    : t('inventory.dimsThick', { l: spec.lengthCm, w: spec.widthCm, t: spec.thicknessMm });

  const cutLabel    = spec.cut    ? (CUT_LABEL_KEYS[spec.cut]       ? t(CUT_LABEL_KEYS[spec.cut])       : (spec.cutName || spec.cut))    : null;
  const fillLabel   = spec.fill   ? (FILL_LABEL_KEYS[spec.fill]     ? t(FILL_LABEL_KEYS[spec.fill])     : (spec.fillName || spec.fill))   : null;
  const finishLabel = spec.finish ? (FINISH_LABEL_KEYS[spec.finish] ? t(FINISH_LABEL_KEYS[spec.finish]) : (spec.finishName || spec.finish)) : null;

  const finishParts = [cutLabel, fillLabel, finishLabel].filter(Boolean);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700, fontSize: '1rem',
        display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="span" sx={{ flexGrow: 1 }}>{t('inventory.variantDetailTitle')}</Box>
        <IconButton size="small" onClick={handleClose} aria-label={t('common.close')}
          sx={{ color: 'text.secondary' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 1.5, pt: '4px !important' }}>
        {/* Code */}
        <Typography
          variant="h6"
          sx={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: 1.5, fontSize: '1.1rem' }}
        >
          {variant.code}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
          <Chip label={spec.gradeName || spec.grade || '?'} size="small"
            sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700,
              bgcolor: gradeColor + '22', color: gradeColor, border: 'none' }} />
          {finishParts.map((f) => (
            <Chip key={f} label={f} size="small" variant="outlined"
              sx={{ height: 22, fontSize: '0.72rem' }} />
          ))}
          {variant.status === 'archived' && (
            <Chip label={t('inventory.archived')} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'action.disabledBackground' }} />
          )}
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Row label={t('inventory.stoneLabel')}       value={spec.stoneTypeName || spec.stoneType} />
          <Row label={t('inventory.quarryLabel')}      value={spec.quarryCode} />
          <Row label={t('inventory.dimensionsLabel')}  value={dims} />
          <Row label={t('inventory.gradeLabel')}       value={spec.gradeName ? `${spec.grade} — ${spec.gradeName}` : spec.grade} />
          <Row label={t('inventory.cutLabel')}         value={cutLabel} />
          <Row label={t('inventory.fillLabel')}        value={fillLabel} />
          <Row label={t('inventory.finishLabel')}      value={finishLabel} />
          <Row label={t('inventory.rawCodeLabel')}     value={spec.raw} />
        </Box>

        {spec.parseWarnings?.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {spec.parseWarnings.map((w, i) => (
              <Typography key={i} variant="caption" sx={{ color: 'warning.main', fontSize: '0.7rem' }}>
                ⚠ {w}
              </Typography>
            ))}
          </Box>
        )}

        <Divider />

        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>{t('inventory.quantityLabel')}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formatQty(variant.quantity)} {UNIT_LABELS[variant.unit] || variant.unit}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>{t('inventory.priceLabel')}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {variant.price != null ? `${variant.price} AED` : '—'}
            </Typography>
          </Box>
        </Box>

        {variant.categories?.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}>{t('inventory.categoriesLabel')}</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {variant.categories.map((cat) => (
                <Chip key={typeof cat === 'object' ? cat._id : cat}
                  label={typeof cat === 'object' ? cat.name : cat}
                  size="small" variant="outlined" sx={{ height: 22, fontSize: '0.72rem' }} />
              ))}
            </Box>
          </Box>
        )}

        <VariantMediaBatch variantId={variant._id} productId={variant.productId} variantCode={variant.code} />

        {/* This SKU's own change history — quantity/price/spec/status/media/import */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('inventory.historyLabel')}
          </Typography>
          <ChangeLog variantId={variant._id} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} size="small">{t('common.close')}</Button>
        <Button onClick={handleEdit} variant="outlined" size="small" startIcon={<span style={{ fontSize: 12 }}>✎</span>}>
          {t('common.edit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariantDetail;
