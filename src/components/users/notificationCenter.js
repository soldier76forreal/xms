import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

const useT = () => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    DRAWER_BG: isDark ? '#0d0d0d'               : theme.palette.background.paper,
    CARD_BD:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    ROW_HVR:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    UNREAD_BG: isDark ? 'rgba(255,255,255,0.025)': 'rgba(0,0,0,0.03)',
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    HVR_BG:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    PILL_BG:   isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.07)',
    PILL_BD:   isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    SCROLL_TH: isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.15)',
    BADGE_BG:  isDark ? '#0d0d0d'               : '#ffffff',
    isDark,
  };
};

// ── Filters ────────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',    label: 'All'    },
  { id: 'unread', label: 'Unread' },
  { id: 'tasks',  label: 'Tasks'  },
];

// ── Icon by notification type ──────────────────────────────────────────────────
const typeIcon = (type, textSec) => {
  const sx = { fontSize: 16 };
  switch (type) {
    case 'task':        return <AssignmentIcon sx={{ ...sx, color: '#64B5F6' }} />;
    case 'taskClaimed': return <AssignmentIcon sx={{ ...sx, color: '#FFB74D' }} />;
    case 'taskDone':    return <CheckCircleOutlineIcon sx={{ ...sx, color: '#4CAF50' }} />;
    case 'unlock':      return <LockOpenIcon sx={{ ...sx, color: '#FF4D8D' }} />;
    default:            return <InfoOutlinedIcon sx={{ ...sx, color: textSec }} />;
  }
};

// ── Relative time ──────────────────────────────────────────────────────────────
const relativeTime = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m  = Math.floor(diff / 60000);
  const h  = Math.floor(diff / 3600000);
  const dy = Math.floor(diff / 86400000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  if (dy < 7)  return `${dy}d ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// ── Single notification row ────────────────────────────────────────────────────
const NotifRow = ({ notif, onMarkRead }) => {
  const T = useT();
  return (
    <Box
      onClick={() => !notif.isRead && onMarkRead(notif._id)}
      sx={{
        display: 'flex', gap: 1.5, px: 2, py: 1.5, cursor: notif.isRead ? 'default' : 'pointer',
        bgcolor: notif.isRead ? 'transparent' : T.UNREAD_BG,
        borderBottom: `1px solid ${T.DIVIDER}`,
        '&:hover': { bgcolor: T.ROW_HVR },
        transition: 'background 0.12s',
      }}
    >
      <Box sx={{ mt: 0.25, flexShrink: 0 }}>{typeIcon(notif.type, T.TEXT_SEC)}</Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: notif.isRead ? 400 : 600, color: T.TEXT_PRI, lineHeight: 1.4 }}>
          {notif.title}
        </Typography>
        {notif.body && (
          <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC, mt: 0.2, lineHeight: 1.4 }} noWrap>
            {notif.body}
          </Typography>
        )}
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mt: 0.4 }}>
          {relativeTime(notif.insertDate)}
        </Typography>
      </Box>

      {!notif.isRead && (
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#64B5F6', mt: 0.6, flexShrink: 0 }} />
      )}
    </Box>
  );
};

// ── Filter pill ────────────────────────────────────────────────────────────────
const FilterPill = ({ active, onClick, children }) => {
  const T = useT();
  return (
    <Button size="small" onClick={onClick}
      sx={{
        fontSize: '0.75rem', fontWeight: active ? 600 : 400, textTransform: 'none',
        borderRadius: '20px', px: 1.5, py: '3px', minWidth: 0,
        color: active ? T.TEXT_PRI : T.TEXT_SEC,
        bgcolor: active ? T.PILL_BG : 'transparent',
        border: active ? `1px solid ${T.PILL_BD}` : '1px solid transparent',
        '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', color: T.TEXT_PRI },
      }}
    >
      {children}
    </Button>
  );
};

// ── Main notification center (Drawer) ──────────────────────────────────────────
const NotificationCenter = ({ open, onClose, onUnreadCountChange }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const T           = useT();

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [filter,        setFilter]        = useState('all');
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [markingAll,    setMarkingAll]    = useState(false);

  const fetchNotifs = useCallback(async (f = filter) => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/notifications`,
        params: { filter: f, limit: 40 },
      });
      setNotifications(res.data.data || []);
      const uc = res.data.unreadCount || 0;
      setUnreadCount(uc);
      if (onUnreadCountChange) onUnreadCountChange(uc);
    } catch {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load notifications', type: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { if (open) fetchNotifs(); }, [open]);
  useEffect(() => { if (open) fetchNotifs(filter); }, [filter]);

  useEffect(() => {
    const socket = authCtx.socket;
    if (!socket) return;
    const handler = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => {
        const nc = prev + 1;
        if (onUnreadCountChange) onUnreadCountChange(nc);
        return nc;
      });
    };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [authCtx.socket]);

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => String(n._id) === String(id) ? { ...n, isRead: true } : n));
    setUnreadCount(prev => {
      const nc = Math.max(0, prev - 1);
      if (onUnreadCountChange) onUnreadCountChange(nc);
      return nc;
    });
    try {
      await authCtx.jwtInst({ method: 'put', url: `${axiosGlobal.defaultTargetApi}/notifications/${id}/read` });
    } catch {}
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await authCtx.jwtInst({ method: 'put', url: `${axiosGlobal.defaultTargetApi}/notifications/read-all` });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to mark all read', type: 'error' }));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 380 },
          bgcolor: T.DRAWER_BG,
          backgroundImage: 'none',
          borderLeft: `1px solid ${T.CARD_BD}`,
          display: 'flex', flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <NotificationsIcon sx={{ fontSize: 18, color: T.TEXT_SEC }} />
        <Typography sx={{ flexGrow: 1, fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          Notifications
          {unreadCount > 0 && (
            <Box component="span" sx={{ ml: 1, fontSize: '0.72rem', fontWeight: 400,
              bgcolor: '#64B5F6', color: T.BADGE_BG, borderRadius: '10px', px: 0.75, py: '1px' }}>
              {unreadCount}
            </Box>
          )}
        </Typography>
        {unreadCount > 0 && (
          <Button size="small" onClick={markAllRead} disabled={markingAll}
            sx={{ fontSize: '0.72rem', color: T.TEXT_SEC, textTransform: 'none', px: 1,
              '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
            {markingAll ? <CircularProgress size={12} sx={{ color: T.TEXT_SEC }} /> : 'Mark all read'}
          </Button>
        )}
        <Button onClick={onClose} aria-label="Close notifications" startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
          sx={{ color: T.TEXT_PRI, border: `1px solid ${T.CARD_BD}`, borderRadius: '8px',
            fontSize: '0.72rem', fontWeight: 600, textTransform: 'none',
            minWidth: 0, px: { xs: 1, sm: 1.25 }, py: '4px',
            '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.5 } },
            '&:hover': { bgcolor: T.HVR_BG } }}>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Close</Box>
        </Button>
      </Box>

      {/* Filter pills */}
      <Box sx={{ display: 'flex', gap: 0.5, px: 2, py: 1.25, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        {FILTERS.map(f => (
          <FilterPill key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </FilterPill>
        ))}
      </Box>

      {/* List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: T.SCROLL_TH, borderRadius: 2 },
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={22} sx={{ color: T.TEXT_TER }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 1 }}>
            <NotificationsIcon sx={{ fontSize: 32, color: T.TEXT_TER }} />
            <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_TER }}>
              {filter === 'unread' ? 'All caught up' : 'No notifications'}
            </Typography>
          </Box>
        ) : (
          notifications.map(n => (
            <NotifRow key={String(n._id)} notif={n} onMarkRead={markRead} />
          ))
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationCenter;
