import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import AddIcon from '@mui/icons-material/Add';
import { createVariant, updateVariant, createCategory, actions } from '../../store/store';
import { parseStoneCode } from './util/codeParser';

const UNIT_LABELS = { M2: 'm² (square metre)', ML: 'ml (linear metre)', PCS: 'pcs (pieces)', SQFT: 'ft² (sq. foot)', LNFT: 'lnft (linear foot)' };
const FINISH_LABEL = { V:'Veincut', C:'Crosscut', F:'Filled', U:'Unfilled', P:'Polished', H:'Honed' };

function ParsePreview({ parsed }) {
  const { t } = useTranslation();
  if (!parsed) return null;

  if (!parsed.valid) {
    return (
      <Box sx={{ p: 1.5, bgcolor: 'error.main', borderRadius: 2, opacity: 0.85 }}>
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
          {parsed.parseWarnings?.[0] || t('inventory.invalidCode')}
        </Typography>
      </Box>
    );
  }

  const dims = parsed.unsized
    ? t('inventory.unsizedThick', { mm: parsed.thicknessMm })
    : t('inventory.dimsThickShort', { l: parsed.lengthCm, w: parsed.widthCm, t: parsed.thicknessMm });

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
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('inventory.quarryPrefix', { code: parsed.quarryCode })}</Typography>
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
  const { t } = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const isMobile    = useMediaQuery(theme.breakpoints.down('sm'));

  const showNew     = useSelector((s) => s.invShowNewVariant);
  const editVariant = useSelector((s) => s.invEditVariant);
  const units       = useSelector((s) => s.invLookups.units) || [];
  const categories  = useSelector((s) => s.invCategories) || [];
  const invVariants = useSelector((s) => s.invVariants) || [];

  const isEdit = Boolean(editVariant);
  const open   = showNew || isEdit;

  const [code,           setCode]           = useState('');
  const [unit,           setUnit]           = useState('M2');
  const [quantity,       setQuantity]       = useState('');
  const [price,          setPrice]          = useState('');
  const [status,         setStatus]         = useState('active');
  const [selectedCats,   setSelectedCats]   = useState([]);
  const [newCatName,     setNewCatName]     = useState('');
  const [catBusy,        setCatBusy]        = useState(false);
  const [busy,           setBusy]           = useState(false);
  const [parsed,         setParsed]         = useState(null);

  // Populate on edit
  useEffect(() => {
    if (editVariant) {
      setCode(editVariant.code || '');
      setUnit(editVariant.unit || 'M2');
      setStatus(editVariant.status || 'active');
      setParsed(parseStoneCode(editVariant.code));
      setQuantity('');
      setPrice('');
      setSelectedCats((editVariant.categories || []).map((c) => typeof c === 'object' ? c._id : c));
    } else {
      setCode('');
      setUnit('M2');
      setQuantity('');
      setPrice('');
      setStatus('active');
      setSelectedCats([]);
      setParsed(null);
    }
    setNewCatName('');
  }, [editVariant, open]);

  // Live parse on code change (debounced 350ms)
  useEffect(() => {
    if (!code) { setParsed(null); return; }
    const timer = setTimeout(() => {
      setParsed(parseStoneCode(code));
    }, 350);
    return () => clearTimeout(timer);
  }, [code]);

  const handleClose = useCallback(() => {
    if (showNew) dispatch(actions.invToggleNewVariant());
    dispatch(actions.invSetEditVariant(null));
  }, [dispatch, showNew]);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      if (isEdit) {
        await dispatch(updateVariant({
          authCtx, axiosGlobal,
          id: editVariant._id,
          productId,
          data: { code: code.trim().toUpperCase(), unit, status, categories: selectedCats },
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
            categories: selectedCats,
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

  const isDuplicateVariant = !isEdit && Boolean(code.trim()) &&
    invVariants.some((v) => v.code === code.trim().toUpperCase() && !v.deleteDate && v.status !== 'archived');

  const catNameExists = Boolean(
    newCatName.trim() && categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())
  );

  const handleCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name || catNameExists) return;
    setCatBusy(true);
    try {
      const newCat = await dispatch(createCategory({ authCtx, axiosGlobal, name })).unwrap();
      if (newCat?._id) setSelectedCats((prev) => [...prev, String(newCat._id)]);
      setNewCatName('');
    } catch { } finally {
      setCatBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700, fontSize: '1rem',
        display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="span" sx={{ flexGrow: 1 }}>
          {isEdit ? t('inventory.editVariantTitle', { code: editVariant?.code }) : t('inventory.addVariant')}
        </Box>
        <IconButton size="small" onClick={handleClose} aria-label={t('common.close')}
          sx={{ color: 'text.secondary' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>

        {/* Code */}
        <Box>
          <TextField
            label={t('inventory.stoneCodeLabel')}
            fullWidth size="small"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('inventory.stoneCodePlaceholder')}
            inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 1 } }}
            helperText={t('inventory.stoneCodeFormat')}
          />
          {/* Live parse preview */}
          {code.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <ParsePreview parsed={parsed} />
            </Box>
          )}
          {isDuplicateVariant && (
            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, display: 'block', mt: 0.5 }}>
              {t('inventory.duplicateVariantWarning', { code: code.trim().toUpperCase() })}
            </Typography>
          )}
        </Box>

        {/* Unit */}
        <TextField
          select
          label={t('inventory.unitLabel')}
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
                label={t('inventory.initialQuantity')}
                type="number"
                size="small"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputProps={{ min: 0, step: 0.1 }}
                sx={{ flex: 1 }}
                helperText={t('inventory.canBeZero')}
              />
              <TextField
                label={t('inventory.priceAedLabel')}
                type="number"
                size="small"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputProps={{ min: 0, step: 1 }}
                sx={{ flex: 1 }}
                helperText={t('inventory.perUnit')}
              />
            </Box>
          </>
        )}

        {/* Status — edit only */}
        {isEdit && (
          <TextField
            select
            label={t('inventory.statusLabel')}
            fullWidth size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="active">{t('inventory.statusActive')}</MenuItem>
            <MenuItem value="archived">{t('inventory.statusArchivedOption')}</MenuItem>
          </TextField>
        )}

        {/* Category multi-select */}
        {categories.length > 0 && (
          <FormControl size="small" fullWidth>
            <InputLabel>{t('inventory.categoriesSelectLabel')}</InputLabel>
            <Select
              multiple
              value={selectedCats}
              onChange={(e) => setSelectedCats(e.target.value)}
              input={<OutlinedInput label={t('inventory.categoriesSelectLabel')} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((id) => {
                    const cat = categories.find((c) => c._id === id);
                    return <Chip key={id} label={cat?.name || id} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />;
                  })}
                </Box>
              )}
            >
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Inline new category creator */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            label={t('inventory.addNewCategory')}
            size="small"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCategory(); }}
            sx={{ flex: 1 }}
            error={catNameExists}
            helperText={catNameExists ? t('inventory.categoryExists') : ''}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={handleCreateCategory}
            disabled={!newCatName.trim() || catNameExists || catBusy}
            startIcon={catBusy ? <CircularProgress size={12} color="inherit" /> : <AddIcon sx={{ fontSize: 14 }} />}
            sx={{ minWidth: 80, height: 40, flexShrink: 0 }}
          >
            {t('common.add')}
          </Button>
        </Box>

        {isEdit && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('inventory.adjustQtyPriceNote')}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} size="small" disabled={busy}>{t('common.cancel')}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={busy || !code.trim() || (parsed && !parsed.valid) || Boolean(isDuplicateVariant)}
          startIcon={busy ? <CircularProgress size={12} color="inherit" /> : null}
        >
          {isEdit ? t('inventory.saveChanges') : t('inventory.addVariant')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariantForm;
