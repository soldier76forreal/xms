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

import { useHistory } from 'react-router-dom';
import PageSection from '../../contextApi/pageSection';
import { usePermissions } from '../../contextApi/PermissionContext';
import { NAV_ITEMS } from './navConfig';

// ── Mobile navigation drawer ──────────────────────────────────────────────────
// Phase 7: on desktop (md+) the permanent icon rail (sideRail.js) replaces this
// drawer — the top-bar hamburger that opens it is mobile-only. Items come from
// the shared navConfig and are permission-filtered the same way as the rail.
export default function LeftSideNav(props) {
  const pageSection = useContext(PageSection);
  const history     = useHistory();
  const { can }     = usePermissions();

  const visibleItems = NAV_ITEMS.filter(item => !item.permission || can(item.permission));

  const drawerContent = (anchor) => (
    <Box
      sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }}
      role="presentation"
      onClick={props.toggleDrawer(anchor, false)}
      onKeyDown={props.toggleDrawer(anchor, false)}
    >
      {/* Offset for fixed AppBar */}
      <Box sx={{ height: 64 }} />

      <List disablePadding>
        {/* Brand name */}
        <ListItem sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.primary' }}
          >
            XCAPITAL
          </Typography>
        </ListItem>

        <Divider sx={{ mb: 0.5 }} />

        {/* Main nav items — permission-filtered */}
        {visibleItems.map((item) => (
          <ListItem key={item.section} disablePadding>
            <ListItemButton
              selected={pageSection.selectedSection === item.section}
              onClick={() => {
                pageSection.selectedSectionFunc(item.section);
                history.push(item.path);
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
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
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
