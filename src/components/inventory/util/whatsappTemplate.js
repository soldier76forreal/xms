import i18n from '../../../i18n';
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

// Builds the message in `lang` REGARDLESS of the current UI language — uses
// i18next's getFixedT so a rep working in English can still generate an
// Arabic share message. Field order follows the client's given template
// exactly (name -> branch availability -> dimensions -> code -> quantity ->
// contact); branch availability and quantity each become one line PER
// selected branch, so a single selected branch reproduces the template
// verbatim and multiple branches extend it naturally (quantity lines get a
// "branch: " prefix only when more than one branch is selected, so the
// single-branch case still matches the template's plain "1,200 m²" line).
//
// `nameLanguage` ('en'|'ar') picks which of the product's two name fields to
// use for the 👈 line — INDEPENDENT of `lang` (the template's label
// language). A rep can build an English-labeled message that still shows the
// Arabic product name, or vice versa. Defaults to following `lang` (ar->ar,
// anything else->en) only when not explicitly given, for backward
// compatibility with any caller that doesn't pass it.
export function buildShareText({
  product, variant, lang, nameLanguage,
  includeName = true, includeDimensions = true, includeCode = true, includeContact = true,
  branches = [], contactWaNumber = null,
}) {
  const t = i18n.getFixedT(lang, 'translation');
  const lines = [];

  if (includeName) {
    const nameLang = nameLanguage || (lang === 'ar' ? 'ar' : 'en');
    const name = nameLang === 'ar' ? (product?.nameAr || product?.name || '') : (product?.name || '');
    if (name) lines.push(`👈 ${name}`);
  }

  branches.forEach((b) => {
    const flag = countryFlag(b.country);
    const label = t('inventory.shareAvailableAtBranch', { branch: b.branchName });
    lines.push(flag ? `${flag} ${label}` : label);
  });

  if (includeDimensions && variant?.spec) {
    const cm = t('inventory.shareCm');
    if (variant.spec.lengthCm != null) lines.push(`📐 ${t('inventory.shareLength')}: ${variant.spec.lengthCm} ${cm}`);
    if (variant.spec.widthCm != null)  lines.push(`📏 ${t('inventory.shareWidth')}: ${variant.spec.widthCm} ${cm}`);
  }

  if (includeCode && variant?.code) {
    lines.push(`🏷️ ${t('inventory.shareProductCode')}:`);
    lines.push(variant.code);
  }

  if (branches.length) {
    lines.push(`📦 ${t('inventory.shareAvailableQuantity')}:`);
    branches.forEach((b) => {
      const qty = `${formatQty(b.quantity)} ${UNIT_LABELS[b.unit] || b.unit}`;
      lines.push(branches.length > 1 ? `${b.branchName}: ${qty}` : qty);
    });
  }

  if (includeContact && contactWaNumber) {
    lines.push(`💬 ${t('inventory.shareContactToOrder')}:`);
    lines.push(`https://wa.me/${contactWaNumber}`);
  }

  return lines.join('\n');
}
