import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import { useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { Can, usePermissions } from '../../contextApi/PermissionContext';
import TaskAssignDialog from './taskAssignDialog';

const useT = () => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    CARD_BG:  isDark ? '#111111'                 : theme.palette.background.paper,
    CARD_BD:  isDark ? 'rgba(255,255,255,0.07)'  : theme.palette.divider,
    SEL_BG:   isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.05)',
    SEL_BD:   isDark ? 'rgba(255,255,255,0.22)'  : 'rgba(0,0,0,0.22)',
    TEXT_PRI: isDark ? '#ffffff'                 : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)'  : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'   : 'rgba(0,0,0,0.3)',
    HVR_BD:   isDark ? 'rgba(255,255,255,0.14)'  : 'rgba(0,0,0,0.18)',
    BTN_BG:   isDark ? '#ffffff'                 : '#000000',
    BTN_CLR:  isDark ? '#000000'                 : '#ffffff',
    ERR_CLR:  '#FF4D8D',
    isDark,
  };
};

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS = {
  open:    { label: 'Open',    color: '#64B5F6', bg: 'rgba(100,181,246,0.1)' },
  claimed: { label: 'Claimed', color: '#FFB74D', bg: 'rgba(255,183,77,0.1)'  },
  done:    { label: 'Done',    color: '#81C784', bg: 'rgba(129,199,132,0.1)' },
};

// ── Relative time ──────────────────────────────────────────────────────────────
const relTime = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const dy = Math.floor(diff / 86400000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  return `${dy}d ago`;
};

// ── Scope + Filter pills ───────────────────────────────────────────────────────
const Pill = ({ active, onClick, children, T }) => (
  <Button size="small" onClick={onClick}
    sx={{
      fontSize: '0.75rem', fontWeight: active ? 600 : 400, textTransform: 'none',
      borderRadius: '20px', px: 1.5, py: '3px', minWidth: 0,
      color: active ? T.TEXT_PRI : T.TEXT_SEC,
      bgcolor: active ? (T.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)') : 'transparent',
      border: active ? `1px solid ${T.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}` : '1px solid transparent',
      '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)', color: T.TEXT_PRI },
    }}
  >
    {children}
  </Button>
);

// ── Single task row ────────────────────────────────────────────────────────────
const TaskRow = ({ task, onClaim, onDone, currentUserId, onClick, isSelected }) => {
  const T  = useT();
  const st = STATUS[task.status] || STATUS.open;
  const canClaim = task.status === 'open' && task.assigneeType === 'group';
  const canDone  = task.status !== 'done' &&
    (String(task.claimedBy) === String(currentUserId) ||
     String(task.createdBy) === String(currentUserId));

  return (
    <Box
      onClick={onClick}
      sx={{ px: 2, py: 1.75,
        bgcolor: isSelected ? T.SEL_BG : T.CARD_BG,
        border: `1px solid ${isSelected ? T.SEL_BD : T.CARD_BD}`,
        borderRadius: '12px',
        display: 'flex', gap: 2, alignItems: 'flex-start',
        cursor: 'pointer',
        '&:hover': { borderColor: isSelected ? T.SEL_BD : T.HVR_BD },
        transition: 'border-color 0.15s, background-color 0.15s',
      }}>

      <AssignmentIcon sx={{ fontSize: 18, color: st.color, flexShrink: 0, mt: 0.2 }} />

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: T.TEXT_PRI, lineHeight: 1.4 }}>
          {task.title}
        </Typography>
        {task.description && (
          <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC, mt: 0.25, lineHeight: 1.4 }} noWrap>
            {task.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            {task.assigneeType === 'group'
              ? <GroupsIcon sx={{ fontSize: 12, color: T.TEXT_TER }} />
              : <PersonIcon  sx={{ fontSize: 12, color: T.TEXT_TER }} />
            }
            {(task.assignedUserName || task.assignedGroupName) && (
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
                {task.assignedUserName || task.assignedGroupName}
              </Typography>
            )}
          </Box>
          {task.createdByName && (
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>by {task.createdByName}</Typography>
          )}
          <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>· {relTime(task.insertDate)}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
        <Chip label={st.label} size="small" sx={{
          height: 20, fontSize: '0.68rem', fontWeight: 600, borderRadius: '4px',
          bgcolor: st.bg, color: st.color, border: `1px solid ${st.color}30`,
          '& .MuiChip-label': { px: 0.75 },
        }} />

        <Can permission="tasks:respond">
          {canClaim && (
            <IconButton size="small"
              onClick={(e) => { e.stopPropagation(); onClaim(task._id); }}
              sx={{ color: T.TEXT_TER, '&:hover': { color: '#64B5F6', bgcolor: 'rgba(100,181,246,0.08)' } }}>
              <PlayArrowIcon sx={{ fontSize: 15 }} />
            </IconButton>
          )}
          {canDone && (
            <IconButton size="small"
              onClick={(e) => { e.stopPropagation(); onDone(task._id); }}
              sx={{ color: T.TEXT_TER, '&:hover': { color: '#81C784', bgcolor: 'rgba(129,199,132,0.08)' } }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />
            </IconButton>
          )}
        </Can>
      </Box>
    </Box>
  );
};

// ── Main TaskList component ────────────────────────────────────────────────────
const TaskList = ({ onSelect = null, selectedId = null, refreshKey = 0 }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const T           = useT();

  // Must be before useState so maxScope is defined for the initial state
  const { scopeFor }  = usePermissions();
  const currentUserId = authCtx.decode?.id;
  const SCOPE_RANK    = { mine: 1, group: 2, all: 3 };
  const maxScope      = scopeFor('tasks');   // 'mine' | 'group' | 'all'

  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [scope,    setScope]    = useState(maxScope);
  const [formOpen, setFormOpen] = useState(false);

  // Sync scope ceiling when permissions finish loading
  useEffect(() => {
    setScope(prev => {
      const prevRank = SCOPE_RANK[prev] || 3;
      const maxRank  = SCOPE_RANK[maxScope] || 3;
      return prevRank <= maxRank ? prev : maxScope;
    });
  }, [maxScope]); // eslint-disable-line react-hooks/exhaustive-deps

  const scopeOptions = [
    { id: 'mine',  label: 'Mine'  },
    { id: 'group', label: 'Group' },
    { id: 'all',   label: 'All'   },
  ].filter(s => (SCOPE_RANK[s.id] || 3) <= (SCOPE_RANK[maxScope] || 3));

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { scope };
      if (filter !== 'all') params.status = filter;
      const res = await authCtx.jwtInst({
        method: 'get', url: `${axiosGlobal.defaultTargetApi}/tasks`, params,
      });
      setTasks(res.data.data || []);
    } catch {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load tasks', type: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [filter, scope]);

  useEffect(() => { fetchTasks(); }, [fetchTasks, refreshKey]);

  const handleClaim = async (taskId) => {
    try {
      await authCtx.jwtInst({ method: 'put', url: `${axiosGlobal.defaultTargetApi}/tasks/${taskId}/claim` });
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Task claimed', type: 'success' }));
      fetchTasks();
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed', type: 'error' }));
    }
  };

  const handleDone = async (taskId) => {
    try {
      await authCtx.jwtInst({ method: 'put', url: `${axiosGlobal.defaultTargetApi}/tasks/${taskId}/done` });
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Task marked done', type: 'success' }));
      fetchTasks();
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed', type: 'error' }));
    }
  };

  return (
    <Box>
      {/* Header row: scope toggle + new task button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        {/* Scope toggle */}
        <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
          {scopeOptions.map(s => (
            <Pill key={s.id} active={scope === s.id} onClick={() => setScope(s.id)} T={T}>
              {s.label}
            </Pill>
          ))}
        </Box>
        <Can permission="tasks:create">
          <Button size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />}
            onClick={() => setFormOpen(true)}
            sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 600, borderRadius: '8px', px: 2, py: '5px',
              fontSize: '0.78rem', textTransform: 'none',
              '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
            Assign
          </Button>
        </Can>
      </Box>

      {/* Status filter pills */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
        {['all', 'open', 'claimed', 'done'].map(f => (
          <Pill key={f} active={filter === f} onClick={() => setFilter(f)} T={T}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Pill>
        ))}
      </Box>

      {/* Scope hint */}
      {scope !== 'all' && (
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mb: 1.5 }}>
          {scope === 'mine'  ? 'Showing tasks assigned to you or created by you' : 'Showing tasks assigned to your groups'}
        </Typography>
      )}

      {/* Task list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={24} sx={{ color: T.TEXT_TER }} />
        </Box>
      ) : tasks.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 1 }}>
          <AssignmentIcon sx={{ fontSize: 32, color: T.TEXT_TER }} />
          <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_TER }}>
            {filter === 'all' ? 'No tasks' : `No ${filter} tasks`}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {tasks.map(task => (
            <TaskRow
              key={String(task._id)}
              task={task}
              onClaim={handleClaim}
              onDone={handleDone}
              currentUserId={currentUserId}
              isSelected={String(task._id) === String(selectedId)}
              onClick={() => onSelect && onSelect(task)}
            />
          ))}
        </Box>
      )}

      <TaskAssignDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={fetchTasks}
      />
    </Box>
  );
};

export default TaskList;
