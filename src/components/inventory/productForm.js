import { useState, useEffect, useContext, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { createProduct, updateProduct, createCategory, actions } from '../../store/store';
import { useBranch } from '../../contextApi/BranchContext';

const ProductForm = () => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const { activeBranchId } = useBranch();
  const theme       = useTheme();
  const isMobile    = useMediaQuery(theme.breakpoints.down('sm'));

  const showNew       = useSelector((s) => s.invShowNewProduct);
  const editProd      = useSelector((s) => s.invEditProduct);
  const stoneTypes    = useSelector((s) => s.invLookups.stoneTypes) || [];
  const units         = useSelector((s) => s.invLookups.units)      || [];
  const invCategories = useSelector((s) => s.invCategories)          || [];
  const invProducts   = useSelector((s) => s.invProducts)            || [];

  const open   = showNew || Boolean(editProd);
  const isEdit = Boolean(editProd);

  const [stoneType,    setStoneType]    = useState('TR');
  const [quarryCode,   setQuarryCode]   = useState('');
  const [quarryName,   setQuarryName]   = useState('');
  const [name,         setName]         = useState('');
  const [nameAr,       setNameAr]       = useState('');
  const [description,  setDescription]  = useState('');
  const [defaultUnit,  setDefaultUnit]  = useState('M2');
  const [category,     setCategory]     = useState('');
  const [status,       setStatus]       = useState('active');
  const [newCatName,   setNewCatName]   = useState('');
  const [catBusy,      setCatBusy]      = useState(false);
  const [busy,         setBusy]         = useState(false);

  // Populate when editing
  useEffect(() => {
    if (editProd) {
      setStoneType(editProd.stoneType    || 'TR');
      setQuarryCode(editProd.quarryCode  || '');
      setQuarryName(editProd.quarryName  || '');
      setName(editProd.name              || '');
      setNameAr(editProd.nameAr          || '');
      setDescription(editProd.description || '');
      setDefaultUnit(editProd.defaultUnit || 'M2');
      setCategory(editProd.category      || '');
      setStatus(editProd.status          || 'active');
    } else {
      setStoneType('TR');
      setQuarryCode('');
      setQuarryName('');
      setName('');
      setNameAr('');
      setDescription('');
      setDefaultUnit('M2');
      setCategory('');
      setStatus('active');
    }
    setNewCatName('');
  }, [editProd, open]);

  const handleClose = useCallback(() => {
    if (showNew) dispatch(actions.invToggleNewProduct());
    dispatch(actions.invSetEditProduct(null));
  }, [dispatch, showNew]);

  const handleSubmit = async () => {
    if (!stoneType || !quarryCode.trim()) return;
    setBusy(true);
    const productCode = `${stoneType}${quarryCode.trim().padStart(2, '0')}`.toUpperCase();
    const payload = {
      stoneType,
      quarryCode: quarryCode.trim().padStart(2, '0'),
      quarryName: quarryName.trim() || undefined,
      name:        name.trim()        || undefined,
      nameAr:      nameAr.trim()      || undefined,
      description: description.trim() || undefined,
      defaultUnit,
      category:    category.trim()    || undefined,
      status,
    };
    try {
      if (isEdit) {
        await dispatch(updateProduct({
          authCtx, axiosGlobal,
          id: editProd._id,
          data: payload,
        })).unwrap();
      } else {
        await dispatch(createProduct({
          authCtx, axiosGlobal,
          data: { ...payload, code: productCode, branchId: activeBranchId },
        })).unwrap();
      }
      handleClose();
    } catch {
      // errors dispatched as snackBar inside thunks
    } finally {
      setBusy(false);
    }
  };

  // Derived product code preview
  const codePreview = stoneType && quarryCode.trim()
    ? `${stoneType}${quarryCode.trim().padStart(2, '0')}`.toUpperCase()
    : '—';

  const isDuplicate   = !isEdit && codePreview !== '—' && invProducts.some((p) => p.code === codePreview);
  const catNameExists = Boolean(
    newCatName.trim() && invCategories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())
  );

  const handleCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name || catNameExists) return;
    setCatBusy(true);
    try {
      await dispatch(createCategory({ authCtx, axiosGlobal, name })).unwrap();
      setCategory(name);
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
          {isEdit ? `Edit product — ${editProd?.code}` : 'New product (stone variety)'}
        </Box>
        <IconButton size="small" onClick={handleClose} aria-label="Close"
          sx={{ color: 'text.secondary' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>

        {/* Stone type + quarry code */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label="Stone type"
            size="small"
            value={stoneType}
            onChange={(e) => setStoneType(e.target.value)}
            sx={{ flex: 1 }}
          >
            {stoneTypes.length > 0
              ? stoneTypes.map((st) => (
                  <MenuItem key={st.code} value={st.code}>
                    {st.code} — {st.name}
                  </MenuItem>
                ))
              : [
                  ['TR','Travertine'],['MA','Marble'],['GR','Granite'],['ON','Onyx'],
                  ['QU','Chinese Quartz'],['LI','Limestone'],['BA','Basalt'],['OT','Other'],
                ].map(([k, v]) => <MenuItem key={k} value={k}>{k} — {v}</MenuItem>)
            }
          </TextField>

          <TextField
            label="Quarry code"
            size="small"
            value={quarryCode}
            onChange={(e) => setQuarryCode(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="e.g. 45"
            inputProps={{ maxLength: 2, inputMode: 'numeric', style: { fontFamily: 'monospace', letterSpacing: 2 } }}
            sx={{ width: 130 }}
            helperText={`Code: ${codePreview}`}
          />
        </Box>

        {/* Quarry name */}
        <TextField
          label="Quarry / colour name"
          size="small"
          fullWidth
          value={quarryName}
          onChange={(e) => setQuarryName(e.target.value)}
          placeholder="e.g. Beige NR, Armani Grey"
        />

        <Divider />

        {/* Display names */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Product name"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ flex: 1 }}
            placeholder="e.g. Travertine Silver Platinum"
          />
          <TextField
            label="Arabic name"
            size="small"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            sx={{ flex: 1 }}
            inputProps={{ dir: 'rtl' }}
          />
        </Box>

        {/* Description */}
        <TextField
          label="Description"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Divider />

        {/* Unit + category + status */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label="Default unit"
            size="small"
            value={defaultUnit}
            onChange={(e) => setDefaultUnit(e.target.value)}
            sx={{ flex: 1 }}
          >
            {units.length > 0
              ? units.map((u) => <MenuItem key={u.code} value={u.code}>{u.code}</MenuItem>)
              : ['M2','ML','PCS','SQFT','LNFT'].map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)
            }
          </TextField>

          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              input={<OutlinedInput label="Category" />}
            >
              <MenuItem value="">None</MenuItem>
              {invCategories.map((c) => (
                <MenuItem key={c._id} value={c.name}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            select
            label="Status"
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ width: 130 }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>
        </Box>

        {/* Inline new category creator */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            label="Add new category"
            size="small"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCategory(); }}
            sx={{ flex: 1 }}
            error={catNameExists}
            helperText={catNameExists ? 'Already exists — select it above' : ''}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={handleCreateCategory}
            disabled={!newCatName.trim() || catNameExists || catBusy}
            startIcon={catBusy ? <CircularProgress size={12} color="inherit" /> : <AddIcon sx={{ fontSize: 14 }} />}
            sx={{ minWidth: 80, height: 40, flexShrink: 0 }}
          >
            Add
          </Button>
        </Box>

        {isDuplicate && (
          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
            ⚠ Product {codePreview} already exists. Choose a different stone type or quarry code.
          </Typography>
        )}

        {!isEdit && !isDuplicate && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Product code will be <strong>{codePreview}</strong>. Variants (SKUs) are added after creation.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} size="small" disabled={busy}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={busy || !stoneType || !quarryCode.trim() || isDuplicate}
          startIcon={busy ? <CircularProgress size={12} color="inherit" /> : null}
        >
          {isEdit ? 'Save changes' : 'Create product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductForm;
