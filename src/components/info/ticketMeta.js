// The vocabulary of Report & Info — kept beside the UI that draws it.
//
// TICKET_TYPES / STATUSES / AREAS mirror api/utils/feedbackConstants.js. The
// server validates against ITS list and refuses anything else, so a value added
// here and not there fails loudly on the first submit rather than quietly.
// What is stored is the English key; only the label is translated.
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';

export const TICKET_TYPES = [
  { value: 'bug',        labelKey: 'info.typeBug',        hintKey: 'info.typeBugHint',        Icon: BugReportOutlinedIcon, color: '#F59E0B' },
  { value: 'suggestion', labelKey: 'info.typeSuggestion', hintKey: 'info.typeSuggestionHint', Icon: LightbulbOutlinedIcon, color: '#3B82F6' },
];

// In the order a ticket normally moves through them. Colours are a dot beside
// the label — the label carries the meaning, so nothing is colour-only.
export const TICKET_STATUSES = [
  { value: 'open',        labelKey: 'info.status.open',        color: '#94A3B8' },
  { value: 'in_review',   labelKey: 'info.status.in_review',   color: '#38BDF8' },
  { value: 'planned',     labelKey: 'info.status.planned',     color: '#A78BFA' },
  { value: 'in_progress', labelKey: 'info.status.in_progress', color: '#FBBF24' },
  { value: 'done',        labelKey: 'info.status.done',        color: '#34D399' },
  { value: 'declined',    labelKey: 'info.status.declined',    color: '#78716C' },
];

export const statusMeta = (value) => TICKET_STATUSES.find((s) => s.value === value) || TICKET_STATUSES[0];
export const typeMeta = (value) => TICKET_TYPES.find((x) => x.value === value) || TICKET_TYPES[0];

// Section names reuse the nav labels, so a renamed section is renamed here too.
export const TICKET_AREAS = [
  { value: 'mis',              labelKey: 'nav.invoices' },
  { value: 'crm',              labelKey: 'nav.customers' },
  { value: 'files',            labelKey: 'nav.files' },
  { value: 'inventory',        labelKey: 'nav.inventory' },
  { value: 'people',           labelKey: 'nav.people' },
  { value: 'digitalMarketing', labelKey: 'nav.digitalMarketing' },
  { value: 'jobReports',       labelKey: 'nav.jobReports' },
  { value: 'tutorials',        labelKey: 'nav.tutorials' },
  { value: 'supply',           labelKey: 'nav.supply' },
  { value: 'website',          labelKey: 'info.areaWebsite' },
  { value: 'reportInfo',       labelKey: 'nav.info' },
  { value: 'login',            labelKey: 'info.areaLogin' },
  { value: 'other',            labelKey: 'info.areaOther' },
];

export const areaLabelKey = (value) => (TICKET_AREAS.find((a) => a.value === value) || TICKET_AREAS[TICKET_AREAS.length - 1]).labelKey;

// Where the person was when they decided to report. The form is opened from
// /info, so the page itself says nothing; main.js remembers the page before it.
const PATH_AREAS = [
  ['/mis', 'mis'], ['/crm', 'crm'], ['/files', 'files'], ['/inventory', 'inventory'],
  ['/users', 'people'], ['/digitalMarketing', 'digitalMarketing'], ['/jobReports', 'jobReports'],
  ['/tutorials', 'tutorials'], ['/supply', 'supply'], ['/myActivity', 'jobReports'],
];
export const areaForPath = (path = '') => {
  const hit = PATH_AREAS.find(([prefix]) => path.startsWith(prefix));
  return hit ? hit[1] : 'other';
};

export const LIMITS = { titleMax: 120, descriptionMax: 5000, maxFiles: 10, maxVoice: 3 };

// Statuses in which the person who filed a ticket may still edit it. Mirrors
// EDITABLE_STATUSES in api/utils/feedbackConstants.js — the server is the real
// gate (it answers 409 FEEDBACK_LOCKED); this only decides whether to show the
// Edit button. Once a developer has picked a report up, it is theirs to move.
export const EDITABLE_STATUSES = ['open'];
export const isEditable = (status) => EDITABLE_STATUSES.includes(status);

// The statuses a developer can set, in the order the picker lists them.
export const STATUS_VALUES = TICKET_STATUSES.map((s) => s.value);
