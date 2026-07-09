import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ShieldIcon from '@mui/icons-material/Shield';
import { useTheme } from '@mui/material';

const useT = () => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:  isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    MOD_BG:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    MOD_BD:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    CHIP_BG:  isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    CHIP_CLR: isDark ? 'rgba(255,255,255,0.6)'  : 'rgba(0,0,0,0.6)',
    SYS_BG:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    isDark,
  };
};

// Group a flat permissions array by the first key segment (module)
const groupByModule = (permissions = []) => {
  const byModule = {};
  permissions.forEach(key => {
    const mod = key.split(':')[0] || 'other';
    if (!byModule[mod]) byModule[mod] = [];
    byModule[mod].push(key);
  });
  return byModule;
};

const RolePanel = ({ role }) => {
  const T = useT();
  if (!role) return null;

  const byModule = groupByModule(role.permissions);
  const moduleCount = Object.keys(byModule).length;

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px',
          bgcolor: T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldIcon sx={{ fontSize: 22, color: T.TEXT_SEC }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: T.TEXT_PRI }}>
              {role.name}
            </Typography>
            {role.isSystem && (
              <Chip label="system" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700,
                bgcolor: T.SYS_BG, color: T.TEXT_TER, borderRadius: '4px',
                '& .MuiChip-label': { px: 0.75 } }} />
            )}
          </Box>
          {role.description && (
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC, mt: 0.5, lineHeight: 1.5 }}>
              {role.description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: T.TEXT_PRI, lineHeight: 1 }}>
            {(role.permissions || []).length}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.8, mt: 0.25 }}>
            Permissions
          </Typography>
        </Box>
        <Box sx={{ width: '1px', bgcolor: T.DIVIDER }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color: T.TEXT_PRI, lineHeight: 1 }}>
            {moduleCount}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.8, mt: 0.25 }}>
            Modules
          </Typography>
        </Box>
      </Box>

      {/* Data visibility scopes */}
      {Object.keys(role.dataScopes || {}).length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
            Data Visibility
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {Object.entries(role.dataScopes).map(([mod, scope]) => {
              const scopeColor = scope === 'mine' ? '#FF4D8D' : scope === 'group' ? '#FFB74D' : '#81C784';
              return (
                <Box key={mod} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 1.5, py: 0.75, bgcolor: T.MOD_BG, border: `1px solid ${T.MOD_BD}`, borderRadius: '8px' }}>
                  <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, textTransform: 'capitalize' }}>
                    {mod}
                  </Typography>
                  <Chip label={scope} size="small" sx={{
                    height: 18, fontSize: '0.63rem', fontWeight: 700, borderRadius: '4px',
                    bgcolor: `${scopeColor}18`, color: scopeColor, border: `1px solid ${scopeColor}30`,
                    '& .MuiChip-label': { px: 0.75 },
                  }} />
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Permissions by module */}
      {(role.permissions || []).length === 0 ? (
        <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_TER, textAlign: 'center', py: 4 }}>
          No permissions assigned
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Object.entries(byModule).map(([mod, keys]) => (
            <Box key={mod} sx={{ p: 1.5, bgcolor: T.MOD_BG, border: `1px solid ${T.MOD_BD}`, borderRadius: '10px' }}>
              <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase',
                letterSpacing: 1, fontWeight: 600, mb: 1 }}>
                {mod}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {keys.map(key => {
                  const action = key.substring(key.indexOf(':') + 1);
                  return (
                    <Chip key={key} label={action} size="small" sx={{
                      height: 20, fontSize: '0.68rem', borderRadius: '4px',
                      bgcolor: T.CHIP_BG, color: T.CHIP_CLR,
                      '& .MuiChip-label': { px: 0.75 },
                    }} />
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default RolePanel;
