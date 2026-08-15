import { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupsIcon from '@mui/icons-material/Groups';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { Can } from '../../contextApi/PermissionContext';
import UserAvatar from '../main/userAvatar';

const STATUS = {
  open:    { labelKey: 'users.taskStatusOpen',    color: '#64B5F6', bg: 'rgba(100,181,246,0.12)' },
  claimed: { labelKey: 'users.taskStatusClaimed', color: '#FFB74D', bg: 'rgba(255,183,77,0.12)'  },
  done:    { labelKey: 'users.taskStatusDone',    color: '#81C784', bg: 'rgba(129,199,132,0.12)' },
};

const relTime = (d, t) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m  = Math.floor(diff / 60000);
  const h  = Math.floor(diff / 3600000);
  const dy = Math.floor(diff / 86400000);
  if (m < 1)   return t('users.justNow');
  if (m < 60)  return t('users.minutesAgo', { count: m });
  if (h < 24)  return t('users.hoursAgo', { count: h });
  return t('users.daysAgo', { count: dy });
};

const useT = () => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:  isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    ROW_BG:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    ROW_BD:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BTN_BG:   isDark ? '#ffffff'                : '#000000',
    BTN_CLR:  isDark ? '#000000'                : '#ffffff',
    isDark,
  };
};

const InfoRow = ({ label, value, T }) => (
  <Box sx={{ display: 'flex', gap: 1.5, py: 0.875, borderBottom: `1px solid ${T.DIVIDER}` }}>
    <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, width: 80, flexShrink: 0,
      textTransform: 'uppercase', letterSpacing: 0.6, pt: '1px' }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC, lineHeight: 1.5 }}>
      {value}
    </Typography>
  </Box>
);

const TaskPanel = ({ task: initialTask, currentUserId, onUpdate }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const T           = useT();
  const { t }       = useTranslation();

  const [task,    setTask]    = useState(initialTask);
  const [loading, setLoading] = useState(false);

  // Sync when parent passes a new task (tab switch / selection change)
  if (task._id !== initialTask._id) setTask(initialTask);

  const st         = STATUS[task.status] || STATUS.open;
  const canClaim   = task.status === 'open' && task.assigneeType === 'group';
  const canDone    = task.status !== 'done' &&
    (String(task.claimedBy) === String(currentUserId) ||
     String(task.createdBy) === String(currentUserId));

  const doAction = async (endpoint) => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/tasks/${task._id}/${endpoint}`,
      });
      const updated = { ...task, ...res.data?.data, assignedUserName: task.assignedUserName, assignedGroupName: task.assignedGroupName };
      setTask(updated);
      dispatch(actions.setShowSnackBar({ status: true, msg: endpoint === 'claim' ? t('users.taskClaimed') : t('users.taskMarkedDone'), type: 'success' }));
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || t('users.actionFailed'), type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px',
          bgcolor: T.ROW_BG, border: `1px solid ${T.ROW_BD}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AssignmentIcon sx={{ fontSize: 22, color: st.color }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: T.TEXT_PRI, lineHeight: 1.35 }}>
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip label={t(st.labelKey)} size="small" sx={{
              height: 20, fontSize: '0.68rem', fontWeight: 700, borderRadius: '4px',
              bgcolor: st.bg, color: st.color, border: `1px solid ${st.color}40`,
              '& .MuiChip-label': { px: 0.75 },
            }} />
            <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
              {relTime(task.insertDate, t)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Description */}
      {task.description && (
        <Box sx={{ p: 2, bgcolor: T.ROW_BG, borderRadius: '10px', mb: 3 }}>
          <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC, lineHeight: 1.6 }}>
            {task.description}
          </Typography>
        </Box>
      )}

      {/* Details */}
      <Box sx={{ mb: 3 }}>
        <InfoRow label={t('users.taskAssigned')} T={T}
          value={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {task.assigneeType === 'group'
                ? <GroupsIcon sx={{ fontSize: 14, color: T.TEXT_TER }} />
                : <UserAvatar userId={task.assignedUser} size={18} fontSize="0.6rem" />
              }
              <span>{task.assignedUserName || task.assignedGroupName || '—'}</span>
            </Box>
          }
        />
        <InfoRow label={t('users.taskCreatedBy')} T={T}
          value={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <UserAvatar userId={task.createdBy} size={18} fontSize="0.6rem" />
              <span>{task.createdByName || '—'}</span>
            </Box>
          }
        />
        {task.claimedByName && task.status !== 'open' && (
          <InfoRow label={t('users.taskClaimedBy')} T={T}
            value={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <UserAvatar userId={task.claimedBy} size={18} fontSize="0.6rem" />
                <span>{task.claimedByName}</span>
              </Box>
            }
          />
        )}
        <InfoRow label={t('users.taskCreated')} T={T} value={task.insertDate ? new Date(task.insertDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
      </Box>

      {/* Actions */}
      <Can permission="tasks:respond">
        {(canClaim || canDone) && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canClaim && (
              <Button
                variant="outlined" size="small" disabled={loading}
                startIcon={loading ? <CircularProgress size={13} color="inherit" /> : <PlayArrowIcon sx={{ fontSize: 15 }} />}
                onClick={() => doAction('claim')}
                sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.8rem', fontWeight: 600,
                  color: '#64B5F6', borderColor: 'rgba(100,181,246,0.4)',
                  '&:hover': { bgcolor: 'rgba(100,181,246,0.08)', borderColor: '#64B5F6' } }}>
                {t('users.taskClaim')}
              </Button>
            )}
            {canDone && (
              <Button
                variant="outlined" size="small" disabled={loading}
                startIcon={loading ? <CircularProgress size={13} color="inherit" /> : <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />}
                onClick={() => doAction('done')}
                sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.8rem', fontWeight: 600,
                  color: '#81C784', borderColor: 'rgba(129,199,132,0.4)',
                  '&:hover': { bgcolor: 'rgba(129,199,132,0.08)', borderColor: '#81C784' } }}>
                {t('users.taskMarkDone')}
              </Button>
            )}
          </Box>
        )}
      </Can>
    </Box>
  );
};

export default TaskPanel;
