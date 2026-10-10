import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import MovieIcon from '@mui/icons-material/Movie';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ArticleIcon from '@mui/icons-material/Article';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import InsightsIcon from '@mui/icons-material/Insights';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation, useHistory } from 'react-router-dom';
import { usePermissions } from '../../contextApi/PermissionContext';
import RawContentSection from './rawContentSection';
import ReadyToUploadSection from './readyToUploadSection';
import LinkPageSection from './linkPageSection';
import WhatsappShareSection from './whatsappShareSection';
import BlogSection from './blogSection';
import ProductContentSection from './productContentSection';
import WebsiteAnalyticsSection from './websiteAnalyticsSection';
import { WEBSITE_FEATURES_ENABLED } from '../../tools/featureFlags';

// Three of these tabs exist only to feed the public website — Product Content
// authors its product pages, Analytics reports on its traffic, Blog writes its
// /blog route — so all three are hidden while that site isn't live (see
// featureFlags.js, and api/featureFlags.js for the endpoints behind them).
// Link Pages/WhatsApp Share are unrelated standalone features, not part of
// the website project, and stay on regardless.
const TABS = [
  { id: 'rawContent',    Icon: MovieIcon,       labelKey: 'dm.tabRawContents' },
  { id: 'readyToUpload', Icon: CloudUploadIcon, labelKey: 'dm.tabReadyToUpload' },
  { id: 'linkPages',     Icon: LinkIcon,        labelKey: 'dm.tabLinkPages' },
  { id: 'whatsappShares', Icon: WhatsAppIcon,   labelKey: 'dm.tabWhatsappShares' },
  ...(WEBSITE_FEATURES_ENABLED ? [
    { id: 'productContent', Icon: Inventory2OutlinedIcon, labelKey: 'dm.tabProductContent' },
    { id: 'analytics',      Icon: InsightsIcon,    labelKey: 'dm.tabAnalytics' },
    { id: 'blog',           Icon: ArticleIcon,     labelKey: 'dm.tabBlog' },
  ] : []),
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
        {/* On a phone the six sections became six anonymous icons in a strip that
            had to scroll: you could not tell where you were without tapping. A
            menu says the section's name, shows the rest with their icons, and
            takes one tap either way. The pill group stays on wider screens, with
            an overflowX escape hatch so a long translated label can never clip. */}
        {isMob ? (
          <Select value={tab} onChange={(e) => setTab(e.target.value)} size="small" fullWidth
            inputProps={{ 'aria-label': t('dm.sectionPickerLabel') }}
            renderValue={(value) => {
              const current = TABS.find((x) => x.id === value) || TABS[0];
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <current.Icon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI }} noWrap>
                    {t(current.labelKey)}
                  </Typography>
                </Box>
              );
            }}
            sx={{ height: 34, bgcolor: T.CTRL_BG, borderRadius: '9px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
              '& .MuiSelect-select': { py: 0, display: 'flex', alignItems: 'center' },
              '& .MuiSvgIcon-root.MuiSelect-icon': { color: T.TEXT_TER } }}>
            {TABS.map(({ id, Icon, labelKey }) => (
              <MenuItem key={id} value={id} sx={{ fontSize: '0.82rem', gap: 1 }}>
                <Icon sx={{ fontSize: 17, color: tab === id ? T.TEXT_PRI : T.TEXT_TER }} />
                {t(labelKey)}
              </MenuItem>
            ))}
          </Select>
        ) : (
          <Box sx={{ display: 'flex', gap: 0.5, bgcolor: T.CTRL_BG, borderRadius: '9px',
            p: '3px', border: `1px solid ${T.BD}`, flexShrink: 1, minWidth: 0, ml: 1,
            overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
            {TABS.map(({ id, Icon, labelKey }) => (
              <Tooltip key={id} title="">
                <Button onClick={() => setTab(id)}
                  startIcon={<Icon sx={{ fontSize: 14 }} />}
                  sx={{ minWidth: 0, height: 26, flexShrink: 0, px: 1.25, py: 0, borderRadius: '7px',
                    fontSize: '0.72rem', fontWeight: tab === id ? 700 : 400, textTransform: 'none',
                    color: tab === id ? T.TEXT_PRI : T.TEXT_TER,
                    bgcolor: tab === id ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', color: T.TEXT_PRI } }}>
                  {t(labelKey)}
                </Button>
              </Tooltip>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {tab === 'rawContent'
          ? <RawContentSection openId={tab === 'rawContent' ? openId : null} onOpenHandled={() => setOpenId(null)} />
          : tab === 'readyToUpload'
          ? <ReadyToUploadSection openId={tab === 'readyToUpload' ? openId : null} onOpenHandled={() => setOpenId(null)} />
          : tab === 'linkPages'
          ? <LinkPageSection />
          : tab === 'whatsappShares'
          ? <WhatsappShareSection />
          : tab === 'productContent'
          ? <ProductContentSection />
          : tab === 'analytics'
          ? <WebsiteAnalyticsSection />
          : <BlogSection />}
      </Box>
    </Box>
  );
}
