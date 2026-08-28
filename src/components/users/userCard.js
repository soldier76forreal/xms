import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import LockIcon from '@mui/icons-material/Lock';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { COUNTRIES } from './countryData';
import { LANGUAGES } from '../../i18n';

const getInitials = (user) => {
  const f = (user.firstName || '').charAt(0).toUpperCase();
  const l = (user.lastName  || '').charAt(0).toUpperCase();
  return f + l || '?';
};

const formatLastSeen = (dateStr, t) => {
  if (!dateStr) return null;
  const diff    = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  if (minutes < 1)  return t('users.justNow');
  if (minutes < 60) return t('users.minutesAgo', { count: minutes });
  if (hours   < 24) return t('users.hoursAgo', { count: hours });
  if (days    < 30) return t('users.daysAgo', { count: days });
  return new Date(dateStr).toLocaleDateString('en-GB');
};

const isLocked = (user) =>
  user.auth?.lockedUntil && new Date(user.auth.lockedUntil) > new Date();

const UserCard = ({ user, onClick, selected = false, apiBase = '' }) => {
  const theme      = useTheme();
  const { t }      = useTranslation();
  const isDark     = theme.palette.mode === 'dark';

  const CARD_BG  = isDark ? '#111111' : theme.palette.background.paper;
  const CARD_BD  = isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider;
  const SEL_BG   = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.06)';
  const SEL_BD   = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  const TEXT_PRI = isDark ? '#ffffff'                 : theme.palette.text.primary;
  const TEXT_SEC = isDark ? 'rgba(255,255,255,0.45)'  : theme.palette.text.secondary;
  const TEXT_TER = isDark ? 'rgba(255,255,255,0.2)'   : 'rgba(0,0,0,0.3)';
  const HVR_BD   = isDark ? 'rgba(255,255,255,0.15)'  : 'rgba(0,0,0,0.18)';

  const initials   = getInitials(user);
  const lastSeenTx = formatLastSeen(user.lastSeen, t);
  const locked     = isLocked(user);

  // Country flag from stored dial code
  const countryInfo = user.countryCode
    ? COUNTRIES.find(c => c.dial === user.countryCode)
    : null;

  // Selected UI language — persisted server-side (see languageContext.js /
  // PUT /users/me/language), not just this browser's localStorage.
  const langInfo = LANGUAGES.find(l => l.code === (user.language || 'en')) || LANGUAGES[0];

  const chipSx = {
    height: 20, fontSize: '0.65rem', fontWeight: 600,
    bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    color:   isDark ? 'rgba(255,255,255,0.5)'  : 'rgba(0,0,0,0.5)',
    border:  `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: '4px',
    '& .MuiChip-label': { px: 1 },
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', flexDirection: 'column', gap: 1,
        px: 2, py: 1.5,
        bgcolor: selected ? SEL_BG : CARD_BG,
        border: `1px solid ${selected ? SEL_BD : CARD_BD}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background-color 0.15s',
        '&:hover': { borderColor: selected ? SEL_BD : HVR_BD, bgcolor: selected ? SEL_BG : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)') },
      }}
    >
      {/* Top row: avatar + name/phone/last-seen — always one line each, never squeezed by chips */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: '50%',
            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: TEXT_PRI,
            overflow: 'hidden',
          }}>
            {user.profileImage?.url
              ? <img src={`${apiBase}${user.profileImage.url}`} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </Box>
          <Box sx={{
            position: 'absolute', bottom: 1, right: 1,
            width: 9, height: 9, borderRadius: '50%',
            bgcolor: user.isOnline ? '#4CAF50' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
            border: `1.5px solid ${CARD_BG}`,
          }} />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 600, color: TEXT_PRI, lineHeight: 1.3, minWidth: 0 }}>
              {user.firstName} {user.lastName}
            </Typography>
            {locked && <LockIcon sx={{ fontSize: 12, color: '#FF4D8D', flexShrink: 0 }} />}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {countryInfo && (
              <span style={{ fontSize: '0.8rem' }} title={countryInfo.name}>{countryInfo.flag}</span>
            )}
            <Typography sx={{ fontSize: '0.75rem', color: TEXT_SEC, fontFamily: 'monospace', lineHeight: 1.4 }} noWrap>
              {user.phoneNumber}
            </Typography>
          </Box>
          {!user.isOnline && lastSeenTx && (
            <Typography sx={{ fontSize: '0.7rem', color: TEXT_TER, lineHeight: 1.4 }}>
              {lastSeenTx}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Bottom row: language + role chips — full width, wraps freely, never
          competes with the name/phone for horizontal space (that was the
          jammed-layout bug: cramming chips into the name's row squeezed it
          down to a sliver, so long names wrapped one word per line). */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pl: '50px' }}>
        <Tooltip title={langInfo.label}>
          <Chip label={langInfo.nativeLabel} size="small" sx={chipSx} />
        </Tooltip>
        {(user.roleNames || []).map(name => (
          <Chip key={name} label={name} size="small" sx={chipSx} />
        ))}
      </Box>
    </Box>
  );
};

export default UserCard;
