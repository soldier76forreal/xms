import { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import BlockIcon from '@mui/icons-material/Block';
import { useTranslation } from 'react-i18next';
import ThemeCtx from '../../contextApi/themeContext';
import { usePermissions } from '../../contextApi/PermissionContext';
import { NAV_ITEMS } from '../../tools/navs/navConfig';

const BG       = '#060606';
const CARD_BG  = '#111111';
const CARD_BD  = 'rgba(255,255,255,0.08)';
const TEXT_PRI = '#ffffff';
const TEXT_SEC = 'rgba(255,255,255,0.45)';
const BTN_BG   = '#ffffff';
const BTN_CLR  = '#000000';

// Full-page "you can't see this" screen — shown whenever a short link (or a
// direct URL) resolves to a record the current user isn't permitted/scoped
// to see. Deliberately NOT tied to a route itself: components render it
// inline in place of the normal detail body on a 403.
export default function RestrictedAccessScreen({ message }) {
  const { t }       = useTranslation();
  const history     = useHistory();
  const { themeMode } = useContext(ThemeCtx);
  const { can, ready } = usePermissions();

  const goToAccessible = () => {
    if (!ready) { history.replace('/'); return; }
    const firstAccessible = NAV_ITEMS.find((n) => !n.permission || can(n.permission));
    history.replace(firstAccessible ? firstAccessible.path : '/');
  };

  const logo = (
    <Box component="svg" viewBox="0 0 64 64" aria-label="XMS"
      sx={{ width: 56, height: 56, borderRadius: '12px', flexShrink: 0, display: 'block' }}>
      <rect width="64" height="64" rx="10" fill={themeMode === 'light' ? '#000000' : '#ffffff'} />
      <text x="32" y="33" textAnchor="middle" dominantBaseline="central"
        fontFamily="Inter, Arial, sans-serif" fontWeight="900" fontSize="44"
        fill={themeMode === 'light' ? '#ffffff' : '#000000'}>X</text>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: BG, px: 2 }}>
      <Box sx={{
        width: '100%', maxWidth: 380, p: { xs: '28px 22px', sm: '40px 36px' },
        borderRadius: '14px', bgcolor: CARD_BG, border: `1px solid ${CARD_BD}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      }}>
        {logo}
        <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'rgba(234,0,90,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
          <BlockIcon sx={{ fontSize: 22, color: '#EA005A' }} />
        </Box>
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: TEXT_PRI, textAlign: 'center' }}>
          {t('restricted.title')}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: TEXT_SEC, textAlign: 'center', lineHeight: 1.7 }}>
          {message || t('restricted.message')}
        </Typography>
        <Button fullWidth variant="contained" onClick={goToAccessible}
          sx={{ mt: 1, bgcolor: BTN_BG, color: BTN_CLR, fontWeight: 700, borderRadius: '10px', py: '9px',
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.88)' } }}>
          {t('restricted.goToAccessible')}
        </Button>
      </Box>
    </Box>
  );
}
