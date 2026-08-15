import { useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HistoryIcon from '@mui/icons-material/History';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import AuthContext from '../authAndConnections/auth';
import UserLogs from './userLogs';
import JobReportSection from './jobReportSection';

// ── My Activity — a self-service version of the Users-section "user logs"
// view (Activity Log + Job Reports), reachable by ANY logged-in user via the
// profile popup, even without users:view (see main.js's isMyActivity branch
// + the self-bypass on GET /users/:id/logs and /:id/jobReports). Someone who
// can't see the People section still needs to see their own history.
const MyActivityPage = () => {
  const authCtx = useContext(AuthContext);
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const { t }   = useTranslation();

  const selfId = authCtx.decode?.id;

  const TEXT_PRI = isDark ? '#ffffff' : theme.palette.text.primary;
  const TEXT_SEC = isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary;

  if (!selfId) return null;

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
        <HistoryIcon sx={{ fontSize: 22, color: TEXT_SEC }} />
        <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', md: '1.2rem' }, color: TEXT_PRI }}>
          {t('users.myActivityTitle')}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.8rem', color: TEXT_SEC, mb: 3 }}>
        {t('users.myActivitySubtitle')}
      </Typography>

      <Box sx={{ p: 2.5, bgcolor: isDark ? '#111111' : theme.palette.background.paper,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider}`,
        borderRadius: '14px', mb: 2.5 }}>
        <UserLogs userId={selfId} />
      </Box>

      <JobReportSection userId={selfId} isSelf />
    </Box>
  );
};

export default MyActivityPage;
