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
import EmailIcon from '@mui/icons-material/Email';
import UploadIcon from '@mui/icons-material/Upload';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import Lottie from "lottie-react";
import UploadArrowAnimation from '../../assets/uploadArrowAnimation.json';

import AuthContext from "../../components/authAndConnections/auth";
import AxiosGlobal from "../../components/authAndConnections/axiosGlobalUrl";
import ThemeCtx from "../../contextApi/themeContext";

import NormalMenuForProfile from './normalMenuForProfile';
import LeftSideNav from "./leftSideNav";
import FilterModal from "./filterModal";
import SearchBar from "./searchModule";
import DownloadNavigation from "./downloadNavigation";
import NotificationCenter from "../../components/users/notificationCenter";
import BranchSwitcher from "./branchSwitcher";

import { useDispatch, useSelector } from "react-redux";
import { actions } from "../../store/store";
import ProfilePhoto from '../../assets/imagePlaceHolder.png';

const MainNavPortal = (props) => {
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openFilterModal, setOpenFilterModal] = useState(false);

  const authContext = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { themeMode, toggleTheme } = useContext(ThemeCtx);

  const profileImage = authContext.decode?.profileImage;
  const dispatch = useDispatch();
  const navDownloadList = useSelector((state) => state.downloadNavMenu);
  const onGoingUpload = useSelector((state) => state.onGoingUpload);

  const [leftSideNav, setLeftSideNav] = useState({ left: false });

  // Real-time unread count from socket (new notifications arrive even when panel is closed)
  useEffect(() => {
    const socket = authContext.socket;
    if (!socket) return;
    const handler = () => {
      setUnreadCount(prev => prev + 1);
    };
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

  return (
    <Fragment>
      <FilterModal setOpenFilterModal={setOpenFilterModal} openFilterModal={openFilterModal} />
      <DownloadNavigation />

      {/* New notification center drawer */}
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
        <Toolbar sx={{ gap: 1 }}>

          {/* Hamburger / back */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={leftSideNav.left ? toggleDrawer('left', false) : toggleDrawer('left', true)}
            sx={{ mr: 0.5 }}
          >
            {leftSideNav.left ? <ArrowBackIcon /> : <MenuIcon />}
          </IconButton>

          {/* Search — centre, grows to fill available space */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', maxWidth: 440, mx: 'auto' }}>
            <SearchBar />
          </Box>

          {/* Right-side action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

            {/* Upload / in-progress indicator */}
            <Tooltip title="Uploads">
              <IconButton
                color="inherit"
                onClick={() => dispatch(actions.toggleDownloadNavMenu())}
              >
                {onGoingUpload === true ? (
                  <Lottie style={{ width: 28, height: 28 }} animationData={UploadArrowAnimation} loop />
                ) : (
                  <UploadIcon />
                )}
              </IconButton>
            </Tooltip>

            <BranchSwitcher />

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

            {/* Messages */}
            <Tooltip title="Messages">
              <IconButton color="inherit">
                <Badge badgeContent={0} color="error">
                  <EmailIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Dark / Light toggle */}
            <Tooltip title={themeMode === 'light' ? 'Dark mode' : 'Light mode'}>
              <IconButton color="inherit" onClick={toggleTheme}>
                {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Profile avatar */}
            <Tooltip title="Profile">
              <IconButton
                id="demo-positioned-button"
                aria-controls={open ? 'demo-positioned-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{ p: 0.5 }}
              >
                <Avatar
                  alt="Profile"
                  src={avatarSrc}
                  sx={{ width: 36, height: 36 }}
                />
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
