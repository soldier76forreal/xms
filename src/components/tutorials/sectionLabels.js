// Tutorial doc `section` values are module-prefix-shaped (crm/mis/users/...) to
// match the permission-key tag taxonomy, but navConfig.js's `navKey`s don't use
// the same words (crm->customers, mis->invoices, users->people) — so tutorial
// UI text uses its own dedicated i18n keys instead of reusing nav.* directly.
export const SECTIONS = ['crm', 'mis', 'inventory', 'digitalMarketing', 'users', 'files', 'general'];

const KEY_BY_SECTION = {
  crm: 'tutorials.sectionCrm',
  mis: 'tutorials.sectionMis',
  inventory: 'tutorials.sectionInventory',
  digitalMarketing: 'tutorials.sectionDigitalMarketing',
  users: 'tutorials.sectionUsers',
  files: 'tutorials.sectionFiles',
  general: 'tutorials.sectionGeneral',
  // Extra permission-catalog module names (no tutorial `section` value of their
  // own, but the tag picker groups by every module in the live catalog) —
  // reuse the same map so the tag picker's group headers are translated too.
  tasks: 'tutorials.sectionTasks',
  tutorials: 'tutorials.sectionTutorialsModule',
};

export const sectionLabel = (section, t) => t(KEY_BY_SECTION[section] || section);
