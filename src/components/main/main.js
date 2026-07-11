import { Fragment, useContext, useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import StoreIcon from '@mui/icons-material/Store';
import { useTheme } from '@mui/material/styles';

import MainNav    from '../../tools/navs/mainNav';
import SideRail   from '../../tools/navs/sideRail';
import { NAV_ITEMS, RAIL_WIDTH_COLLAPSED, RAIL_WIDTH_EXPANDED, NAV_EXPANDED_KEY } from '../../tools/navs/navConfig';
import Mis        from '../mis/mis';
import Crm        from '../crm/crm';
import FileMain   from '../fileManager/fileMain';
import Inventory  from '../inventory/inventory';
import Users      from '../users/users';
import DigitalMarketing from '../digitalMarketing/digitalMarketing';

import PageSection from '../../contextApi/pageSection';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';

// Section indexes 3 (Job Report) and 4 (Project Manager) were retired 2026-07-09 —
// surviving indexes are kept stable so persisted section state stays valid.
const PATH_TO_SECTION = {
  '/mis':       0,
  '/files':     1,
  '/crm':       2,
  '/inventory': 5,
  '/users':     6,
  '/digitalMarketing': 7,
};

const Main = () => {
  const pageSection = useContext(PageSection);
  const location    = useLocation();
  const history     = useHistory();
  const theme       = useTheme();
  const isDark      = theme.palette.mode === 'dark';
  const { can, ready } = usePermissions();
  const { switching, activeBranch } = useBranch();

  // Phase 7 icon rail — collapsed by default, expansion persisted per user.
  const [navExpanded, setNavExpanded] = useState(() => localStorage.getItem(NAV_EXPANDED_KEY) === '1');
  const toggleNav = () => setNavExpanded(prev => {
    const next = !prev;
    localStorage.setItem(NAV_EXPANDED_KEY, next ? '1' : '0');
    return next;
  });
  // Collapses the rail after a section is picked — expanding is a deliberate
  // "show me labels for a moment" action, not a standing layout preference.
  const collapseNav = () => { setNavExpanded(false); localStorage.setItem(NAV_EXPANDED_KEY, '0'); };
  const railWidth = navExpanded ? RAIL_WIDTH_EXPANDED : RAIL_WIDTH_COLLAPSED;

  // Sync URL → selectedSection so direct navigation / page refresh works —
  // AND enforce access: a section the user has no view permission for is never
  // rendered (typing the URL included); they're redirected to their first
  // accessible section instead. Backend guards stay the real gate — this is UX.
  useEffect(() => {
    if (!ready) return;   // don't judge against the not-yet-loaded permission set

    const path  = location.pathname;
    const entry = Object.entries(PATH_TO_SECTION).find(([p]) => path.startsWith(p));
    if (!entry) return;

    const [matchedPath, sectionIdx] = entry;
    const navItem = NAV_ITEMS.find((n) => n.path === matchedPath);
    const allowed = !navItem?.permission || can(navItem.permission);

    if (!allowed) {
      const firstAccessible = NAV_ITEMS.find((n) => !n.permission || can(n.permission));
      if (firstAccessible) {
        pageSection.selectedSectionFunc(firstAccessible.section);
        history.replace(firstAccessible.path);
      }
      return;
    }

    if (sectionIdx !== pageSection.selectedSection) {
      pageSection.selectedSectionFunc(sectionIdx);
    }
  }, [location.pathname, ready]);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Fragment>
      <MainNav />
      <SideRail expanded={navExpanded} onToggle={toggleNav} onNavigate={collapseNav} />
      {/* Content shifts right by the rail width on desktop; rail is hidden on mobile.
          bgcolor + minHeight guarantee the app canvas is theme-dark even under
          sections that don't paint their own full-height background. */}
      <Box sx={{ mt: '60px', ml: { xs: 0, md: `${railWidth}px` }, transition: 'margin-left 0.18s ease',
        bgcolor: 'background.default', minHeight: 'calc(100vh - 60px)' }}>
        {pageSection.selectedSection === 0 ? <Mis />
          : pageSection.selectedSection === 1 ? <FileMain />
          : pageSection.selectedSection === 2 ? <Crm />
          : pageSection.selectedSection === 5 ? <Inventory />
          : pageSection.selectedSection === 6 ? <Users />
          : pageSection.selectedSection === 7 ? <DigitalMarketing />
          : null}
      </Box>

      {/* Branch-switch overlay — branch-scoped sections (Inventory/Invoices)
          refetch off activeBranchId while this is up */}
      <Dialog open={switching} PaperProps={{ sx: {
        bgcolor: isDark ? '#0d0d0d' : theme.palette.background.paper,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
        borderRadius: '14px', backgroundImage: 'none', px: 4, py: 3,
      }}}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ position: 'relative', display: 'flex' }}>
            <CircularProgress size={44} thickness={2.5}
              sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)' }} />
            <StoreIcon sx={{ position: 'absolute', inset: 0, m: 'auto', fontSize: 19,
              color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)' }} />
          </Box>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700,
            color: isDark ? '#fff' : 'text.primary' }}>
            Switching branch…
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', textAlign: 'center',
            color: isDark ? 'rgba(255,255,255,0.45)' : 'text.secondary' }}>
            Loading {activeBranch?.name ? `“${activeBranch.name}”` : 'the selected branch'} —
            Inventory and Invoices are being refreshed.
          </Typography>
        </Box>
      </Dialog>
    </Fragment>
  );
};

export default Main;
