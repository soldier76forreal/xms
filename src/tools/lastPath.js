// The last page the person was on BEFORE Report & Info.
//
// A bug report is filed from /info, so the page it is opened on says nothing
// about where the problem was. main.js calls rememberPath on every navigation;
// the report form reads it back to pre-select the section and to attach the
// page to the ticket. Module state on purpose — it is a convenience that
// should vanish with the tab, not something to persist.
let last = '';

export const rememberPath = (pathname = '') => {
  if (!pathname.startsWith('/info')) last = pathname;
};

export const lastPath = () => last;
