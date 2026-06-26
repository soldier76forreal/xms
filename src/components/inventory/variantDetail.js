import { useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';

const UNIT_LABELS   = { M2: 'm²', ML: 'ml', PCS: 'pcs', SQFT: 'ft²', LNFT: 'lnft' };
const GRADE_COLOR   = { Q: '#c49a6c', QS: '#c49a6c', W: '#90afc5', E: '#6fa46f', R: '#aaaaaa', T: '#888888' };
const CUT_LABEL     = { V: 'Veincut', C: 'Crosscut' };
const FILL_LABEL    = { F: 'Filled', U: 'Unfilled' };
const FINISH_LABEL  = { P: 'Polished', H: 'Honed' };

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
  const dispatch = useDispatch();
  const open    = useSelector((s) => s.invShowVariantDetail);
  const variant = useSelector((s) => s.invCurrentVariant);

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
    ? `Unsized slab — ${spec.thicknessMm} mm thick`
    : `${spec.lengthCm} × ${spec.widthCm} cm · ${spec.thicknessMm} mm thick`;

  const finishParts = [
    spec.cut    ? (CUT_LABEL[spec.cut]     || spec.cut)    : null,
    spec.fill   ? (FILL_LABEL[spec.fill]   || spec.fill)   : null,
    spec.finish ? (FINISH_LABEL[spec.finish] || spec.finish) : null,
  ].filter(Boolean);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700, fontSize: '1rem' }}>
        Variant detail
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
            <Chip label="Archived" size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'action.disabledBackground' }} />
          )}
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Row label="Stone"       value={spec.stoneTypeName || spec.stoneType} />
          <Row label="Quarry"      value={spec.quarryCode} />
          <Row label="Dimensions"  value={dims} />
          <Row label="Grade"       value={spec.gradeName ? `${spec.grade} — ${spec.gradeName}` : spec.grade} />
          <Row label="Cut"         value={spec.cutName || spec.cut} />
          <Row label="Fill"        value={spec.fillName || spec.fill} />
          <Row label="Finish"      value={spec.finishName || spec.finish} />
          <Row label="Raw code"    value={spec.raw} />
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
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>Quantity</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formatQty(variant.quantity)} {UNIT_LABELS[variant.unit] || variant.unit}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>Price</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {variant.price != null ? `${variant.price} AED` : '—'}
            </Typography>
          </Box>
        </Box>

        {variant.categories?.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}>Categories</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {variant.categories.map((cat) => (
                <Chip key={typeof cat === 'object' ? cat._id : cat}
                  label={typeof cat === 'object' ? cat.name : cat}
                  size="small" variant="outlined" sx={{ height: 22, fontSize: '0.72rem' }} />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} size="small">Close</Button>
        <Button onClick={handleEdit} variant="outlined" size="small" startIcon={<span style={{ fontSize: 12 }}>✎</span>}>
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariantDetail;
