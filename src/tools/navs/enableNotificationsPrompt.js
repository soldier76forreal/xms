import { useEffect, useState, useContext } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Slide from '@mui/material/Slide';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTheme } from '@mui/material/styles';

import AuthContext from '../../components/authAndConnections/auth';
import AxiosGlobal from '../../components/authAndConnections/axiosGlobalUrl';
import { pushSupported, enablePushNotifications } from '../pushNotifications';

// Prompts the logged-in user to turn on browser push notifications. Shown once
// (per dismissal) when the browser permission is still 'default' — never nags a
// user who already granted or explicitly blocked. Sits above the PWA install
// banner so the two don't overlap.
const DISMISS_KEY = 'xms_notifPromptDismissed';

export default function EnableNotificationsPrompt() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [open, setOpen]     = useState(false);
  const [busy, setBusy]     = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    if (Notification.permission !== 'default') return;   // already granted/denied
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    const t = setTimeout(() => setOpen(true), 4000);      // let the app settle first
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => { setOpen(false); localStorage.setItem(DISMISS_KEY, '1'); };

  const enable = async () => {
    setBusy(true);
    await enablePushNotifications(authCtx, axiosGlobal);
    setBusy(false);
    setOpen(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  if (!open) return null;

  const T = {
    BG:   isDark ? '#161616' : '#ffffff',
    BD:   isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
    PRI:  isDark ? '#ffffff' : theme.palette.text.primary,
    SEC:  isDark ? 'rgba(255,255,255,0.55)' : theme.palette.text.secondary,
    BTN_BG:  isDark ? '#ffffff' : '#000000',
    BTN_CLR: isDark ? '#000000' : '#ffffff',
  };

  return (
    <Slide in={open} direction="up">
      <Paper elevation={8} sx={{
        position: 'fixed', zIndex: 1600, left: 0, right: 0, bottom: 0,
        mx: 'auto', mb: { xs: 0, sm: 2 }, maxWidth: { xs: '100%', sm: 420 },
        bgcolor: T.BG, border: `1px solid ${T.BD}`,
        borderRadius: { xs: '14px 14px 0 0', sm: '14px' },
        backgroundImage: 'none', p: 2,
        display: 'flex', alignItems: 'flex-start', gap: 1.5,
      }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <NotificationsActiveIcon sx={{ fontSize: 20, color: T.SEC }} />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.PRI }}>
            Turn on notifications
          </Typography>
          <Typography sx={{ fontSize: '0.76rem', color: T.SEC, mt: 0.25, lineHeight: 1.5 }}>
            Get alerts for tasks, assignments, invoices sent to you, chat messages and ready-to-upload content.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 1.25 }}>
            <Button onClick={enable} size="small" disabled={busy}
              startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <NotificationsActiveIcon sx={{ fontSize: 16 }} />}
              sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, textTransform: 'none',
                borderRadius: '8px', px: 2,
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
              {busy ? 'Enabling…' : 'Enable'}
            </Button>
            <Button onClick={dismiss} size="small" disabled={busy}
              sx={{ color: T.SEC, textTransform: 'none' }}>
              Not now
            </Button>
          </Box>
        </Box>

        <IconButton size="small" onClick={dismiss} sx={{ color: T.SEC, flexShrink: 0 }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Paper>
    </Slide>
  );
}
