import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReplyIcon from '@mui/icons-material/Reply';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';
import { copyText } from '../../tools/clipboard';
import WebsiteOfferPanel, { OFFER_STATE_COLOR, OFFER_STATE_KEY } from './websiteOfferPanel';

const statuses = ['new', 'seen', 'responded', 'closed'];
const statusKey = (status) => 'crm.priceRequestStatus' + status[0].toUpperCase() + status.slice(1);

export default function WebsiteRequestsSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const authCtx = useContext(AuthContext);
  const jwtInst = authCtx.jwtInst;
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();
  const { activeBranchId, activeBranch } = useBranch();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const canRespond = can('mis:preinvoice:edit') || can('crm:communication:create') || can('inventory:website:manage');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!activeBranchId) return;
    let ignored = false;
    setLoading(true);
    setError('');
    jwtInst({
      method: 'get',
      url: axiosGlobal.defaultTargetApi + '/price-requests/branch',
      params: { branchId: activeBranchId, page, limit: 30, status, search: debouncedSearch },
    }).then((res) => {
      if (ignored) return;
      const data = res.data.data || [];
      setRows((old) => page === 1 ? data : [...old, ...data]);
      setTotal(res.data.total || 0);
      setSelected((old) => old ? data.find((row) => row._id === old._id) || old : null);
    }).catch((err) => {
      if (!ignored) setError(err?.response?.data?.message || t('mis.websiteRequestsLoadFailed'));
    }).finally(() => {
      if (!ignored) setLoading(false);
    });
    return () => { ignored = true; };
  }, [activeBranchId, page, status, debouncedSearch, jwtInst, axiosGlobal.defaultTargetApi, t]);

  const changeFilter = (kind, value) => {
    setSelected(null);
    setRows([]);
    setPage(1);
    if (kind === 'search') setSearch(value);
    else setStatus(value);
  };

  // Opening a request that nobody has looked at yet marks it seen.
  const openRequest = (request) => {
    setSelected(request);
    setReplyBody('');
    setReplyMessage('');
    setShowReply(false);
    setAddressCopied(false);
    if ((request.status || 'new') !== 'new') return;
    const markSeen = (row) => (row._id === request._id ? { ...row, status: 'seen' } : row);
    jwtInst({ method: 'put', url: axiosGlobal.defaultTargetApi + '/price-requests/' + request._id + '/seen' })
      .then(() => {
        setRows((old) => old.map(markSeen));
        setSelected((old) => (old ? markSeen(old) : old));
      })
      .catch(() => { /* marking a request seen is a courtesy, never an error */ });
  };

  // The offer panel sent / withdrew / saw an offer run out: keep the list in step.
  const handleOfferChanged = (offer) => {
    const id = selected && selected._id;
    if (!id) return;
    const patch = (row) => (row._id !== id ? row : {
      ...row, offer, status: offer && row.status !== 'closed' ? 'responded' : row.status,
    });
    setRows((old) => old.map(patch));
    setSelected((old) => (old ? patch(old) : old));
  };

  const copyAddress = async (text) => {
    if (await copyText(text)) {
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 1800);
    }
  };

  const submitReply = async () => {
    if (!selected || !replyBody.trim()) return;
    setReplying(true);
    setReplyMessage('');
    try {
      const res = await jwtInst({
        method: 'put',
        url: axiosGlobal.defaultTargetApi + '/price-requests/' + selected._id + '/respond',
        data: { body: replyBody.trim() },
      });
      const updated = res.data.data;
      setRows((old) => old.map((row) => row._id === updated._id ? updated : row));
      setSelected(updated);
      setReplyBody('');
      setReplyMessage(res.data.mailWarning || t('mis.websiteReplySent'));
    } catch (err) {
      setReplyMessage(err?.response?.data?.message || t('mis.websiteReplyFailed'));
    } finally {
      setReplying(false);
    }
  };

  const border = theme.palette.divider;
  const muted = theme.palette.text.secondary;
  const address = selected?.receivingAddress;
  const addressText = [address?.address, address?.city, address?.country, address?.postalCode].filter(Boolean).join(', ');
  let mapUrl = null;
  try {
    const parsed = new URL(address?.mapLink);
    if (['http:', 'https:'].includes(parsed.protocol)) mapUrl = parsed.href;
  } catch (_) { /* No valid map link. */ }

  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0, bgcolor: 'background.paper' }}>
      {(!isMobile || !selected) && (
        <Box sx={{ width: isMobile ? '100%' : selected ? 390 : '100%', flexShrink: 0,
          borderRight: selected && !isMobile ? '1px solid ' + border : 'none',
          display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid ' + border, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t('mis.websiteRequestsForBranch', { branch: activeBranch?.name || '' })}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" value={search} onChange={(e) => changeFilter('search', e.target.value)}
                placeholder={t('mis.websiteRequestSearch')} fullWidth />
              <Select size="small" value={status} onChange={(e) => changeFilter('status', e.target.value)}
                displayEmpty sx={{ minWidth: 115, fontSize: '0.8rem' }}
                inputProps={{ 'aria-label': t('common.status') }}>
                <MenuItem value={''}>{t('common.all')}</MenuItem>
                {statuses.map((item) => <MenuItem key={item} value={item}>{t(statusKey(item))}</MenuItem>)}
              </Select>
            </Box>
            <Typography variant="caption" sx={{ color: muted }}>
              {t('mis.websiteRequestsCount', { count: total })}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {error && <Typography sx={{ color: 'error.main', p: 2, fontSize: '0.8rem' }}>{error}</Typography>}
            {!loading && !error && rows.length === 0 && (
              <Typography sx={{ color: muted, p: 3, textAlign: 'center' }}>{t('mis.noWebsiteRequests')}</Typography>
            )}
            {rows.map((request) => (
              <Box key={request._id} role="button" tabIndex={0}
                onClick={() => openRequest(request)}
                onKeyDown={(e) => { if (e.key === 'Enter') openRequest(request); }}
                sx={{ px: 2, py: 1.5, cursor: 'pointer', borderBottom: '1px solid ' + border,
                  bgcolor: selected?._id === request._id ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'baseline' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }} noWrap>{request.name}</Typography>
                  <Typography variant="caption" sx={{ color: muted, flexShrink: 0 }}>
                    {new Date(request.insertDate).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: muted, display: 'block' }} noWrap>{request.email}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    {t(statusKey(request.status || 'new'))}
                  </Typography>
                  <Typography variant="caption" sx={{ color: muted }}>
                    {t('mis.websiteItemsCount', { count: request.items?.length || 0 })}
                  </Typography>
                  {request.offer && (
                    <Typography variant="caption" sx={{ color: OFFER_STATE_COLOR[request.offer.state], fontWeight: 700 }}>
                      {t('mis.offerNumber', { number: request.offer.docNumber })} · {t(OFFER_STATE_KEY[request.offer.state])}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
            {loading && <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>}
            {!loading && rows.length < total && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button size="small" onClick={() => setPage((old) => old + 1)}>{t('mis.websiteLoadMore')}</Button>
              </Box>
            )}
          </Box>
        </Box>
      )}
      {selected && (
        <Box sx={{ flex: 1, minWidth: 0, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
          {isMobile && (
            <IconButton onClick={() => setSelected(null)} aria-label={t('mis.websiteBack')} sx={{ mb: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{selected.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {new Date(selected.insertDate).toLocaleString()} - {t(statusKey(selected.status || 'new'))}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mt: 2 }}>
            <Typography variant="body2"><b>{t('mis.websiteEmail')}:</b> {selected.email}</Typography>
            <Typography variant="body2"><b>{t('mis.websitePhone')}:</b> {selected.phone || '-'}</Typography>
          </Box>

          {/* Where the load goes decides the price, so it is a block of its own. */}
          <Box sx={{ mt: 2, p: 1.5, maxWidth: 760, display: 'flex', gap: 1, alignItems: 'flex-start',
            border: '1px solid ' + border, borderLeft: '4px solid ' + theme.palette.primary.main, borderRadius: '10px' }}>
            <LocationOnIcon sx={{ color: 'primary.main', mt: '2px' }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" sx={{ color: muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('crm.receivingLoadAddress')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                {addressText || t('mis.offerAddressMissing')}
              </Typography>
              {mapUrl && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer">{t('mis.websiteMapLink')}</a>
                </Typography>
              )}
            </Box>
            {addressText && (
              <IconButton size="small" onClick={() => copyAddress(addressText)} aria-label={t('mis.offerCopyAddress')}
                title={addressCopied ? t('mis.offerAddressCopied') : t('mis.offerCopyAddress')}>
                <ContentCopyIcon fontSize="small" color={addressCopied ? 'success' : 'inherit'} />
              </IconButton>
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 700 }}>
            {t('mis.websiteItemsCount', { count: selected.items?.length || 0 })}
          </Typography>
          {(selected.items || []).map((item, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2,
              py: 1, borderBottom: '1px solid ' + border }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.productName}</Typography>
                <Typography variant="caption" sx={{ color: muted }}>{item.variantCode}</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                {item.quantity} {item.unit}
              </Typography>
            </Box>
          ))}
          {selected.response?.body && !selected.offer && (
            <Box sx={{ mt: 3, borderLeft: '3px solid ' + theme.palette.primary.main, pl: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('mis.websiteReply')}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.response.body}</Typography>
            </Box>
          )}

          {/* The answer: prices, how long they hold, and where the offer stands. */}
          <WebsiteOfferPanel key={selected._id} requestId={selected._id} onOfferChanged={handleOfferChanged} />

          {canRespond && (
            <Box sx={{ mt: 3, maxWidth: 680 }}>
              <Button size="small" onClick={() => setShowReply((open) => !open)} sx={{ textTransform: 'none' }}>
                {t('mis.offerPlainMessage')}
              </Button>
              <Collapse in={showReply} unmountOnExit>
                <Box sx={{ mt: 1 }}>
                  <TextField size="small" multiline minRows={4} fullWidth value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    label={t('crm.priceRequestReplyPlaceholder')} />
                  <Button variant="contained" size="small" startIcon={<ReplyIcon />} sx={{ mt: 1.5 }}
                    disabled={!replyBody.trim() || replying} onClick={submitReply}>
                    {replying ? <CircularProgress size={16} color="inherit" /> : t('crm.priceRequestSendReply')}
                  </Button>
                  {replyMessage && <Typography variant="body2" sx={{ mt: 1, color: muted }}>{replyMessage}</Typography>}
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
