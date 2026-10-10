import { useState, useEffect, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// Set or change a password.
//
// Two modes, one component:
//   mode="admin" (userId given) → POST /users/:id/password, no current password
//       (this is the recovery path — the person can't sign in, which is exactly
//       when they don't have the old one)
//   mode="self"                 → PUT /users/me/password, current password
//       required only when one is already set
//
// Rules mirror the server's passwordProblem(): 8+ characters, letters and
// digits. Checked here for immediate feedback, enforced there.
const MIN_LENGTH = 8;

export default function SetPasswordDialog({
  open, onClose, mode = 'self', userId, userName, hasPassword = true,
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const isAdmin = mode === 'admin';
  // Self-service on an account with no password yet: nothing to confirm against.
  const needsCurrent = !isAdmin && hasPassword;

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    DIALOG_BG: isDark ? '#0d0d0d'               : theme.palette.background.paper,
    INPUT_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    BTN_BG:   isDark ? '#ffffff'                : '#000000',
    BTN_CLR:  isDark ? '#000000'                : '#ffffff',
  };

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setCurrent(''); setNext(''); setConfirm(''); setShow(false); setError('');
  }, [open]);

  const problem = (() => {
    if (!next) return null;
    if (next.length < MIN_LENGTH) return t('users.pwTooShort', { count: MIN_LENGTH });
    if (!/[a-zA-Z]/.test(next) || !/[0-9]/.test(next)) return t('users.pwNeedsLetterAndNumber');
    return null;
  })();
  const mismatch = Boolean(confirm) && next !== confirm;

  const handleSave = async () => {
    if (needsCurrent && !current) { setError(t('users.pwCurrentRequired')); return; }
    if (!next) { setError(t('users.pwNewRequired')); return; }
    if (problem) { setError(problem); return; }
    if (next !== confirm) { setError(t('users.pwMismatch')); return; }

    setSaving(true); setError('');
    try {
      if (isAdmin) {
        await authCtx.jwtInst({
          method: 'post',
          url: `${axiosGlobal.defaultTargetApi}/users/${userId}/password`,
          data: { newPassword: next },
        });
      } else {
        await authCtx.jwtInst({
          method: 'put',
          url: `${axiosGlobal.defaultTargetApi}/users/me/password`,
          data: { currentPassword: current || undefined, newPassword: next },
        });
      }
      dispatch(actions.setShowSnackBar({
        status: true, type: 'success',
        msg: isAdmin ? t('users.pwSetFor', { name: userName || '' }) : t('users.pwChanged'),
      }));
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('users.pwFailed'));
    } finally {
      setSaving(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI,
      '& fieldset': { borderColor: T.BD },
    },
    '& .MuiInputLabel-root': { color: T.TEXT_SEC },
    '& input': { color: T.TEXT_PRI, fontFamily: 'monospace' },
  };

  const reveal = (
    <InputAdornment position="end">
      <IconButton size="small" onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'} sx={{ color: T.TEXT_TER }}>
        {show ? <VisibilityOffIcon sx={{ fontSize: 17 }} /> : <VisibilityIcon sx={{ fontSize: 17 }} />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { bgcolor: T.DIALOG_BG, borderRadius: '14px',
        border: `1px solid ${T.BD}`, backgroundImage: 'none' } }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.BD}` }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
            {isAdmin ? t('users.pwSetTitle') : t('users.pwChangeTitle')}
          </Typography>
          {isAdmin && userName && (
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>{userName}</Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} disabled={saving}>
          <CloseIcon sx={{ fontSize: 18, color: T.TEXT_SEC }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isAdmin && (
          <Alert severity="info" sx={{ fontSize: '0.72rem', py: 0.25 }}>
            {t('users.pwAdminNote')}
          </Alert>
        )}

        {needsCurrent && (
          <TextField size="small" fullWidth type={show ? 'text' : 'password'}
            label={t('users.pwCurrent')} value={current} autoFocus
            onChange={(e) => { setCurrent(e.target.value); setError(''); }}
            inputProps={{ dir: 'ltr' }} InputProps={{ endAdornment: reveal }} sx={inputSx} />
        )}

        <TextField size="small" fullWidth type={show ? 'text' : 'password'}
          label={t('users.pwNew')} value={next} autoFocus={!needsCurrent}
          onChange={(e) => { setNext(e.target.value); setError(''); }}
          error={Boolean(problem)} helperText={problem || t('users.pwRule', { count: MIN_LENGTH })}
          inputProps={{ dir: 'ltr' }} InputProps={{ endAdornment: reveal }} sx={inputSx} />

        <TextField size="small" fullWidth type={show ? 'text' : 'password'}
          label={t('users.pwConfirm')} value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
          error={mismatch} helperText={mismatch ? t('users.pwMismatch') : ' '}
          inputProps={{ dir: 'ltr' }} sx={inputSx} />

        {error && <Alert severity="error" sx={{ fontSize: '0.75rem', py: 0.25 }}>{error}</Alert>}
      </Box>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}
          sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving || Boolean(problem) || !next || mismatch}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, borderRadius: '8px',
            px: 3, textTransform: 'none',
            '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)' } }}>
          {saving ? t('users.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
