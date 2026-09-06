import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import Diversity2Icon from '@mui/icons-material/Diversity2';
import MovieIcon from '@mui/icons-material/Movie';
import SchoolIcon from '@mui/icons-material/School';

// ── Phase 7 navConfig — the single source of truth for section navigation ─────
// Consumed by BOTH the desktop icon rail (sideRail.js) and the mobile drawer
// (leftSideNav.js). Each item's `permission` is the key required to see it —
// the rail/drawer are generated from the permission set (no key → no icon).
// `section` indexes are stable and sparse: 0 (MIS), 1 (Files), 3 (Job Report),
// 4 (Project Manager), 5 (Inventory) and 9 (Job Reports) were retired — do
// not reuse their numbers.
// Session 58 extends these entries with per-section `topBar` configs.
// `navKey` maps to i18n/locales/<lang>.json's `nav.*` — consumers call
// t(`nav.${item.navKey}`) instead of the hardcoded `label` so a new section
// only needs a navKey + one line per locale file, nothing else.
export const NAV_ITEMS = [
  { label: 'Customers',         navKey: 'customers',         icon: <PeopleAltIcon />,       section: 2, path: '/crm',              permission: 'crm:view' },
  { label: 'People',            navKey: 'people',            icon: <Diversity2Icon />,      section: 6, path: '/users',            permission: 'users:view' },
  { label: 'Digital Marketing', navKey: 'digitalMarketing',  icon: <MovieIcon />,           section: 7, path: '/digitalMarketing', permission: 'digitalMarketing:view' },
  { label: 'Tutorials',         navKey: 'tutorials',         icon: <SchoolIcon />,          section: 8, path: '/tutorials',        permission: 'tutorials:view' },
];

export const RAIL_WIDTH_COLLAPSED = 52;
export const RAIL_WIDTH_EXPANDED  = 208;
export const NAV_EXPANDED_KEY     = 'xms_navExpanded';
