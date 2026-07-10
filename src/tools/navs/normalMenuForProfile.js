import { useContext } from 'react';
import Menu from '@mui/material/Menu';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import { useHistory } from 'react-router-dom';

import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import AuthContext from '../../components/authAndConnections/auth';
import AxiosGlobal from '../../components/authAndConnections/axiosGlobalUrl';
import ThemeCtx from '../../contextApi/themeContext';
import { usePermissions } from '../../contextApi/PermissionContext';

// Human labels for the module part of permission keys (module:resource:action)
const MODULE_LABELS = {
  mis: 'Invoices', crm: 'CRM', inventory: 'Inventory', files: 'Files',
  users: 'Users', tasks: 'Tasks', digitalMarketing: 'Digital Marketing',
};

// ── Profile popup (redesigned 2026-07-11) ─────────────────────────────────────
// Replaces the legacy hardcoded-black panel that still read the deprecated
// access[] role strings. Shows identity + real RBAC-derived access, and the
// actions: my profile, push notifications, theme toggle, logout.
export default function NormalMenuForProfile(props) {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { themeMode, toggleTheme } = useContext(ThemeCtx);
  const { permissions, isSuperAdmin } = usePermissions();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const history = useHistory();

  const decoded = authCtx.decode || {};

  const T = {
    BG:       isDark ? '#0d0d0d'                : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    HVR_BG:   isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    CHIP_BG:  isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
  };

  const avatarSrc = decoded.profileImage?.filename
    ? `${axiosGlobal.defaultTargetApi}/uploads/${decoded.profileImage.filename}`
    : undefined;
  const initials = ((decoded.firstName || '')[0] || '') + ((decoded.lastName || '')[0] || '');

  // Sections this user can actually see, derived from the REAL permission set
  // (module of every `X:view`-style key) — not the deprecated access[] strings.
  const moduleChips = [...new Set(
    Array.from(permissions || [])
      .map((k) => k.split(':')[0])
      .filter((m) => MODULE_LABELS[m])
  )].map((m) => MODULE_LABELS[m]);

  // Web-push opt-in (kept from the old menu — same backend route)
  const configurePushSub = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const swreg = await navigator.serviceWorker.ready;
      let sub = await swreg.pushManager.getSubscription();
      if (!sub) {
        sub = await swreg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'BM67mHEyeX_8ChNMsQGcVkgE965usqKz0LTBppeporoWbviq6zPdH2EELVIK2QnlL5MLYqIzf-0-qxdWtBAd5w4',
        });
      }
      await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/notfication/saveSubsToDb`,
        data: { subs: JSON.stringify(sub), userId: authCtx.userId },
      });
    } catch (_) { /* push opt-in is best-effort */ }
  };
  const activeNotif = () => {
    if (!('Notification' in window)) return;
    Notification.requestPermission((res) => {
      if (res === 'granted') configurePushSub();
    });
  };

  const row = (icon, label, onClick, danger = false) => (
    <Box onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.25,
        px: 1.5, py: 1, mx: 1, borderRadius: '8px', cursor: 'pointer',
        color: danger ? '#EA005A' : T.TEXT_SEC,
        '&:hover': { bgcolor: danger ? 'rgba(234,0,90,0.08)' : T.HVR_BG, color: danger ? '#EA005A' : T.TEXT_PRI },
        transition: 'all 0.12s',
      }}>
      <Box sx={{ display: 'flex', '& svg': { fontSize: 18 } }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: 'inherit' }}>{label}</Typography>
    </Box>
  );

  return (
    <Menu
      id="demo-positioned-menu"
      aria-labelledby="demo-positioned-button"
      anchorEl={props.anchorEl}
      open={props.open}
      onClose={props.handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      PaperProps={{ sx: {
        bgcolor: T.BG, backgroundImage: 'none',
        border: `1px solid ${T.BD}`, borderRadius: '14px',
        width: 264, overflow: 'hidden',
      }}}
      MenuListProps={{ sx: { p: 0 } }}
    >
      {/* ── Identity header ── */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar src={avatarSrc} alt="Profile"
          sx={{ width: 44, height: 44, fontSize: '0.95rem', fontWeight: 700,
            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: T.TEXT_PRI }}>
          {initials || null}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: '0.9rem', fontWeight: 700, color: T.TEXT_PRI }}>
            {decoded.firstName} {decoded.lastName}
          </Typography>
          <Typography noWrap sx={{ fontSize: '0.72rem', color: T.TEXT_SEC, fontFamily: 'monospace' }} dir="ltr">
            {decoded.phoneNumber || ''}
          </Typography>
        </Box>
      </Box>

      {/* ── Access summary — real RBAC, not the deprecated access[] ── */}
      {(isSuperAdmin || moduleChips.length > 0) && (
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Typography sx={{ fontSize: '0.6rem', color: T.TEXT_TER, textTransform: 'uppercase',
            letterSpacing: '0.1em', mb: 0.6 }}>
            Access
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {isSuperAdmin && (
              <Chip size="small" icon={<VerifiedUserIcon sx={{ fontSize: '13px !important' }} />}
                label="Super admin"
                sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700,
                  bgcolor: isDark ? '#ffffff' : '#000000',
                  color: isDark ? '#000000' : '#ffffff',
                  '& .MuiChip-icon': { color: 'inherit' } }} />
            )}
            {moduleChips.map((label) => (
              <Chip key={label} size="small" label={label}
                sx={{ height: 20, fontSize: '0.64rem', bgcolor: T.CHIP_BG, color: T.TEXT_SEC,
                  border: `1px solid ${T.BD}` }} />
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: T.BD }} />

      {/* ── Actions ── */}
      <Box sx={{ py: 0.75 }}>
        {row(<AccountCircleIcon />, 'My profile', () => { props.handleClose(); history.push('/users'); })}
        {row(<NotificationsActiveIcon />, 'Enable push notifications', activeNotif)}
        {row(themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />,
          themeMode === 'light' ? 'Dark mode' : 'Light mode', toggleTheme)}
      </Box>

      <Divider sx={{ borderColor: T.BD }} />

      <Box sx={{ py: 0.75 }}>
        {row(<LogoutOutlinedIcon />, 'Log out', () => { props.handleClose(); authCtx.logout(); }, true)}
      </Box>
    </Menu>
  );
}
