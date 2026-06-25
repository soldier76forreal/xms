import React, { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Diversity2Icon from '@mui/icons-material/Diversity2';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import DataThresholdingIcon from '@mui/icons-material/DataThresholding';
import { Inventory } from '@mui/icons-material';

import { Link, useHistory } from 'react-router-dom';
import AuthContext from '../../components/authAndConnections/auth';
import PageSection from '../../contextApi/pageSection';

const NAV_ITEMS = [
  { label: 'Invoices',   icon: <ReceiptIcon />,          section: 0, path: '/mis' },
  { label: 'Customers',  icon: <PeopleAltIcon />,         section: 2, path: '/crm' },
  { label: 'Files',      icon: <InsertDriveFileIcon />,   section: 1, path: '/files' },
  { label: 'Job Report', icon: <WorkHistoryIcon />,       section: 3, path: '/jobReport', disabled: true },
  { label: 'Marketing',  icon: <DataThresholdingIcon />,  section: 4, path: '/projects', disabled: true },
  { label: 'Inventory',  icon: <Inventory />,             section: 5, path: '/inventory' },
];

export default function LeftSideNav(props) {
  const authContext = useContext(AuthContext);
  const pageSection = useContext(PageSection);
  const history = useHistory();

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

        {/* Main nav items */}
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.section} disablePadding>
            <ListItemButton
              selected={pageSection.selectedSection === item.section}
              disabled={item.disabled || false}
              onClick={() => {
                pageSection.selectedSectionFunc(item.section);
                history.push(item.path);
              }}
              sx={{
                borderRadius: 2,
                mx: 1,
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

        <Divider sx={{ my: 1 }} />

        {/* People — super admin only */}
        <ListItem disablePadding>
          {authContext.access.includes('sa') ? (
            <ListItemButton
              component={Link}
              to="/users"
              sx={{
                borderRadius: 2,
                mx: 1,
                color: 'text.primary',
                textDecoration: 'none',
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: 'inherit' }}>
                <Diversity2Icon />
              </ListItemIcon>
              <ListItemText
                primary="People"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
            </ListItemButton>
          ) : (
            <ListItemButton
              disabled
              sx={{ borderRadius: 2, mx: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: 'inherit' }}>
                <Diversity2Icon />
              </ListItemIcon>
              <ListItemText
                primary="People"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
            </ListItemButton>
          )}
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
      >
        {drawerContent('left')}
      </SwipeableDrawer>
    </React.Fragment>
  );
}
