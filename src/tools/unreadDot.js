import Box from '@mui/material/Box';

// Shared "unread record" visual language — one accent color used consistently
// across every list in the app (CRM, MIS, Inventory, Tutorials, Digital
// Marketing, File Manager, Job Reports), so a user learns it once. Matches
// the existing informational-accent blue already used elsewhere (CRM's
// follow-up chip, job report follow-ups) rather than introducing a new color.
export const UNREAD_ACCENT = '#64b5f6';
export const unreadRowTint = (isDark) => (isDark ? 'rgba(100,181,246,0.08)' : 'rgba(33,150,243,0.06)');

// A small dot, absolute-positioned at the top-right corner by default.
// Pass `sx` to reposition for a layout that isn't a simple relative card
// (e.g. a grid tile that already anchors a pin/checkbox in a corner).
export default function UnreadDot({ sx } = {}) {
  return (
    <Box sx={{
      position: 'absolute', top: 6, right: 6, width: 8, height: 8,
      borderRadius: '50%', bgcolor: UNREAD_ACCENT,
      boxShadow: `0 0 0 2px ${UNREAD_ACCENT}33`,
      ...sx,
    }} />
  );
}
