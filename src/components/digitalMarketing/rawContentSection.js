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
import MovieIcon from '@mui/icons-material/Movie';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import UserAvatar from '../main/userAvatar';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchRawContents } from '../../store/store';
import InfiniteScrollSentinel from '../../tools/loader/infiniteScrollSentinel';
import PageSizeSelect from '../../tools/inputs/pageSizeSelect';
import RawContentForm from './rawContentForm';
import RawContentDetail from './rawContentDetail';

const STATUS_META = {
  working_on_it:   { labelKey: 'dm.statusWorkingOnIt', color: '#64b5f6' },
  rejected:        { labelKey: 'dm.statusRejected',    color: '#e57373' },
  canceled:        { labelKey: 'dm.statusCanceled',    color: '#9e9e9e' },
  ready_to_upload: { labelKey: 'dm.statusReady',       color: '#81c784' },
};
const STATUS_TABS = ['all', 'working_on_it', 'rejected', 'canceled', 'ready_to_upload'];

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

export default function RawContentSection({ openId = null, onOpenHandled = () => {} }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob  = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const items      = useSelector(s => s.dmRawContents);
  const total      = useSelector(s => s.dmRawContentsTotal);
  const loading    = useSelector(s => s.dmRawContentsLoading);
  const refreshKey = useSelector(s => s.dmRefreshKey);

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
    RAIL:     isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.12)',
  };

  const buildParams = useCallback((pg = 1) => ({
    page: pg, limit: pageSize,
    ...(status !== 'all' ? { status } : {}),
  }), [status, pageSize]);

  const load = useCallback((pg = 1) => {
    dispatch(fetchRawContents({ authCtx, axiosGlobal, params: buildParams(pg) }));
    setPage(pg);
  }, [authCtx, axiosGlobal, buildParams, dispatch]);

  useEffect(() => { load(1); }, [status, pageSize, refreshKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setHasMore(items.length < total); }, [items, total]);

  // Deep link from a notification (dm chat) — open that batch's detail directly.
  // The detail component re-fetches by id, so a stub {_id} is enough.
  useEffect(() => {
    if (!openId) return;
    setSelected({ _id: openId });
    if (isMob) setMobileDetail(true);
    onOpenHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const loadMore = () => load(page + 1);

  const handleSelect = (item) => {
    setSelected(item);
    if (isMob) setMobileDetail(true);
  };
  const handleDetailClose = () => {
    setSelected(null);
    if (isMob) setMobileDetail(false);
  };

  const previewIcon = (item) => {
    if (!item.files || !item.files.length) return null;
    return <MovieIcon sx={{ fontSize: 14, color: T.TEXT_TER }} />;
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── List panel ── */}
      {(!isMob || !mobileDetail) && (
        <Box sx={{ width: isMob ? '100%' : (selected ? 380 : '100%'), flexShrink: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRight: (!isMob && selected) ? `1px solid ${T.BD}` : 'none' }}>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
              {t('dm.rawContentCount', { count: total })}
            </Typography>
            <PageSizeSelect value={pageSize} onChange={(v) => { setPageSize(v); }} />
            {can('digitalMarketing:rawContent:create') && (
              <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => setFormOpen(true)}
                sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px' }}>
                {t('dm.newBatch')}
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, px: 2, pb: 1, flexWrap: 'wrap' }}>
            {STATUS_TABS.map((s) => {
              const meta = s === 'all' ? { labelKey: 'common.all', color: T.TEXT_TER } : STATUS_META[s];
              const active = status === s;
              return (
                <Button key={s} size="small" onClick={() => setStatus(s)}
                  sx={{ minWidth: 0, height: 24, px: 1.1, py: 0, borderRadius: '7px',
                    fontSize: '0.68rem', fontWeight: active ? 700 : 400, textTransform: 'none',
                    color: active ? T.TEXT_PRI : T.TEXT_TER,
                    bgcolor: active ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
                    border: `1px solid ${active ? T.BD2 : 'transparent'}` }}>
                  {t(meta.labelKey)}
                </Button>
              );
            })}
          </Box>

          {/* ── Timeline ── */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
            {loading && items.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={22} sx={{ color: T.TEXT_TER }} />
              </Box>
            ) : items.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: T.TEXT_TER, py: 6, fontSize: '0.82rem' }}>
                {t('dm.noRawContentYet')}
              </Typography>
            ) : (
              <Box sx={{ position: 'relative' }}>
                {items.map((item, i) => {
                  const isSel = selected && String(selected._id) === String(item._id);
                  const st = STATUS_META[item.status] || STATUS_META.working_on_it;
                  return (
                    <Box key={item._id} onClick={() => handleSelect(item)}
                      sx={{ display: 'flex', gap: 1.25, cursor: 'pointer', position: 'relative',
                        pb: i === items.length - 1 ? 0 : 2 }}>
                      {i !== items.length - 1 && (
                        <Box sx={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: '1px', bgcolor: T.RAIL }} />
                      )}
                      <Box sx={{ width: 23, height: 23, borderRadius: '50%', flexShrink: 0, mt: 0.25,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: T.CTRL_BG, border: `1px solid ${st.color}55` }}>
                        {previewIcon(item) || <MovieIcon sx={{ fontSize: 13, color: st.color }} />}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0, p: 1.25, borderRadius: '10px',
                        bgcolor: isSel ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent',
                        border: `1px solid ${isSel ? T.BD2 : 'transparent'}`,
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4 }}>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: T.TEXT_PRI, flexGrow: 1 }} noWrap>
                            {item.title?.trim()
                              ? item.title
                              : `${t('dm.fileCount', { count: item.files?.length || 0 })} · ${item.language || '—'}`}
                          </Typography>
                          <Chip label={t(st.labelKey)} size="small" sx={{ height: 17, fontSize: '0.6rem', fontWeight: 700,
                            bgcolor: `${st.color}22`, color: st.color, '& .MuiChip-label': { px: 0.6 } }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }}>
                          {item.title?.trim()
                            ? `${t('dm.fileCount', { count: item.files?.length || 0 })} · ${item.language || '—'} · `
                            : ''}{item.useCase} · {item.platform}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.3 }}>
                          {item.createdByName && <UserAvatar userId={item.createdBy} size={14} fontSize="0.5rem" />}
                          <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>
                            {item.createdByName ? `${item.createdByName} · ` : ''}{fmtDate(item.insertDate)}
                          </Typography>
                        </Box>
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

      {/* ── Detail panel ── */}
      {selected && (!isMob || mobileDetail) && (
        <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative', bgcolor: T.PANEL_BG }}>
          {isMob && (
            <IconButton size="small" onClick={handleDetailClose}
              sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10,
                color: T.TEXT_TER, bgcolor: T.CTRL_BG, borderRadius: '8px', width: 30, height: 30 }}>
              <ArrowBackIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          <RawContentDetail id={selected._id} onClose={handleDetailClose} onDeleted={handleDetailClose} />
        </Box>
      )}

      {!selected && !isMob && items.length > 0 && (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <MovieIcon sx={{ fontSize: 40, color: T.TEXT_TER, mb: 1 }} />
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
              {t('dm.selectBatchToViewDetails')}
            </Typography>
          </Box>
        </Box>
      )}

      <RawContentForm open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
