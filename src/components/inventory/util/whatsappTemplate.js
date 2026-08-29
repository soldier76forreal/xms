import i18n, { LANGUAGES, isRtlLang } from '../../../i18n';
import COUNTRIES from '../../crm/util/countryData';

// Pure text-assembly helpers for the "Share to WhatsApp" feature (now owned by
// Digital Marketing) — no React, no network. See
// xms/src/components/digitalMarketing/shareWhatsAppDialog.js for where these
// get called. Left in inventory/util/ since it's still inventory-domain logic
// (product/variant/unit formatting), imported cross-module from digitalMarketing.

export const UNIT_LABELS = { M2: 'm²', ML: 'ml', PCS: 'pcs', SQFT: 'ft²', LNFT: 'lnft' };

export function formatQty(n) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n ?? 0);
}

export function countryFlag(countryCode) {
  return COUNTRIES.find((c) => c.code === countryCode)?.flag || '';
}

// countryCode e.g. '+98', phoneNumber e.g. '09918537814' (local, leading 0) ->
// '989918537814' — the plain-digits international format wa.me needs.
export function normalizeWaNumber(countryCode, phoneNumber) {
  const cc = String(countryCode || '').replace(/\D/g, '');
  const local = String(phoneNumber || '').replace(/\D/g, '').replace(/^0+/, '');
  return `${cc}${local}`;
}

// A leading emoji/flag has no strong Unicode direction of its own, so on an
// RTL line (Arabic/Farsi) a bidi-aware renderer (WhatsApp, Telegram, a plain
// <textarea>) can't tell it belongs at the START of that line (the visual
// RIGHT edge for RTL) rather than just wherever the neutral-run resolution
// happens to land it — the exact "emoji orientation" complaint. Anchoring it
// with a zero-width directional mark right after the emoji fixes this: RLM
// (U+200F) for Arabic/Farsi, LRM (U+200E) for English (harmless no-op there,
// kept for symmetry/consistency across every line).
const RLM = '‏'; // RIGHT-TO-LEFT MARK
const LRM = '‎'; // LEFT-TO-RIGHT MARK
function emojiLine(emoji, text, langCode) {
  const mark = isRtlLang(langCode) ? RLM : LRM;
  return `${emoji}${mark} ${text}`;
}

// Builds ONE language's block of lines. Internal — see buildShareText below
// for the multi-language entry point every caller actually uses.
function buildLanguageBlock(langCode, {
  product, variant, nameLanguage, singleLanguageSelected,
  includeName, includeDimensions, includeCode, includeContact,
  branches, contacts,
}) {
  const t = i18n.getFixedT(langCode, 'translation');
  const lines = [];

  if (includeName) {
    // An explicit nameLanguage override only makes sense when exactly one
    // template language is selected — with two+ sections in one message,
    // each section shows the name in ITS OWN language automatically (the
    // product model only has `name`/`nameAr`, no `nameFa`, so 'fa' sections
    // fall back to the English name, same as the single-language default).
    const nameLang = (singleLanguageSelected && nameLanguage) || (langCode === 'ar' ? 'ar' : 'en');
    const name = nameLang === 'ar' ? (product?.nameAr || product?.name || '') : (product?.name || '');
    if (name) lines.push(emojiLine('👈', name, langCode));
  }

  branches.forEach((b) => {
    const flag = countryFlag(b.country);
    const label = t('inventory.shareAvailableAtBranch', { branch: b.branchName });
    lines.push(flag ? emojiLine(flag, label, langCode) : label);
  });

  if (includeDimensions && variant?.spec) {
    if (variant.spec.unsized) {
      lines.push(emojiLine('📐', t('inventory.shareSlabThickness', { mm: variant.spec.thicknessMm }), langCode));
    } else {
      const cm = t('inventory.shareCm');
      if (variant.spec.lengthCm != null) lines.push(emojiLine('📐', `${t('inventory.shareLength')}: ${variant.spec.lengthCm} ${cm}`, langCode));
      if (variant.spec.widthCm != null)  lines.push(emojiLine('📏', `${t('inventory.shareWidth')}: ${variant.spec.widthCm} ${cm}`, langCode));
    }
  }

  if (includeCode && variant?.code) {
    lines.push(emojiLine('🏷️', `${t('inventory.shareProductCode')}:`, langCode));
    lines.push(variant.code);
  }

  if (branches.length) {
    lines.push(emojiLine('📦', `${t('inventory.shareAvailableQuantity')}:`, langCode));
    branches.forEach((b) => {
      const qty = `${formatQty(b.quantity)} ${UNIT_LABELS[b.unit] || b.unit}`;
      lines.push(branches.length > 1 ? `${b.branchName}: ${qty}` : qty);
    });
  }

  if (includeContact && contacts.length) {
    contacts.forEach((c) => {
      const branchSuffix = c.branchNames?.length ? ` — ${c.branchNames.join(', ')}` : '';
      lines.push(emojiLine('💬', `${t('inventory.shareContactToOrder')} (${c.name}${branchSuffix}):`, langCode));
      lines.push(`https://wa.me/${c.waNumber}`);
    });
  }

  return lines.join('\n');
}

// Builds the message across one or more `langs` — REGARDLESS of the current
// UI language — using i18next's getFixedT so a rep working in English can
// still generate an Arabic (or English+Arabic) share message. Field order
// within each language follows the client's given template exactly (name ->
// branch availability -> dimensions -> code -> quantity -> contact); branch
// availability and quantity each become one line PER selected branch.
//
// `langs` — array of language codes ('en'/'fa'/'ar'), any subset, any order
// as picked by the caller; sections are ALWAYS emitted in the fixed LANGUAGES
// catalog order (English first, then Farsi, then Arabic — "must place after
// each other" per the client's own phrasing) regardless of selection order,
// and joined with a blank line. A single selected language reproduces the
// exact single-language message as before (no separator, no behavior change).
//
// `nameLanguage` ('en'|'ar') picks which of the product's two name fields to
// use for the 👈 line when exactly ONE language is selected — INDEPENDENT of
// that language (a rep can build an English-labeled message that still shows
// the Arabic product name, or vice versa). With 2+ languages selected this is
// ignored in favor of each section auto-following its own language, since a
// manual override would otherwise apply the same name to every section even
// though they're in different languages.
//
// `contacts` — array of { name, waNumber, branchNames } (multi-select — see
// shareWhatsAppDialog.js). Each becomes its own contact block, labeled with
// the person's name and branch(es) so a customer knows who they're reaching.
//
// Unsized slabs (variant.spec.unsized — e.g. MA01W00000020, per
// utils/stoneCodeParser.js: length/width both 0, only thickness is real)
// show as "Slab" instead of a meaningless "0 x 0 cm" line.
//
// Emoji placement is anchored to each line's own language direction via
// zero-width marks (see emojiLine above) — needed even for a single Arabic
// section, and essential once English and Arabic/Farsi sections sit in one
// message so a bidi renderer doesn't misplace either one's leading icon.
export function buildShareText({
  product, variant, langs, lang, nameLanguage,
  includeName = true, includeDimensions = true, includeCode = true, includeContact = true,
  branches = [], contacts = [],
}) {
  // Back-compat: a caller still passing the old singular `lang` behaves
  // exactly as before (one language, no other change).
  const requested = Array.isArray(langs) && langs.length ? langs : (lang ? [lang] : ['en']);
  const ordered = LANGUAGES.map((l) => l.code).filter((code) => requested.includes(code));
  const codes = ordered.length ? ordered : ['en'];

  const blocks = codes.map((code) => buildLanguageBlock(code, {
    product, variant, nameLanguage, singleLanguageSelected: codes.length === 1,
    includeName, includeDimensions, includeCode, includeContact,
    branches, contacts,
  }));

  return blocks.filter(Boolean).join('\n\n');
}
