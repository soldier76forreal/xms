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

import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Tooltip from '@mui/material/Tooltip';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import UserAvatar from '../main/userAvatar';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';
import { fetchRawContents } from '../../store/store';
import InfiniteScrollSentinel from '../../tools/loader/infiniteScrollSentinel';
import PageSizeSelect from '../../tools/inputs/pageSizeSelect';
import RawContentForm from './rawContentForm';
import RawContentDetail from './rawContentDetail';
import { useSidebarWidth } from '../../tools/hooks/useSidebarWidth';
import SidebarResizer from '../../tools/navs/sidebarResizer';
import SectionTutorials from '../tutorials/sectionTutorials';
import { useUnreadRecords } from '../../tools/hooks/useUnreadRecords';
import UnreadDot, { unreadRowTint } from '../../tools/unreadDot';

const STATUS_META = {
  working_on_it:   { labelKey: 'dm.statusWorkingOnIt', color: '#64b5f6' },
  rejected:        { labelKey: 'dm.statusRejected',    color: '#e57373' },
  canceled:        { labelKey: 'dm.statusCanceled',    color: '#9e9e9e' },
  ready_to_upload: { labelKey: 'dm.statusReady',       color: '#81c784' },
};
// Same suggestion list as rawContentForm.js/readyToUploadForm.js — the field
// is freeSolo everywhere (extensible), so this is just a starting point.
const PLACE_OPTIONS = ['Post', 'Reels', 'Story', 'YouTube Short', 'TikTok post', 'Carousel', 'Live'];

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
  const { branches } = useBranch();

  const items      = useSelector(s => s.dmRawContents);
  const total      = useSelector(s => s.dmRawContentsTotal);
  const loading    = useSelector(s => s.dmRawContentsLoading);
  const refreshKey = useSelector(s => s.dmRefreshKey);

  // Flags a raw content batch inserted by someone else since this user's
  // last visit as unread (dot + tinted row) — see useUnreadRecords.js.
  const { isUnread } = useUnreadRecords('dmRawContent');

  const [status, setStatus]   = useState('all');
  const [branchFilter, setBranchFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  // Resizable master list, persisted per user (see useSidebarWidth).
  const { width: listWidth, setWidth: setListWidth, resetWidth: resetListWidth } =
    useSidebarWidth('dmRawContentList', 380, { min: 260, max: 720 });
  const [listResizing, setListResizing] = useState(false);
  useEffect(() => {
    if (!listResizing) return;
    const stop = () => setListResizing(false);
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, [listResizing]);
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
    ...(branchFilter ? { branchId: branchFilter } : {}),
    ...(platformFilter ? { platform: platformFilter } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }), [status, pageSize, branchFilter, platformFilter, dateFrom, dateTo]);

  const load = useCallback((pg = 1) => {
    dispatch(fetchRawContents({ authCtx, axiosGlobal, params: buildParams(pg) }));
    setPage(pg);
  }, [authCtx, axiosGlobal, buildParams, dispatch]);

  useEffect(() => { load(1); }, [status, branchFilter, platformFilter, dateFrom, dateTo, pageSize, refreshKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  const clearFilters = () => { setStatus('all'); setBranchFilter(''); setPlatformFilter(''); setDateFrom(''); setDateTo(''); };
  const activeFilterCount = [
    status !== 'all', branchFilter, platformFilter, dateFrom, dateTo,
  ].filter(Boolean).length;
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
              {t('dm.rawContentCount', { count: total })}
            </Typography>
            <Tooltip title={t('common.filters')}>
              <IconButton size="small" onClick={() => setFilterOpen(!filterOpen)}
                sx={{ color: activeFilterCount > 0 ? T.TEXT_PRI : T.TEXT_TER,
                  bgcolor: filterOpen ? T.CTRL_BG : 'transparent',
                  border: `1px solid ${activeFilterCount > 0 ? T.BD2 : T.BD}`,
                  borderRadius: '8px', width: 28, height: 28, position: 'relative' }}>
                <FilterListIcon sx={{ fontSize: 15 }} />
                {activeFilterCount > 0 && (
                  <Box sx={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14,
                    borderRadius: '50%', bgcolor: 'text.primary', display: 'flex',
                    alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '0.55rem', color: isDark ? '#000' : '#fff', fontWeight: 700 }}>
                      {activeFilterCount}
                    </Typography>
                  </Box>
                )}
              </IconButton>
            </Tooltip>
            <PageSizeSelect value={pageSize} onChange={(v) => { setPageSize(v); }} />
            {can('digitalMarketing:rawContent:create') && (
              <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => setFormOpen(true)}
                sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px' }}>
                {t('dm.newBatch')}
              </Button>
            )}
            <SectionTutorials section="digitalMarketing" tag="digitalMarketing:rawContent:create" />
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
                  const isUnr = isUnread(item);
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
                      <Box sx={{ position: 'relative', flexGrow: 1, minWidth: 0, p: 1.25, borderRadius: '10px',
                        bgcolor: isSel ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : isUnr ? unreadRowTint(isDark) : 'transparent',
                        border: `1px solid ${isSel ? T.BD2 : 'transparent'}`,
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' } }}>
                        {isUnr && <UnreadDot />}
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

      {/* ── Filter Drawer — same sidebar pattern as CRM's ── */}
      <Drawer anchor="right" open={filterOpen} onClose={() => setFilterOpen(false)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 320 },
          bgcolor: T.PANEL_BG, borderLeft: `1px solid ${T.BD}` } }}>

        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5,
          borderBottom: `1px solid ${T.BD}` }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
            {t('common.filters')}
          </Typography>
          <IconButton size="small" onClick={() => setFilterOpen(false)} sx={{ color: T.TEXT_TER }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto' }}>

          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: '0.78rem' }}>{t('common.status')}</InputLabel>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} label={t('common.status')}
              sx={{ fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }}>
              <MenuItem value="all"><em>{t('common.all')}</em></MenuItem>
              {Object.keys(STATUS_META).map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>{t(STATUS_META[s].labelKey)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {branches.length > 1 && (
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: '0.78rem' }}>{t('common.branch')}</InputLabel>
              <Select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} label={t('common.branch')}
                sx={{ fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }}>
                <MenuItem value=""><em>{t('dm.allBranchesOption')}</em></MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b._id} value={b._id} sx={{ fontSize: '0.8rem' }}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Autocomplete freeSolo options={PLACE_OPTIONS} value={platformFilter}
            onInputChange={(e, v) => setPlatformFilter(v || '')}
            renderInput={(params) => (
              <TextField {...params} size="small" label={t('dm.suggestedPlaceToUpload')}
                inputProps={{ ...params.inputProps, style: { fontSize: '0.8rem' } }}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }} />
            )} />

          <Box>
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mb: 1,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t('dm.filterByDateRange')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" type="date" label={t('common.from')} value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
                  '& input': { fontSize: '0.78rem' } }} />
              <TextField size="small" type="date" label={t('common.to')} value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
                  '& input': { fontSize: '0.78rem' } }} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${T.BD}` }}>
          <Button fullWidth size="small" onClick={clearFilters}
            sx={{ fontSize: '0.75rem', textTransform: 'none', color: T.TEXT_SEC,
              border: `1px solid ${T.BD}`, borderRadius: '8px' }}>
            {t('common.clearAllFilters')}
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
