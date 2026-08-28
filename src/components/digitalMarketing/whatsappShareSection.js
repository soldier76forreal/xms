import { useState, useEffect, useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchWhatsappShares } from '../../store/store';
import InfiniteScrollSentinel from '../../tools/loader/infiniteScrollSentinel';
import PageSizeSelect from '../../tools/inputs/pageSizeSelect';
import ShareWhatsAppDialog from './shareWhatsAppDialog';
import WhatsappShareDetail from './whatsappShareDetail';

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

export default function WhatsappShareSection() {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob  = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const items      = useSelector(s => s.dmWhatsappShares);
  const total      = useSelector(s => s.dmWhatsappSharesTotal);
  const loading    = useSelector(s => s.dmWhatsappSharesLoading);
  const refreshKey = useSelector(s => s.dmRefreshKey);

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

  const load = useCallback((pg = 1) => {
    dispatch(fetchWhatsappShares({ authCtx, axiosGlobal, params: { page: pg, limit: pageSize } }));
    setPage(pg);
  }, [authCtx, axiosGlobal, pageSize, dispatch]);

  useEffect(() => { load(1); }, [pageSize, refreshKey]);   // eslint-disable-line react-hooks/exhaustive-deps
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

  const ACTION_ICON_COLOR = { copied: T.TEXT_TER, openedWhatsApp: '#25D366' };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {(!isMob || !mobileDetail) && (
        <Box sx={{ width: isMob ? '100%' : (selected ? 380 : '100%'), flexShrink: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRight: (!isMob && selected) ? `1px solid ${T.BD}` : 'none' }}>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
              {t('dm.whatsappShareCount', { count: total })}
            </Typography>
            <PageSizeSelect value={pageSize} onChange={(v) => setPageSize(v)} />
            {can('inventory:share:whatsapp') && (
              <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => setFormOpen(true)}
                sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '8px' }}>
                {t('dm.newWhatsappShare')}
              </Button>
            )}
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
            {loading && items.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={22} sx={{ color: T.TEXT_TER }} />
              </Box>
            ) : items.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: T.TEXT_TER, py: 6, fontSize: '0.82rem' }}>
                {t('dm.noWhatsappSharesYet')}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {items.map((item) => {
                  const isSel = selected && String(selected._id) === String(item._id);
                  const name = item.nameLanguage === 'ar' ? (item.productNameAr || item.productName) : item.productName;
                  return (
                    <Box key={item._id} onClick={() => handleSelect(item)}
                      sx={{ display: 'flex', gap: 1.25, p: 1.25, borderRadius: '10px', cursor: 'pointer',
                        bgcolor: isSel ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent',
                        border: `1px solid ${isSel ? T.BD2 : 'transparent'}`,
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' } }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: T.CTRL_BG }}>
                        <WhatsAppIcon sx={{ fontSize: 18, color: ACTION_ICON_COLOR[item.action] || T.TEXT_TER }} />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.TEXT_PRI }} noWrap>
                          {name || item.variantCode}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, fontFamily: 'monospace' }} noWrap>
                          {item.variantCode}
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
          <WhatsappShareDetail id={selected._id} onClose={handleDetailClose} onDeleted={handleDetailClose} />
        </Box>
      )}

      {!selected && !isMob && items.length > 0 && (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <WhatsAppIcon sx={{ fontSize: 40, color: T.TEXT_TER, mb: 1 }} />
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
              {t('dm.selectWhatsappShareToViewDetails')}
            </Typography>
          </Box>
        </Box>
      )}

      <ShareWhatsAppDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
