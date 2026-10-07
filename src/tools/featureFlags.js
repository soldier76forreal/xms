// Single on/off switch for the public-website integration (Website Tools,
// the product Website/Price Requests tabs, the DM Blog CMS tab) — the
// public Next.js site (website/) isn't finished yet, so these are hidden
// for this deploy rather than half-shipped in front of real users. Flip
// back to true (and nothing else) once the public site is ready to launch.
// Nothing is deleted — the backend routes/models and these frontend
// sections are all still here, just not reachable from the UI while this
// is false.
export const WEBSITE_FEATURES_ENABLED = false;

// Inventory's "Full Analytics" button/overlay — Phase 1 shipped, disabled for
// this deploy at Pouriya's request. Nothing deleted; flip back to true to
// bring it back.
export const INVENTORY_ANALYTICS_ENABLED = false;

// SMS / OTP sign-in (sms.ir). Retired at Pouriya's request — password is now
// the only way in. The whole OTP flow is intact behind this flag: the phone and
// code steps in logIn.js, and the /auth/requestOtp + /auth/verifyOtp routes.
// Turning it back on means flipping this AND OTP_LOGIN_ENABLED in
// authApi/routes/users/auth.js — the server disables those endpoints itself,
// because an endpoint that still issues tokens is a live auth path whether or
// not the UI links to it.
export const SMS_OTP_LOGIN_ENABLED = false;

// Packing lists, pallet labels and the supply contract print through the
// BROWSER's own print engine ("Save as PDF"), exactly like invoices and
// quotations (tools/printDocument.js) — the production server can't run
// headless Chrome reliably, so a server-rendered PDF fails there ("Failed to
// download…"). Nothing is deleted: the server /pdf routes and the blob-download
// path below are intact. Flip to true once the server has a real (non-snap)
// Chrome — set PUPPETEER_EXECUTABLE_PATH, see api/utils/pdfRenderer.js — to get
// server-rendered PDF files again.
export const SERVER_SIDE_PDF_ENABLED = false;
