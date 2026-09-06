import { Fragment, useContext, useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';

import MainNav    from '../../tools/navs/mainNav';
import SideRail   from '../../tools/navs/sideRail';
import { NAV_ITEMS, RAIL_WIDTH_COLLAPSED, RAIL_WIDTH_EXPANDED, NAV_EXPANDED_KEY } from '../../tools/navs/navConfig';
import { useSidebarWidth } from '../../tools/hooks/useSidebarWidth';
import Crm        from '../crm/crm';
import Users      from '../users/users';
import DigitalMarketing from '../digitalMarketing/digitalMarketing';
import Tutorials from '../tutorials/tutorials';
import MyActivityPage from '../users/myActivityPage';

import PageSection from '../../contextApi/pageSection';
import { usePermissions } from '../../contextApi/PermissionContext';

// Section indexes 0 (MIS), 1 (Files), 3 (Job Report), 4 (Project Manager),
// 5 (Inventory) and 9 (Job Reports) were retired — surviving indexes are kept
// stable so persisted section state stays valid.
const PATH_TO_SECTION = {
  '/crm':       2,
  '/users':     6,
  '/digitalMarketing': 7,
  '/tutorials': 8,
};

const Main = () => {
  const pageSection = useContext(PageSection);
  const location    = useLocation();
  const history     = useHistory();
  const { can, ready } = usePermissions();

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
  // Same hook the rail itself uses, so the content offset tracks a resize
  // live (the hook shares one module-level cache across both call sites).
  const { width: expandedRailWidth } = useSidebarWidth('navRail', RAIL_WIDTH_EXPANDED, { min: 140, max: 420 });
  const railWidth = navExpanded ? expandedRailWidth : RAIL_WIDTH_COLLAPSED;

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

  // What to actually RENDER, computed synchronously from the URL (not from
  // pageSection.selectedSection, which only catches up a render later via the
  // effect above). Without this, navigating straight from one section to a
  // DIFFERENT one (e.g. a short link/notification opened while CRM is showing,
  // pointing at Digital Marketing) rendered the OLD section for one extra
  // frame; that section's own `?open=` handler would see the query string —
  // `open` isn't namespaced per section — misinterpret it as its own, and call
  // history.replace to its own base path, wiping the target section's query
  // params before it ever got a chance to mount and read them. Same-section
  // links "worked" only because the stale frame and the real one agreed.
  const matchedEntry   = Object.entries(PATH_TO_SECTION).find(([p]) => location.pathname.startsWith(p));
  const matchedSection = matchedEntry ? matchedEntry[1] : null;
  const matchedNavItem = matchedEntry ? NAV_ITEMS.find((n) => n.path === matchedEntry[0]) : null;
  const matchedAllowed = !ready || !matchedNavItem?.permission || can(matchedNavItem.permission);
  const renderSection  = matchedSection !== null && matchedAllowed ? matchedSection : pageSection.selectedSection;

  // "My Activity" is deliberately NOT in PATH_TO_SECTION / NAV_ITEMS — it has no
  // rail icon and no permission gate (reachable via the profile popup only, by
  // anyone logged in, even without users:view — see myActivityPage.js).
  const isMyActivity = location.pathname.startsWith('/myActivity');

  return (
    <Fragment>
      <MainNav />
      <SideRail expanded={navExpanded} onToggle={toggleNav} onNavigate={collapseNav} />
      {/* Content shifts right by the rail width on desktop; rail is hidden on mobile.
          bgcolor + minHeight guarantee the app canvas is theme-dark even under
          sections that don't paint their own full-height background. */}
      <Box sx={{ mt: '60px', ml: { xs: 0, md: `${railWidth}px` }, transition: 'margin-left 0.18s ease',
        bgcolor: 'background.default', minHeight: 'calc(100vh - 60px)' }}>
        {isMyActivity ? <MyActivityPage />
          : renderSection === 2 ? <Crm />
          : renderSection === 6 ? <Users />
          : renderSection === 7 ? <DigitalMarketing />
          : renderSection === 8 ? <Tutorials />
          : null}
      </Box>
    </Fragment>
  );
};

export default Main;
