import { Fragment, useContext, useState, useEffect } from "react";
import ReactDom from 'react-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsIcon from '@mui/icons-material/Notifications';

import AuthContext from "../../components/authAndConnections/auth";
import AxiosGlobal from "../../components/authAndConnections/axiosGlobalUrl";
import ThemeCtx from "../../contextApi/themeContext";

import NormalMenuForProfile from './normalMenuForProfile';
import LeftSideNav from "./leftSideNav";
import NotificationCenter from "../../components/users/notificationCenter";

import ProfilePhoto from '../../assets/imagePlaceHolder.png';

// Top bar (Phase 7) — deliberately minimal: X logo + the notification bell
// (the one fixed element across every section). Search, Messages, Uploads,
// theme toggle, and the branch switcher were removed/relocated 2026-07-09 —
// branch + theme now live in the side rail (desktop) / nav drawer (mobile).
const MainNavPortal = (props) => {
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const authContext = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { themeMode } = useContext(ThemeCtx);

  const profileImage = authContext.decode?.profileImage;

  const [leftSideNav, setLeftSideNav] = useState({ left: false });

  // Initial unread count — the badge must be correct on page load, not only
  // after the panel has been opened once.
  useEffect(() => {
    if (!authContext.isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authContext.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/notifications`,
          params: { limit: 1 },
        });
        if (!cancelled) setUnreadCount(res.data.unreadCount || 0);
      } catch { /* badge stays 0 — non-fatal */ }
    })();
    return () => { cancelled = true; };
  }, [authContext.isLoggedIn]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time unread count from socket (new notifications arrive even when panel is closed)
  useEffect(() => {
    const socket = authContext.socket;
    if (!socket) return;
    const handler = () => setUnreadCount(prev => prev + 1);
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [authContext.socket]);

  const toggleDrawer = (anchor, open) => (event) => {
    if (event?.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setLeftSideNav({ ...leftSideNav, [anchor]: open });
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const logOut = () => { authContext.logout(); setAnchorEl(null); };

  const avatarSrc = profileImage?.filename
    ? `${axiosGlobal.defaultTargetApi}/uploads/${profileImage.filename}`
    : ProfilePhoto;

  // The X mark (client asset recreated as SVG so it stays crisp and theme-aware):
  // dark theme = black bold X on a white tile; light theme = inverted.
  const logo = (
    <Box component="svg" viewBox="0 0 64 64" aria-label="XMS"
      sx={{ width: 30, height: 30, borderRadius: '7px', flexShrink: 0, display: 'block' }}>
      <rect width="64" height="64" rx="10"
        fill={themeMode === 'light' ? '#000000' : '#ffffff'} />
      <text x="32" y="33" textAnchor="middle" dominantBaseline="central"
        fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="44"
        fill={themeMode === 'light' ? '#ffffff' : '#000000'}>X</text>
    </Box>
  );

  return (
    <Fragment>
      <NotificationCenter
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={(count) => setUnreadCount(count)}
      />

      <NormalMenuForProfile
        logOut={logOut}
        handleClick={handleClick}
        handleClose={handleClose}
        open={open}
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
      />
      <LeftSideNav
        a11yProps={props.a11yProps}
        toggleDrawer={toggleDrawer}
        setLeftSideNav={setLeftSideNav}
        leftSideNav={leftSideNav}
      />

      <AppBar position="fixed" dir="ltr">
        <Toolbar sx={{ gap: 1, position: 'relative' }}>

          {/* X logo — dead-center on mobile (absolute so surrounding buttons don't shift it) */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, position: 'absolute',
            left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }}>
            {logo}
          </Box>

          {/* Hamburger / back — mobile only; the Phase 7 icon rail covers desktop */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={leftSideNav.left ? toggleDrawer('left', false) : toggleDrawer('left', true)}
            sx={{ mr: 0.5, display: { xs: 'inline-flex', md: 'none' } }}
          >
            {leftSideNav.left ? <ArrowBackIcon /> : <MenuIcon />}
          </IconButton>

          {/* X logo — left on desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {logo}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right-side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.5 } }}>

            {/* Notifications — the single fixed element across all sections */}
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={() => {
                  setNotifOpen(true);
                  setUnreadCount(0); // panel fetch will set the real count
                }}
              >
                <Badge badgeContent={unreadCount > 0 ? unreadCount : null} color="error" max={99}>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile avatar — mobile only; on desktop it lives at the bottom of the icon rail */}
            <Tooltip title="Profile">
              <IconButton
                id="demo-positioned-button"
                aria-controls={open ? 'demo-positioned-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{ p: 0.5, display: { xs: 'inline-flex', md: 'none' } }}
              >
                <Avatar alt="Profile" src={avatarSrc} sx={{ width: 36, height: 36 }} />
              </IconButton>
            </Tooltip>

          </Box>
        </Toolbar>
      </AppBar>
    </Fragment>
  );
};

const MainNav = (props) => {
  return (
    <Fragment>
      {ReactDom.createPortal(
        <MainNavPortal
          notifCount={props.notifCount}
          showNotfication={props.showNotfication}
          setShowNotfication={props.setShowNotfication}
        />,
        document.getElementById('headSec')
      )}
    </Fragment>
  );
};

export default MainNav;
