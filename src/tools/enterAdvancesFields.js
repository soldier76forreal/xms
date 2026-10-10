import { useEffect } from 'react';

// Enter moves to the next field, the way Tab does.
//
// Asked for app-wide, so it is ONE listener mounted in App.js rather than a prop threaded
// through thirty forms - a form written next year gets the behaviour without knowing about it.
//
// It only acts inside a form surface (a Drawer paper, a Dialog paper or a real <form>), which
// is where every form in this app lives. Outside one - the login page, the Digital Marketing
// chat and its inline title editors, a section's search box - Enter keeps whatever meaning it
// already had.
//
// Inside a form surface it still refuses to act on anything that owns Enter itself:
//   · a textarea or multiline field, where Enter is a new line
//   · a rich text editor (TipTap renders contenteditable), same reason
//   · a button or link, where Enter activates it
//   · an Autocomplete or Select with its list open, where Enter picks the highlighted option
//   · a field whose own onKeyDown already called preventDefault - that handler owns the key
//   · anything inside [data-enter-advance="off"], the escape hatch for a future exception
//
// Checkboxes, radios and switches are deliberately neither a source nor a destination: Enter
// walks the fields you TYPE in, which is what the request is about. They are still clicked, or
// reached with Tab, which keeps working everywhere.
//
// The last field hands focus to the form's primary button WITHOUT pressing it, so a second
// Enter saves. Nothing is ever submitted by surprise.

const FORM_SURFACE = 'form, .MuiDialog-paper, .MuiDrawer-paper';

// What Enter can land ON. A textarea is a destination (Enter inside it then makes a new line)
// but never a source. MUI renders a Select as a div, so it is matched by class, not by tag.
const DESTINATIONS = [
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])'
  + ':not([type="checkbox"]):not([type="radio"]):not([type="file"])',
  'textarea',
  'select',
  '.MuiSelect-select',
].join(',');

// A field the user cannot see or reach is not a destination. MUI keeps a hidden native input
// beside every Select, which is exactly what the tabIndex / size checks drop.
const reachable = (el) => !el.disabled
  && el.getAttribute('aria-hidden') !== 'true'
  && el.tabIndex !== -1
  && Boolean(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

// Save / Create / Send: the contained button, which is how every form in this app marks its
// primary action. Falling back to a real submit button covers a plain <form>.
function primaryButton(scope) {
  const submit = scope.querySelector('button[type="submit"]:not(:disabled)');
  if (submit && reachable(submit)) return submit;
  const contained = [...scope.querySelectorAll('button.MuiButton-contained:not(:disabled)')].filter(reachable);
  return contained.length ? contained[contained.length - 1] : null;
}

function advance(scope, current) {
  const fields = [...scope.querySelectorAll(DESTINATIONS)].filter(reachable);
  const here = fields.indexOf(current);
  const next = here === -1 ? null : fields[here + 1];
  const target = next || primaryButton(scope);
  if (!target) return false;
  target.focus();
  // Land ready to overtype rather than with the caret wherever the click happened to be.
  if (typeof target.select === 'function' && target.tagName === 'INPUT') {
    try { target.select(); } catch (_) { /* a date/number input may refuse; focus is enough */ }
  }
  return true;
}

// Enter we are allowed to look at at all, in either phase.
function liveEnter(event) {
  if (event.key !== 'Enter') return false;
  // Mid-composition (an IME is still assembling a character) Enter commits that character.
  if (event.isComposing || event.keyCode === 229) return false;
  // Shift+Enter is a new line, and the modifier combinations belong to the browser.
  if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return false;
  const el = event.target;
  if (!el || el.nodeType !== 1) return false;
  return true;
}

// The form this field belongs to, or null when it belongs to none of them.
function formScope(el) {
  const scope = el.closest(FORM_SURFACE);
  if (!scope) return null;
  if (el.closest('[data-enter-advance="off"]')) return null;
  return scope;
}

export default function useEnterAdvancesFields() {
  useEffect(() => {
    // A CLOSED MUI Select has to be caught before React hands the key to MUI, which would open
    // the menu instead. That matters more than the affordance it costs: picking an option
    // returns focus to the same select, so an Enter that re-opens the menu is a field the user
    // can never get past once Tab is no longer how they move. ArrowDown and Space still open it.
    const onCapture = (event) => {
      if (!liveEnter(event)) return;
      const el = event.target;
      if (!el.classList || !el.classList.contains('MuiSelect-select')) return;
      if (el.getAttribute('aria-expanded') === 'true') return;
      if (el.getAttribute('aria-disabled') === 'true') return;
      const scope = formScope(el);
      if (!scope) return;
      if (!advance(scope, el)) return;
      event.preventDefault();
      // MUI reads the key, not defaultPrevented, so the event has to stop here.
      event.stopPropagation();
    };

    const onKeyDown = (event) => {
      if (!liveEnter(event)) return;
      // A field's own handler already dealt with it - adding a tag, sending a message, picking
      // an Autocomplete option. Never act twice on one key.
      if (event.defaultPrevented) return;

      const el = event.target;
      const scope = formScope(el);
      if (!scope) return;
      if (el.isContentEditable) return;

      const tag = el.tagName;
      const isMuiSelect = el.classList.contains('MuiSelect-select');
      if (!isMuiSelect && tag !== 'SELECT') {
        if (tag !== 'INPUT') return;    // textarea, button, link, a rich text editor's div
        if (el.getAttribute('role') === 'button') return;
        const type = String(el.type || '').toLowerCase();
        if (['submit', 'button', 'reset', 'checkbox', 'radio', 'file'].includes(type)) return;
      }
      // An open list means Enter is choosing from it.
      if (el.getAttribute('aria-expanded') === 'true') return;

      if (advance(scope, el)) event.preventDefault();
    };

    document.addEventListener('keydown', onCapture, true);
    // Bubble phase on purpose: a field's own onKeyDown runs first and can claim the key.
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onCapture, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}
