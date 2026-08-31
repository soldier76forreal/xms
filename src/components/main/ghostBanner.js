import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { exitGhost, isGhostActive } from '../../tools/ghost';

// Persistent, unmissable strip shown across the top whenever the current
// session is an impersonation. It exists for one reason: an admin must never be
// able to forget they are looking at someone else's account — the whole risk of
// a ghost feature is someone acting on what they see believing it is their own
// view, or believing they are in the sandbox when they are not.
//
// It is deliberately loud (amber, fixed, always on top) and carries the exit
// control, so leaving is always one click away from anywhere in the app.
export default function GhostBanner() {
  const { t } = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [info, setInfo] = useState(null);
  const [exiting, setExiting] = useState(false);

  const active = isGhostActive();

  const load = useCallback(async () => {
    if (!active) return;
    try {
      const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/ghost/me` });
      if (res.data?.inGhost) setInfo(res.data.session);
    } catch (_) { /* banner still renders from the local flag */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => { load(); }, [load]);

  if (!active) return null;

  const handleExit = async () => {
    setExiting(true);
    await exitGhost(authCtx, axiosGlobal);   // navigates away on completion
  };

  return (
    <Box sx={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', gap: 1.5,
      px: 2, py: 0.75,
      bgcolor: '#B26A00', color: '#fff',
      boxShadow: '0 1px 8px rgba(0,0,0,0.35)',
    }}>
      <VisibilityIcon sx={{ fontSize: 18, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, flexGrow: 1, minWidth: 0 }} noWrap>
        {info?.targetUserName
          ? t('ghost.bannerViewingAs', { name: info.targetUserName })
          : t('ghost.bannerViewingGeneric')}
        <Box component="span" sx={{ fontWeight: 400, opacity: 0.85, ml: 1, display: { xs: 'none', sm: 'inline' } }}>
          {t('ghost.bannerSandboxNote')}
        </Box>
      </Typography>
      <Button size="small" onClick={handleExit} disabled={exiting}
        startIcon={exiting ? <CircularProgress size={12} sx={{ color: 'inherit' }} /> : <LogoutIcon sx={{ fontSize: 15 }} />}
        sx={{
          flexShrink: 0, textTransform: 'none', fontSize: '0.75rem', fontWeight: 700,
          color: '#B26A00', bgcolor: '#fff', borderRadius: '7px', px: 1.5,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.88)' },
        }}>
        {t('ghost.exitButton')}
      </Button>
    </Box>
  );
}
