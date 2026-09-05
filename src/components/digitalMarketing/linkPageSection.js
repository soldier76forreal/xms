import { useState, useEffect, useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkIcon from '@mui/icons-material/Link';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchLinkPages } from '../../store/store';
import InfiniteScrollSentinel from '../../tools/loader/infiniteScrollSentinel';
import PageSizeSelect from '../../tools/inputs/pageSizeSelect';
import LinkPageForm from './linkPageForm';
import LinkPageDetail from './linkPageDetail';
import { useUnreadRecords } from '../../tools/hooks/useUnreadRecords';
import UnreadDot, { unreadRowTint } from '../../tools/unreadDot';

const STATUS_TABS = ['all', 'active', 'inactive'];

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

export default function LinkPageSection() {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob  = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const items      = useSelector(s => s.dmLinkPages);
  const total      = useSelector(s => s.dmLinkPagesTotal);
  const loading    = useSelector(s => s.dmLinkPagesLoading);
  const refreshKey = useSelector(s => s.dmRefreshKey);

  // Flags a link page inserted by someone else since this user's last visit
  // as unread (dot + tinted row) — see useUnreadRecords.js.
  const { isUnread } = useUnreadRecords('dmLinkPages');

  const [status, setStatus]   = useState('all');
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const T = {
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const buildParams = useCallback((pg = 1) => ({
    page: pg, limit: pageSize,
    ...(status !== 'all' ? { status } : {}),
  }), [status, pageSize]);

  const load = useCallback((pg = 1) => {
    dispatch(fetchLinkPages({ authCtx, axiosGlobal, params: buildParams(pg) }));
    setPage(pg);
  }, [authCtx, axiosGlobal, buildParams, dispatch]);

  useEffect(() => { load(1); }, [status, pageSize, refreshKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setHasMore(items.length < total); }, [items, total]);

  const loadMore = () => load(page + 1);

  const handleSelect = (item) => {
    setSelected(item);
    if (isMob) setMobileDetail(true);
  };
  const handleDetailClose = () => {
    setSelected(null);
    if (isMob) setMobileDetail(false);
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {(!isMob || !mobileDetail) && (
        <Box sx={{ width: isMob ? '100%' : (selected ? 380 : '100%'), flexShrink: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRight: (!isMob && selected) ? `1px solid ${T.BD}` : 'none' }}>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
              {t('dm.linkPageCount', { count: total })}
            </Typography>
            <PageSizeSelect value={pageSize} onChange={(v) => setPageSize(v)} />
            {can('digitalMarketing:linkPage:create') && (
              <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => setFormOpen(true)}
                sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px' }}>
                {t('dm.newLinkPage')}
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, px: 2, pb: 1, flexWrap: 'wrap' }}>
            {STATUS_TABS.map((s) => {
              const active = status === s;
              return (
                <Button key={s} size="small" onClick={() => setStatus(s)}
                  sx={{ minWidth: 0, height: 24, px: 1.1, py: 0, borderRadius: '7px',
                    fontSize: '0.68rem', fontWeight: active ? 700 : 400, textTransform: 'none',
                    color: active ? T.TEXT_PRI : T.TEXT_TER,
                    bgcolor: active ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
                    border: `1px solid ${active ? T.BD2 : 'transparent'}` }}>
                  {s === 'all' ? t('common.all') : s === 'active' ? t('dm.linkPageStatusActive') : t('dm.linkPageStatusInactive')}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
            {loading && items.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={22} sx={{ color: T.TEXT_TER }} />
              </Box>
            ) : items.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: T.TEXT_TER, py: 6, fontSize: '0.82rem' }}>
                {t('dm.noLinkPagesYet')}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {items.map((item) => {
                  const isSel = selected && String(selected._id) === String(item._id);
                  const isUnr = isUnread(item);
                  const coverUrl = item.coverImage?.diskName ? `${axiosGlobal.defaultTargetApi}/uploads/${item.coverImage.diskName}` : null;
                  return (
                    <Box key={item._id} onClick={() => handleSelect(item)}
                      sx={{ position: 'relative', display: 'flex', gap: 1.25, p: 1.25, borderRadius: '10px', cursor: 'pointer',
                        bgcolor: isSel ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : isUnr ? unreadRowTint(isDark) : 'transparent',
                        border: `1px solid ${isSel ? T.BD2 : 'transparent'}`,
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' } }}>
                      {isUnr && <UnreadDot />}
                      <Box sx={{ width: 44, height: 44, borderRadius: '8px', flexShrink: 0, overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: T.CTRL_BG }}>
                        {coverUrl
                          ? <Box component="img" src={coverUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <LinkIcon sx={{ fontSize: 18, color: T.TEXT_TER }} />}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.TEXT_PRI, flexGrow: 1 }} noWrap>
                            {item.companyName}
                          </Typography>
                          <Chip label={item.status === 'active' ? t('dm.linkPageStatusActive') : t('dm.linkPageStatusInactive')} size="small"
                            sx={{ height: 17, fontSize: '0.6rem', fontWeight: 700,
                              bgcolor: item.status === 'active' ? '#81c78422' : '#9e9e9e22',
                              color: item.status === 'active' ? '#81c784' : '#9e9e9e', '& .MuiChip-label': { px: 0.6 } }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }}>
                          {t('dm.linkPageLinkCount', { count: item.links?.length || 0 })}
                        </Typography>
                        <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, mt: 0.3 }}>
                          {item.createdByName ? `${item.createdByName} · ` : ''}{fmtDate(item.insertDate)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
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
          <LinkPageDetail id={selected._id} onClose={handleDetailClose} onDeleted={handleDetailClose} />
        </Box>
      )}

      {!selected && !isMob && items.length > 0 && (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <LinkIcon sx={{ fontSize: 40, color: T.TEXT_TER, mb: 1 }} />
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
              {t('dm.selectLinkPageToViewDetails')}
            </Typography>
          </Box>
        </Box>
      )}

      <LinkPageForm open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
