import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { Can, usePermissions } from '../../contextApi/PermissionContext';
import { COUNTRIES } from './countryData';
import { LANGUAGES } from '../../i18n';
import UserForm from './userForm';
import UserLogs from './userLogs';
import AssignCustomersDialog from '../crm/assignCustomersDialog';
import InvoiceDetailDialog from '../mis/invoiceDetailDialog';
import CopyLinkButton from '../main/copyLinkButton';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { enterGhost } from '../../tools/ghost';
import JobReportSection from './jobReportSection';

// Per-type push categories (must match backend notificationPrefs keys).
const NOTIF_TYPES = [
  { key: 'tasks',         labelKey: 'users.notifTypeTasks' },
  { key: 'assignments',   labelKey: 'users.notifTypeAssignments' },
  { key: 'invoices',      labelKey: 'users.notifTypeInvoicesShort' },
  { key: 'dmChat',        labelKey: 'users.notifTypeDmChat' },
  { key: 'readyToUpload', labelKey: 'users.notifTypeReadyToUpload' },
];

const TASK_STATUS_CFG = {
  open:    { labelKey: 'users.taskStatusOpen',    color: '#64B5F6', bg: 'rgba(100,181,246,0.1)' },
  claimed: { labelKey: 'users.taskStatusClaimed', color: '#FFB74D', bg: 'rgba(255,183,77,0.1)'  },
  done:    { labelKey: 'users.taskStatusDone',    color: '#81C784', bg: 'rgba(129,199,132,0.1)' },
};

// mirrors invoiceCard.js's STATUS_META (kept local — showUser only needs the label/color)
const INVOICE_STATUS_CFG = {
  draft:          { labelKey: 'mis.statusDraft',     color: '#9e9e9e' },
  sent:           { labelKey: 'mis.statusSent',      color: '#64b5f6' },
  accepted:       { labelKey: 'mis.statusAccepted',  color: '#81c784' },
  converted:      { labelKey: 'mis.statusConverted', color: '#ba68c8' },
  expired:        { labelKey: 'mis.statusExpired',   color: '#ffb74d' },
  issued:         { labelKey: 'mis.statusIssued',    color: '#64b5f6' },
  paid:           { labelKey: 'mis.statusPaid',      color: '#81c784' },
  partially_paid: { labelKey: 'mis.statusPartial',   color: '#ffb74d' },
  cancelled:      { labelKey: 'mis.statusCancelled', color: '#e57373' },
};

const getInitials = (user) => {
  const f = (user.firstName || '').charAt(0).toUpperCase();
  const l = (user.lastName  || '').charAt(0).toUpperCase();
  return f + l || '?';
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const formatLastSeen = (d, t) => {
  if (!d) return t('users.never');
  const diff = Date.now() - new Date(d).getTime();
  const m  = Math.floor(diff / 60000);
  const h  = Math.floor(diff / 3600000);
  const dy = Math.floor(diff / 86400000);
  if (m  < 1)  return t('users.justNow');
  if (m  < 60) return t('users.minutesAgo', { count: m });
  if (h  < 24) return t('users.hoursAgo', { count: h });
  if (dy < 30) return t('users.daysAgo', { count: dy });
  return formatDate(d);
};

const lockRemaining = (lockedUntil) => {
  const ms = new Date(lockedUntil) - Date.now();
  if (ms <= 0) return null;
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  return `${h}:${m}`;
};

// panelMode=true: inline in a right panel (no BG wrapper, no back arrow chrome)
// panelMode=false (default): full-page standalone view
const ShowUser = ({ userId, onClose, onUnlock, socket, panelMode = false }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const { t }       = useTranslation();
  const theme       = useTheme();
  const isDark      = theme.palette.mode === 'dark';

  const T = {
    BG:       isDark ? '#060606'                 : theme.palette.background.default,
    CARD_BG:  isDark ? '#111111'                 : theme.palette.background.paper,
    CARD_BD:  isDark ? 'rgba(255,255,255,0.07)'  : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff'                 : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)'  : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'   : 'rgba(0,0,0,0.3)',
    ERR_CLR:  '#FF4D8D',
    BTN_BG:   isDark ? '#ffffff'                 : '#000000',
    BTN_CLR:  isDark ? '#000000'                 : '#ffffff',
  };

  const { can } = usePermissions();

  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [errorStatus,  setErrorStatus]  = useState(null);
  const [unlocking,    setUnlocking]    = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [crmTasks,     setCrmTasks]     = useState([]);
  const [crmLoading,   setCrmLoading]   = useState(false);
  const [assignOpen,   setAssignOpen]   = useState(false);
  const [assignedInvoices, setAssignedInvoices] = useState([]);
  const [misLoading,       setMisLoading]       = useState(false);
  const [viewInvoice,      setViewInvoice]      = useState(null);
  // Ghost capability of the CURRENT viewer (not of the user being viewed) —
  // decides whether the ghost controls render at all. Fetched rather than
  // derived from permissions because ghost rights are a separate access axis
  // that only the owner account can grant (see api/utils/ghost.js).
  const [ghostMe,      setGhostMe]      = useState(null);
  const [ghostBusy,    setGhostBusy]    = useState(false);
  const [targetCanGhost, setTargetCanGhost] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/users/${userId}`,
      });
      setData(res.data);
    } catch (err) {
      // A short-link/notification deep link can hand this a user the viewer
      // doesn't hold users:view for — render the Restricted Access screen
      // instead of the generic "failed to load" snackbar.
      const status = err?.response?.status;
      setErrorStatus(status || null);
      if (status !== 403) {
        dispatch(actions.setShowSnackBar({ status: true, msg: t('users.failedLoadUser'), type: 'error' }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [userId]);

  // Admin toggle of a single push-notification category for THIS user.
  const [savingPref, setSavingPref] = useState(null);
  const updateNotifPref = async (key, value) => {
    setSavingPref(key);
    // optimistic
    setData((prev) => prev ? { ...prev, user: { ...prev.user,
      notificationPrefs: { ...(prev.user?.notificationPrefs || {}), [key]: value } } } : prev);
    try {
      await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/users/${userId}`,
        data: { notificationPrefs: { [key]: value } },
      });
    } catch {
      dispatch(actions.setShowSnackBar({ status: true, msg: t('users.failedUpdateNotifPref'), type: 'error' }));
      fetchUser();   // revert to server truth
    }
    setSavingPref(null);
  };

  const fetchCrmTasks = useCallback(async () => {
    setCrmLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/tasks`,
        params: { module: 'crm', forUser: userId },
      });
      setCrmTasks(res.data.data || []);
    } catch (_) {}
    setCrmLoading(false);
  }, [authCtx, axiosGlobal, userId]);

  useEffect(() => { fetchCrmTasks(); }, [fetchCrmTasks]);

  // "Send to" reverse lookup — invoices/pre-invoices assigned to this user.
  // Branch isolation applies to the VIEWER (see the backend route), so an
  // admin only sees assigned docs in branches they themselves hold.
  const fetchAssignedInvoices = useCallback(async () => {
    if (!can('mis:view')) return;
    setMisLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/mis/invoices/assigned/${userId}`,
      });
      setAssignedInvoices(res.data.data || []);
    } catch (_) {}
    setMisLoading(false);
  }, [authCtx, axiosGlobal, userId]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAssignedInvoices(); }, [fetchAssignedInvoices]);

  // Ghost mode is disabled by default on the server (503 + ghostDisabled), so a
  // failure here simply means the controls stay hidden — never an error toast.
  useEffect(() => {
    let cancelled = false;
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/ghost/me` })
      .then((res) => { if (!cancelled) setGhostMe(res.data); })
      .catch(() => { if (!cancelled) setGhostMe(null); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Owner-only: whether the user being VIEWED currently holds ghost rights.
  useEffect(() => {
    if (!ghostMe?.isOwner || !userId) return;
    let cancelled = false;
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/ghost/access` })
      .then((res) => {
        if (cancelled) return;
        setTargetCanGhost((res.data?.users || []).some((u) => String(u._id) === String(userId)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghostMe?.isOwner, userId]);

  // Real-time presence for this specific user
  useEffect(() => {
    if (!socket) return;
    const handler = ({ userId: uid, isOnline, lastSeen }) => {
      if (String(uid) !== String(userId)) return;
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            isOnline,
            lastSeen: isOnline ? prev.user.lastSeen : (lastSeen || prev.user.lastSeen),
          },
        };
      });
    };
    socket.on('presence:update', handler);
    return () => socket.off('presence:update', handler);
  }, [socket, userId]);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/users/${userId}/unlock`,
      });
      dispatch(actions.setShowSnackBar({ status: true, msg: t('users.accountUnlocked'), type: 'success' }));
      await fetchUser();
      if (onUnlock) onUnlock();
    } catch {
      dispatch(actions.setShowSnackBar({ status: true, msg: t('users.failedUnlockAccount'), type: 'error' }));
    } finally {
      setUnlocking(false);
    }
  };

  const groupedPerms = {};
  (data?.effectivePermissions || []).forEach(key => {
    const mod = key.split(':')[0];
    if (!groupedPerms[mod]) groupedPerms[mod] = [];
    groupedPerms[mod].push(key);
  });
  const effectiveScopes = data?.dataScopes || {};

  const user   = data?.user;
  const locked = user?.auth?.lockedUntil && new Date(user.auth.lockedUntil) > new Date();
  const remain = locked ? lockRemaining(user.auth.lockedUntil) : null;

  // Country info from stored code
  const countryInfo = user?.countryCode
    ? COUNTRIES.find(c => c.dial === user.countryCode)
    : null;

  // Selected UI language — persisted server-side (see languageContext.js /
  // PUT /users/me/language), not just this browser's localStorage.
  const langInfo = LANGUAGES.find(l => l.code === (user?.language || 'en')) || LANGUAGES[0];

  const inner = (
    <>
      {/* Back nav (only in standalone mode) */}
      {!panelMode && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: T.TEXT_SEC, '&:hover': { color: T.TEXT_PRI, bgcolor: T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' } }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC }}>{t('users.usersBreadcrumb')}</Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={26} sx={{ color: T.TEXT_TER }} />
        </Box>
      ) : errorStatus === 403 ? (
        <RestrictedAccessScreen />
      ) : !user ? (
        <Typography sx={{ color: T.TEXT_SEC, textAlign: 'center', py: 8 }}>{t('users.userNotFound')}</Typography>
      ) : (
        <Box sx={{ maxWidth: panelMode ? 'none' : 600, mx: panelMode ? 0 : 'auto' }}>

          {/* ── Profile card ───────────────────────────────────────────── */}
          <Box sx={{ p: 3, bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: '14px', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Avatar + online dot */}
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: '50%',
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 700, color: T.TEXT_PRI, overflow: 'hidden',
                }}>
                  {user.profileImage?.url
                    ? <img
                        src={`${axiosGlobal.defaultTargetApi}${user.profileImage.url}`}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    : getInitials(user)
                  }
                </Box>
                <Box sx={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 12, height: 12, borderRadius: '50%',
                  bgcolor: user.isOnline ? '#4CAF50' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                  border: `2px solid ${T.CARD_BG}`,
                }} />
              </Box>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: T.TEXT_PRI, lineHeight: 1.3 }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                  {countryInfo && (
                    <span style={{ fontSize: '0.9rem' }} title={countryInfo.name}>{countryInfo.flag}</span>
                  )}
                  <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC, fontFamily: 'monospace' }}>
                    {user.countryCode ? `${user.countryCode} ` : ''}{user.phoneNumber}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, mt: 0.25 }}>
                  {user.isOnline ? t('users.onlineNow') : t('users.lastSeenLabel', { when: formatLastSeen(user.lastSeen, t) })}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <CopyLinkButton module="users" entityType="user" entityId={userId} />
                <Tooltip title={langInfo.label}>
                  <Chip
                    label={langInfo.nativeLabel}
                    size="small"
                    sx={{
                      height: 22, fontSize: '0.68rem', fontWeight: 600, borderRadius: '6px',
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      color: T.TEXT_SEC,
                      border: `1px solid ${T.CARD_BD}`,
                      '& .MuiChip-label': { px: 1 },
                    }}
                  />
                </Tooltip>
                <Chip
                  label={user.validation ? t('users.activeLabel') : t('users.inactiveBadge')}
                  size="small"
                  sx={{
                    height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: '6px',
                    bgcolor: user.validation ? 'rgba(76,175,80,0.1)' : 'rgba(255,77,141,0.08)',
                    color: user.validation ? '#4CAF50' : T.ERR_CLR,
                    border: `1px solid ${user.validation ? 'rgba(76,175,80,0.2)' : 'rgba(255,77,141,0.2)'}`,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
                <Can permission="users:edit">
                  <IconButton
                    size="small"
                    onClick={() => setEditOpen(true)}
                    sx={{ color: T.TEXT_TER, '&:hover': { color: T.TEXT_PRI, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' } }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Can>
              </Box>
            </Box>

            {/* ── Ghost mode ──────────────────────────────────────────────
                Hidden entirely unless the CURRENT viewer holds ghost rights
                (or is the owner) and is not already ghosting. Never shown for
                your own record — ghosting yourself is meaningless. */}
            {ghostMe && !ghostMe.inGhost && (ghostMe.canGhost || ghostMe.isOwner)
              && String(userId) !== String(authCtx.userId) && (
              <>
                <Divider sx={{ my: 2, borderColor: T.CARD_BD }} />
                <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                  {t('ghost.sectionTitle')}
                </Typography>

                {ghostMe.canGhost && (
                  <>
                    <Button
                      size="small"
                      startIcon={ghostBusy ? <CircularProgress size={13} sx={{ color: 'inherit' }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                      disabled={ghostBusy}
                      onClick={async () => {
                        setGhostBusy(true);
                        const r = await enterGhost(authCtx, axiosGlobal, userId);
                        if (!r.ok) {
                          setGhostBusy(false);
                          dispatch(actions.setShowSnackBar({ status: true, msg: r.message, type: 'error' }));
                        }
                        // On success the page navigates — leave the spinner up.
                      }}
                      sx={{
                        textTransform: 'none', fontSize: '0.78rem', fontWeight: 700, borderRadius: '8px',
                        bgcolor: '#B26A00', color: '#fff', px: 1.75,
                        '&:hover': { bgcolor: '#8F5500' },
                      }}>
                      {t('ghost.enterButton', { name: user.firstName || '' })}
                    </Button>
                    <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, mt: 0.75 }}>
                      {t('ghost.enterHelp')}
                    </Typography>
                  </>
                )}

                {/* Owner-only: grant/revoke ghost rights for this user. */}
                {ghostMe.isOwner && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: ghostMe.canGhost ? 1.5 : 0 }}>
                    <Switch
                      size="small"
                      checked={targetCanGhost}
                      onChange={async (e) => {
                        const next = e.target.checked;
                        setTargetCanGhost(next);
                        try {
                          await authCtx.jwtInst({
                            method: 'put',
                            url: `${axiosGlobal.defaultTargetApi}/ghost/access/${userId}`,
                            data: { canGhost: next },
                          });
                        } catch (_) {
                          setTargetCanGhost(!next);   // revert on failure
                          dispatch(actions.setShowSnackBar({ status: true, msg: t('ghost.grantFailed'), type: 'error' }));
                        }
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC }}>{t('ghost.grantLabel')}</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>{t('ghost.grantHelp')}</Typography>
                    </Box>
                  </Box>
                )}
              </>
            )}

            <Divider sx={{ my: 2, borderColor: T.CARD_BD }} />

            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
              {t('users.infoLabel')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>{t('users.joinedLabel')}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC }}>{formatDate(user.insertDate)}</Typography>
              </Box>
              {user.city && (
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>{t('users.cityLabel')}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC }}>{user.city}</Typography>
                </Box>
              )}
              {countryInfo && (
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>{t('users.countryLabel')}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC }}>
                    {countryInfo.flag} {countryInfo.name}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* ── Lockout banner ──────────────────────────────────────────── */}
          {locked && (
            <Box sx={{
              p: 2, mb: 2,
              bgcolor: 'rgba(255,77,141,0.06)',
              border: '1px solid rgba(255,77,141,0.2)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              <LockIcon sx={{ color: T.ERR_CLR, fontSize: 18, flexShrink: 0 }} />
              <Typography sx={{ flexGrow: 1, fontSize: '0.85rem', color: T.ERR_CLR }}>
                {remain ? t('users.accountLockedRemain', { remain }) : t('users.accountLocked')}
              </Typography>
              <Can permission="users:unlock">
                <Button
                  size="small"
                  onClick={handleUnlock}
                  disabled={unlocking}
                  startIcon={unlocking
                    ? <CircularProgress size={12} color="inherit" />
                    : <LockOpenIcon sx={{ fontSize: 14 }} />
                  }
                  sx={{
                    color: T.ERR_CLR,
                    border: '1px solid rgba(255,77,141,0.35)',
                    borderRadius: '8px',
                    fontSize: '0.75rem', fontWeight: 600,
                    textTransform: 'none', px: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,77,141,0.1)' },
                    '&.Mui-disabled': { color: 'rgba(255,77,141,0.3)', borderColor: 'rgba(255,77,141,0.1)' },
                  }}
                >
                  {t('users.unlockButton')}
                </Button>
              </Can>
            </Box>
          )}

          {/* ── Effective permissions ────────────────────────────────────── */}
          <Box sx={{ p: 2.5, bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: '14px', mb: 2 }}>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>
              {t('users.effectivePermissions')}
            </Typography>

            {Object.keys(groupedPerms).length === 0 ? (
              <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_TER }}>{t('users.noPermissionsAssigned')}</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(groupedPerms).map(([mod, keys]) => (
                  <Box key={mod}>
                    <Typography sx={{
                      fontSize: '0.68rem', color: T.TEXT_TER,
                      textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.75,
                    }}>
                      {mod}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {keys.map(key => (
                        <Chip
                          key={key}
                          label={key.substring(key.indexOf(':') + 1)}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.68rem', fontWeight: 500,
                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            borderRadius: '4px',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* ── Data visibility scopes ───────────────────────────────────── */}
          {Object.keys(effectiveScopes).length > 0 && (
            <Box sx={{ p: 2.5, bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: '14px', mb: 2 }}>
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>
                {t('users.dataVisibilityHeader')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {Object.entries(effectiveScopes).map(([mod, scope]) => {
                  const scopeColor = scope === 'mine' ? '#FF4D8D' : scope === 'group' ? '#FFB74D' : '#81C784';
                  return (
                    <Box key={mod} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      px: 1.5, py: 0.75,
                      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : T.CARD_BD}`,
                      borderRadius: '8px' }}>
                      <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, textTransform: 'capitalize' }}>
                        {mod}
                      </Typography>
                      <Chip label={scope} size="small" sx={{
                        height: 18, fontSize: '0.63rem', fontWeight: 700, borderRadius: '4px',
                        bgcolor: `${scopeColor}18`, color: scopeColor, border: `1px solid ${scopeColor}30`,
                        '& .MuiChip-label': { px: 0.75 },
                      }} />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* ── Notification preferences (admin-editable) ─────────────────── */}
          <Can permission="users:edit">
            <Box sx={{ p: 2.5, bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: '14px', mb: 2 }}>
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>
                {t('users.notificationPreferences')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {NOTIF_TYPES.map(({ key, labelKey }) => {
                  const on = (user?.notificationPrefs?.[key]) !== false;   // default ON
                  return (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.25 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_SEC }}>{t(labelKey)}</Typography>
                      <Switch size="small" checked={on} disabled={savingPref === key}
                        onChange={(e) => updateNotifPref(key, e.target.checked)} />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Can>

          {/* ── CRM Customer Tasks ────────────────────────────────────────── */}
          <Box sx={{ p: 2.5, bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: '14px', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <AssignmentIcon sx={{ fontSize: 14, color: T.TEXT_TER, mr: 0.75 }} />
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase',
                letterSpacing: 1, flexGrow: 1 }}>
                {t('users.crmCustomerTasks')}
              </Typography>
              <Can permission="crm:task:assign">
                <Button size="small" onClick={() => setAssignOpen(true)}
                  startIcon={<PersonAddAlt1Icon sx={{ fontSize: 13 }} />}
                  sx={{ fontSize: '0.72rem', textTransform: 'none', px: 1.25, py: '3px',
                    borderRadius: '7px', color: T.TEXT_SEC,
                    border: `1px solid ${T.CARD_BD}`,
                    '&:hover': { color: T.TEXT_PRI, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' } }}>
                  {t('users.assignCustomersBtn')}
                </Button>
              </Can>
            </Box>

            {crmLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={18} sx={{ color: T.TEXT_TER }} />
              </Box>
            ) : crmTasks.length === 0 ? (
              <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, textAlign: 'center', py: 2 }}>
                {t('users.noCrmTasksAssigned')}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {crmTasks.map(task => {
                  const st = TASK_STATUS_CFG[task.status] || TASK_STATUS_CFG.open;
                  const subjCount = (task.subjects || []).length;
                  return (
                    <Box key={task._id} sx={{
                      display: 'flex', alignItems: 'flex-start', gap: 1.25,
                      px: 1.5, py: 1, borderRadius: '10px',
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${T.CARD_BD}`,
                    }}>
                      {task.status === 'done'
                        ? <CheckCircleOutlineIcon sx={{ fontSize: 15, color: st.color, mt: 0.15, flexShrink: 0 }} />
                        : <HourglassEmptyIcon sx={{ fontSize: 15, color: st.color, mt: 0.15, flexShrink: 0 }} />
                      }
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.TEXT_PRI }} noWrap>
                          {task.title}
                        </Typography>
                        {task.description && (
                          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, mt: 0.1 }} noWrap>
                            {task.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4, flexWrap: 'wrap' }}>
                          {subjCount > 0 && (
                            <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>
                              {t('users.taskSubjectCount', { count: subjCount })}
                            </Typography>
                          )}
                          {task.createdByName && (
                            <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>
                              · {t('crm.byActor', { name: task.createdByName })}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Chip label={t(st.labelKey)} size="small"
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, borderRadius: '4px',
                          bgcolor: st.bg, color: st.color,
                          '& .MuiChip-label': { px: 0.6 }, flexShrink: 0 }} />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* ── Assigned Invoices ("Send to") ───────────────────────────────── */}
          {can('mis:view') && (
            <Box sx={{ p: 2.5, bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: '14px', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <ReceiptLongIcon sx={{ fontSize: 14, color: T.TEXT_TER, mr: 0.75 }} />
                <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase',
                  letterSpacing: 1, flexGrow: 1 }}>
                  {t('users.assignedInvoicesHeader')}
                </Typography>
              </Box>

              {misLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={18} sx={{ color: T.TEXT_TER }} />
                </Box>
              ) : assignedInvoices.length === 0 ? (
                <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, textAlign: 'center', py: 2 }}>
                  {t('users.noInvoicesAssigned')}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {assignedInvoices.map(inv => {
                    const isInvoice = inv.docType === 'invoice';
                    const st = INVOICE_STATUS_CFG[inv.status] || INVOICE_STATUS_CFG.draft;
                    return (
                      <Box key={inv._id} onClick={() => setViewInvoice(inv)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.25,
                          px: 1.5, py: 1, borderRadius: '10px', cursor: 'pointer',
                          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${T.CARD_BD}`,
                          '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' },
                        }}>
                        {isInvoice
                          ? <ReceiptLongIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />
                          : <RequestQuoteIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />}
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.TEXT_PRI }} noWrap>
                            #{inv.docNumber} · {inv.customerSnapshot?.name || '—'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, mt: 0.1 }}>
                            {(Number(inv.grandTotal) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                          </Typography>
                        </Box>
                        <Chip label={t(st.labelKey)} size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, borderRadius: '4px',
                            bgcolor: `${st.color}22`, color: st.color,
                            '& .MuiChip-label': { px: 0.6 }, flexShrink: 0 }} />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}

          {/* ── Activity log ─────────────────────────────────────────────── */}
          <Box sx={{ p: 2.5, bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: '14px', mb: 2.5 }}>
            <UserLogs userId={userId} />
          </Box>

          {/* ── Job reports — self-authored, visible to anyone who can view this profile ── */}
          <JobReportSection userId={userId} isSelf={String(authCtx.decode?.id) === String(userId)} />

        </Box>
      )}

      {/* Edit form dialog */}
      {data && (
        <UserForm
          mode="edit"
          user={data.user}
          userAccess={data.userAccess}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={() => fetchUser()}
        />
      )}

      {/* Assign customers dialog (pre-filled with this user) */}
      {data?.user && (
        <AssignCustomersDialog
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          onSave={() => { setAssignOpen(false); fetchCrmTasks(); }}
          customerIds={[]}
          prefilledUserId={String(userId)}
          prefilledUserName={`${data.user.firstName || ''} ${data.user.lastName || ''}`.trim()}
        />
      )}

      {/* Read-only invoice/pre-invoice viewer for a clicked "Assigned Invoices" row */}
      <InvoiceDetailDialog
        doc={viewInvoice}
        open={Boolean(viewInvoice)}
        onClose={() => setViewInvoice(null)}
      />
    </>
  );

  if (panelMode) {
    return (
      <Box sx={{ p: 3, minHeight: '100%' }}>
        {inner}
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 60px)', bgcolor: T.BG, px: { xs: 2, sm: 3 }, py: 3 }}>
      {inner}
    </Box>
  );
};

export default ShowUser;
