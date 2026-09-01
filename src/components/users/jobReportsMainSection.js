import { useState, useEffect, useContext } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import JobReportSection from './jobReportSection';
import JobReportsAdminList from './jobReportsAdminList';
import { JobReportDetail } from './jobReportSection';

// Top-level Job Reports section (nav item just before Tutorials). Two modes:
//   MY REPORTS — every authenticated user, unconditional (no permission key —
//                same precedent as personal notes/activity). Just the existing
//                profile-embedded JobReportSection, reused as-is with userId=self.
//   ALL REPORTS — jobReports:viewAll only. Filter by user + date, reply.
// No mode toggle at all for a user without jobReports:viewAll — there is
// nothing to toggle to, so showing a disabled/hidden second tab would just be
// noise (mirrors how Digital Marketing's WhatsApp Share tab only appears for
// holders of inventory:share:whatsapp).
export default function JobReportsMainSection() {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob  = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const history  = useHistory();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const canViewAll = can('jobReports:viewAll');
  const [mode, setMode] = useState('mine');   // 'mine' | 'all'

  // Deep link from a notification: /jobReports?open=<id>. Mode-agnostic
  // single fetch (GET /users/jobReports/:reportId) since the click target
  // doesn't know whether the viewer should land in "mine" or "all" — a group
  // admin opening a create/update notification needs "all" mode's permission
  // to see it at all; a user opening a reply to their own report is always
  // allowed regardless of mode. Opened in its own overlay dialog rather than
  // trying to select a mode and scroll to a row in a possibly-unloaded list.
  const [deepLinkReport, setDeepLinkReport] = useState(null);
  const [deepLinkLoading, setDeepLinkLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('open');
    if (!id) return;
    setDeepLinkLoading(true);
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/users/jobReports/${id}` })
      .then((res) => setDeepLinkReport(res.data))
      .catch(() => {})
      .finally(() => setDeepLinkLoading(false));
    history.replace('/jobReports');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const T = {
    APP_BG:   isDark ? '#060606' : theme.palette.background.default,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
  };

  const deepLinkIsOwn = deepLinkReport && String(deepLinkReport.userId) === String(authCtx.userId);

  const closeDeepLink = () => setDeepLinkReport(null);

  const replyToDeepLink = canViewAll ? async (body) => {
    const res = await authCtx.jwtInst({
      method: 'post',
      url: `${axiosGlobal.defaultTargetApi}/users/jobReports/${deepLinkReport._id}/reply`,
      data: { body },
    });
    setDeepLinkReport({ ...res.data, authorName: deepLinkReport.authorName });
  } : undefined;

  const followUpDeepLink = deepLinkIsOwn ? async (body) => {
    const res = await authCtx.jwtInst({
      method: 'post',
      url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/${deepLinkReport._id}/followUp`,
      data: { body },
    });
    setDeepLinkReport(res.data);
  } : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: T.APP_BG, overflow: 'hidden' }}>
      {/* Deep-link fetch feedback — a notification click otherwise sits on a
          blank section with no sign anything is happening until the single-
          report fetch resolves. */}
      <Backdrop open={deepLinkLoading} sx={{ zIndex: (t) => t.zIndex.modal + 1, color: '#fff' }}>
        <CircularProgress size={28} sx={{ color: 'inherit' }} />
      </Backdrop>

      <JobReportDetail open={!!deepLinkReport} onClose={closeDeepLink} report={deepLinkReport}
        T={{
          CARD_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
          TEXT_PRI: T.TEXT_PRI, TEXT_SEC: T.TEXT_SEC, TEXT_TER: T.TEXT_TER,
          DIVIDER: T.BD, CARD_BD: T.BD,
        }}
        isXs={isMob} isDark={isDark} axiosGlobal={axiosGlobal}
        authorName={deepLinkIsOwn ? undefined : deepLinkReport?.authorName}
        onOpenAttachment={(f) => window.open(`${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`, '_blank')}
        onReply={deepLinkReport && !deepLinkIsOwn ? replyToDeepLink : undefined}
        onAddFollowUp={followUpDeepLink} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 1.25, sm: 2 }, py: 1,
        bgcolor: isDark ? '#0d0d0d' : 'background.paper', borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        {!isMob && (
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <AssignmentIcon sx={{ fontSize: 17 }} />
            {t('nav.jobReports')}
          </Typography>
        )}
        {canViewAll && (
          <Box sx={{ display: 'flex', gap: 0.5, bgcolor: T.CTRL_BG, borderRadius: '9px',
            p: '3px', border: `1px solid ${T.BD}`, ml: isMob ? 0 : 1 }}>
            {[
              { id: 'mine', Icon: PersonIcon, labelKey: 'users.jobReportsModeMine' },
              { id: 'all',  Icon: GroupsIcon, labelKey: 'users.jobReportsModeAll' },
            ].map(({ id, Icon, labelKey }) => (
              <Tooltip key={id} title={isMob ? t(labelKey) : ''}>
                <Button onClick={() => setMode(id)}
                  startIcon={isMob ? null : <Icon sx={{ fontSize: 14 }} />}
                  sx={{ minWidth: 0, height: 26, px: isMob ? 0 : 1.25, py: 0, borderRadius: '7px',
                    width: isMob ? 34 : 'auto',
                    fontSize: '0.72rem', fontWeight: mode === id ? 700 : 400, textTransform: 'none',
                    color: mode === id ? T.TEXT_PRI : T.TEXT_TER,
                    bgcolor: mode === id ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', color: T.TEXT_PRI } }}>
                  {isMob ? <Icon sx={{ fontSize: 16 }} /> : t(labelKey)}
                </Button>
              </Tooltip>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: { xs: 1.25, sm: 2 } }}>
        {mode === 'all' && canViewAll
          ? <JobReportsAdminList />
          : <JobReportSection userId={authCtx.userId} isSelf />}
      </Box>
    </Box>
  );
}
