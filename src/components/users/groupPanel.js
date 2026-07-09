import { useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import GroupsIcon from '@mui/icons-material/Groups';
import StarIcon from '@mui/icons-material/Star';
import { useTheme } from '@mui/material';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

const useT = () => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    CARD_BG:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    CARD_BD:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    AVATAR_BG: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    CHIP_BG:   isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    CHIP_CLR:  isDark ? 'rgba(255,255,255,0.6)'  : 'rgba(0,0,0,0.6)',
    isDark,
  };
};

const getInitials = (u) =>
  ((u.firstName || '').charAt(0) + (u.lastName || '').charAt(0)).toUpperCase() || '?';

const MemberRow = ({ member, isAdmin, T, apiBase }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5,
    px: 1.5, py: 1, bgcolor: T.CARD_BG, borderRadius: '8px',
    border: `1px solid ${T.CARD_BD}` }}>
    {/* Avatar */}
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: T.AVATAR_BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.72rem', fontWeight: 700, color: T.TEXT_PRI, overflow: 'hidden' }}>
        {member.profileImage?.url
          ? <img src={`${apiBase}${member.profileImage.url}`} alt={getInitials(member)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : getInitials(member)
        }
      </Box>
      {/* Presence dot */}
      <Box sx={{ position: 'absolute', bottom: 0, right: 0,
        width: 8, height: 8, borderRadius: '50%',
        bgcolor: member.isOnline ? '#4CAF50' : (T.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
        border: `1.5px solid ${T.CARD_BG}` }} />
    </Box>

    {/* Name + phone */}
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.TEXT_PRI, lineHeight: 1.3 }}>
        {member.firstName} {member.lastName}
      </Typography>
      <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, fontFamily: 'monospace' }} noWrap>
        {member.phoneNumber}
      </Typography>
    </Box>

    {/* Admin star */}
    {isAdmin && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexShrink: 0 }}>
        <StarIcon sx={{ fontSize: 13, color: '#FFB74D' }} />
        <Typography sx={{ fontSize: '0.65rem', color: '#FFB74D', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Admin
        </Typography>
      </Box>
    )}
  </Box>
);

const GroupPanel = ({ group }) => {
  const T           = useT();
  const axiosGlobal = useContext(AxiosGlobal);
  const apiBase     = axiosGlobal?.defaultTargetApi || '';
  if (!group) return null;

  const members     = group._membersPopulated || [];
  const adminIds    = (group.admins || []).map(String);
  const adminCount  = members.filter(m => adminIds.includes(String(m._id))).length;
  const permissions = group.permissions || [];

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px',
          bgcolor: T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GroupsIcon sx={{ fontSize: 22, color: T.TEXT_SEC }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: T.TEXT_PRI }}>
            {group.name}
          </Typography>
          {group.description && (
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC, mt: 0.5, lineHeight: 1.5 }}>
              {group.description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: T.TEXT_PRI, lineHeight: 1 }}>
            {members.length}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.8, mt: 0.25 }}>
            Members
          </Typography>
        </Box>
        {adminCount > 0 && (
          <>
            <Box sx={{ width: '1px', bgcolor: T.DIVIDER }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFB74D', lineHeight: 1 }}>
                {adminCount}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.8, mt: 0.25 }}>
                Admin{adminCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </>
        )}
        {permissions.length > 0 && (
          <>
            <Box sx={{ width: '1px', bgcolor: T.DIVIDER }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: T.TEXT_PRI, lineHeight: 1 }}>
                {permissions.length}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.8, mt: 0.25 }}>
                Perms
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Group permissions */}
      {permissions.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
            Extra Permissions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {permissions.map(key => (
              <Chip key={key} label={key} size="small" sx={{
                height: 20, fontSize: '0.68rem', borderRadius: '4px',
                bgcolor: T.CHIP_BG, color: T.CHIP_CLR,
                '& .MuiChip-label': { px: 0.75 },
              }} />
            ))}
          </Box>
        </Box>
      )}

      {/* Members list */}
      <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
        Members
      </Typography>
      {members.length === 0 ? (
        <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_TER, textAlign: 'center', py: 3 }}>
          No members yet
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {/* Admins first */}
          {members
            .sort((a, b) => {
              const aA = adminIds.includes(String(a._id));
              const bA = adminIds.includes(String(b._id));
              return aA === bA ? 0 : aA ? -1 : 1;
            })
            .map(m => (
              <MemberRow
                key={String(m._id)}
                member={m}
                isAdmin={adminIds.includes(String(m._id))}
                T={T}
                apiBase={apiBase}
              />
            ))
          }
        </Box>
      )}
    </Box>
  );
};

export default GroupPanel;
