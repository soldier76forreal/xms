import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { useTheme, useMediaQuery } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import ArrowBackIcon          from '@mui/icons-material/ArrowBack';
import AssignmentIcon         from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InboxIcon              from '@mui/icons-material/Inbox';
import ScheduleIcon           from '@mui/icons-material/Schedule';

import AuthContext  from '../authAndConnections/auth';
import AxiosGlobal  from '../authAndConnections/axiosGlobalUrl';
import { actions }  from '../../store/store';
import { Can, usePermissions } from '../../contextApi/PermissionContext';
import CustomerCard   from './customerCard';
import CustomerDetail from './customerDetail';
import CustomerForm   from './customerForm';
import UserAvatar      from '../main/userAvatar';

// labelKey resolved at render time via t(`crm.${labelKey}`) — module scope has
// no hook access.
const TASK_STATUS = {
  open:    { labelKey: 'taskStatusOpen',    color: '#64B5F6', bg: 'rgba(100,181,246,0.12)' },
  claimed: { labelKey: 'taskStatusClaimed', color: '#FFB74D', bg: 'rgba(255,183,77,0.12)'  },
  done:    { labelKey: 'taskStatusDone',    color: '#81C784', bg: 'rgba(129,199,132,0.12)' },
};

function dayLabel(dateVal, t) {
  if (!dateVal) return t('crm.unknownDate');
  const d     = new Date(dateVal);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - start) / 86400000);
  if (diffDays === 0) return t('crm.dayToday');
  if (diffDays === 1) return t('crm.dayYesterday');
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

function isOverdueOrToday(d) {
  if (!d) return false;
  const end = new Date(); end.setHours(23, 59, 59, 999);
  return new Date(d) <= end;
}

// ── MyDesk ───────────────────────────────────────────────────────────────────

const MyDesk = ({ onAddToMyDesk }) => {
  const { t }   = useTranslation();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const isMob   = useMediaQuery(theme.breakpoints.down('md'));
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const { can }     = usePermissions();
  const currentUserId = String(authCtx.decode?.id || authCtx.decode?._id || '');

  const [tab, setTab] = useState('personal');

  // Master-detail state — managed inside My Desk
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editCustomer,     setEditCustomer]     = useState(null);

  const [personalGroups,  setPersonalGroups]  = useState([]);
  const [followUps,       setFollowUps]       = useState([]);
  const [personalLoading, setPersonalLoading] = useState(false);

  const [assignedGroups,  setAssignedGroups]  = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);

  const [expandedIds, setExpandedIds] = useState(new Set());

  const T = {
    BG:       isDark ? '#060606' : theme.palette.background.default,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    TAB_BG:   isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.08)',
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Fetch customers by IDs ────────────────────────────────────────────────

  const fetchCustomers = useCallback(async (ids) => {
    if (!ids.length) return {};
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/crm/customers`,
        params: { ids: ids.join(','), limit: 100 },
      });
      const map = {};
      (res.data.data || []).forEach(c => { map[String(c._id)] = c; });
      return map;
    } catch (_) { return {}; }
  }, [authCtx, axiosGlobal]);

  // ── Build timeline groups ─────────────────────────────────────────────────

  function buildGroups(tasks, customerMap) {
    const byDay = {};
    const order = [];

    tasks.forEach(task => {
      const label = dayLabel(task.insertDate, t);
      if (!byDay[label]) { byDay[label] = []; order.push(label); }

      (task.subjects || []).forEach(subj => {
        if (subj.subjectType !== 'customer') return;
        const customer = customerMap[String(subj.subjectId)];
        if (!customer) return;
        byDay[label].push({ task, customer });
      });
    });

    return order
      .map(label => ({ dayLabel: label, items: byDay[label] }))
      .filter(g => g.items.length > 0);
  }

  // ── Load personal ─────────────────────────────────────────────────────────

  const loadPersonal = useCallback(async () => {
    setPersonalLoading(true);
    try {
      const [tasksRes, fuRes] = await Promise.allSettled([
        authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/tasks`,
          params: { module: 'crm', scope: 'personal' } }),
        authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/crm/customers`,
          params: { limit: 100, sort: 'nextFollowUpAt', order: 'asc' } }),
      ]);

      if (tasksRes.status === 'fulfilled') {
        const tasks = tasksRes.value.data.data || [];
        const allIds = [...new Set(
          tasks.flatMap(t => (t.subjects || [])
            .filter(s => s.subjectType === 'customer')
            .map(s => String(s.subjectId))
          )
        )];
        const customerMap = await fetchCustomers(allIds);
        setPersonalGroups(buildGroups(tasks, customerMap));
      }

      if (fuRes.status === 'fulfilled') {
        const due = (fuRes.value.data.data || []).filter(c => isOverdueOrToday(c.nextFollowUpAt));
        setFollowUps(due);
      }
    } catch (_) {}
    setPersonalLoading(false);
  }, [authCtx, axiosGlobal, fetchCustomers]);

  // ── Load assigned ─────────────────────────────────────────────────────────

  const loadAssigned = useCallback(async () => {
    setAssignedLoading(true);
    try {
      const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/tasks`,
        params: { module: 'crm', scope: 'assigned' } });
      const tasks = res.data.data || [];
      const allIds = [...new Set(
        tasks.flatMap(t => (t.subjects || [])
          .filter(s => s.subjectType === 'customer')
          .map(s => String(s.subjectId))
        )
      )];
      const customerMap = await fetchCustomers(allIds);
      setAssignedGroups(buildGroups(tasks, customerMap));
    } catch (_) {}
    setAssignedLoading(false);
  }, [authCtx, axiosGlobal, fetchCustomers]);

  useEffect(() => { loadPersonal(); }, [loadPersonal]);
  useEffect(() => { if (tab === 'tasks') loadAssigned(); }, [tab, loadAssigned]);

  // Keep selected customer in sync after refresh
  const refreshSelected = useCallback((customerId) => {
    // find updated customer object across all groups
    const allGroups = [...personalGroups, ...assignedGroups];
    for (const g of allGroups) {
      for (const { customer } of g.items) {
        if (String(customer._id) === String(customerId)) {
          setSelectedCustomer(customer);
          return;
        }
      }
    }
  }, [personalGroups, assignedGroups]);

  // ── Mark task done ────────────────────────────────────────────────────────

  const handleDone = async (taskId, isPersonal) => {
    try {
      await authCtx.jwtInst({ method: 'put', url: `${axiosGlobal.defaultTargetApi}/tasks/${taskId}/done` });
      dispatch(actions.setShowSnackBar({ status: true, msg: t('crm.taskMarkedDone'), type: 'success' }));
      if (isPersonal) loadPersonal(); else loadAssigned();
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true,
        msg: err?.response?.data?.message || t('crm.failedGeneric'), type: 'error' }));
    }
  };

  // ── Render a day section ──────────────────────────────────────────────────

  const renderDayGroup = ({ dayLabel: label, items }, isPersonal) => (
    <Box key={label} sx={{ mb: 2 }}>
      {/* Day header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 1 }}>
        <Box sx={{ flexGrow: 1, height: '1px', bgcolor: T.BD }} />
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: T.TEXT_TER,
          textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
        <Box sx={{ flexGrow: 1, height: '1px', bgcolor: T.BD }} />
      </Box>

      {/* Customer cards */}
      {items.map(({ task, customer }, idx) => {
        const st = TASK_STATUS[task.status] || TASK_STATUS.open;
        const isOwner = String(task.assignedUser) === currentUserId ||
                        String(task.createdBy)    === currentUserId;
        const cardId = `${task._id}-${customer._id}`;
        const isSelected = selectedCustomer && String(selectedCustomer._id) === String(customer._id);

        // Who assigned — show only when someone else created the task
        const assignedByMe = String(task.createdBy) === currentUserId;
        const assignerName = !assignedByMe && task.createdByName ? task.createdByName : null;

        return (
          <Box key={cardId}
            sx={{ mb: 0.5, borderRadius: '12px',
              outline: isSelected ? `2px solid ${T.BD2}` : '2px solid transparent',
              transition: 'outline-color 0.15s' }}>
            <CustomerCard
              customer={customer}
              selected={isSelected}
              checked={false}
              showCheckbox={false}
              onSelect={(c) => setSelectedCustomer(
                selectedCustomer && String(selectedCustomer._id) === String(c._id) ? null : c
              )}
              onCheck={() => {}}
              expanded={expandedIds.has(String(customer._id))}
              onExpand={() => toggleExpand(String(customer._id))}
              onEdit={(c) => setEditCustomer(c)}
              onAddToMyDesk={onAddToMyDesk}
            />

            {/* Task meta row */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap',
              gap: 0.75, px: 2.5, pb: 0.75 }}>

              {/* Status dot + label */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: st.color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>
                  {t(`crm.${st.labelKey}`)}
                  {task.title && task.title !== 'My Desk' && task.title !== 'CRM task'
                    ? ` · ${task.title}` : ''}
                </Typography>
              </Box>

              {/* Assigned by */}
              {assignerName && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <UserAvatar userId={task.createdBy} size={14} fontSize="0.5rem" />
                  <Typography sx={{ fontSize: '0.64rem', color: T.TEXT_TER }}>
                    {t('crm.byActor', { name: assignerName })}
                  </Typography>
                </Box>
              )}

              {/* Mark done */}
              {task.status !== 'done' && isOwner && (
                <Can permission="tasks:respond">
                  <Button size="small" onClick={() => handleDone(task._id, isPersonal)}
                    startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 12 }} />}
                    sx={{ ml: 'auto', fontSize: '0.66rem', textTransform: 'none', py: 0,
                      color: T.TEXT_TER, minWidth: 0, '&:hover': { color: '#81C784' } }}>
                    {t('crm.markDone')}
                  </Button>
                </Can>
              )}
              {task.status === 'done' && (
                <CheckCircleOutlineIcon sx={{ fontSize: 13, color: '#81C784', ml: 'auto' }} />
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  // ── Follow-up section ─────────────────────────────────────────────────────

  const renderFollowUps = () => {
    if (!followUps.length) return null;
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 1 }}>
          <Box sx={{ flexGrow: 1, height: '1px', bgcolor: T.BD }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#FFB74D',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 11 }} /> {t('crm.followUpsDue')}
          </Typography>
          <Box sx={{ flexGrow: 1, height: '1px', bgcolor: T.BD }} />
        </Box>
        {followUps.map(c => {
          const isSelected = selectedCustomer && String(selectedCustomer._id) === String(c._id);
          return (
            <Box key={c._id} sx={{ mb: 0.5, borderRadius: '12px',
              outline: isSelected ? `2px solid ${T.BD2}` : '2px solid transparent',
              transition: 'outline-color 0.15s' }}>
              <CustomerCard
                customer={c}
                selected={isSelected}
                checked={false}
                showCheckbox={false}
                onSelect={(cust) => setSelectedCustomer(
                  selectedCustomer && String(selectedCustomer._id) === String(cust._id) ? null : cust
                )}
                onCheck={() => {}}
                expanded={expandedIds.has(String(c._id))}
                onExpand={() => toggleExpand(String(c._id))}
                onEdit={(cust) => setEditCustomer(cust)}
                onAddToMyDesk={onAddToMyDesk}
              />
            </Box>
          );
        })}
      </Box>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: T.BG }}>

      {/* Sub-tabs */}
      <Box sx={{ px: 2.5, py: 1.25, borderBottom: `1px solid ${T.BD}`, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, mr: 1 }}>
          {t('crm.myDesk')}
        </Typography>
        {[{ id: 'personal', labelKey: 'tabPersonal' }, { id: 'tasks', labelKey: 'tabAssigned' }].map(subTab => (
          <Button key={subTab.id} size="small" onClick={() => { setTab(subTab.id); setSelectedCustomer(null); }}
            sx={{ minWidth: 0, px: 1.5, py: '3px', borderRadius: '7px',
              fontSize: '0.75rem', fontWeight: tab === subTab.id ? 700 : 400,
              textTransform: 'none',
              color: tab === subTab.id ? T.TEXT_PRI : T.TEXT_TER,
              bgcolor: tab === subTab.id ? T.TAB_BG : 'transparent',
              '&:hover': { bgcolor: T.TAB_BG, color: T.TEXT_PRI } }}>
            {t(`crm.${subTab.labelKey}`)}
          </Button>
        ))}
      </Box>

      {/* Split layout: list (left) + detail panel (right) */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: customer list ── */}
        <Box sx={{
          width: selectedCustomer ? { xs: '100%', md: '42%' } : '100%',
          display: selectedCustomer ? { xs: 'none', md: 'flex' } : 'flex',
          flexDirection: 'column',
          overflowY: 'auto', pt: 1.5,
          borderRight: selectedCustomer ? `1px solid ${T.BD}` : 'none',
          transition: 'width 0.2s',
        }}>
          {tab === 'personal' && (
            personalLoading
              ? <Loader T={T} />
              : (personalGroups.length === 0 && followUps.length === 0)
                ? <EmptyState T={T}
                    icon={<InboxIcon sx={{ fontSize: 44, color: T.TEXT_TER }} />}
                    title={t('crm.emptyDeskTitle')}
                    sub={t('crm.emptyDeskSub')} />
                : (
                  <Box>
                    {renderFollowUps()}
                    {personalGroups.map(g => renderDayGroup(g, true))}
                  </Box>
                )
          )}

          {tab === 'tasks' && (
            assignedLoading
              ? <Loader T={T} />
              : assignedGroups.length === 0
                ? <EmptyState T={T}
                    icon={<AssignmentIcon sx={{ fontSize: 44, color: T.TEXT_TER }} />}
                    title={t('crm.emptyAssignedTitle')}
                    sub={t('crm.emptyAssignedSub')} />
                : (
                  <Box>
                    {assignedGroups.map(g => renderDayGroup(g, false))}
                  </Box>
                )
          )}
        </Box>

        {/* ── Right: customer detail panel ── */}
        {selectedCustomer && (
          <Box sx={{
            width: { xs: '100%', md: '58%' },
            overflowY: 'auto',
            flexShrink: 0,
            position: 'relative',
          }}>
            {isMob && (
              <IconButton size="small" onClick={() => setSelectedCustomer(null)}
                sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10,
                  color: T.TEXT_TER, bgcolor: T.BG, border: `1px solid ${T.BD}`,
                  borderRadius: '8px', width: 30, height: 30 }}>
                <ArrowBackIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            <CustomerDetail
              customer={selectedCustomer}
              onClose={() => setSelectedCustomer(null)}
              onEdit={(c) => setEditCustomer(c)}
              onDeleted={(id) => {
                setSelectedCustomer(null);
                loadPersonal();
                loadAssigned();
              }}
            />
          </Box>
        )}
      </Box>

      {/* Edit form */}
      {editCustomer && (
        <CustomerForm
          mode="edit"
          customer={editCustomer}
          open={Boolean(editCustomer)}
          onClose={() => setEditCustomer(null)}
          onSave={() => {
            setEditCustomer(null);
            loadPersonal();
            loadAssigned();
          }}
        />
      )}
    </Box>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Loader({ T }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress size={22} sx={{ color: T.TEXT_TER }} />
    </Box>
  );
}

function EmptyState({ T, icon, title, sub }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', py: 6, px: 2 }}>
      <Box sx={{ mb: 1.5 }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.875rem', color: T.TEXT_SEC, fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      {sub && <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER }}>{sub}</Typography>}
    </Box>
  );
}

export default MyDesk;
