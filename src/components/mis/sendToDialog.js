import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useTheme, useMediaQuery } from '@mui/material';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';

// ── "Send to" — hand an invoice/pre-invoice to one or more users ──────────────
// PUT /mis/invoices/:id/assign { assignedTo:[userIds] } — full replace (so it
// doubles as unassign). Newly-added assignees get a notification server-side.
// Gated by the doc-type :edit permission (backend enforces; here the caller
// already checked before opening).
const SendToDialog = ({ doc, open, onClose, onDone }) => {
  const { t } = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark      = theme.palette.mode === 'dark';
  const { activeBranchId } = useBranch();
  const currentUserId = String(authCtx.decode?.id || authCtx.decode?._id || '');

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    CARD_BD:   isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    HVR_BG:    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    BTN_BG:    isDark ? '#ffffff'                : '#000000',
    BTN_CLR:   isDark ? '#000000'                : '#ffffff',
  };

  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch(''); setDebounced('');
    setSelected(new Set((doc?.assignedTo || []).map(String)));
  }, [open, doc]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/users`,
        // Scoped to the doc's branch — users from other branches can't see the
        // doc anyway (requireBranch), so offering them would be misleading.
        params: { search: debounced, branchId: activeBranchId },
      });
      // The sender themself is excluded — you can't "send" a doc to yourself.
      setUsers((res.data.data || []).filter(u => String(u._id) !== currentUserId));
    } catch {
      setUsers([]);
    }
    setLoading(false);
  }, [open, debounced, authCtx.jwtInst, axiosGlobal.defaultTargetApi, activeBranchId, currentUserId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/mis/invoices/${doc._id}/assign`,
        data: { assignedTo: Array.from(selected) },
      });
      dispatch(actions.setShowSnackBar({ status: true, msg: t('mis.invoiceSent'), type: 'success' }));
      onDone && onDone(res.data);
      onClose();
    } catch (err) {
      dispatch(actions.setShowSnackBar({
        status: true,
        msg: err?.response?.data?.message || t('mis.failedToSend'),
        type: 'error',
      }));
    } finally {
      setSaving(false);
    }
  };

  const label = doc?.docType === 'invoice' ? t('mis.invoiceType') : t('mis.quoteType');

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isXs} maxWidth="xs" fullWidth
      PaperProps={{ sx: {
        bgcolor: T.DIALOG_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: isXs ? 0 : '14px', backgroundImage: 'none',
        height: isXs ? '100%' : '70vh', display: 'flex', flexDirection: 'column',
      }}}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {t('mis.sendDocTitle', { type: label, number: doc?.docNumber })}
        </Typography>
        <IconButton onClick={onClose} size="small"
          sx={{ color: T.TEXT_SEC, '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, pt: 2, pb: 1, flexShrink: 0 }}>
        <TextField fullWidth size="small" placeholder={t('mis.searchUsersPlaceholder')}
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: T.TEXT_SEC }} /></InputAdornment> }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI,
              '& fieldset': { borderColor: T.INPUT_BD },
              '&.Mui-focused fieldset': { borderColor: T.TEXT_PRI, borderWidth: 1.5 },
            },
            '& input::placeholder': { color: T.TEXT_SEC, opacity: 1 },
          }}
        />
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mt: 1 }}>
          {t('common.selected', { count: selected.size })}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 1, minHeight: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={22} sx={{ color: T.TEXT_TER }} />
          </Box>
        ) : users.length === 0 ? (
          <Typography sx={{ textAlign: 'center', color: T.TEXT_SEC, py: 6, fontSize: '0.85rem' }}>
            {t('mis.noUsersFound')}
          </Typography>
        ) : users.map(u => {
          const id  = String(u._id);
          const sel = selected.has(id);
          return (
            <Box key={id} onClick={() => toggle(id)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.75, borderRadius: '8px',
                cursor: 'pointer', '&:hover': { bgcolor: T.HVR_BG } }}>
              <Checkbox size="small" checked={sel}
                sx={{ p: '2px', color: T.TEXT_TER, '&.Mui-checked': { color: T.TEXT_PRI } }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: '0.82rem', color: sel ? T.TEXT_PRI : T.TEXT_SEC }}>
                  {u.firstName} {u.lastName}
                </Typography>
                {u.phoneNumber && (
                  <Typography noWrap sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
                    {u.phoneNumber}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, flexShrink: 0,
        borderTop: `1px solid ${T.DIVIDER}` }}>
        <Button onClick={onClose}
          sx={{ color: T.TEXT_SEC, textTransform: 'none', '&:hover': { bgcolor: T.HVR_BG, color: T.TEXT_PRI } }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 15 }} />}
          sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, borderRadius: '8px', px: 3, textTransform: 'none',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' },
            '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)' } }}>
          {saving ? t('mis.sending') : t('mis.send')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendToDialog;
