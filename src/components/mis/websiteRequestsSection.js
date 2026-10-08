import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import ReplyIcon from '@mui/icons-material/Reply';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { useBranch } from '../../contextApi/BranchContext';
import { copyText } from '../../tools/clipboard';
import { useSidebarWidth } from '../../tools/hooks/useSidebarWidth';
import SidebarResizer from '../../tools/navs/sidebarResizer';
import WebsiteOfferPanel, { OFFER_STATE_COLOR, OFFER_STATE_KEY } from './websiteOfferPanel';

// A customer's website request is its own resource (priceRequest), not a document in the
// invoices collection like an inter-branch request - but the two are read side by side in
// MIS, so this list wears the same clothes as the invoice list: the same card, the same
// count row, the same resizable master-detail, and filters that live in the section's top
// bar (mis.js owns `search` and `status` and passes them down).
export const PRICE_REQUEST_STATUSES = ['new', 'seen', 'responded', 'closed'];
export const priceRequestStatusKey = (status) =>
  'crm.priceRequestStatus' + status[0].toUpperCase() + status.slice(1);

const STATUS_COLOR = {
  new: '#f06292',
  seen: '#64b5f6',
  responded: '#81c784',
  closed: '#9e9e9e',
};

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

export default function WebsiteRequestsSection({ search = '', status = '' }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const authCtx = useContext(AuthContext);
  const jwtInst = authCtx.jwtInst;
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();
  const { activeBranchId } = useBranch();

  // Same tokens as mis.js / invoiceCard.js, so the two request lists are one family.
  const T = {
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD: isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
    CARD_BG: isDark ? '#181818' : theme.palette.background.paper,
    SEL_BG: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    CTRL_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const canRespond = can('mis:preinvoice:edit') || can('crm:communication:create') || can('inventory:website:manage');

  // the same resizable list width the invoice list uses, under the same key, so switching
  // between the two request kinds doesn't move the divider
  const { width: listWidth, setWidth: setListWidth, resetWidth: resetListWidth } =
    useSidebarWidth('misList', 400, { min: 260, max: 720 });
  const [listResizing, setListResizing] = useState(false);
  useEffect(() => {
    if (!listResizing) return undefined;
    const stop = () => setListResizing(false);
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, [listResizing]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // a new filter starts a new list
  useEffect(() => { setSelected(null); setRows([]); setPage(1); }, [debouncedSearch, status]);

  useEffect(() => {
    if (!activeBranchId) return undefined;
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

  const address = selected?.receivingAddress;
  const addressText = [address?.address, address?.city, address?.country, address?.postalCode].filter(Boolean).join(', ');
  const mapUrl = useMemo(() => {
    try {
      const parsed = new URL(address?.mapLink);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
    } catch (_) { return null; }
  }, [address]);

  const filtering = Boolean(debouncedSearch || status);

  return (
    <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

      {/* ── List panel ── */}
      {(!isMobile || !selected) && (
        <Box sx={{
          width: isMobile ? '100%' : (selected ? listWidth : '100%'),
          flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: (!isMobile && selected) ? `1px solid ${T.BD}` : 'none',
          bgcolor: T.PANEL_BG,
          overflow: 'hidden',
          position: 'relative',
          transition: listResizing ? 'none' : 'width 0.2s',
        }}>

          {!isMobile && selected && (
            <SidebarResizer width={listWidth} side="right"
              onResize={(w) => { setListResizing(true); setListWidth(w); }}
              onDoubleClick={resetListWidth} />
          )}

          {/* List header row — the invoice list's, counting requests */}
          <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
            borderBottom: `1px solid ${T.BD}` }}>
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
              {t('mis.websiteRequestsCount', { count: total })}
            </Typography>
            {loading && <CircularProgress size={12} sx={{ color: T.TEXT_TER }} />}
          </Box>

          {/* Cards */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 0.75 }}>
            {error && (
              <Typography sx={{ color: '#EA005A', px: 2, py: 1.5, fontSize: '0.78rem' }}>{error}</Typography>
            )}

            {!loading && !error && rows.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', py: 8, px: 3, textAlign: 'center' }}>
                <ContactPageOutlinedIcon sx={{ fontSize: 48, color: T.TEXT_TER, mb: 1.5 }} />
                <Typography sx={{ fontSize: '0.875rem', color: T.TEXT_SEC, fontWeight: 600 }}>
                  {filtering ? t('mis.noDocumentsMatchFilters') : t('mis.noWebsiteRequests')}
                </Typography>
              </Box>
            )}

            {rows.map((request) => {
              const isSelected = selected?._id === request._id;
              const state = request.status || 'new';
              const color = STATUS_COLOR[state] || STATUS_COLOR.new;
              return (
                <Box key={request._id} role="button" tabIndex={0}
                  onClick={() => openRequest(request)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openRequest(request); }}
                  sx={{
                    mx: 1, mb: 0.75, px: 1.5, py: 1.25, borderRadius: '12px', cursor: 'pointer',
                    border: `1px solid ${isSelected ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)') : T.BD}`,
                    bgcolor: isSelected ? T.SEL_BG : T.CARD_BG,
                    transition: 'border-color 0.15s, background-color 0.15s',
                    '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)' },
                  }}>

                  {/* row 1 — who asked, what state it is in */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <PersonOutlineIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.TEXT_PRI, minWidth: 0 }} noWrap>
                      {request.name}
                    </Typography>
                    <Box sx={{ px: 0.75, py: '1px', borderRadius: '5px', bgcolor: `${color}22`, flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color }}>
                        {t(priceRequestStatusKey(state))}
                      </Typography>
                    </Box>
                    {request.offer && (
                      <Box sx={{ px: 0.75, py: '1px', borderRadius: '5px',
                        bgcolor: `${OFFER_STATE_COLOR[request.offer.state]}22`, flexShrink: 0 }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: OFFER_STATE_COLOR[request.offer.state] }}>
                          {t('mis.offerNumber', { number: request.offer.docNumber })} · {t(OFFER_STATE_KEY[request.offer.state])}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, flexShrink: 0 }}>
                      {fmtDate(request.insertDate)}
                    </Typography>
                  </Box>

                  {/* row 2 — how to reach them, and how much they asked for */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, minWidth: 0 }} noWrap>
                      {request.email}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, flexShrink: 0 }}>
                      {t('mis.websiteItemsCount', { count: request.items?.length || 0 })}
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            {loading && rows.length === 0 && (
              <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} sx={{ color: T.TEXT_TER }} /></Box>
            )}
            {!loading && rows.length < total && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button size="small" onClick={() => setPage((old) => old + 1)}
                  sx={{ fontSize: '0.75rem', textTransform: 'none', color: T.TEXT_SEC }}>
                  {t('mis.websiteLoadMore')}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* ── Detail panel ── */}
      {selected && (
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
          bgcolor: T.PANEL_BG, overflow: 'hidden' }}>

          {/* header, like the invoice detail's */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 2, md: 3 }, py: 1.5,
            borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
            {isMobile && (
              <IconButton size="small" onClick={() => setSelected(null)} aria-label={t('mis.websiteBack')}
                sx={{ color: T.TEXT_TER }}>
                <ArrowBackIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: T.TEXT_PRI }} noWrap>
                {selected.name}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }} noWrap>
                {new Date(selected.insertDate).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ px: 0.75, py: '2px', borderRadius: '5px', flexShrink: 0,
              bgcolor: `${STATUS_COLOR[selected.status || 'new'] || STATUS_COLOR.new}22` }}>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 700,
                color: STATUS_COLOR[selected.status || 'new'] || STATUS_COLOR.new }}>
                {t(priceRequestStatusKey(selected.status || 'new'))}
              </Typography>
            </Box>
            {/* the invoice detail closes from its header; this one does too */}
            {!isMobile && (
              <IconButton size="small" onClick={() => setSelected(null)} aria-label={t('common.close')}
                sx={{ color: T.TEXT_TER, flexShrink: 0 }}>
                <CloseIcon sx={{ fontSize: 17 }} />
              </IconButton>
            )}
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: { xs: 2, md: 3 }, py: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
              <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC }}>
                <b style={{ color: T.TEXT_PRI }}>{t('mis.websiteEmail')}:</b> {selected.email}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC }}>
                <b style={{ color: T.TEXT_PRI }}>{t('mis.websitePhone')}:</b> {selected.phone || '—'}
              </Typography>
            </Box>

            {/* Where the load goes decides the price, so it is a block of its own. */}
            <Box sx={{ mt: 2, p: 1.5, maxWidth: 760, display: 'flex', gap: 1, alignItems: 'flex-start',
              border: `1px solid ${T.BD}`, borderLeft: '3px solid #64b5f6', borderRadius: '12px',
              bgcolor: T.CTRL_BG }}>
              <LocationOnIcon sx={{ color: '#64b5f6', fontSize: 18, mt: '2px' }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: 0.5,
                  textTransform: 'uppercase', color: T.TEXT_TER }}>
                  {t('crm.receivingLoadAddress')}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.TEXT_PRI, wordBreak: 'break-word' }}>
                  {addressText || t('mis.offerAddressMissing')}
                </Typography>
                {mapUrl && (
                  <Typography sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#64b5f6' }}>
                      {t('mis.websiteMapLink')}
                    </a>
                  </Typography>
                )}
              </Box>
              {addressText && (
                <IconButton size="small" onClick={() => copyAddress(addressText)} aria-label={t('mis.offerCopyAddress')}
                  title={addressCopied ? t('mis.offerAddressCopied') : t('mis.offerCopyAddress')}
                  sx={{ color: addressCopied ? '#81c784' : T.TEXT_TER }}>
                  <ContentCopyIcon sx={{ fontSize: 15 }} />
                </IconButton>
              )}
            </Box>

            <Typography sx={{ mt: 3, mb: 1, fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', color: T.TEXT_TER }}>
              {t('mis.websiteItemsCount', { count: selected.items?.length || 0 })}
            </Typography>
            {(selected.items || []).map((item, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2,
                py: 1, borderBottom: `1px solid ${T.BD}` }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: T.TEXT_PRI }} noWrap>
                    {item.productName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: T.TEXT_SEC }} noWrap>
                    {item.variantCode}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, whiteSpace: 'nowrap' }}>
                  {item.quantity} {item.unit}
                </Typography>
              </Box>
            ))}

            {selected.response?.body && !selected.offer && (
              <Box sx={{ mt: 3, borderLeft: '3px solid #64b5f6', pl: 2 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
                  textTransform: 'uppercase', color: T.TEXT_TER, mb: 0.5 }}>
                  {t('mis.websiteReply')}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC, whiteSpace: 'pre-wrap' }}>
                  {selected.response.body}
                </Typography>
              </Box>
            )}

            {/* The answer: prices, how long they hold, and where the offer stands. */}
            <WebsiteOfferPanel key={selected._id} requestId={selected._id} onOfferChanged={handleOfferChanged} />

            {canRespond && (
              <Box sx={{ mt: 3, maxWidth: 680 }}>
                <Button size="small" onClick={() => setShowReply((open) => !open)}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', color: T.TEXT_SEC }}>
                  {t('mis.offerPlainMessage')}
                </Button>
                <Collapse in={showReply} unmountOnExit>
                  <Box sx={{ mt: 1 }}>
                    <TextField size="small" multiline minRows={4} fullWidth value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      label={t('crm.priceRequestReplyPlaceholder')} InputLabelProps={{ shrink: true }} />
                    <Button variant="contained" size="small" startIcon={<ReplyIcon sx={{ fontSize: 15 }} />} sx={{ mt: 1.5, textTransform: 'none' }}
                      disabled={!replyBody.trim() || replying} onClick={submitReply}>
                      {replying ? <CircularProgress size={16} color="inherit" /> : t('crm.priceRequestSendReply')}
                    </Button>
                    {replyMessage && (
                      <Typography sx={{ mt: 1, fontSize: '0.78rem', color: T.TEXT_SEC }}>{replyMessage}</Typography>
                    )}
                  </Box>
                </Collapse>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
