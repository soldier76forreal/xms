import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReplyIcon from '@mui/icons-material/Reply';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../../contextApi/PermissionContext';

const STATUS_META = {
  new:       { labelKey: 'inventory.priceRequestStatusNew',       color: '#64b5f6' },
  seen:      { labelKey: 'inventory.priceRequestStatusSeen',      color: '#ffb74d' },
  responded: { labelKey: 'inventory.priceRequestStatusResponded', color: '#81c784' },
  closed:    { labelKey: 'inventory.priceRequestStatusClosed',    color: '#9e9e9e' },
};

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

const PREVIEW_COUNT = 5;

// Public-website price requests that named THIS product — mirrors
// productInvoices.js's reverse-lookup pattern exactly (same preview/expand
// shape), backed by the shared GET /price-requests/product/:productId route
// (see api/routes/priceRequests/main.js — one implementation, also used by
// the CRM Requests tab).
export default function ProductPriceRequests({ productId }) {
  const { t }  = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/price-requests/product/${productId}` });
      setRows(res.data.data || []);
    } catch (_) { setRows([]); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx, axiosGlobal, productId]);

  useEffect(() => { load(); }, [load]);

  const canRespond = can('inventory:website:manage');
  const shown = expanded ? rows : rows.slice(0, PREVIEW_COUNT);

  const submitReply = async () => {
    if (!replyBody.trim()) return;
    setReplying(true);
    try {
      await authCtx.jwtInst({
        method: 'put', url: `${axiosGlobal.defaultTargetApi}/price-requests/${replyTarget._id}/respond`,
        data: { body: replyBody.trim() },
      });
      setReplyTarget(null); setReplyBody('');
      load();
    } catch (_) { /* keep the dialog open on failure */ } finally {
      setReplying(false);
    }
  };

  return (
    <Box sx={{ mt: 3, border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
      bgcolor: 'background.paper', px: 2.5, py: 2 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 1, color: 'text.disabled', display: 'block', mb: 1.5 }}>
        {rows.length > 0 ? t('inventory.priceRequestsForCount', { count: rows.length }) : t('inventory.priceRequestsFor')}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: '10px' }} />
          ))}
        </Box>
      ) : rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.78rem', py: 1 }}>
          {t('inventory.noPriceRequestsForProduct')}
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {shown.map((pr) => {
              const status = STATUS_META[pr.status] || STATUS_META.new;
              const item = pr.items.find((i) => String(i.productId) === String(productId));
              return (
                <Box key={pr._id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5,
                  px: 1.5, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>{pr.name}</Typography>
                    <Box sx={{ px: 0.6, py: '1px', borderRadius: '5px', bgcolor: `${status.color}22`, flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: status.color }}>
                        {t(status.labelKey)}
                      </Typography>
                    </Box>
                    <Typography noWrap sx={{ fontSize: '0.72rem', color: 'text.secondary', flexGrow: 1, minWidth: 0 }}>
                      {item?.variantCode} · {item?.quantity} {item?.unit}
                    </Typography>
                    <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', flexShrink: 0 }}>
                      {fmtDate(pr.insertDate)}
                    </Typography>
                    {canRespond && pr.status !== 'responded' && (
                      <Button size="small" startIcon={<ReplyIcon sx={{ fontSize: 13 }} />}
                        onClick={() => { setReplyTarget(pr); setReplyBody(''); }}
                        sx={{ fontSize: '0.66rem', textTransform: 'none', minWidth: 0, px: 1 }}>
                        {t('inventory.priceRequestRespond')}
                      </Button>
                    )}
                  </Box>
                  {pr.response?.body && (
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', pl: 0.5,
                      borderLeft: '2px solid', borderColor: 'divider' }}>
                      {pr.response.body}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
          {rows.length > PREVIEW_COUNT && (
            <Button size="small" onClick={() => setExpanded((e) => !e)}
              startIcon={expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
              sx={{ mt: 1, fontSize: '0.7rem', textTransform: 'none', color: 'text.disabled' }}>
              {expanded ? t('inventory.showLess') : t('inventory.showAllCount', { count: rows.length })}
            </Button>
          )}
        </>
      )}

      <Dialog open={Boolean(replyTarget)} onClose={() => setReplyTarget(null)} maxWidth="xs" fullWidth>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('inventory.priceRequestRespond')}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{replyTarget?.email}</Typography>
          <TextField size="small" fullWidth multiline minRows={4} value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={t('inventory.priceRequestReplyPlaceholder')} autoFocus />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button size="small" onClick={() => setReplyTarget(null)}>{t('common.cancel')}</Button>
            <Button size="small" variant="contained" disabled={!replyBody.trim() || replying} onClick={submitReply}
              startIcon={replying ? <CircularProgress size={12} color="inherit" /> : null}>
              {t('inventory.priceRequestSendReply')}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
