import { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// ── Rename dialog (Phase 9 redesign — same props as the legacy modal) ─────────
export default function RenameModal(props) {
  const { t }       = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark      = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    CARD_BD:   isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    HVR_BG:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    BTN_BG:    isDark ? '#ffffff'                : '#000000',
    BTN_CLR:   isDark ? '#000000'                : '#ffffff',
  };

  const handleClose = () => props.setOpenRenameModal(false);

  const renameFolder = async () => {
    if (!String(props.renameFolder || '').trim()) { setError(t('files.enterAName')); return; }
    setLoading(true); setError('');
    try {
      await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/files/folderRename`,
        data: { typeId: props.fileFolderIdType, newName: String(props.renameFolder).trim() },
      });
      dispatch(actions.refresh());
      dispatch(actions.setShowSnackBar({ status: true, msg: t('files.renamed'), type: 'success' }));
      setLoading(false);
      handleClose();
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || t('files.failedToRename'));
    }
  };

  return (
    <Dialog open={props.openRenameModal} onClose={handleClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: {
        bgcolor: T.DIALOG_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: '14px', backgroundImage: 'none',
        mx: isXs ? 2 : 'auto',
      }}}>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}` }}>
        <DriveFileRenameOutlineIcon sx={{ fontSize: 18, color: T.TEXT_SEC }} />
        <Typography sx={{ flexGrow: 1, fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {t('files.renameHeader')}
        </Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
        <TextField autoFocus fullWidth size="small" placeholder={t('files.newNamePlaceholder')}
          value={props.renameFolder}
          onChange={(e) => { props.setRenameFolder(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && renameFolder()}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI,
              '& fieldset': { borderColor: T.INPUT_BD },
              '&.Mui-focused fieldset': { borderColor: T.TEXT_PRI, borderWidth: 1.5 },
            },
            '& input::placeholder': { color: T.TEXT_SEC, opacity: 1 },
          }} />
        {error && <Typography sx={{ fontSize: '0.76rem', color: '#FF4D8D', mt: 1 }}>{error}</Typography>}
      </Box>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
        <Button onClick={handleClose}
          sx={{ color: T.TEXT_SEC, textTransform: 'none', '&:hover': { bgcolor: T.HVR_BG, color: T.TEXT_PRI } }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={renameFolder} disabled={loading}
          startIcon={loading ? <CircularProgress size={13} color="inherit" /> : null}
          sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, borderRadius: '8px', px: 3, textTransform: 'none',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' },
            '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' } }}>
          {loading ? t('users.saving') : t('files.renameHeader')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
