import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import StoreIcon from '@mui/icons-material/Store';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckIcon from '@mui/icons-material/Check';

import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageSection from '../../contextApi/pageSection';
import ThemeCtx from '../../contextApi/themeContext';
import LanguageCtx from '../../contextApi/languageContext';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';
import { NAV_ITEMS } from './navConfig';

// ── Mobile navigation drawer ──────────────────────────────────────────────────
// Phase 7: on desktop (md+) the permanent icon rail (sideRail.js) replaces this
// drawer — the top-bar hamburger that opens it is mobile-only. Items come from
// the shared navConfig and are permission-filtered the same way as the rail.
export default function LeftSideNav(props) {
  const pageSection = useContext(PageSection);
  const history     = useHistory();
  const { t }       = useTranslation();
  const { can }     = usePermissions();
  const { themeMode, toggleTheme } = useContext(ThemeCtx);
  const { language, setLanguage, languages } = useContext(LanguageCtx);
  const { branches, activeBranchId, setActiveBranchId } = useBranch();

  const visibleItems = NAV_ITEMS.filter(item => !item.permission || can(item.permission));

  const drawerContent = (anchor) => (
    <Box
      sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }}
      role="presentation"
      onClick={props.toggleDrawer(anchor, false)}
      onKeyDown={props.toggleDrawer(anchor, false)}
    >
      {/* Close button — this drawer now renders ABOVE the fixed top bar, so it
          carries its own close control (the bar's back/hamburger is covered). */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 1 }}>
        <Typography sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1, color: 'text.primary' }}>
          XCAPITAL
        </Typography>
        <IconButton size="small" onClick={props.toggleDrawer(anchor, false)}
          aria-label="Close menu" sx={{ color: 'text.secondary' }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 0.5 }} />

      <List disablePadding>

        {/* Main nav items — permission-filtered */}
        {visibleItems.map((item) => (
          <ListItem key={item.section} disablePadding>
            <ListItemButton
              selected={pageSection.selectedSection === item.section}
              onClick={() => {
                pageSection.selectedSectionFunc(item.section);
                history.push(item.path);
                props.setLeftSideNav({ left: false });   // explicit — the drawer must close on selection
              }}
              sx={{
                borderRadius: 2,
                mx: 1,
                minHeight: 44,
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  '&:hover': { backgroundColor: 'action.selected' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={t(`nav.${item.navKey}`)}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Branch picker — moved here from the top bar (Phase 7) */}
        {branches.length > 1 && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem sx={{ pt: 0, pb: 0.25 }}>
              <Typography sx={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.disabled' }}>
                {t('profile.branch')}
              </Typography>
            </ListItem>
            {branches.map((b) => {
              const active = String(b._id) === String(activeBranchId);
              return (
                <ListItem key={b._id} disablePadding>
                  <ListItemButton
                    onClick={() => { setActiveBranchId(b._id); props.setLeftSideNav({ left: false }); }}
                    sx={{ borderRadius: 2, mx: 1, minHeight: 40 }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: 'inherit' }}>
                      <StoreIcon sx={{ fontSize: 19 }} />
                    </ListItemIcon>
                    <ListItemText primary={b.name}
                      primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 700 : 400 }} />
                    {active && <CheckIcon sx={{ fontSize: 17 }} />}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </>
        )}

        {/* Language picker */}
        <Divider sx={{ my: 1 }} />
        <ListItem sx={{ pt: 0, pb: 0.25 }}>
          <Typography sx={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.disabled' }}>
            {t('profile.language')}
          </Typography>
        </ListItem>
        {languages.map((l) => {
          const active = l.code === language;
          return (
            <ListItem key={l.code} disablePadding>
              <ListItemButton
                onClick={() => { setLanguage(l.code); props.setLeftSideNav({ left: false }); }}
                sx={{ borderRadius: 2, mx: 1, minHeight: 40 }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: 'inherit' }}>
                  <TranslateIcon sx={{ fontSize: 19 }} />
                </ListItemIcon>
                <ListItemText primary={l.nativeLabel}
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 700 : 400 }} />
                {active && <CheckIcon sx={{ fontSize: 17 }} />}
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* Theme toggle — moved here from the top bar (Phase 7) */}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton onClick={toggleTheme} sx={{ borderRadius: 2, mx: 1, minHeight: 44 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: 'inherit' }}>
              {themeMode === 'light' ? <DarkModeIcon sx={{ fontSize: 19 }} /> : <LightModeIcon sx={{ fontSize: 19 }} />}
            </ListItemIcon>
            <ListItemText primary={themeMode === 'light' ? t('profile.darkMode') : t('profile.lightMode')}
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <React.Fragment>
      <SwipeableDrawer
        anchor="left"
        open={props.leftSideNav['left']}
        onClose={props.toggleDrawer('left', false)}
        onOpen={props.toggleDrawer('left', true)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {drawerContent('left')}
      </SwipeableDrawer>
    </React.Fragment>
  );
}
