import { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';

import { usePermissions } from '../../contextApi/PermissionContext';
import AboutTab from './aboutTab';
import TicketsTab from './ticketsTab';

// Report & Info — what the app is (version, sections, what changed) and a way to
// tell us when it is wrong or could be better (bug reports and suggestions,
// each with a status the person can follow).
//
// Gated by three keys, all default-deny:
//   info:view               the section itself — checked here AND on the nav entry
//   feedback:view           the Reports tab (tickets, narrowed by the `feedback` data scope)
//   feedback:ticket:create  the "New report" button
// The server enforces each one; hiding a control here is only UX.
const TABS = [
  { id: 'about',   labelKey: 'info.tabAbout',   Icon: InfoOutlinedIcon },
  { id: 'reports', labelKey: 'info.tabReports', Icon: ForumOutlinedIcon },
];

export default function Info() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const location = useLocation();
  const history = useHistory();
  const { can } = usePermissions();

  const canView = can('feedback:view');
  const canCreate = can('feedback:ticket:create');
  const showReports = canView || canCreate;
  const tabs = TABS.filter((tab) => tab.id === 'about' || showReports);

  const [tab, setTab] = useState('about');
  const [openId, setOpenId] = useState(null);

  // /info?tab=reports&open=<ticketId> — a link or notification can land straight on a ticket.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wanted = params.get('tab');
    const id = params.get('open');
    if (!wanted && !id) return;
    if (wanted === 'reports' || id) setTab('reports');
    setOpenId(id || null);
    history.replace('/info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const T = {
    APP_BG:   isDark ? '#060606' : theme.palette.background.default,
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    CARD_BG:  isDark ? '#111111' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.5)'  : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.38)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  if (!can('info:view')) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
        <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_TER }}>{t('info.noPermission')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', bgcolor: T.APP_BG, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 1.25, sm: 2 }, py: 1,
        bgcolor: T.PANEL_BG, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
          {t('nav.info')}
        </Typography>
        <Box role="tablist" sx={{ display: 'flex', gap: 0.5, bgcolor: T.CTRL_BG, borderRadius: '9px', p: '3px',
          border: `1px solid ${T.BD}`, ml: { sm: 1 }, minWidth: 0 }}>
          {tabs.map(({ id, Icon, labelKey }) => (
            <Button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              startIcon={<Icon sx={{ fontSize: 14 }} />}
              sx={{ minWidth: 0, height: 26, px: 1.25, py: 0, borderRadius: '7px', fontSize: '0.72rem', textTransform: 'none',
                fontWeight: tab === id ? 700 : 400, color: tab === id ? T.TEXT_PRI : T.TEXT_TER,
                bgcolor: tab === id ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', color: T.TEXT_PRI } }}>
              {t(labelKey)}
            </Button>
          ))}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
        {tab === 'reports' && showReports
          ? <TicketsTab T={T} canView={canView} canCreate={canCreate} openId={openId} onOpenHandled={() => setOpenId(null)} />
          : <AboutTab T={T} />}
      </Box>
    </Box>
  );
}
