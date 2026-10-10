// Single on/off switch for the public-website integration: Inventory's
// Website Tools panel and product price-request panel, Digital Marketing's
// Product Content / Analytics / Blog tabs, the MIS Customer-branch requests
// pill, and the website purchase-request block on a CRM customer's Requests
// tab. Setting this to false hides all of them without deleting anything.
// It has a server half — WEBSITE_API_ENABLED in api/featureFlags.js, which
// unmounts the endpoints these screens call. KEEP THE TWO IN STEP: this one
// on its own means screens whose requests answer 503, and the server one on
// its own just leaves endpoints nothing is calling.
export const WEBSITE_FEATURES_ENABLED = true;

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
