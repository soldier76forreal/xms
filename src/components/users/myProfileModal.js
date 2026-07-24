import { useState, useEffect, useContext, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { pushSupported, enablePushNotifications } from '../../tools/pushNotifications';

// Per-type push categories (must match the backend notificationPrefs keys).
const NOTIF_TYPES = [
  { key: 'tasks',         labelKey: 'users.notifTypeTasks' },
  { key: 'assignments',   labelKey: 'users.notifTypeAssignments' },
  { key: 'invoices',      labelKey: 'users.notifTypeInvoices' },
  { key: 'dmChat',        labelKey: 'users.notifTypeDmChat' },
  { key: 'readyToUpload', labelKey: 'users.notifTypeReadyToUpload' },
];
const DEFAULT_NOTIF_PREFS = { tasks: true, assignments: true, invoices: true, dmChat: true, readyToUpload: true };

// ── My Profile modal ──────────────────────────────────────────────────────────
// Self-service: any user edits their OWN name + profile picture (backend:
// PUT /users/me/profile · POST /users/me/avatar — no permission key needed).
// Admin-only fields (roles/branches/active) stay in the Users section forms.
const MyProfileModal = ({ open, onClose }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const { t }       = useTranslation();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark      = theme.palette.mode === 'dark';

  const T = {
    CARD_BG:  isDark ? '#0d0d0d'                : theme.palette.background.paper,
    INPUT_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD: isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:  isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    CARD_BD:  isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    BTN_BG:   isDark ? '#ffffff'                : '#000000',
    BTN_CLR:  isDark ? '#000000'                : '#ffffff',
    ERR_CLR:  '#FF4D8D',
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI,
      '& fieldset': { borderColor: T.INPUT_BD },
      '&.Mui-focused fieldset': { borderColor: T.TEXT_PRI, borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root': { color: T.TEXT_SEC },
    '& .MuiInputLabel-root.Mui-focused': { color: T.TEXT_PRI },
    '& input': { color: T.TEXT_PRI },
  };

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIF_PREFS);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushState, setPushState] = useState(
    (typeof Notification !== 'undefined') ? Notification.permission : 'unsupported'
  );
  const fileInputRef = useRef(null);

  // Fresh copy of the user's own record — the JWT payload can be stale.
  useEffect(() => {
    if (!open) return;
    setError(''); setAvatarFile(null);
    (async () => {
      setLoading(true);
      try {
        const res = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/users/userProfileData`,
        });
        const u = res.data || {};
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
        setPhone(u.phoneNumber || '');
        const thumb = u.profileImage?.thumbnail || u.profileImage?.url;
        setAvatarPreview(thumb ? `${axiosGlobal.defaultTargetApi}${thumb}` : null);
      } catch {
        setError(t('users.failedLoadProfile'));
      }
      try {
        const prefRes = await authCtx.jwtInst({
          method: 'get', url: `${axiosGlobal.defaultTargetApi}/users/me/notification-prefs`,
        });
        setNotifPrefs({ ...DEFAULT_NOTIF_PREFS, ...(prefRes.data || {}) });
      } catch { /* keep defaults */ }
      setPushState((typeof Notification !== 'undefined') ? Notification.permission : 'unsupported');
      setLoading(false);
    })();
  }, [open]);   // eslint-disable-line react-hooks/exhaustive-deps

  const toggleNotif = (key) => setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  const enableOnThisDevice = async () => {
    setPushBusy(true);
    const res = await enablePushNotifications(authCtx, axiosGlobal);
    setPushState(res === 'granted' ? 'granted' : (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'));
    setPushBusy(false);
    if (res === 'granted') dispatch(actions.setShowSnackBar({ status: true, msg: t('users.notifsEnabledDevice'), type: 'success' }));
    else if (res === 'denied') dispatch(actions.setShowSnackBar({ status: true, msg: t('users.notifsBlockedBrowser'), type: 'error' }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError(t('users.selectImageFile')); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!firstName.trim()) { setError(t('users.firstNameRequired')); return; }
    if (!lastName.trim())  { setError(t('users.lastNameRequired'));  return; }
    setSaving(true); setError('');
    try {
      await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/users/me/profile`,
        data: { firstName: firstName.trim(), lastName: lastName.trim() },
      });
      await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/users/me/notification-prefs`,
        data: notifPrefs,
      });
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        await authCtx.jwtInst({
          method: 'post',
          url: `${axiosGlobal.defaultTargetApi}/users/me/avatar`,
          data: fd,
        });
      }
      dispatch(actions.setShowSnackBar({ status: true, msg: t('users.profileUpdated'), type: 'success' }));
      dispatch(actions.setUserProfileRefresh());
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('users.failedSaveProfile'));
    } finally {
      setSaving(false);
    }
  };

  const initials = ((firstName || '')[0] || '') + ((lastName || '')[0] || '');

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isXs} maxWidth="xs" fullWidth
      PaperProps={{ sx: {
        bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: isXs ? 0 : '14px', backgroundImage: 'none',
      }}}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {t('users.myProfile')}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={26} sx={{ color: T.TEXT_TER }} />
        </Box>
      ) : (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Avatar picker */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box onClick={() => fileInputRef.current?.click()}
              sx={{
                position: 'relative', width: 72, height: 72, borderRadius: '50%',
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
                border: `1px solid ${T.INPUT_BD}`,
                '&:hover .cam-overlay': { opacity: 1 },
              }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                  <Typography sx={{ position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: 700, color: T.TEXT_PRI }}>
                    {initials || '?'}
                  </Typography>
                )}
              <Box className="cam-overlay" sx={{
                position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.15s',
              }}>
                <CameraAltIcon sx={{ fontSize: 22, color: '#fff' }} />
              </Box>
            </Box>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            <Box>
              <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_PRI, fontWeight: 500 }}>{t('users.profilePhoto')}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mt: 0.3 }}>{t('users.clickAvatarToChange')}</Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: T.DIVIDER }} />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <TextField label={t('users.firstNameLabel')} size="small" fullWidth value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setError(''); }} sx={inputSx} />
            <TextField label={t('users.lastNameLabel')} size="small" fullWidth value={lastName}
              onChange={(e) => { setLastName(e.target.value); setError(''); }} sx={inputSx} />
          </Box>

          {/* Phone is the login identity — read-only here */}
          <TextField label={t('users.phoneNumberLabel')} size="small" fullWidth value={phone} disabled
            inputProps={{ dir: 'ltr' }}
            helperText={t('users.phoneIdentityHelper')}
            sx={{ ...inputSx,
              '& .MuiFormHelperText-root': { color: T.TEXT_TER, fontSize: '0.66rem' },
              '& .Mui-disabled': { WebkitTextFillColor: 'unset', color: T.TEXT_SEC } }} />

          <Divider sx={{ borderColor: T.DIVIDER }} />

          {/* ── Notifications ── */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_PRI, fontWeight: 600 }}>
                {t('users.notificationsHeader')}
              </Typography>
              {pushSupported() && pushState !== 'granted' && (
                <Button size="small" onClick={enableOnThisDevice} disabled={pushBusy}
                  startIcon={pushBusy ? <CircularProgress size={12} color="inherit" /> : <NotificationsActiveIcon sx={{ fontSize: 15 }} />}
                  sx={{ textTransform: 'none', fontSize: '0.72rem', color: T.TEXT_PRI,
                    border: `1px solid ${T.INPUT_BD}`, borderRadius: '8px', px: 1.25, py: '2px' }}>
                  {pushState === 'denied' ? t('users.blockedInBrowser') : t('users.enableOnThisDevice')}
                </Button>
              )}
              {pushState === 'granted' && (
                <Typography sx={{ fontSize: '0.68rem', color: '#81C784', fontWeight: 600 }}>
                  {t('users.enabledOnThisDevice')}
                </Typography>
              )}
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, mb: 1 }}>
              {t('users.choosePushNote')}
            </Typography>
            {NOTIF_TYPES.map(({ key, labelKey }) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.25 }}>
                <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC }}>{t(labelKey)}</Typography>
                <Switch size="small" checked={notifPrefs[key] !== false} onChange={() => toggleNotif(key)} />
              </Box>
            ))}
          </Box>

          {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
        </Box>
      )}

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
        <Button onClick={onClose}
          sx={{ color: T.TEXT_SEC, textTransform: 'none',
            '&:hover': { color: T.TEXT_PRI, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' } }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, borderRadius: '8px', px: 3,
            textTransform: 'none',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' },
            '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' } }}>
          {saving ? t('users.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MyProfileModal;
