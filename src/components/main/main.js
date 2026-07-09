import { Fragment, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';

import MainNav    from '../../tools/navs/mainNav';
import SideRail   from '../../tools/navs/sideRail';
import { RAIL_WIDTH_COLLAPSED, RAIL_WIDTH_EXPANDED, NAV_EXPANDED_KEY } from '../../tools/navs/navConfig';
import Mis        from '../mis/mis';
import Crm        from '../crm/crm';
import FileMain   from '../fileManager/fileMain';
import Inventory  from '../inventory/inventory';
import Users      from '../users/users';
import DigitalMarketing from '../digitalMarketing/digitalMarketing';

import PageSection from '../../contextApi/pageSection';

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

  // Phase 7 icon rail — collapsed by default, expansion persisted per user.
  const [navExpanded, setNavExpanded] = useState(() => localStorage.getItem(NAV_EXPANDED_KEY) === '1');
  const toggleNav = () => setNavExpanded(prev => {
    const next = !prev;
    localStorage.setItem(NAV_EXPANDED_KEY, next ? '1' : '0');
    return next;
  });
  const railWidth = navExpanded ? RAIL_WIDTH_EXPANDED : RAIL_WIDTH_COLLAPSED;

  // Sync URL → selectedSection so direct navigation / page refresh works.
  useEffect(() => {
    const path    = location.pathname;
    const section = Object.entries(PATH_TO_SECTION).find(([p]) => path.startsWith(p));
    if (section) {
      const sectionIdx = section[1];
      if (sectionIdx !== pageSection.selectedSection) {
        pageSection.selectedSectionFunc(sectionIdx);
      }
    }
  }, [location.pathname]);

  return (
    <Fragment>
      <MainNav />
      <SideRail expanded={navExpanded} onToggle={toggleNav} />
      {/* Content shifts right by the rail width on desktop; rail is hidden on mobile */}
      <Box sx={{ mt: '60px', ml: { xs: 0, md: `${railWidth}px` }, transition: 'margin-left 0.18s ease' }}>
        {pageSection.selectedSection === 0 ? <Mis />
          : pageSection.selectedSection === 1 ? <FileMain />
          : pageSection.selectedSection === 2 ? <Crm />
          : pageSection.selectedSection === 5 ? <Inventory />
          : pageSection.selectedSection === 6 ? <Users />
          : pageSection.selectedSection === 7 ? <DigitalMarketing />
          : null}
      </Box>
    </Fragment>
  );
};

export default Main;
