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
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useDispatch } from 'react-redux';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { adjustStock, updatePrice, deleteVariant, actions } from '../../../store/store';

const UNIT_LABELS   = { M2: 'm²', ML: 'ml', PCS: 'pcs', SQFT: 'ft²', LNFT: 'lnft' };
const GRADE_COLOR   = { Q: '#c49a6c', QS: '#c49a6c', W: '#90afc5', E: '#6fa46f', R: '#aaaaaa', T: '#888888' };
const CUT_LABEL     = { V: 'V', C: 'C' };
const FILL_LABEL    = { F: 'F', U: 'U' };
const FINISH_LABEL  = { P: 'P', H: 'H' };

function formatQty(n) {
  if (n == null) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

function FinishChips({ cut, fill, finish }) {
  const parts = [
    cut    ? (CUT_LABEL[cut]     || cut)    : null,
    fill   ? (FILL_LABEL[fill]   || fill)   : null,
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

// ── Delete Confirm Dialog ──────────────────────────────────────────────────────
function DeleteConfirmDialog({ open, count, onConfirm, onClose, busy }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700, fontSize: '1rem' }}>
        Delete {count > 1 ? `${count} variants` : 'variant'}?
      </DialogTitle>
      <DialogContent sx={{ px: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          This will archive the {count > 1 ? 'selected variants' : 'variant'} and remove their stock from the product rollup. This action can be reversed by contacting admin.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} size="small" disabled={busy}>Cancel</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          size="small"
          color="error"
          disabled={busy}
          startIcon={busy ? <CircularProgress size={12} color="inherit" /> : <DeleteIcon sx={{ fontSize: 14 }} />}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
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
    } finally {
      setBusy(false);
      setDelta('');
      setReason('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700, fontSize: '1rem' }}>
        Adjust stock — {variant?.code}
      </DialogTitle>
      <DialogContent sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Current: {formatQty(variant?.quantity)} {UNIT_LABELS[variant?.unit] || variant?.unit}
        </Typography>
        <TextField label="Delta (+ add / − remove)" type="number" fullWidth size="small"
          value={delta} onChange={(e) => setDelta(e.target.value)} helperText="Use negative to remove" />
        <TextField label="Reason (optional)" fullWidth size="small"
          value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. sale, return, correction" />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" size="small"
          disabled={busy || delta === '' || parseFloat(delta) === 0}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Price Dialog ───────────────────────────────────────────────────────────────
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
    } finally {
      setBusy(false);
      setPrice('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700, fontSize: '1rem' }}>
        Edit price — {variant?.code}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pt: '12px !important' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
          Current: {variant?.price != null ? `${variant.price} AED` : '—'}
        </Typography>
        <TextField label="New price (AED)" type="number" fullWidth size="small"
          value={price} onChange={(e) => setPrice(e.target.value)} inputProps={{ min: 0 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" size="small" disabled={busy || price === ''}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Variant Row ───────────────────────────────────────────────────────────────
function VariantRow({ variant, productId, isLast, selected, onSelect, onDeleteSingle }) {
  const dispatch = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const [stockOpen, setStockOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  const spec = variant.spec || {};
  const gradeColor = GRADE_COLOR[spec.grade] || '#888';

  const handleViewDetail = () => {
    dispatch(actions.invSetCurrentVariant(variant));
    dispatch(actions.invToggleVariantDetail());
  };

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '32px 2.5fr 0.8fr 1fr 1fr auto' },
          gap: { xs: 1, sm: 1.5 },
          alignItems: 'center',
          py: 1.5,
          px: 2,
          '&:hover': { bgcolor: 'action.hover' },
          transition: 'background 0.1s',
        }}
      >
        {/* Checkbox */}
        <Checkbox size="small" checked={selected} onChange={() => onSelect(variant._id)}
          sx={{ p: 0.25 }} />

        {/* Code + spec */}
        <Box>
          <Typography variant="body2"
            sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', letterSpacing: 0.5 }}>
            {variant.code}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip label={spec.gradeName || spec.grade || '?'} size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700,
                bgcolor: gradeColor + '22', color: gradeColor, border: 'none', px: 0.5 }} />
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
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatQty(variant.quantity)}</Typography>
          <Tooltip title="Adjust stock">
            <IconButton size="small" sx={{ p: 0.25 }} onClick={() => setStockOpen(true)}>
              <AddCircleOutlineIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2">
            {variant.price != null ? `${variant.price} AED` : '—'}
          </Typography>
          <Tooltip title="Edit price">
            <IconButton size="small" sx={{ p: 0.25 }} onClick={() => setPriceOpen(true)}>
              <EditIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Row actions */}
        <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
          <Tooltip title="View details">
            <IconButton size="small" onClick={handleViewDetail}>
              <OpenInNewIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit variant">
            <IconButton size="small" onClick={() => dispatch(actions.invSetEditVariant(variant))}>
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete variant">
            <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => onDeleteSingle(variant)}>
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
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
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const active = (variants || []).filter((v) => v.status !== 'archived' && !v.deleteDate);

  const [selected,     setSelected]     = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // single variant or 'bulk'
  const [deleteBusy,   setDeleteBusy]   = useState(false);

  const toggleSelect = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(selected.length === active.length ? [] : active.map((v) => v._id));

  const handleDeleteSingle = (variant) => setDeleteTarget({ ids: [variant._id], label: variant.code });
  const handleDeleteBulk   = () => setDeleteTarget({ ids: selected, label: `${selected.length} variants` });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      for (const id of deleteTarget.ids) {
        await dispatch(deleteVariant({ authCtx, axiosGlobal, id, productId })).unwrap();
      }
      setSelected([]);
    } finally {
      setDeleteBusy(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Box sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
      bgcolor: 'background.paper', overflow: 'hidden', mb: 3 }}>

      {/* Table header */}
      <Box sx={{ display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '32px 2.5fr 0.8fr 1fr 1fr auto' },
        gap: { xs: 1, sm: 1.5 }, px: 2, py: 1,
        borderBottom: '1.5px solid', borderColor: 'divider',
        alignItems: 'center' }}>
        <Checkbox size="small" sx={{ p: 0.25 }}
          checked={active.length > 0 && selected.length === active.length}
          indeterminate={selected.length > 0 && selected.length < active.length}
          onChange={toggleAll} />
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
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}>
          Edit
        </Typography>
      </Box>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <Box sx={{ px: 2, py: 0.75, bgcolor: 'action.selected',
          display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {selected.length} selected
          </Typography>
          <Button size="small" color="error" startIcon={<DeleteIcon sx={{ fontSize: 13 }} />}
            onClick={handleDeleteBulk} sx={{ ml: 'auto', fontSize: '0.72rem' }}>
            Delete selected
          </Button>
          <Button size="small" onClick={() => setSelected([])} sx={{ fontSize: '0.72rem' }}>
            Clear
          </Button>
        </Box>
      )}

      {/* Rows */}
      {active.length === 0 ? (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>No variants yet.</Typography>
          <Button size="small" variant="outlined" onClick={onAddVariant}>+ Add first variant</Button>
        </Box>
      ) : (
        active.map((v, i) => (
          <VariantRow key={v._id} variant={v} productId={productId} isLast={i === active.length - 1}
            selected={selected.includes(v._id)} onSelect={toggleSelect} onDeleteSingle={handleDeleteSingle} />
        ))
      )}

      {/* Footer */}
      {active.length > 0 && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1 }}>
            <Button size="small" startIcon={<AddCircleOutlineIcon sx={{ fontSize: 14 }} />}
              onClick={onAddVariant} sx={{ fontSize: '0.75rem' }}>
              Add variant
            </Button>
          </Box>
        </>
      )}

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        count={deleteTarget?.ids?.length || 1}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
        busy={deleteBusy}
      />
    </Box>
  );
};

export default VariantsTable;
