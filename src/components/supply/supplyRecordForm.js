import { useState, useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';
import { createSupplyRecord, updateSupplyRecord } from '../../store/store';

// New/edit Supply record Drawer — a record is for exactly ONE Inventory
// product (quarry-level code, e.g. "MA01"), picked here; the deal letters
// that track actual coupe purchases live under it (dealLetterForm.js).
export default function SupplyRecordForm({ open, onClose, record = null }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { activeBranchId } = useBranch();

  const isEdit = Boolean(record);

  const [product, setProduct] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (record) {
      setProduct({ _id: record.productId, code: record.productCode, name: record.productName });
      setTitle(record.title || '');
      setDate(record.date ? new Date(record.date).toISOString().slice(0, 10) : '');
      setNotes(record.notes || '');
    } else {
      setProduct(null);
      setTitle('');
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
    setError('');
  }, [open, record]);

  useEffect(() => {
    if (!open || isEdit || !activeBranchId) return;
    let cancelled = false;
    setProductLoading(true);
    const timer = setTimeout(() => {
      authCtx.jwtInst({
        method: 'get', url: `${axiosGlobal.defaultTargetApi}/supply/products-lookup`,
        params: { branchId: activeBranchId, search: productSearch },
      }).then((res) => { if (!cancelled) setProductOptions(res.data.data || []); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setProductLoading(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, isEdit, activeBranchId, productSearch, authCtx, axiosGlobal]);

  const handleClose = () => { if (!saving) onClose(); };

  const handleSave = async () => {
    if (!isEdit && !product) { setError(t('supply.productRequired')); return; }
    if (!title.trim()) { setError(t('supply.titleRequired')); return; }

    setSaving(true); setError('');
    try {
      if (isEdit) {
        await dispatch(updateSupplyRecord({
          authCtx, axiosGlobal, id: record._id,
          data: { title: title.trim(), date, notes },
        })).unwrap();
      } else {
        await dispatch(createSupplyRecord({
          authCtx, axiosGlobal,
          data: { branchId: activeBranchId, productId: product._id, title: title.trim(), date, notes },
        })).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('supply.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}
      PaperProps={{ sx: { width: isXs ? '100vw' : 440 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
          {isEdit ? t('supply.editRecord') : t('supply.newRecord')}
        </Typography>
        <IconButton onClick={handleClose} size="small"><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
        {!isEdit && (
          <Autocomplete
            options={productOptions}
            loading={productLoading}
            value={product}
            onChange={(_, v) => setProduct(v)}
            onInputChange={(_, v) => setProductSearch(v)}
            getOptionLabel={(o) => o ? `${o.code}${o.name ? ' — ' + o.name : ''}` : ''}
            isOptionEqualToValue={(o, v) => String(o._id) === String(v._id)}
            renderInput={(params) => (
              <TextField {...params} label={t('supply.productLabel')} size="small"
                placeholder={t('supply.productSearchPlaceholder')}
                InputProps={{ ...params.InputProps, endAdornment: (
                  <>{productLoading ? <CircularProgress size={14} /> : null}{params.InputProps.endAdornment}</>
                ) }} />
            )}
          />
        )}
        <TextField label={t('supply.titleLabel')} size="small" value={title}
          onChange={(e) => setTitle(e.target.value)} fullWidth />
        <TextField label={t('supply.dateLabel')} size="small" type="date" value={date}
          onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
        <TextField label={t('supply.notesLabel')} size="small" value={notes}
          onChange={(e) => setNotes(e.target.value)} multiline minRows={3} fullWidth />
        {error && <Typography sx={{ fontSize: '0.75rem', color: '#EA005A' }}>{error}</Typography>}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={saving}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
          {t('common.save')}
        </Button>
      </Box>
    </Drawer>
  );
}
