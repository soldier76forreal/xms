import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import UserAvatar from '../main/userAvatar';

const relTime = (d, t) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000);
  if (m < 1) return t('users.justNow');
  if (m < 60) return t('users.minutesAgo', { count: m });
  if (h < 24) return t('users.hoursAgo', { count: h });
  if (dy < 7) return t('users.daysAgo', { count: dy });
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// Who viewed this customer record (and when). Self-views by the owner are
// never logged server-side, so this only ever shows OTHER people's activity
// — mirrors digitalMarketing's DmActivityLog pattern (see dmActivityLog.js).
export default function CustomerViewedLog({ customerId, T }) {
  const { t } = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    authCtx.jwtInst({
      method: 'get',
      url: `${axiosGlobal.defaultTargetApi}/crm/customers/${customerId}/viewed`,
    }).then((res) => setRows(res.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  return (
    <Box>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
        color: T.TEXT_TER, mb: 1 }}>
        {t('crm.sectionViewed')}
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={16} sx={{ color: T.TEXT_TER }} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_TER }}>
          {t('crm.noViewsYet')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {rows.map((r) => (
            <Box key={r._id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <VisibilityIcon sx={{ fontSize: 13, color: T.TEXT_TER, flexShrink: 0 }} />
              <UserAvatar userId={r.actorId} size={16} fontSize="0.55rem" sx={{ flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_SEC, flexGrow: 1, minWidth: 0 }} noWrap>
                <Box component="span" sx={{ fontWeight: 600, color: T.TEXT_PRI }}>{r.actorName || t('dm.someone')}</Box>
                {' '}{t('crm.viewedThis')}
              </Typography>
              <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, flexShrink: 0 }}>
                {relTime(r.date, t)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
