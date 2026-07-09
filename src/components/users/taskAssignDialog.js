import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Autocomplete from '@mui/material/Autocomplete';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import { useTheme, useMediaQuery } from '@mui/material';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// tokens derived inside component via useTheme()

const TaskAssignDialog = ({ open, onClose, onSave, prefillUserId = null }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark      = theme.palette.mode === 'dark';

  const CARD_BD  = isDark ? 'rgba(255,255,255,0.07)'  : theme.palette.divider;
  const INPUT_BG = isDark ? 'rgba(255,255,255,0.05)'  : 'rgba(0,0,0,0.03)';
  const INPUT_BD = isDark ? 'rgba(255,255,255,0.1)'   : theme.palette.divider;
  const TEXT_PRI = isDark ? '#ffffff'                  : theme.palette.text.primary;
  const TEXT_SEC = isDark ? 'rgba(255,255,255,0.45)'  : theme.palette.text.secondary;
  const TEXT_TER = isDark ? 'rgba(255,255,255,0.2)'   : 'rgba(0,0,0,0.3)';
  const DIVIDER  = isDark ? 'rgba(255,255,255,0.07)'  : theme.palette.divider;
  const ERR_CLR  = '#FF4D8D';
  const CARD_BG  = isDark ? '#0d0d0d'                 : theme.palette.background.paper;
  const MENU_BG  = isDark ? '#181818'                 : '#ffffff';
  const BTN_BG   = isDark ? '#ffffff'                 : '#000000';
  const BTN_CLR  = isDark ? '#000000'                 : '#ffffff';
  const HVR_BG   = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.04)';
  const SEL_BG   = isDark ? 'rgba(255,255,255,0.1)'   : 'rgba(0,0,0,0.08)';
  const SEL_BD   = isDark ? 'rgba(255,255,255,0.2)'   : 'rgba(0,0,0,0.2)';

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: INPUT_BG, borderRadius: '10px', color: TEXT_PRI,
      '& fieldset':             { borderColor: INPUT_BD },
      '&:hover fieldset':       { borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.3)' },
      '&.Mui-focused fieldset': { borderColor: isDark ? '#ffffff' : '#000000', borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root':             { color: TEXT_SEC },
    '& .MuiInputLabel-root.Mui-focused': { color: TEXT_PRI },
    '& input':    { color: TEXT_PRI },
    '& textarea': { color: TEXT_PRI },
  };

  const [title,        setTitle]       = useState('');
  const [description,  setDescription] = useState('');
  const [assigneeType, setAssigneeType]= useState('user');
  const [users,        setUsers]       = useState([]);
  const [groups,       setGroups]      = useState([]);
  const [selectedUser, setSelectedUser]= useState(null);
  const [selectedGroup,setSelectedGroup]=useState(null);
  const [saving,       setSaving]      = useState(false);
  const [error,        setError]       = useState('');

  // Reset form on open
  useEffect(() => {
    if (!open) return;
    setTitle(''); setDescription(''); setAssigneeType('user');
    setSelectedUser(null); setSelectedGroup(null); setError('');
    fetchMeta();
  }, [open]);

  const fetchMeta = useCallback(async () => {
    const [usersRes, groupsRes] = await Promise.allSettled([
      authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/users`, params: { limit: 200 } }),
      authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/groups` }),
    ]);
    const fetchedUsers = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data || []) : [];
    setUsers(fetchedUsers);
    setGroups(groupsRes.status === 'fulfilled' ? (groupsRes.value.data || []) : []);

    // Pre-fill if a userId was given (e.g. from user detail page)
    if (prefillUserId) {
      const found = fetchedUsers.find(u => String(u._id) === String(prefillUserId));
      if (found) { setSelectedUser(found); setAssigneeType('user'); }
    }
  }, [prefillUserId]);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (assigneeType === 'user'  && !selectedUser)  { setError('Select a user');  return; }
    if (assigneeType === 'group' && !selectedGroup) { setError('Select a group'); return; }

    setSaving(true); setError('');
    try {
      await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/tasks`,
        data: {
          title: title.trim(),
          description: description.trim(),
          assigneeType,
          assignedUser:  assigneeType === 'user'  ? selectedUser?._id  : undefined,
          assignedGroup: assigneeType === 'group' ? selectedGroup?._id : undefined,
        },
      });
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Task assigned', type: 'success' }));
      if (onSave) onSave();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to assign task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open} onClose={onClose} fullScreen={isXs} maxWidth="sm" fullWidth
      PaperProps={{ sx: { bgcolor: CARD_BG, border: `1px solid ${CARD_BD}`, borderRadius: isXs ? 0 : '14px', backgroundImage: 'none' } }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: `1px solid ${DIVIDER}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: TEXT_PRI }}>Assign Task</Typography>
        <IconButton onClick={onClose} size="small"
          sx={{ color: TEXT_SEC, '&:hover': { color: TEXT_PRI, bgcolor: 'rgba(255,255,255,0.06)' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Title */}
        <TextField
          label="Task title" size="small" fullWidth value={title}
          onChange={e => { setTitle(e.target.value); setError(''); }}
          sx={inputSx}
        />

        {/* Description */}
        <TextField
          label="Description (optional)" size="small" fullWidth multiline rows={2}
          value={description} onChange={e => setDescription(e.target.value)}
          sx={inputSx}
        />

        {/* Assignee type toggle */}
        <Box>
          <Typography sx={{ fontSize: '0.68rem', color: TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
            Assign to
          </Typography>
          <ToggleButtonGroup
            value={assigneeType} exclusive
            onChange={(_, val) => val && setAssigneeType(val)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: TEXT_SEC, borderColor: CARD_BD, textTransform: 'none', fontSize: '0.8rem',
                '&.Mui-selected': { color: TEXT_PRI, bgcolor: SEL_BG, borderColor: SEL_BD },
                '&:hover': { bgcolor: HVR_BG },
              },
            }}
          >
            <ToggleButton value="user">
              <PersonIcon sx={{ fontSize: 16, mr: 0.75 }} /> User
            </ToggleButton>
            <ToggleButton value="group">
              <GroupsIcon sx={{ fontSize: 16, mr: 0.75 }} /> Group
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* User picker */}
        {assigneeType === 'user' && (
          <Autocomplete
            size="small"
            options={users}
            value={selectedUser}
            onChange={(_, val) => { setSelectedUser(val); setError(''); }}
            getOptionLabel={u => `${u.firstName} ${u.lastName} · ${u.phoneNumber}`}
            isOptionEqualToValue={(a, b) => String(a._id) === String(b._id)}
            renderInput={(params) => (
              <TextField {...params} label="Select user" sx={inputSx}
                InputProps={{ ...params.InputProps, style: { color: TEXT_PRI } }}
              />
            )}
            PaperComponent={({ children }) => (
              <Box sx={{ bgcolor: MENU_BG, border: `1px solid ${CARD_BD}`, borderRadius: '10px', mt: 0.5 }}>
                {children}
              </Box>
            )}
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: TEXT_SEC },
              '& .MuiAutocomplete-clearIndicator': { color: TEXT_SEC },
            }}
          />
        )}

        {/* Group picker */}
        {assigneeType === 'group' && (
          <Autocomplete
            size="small"
            options={groups}
            value={selectedGroup}
            onChange={(_, val) => { setSelectedGroup(val); setError(''); }}
            getOptionLabel={g => g.name || ''}
            isOptionEqualToValue={(a, b) => String(a._id) === String(b._id)}
            renderInput={(params) => (
              <TextField {...params} label="Select group" sx={inputSx}
                InputProps={{ ...params.InputProps, style: { color: TEXT_PRI } }}
              />
            )}
            PaperComponent={({ children }) => (
              <Box sx={{ bgcolor: MENU_BG, border: `1px solid ${CARD_BD}`, borderRadius: '10px', mt: 0.5 }}>
                {children}
              </Box>
            )}
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: TEXT_SEC },
              '& .MuiAutocomplete-clearIndicator': { color: TEXT_SEC },
            }}
          />
        )}

        {error && <Typography sx={{ fontSize: '0.82rem', color: ERR_CLR }}>{error}</Typography>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
        <Button onClick={onClose}
          sx={{ color: TEXT_SEC, textTransform: 'none', '&:hover': { bgcolor: HVR_BG, color: TEXT_PRI } }}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ bgcolor: BTN_BG, color: BTN_CLR, fontWeight: 700, borderRadius: '8px', px: 3,
            textTransform: 'none', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' },
            '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)' } }}>
          {saving ? 'Assigning…' : 'Assign Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskAssignDialog;
