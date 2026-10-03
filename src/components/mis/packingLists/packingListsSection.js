import { useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useDispatch, useSelector } from 'react-redux';

import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../../contextApi/PermissionContext';
import { useBranch } from '../../../contextApi/BranchContext';
import { fetchMisPackingLists } from '../../../store/store';
import SkeletonWrapper from '../../../tools/loader/skeletonWrapper';
import InfiniteScrollSentinel from '../../../tools/loader/infiniteScrollSentinel';
import { useSidebarWidth } from '../../../tools/hooks/useSidebarWidth';
import SidebarResizer from '../../../tools/navs/sidebarResizer';
import PackingListCard from './packingListCard';
import PackingListDetail from './packingListDetail';
import PackingListForm from './packingListForm';

// Packing Lists — the MIS section's 4th tab. Master/detail on the SAME shell as
// the invoice branch of mis.js: a fixed-width scrollable list panel and a
// detail panel that grows. The earlier version rendered a 720px centred column
// with no height or scroll management inside a `height:100%; overflow:hidden`
// flex parent, which is what jammed the records into a narrow strip.
export default function PackingListsSection({ openId, onOpenIdConsumed }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob = useMediaQuery(theme.breakpoints.down('md'));
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch = useDispatch();
  const { can } = usePermissions();
  const { activeBranchId } = useBranch();

  const packingLists = useSelector((s) => s.misPackingLists);
  const total = useSelector((s) => s.misPackingListsTotal);
  const loading = useSelector((s) => s.misPackingListsLoading);
  const refreshKey = useSelector((s) => s.misPackingListRefreshKey);

  const [selectedId, setSelectedId] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [listResizing, setListResizing] = useState(false);

  const { width: listWidth, setWidth: setListWidth, resetWidth: resetListWidth } =
    useSidebarWidth('misPackingListList', 400, { min: 320, max: 640 });

  const T = {
    APP_BG:   isDark ? '#060606' : theme.palette.background.default,
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback((skip = 0) => {
    if (!activeBranchId) return;
    dispatch(fetchMisPackingLists({ authCtx, axiosGlobal, params: {
      branchId: activeBranchId, limit: 40, skip,
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    } }));
  }, [dispatch, authCtx, axiosGlobal, activeBranchId, typeFilter, debouncedSearch]);

  useEffect(() => { load(0); }, [load, refreshKey]);
  useEffect(() => { setHasMore(packingLists.length < total); }, [packingLists, total]);

  useEffect(() => {
    if (!openId) return;
    setSelectedId(openId);
    if (isMob) setMobileDetail(true);
    onOpenIdConsumed && onOpenIdConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const handleSelect = (doc) => {
    setSelectedId(doc._id);
    if (isMob) setMobileDetail(true);
  };
  const handleBack = () => {
    if (isMob) { setMobileDetail(false); setSelectedId(null); }
    else setSelectedId(null);
  };

  return (
    <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

      {/* ── List panel ── */}
      {(!isMob || !mobileDetail) && (
        <Box sx={{
          width: isMob ? '100%' : (selectedId ? listWidth : '100%'),
          flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: (!isMob && selectedId) ? `1px solid ${T.BD}` : 'none',
          bgcolor: T.PANEL_BG, overflow: 'hidden', position: 'relative',
          transition: listResizing ? 'none' : 'width 0.2s',
        }}>

          {!isMob && selectedId && (
            <SidebarResizer width={listWidth} side="right"
              onResize={(w) => { setListResizing(true); setListWidth(w); }}
              onDoubleClick={resetListWidth} />
          )}

          {/* Toolbar — search, type filter, new */}
          <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1,
            borderBottom: `1px solid ${T.BD}`, flexShrink: 0, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexGrow: 1, minWidth: 140,
              bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}`, borderRadius: '9px', px: 1, height: 30 }}>
              <SearchIcon sx={{ fontSize: 15, color: T.TEXT_TER }} />
              <InputBase value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t('mis.plSearchPlaceholder')}
                sx={{ fontSize: '0.78rem', color: T.TEXT_PRI, flex: 1,
                  '& input::placeholder': { color: T.TEXT_TER, opacity: 1 } }} />
              {search && (
                <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.25 }}>
                  <CloseIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />
                </IconButton>
              )}
            </Box>

            {can('mis:packingList:create') && (
              <Button variant="contained" size="small" onClick={() => setFormOpen(true)}
                startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                sx={{ height: 30, borderRadius: '8px', fontSize: '0.72rem',
                  textTransform: 'none', fontWeight: 700, flexShrink: 0 }}>
                {t('mis.plNewTitle')}
              </Button>
            )}
          </Box>

          {/* Type filter + count */}
          <Box sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
            borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
            <ToggleButtonGroup size="small" exclusive value={typeFilter}
              onChange={(_, v) => v && setTypeFilter(v)}>
              {[
                { v: 'all', l: t('mis.allTab') },
                { v: 'linked', l: t('mis.plTypeLinked') },
                { v: 'free', l: t('mis.plTypeFree') },
              ].map((o) => (
                <ToggleButton key={o.v} value={o.v}
                  sx={{ px: 1.25, py: 0.15, fontSize: '0.66rem', textTransform: 'none',
                    borderColor: T.BD, color: T.TEXT_SEC }}>
                  {o.l}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography sx={{ ml: 'auto', fontSize: '0.7rem', color: T.TEXT_TER }}>
              {t('mis.plCountLabel', { count: total })}
            </Typography>
          </Box>

          {/* Scrollable list */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 0.75 }}>
            <SkeletonWrapper loading={loading && packingLists.length === 0} variant="table" count={6}>
              {packingLists.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', py: 8, px: 3, gap: 1 }}>
                  <LocalShippingIcon sx={{ fontSize: 30, color: T.TEXT_TER }} />
                  <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC, textAlign: 'center' }}>
                    {search || typeFilter !== 'all' ? t('mis.plNoneMatch') : t('mis.plNoneYet')}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ px: 1, py: 0.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {packingLists.map((doc) => (
                    <PackingListCard key={doc._id} doc={doc} T={T}
                      selected={doc._id === selectedId} onClick={() => handleSelect(doc)} />
                  ))}
                  <InfiniteScrollSentinel onIntersect={() => load(packingLists.length)}
                    hasMore={hasMore} loading={loading} />
                </Box>
              )}
            </SkeletonWrapper>
          </Box>
        </Box>
      )}

      {/* ── Detail panel — grows ── */}
      {selectedId && (!isMob || mobileDetail) && (
        <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden', bgcolor: T.PANEL_BG }}>
          <PackingListDetail packingListId={selectedId} onBack={handleBack} />
        </Box>
      )}

      {/* Desktop empty-detail placeholder */}
      {!selectedId && !isMob && packingLists.length > 0 && (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', bgcolor: T.APP_BG }}>
          <Box sx={{ textAlign: 'center' }}>
            <LocalShippingIcon sx={{ fontSize: 40, color: T.TEXT_TER, mb: 1 }} />
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
              {t('mis.plSelectPrompt')}
            </Typography>
          </Box>
        </Box>
      )}

      <PackingListForm open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
