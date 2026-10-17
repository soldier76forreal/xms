import { useState, useEffect, useContext } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';

import { usePermissions } from '../../contextApi/PermissionContext';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { fetchDeveloperStatus } from './feedbackApi';
import AboutTab from './aboutTab';
import TicketsTab from './ticketsTab';
import DashboardTab from './dashboardTab';

// Report & Info — what the app is (version, sections, what changed) and a way to
// tell us when it is wrong or could be better (bug reports and suggestions,
// each with a status the person can follow).
//
// Gated by five keys, all default-deny:
//   info:view               the section itself — checked here AND on the nav entry
//   feedback:view           the Reports tab (tickets, narrowed by the `feedback` data scope)
//   feedback:ticket:create  the "New report" button
//   feedback:ticket:edit    Edit on your own report, while it is still Open
//   feedback:ticket:delete  Delete on your own report
// …and one thing that is NOT a key: the Dashboard tab is for the developers, an
// allowlist of phone numbers the server keeps (api/utils/developers.js). The
// browser only asks "am I one?" to decide whether to show the tab.
// The server enforces each one; hiding a control here is only UX.
const TABS = [
  { id: 'about',   labelKey: 'info.tabAbout',   Icon: InfoOutlinedIcon },
  { id: 'reports', labelKey: 'info.tabReports', Icon: ForumOutlinedIcon },
  { id: 'dashboard', labelKey: 'info.tabDashboard', Icon: DashboardOutlinedIcon },
];

export default function Info() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const location = useLocation();
  const history = useHistory();
  const { can } = usePermissions();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const canView = can('feedback:view');
  const canCreate = can('feedback:ticket:create');
  const canEdit = can('feedback:ticket:edit');
  const canDelete = can('feedback:ticket:delete');
  const showReports = canView || canCreate;

  const [tab, setTab] = useState('about');
  const [openId, setOpenId] = useState(null);
  // Asked once: 'checking' until the server answers, then 'yes' or 'no'.
  const [developer, setDeveloper] = useState('checking');
  const isDeveloper = developer === 'yes';

  // Keyed on the door permission, not run once: the permission set can still be
  // loading when this mounts, and asking too early would never be retried.
  const hasDoor = can('info:view');
  useEffect(() => {
    if (!hasDoor) return undefined;
    let cancelled = false;
    fetchDeveloperStatus(authCtx, axiosGlobal)
      .then((yes) => { if (!cancelled) setDeveloper(yes ? 'yes' : 'no'); })
      .catch(() => { if (!cancelled) setDeveloper('no'); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDoor]);

  // A Dashboard link followed by someone who is not a developer lands on About.
  useEffect(() => { if (developer === 'no' && tab === 'dashboard') setTab('about'); }, [developer, tab]);

  const tabs = TABS.filter((tab_) => tab_.id === 'about'
    || (tab_.id === 'reports' && showReports)
    || (tab_.id === 'dashboard' && isDeveloper));

  // /info?tab=reports&open=<ticketId> — a link or notification can land straight on a ticket.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wanted = params.get('tab');
    const id = params.get('open');
    if (!wanted && !id) return;
    if (wanted === 'dashboard') setTab('dashboard');
    else if (wanted === 'reports' || id) setTab('reports');
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
        {tab === 'dashboard' && developer === 'checking' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={22} sx={{ color: T.TEXT_TER }} /></Box>
        )}
        {tab === 'dashboard' && isDeveloper && (
          <DashboardTab T={T} canEdit={canEdit} canDelete={canDelete} openId={openId} onOpenHandled={() => setOpenId(null)} />
        )}
        {tab === 'reports' && showReports && (
          <TicketsTab T={T} canView={canView} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete}
            openId={openId} onOpenHandled={() => setOpenId(null)} />
        )}
        {/* Anything else — including a Dashboard link followed by someone who is not a developer. */}
        {!(tab === 'dashboard' && developer !== 'no') && !(tab === 'reports' && showReports) && <AboutTab T={T} />}
      </Box>
    </Box>
  );
}
