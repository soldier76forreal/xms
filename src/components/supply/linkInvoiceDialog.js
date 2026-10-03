import { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';
import { setMisInvoiceSupplyRecord } from '../../store/store';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '');
const fmtMoney = (n, c = 'AED') =>
  `${c} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Picks an EXISTING invoice/quotation in the active branch and attaches it to a
// supply record. A plain searchable list rather than an Autocomplete: this
// renders inside a Dialog, and a portalled Autocomplete popper would paint
// underneath it (the standing MUI z-index trap).
export default function LinkInvoiceDialog({ open, onClose, supplyRecordId, onLinked }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { activeBranchId } = useBranch();

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const [docType, setDocType] = useState('all');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkingId, setLinkingId] = useState(null);

  useEffect(() => {
    if (!open) { setSearch(''); setResults([]); setDocType('all'); }
  }, [open]);

  useEffect(() => {
    if (!open || !activeBranchId) return;
    setLoading(true);
    const timer = setTimeout(() => {
      authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/mis/invoices`,
        params: {
          branchId: activeBranchId, limit: 25,
          ...(docType !== 'all' ? { docType } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      })
        .then((res) => setResults(res.data.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [open, search, docType, activeBranchId, authCtx, axiosGlobal]);

  const handleLink = async (doc) => {
    setLinkingId(doc._id);
    try {
      await dispatch(setMisInvoiceSupplyRecord({
        authCtx, axiosGlobal, id: doc._id, supplyRecordId,
      })).unwrap();
      onLinked && onLinked();
      onClose();
    } catch (_) {
      /* the thunk surfaces its own error toast */
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '14px' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.75,
        borderBottom: `1px solid ${T.BD}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', flex: 1, color: T.TEXT_PRI }}>
          {t('supply.linkDocTitle')}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 17 }} /></IconButton>
      </Box>

      <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <ToggleButtonGroup size="small" exclusive value={docType}
          onChange={(_, v) => v && setDocType(v)} sx={{ alignSelf: 'flex-start' }}>
          <ToggleButton value="all" sx={{ fontSize: '0.7rem', textTransform: 'none', px: 1.75 }}>
            {t('mis.allTab')}
          </ToggleButton>
          <ToggleButton value="pre_invoice" sx={{ fontSize: '0.7rem', textTransform: 'none', px: 1.75 }}>
            {t('mis.preInvoiceTab')}
          </ToggleButton>
          <ToggleButton value="invoice" sx={{ fontSize: '0.7rem', textTransform: 'none', px: 1.75 }}>
            {t('mis.invoiceType')}
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField size="small" fullWidth autoFocus value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('supply.linkDocSearch')}
          InputProps={{ startAdornment: (
            <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17 }} /></InputAdornment>
          ) }} />

        <Box sx={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {loading && results.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={18} /></Box>
          ) : results.length === 0 ? (
            <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, py: 3, textAlign: 'center' }}>
              {t('supply.linkDocEmpty')}
            </Typography>
          ) : results.map((doc) => {
            const alreadyLinked = String(doc.supplyRecordId || '') === String(supplyRecordId);
            return (
              <Box key={doc._id}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 1,
                  border: `1px solid ${T.BD}`, borderRadius: '10px', bgcolor: T.CTRL_BG }}>
                <DescriptionOutlinedIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI }}>
                    {doc.docType === 'pre_invoice' ? t('mis.preInvoiceTab') : t('mis.invoiceType')} #{doc.docNumber}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }} noWrap>
                    {doc.customerSnapshot?.name || '—'}
                    {doc.issueDate ? ` · ${fmtDate(doc.issueDate)}` : ''}
                    {` · ${fmtMoney(doc.grandTotal, doc.currency)}`}
                  </Typography>
                </Box>
                <Button size="small" variant={alreadyLinked ? 'text' : 'outlined'}
                  disabled={alreadyLinked || linkingId === doc._id}
                  onClick={() => handleLink(doc)}
                  sx={{ fontSize: '0.68rem', textTransform: 'none', minWidth: 62 }}>
                  {linkingId === doc._id
                    ? <CircularProgress size={12} />
                    : alreadyLinked ? t('supply.alreadyLinked') : t('supply.linkAction')}
                </Button>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2.5, py: 1.75,
        borderTop: `1px solid ${T.BD}` }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>{t('common.close')}</Button>
      </Box>
    </Dialog>
  );
}
