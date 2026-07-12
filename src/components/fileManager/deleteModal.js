import { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTheme, useMediaQuery } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// ── Delete confirmation (Phase 9 redesign — same props as the legacy modal:
// deleteCount 'single' uses fileFolderIdType, 'multi' uses selectedItems) ─────
export default function DeleteModal(props) {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark      = theme.palette.mode === 'dark';

  const selectedItemsSelect = useSelector((s) => s.selectedItems);
  const [loading, setLoading] = useState(false);

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    CARD_BD:   isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    HVR_BG:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  };

  const count = props.deleteCount === 'multi' ? selectedItemsSelect.length : 1;
  const handleClose = () => props.setDeleteFileModal(false);

  const deleteFileFolder = async () => {
    const data = props.deleteCount === 'single'
      ? [props.fileFolderIdType]
      : selectedItemsSelect.map((e) => ({ type: e.type, id: e.id }));
    setLoading(true);
    try {
      await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/files/deleteFolderFile`,
        data,
      });
      dispatch(actions.refresh());
      dispatch(actions.unselectAll());
      dispatch(actions.setShowSnackBar({ status: true, msg: count === 1 ? 'Item deleted' : `${count} items deleted`, type: 'success' }));
      setLoading(false);
      handleClose();
    } catch (err) {
      setLoading(false);
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to delete', type: 'error' }));
    }
  };

  return (
    <Dialog open={props.deleteFileModal} onClose={handleClose} maxWidth="xs" fullWidth
      sx={{ zIndex: 100000 }}
      PaperProps={{ sx: {
        bgcolor: T.DIALOG_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: '14px', backgroundImage: 'none',
        mx: isXs ? 2 : 'auto',
      }}}>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}` }}>
        <DeleteOutlineIcon sx={{ fontSize: 18, color: '#EA005A' }} />
        <Typography sx={{ flexGrow: 1, fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          Delete {count === 1 ? 'item' : `${count} items`}
        </Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_SEC, lineHeight: 1.6 }}>
          {count === 1 ? 'This item' : `These ${count} items`} will be deleted
          {count === 1 ? '' : ' along with everything inside any selected folders'}. This cannot be undone.
        </Typography>
      </Box>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
        <Button onClick={handleClose}
          sx={{ color: T.TEXT_SEC, textTransform: 'none', '&:hover': { bgcolor: T.HVR_BG, color: T.TEXT_PRI } }}>
          Cancel
        </Button>
        <Button onClick={deleteFileFolder} disabled={loading}
          startIcon={loading ? <CircularProgress size={13} color="inherit" /> : <DeleteOutlineIcon sx={{ fontSize: 15 }} />}
          sx={{ bgcolor: '#EA005A', color: '#fff', fontWeight: 700, borderRadius: '8px', px: 3, textTransform: 'none',
            '&:hover': { bgcolor: '#c00048' },
            '&.Mui-disabled': { bgcolor: 'rgba(234,0,90,0.35)', color: 'rgba(255,255,255,0.5)' } }}>
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
