import { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch } from 'react-redux';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { adjustStock, updatePrice, actions } from '../../../store/store';

const UNIT_LABELS = { M2: 'm²', ML: 'ml', PCS: 'pcs', SQFT: 'ft²', LNFT: 'lnft' };
const CUT_LABEL   = { V: 'V', C: 'C' };
const FILL_LABEL  = { F: 'F', U: 'U' };
const FINISH_LABEL = { P: 'P', H: 'H' };
const GRADE_COLOR = { Q: '#c49a6c', QS: '#c49a6c', W: '#90afc5', E: '#6fa46f', R: '#aaaaaa', T: '#888888' };

function formatQty(n) {
  if (n == null) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

function FinishChips({ cut, fill, finish }) {
  const parts = [
    cut    ? (CUT_LABEL[cut] || cut)       : null,
    fill   ? (FILL_LABEL[fill] || fill)    : null,
    finish ? (FINISH_LABEL[finish] || finish) : null,
  ].filter(Boolean);
  if (!parts.length) return <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>;
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {parts.map((p) => (
        <Chip key={p} label={p} size="small"
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, px: 0.5 }} />
      ))}
    </Box>
  );
}

// ── Stock Adjust Dialog ────────────────────────────────────────────────────────
function StockDialog({ open, variant, productId, onClose }) {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const [delta, setDelta]   = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy]     = useState(false);

  const handleSubmit = async () => {
    const parsed = parseFloat(delta);
    if (isNaN(parsed) || parsed === 0) return;
    setBusy(true);
    try {
      await dispatch(adjustStock({ authCtx, axiosGlobal, id: variant._id, productId, delta: parsed, reason })).unwrap();
      onClose();
    } catch {
      // snackBar wired in thunk
    } finally {
      setBusy(false);
      setDelta('');
      setReason('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>
        Adjust stock — {variant?.code}
      </DialogTitle>
      <DialogContent>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Current: {formatQty(variant?.quantity)} {UNIT_LABELS[variant?.unit] || variant?.unit}
        </Typography>
        <TextField
          label="Delta (+ add / − remove)"
          type="number"
          fullWidth size="small"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          sx={{ mb: 2 }}
          helperText="Negative value to remove stock"
        />
        <TextField
          label="Reason (optional)"
          fullWidth size="small"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. sale, return, correction"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={busy || delta === '' || parseFloat(delta) === 0}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Price Edit Dialog ──────────────────────────────────────────────────────────
function PriceDialog({ open, variant, productId, onClose }) {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const [price, setPrice] = useState('');
  const [busy, setBusy]   = useState(false);

  const handleSubmit = async () => {
    const parsed = parseFloat(price);
    if (isNaN(parsed) || parsed < 0) return;
    setBusy(true);
    try {
      await dispatch(updatePrice({ authCtx, axiosGlobal, id: variant._id, productId, price: parsed })).unwrap();
      onClose();
    } catch {
      // snackBar wired in thunk
    } finally {
      setBusy(false);
      setPrice('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>
        Edit price — {variant?.code}
      </DialogTitle>
      <DialogContent>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Current: {variant?.price != null ? `${variant.price} AED` : '—'}
        </Typography>
        <TextField
          label="New price (AED)"
          type="number"
          fullWidth size="small"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputProps={{ min: 0 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={busy || price === ''}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Variant Row ───────────────────────────────────────────────────────────────
function VariantRow({ variant, productId, isLast }) {
  const dispatch = useDispatch();
  const [stockOpen, setStockOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  const spec = variant.spec || {};
  const gradeColor = GRADE_COLOR[spec.grade] || '#888';

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr auto' },
          gap: { xs: 1, sm: 2 },
          alignItems: 'center',
          py: 1.5,
          px: 2,
        }}
      >
        {/* Code + spec */}
        <Box>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', letterSpacing: 0.5 }}
          >
            {variant.code}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={spec.gradeName || spec.grade || '?'}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700,
                bgcolor: gradeColor + '22', color: gradeColor, border: 'none', px: 0.5 }}
            />
            {!spec.unsized && spec.lengthCm != null && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {spec.lengthCm} × {spec.widthCm} cm · {spec.thicknessMm} mm
              </Typography>
            )}
            {spec.unsized && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {spec.thicknessMm} mm slab
              </Typography>
            )}
          </Box>
          <Box sx={{ mt: 0.5 }}>
            <FinishChips cut={spec.cut} fill={spec.fill} finish={spec.finish} />
          </Box>
        </Box>

        {/* Unit */}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {UNIT_LABELS[variant.unit] || variant.unit}
        </Typography>

        {/* Quantity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatQty(variant.quantity)}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <IconButton
              size="small"
              sx={{ p: 0.25 }}
              onClick={() => setStockOpen(true)}
              title="Adjust stock"
            >
              <AddCircleOutlineIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2">
            {variant.price != null ? `${variant.price} AED` : '—'}
          </Typography>
          <IconButton size="small" sx={{ p: 0.25 }} onClick={() => setPriceOpen(true)} title="Edit price">
            <EditIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => dispatch(actions.invSetEditVariant(variant))}
            title="Edit variant"
          >
            <EditIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      </Box>

      {!isLast && <Divider />}

      <StockDialog open={stockOpen} variant={variant} productId={productId} onClose={() => setStockOpen(false)} />
      <PriceDialog open={priceOpen} variant={variant} productId={productId} onClose={() => setPriceOpen(false)} />
    </>
  );
}

// ── VariantsTable ─────────────────────────────────────────────────────────────
const VariantsTable = ({ variants, productId, onAddVariant }) => {
  const active = (variants || []).filter((v) => v.status !== 'archived' && !v.deleteDate);

  return (
    <Box
      sx={{
        border: '1.5px solid',
        borderColor: 'divider',
        borderRadius: '14px',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr auto' },
          gap: { xs: 1, sm: 2 },
          px: 2,
          py: 1,
          borderBottom: '1.5px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled' }}>
          Variant (SKU)
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}>
          Unit
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}>
          Qty
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}>
          Price
        </Typography>
        <Box />
      </Box>

      {/* Rows */}
      {active.length === 0 ? (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            No variants yet.
          </Typography>
          <Button size="small" variant="outlined" onClick={onAddVariant}>
            + Add first variant
          </Button>
        </Box>
      ) : (
        active.map((v, i) => (
          <VariantRow
            key={v._id}
            variant={v}
            productId={productId}
            isLast={i === active.length - 1}
          />
        ))
      )}

      {/* Footer add button */}
      {active.length > 0 && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1 }}>
            <Button
              size="small"
              startIcon={<AddCircleOutlineIcon sx={{ fontSize: 14 }} />}
              onClick={onAddVariant}
              sx={{ fontSize: '0.75rem' }}
            >
              Add variant
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default VariantsTable;
