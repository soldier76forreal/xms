import ReceiptIcon from '@mui/icons-material/Receipt';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Diversity2Icon from '@mui/icons-material/Diversity2';
import MovieIcon from '@mui/icons-material/Movie';
import InventoryIcon from '@mui/icons-material/Inventory';

// ── Phase 7 navConfig — the single source of truth for section navigation ─────
// Consumed by BOTH the desktop icon rail (sideRail.js) and the mobile drawer
// (leftSideNav.js). Each item's `permission` is the key required to see it —
// the rail/drawer are generated from the permission set (no key → no icon).
// `section` indexes are stable and sparse: 3 (Job Report) and 4 (Project
// Manager) were retired 2026-07-09 — do not reuse their numbers.
// Session 58 extends these entries with per-section `topBar` configs.
export const NAV_ITEMS = [
  { label: 'Invoices',          icon: <ReceiptIcon />,         section: 0, path: '/mis',              permission: 'mis:view' },
  { label: 'Customers',         icon: <PeopleAltIcon />,       section: 2, path: '/crm',              permission: 'crm:view' },
  { label: 'Files',             icon: <InsertDriveFileIcon />, section: 1, path: '/files',            permission: 'files:view' },
  { label: 'Inventory',         icon: <InventoryIcon />,       section: 5, path: '/inventory',        permission: 'inventory:view' },
  { label: 'People',            icon: <Diversity2Icon />,      section: 6, path: '/users',            permission: 'users:view' },
  { label: 'Digital Marketing', icon: <MovieIcon />,           section: 7, path: '/digitalMarketing', permission: 'digitalMarketing:view' },
];

export const RAIL_WIDTH_COLLAPSED = 52;
export const RAIL_WIDTH_EXPANDED  = 208;
export const NAV_EXPANDED_KEY     = 'xms_navExpanded';
