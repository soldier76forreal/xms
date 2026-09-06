import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useTranslation } from 'react-i18next';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import RestrictedAccessScreen from './restrictedAccessScreen';
import FileShareView from '../fileManager/fileShareView';
import { shortLinkPath } from '../../tools/pushNotifications';

const POST_LOGIN_REDIRECT_KEY = 'xms_postLoginRedirect';

// The /l/:code route target — every "copy link" button across the app plus
// File Manager's share links point here. TWO different kinds of link arrive on
// this one route, and they have opposite access rules:
//
//   • A File Manager SHARE link is meant for someone outside the company who
//     has no XMS account at all. It must open with no login, ever — so it is
//     probed FIRST, against the unauthenticated GET /files/public/share/:code,
//     before any thought of redirecting to /logIn. (This is the bug fixed on
//     2026-09-06: the login bounce below used to run unconditionally, which
//     made every shared link unopenable for the exact people it was sent to.)
//
//   • Every OTHER module's record link (crm/mis/inventory/...) is internal:
//     logged-out visitors go to /logIn and come back, and access itself is
//     decided by that module's own permission/scope-gated detail route, which
//     this component hands off to via history.replace + `?open=`.
//
// A 404 from the public probe is the signal for "not a file share" — that is
// the only case that falls through to the internal path. An expired share
// answers 410 instead, so its visitor sees "this link expired" rather than a
// login form they can't use.
export default function ShortLinkResolver() {
  const { t }       = useTranslation();
  const { code }    = useParams();
  const history     = useHistory();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;

    const bounceToLogin = () => {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, `/l/${code}`);
      history.replace('/logIn');
    };

    (async () => {
      // 1) Public file-share probe — no auth header, no jwtInst (a 401 here
      //    must never touch the token-refresh/logout path).
      try {
        const res = await axios.get(`${axiosGlobal.defaultTargetApi}/files/public/share/${code}`);
        if (cancelled) return;
        setState({ status: 'files', data: res.data });
        return;
      } catch (err) {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 410) { setState({ status: 'expired', data: null }); return; }
        // Anything that isn't a clean 404 ("no such file share") is a network
        // or server problem, not an answer. A logged-in user can still try the
        // internal path; a logged-out one has nothing else to try.
        if (status !== 404 && authCtx.isLoggedIn !== true) {
          setState({ status: 'expired', data: null });
          return;
        }
      }

      // 2) Internal record link — requires login.
      if (authCtx.isLoggedIn !== true) { bounceToLogin(); return; }

      try {
        const res = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/shortlinks/${code}/resolve`,
        });
        if (cancelled) return;
        const link = res.data;
        if (link.module === 'files') {
          // A files link the public probe didn't serve (revoked mid-session,
          // or a legacy record) — nothing more to show than the expired card.
          setState({ status: 'expired', data: null });
        } else {
          history.replace(shortLinkPath(link.module, link.entityType, link.entityId));
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.response?.status === 401) { bounceToLogin(); return; }
        setState({ status: 'notFound', data: null });
      }
    })();

    return () => { cancelled = true; };
  }, [code, authCtx.isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.status === 'files') {
    return <FileShareView data={state.data} />;
  }

  // Self-contained, no "go to the app" call to action and no permission
  // context — the visitor seeing this may have no account at all, so
  // RestrictedAccessScreen's "go to an accessible section" button would just
  // dump them on a login form.
  if (state.status === 'expired') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: '#060606', px: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 380, p: { xs: '28px 22px', sm: '40px 36px' },
          borderRadius: '14px', bgcolor: '#111111', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LinkOffIcon sx={{ fontSize: 22, color: 'rgba(255,255,255,0.45)' }} />
          </Box>
          <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.7 }}>
            {t('restricted.linkExpired')}
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)' }}>
            {t('files.poweredBy')} XCAPITAL
          </Typography>
        </Box>
      </Box>
    );
  }

  if (state.status === 'notFound') {
    return <RestrictedAccessScreen message={t('restricted.linkExpired')} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#060606' }}>
      <CircularProgress size={28} sx={{ color: 'rgba(255,255,255,0.45)' }} />
    </Box>
  );
}
