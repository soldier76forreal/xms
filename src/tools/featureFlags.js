// Single on/off switch for the public-website integration (Website Tools,
// the product Website/Price Requests tabs, the DM Blog CMS tab) — the
// public Next.js site (website/) isn't finished yet, so these are hidden
// for this deploy rather than half-shipped in front of real users. Flip
// back to true (and nothing else) once the public site is ready to launch.
// Nothing is deleted — the backend routes/models and these frontend
// sections are all still here, just not reachable from the UI while this
// is false.
export const WEBSITE_FEATURES_ENABLED = false;
