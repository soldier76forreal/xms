import { useState, useEffect, useContext, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { useDispatch, useSelector } from 'react-redux';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { createVariant, updateVariant, actions } from '../../store/store';
import { parseStoneCode } from './util/codeParser';

const UNIT_LABELS = { M2: 'm² (square metre)', ML: 'ml (linear metre)', PCS: 'pcs (pieces)', SQFT: 'ft² (sq. foot)', LNFT: 'lnft (linear foot)' };
const FINISH_LABEL = { V:'Veincut', C:'Crosscut', F:'Filled', U:'Unfilled', P:'Polished', H:'Honed' };

function ParsePreview({ parsed }) {
  if (!parsed) return null;

  if (!parsed.valid) {
    return (
      <Box sx={{ p: 1.5, bgcolor: 'error.main', borderRadius: 2, opacity: 0.85 }}>
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
          {parsed.parseWarnings?.[0] || 'Invalid code'}
        </Typography>
      </Box>
    );
  }

  const dims = parsed.unsized
    ? `Unsized — ${parsed.thicknessMm} mm`
    : `${parsed.lengthCm} × ${parsed.widthCm} cm · ${parsed.thicknessMm} mm`;

  const finishParts = [
    parsed.cutName, parsed.fillName, parsed.finishName
  ].filter(Boolean);

  return (
    <Box
      sx={{
        p: 1.5,
        border: '1.5px solid',
        borderColor: 'divider',
        borderRadius: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        alignItems: 'center',
      }}
    >
      <Chip label={parsed.stoneTypeName} size="small" sx={{ fontSize: '0.7rem' }} />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>quarry {parsed.quarryCode}</Typography>
      <Chip label={`${parsed.grade} — ${parsed.gradeName}`} size="small" sx={{ fontSize: '0.7rem' }} />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{dims}</Typography>
      {finishParts.map((f) => (
        <Chip key={f} label={f} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
      ))}
      {parsed.parseWarnings?.length > 0 && parsed.parseWarnings.map((w, i) => (
        <Typography key={i} variant="caption" sx={{ color: 'warning.main', width: '100%', fontSize: '0.68rem' }}>
          ⚠ {w}
        </Typography>
      ))}
    </Box>
  );
}

const VariantForm = ({ productId }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();

  const open        = useSelector((s) => s.invShowNewVariant);
  const editVariant = useSelector((s) => s.invEditVariant);
  const units       = useSelector((s) => s.invLookups.units) || [];

  const isEdit = Boolean(editVariant);

  const [code,     setCode]     = useState('');
  const [unit,     setUnit]     = useState('M2');
  const [quantity, setQuantity] = useState('');
  const [price,    setPrice]    = useState('');
  const [status,   setStatus]   = useState('active');
  const [busy,     setBusy]     = useState(false);
  const [parsed,   setParsed]   = useState(null);

  // Populate on edit
  useEffect(() => {
    if (editVariant) {
      setCode(editVariant.code || '');
      setUnit(editVariant.unit || 'M2');
      setStatus(editVariant.status || 'active');
      setParsed(parseStoneCode(editVariant.code));
      setQuantity('');
      setPrice('');
    } else {
      setCode('');
      setUnit('M2');
      setQuantity('');
      setPrice('');
      setStatus('active');
      setParsed(null);
    }
  }, [editVariant, open]);

  // Live parse on code change (debounced 350ms)
  useEffect(() => {
    if (!code) { setParsed(null); return; }
    const t = setTimeout(() => {
      setParsed(parseStoneCode(code));
    }, 350);
    return () => clearTimeout(t);
  }, [code]);

  const handleClose = useCallback(() => {
    dispatch(actions.invToggleNewVariant());
    dispatch(actions.invSetEditVariant(null));
  }, [dispatch]);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      if (isEdit) {
        await dispatch(updateVariant({
          authCtx, axiosGlobal,
          id: editVariant._id,
          productId,
          data: { code: code.trim().toUpperCase(), unit, status },
        })).unwrap();
      } else {
        await dispatch(createVariant({
          authCtx, axiosGlobal,
          data: {
            productId,
            code: code.trim().toUpperCase(),
            unit,
            quantity: quantity !== '' ? parseFloat(quantity) : 0,
            price:    price    !== '' ? parseFloat(price)    : undefined,
            currency: 'AED',
          },
        })).unwrap();
      }
      handleClose();
    } catch {
      // errors dispatched as snackBar inside thunks
    } finally {
      setBusy(false);
    }
  };

  const codeValid = parsed?.valid === true || (!parsed && code.length === 0);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {isEdit ? `Edit variant — ${editVariant?.code}` : 'Add variant'}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>

        {/* Code */}
        <Box>
          <TextField
            label="Stone code"
            fullWidth size="small"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. TR45Q10004018VFP"
            inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 1 } }}
            helperText="Format: XX##G LLLL WW TT [V|C][F|U][P|H]"
          />
          {/* Live parse preview */}
          {code.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <ParsePreview parsed={parsed} />
            </Box>
          )}
        </Box>

        {/* Unit */}
        <TextField
          select
          label="Unit"
          fullWidth size="small"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        >
          {units.length > 0
            ? units.map((u) => (
                <MenuItem key={u.code} value={u.code}>
                  {u.name || u.code}
                </MenuItem>
              ))
            : Object.entries(UNIT_LABELS).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v}</MenuItem>
              ))
          }
        </TextField>

        {/* Quantity + Price — new variant only */}
        {!isEdit && (
          <>
            <Divider />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Initial quantity"
                type="number"
                size="small"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputProps={{ min: 0, step: 0.1 }}
                sx={{ flex: 1 }}
                helperText="Can be 0 and added later"
              />
              <TextField
                label="Price (AED)"
                type="number"
                size="small"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputProps={{ min: 0, step: 1 }}
                sx={{ flex: 1 }}
                helperText="Per unit"
              />
            </Box>
          </>
        )}

        {/* Status — edit only */}
        {isEdit && (
          <TextField
            select
            label="Status"
            fullWidth size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>
        )}

        {isEdit && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            To adjust quantity or price, use the stock-adjust / price buttons on the variants table.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} size="small" disabled={busy}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={busy || !code.trim() || (parsed && !parsed.valid)}
          startIcon={busy ? <CircularProgress size={12} color="inherit" /> : null}
        >
          {isEdit ? 'Save changes' : 'Add variant'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariantForm;
