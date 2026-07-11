import { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import StoreIcon from '@mui/icons-material/Store';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme } from '@mui/material/styles';
import { useHistory } from 'react-router-dom';

import AuthContext from '../../components/authAndConnections/auth';
import AxiosGlobal from '../../components/authAndConnections/axiosGlobalUrl';
import PageSection from '../../contextApi/pageSection';
import ThemeCtx from '../../contextApi/themeContext';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';
import NormalMenuForProfile from './normalMenuForProfile';
import ProfilePhoto from '../../assets/imagePlaceHolder.png';
import { NAV_ITEMS, RAIL_WIDTH_COLLAPSED, RAIL_WIDTH_EXPANDED } from './navConfig';

// ── Phase 7 — desktop icon rail ───────────────────────────────────────────────
// Layout (top → bottom): collapse toggle · section items · branch picker ·
// theme toggle · profile avatar. Branch + theme moved here from the top bar
// (2026-07-09). Desktop only — mobile keeps the drawer (leftSideNav.js).
const SideRail = ({ expanded, onToggle, onNavigate }) => {
  const theme       = useTheme();
  const isDark      = theme.palette.mode === 'dark';
  const history     = useHistory();
  const pageSection = useContext(PageSection);
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { themeMode, toggleTheme } = useContext(ThemeCtx);
  const { can }     = usePermissions();
  const { branches, activeBranchId, activeBranch, setActiveBranchId } = useBranch();

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const openProfileMenu  = (e) => setAnchorEl(e.currentTarget);
  const closeProfileMenu = () => setAnchorEl(null);
  const logOut = () => { authCtx.logout(); setAnchorEl(null); };

  const [branchAnchor, setBranchAnchor] = useState(null);

  const T = {
    BG:       isDark ? '#0d0d0d'                : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    ICON:     isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
    ICON_ACT: isDark ? '#ffffff'                : '#000000',
    LABEL:    isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
    ACT_BG:   isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    HVR_BG:   isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    MENU_BG:  isDark ? '#181818'                : theme.palette.background.paper,
  };

  const visibleItems = NAV_ITEMS.filter(item => !item.permission || can(item.permission));

  const profileImage = authCtx.decode?.profileImage;
  const avatarSrc = profileImage?.filename
    ? `${axiosGlobal.defaultTargetApi}/uploads/${profileImage.filename}`
    : ProfilePhoto;

  // Shared row shell for the bottom utility rows (branch / theme)
  const utilRow = (icon, label, onClick, tooltip) => {
    const row = (
      <Box onClick={onClick}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          mx: '6px', px: '8px', height: 38, borderRadius: '8px',
          cursor: 'pointer', flexShrink: 0,
          '&:hover': { bgcolor: T.HVR_BG },
          transition: 'background-color 0.12s',
        }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.ICON, flexShrink: 0, '& svg': { fontSize: 19 } }}>
          {icon}
        </Box>
        {expanded && (
          <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 500, color: T.LABEL }}>
            {label}
          </Typography>
        )}
      </Box>
    );
    return expanded ? row : <Tooltip title={tooltip || label} placement="right">{row}</Tooltip>;
  };

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

      {/* Branch picker menu (works both collapsed + expanded) */}
      <Menu
        anchorEl={branchAnchor}
        open={Boolean(branchAnchor)}
        onClose={() => setBranchAnchor(null)}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        PaperProps={{ sx: { bgcolor: T.MENU_BG, border: `1px solid ${T.BD}`, borderRadius: '10px', minWidth: 180 } }}
      >
        {branches.map((b) => {
          const active = String(b._id) === String(activeBranchId);
          return (
            <MenuItem key={b._id} dense
              onClick={() => { setActiveBranchId(b._id); setBranchAnchor(null); }}
              sx={{ fontSize: '0.82rem', gap: 1 }}>
              <StoreIcon sx={{ fontSize: 15, color: T.ICON }} />
              <Box sx={{ flexGrow: 1 }}>{b.name}</Box>
              {active && <CheckIcon sx={{ fontSize: 15 }} />}
            </MenuItem>
          );
        })}
      </Menu>

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

        {/* Collapse toggle — TOP of the rail, always visible */}
        <Box sx={{ pt: 0.75, pb: 0.5, display: 'flex', justifyContent: expanded ? 'flex-end' : 'center', px: expanded ? 1 : 0 }}>
          <Tooltip title={expanded ? 'Collapse' : 'Expand'} placement="right">
            <IconButton size="small" onClick={onToggle}
              sx={{
                color: T.ICON, border: `1px solid ${T.BD}`, borderRadius: '8px',
                width: 30, height: 30,
                '&:hover': { color: T.ICON_ACT, bgcolor: T.HVR_BG },
              }}>
              {expanded ? <ChevronLeftIcon sx={{ fontSize: 17 }} /> : <ChevronRightIcon sx={{ fontSize: 17 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ borderColor: T.BD, mx: '8px', mb: 0.5 }} />

        {/* Section items — permission-filtered */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {visibleItems.map((item) => {
            const active = pageSection.selectedSection === item.section;
            const btn = (
              <Box
                key={item.section}
                onClick={() => { pageSection.selectedSectionFunc(item.section); history.push(item.path); onNavigate && onNavigate(); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  mx: '6px', px: '8px', height: 40, borderRadius: '8px',
                  cursor: 'pointer', position: 'relative', flexShrink: 0,
                  bgcolor: active ? T.ACT_BG : 'transparent',
                  '&:hover': { bgcolor: active ? T.ACT_BG : T.HVR_BG },
                  transition: 'background-color 0.12s',
                }}>
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

        {/* Bottom utilities: branch picker · theme toggle · profile */}
        <Box sx={{ pb: 1.5, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Divider sx={{ borderColor: T.BD, mx: '8px', mb: 0.5 }} />

          {branches.length > 1 && utilRow(
            <StoreIcon />,
            activeBranch?.name || 'Branch',
            (e) => setBranchAnchor(e.currentTarget),
            `Branch — ${activeBranch?.name || ''}`
          )}

          {utilRow(
            themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />,
            themeMode === 'light' ? 'Dark mode' : 'Light mode',
            toggleTheme
          )}

          <Tooltip title="Profile" placement="right">
            <Box onClick={openProfileMenu}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer',
                borderRadius: '10px', p: '4px', mx: '6px', mt: 0.5,
                '&:hover': { bgcolor: T.HVR_BG },
              }}>
              <Avatar alt="Profile" src={avatarSrc} sx={{ width: 30, height: 30, flexShrink: 0 }} />
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
