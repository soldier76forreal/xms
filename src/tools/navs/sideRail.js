import { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useTheme } from '@mui/material/styles';
import { useHistory } from 'react-router-dom';

import AuthContext from '../../components/authAndConnections/auth';
import AxiosGlobal from '../../components/authAndConnections/axiosGlobalUrl';
import PageSection from '../../contextApi/pageSection';
import { usePermissions } from '../../contextApi/PermissionContext';
import NormalMenuForProfile from './normalMenuForProfile';
import ProfilePhoto from '../../assets/imagePlaceHolder.png';
import { NAV_ITEMS, RAIL_WIDTH_COLLAPSED, RAIL_WIDTH_EXPANDED } from './navConfig';

// ── Phase 7 — desktop icon rail (Session 57) ──────────────────────────────────
// Collapsed (default): ~52px, icons only, tooltips. Expanded: icons + labels.
// Toggle persisted by the parent (main.js) in localStorage. Items are generated
// from the permission set. Profile avatar lives at the BOTTOM of the rail —
// moved out of the top bar on desktop per the Phase 7 spec. Desktop only:
// mobile keeps the SwipeableDrawer (leftSideNav.js) via the top-bar hamburger.
const SideRail = ({ expanded, onToggle }) => {
  const theme       = useTheme();
  const isDark      = theme.palette.mode === 'dark';
  const history     = useHistory();
  const pageSection = useContext(PageSection);
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const openProfileMenu  = (e) => setAnchorEl(e.currentTarget);
  const closeProfileMenu = () => setAnchorEl(null);
  const logOut = () => { authCtx.logout(); setAnchorEl(null); };

  const T = {
    BG:       isDark ? '#0d0d0d'                : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    ICON:     isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
    ICON_ACT: isDark ? '#ffffff'                : '#000000',
    LABEL:    isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
    ACT_BG:   isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    HVR_BG:   isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const visibleItems = NAV_ITEMS.filter(item => !item.permission || can(item.permission));

  const profileImage = authCtx.decode?.profileImage;
  const avatarSrc = profileImage?.filename
    ? `${axiosGlobal.defaultTargetApi}/uploads/${profileImage.filename}`
    : ProfilePhoto;

  return (
    <>
      <NormalMenuForProfile
        logOut={logOut}
        handleClick={openProfileMenu}
        handleClose={closeProfileMenu}
        open={menuOpen}
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
      />

      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        position: 'fixed', left: 0, top: '60px', bottom: 0, zIndex: 1100,
        width: expanded ? RAIL_WIDTH_EXPANDED : RAIL_WIDTH_COLLAPSED,
        bgcolor: T.BG,
        borderRight: `1px solid ${T.BD}`,
        transition: 'width 0.18s ease',
        overflow: 'hidden',
      }}>

        {/* Section items — permission-filtered */}
        <Box sx={{ flexGrow: 1, pt: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {visibleItems.map((item) => {
            const active = pageSection.selectedSection === item.section;
            const btn = (
              <Box
                key={item.section}
                onClick={() => { pageSection.selectedSectionFunc(item.section); history.push(item.path); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  mx: '6px', px: '8px', height: 40, borderRadius: '8px',
                  cursor: 'pointer', position: 'relative', flexShrink: 0,
                  bgcolor: active ? T.ACT_BG : 'transparent',
                  '&:hover': { bgcolor: active ? T.ACT_BG : T.HVR_BG },
                  transition: 'background-color 0.12s',
                }}>
                {/* active dot on the rail edge */}
                {active && (
                  <Box sx={{
                    position: 'absolute', left: '-6px', top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 18, borderRadius: '0 3px 3px 0',
                    bgcolor: T.ICON_ACT,
                  }} />
                )}
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: active ? T.ICON_ACT : T.ICON, flexShrink: 0,
                  '& svg': { fontSize: 20 },
                }}>
                  {item.icon}
                </Box>
                {expanded && (
                  <Typography noWrap sx={{
                    fontSize: '0.8rem', fontWeight: active ? 700 : 500,
                    color: active ? T.ICON_ACT : T.LABEL,
                  }}>
                    {item.label}
                  </Typography>
                )}
              </Box>
            );
            return expanded ? btn : (
              <Tooltip key={item.section} title={item.label} placement="right">{btn}</Tooltip>
            );
          })}
        </Box>

        {/* Bottom: collapse toggle + profile avatar */}
        <Box sx={{ pb: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
          <Tooltip title={expanded ? 'Collapse' : 'Expand'} placement="right">
            <IconButton size="small" onClick={onToggle}
              sx={{ color: T.ICON, '&:hover': { color: T.ICON_ACT, bgcolor: T.HVR_BG } }}>
              {expanded ? <ChevronLeftIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile" placement="right">
            <Box onClick={openProfileMenu}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer',
                borderRadius: '10px', p: '4px',
                width: expanded ? 'calc(100% - 12px)' : 'auto',
                '&:hover': { bgcolor: T.HVR_BG },
              }}>
              <Avatar alt="Profile" src={avatarSrc} sx={{ width: 32, height: 32, flexShrink: 0 }} />
              {expanded && (
                <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.LABEL }}>
                  {authCtx.decode?.firstName} {authCtx.decode?.lastName}
                </Typography>
              )}
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </>
  );
};

export default SideRail;
