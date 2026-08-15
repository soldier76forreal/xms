import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import RestrictedAccessScreen from './restrictedAccessScreen';
import FileShareView from '../fileManager/fileShareView';
import { shortLinkPath } from '../../tools/pushNotifications';

const POST_LOGIN_REDIRECT_KEY = 'xms_postLoginRedirect';

// The /l/:code route target. Every "copy link" button across the app (and
// File Manager's share links) points here. Access is NOT decided in this
// component — a logged-out visitor is bounced to /logIn first, and once
// logged in, non-file targets are handed off to that module's own already
// permission/scope-gated detail route via a history.replace + `?open=`
// (that route's own fetch is what actually enforces access, and shows
// RestrictedAccessScreen itself on a 403 — see each section's detail view).
export default function ShortLinkResolver() {
  const { t }       = useTranslation();
  const { code }    = useParams();
  const history     = useHistory();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [state, setState] = useState({ status: 'loading', link: null });

  useEffect(() => {
    if (authCtx.isLoggedIn !== true) {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, `/l/${code}`);
      history.replace('/logIn');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/shortlinks/${code}/resolve`,
        });
        if (cancelled) return;
        const link = res.data;
        if (link.module === 'files') {
          setState({ status: 'files', link });
        } else {
          history.replace(shortLinkPath(link.module, link.entityType, link.entityId));
        }
      } catch (err) {
        if (cancelled) return;
        setState({ status: err?.response?.status === 401 ? 'loggedOut' : 'notFound', link: null });
      }
    })();
    return () => { cancelled = true; };
  }, [code, authCtx.isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.status === 'loggedOut') {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, `/l/${code}`);
    history.replace('/logIn');
    return null;
  }

  if (state.status === 'notFound') {
    return <RestrictedAccessScreen message={t('restricted.linkExpired')} />;
  }

  if (state.status === 'files') {
    return <FileShareView code={code} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#060606' }}>
      <CircularProgress size={28} sx={{ color: 'rgba(255,255,255,0.45)' }} />
    </Box>
  );
}
