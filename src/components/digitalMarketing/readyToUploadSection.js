import { useState, useEffect, useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import UserAvatar from '../main/userAvatar';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchReadyToUploadList } from '../../store/store';
import InfiniteScrollSentinel from '../../tools/loader/infiniteScrollSentinel';
import PageSizeSelect from '../../tools/inputs/pageSizeSelect';
import ReadyToUploadDetail from './readyToUploadDetail';
import { useSidebarWidth } from '../../tools/hooks/useSidebarWidth';
import SidebarResizer from '../../tools/navs/sidebarResizer';
import { useUnreadRecords } from '../../tools/hooks/useUnreadRecords';
import UnreadDot, { unreadRowTint } from '../../tools/unreadDot';
import ReadyToUploadForm from './readyToUploadForm';

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

// Timeline list of ready-to-upload content — records arrive either via a raw
// content record's status toggle (linked back via rawContentId) or via the
// standalone "New" button below (no back-reference).
export default function ReadyToUploadSection({ openId = null, onOpenHandled = () => {} }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob  = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();
  const [formOpen, setFormOpen] = useState(false);

  const items      = useSelector(s => s.dmReadyToUpload);
  const total      = useSelector(s => s.dmReadyToUploadTotal);
  const loading    = useSelector(s => s.dmReadyToUploadLoading);
  const refreshKey = useSelector(s => s.dmRefreshKey);

  // Flags a ready-to-upload record inserted by someone else since this
  // user's last visit as unread (dot + tinted row) — see useUnreadRecords.js.
  const { isUnread } = useUnreadRecords('dmReadyToUpload');

  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  // Resizable master list, persisted per user (see useSidebarWidth).
  const { width: listWidth, setWidth: setListWidth, resetWidth: resetListWidth } =
    useSidebarWidth('dmReadyToUploadList', 380, { min: 260, max: 720 });
  const [listResizing, setListResizing] = useState(false);
  useEffect(() => {
    if (!listResizing) return;
    const stop = () => setListResizing(false);
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, [listResizing]);

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

  const load = useCallback((pg = 1) => {
    dispatch(fetchReadyToUploadList({ authCtx, axiosGlobal, params: { page: pg, limit: pageSize } }));
    setPage(pg);
  }, [authCtx, axiosGlobal, pageSize, dispatch]);

  useEffect(() => { load(1); }, [pageSize, refreshKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setHasMore(items.length < total); }, [items, total]);

  // Deep link from a notification — open that record's detail (detail re-fetches by id).
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

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
              {t('dm.readyToUploadCount', { count: total })}
            </Typography>
            {can('digitalMarketing:readyToUpload:edit') && (
              <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => setFormOpen(true)}
                sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px', flexShrink: 0 }}>
                {t('common.new')}
              </Button>
            )}
            <PageSizeSelect value={pageSize} onChange={setPageSize} />
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
            {loading && items.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={22} sx={{ color: T.TEXT_TER }} />
              </Box>
            ) : items.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: T.TEXT_TER, py: 6, fontSize: '0.82rem' }}>
                {t('dm.nothingReadyYet')}
              </Typography>
            ) : (
              <Box sx={{ position: 'relative' }}>
                {items.map((item, i) => {
                  const isSel = selected && String(selected._id) === String(item._id);
                  const isUnr = isUnread(item);
                  return (
                    <Box key={item._id} onClick={() => handleSelect(item)}
                      sx={{ display: 'flex', gap: 1.25, cursor: 'pointer', position: 'relative',
                        pb: i === items.length - 1 ? 0 : 2 }}>
                      {i !== items.length - 1 && (
                        <Box sx={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: '1px', bgcolor: T.RAIL }} />
                      )}
                      <Box sx={{ width: 23, height: 23, borderRadius: '50%', flexShrink: 0, mt: 0.25,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: T.CTRL_BG, border: `1px solid #81c78455` }}>
                        <CloudUploadIcon sx={{ fontSize: 13, color: '#81c784' }} />
                      </Box>
                      <Box sx={{ position: 'relative', flexGrow: 1, minWidth: 0, p: 1.25, borderRadius: '10px',
                        bgcolor: isSel ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : isUnr ? unreadRowTint(isDark) : 'transparent',
                        border: `1px solid ${isSel ? T.BD2 : 'transparent'}`,
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' } }}>
                        {isUnr && <UnreadDot />}
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: T.TEXT_PRI }} noWrap>
                          {item.title?.trim()
                            ? item.title
                            : `${t('dm.fileCount', { count: item.files?.length || 0 })} · ${item.platform || '—'}`}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, mt: 0.2 }} noWrap>
                          {item.title?.trim()
                            ? `${t('dm.fileCount', { count: item.files?.length || 0 })} · ${item.platform || '—'} · `
                            : ''}{item.caption || t('dm.noCaption')}
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

      {selected && (!isMob || mobileDetail) && (
        <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative', bgcolor: T.PANEL_BG }}>
          {isMob && (
            <IconButton size="small" onClick={handleDetailClose}
              sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10,
                color: T.TEXT_TER, bgcolor: T.CTRL_BG, borderRadius: '8px', width: 30, height: 30 }}>
              <ArrowBackIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          <ReadyToUploadDetail id={selected._id} onClose={handleDetailClose} onDeleted={handleDetailClose} />
        </Box>
      )}

      {!selected && !isMob && items.length > 0 && (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CloudUploadIcon sx={{ fontSize: 40, color: T.TEXT_TER, mb: 1 }} />
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
              {t('dm.selectRecordToViewDetails')}
            </Typography>
          </Box>
        </Box>
      )}

      <ReadyToUploadForm open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
