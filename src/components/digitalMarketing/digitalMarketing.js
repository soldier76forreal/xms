import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import MovieIcon from '@mui/icons-material/Movie';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation, useHistory } from 'react-router-dom';
import { usePermissions } from '../../contextApi/PermissionContext';
import RawContentSection from './rawContentSection';
import ReadyToUploadSection from './readyToUploadSection';
import LinkPageSection from './linkPageSection';

const TABS = [
  { id: 'rawContent',    Icon: MovieIcon,       labelKey: 'dm.tabRawContents' },
  { id: 'readyToUpload', Icon: CloudUploadIcon, labelKey: 'dm.tabReadyToUpload' },
  { id: 'linkPages',     Icon: LinkIcon,        labelKey: 'dm.tabLinkPages' },
];

// Phase 8 — Digital Marketing. Two sub-sections: Raw Contents (batch upload +
// real-time chat with the creator + status pipeline) and Ready to Upload
// (created only via a raw content's status toggle). Same dark/opacity shell
// as CRM/MIS/Inventory; both list views are timeline-styled per spec.
export default function DigitalMarketing() {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob  = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const history  = useHistory();
  const { can } = usePermissions();

  const [tab, setTab] = useState('rawContent');   // 'rawContent' | 'readyToUpload'
  const [openId, setOpenId] = useState(null);     // record to auto-open (from a notification)

  // Deep link from a notification: /digitalMarketing?dm=raw|ready&open=<id>
  // selects the tab and tells the section which record to open, then clears the
  // params so they don't re-fire.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dm = params.get('dm');
    const id = params.get('open');
    if (!dm && !id) return;
    if (dm === 'ready') setTab('readyToUpload');
    else if (dm === 'raw') setTab('rawContent');
    setOpenId(id || null);
    history.replace('/digitalMarketing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const T = {
    APP_BG:   isDark ? '#060606' : theme.palette.background.default,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  if (!can('digitalMarketing:view')) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
        <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_TER }}>
          {t('dm.noPermissionViewDm')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: T.APP_BG, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 1.25, sm: 2 }, py: 1,
        bgcolor: isDark ? '#0d0d0d' : 'background.paper', borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        {!isMob && (
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
            {t('nav.digitalMarketing')}
          </Typography>
        )}
        {/* overflowX fallback keeps every tab reachable even if a future 4th
            tab (or a long translated label) still doesn't fit — icon-only on
            mobile already keeps this well under any phone's width, but this
            is what actually fixed the bug: buttons were getting clipped by
            an ancestor's overflow:hidden with no scroll escape hatch at all. */}
        <Box sx={{ display: 'flex', gap: 0.5, bgcolor: T.CTRL_BG, borderRadius: '9px',
          p: '3px', border: `1px solid ${T.BD}`, flexShrink: 1, minWidth: 0, ml: isMob ? 0 : 1,
          overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          {TABS.map(({ id, Icon, labelKey }) => (
            <Tooltip key={id} title={isMob ? t(labelKey) : ''}>
              <Button onClick={() => setTab(id)}
                startIcon={isMob ? null : <Icon sx={{ fontSize: 14 }} />}
                sx={{ minWidth: 0, height: 26, flexShrink: 0, px: isMob ? 0 : 1.25, py: 0, borderRadius: '7px',
                  width: isMob ? 34 : 'auto',
                  fontSize: '0.72rem', fontWeight: tab === id ? 700 : 400, textTransform: 'none',
                  color: tab === id ? T.TEXT_PRI : T.TEXT_TER,
                  bgcolor: tab === id ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', color: T.TEXT_PRI } }}>
                {isMob ? <Icon sx={{ fontSize: 16 }} /> : t(labelKey)}
              </Button>
            </Tooltip>
          ))}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {tab === 'rawContent'
          ? <RawContentSection openId={tab === 'rawContent' ? openId : null} onOpenHandled={() => setOpenId(null)} />
          : tab === 'readyToUpload'
          ? <ReadyToUploadSection openId={tab === 'readyToUpload' ? openId : null} onOpenHandled={() => setOpenId(null)} />
          : <LinkPageSection />}
      </Box>
    </Box>
  );
}
