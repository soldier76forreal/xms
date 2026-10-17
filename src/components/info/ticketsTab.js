import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MicIcon from '@mui/icons-material/Mic';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { fetchTickets } from './feedbackApi';
import { TICKET_TYPES, TICKET_STATUSES } from './ticketMeta';
import { StatusChip, TypeBadge, formatStamp } from './ticketParts';
import TicketDetail from './ticketDetail';
import TicketForm from './ticketForm';

// Module scope — components declared inside another component remount on every render.

function Pill({ active, onClick, children, T }) {
  return (
    <Box onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: '3px', borderRadius: '8px',
        cursor: 'pointer', userSelect: 'none', flexShrink: 0,
        border: `1px solid ${active ? T.BD2 : T.BD}`, bgcolor: active ? T.CTRL_BG : 'transparent',
        '&:hover': { bgcolor: T.CTRL_BG },
      }}>
      {children}
    </Box>
  );
}

function TicketCard({ ticket, selected, showOwner, language, onSelect, T, t }) {
  return (
    <Box onClick={() => onSelect(ticket._id)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(ticket._id); }}
      sx={{
        p: 1.5, borderRadius: '12px', cursor: 'pointer',
        bgcolor: selected ? T.CTRL_BG : T.CARD_BG,
        border: `1px solid ${selected ? T.BD2 : T.BD}`,
        '&:hover': { borderColor: T.BD2 },
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
        <TypeBadge type={ticket.type} T={T} t={t} withLabel={false} />
        <Typography dir="ltr" sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.TEXT_TER, fontFamily: 'monospace' }}>{ticket.code}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <StatusChip status={ticket.status} T={T} t={t} size="sm" />
      </Box>
      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: T.TEXT_PRI, lineHeight: 1.35, wordBreak: 'break-word' }}>
        {ticket.title}
      </Typography>
      {ticket.excerpt && (
        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, mt: 0.4, lineHeight: 1.45, unicodeBidi: 'plaintext',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {ticket.excerpt}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.9, color: T.TEXT_TER }}>
        <Typography sx={{ fontSize: '0.68rem' }} noWrap>
          {showOwner && ticket.createdByName ? `${ticket.createdByName} · ` : ''}{formatStamp(ticket.insertDate, language, false)}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {ticket.voiceCount > 0 && <MicIcon sx={{ fontSize: 13 }} />}
        {ticket.fileCount > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
            <AttachFileIcon sx={{ fontSize: 13 }} />
            <Typography sx={{ fontSize: '0.66rem' }}>{ticket.fileCount}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function TicketsTab({ T, canView, canCreate, openId, onOpenHandled }) {
  const { t, i18n } = useTranslation();
  const language = (i18n.language || 'en').slice(0, 2);
  const theme = useTheme();
  const isMob = useMediaQuery(theme.breakpoints.down('md'));
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [scope, setScope] = useState('mine');
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  // A notification or link can name a ticket to open.
  useEffect(() => {
    if (openId) { setSelectedId(openId); if (onOpenHandled) onOpenHandled(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  // Several requests can be in flight while someone types; only the newest counts.
  const requestRef = useRef(0);
  const load = useCallback(async (pg, append) => {
    if (!canView) return;
    const mine = ++requestRef.current;
    setLoading(true); setFailed(false);
    try {
      const res = await fetchTickets(authCtx, axiosGlobal, {
        page: pg, limit: 20,
        ...(debounced ? { search: debounced } : {}),
        ...(type !== 'all' ? { type } : {}),
        ...(status !== 'all' ? { status } : {}),
        ...(mineOnly ? { mine: true } : {}),
      });
      if (mine !== requestRef.current) return;
      setItems((prev) => (append ? [...prev, ...res.data] : res.data));
      setTotal(res.total); setPage(res.page); setPages(res.pages);
      setScope(res.scope); setStatusCounts(res.statusCounts || {});
    } catch (_) {
      if (mine === requestRef.current) setFailed(true);
    } finally {
      if (mine === requestRef.current) setLoading(false);
    }
  }, [authCtx, axiosGlobal, canView, debounced, type, status, mineOnly]);

  useEffect(() => { load(1, false); }, [load, reloadTick]);

  const handleCreated = (ticket) => {
    // Back to an unfiltered list with the new one open — a filter could hide it.
    setSearch(''); setDebounced(''); setType('all'); setStatus('all');
    setSelectedId(ticket._id);
    setReloadTick((n) => n + 1);
  };

  // ── a role that can send but not read ────────────────────────────────────
  if (!canView) {
    return (
      <Box sx={{ p: 3, maxWidth: 520 }}>
        <Typography sx={{ fontSize: '0.9rem', color: T.TEXT_SEC, mb: 2 }}>{t('info.createOnlyNote')}</Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}
            sx={{ textTransform: 'none', borderRadius: '10px' }}>{t('info.newReport')}</Button>
        )}
        <TicketForm open={formOpen} onClose={() => setFormOpen(false)} />
      </Box>
    );
  }

  const filtered = Boolean(debounced || type !== 'all' || status !== 'all' || mineOnly);
  const showOwner = scope !== 'mine' && !mineOnly;
  const statusChips = TICKET_STATUSES.filter((s) => statusCounts[s.value] > 0 || status === s.value);
  const allCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const list = (
    <Box sx={{
      width: { xs: '100%', md: 400 }, flexShrink: 0, display: (isMob && selectedId) ? 'none' : 'flex',
      flexDirection: 'column', borderInlineEnd: { md: `1px solid ${T.BD}` }, minWidth: 0, height: '100%',
    }}>
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexGrow: 1, minWidth: 0, px: 1.1, height: 32,
            borderRadius: '9px', bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
            <SearchIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />
            <Box component="input" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('info.searchPlaceholder')} aria-label={t('info.searchPlaceholder')}
              sx={{ flexGrow: 1, minWidth: 0, border: 'none', outline: 'none', bgcolor: 'transparent',
                color: T.TEXT_PRI, fontSize: '0.82rem', fontFamily: 'inherit' }} />
          </Box>
          {canCreate && (
            <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 15 }} />} onClick={() => setFormOpen(true)}
              sx={{ textTransform: 'none', borderRadius: '9px', height: 32, flexShrink: 0, fontSize: '0.74rem' }}>
              {t('info.newReport')}
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', pb: '2px', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          <Pill T={T} active={type === 'all'} onClick={() => setType('all')}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: type === 'all' ? 700 : 500, color: T.TEXT_PRI }}>{t('info.allTypes')}</Typography>
          </Pill>
          {TICKET_TYPES.map((o) => (
            <Pill key={o.value} T={T} active={type === o.value} onClick={() => setType(o.value)}>
              <o.Icon sx={{ fontSize: 13, color: o.color }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: type === o.value ? 700 : 500, color: T.TEXT_PRI }}>{t(o.labelKey)}</Typography>
            </Pill>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', pb: '2px', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          <Pill T={T} active={status === 'all'} onClick={() => setStatus('all')}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: status === 'all' ? 700 : 500, color: T.TEXT_PRI }}>{t('info.allStatuses')}</Typography>
            <Typography sx={{ fontSize: '0.64rem', color: T.TEXT_TER }}>{allCount}</Typography>
          </Pill>
          {statusChips.map((s) => (
            <Pill key={s.value} T={T} active={status === s.value} onClick={() => setStatus(s.value)}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: s.color }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: status === s.value ? 700 : 500, color: T.TEXT_PRI }}>{t(s.labelKey)}</Typography>
              <Typography sx={{ fontSize: '0.64rem', color: T.TEXT_TER }}>{statusCounts[s.value] || 0}</Typography>
            </Pill>
          ))}
        </Box>

        {/* A wider data scope is worth saying out loud: these are other people's words. */}
        {scope !== 'mine' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC, flexGrow: 1 }}>
              {scope === 'all' ? t('info.scopeAll') : t('info.scopeGroup')}
            </Typography>
            <Pill T={T} active={mineOnly} onClick={() => setMineOnly((v) => !v)}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: mineOnly ? 700 : 500, color: T.TEXT_PRI }}>{t('info.onlyMine')}</Typography>
            </Pill>
          </Box>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {loading && items.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={22} sx={{ color: T.TEXT_TER }} /></Box>
        )}
        {failed && <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC, py: 3, textAlign: 'center' }}>{t('info.loadFailed')}</Typography>}

        {!loading && !failed && items.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <ForumOutlinedIcon sx={{ fontSize: 34, color: T.TEXT_TER, mb: 1 }} />
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: T.TEXT_PRI }}>
              {filtered ? t('info.noMatches') : t('info.emptyTitle')}
            </Typography>
            {!filtered && <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC, mt: 0.5 }}>{t('info.emptyHint')}</Typography>}
            {!filtered && canCreate && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}
                sx={{ textTransform: 'none', borderRadius: '10px', mt: 2 }}>{t('info.newReport')}</Button>
            )}
          </Box>
        )}

        {items.map((ticket) => (
          <TicketCard key={ticket._id} ticket={ticket} T={T} t={t} language={language}
            showOwner={showOwner} selected={ticket._id === selectedId} onSelect={setSelectedId} />
        ))}

        {items.length > 0 && page < pages && (
          <Button onClick={() => load(page + 1, true)} disabled={loading}
            sx={{ textTransform: 'none', color: T.TEXT_SEC, fontSize: '0.78rem' }}>
            {loading ? t('common.loading') : t('info.loadMore')}
          </Button>
        )}
        {items.length > 0 && (
          <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textAlign: 'center' }}>
            {t('info.reportsCount', { count: total })}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {list}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: (isMob && !selectedId) ? 'none' : 'block', height: '100%' }}>
        {selectedId
          ? <TicketDetail key={selectedId} ticketId={selectedId} T={T} showBack={isMob} onBack={() => setSelectedId(null)} />
          : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '0.84rem', color: T.TEXT_TER }}>{t('info.selectReport')}</Typography>
            </Box>
          )}
      </Box>
      <TicketForm open={formOpen} onClose={() => setFormOpen(false)} onCreated={handleCreated} />
    </Box>
  );
}
