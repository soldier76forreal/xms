import { Route, Switch, Redirect } from "react-router-dom";
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createLightTheme, createDarkTheme } from './theme/theme';
import { ThemeContextProvider } from './contextApi/themeContext';
import ThemeCtx from './contextApi/themeContext';
import { LanguageContextProvider } from './contextApi/languageContext';
import LanguageCtx from './contextApi/languageContext';
import { PermissionProvider } from './contextApi/PermissionContext';

import Main from './components/main/main';
import LogIn from './components/authAndConnections/logIn';
import AuthContext from './components/authAndConnections/auth';
import { useContext, useEffect, useState, useMemo } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import AxiosGlobal from './components/authAndConnections/axiosGlobalUrl';
import { fetchData, getAllTags, getContacts, getFilter, userProfileData, fetchUserDirectory } from './store/store';
import { useDispatch, useSelector } from 'react-redux';
import ShortLinkResolver from './components/main/shortLinkResolver';
import PublicLinkPage from './components/digitalMarketing/publicLinkPage';
import RestrictedAccessScreen from './components/main/restrictedAccessScreen';
import { useHistory, useLocation, Link } from "react-router-dom";
import SnackBar from './tools/navs/snackBar';
import GhostBanner from './components/main/ghostBanner';
import PwaInstallPrompt from './tools/navs/pwaInstallPrompt';
import EnableNotificationsPrompt from './tools/navs/enableNotificationsPrompt';
import { pushSupported, subscribeToPush } from './tools/pushNotifications';

// Inner component so it can consume ThemeCtx after the provider mounts
const ThemedApp = () => {
  const { themeMode } = useContext(ThemeCtx);
  const { language, isRtl } = useContext(LanguageCtx);
  const authCtx = useContext(AuthContext);
  const [notifs, setNotifs] = useState('');
  const [count, setCount] = useState(0);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch = useDispatch();
  const refresh = useSelector((state) => state.refresh);
  const history = useHistory();
  const refreshTag = useSelector((state) => state.refreshTag);
  const userProfileRefresh = useSelector((state) => state.userProfileRefresh);

  // Memoized so unrelated re-renders (refresh/misRefresh/etc.) don't rebuild
  // the MUI theme object and cascade a re-render through every consumer.
  const muiTheme = useMemo(() => {
    const direction = isRtl ? 'rtl' : 'ltr';
    return themeMode === 'light' ? createLightTheme(direction, language) : createDarkTheme(direction, language);
  }, [themeMode, isRtl, language]);

  if (localStorage.getItem('accessToken') === 'undefined') {
    localStorage.removeItem('accessToken');
  }

  useEffect(() => {}, [refresh]);

  useEffect(() => {
    dispatch(fetchData({ authCtx, axiosGlobal }));
  }, [refresh, refreshTag]);

  useEffect(() => {
    dispatch(getContacts({ authCtx, axiosGlobal }));
  }, []);

  useEffect(() => {
    if (authCtx.isLoggedIn !== true) return;
    dispatch(fetchUserDirectory({ authCtx, axiosGlobal }));
  }, [authCtx.isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(getFilter({ authCtx, axiosGlobal }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(getAllTags({ authCtx, axiosGlobal }));
  }, [refreshTag]);

  useEffect(() => {
    dispatch(userProfileData({ authCtx, axiosGlobal }));
  }, [userProfileRefresh]);

  // Keep the push subscription alive: if the user already granted permission,
  // (re)subscribe on every load and re-save it server-side. Subscriptions can
  // be dropped by the browser/OS, so re-registering here is what keeps push
  // arriving when the app/browser is closed — without it a stale/missing
  // subscription silently stops delivering.
  useEffect(() => {
    if (authCtx.isLoggedIn !== true) return;
    if (!pushSupported() || Notification.permission !== 'granted') return;
    subscribeToPush(authCtx, axiosGlobal).catch(() => {});
  }, [authCtx.isLoggedIn]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Service worker → app bridge: when a push notification is clicked and the app
  // is already open, the SW posts the target route here for smooth in-app
  // navigation (no full reload).
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMsg = (event) => {
      if (event.data?.type === 'notification-navigate' && event.data.url) {
        history.push(event.data.url);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    return () => navigator.serviceWorker.removeEventListener('message', onMsg);
  }, [history]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <PermissionProvider>
        <SnackBar />
        {authCtx.isLoggedIn === true && <GhostBanner />}
        {authCtx.isLoggedIn === true && <PwaInstallPrompt />}
        {authCtx.isLoggedIn === true && <EnableNotificationsPrompt />}
        <Switch>
          <Route path="/logIn" exact>
            {authCtx.isLoggedIn === true ? <Redirect to="/" /> : <LogIn />}
          </Route>

          {authCtx.isLoggedIn === true ? (
            <Route exact path="/">
              <Main />
            </Route>
          ) : (
            <Redirect to="/logIn" />
          )}

          {authCtx.isLoggedIn === true ? (
            <Route path="/crm">
              <Main />
            </Route>
          ) : (
            <Redirect to="/logIn" />
          )}

          {authCtx.isLoggedIn === true ? (
            <Route exact path="/users">
              <Main />
            </Route>
          ) : (
            <Redirect to="/logIn" />
          )}

          {authCtx.isLoggedIn === true ? (
            <Route path="/digitalMarketing">
              <Main />
            </Route>
          ) : (
            <Redirect to="/logIn" />
          )}

          {authCtx.isLoggedIn === true ? (
            <Route path="/tutorials">
              <Main />
            </Route>
          ) : (
            <Redirect to="/logIn" />
          )}

          {/* Self-service Activity Log — login-only, deliberately
              NOT gated by users:view (see main.js's isMyActivity branch). */}
          {authCtx.isLoggedIn === true ? (
            <Route path="/myActivity">
              <Main />
            </Route>
          ) : (
            <Redirect to="/logIn" />
          )}

          {authCtx.isLoggedIn === true && (
            <Route path="/restricted" exact>
              <RestrictedAccessScreen />
            </Route>
          )}

          {/* Outside the auth gate on purpose — the resolver handles the
              logged-out case itself (redirect to /logIn + return here after). */}
          <Route path="/l/:code" exact>
            <ShortLinkResolver />
          </Route>

          {/* Genuinely public, no login at all — a customer with no XMS
              account opens this. See publicLinkPage.js + the unauthenticated
              GET /digitalMarketing/public/link-pages/:code backend route. */}
          <Route path="/p/:code" exact>
            <PublicLinkPage />
          </Route>
        </Switch>
      </PermissionProvider>
    </ThemeProvider>
  );
};

function App() {
  // service worker reg — once on mount, not every render; logs the real reason
  // on failure (e.g. a server rewrite serving index.html for /serviceWorker.js
  // instead of the actual script — a MIME-type mismatch the browser rejects).
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/serviceWorker.js')
        .then(() => { console.log('service worker registered'); })
        .catch((err) => { console.error('service worker registration failed:', err); });
    }
  }, []);

  return (
    <LanguageContextProvider>
      <ThemeContextProvider>
        <ThemedApp />
      </ThemeContextProvider>
    </LanguageContextProvider>
  );
}

export default App;
