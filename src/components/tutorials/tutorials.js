import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchTutorials } from '../../store/store';
import InfiniteScrollSentinel from '../../tools/loader/infiniteScrollSentinel';
import PageSizeSelect from '../../tools/inputs/pageSizeSelect';
import TutorialCard from './tutorialCard';
import TutorialForm from './tutorialForm';
import TutorialDetail from './tutorialDetail';
import { useSidebarWidth } from '../../tools/hooks/useSidebarWidth';
import { useUnreadRecords } from '../../tools/hooks/useUnreadRecords';
import SidebarResizer from '../../tools/navs/sidebarResizer';
import { SECTIONS, sectionLabel } from './sectionLabels';

const LANGUAGES = ['en', 'fa', 'ar'];

// Top-level Tutorial Center — a normal nav section (index 8) alongside CRM/MIS/
// Inventory/etc. Master-detail timeline list, filterable by section/tag/
// language/search. The per-section "space" for tutorials is a separate small
// widget (sectionTutorials.js) dropped into each existing section's toolbar —
// this component is the full browse/manage experience.
export default function Tutorials() {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob  = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const history     = useHistory();
  const location    = useLocation();
  const { can } = usePermissions();

  const items      = useSelector((s) => s.tutorials);
  const total      = useSelector((s) => s.tutorialsTotal);
  const loading    = useSelector((s) => s.tutorialsLoading);
  const refreshKey = useSelector((s) => s.tutorialRefreshKey);

  // Flags a tutorial inserted by someone else since this user's last visit
  // as unread (dot + tinted row) — see useUnreadRecords.js.
  const { isUnread } = useUnreadRecords('tutorials');

  const [section, setSection]   = useState('all');
  const [language, setLanguage] = useState('all');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [hasMore, setHasMore]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  // Resizable master list, persisted per user (see useSidebarWidth).
  const { width: listWidth, setWidth: setListWidth, resetWidth: resetListWidth } =
    useSidebarWidth('tutorialsList', 380, { min: 260, max: 720 });
  const [listResizing, setListResizing] = useState(false);
  useEffect(() => {
    if (!listResizing) return;
    const stop = () => setListResizing(false);
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, [listResizing]);
  const [formOpen, setFormOpen] = useState(false);

  const T = useMemo(() => ({
    APP_BG:   isDark ? '#060606' : theme.palette.background.default,
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  }), [isDark, theme]);

  const buildParams = useCallback((pg = 1) => ({
    page: pg, limit: pageSize,
    ...(section !== 'all' ? { section } : {}),
    ...(language !== 'all' ? { language } : {}),
    ...(search ? { search } : {}),
  }), [section, language, search, pageSize]);

  const load = useCallback((pg = 1) => {
    dispatch(fetchTutorials({ authCtx, axiosGlobal, params: buildParams(pg) }));
    setPage(pg);
  }, [authCtx, axiosGlobal, buildParams, dispatch]);

  useEffect(() => { load(1); }, [section, language, search, pageSize, refreshKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setHasMore(items.length < total); }, [items, total]);

  // Deep link from a "new tutorial" notification click or a short link:
  // /tutorials?open=<id> opens that tutorial's detail (tutorialDetail
  // self-fetches the full doc by id). Cleared afterwards so it doesn't
  // re-trigger on later re-renders. Same pattern as crm.js/mis.js/users.js.
  useEffect(() => {
    const openId = new URLSearchParams(location.search).get('open');
    if (!openId) return;
    setSelected({ _id: openId });
    if (isMob) setMobileDetail(true);
    history.replace('/tutorials');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadMore = () => load(page + 1);

  const handleSelect = (item) => {
    setSelected(item);
    if (isMob) setMobileDetail(true);
  };
  const handleDetailClose = () => {
    setSelected(null);
    if (isMob) setMobileDetail(false);
  };

  if (!can('tutorials:view')) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
        <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_TER }}>
          {t('tutorials.noPermissionView')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden', bgcolor: T.APP_BG }}>

      {(!isMob || !mobileDetail) && (
        <Box sx={{ width: isMob ? '100%' : (selected ? listWidth : '100%'), flexShrink: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
          borderRight: (!isMob && selected) ? `1px solid ${T.BD}` : 'none',
          transition: listResizing ? 'none' : undefined }}>
          {!isMob && selected && (
            <SidebarResizer width={listWidth} side="right"
              onResize={(w) => { setListResizing(true); setListWidth(w); }}
              onDoubleClick={resetListWidth} />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
              {t('tutorials.countLabel', { count: total })}
            </Typography>
            <PageSizeSelect value={pageSize} onChange={(v) => setPageSize(v)} />
            {can('tutorials:upload') && (
              <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => setFormOpen(true)}
                sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px' }}>
                {t('tutorials.uploadTutorial')}
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, px: 2, pb: 1.25, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder={t('tutorials.searchPlaceholder')} value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 140, '& .MuiOutlinedInput-root': { bgcolor: T.CTRL_BG, borderRadius: '8px', fontSize: '0.78rem' } }} />
            <TextField select size="small" value={section} onChange={(e) => setSection(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 110, '& .MuiOutlinedInput-root': { bgcolor: T.CTRL_BG, borderRadius: '8px', fontSize: '0.78rem' } }}>
              <option value="all">{t('common.all')}</option>
              {SECTIONS.map((s) => <option key={s} value={s}>{sectionLabel(s, t)}</option>)}
            </TextField>
            <TextField select size="small" value={language} onChange={(e) => setLanguage(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 90, '& .MuiOutlinedInput-root': { bgcolor: T.CTRL_BG, borderRadius: '8px', fontSize: '0.78rem' } }}>
              <option value="all">{t('common.all')}</option>
              {LANGUAGES.map((l) => <option key={l} value={l}>{t(`tutorials.lang${l.toUpperCase()}`)}</option>)}
            </TextField>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
            {loading && items.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={22} sx={{ color: T.TEXT_TER }} />
              </Box>
            ) : items.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: T.TEXT_TER, py: 6, fontSize: '0.82rem' }}>
                {t('tutorials.noneYet')}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {items.map((item) => (
                  <TutorialCard key={item._id} tutorial={item} T={T} isDark={isDark}
                    selected={selected && String(selected._id) === String(item._id)}
                    unread={isUnread(item)}
                    onClick={() => handleSelect(item)} />
                ))}
                <InfiniteScrollSentinel onIntersect={loadMore} hasMore={hasMore} loading={loading} />
              </Box>
            )}
          </Box>
        </Box>
      )}

      {selected && (!isMob || mobileDetail) && (
        <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative', bgcolor: T.PANEL_BG }}>
          {isMob && (
            <IconButton size="small" onClick={handleDetailClose}
              sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10,
                color: T.TEXT_TER, bgcolor: T.CTRL_BG, borderRadius: '8px', width: 30, height: 30 }}>
              <ArrowBackIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          <TutorialDetail id={selected._id} onClose={handleDetailClose} onDeleted={handleDetailClose} />
        </Box>
      )}

      {!selected && !isMob && items.length > 0 && (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 40, color: T.TEXT_TER, mb: 1 }} />
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
              {t('tutorials.selectToViewDetails')}
            </Typography>
          </Box>
        </Box>
      )}

      <TutorialForm open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
