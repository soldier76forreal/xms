import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ImageIcon from '@mui/icons-material/Image';
import TuneIcon from '@mui/icons-material/Tune';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PaidIcon from '@mui/icons-material/Paid';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import { useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// ── Theme tokens ──────────────────────────────────────────────────────────────
const useT = () => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    CARD_BG:  isDark ? '#111111'                 : theme.palette.background.paper,
    CARD_BD:  isDark ? 'rgba(255,255,255,0.07)'  : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff'                 : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)'  : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'   : 'rgba(0,0,0,0.3)',
    LINE_CLR: isDark ? 'rgba(255,255,255,0.07)'  : theme.palette.divider,
    BTN_BG:   isDark ? '#ffffff'                 : '#000000',
    BTN_CLR:  isDark ? '#000000'                 : '#ffffff',
    isDark,
  };
};

// ── Section pills ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'all',       label: 'All' },
  { id: 'crm',       label: 'CRM' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'mis',       label: 'Invoices' },
];

const Pill = ({ active, onClick, children, T }) => (
  <Button size="small" onClick={onClick}
    sx={{
      fontSize: '0.75rem', fontWeight: active ? 600 : 400, textTransform: 'none',
      borderRadius: '20px', px: 1.5, py: '3px', minWidth: 0,
      color: active ? T.TEXT_PRI : T.TEXT_SEC,
      bgcolor: active ? (T.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)') : 'transparent',
      border: active ? `1px solid ${T.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}` : '1px solid transparent',
      '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)', color: T.TEXT_PRI },
    }}>
    {children}
  </Button>
);

// ── Change type config (shared across inventory/crm/mis — same visual language) ─
const CHANGE_TYPE = {
  // inventory
  quantity:          { icon: SwapVertIcon,             color: '#64B5F6', label: 'Quantity'   },
  price:             { icon: AttachMoneyIcon,          color: '#FFB74D', label: 'Price'      },
  media:             { icon: ImageIcon,                color: '#BA68C8', label: 'Media'      },
  spec:              { icon: TuneIcon,                 color: '#90CAF9', label: 'Spec'       },
  // shared
  created:           { icon: AddCircleOutlineIcon,     color: '#81C784', label: 'Created'    },
  status:            { icon: ToggleOffIcon,            color: '#F06292', label: 'Status'     },
  updated:           { icon: EditNoteIcon,             color: '#90A4AE', label: 'Updated'    },
  deleted:           { icon: DeleteOutlineIcon,         color: '#E57373', label: 'Deleted'    },
  // crm
  call_logged:       { icon: PhoneInTalkIcon,          color: '#4FC3F7', label: 'Call'       },
  note:              { icon: EditNoteIcon,             color: '#90A4AE', label: 'Note'       },
  assigned:          { icon: AssignmentIndOutlinedIcon,color: '#BA68C8', label: 'Assigned'   },
  status_changed:    { icon: ToggleOffIcon,            color: '#F06292', label: 'Status'     },
  interest:          { icon: FavoriteBorderIcon,       color: '#F48FB1', label: 'Interest'   },
  follow_up_set:     { icon: EventAvailableIcon,       color: '#4DB6AC', label: 'Follow-up'  },
  // mis
  converted:         { icon: SwapHorizIcon,            color: '#BA68C8', label: 'Converted'  },
  pdf_generated:     { icon: PictureAsPdfIcon,         color: '#90A4AE', label: 'PDF'        },
  payment:           { icon: PaidIcon,                 color: '#81C784', label: 'Payment'    },
  stock_decremented: { icon: Inventory2Icon,           color: '#64B5F6', label: 'Stock'      },
};

const SECTION_ICON = {
  inventory: InventoryIcon,
  crm:       PeopleAltOutlinedIcon,
  mis:       ReceiptLongOutlinedIcon,
};

// ── Date formatting ───────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const relTime = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m  = Math.floor(diff / 60000);
  const h  = Math.floor(diff / 3600000);
  const dy = Math.floor(diff / 86400000);
  if (m  < 1)  return 'Just now';
  if (m  < 60) return `${m}m ago`;
  if (h  < 24) return `${h}h ago`;
  if (dy < 7)  return `${dy}d ago`;
  return formatDate(d);
};

// ── Single log entry ──────────────────────────────────────────────────────────
const LogEntry = ({ entry, isLast, T }) => {
  const ct       = CHANGE_TYPE[entry.changeType] || CHANGE_TYPE.spec;
  const Icon     = ct.icon;
  const SectIcon = SECTION_ICON[entry.section] || InventoryIcon;

  // Build description line
  let description = '';
  if (entry.changeType === 'quantity') {
    const sign   = entry.delta > 0 ? '+' : '';
    description  = `${sign}${entry.delta} ${entry.unit || ''}`;
    if (entry.reason) description += ` — ${entry.reason}`;
  } else if (entry.changeType === 'price') {
    description = `${entry.oldValue} → ${entry.newValue} ${entry.currency || 'AED'}`;
  } else if (entry.changeType === 'media') {
    const action = entry.mediaRef?.action || '';
    const name   = entry.mediaRef?.name   || 'file';
    description  = `${action === 'added' ? 'Added' : 'Removed'} "${name}"`;
  } else if (entry.changeType === 'created') {
    if (entry.section === 'crm') description = 'New customer created';
    else if (entry.section === 'mis') description = `New ${entry.docType === 'invoice' ? 'invoice' : 'quote'} created`;
    else description = entry.subjectType === 'product' ? 'New product created' : 'New variant added';
  } else if (entry.changeType === 'spec') {
    description = entry.field ? `${entry.field}: ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}` : 'Spec updated';
  } else if (entry.changeType === 'status' || entry.changeType === 'status_changed') {
    description = `Status: ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`;
  } else if (entry.changeType === 'updated') {
    description = 'Details updated';
  } else if (entry.changeType === 'deleted') {
    description = 'Deleted';
  } else if (entry.changeType === 'call_logged' || entry.changeType === 'note') {
    description = entry.body || (entry.changeType === 'call_logged' ? 'Call logged' : 'Note added');
  } else if (entry.changeType === 'assigned') {
    description = entry.body || 'Assigned';
  } else if (entry.changeType === 'interest') {
    description = entry.body || 'Interested product added';
  } else if (entry.changeType === 'follow_up_set') {
    description = entry.newValue ? `Follow-up set for ${formatDate(entry.newValue)}` : 'Follow-up set';
  } else if (entry.changeType === 'converted') {
    description = 'Converted to invoice';
  } else if (entry.changeType === 'pdf_generated') {
    description = 'PDF generated';
  } else if (entry.changeType === 'payment') {
    description = entry.body || 'Payment recorded';
  } else if (entry.changeType === 'stock_decremented') {
    description = entry.body || 'Inventory stock decremented';
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
      {/* Timeline line */}
      {!isLast && (
        <Box sx={{
          position: 'absolute', left: 15, top: 32, bottom: -8,
          width: '1px', bgcolor: T.LINE_CLR,
        }} />
      )}

      {/* Dot / icon */}
      <Box sx={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        bgcolor: T.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        mt: '2px',
      }}>
        <Icon sx={{ fontSize: 15, color: ct.color }} />
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, pb: 2.5, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.4 }}>
          {/* Section badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <SectIcon sx={{ fontSize: 11, color: T.TEXT_TER }} />
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {entry.section}
            </Typography>
          </Box>

          {/* Type chip */}
          <Chip label={ct.label} size="small" sx={{
            height: 18, fontSize: '0.63rem', fontWeight: 600, borderRadius: '4px',
            bgcolor: `${ct.color}18`, color: ct.color, border: `1px solid ${ct.color}35`,
            '& .MuiChip-label': { px: 0.75 },
          }} />

          {/* Product / doc reference */}
          {entry.productCode && (
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC, fontFamily: 'monospace' }}>
              {entry.productCode}
            </Typography>
          )}
          {entry.docNumber && (
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC, fontFamily: 'monospace' }}>
              {entry.docType === 'invoice' ? 'INV' : 'QT'} #{entry.docNumber}
            </Typography>
          )}
          {entry.productName && (
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>
              {entry.productName}
            </Typography>
          )}
        </Box>

        {/* Description */}
        {description && (
          <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_PRI, lineHeight: 1.5 }}>
            {description}
          </Typography>
        )}

        {/* Timestamp */}
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mt: 0.4 }}>
          {relTime(entry.date)}
        </Typography>
      </Box>
    </Box>
  );
};

// ── Main UserLogs component ───────────────────────────────────────────────────
const UserLogs = ({ userId }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const T           = useT();

  const [section,  setSection]  = useState('all');
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(false);
  const [total,    setTotal]    = useState(0);

  const LIMIT = 30;

  const fetchLogs = useCallback(async (pg = 1, append = false) => {
    if (append) setLoadingMore(true);
    else        setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url:    `${axiosGlobal.defaultTargetApi}/users/${userId}/logs`,
        params: { section, page: pg, limit: LIMIT },
      });
      const data = res.data.data || [];
      setEntries(prev => append ? [...prev, ...data] : data);
      setTotal(res.data.total || 0);
      setHasMore(pg * LIMIT < (res.data.total || 0));
      setPage(pg);
    } catch {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load logs', type: 'error' }));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, section]);

  useEffect(() => {
    setEntries([]);
    setPage(1);
    fetchLogs(1, false);
  }, [fetchLogs]);

  const loadMore = () => fetchLogs(page + 1, true);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <HistoryIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, flexGrow: 1 }}>
          Activity Log
        </Typography>
        {total > 0 && (
          <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
            {total} entries
          </Typography>
        )}
      </Box>

      {/* Section filter */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 2.5 }}>
        {SECTIONS.map(s => (
          <Pill key={s.id} active={section === s.id} onClick={() => setSection(s.id)} T={T}>
            {s.label}
          </Pill>
        ))}
      </Box>

      {/* Entries */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={22} sx={{ color: T.TEXT_TER }} />
        </Box>
      ) : entries.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1, opacity: 0.4 }}>
          <HistoryIcon sx={{ fontSize: 32, color: T.TEXT_TER }} />
          <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_TER }}>No activity yet</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ pl: 0.5 }}>
            {entries.map((entry, i) => (
              <LogEntry key={entry._id} entry={entry} isLast={i === entries.length - 1} T={T} />
            ))}
          </Box>

          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Button size="small" onClick={loadMore} disabled={loadingMore}
                startIcon={loadingMore ? <CircularProgress size={13} color="inherit" /> : null}
                sx={{
                  fontSize: '0.78rem', textTransform: 'none', color: T.TEXT_SEC, borderRadius: '8px',
                  border: `1px solid ${T.CARD_BD}`, px: 2.5, py: '5px',
                  '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: T.TEXT_PRI },
                }}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default UserLogs;
