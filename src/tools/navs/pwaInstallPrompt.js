import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Slide from '@mui/material/Slide';
import CloseIcon from '@mui/icons-material/Close';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import IosShareIcon from '@mui/icons-material/IosShare';
import { useTheme } from '@mui/material/styles';

// PWA install prompt. Chromium fires `beforeinstallprompt`, which we stash and
// replay when the user taps Install. iOS Safari never fires it, so we show a
// short "Add to Home Screen" hint there instead. Dismissal is remembered so the
// banner does not nag on every load.
const DISMISS_KEY = 'xms_pwaInstallDismissed';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)')?.matches ||
  window.navigator.standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;

export default function PwaInstallPrompt() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [deferred, setDeferred] = useState(null);   // stashed beforeinstallprompt event
  const [open, setOpen]         = useState(false);
  const [iosHint, setIosHint]   = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === '1') return;

    const onBeforeInstall = (e) => {
      e.preventDefault();          // stop Chrome's mini-infobar; we drive our own UI
      setDeferred(e);
      setOpen(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const onInstalled = () => { setOpen(false); setDeferred(null); };
    window.addEventListener('appinstalled', onInstalled);

    // iOS never fires beforeinstallprompt — offer the manual hint once.
    let iosTimer;
    if (isIos()) iosTimer = setTimeout(() => { setIosHint(true); setOpen(true); }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (_) {}
    setDeferred(null);
    setOpen(false);
    localStorage.setItem(DISMISS_KEY, '1');   // don't re-prompt regardless of choice
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
          {iosHint ? <IosShareIcon sx={{ fontSize: 20, color: T.SEC }} />
                   : <InstallMobileIcon sx={{ fontSize: 20, color: T.SEC }} />}
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.PRI }}>
            Install XCAPITAL
          </Typography>
          {iosHint ? (
            <Typography sx={{ fontSize: '0.76rem', color: T.SEC, mt: 0.25, lineHeight: 1.5 }}>
              Tap the Share icon, then “Add to Home Screen” to install the app.
            </Typography>
          ) : (
            <Typography sx={{ fontSize: '0.76rem', color: T.SEC, mt: 0.25, lineHeight: 1.5 }}>
              Add the app to your home screen for faster access and notifications.
            </Typography>
          )}

          {!iosHint && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1.25 }}>
              <Button onClick={install} size="small"
                startIcon={<InstallMobileIcon sx={{ fontSize: 16 }} />}
                sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, textTransform: 'none',
                  borderRadius: '8px', px: 2,
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
                Install
              </Button>
              <Button onClick={dismiss} size="small"
                sx={{ color: T.SEC, textTransform: 'none' }}>
                Not now
              </Button>
            </Box>
          )}
        </Box>

        <IconButton size="small" onClick={dismiss} sx={{ color: T.SEC, flexShrink: 0 }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Paper>
    </Slide>
  );
}
