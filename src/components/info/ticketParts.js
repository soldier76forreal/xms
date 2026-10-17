import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { statusMeta, typeMeta } from './ticketMeta';

// A status is a coloured dot AND its name — never colour alone.
export function StatusChip({ status, T, t, size = 'md' }) {
  const meta = statusMeta(status);
  const small = size === 'sm';
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.6, flexShrink: 0,
      px: small ? 0.8 : 1, py: small ? '1px' : '2px', borderRadius: '999px',
      bgcolor: `${meta.color}1F`, border: `1px solid ${meta.color}55`,
    }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: meta.color }} />
      <Typography sx={{ fontSize: small ? '0.64rem' : '0.7rem', fontWeight: 700, color: T.TEXT_PRI, whiteSpace: 'nowrap' }}>
        {t(meta.labelKey)}
      </Typography>
    </Box>
  );
}

export function TypeBadge({ type, T, t, withLabel = true }) {
  const { Icon, color, labelKey } = typeMeta(type);
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
      <Icon sx={{ fontSize: 15, color }} />
      {withLabel && (
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: T.TEXT_SEC, whiteSpace: 'nowrap' }}>{t(labelKey)}</Typography>
      )}
    </Box>
  );
}

// Gregorian in every language — a ticket's date should be the same date
// whichever language the page is in (Farsi would otherwise show the Jalali one).
export const formatStamp = (value, language, withTime = true) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(`${language}-u-ca-gregory`, withTime
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' }).format(new Date(value));
  } catch (_) {
    return String(value);
  }
};
