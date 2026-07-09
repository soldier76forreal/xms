import { Fragment, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import MainNav    from '../../tools/navs/mainNav';
import Mis        from '../mis/mis';
import Crm        from '../crm/crm';
import FileMain   from '../fileManager/fileMain';
import MainJobReport from '../jobReport/mainJobReport';
import Projects   from '../projectManager/projects';
import Inventory  from '../inventory/inventory';
import Users      from '../users/users';
import DigitalMarketing from '../digitalMarketing/digitalMarketing';

import PageSection from '../../contextApi/pageSection';

const PATH_TO_SECTION = {
  '/mis':       0,
  '/files':     1,
  '/crm':       2,
  '/jobReport': 3,
  '/projects':  4,
  '/inventory': 5,
  '/users':     6,
  '/digitalMarketing': 7,
};

const Main = () => {
  const pageSection = useContext(PageSection);
  const location    = useLocation();

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
      <div style={{ marginTop: '60px' }}>
        {pageSection.selectedSection === 0 ? <Mis />
          : pageSection.selectedSection === 1 ? <FileMain />
          : pageSection.selectedSection === 2 ? <Crm />
          : pageSection.selectedSection === 3 ? <MainJobReport />
          : pageSection.selectedSection === 4 ? <Projects />
          : pageSection.selectedSection === 5 ? <Inventory />
          : pageSection.selectedSection === 6 ? <Users />
          : pageSection.selectedSection === 7 ? <DigitalMarketing />
          : null}
      </div>
    </Fragment>
  );
};

export default Main;
