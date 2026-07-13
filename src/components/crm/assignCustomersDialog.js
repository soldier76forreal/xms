import { useState, useContext, useEffect } from 'react';
import Dialog          from '@mui/material/Dialog';
import DialogTitle     from '@mui/material/DialogTitle';
import DialogContent   from '@mui/material/DialogContent';
import DialogActions   from '@mui/material/DialogActions';
import Box             from '@mui/material/Box';
import Typography      from '@mui/material/Typography';
import Button          from '@mui/material/Button';
import IconButton      from '@mui/material/IconButton';
import CloseIcon       from '@mui/icons-material/Close';
import TextField       from '@mui/material/TextField';
import Chip            from '@mui/material/Chip';
import Checkbox        from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar          from '@mui/material/Avatar';
import InputAdornment  from '@mui/material/InputAdornment';
import { useTheme, useMediaQuery } from '@mui/material';
import { useDispatch } from 'react-redux';

import PersonIcon   from '@mui/icons-material/Person';
import GroupsIcon   from '@mui/icons-material/Groups';
import SearchIcon   from '@mui/icons-material/Search';

import AuthContext  from '../authAndConnections/auth';
import AxiosGlobal  from '../authAndConnections/axiosGlobalUrl';
import { actions }  from '../../store/store';

const apiBase = process.env.REACT_APP_API_BASE_URL || 'https://api.lazulitemarble.com';

/**
 * Props:
 *   open, onClose, onSave
 *   customerIds        — pre-selected customer IDs (from CRM bulk-select). Empty = Users section mode.
 *   prefilledUserId    — when set, locks the assignee to this user (from Users section)
 *   prefilledUserName  — display name for the pre-filled user
 */
const AssignCustomersDialog = ({
  open, onClose, onSave,
  customerIds = [],
  prefilledUserId = null,
  prefilledUserName = '',
}) => {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const isXs    = useMediaQuery(theme.breakpoints.down('sm'));
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();

  const T = {
    CARD_BG:  isDark ? '#111'    : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    HOVER_BG: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    SEL_BG:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  };

  const isUserMode = Boolean(prefilledUserId);

  // ── Assignee state ────────────────────────────────────────────────────────
  const [assigneeType,  setAssigneeType]  = useState('user');
  const [title,         setTitle]         = useState('');
  const [description,   setDescription]   = useState('');
  const [userSearch,    setUserSearch]    = useState('');
  const [userResults,   setUserResults]   = useState([]);
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [groups,        setGroups]        = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [saving,        setSaving]        = useState(false);

  // ── Customer multi-select state ───────────────────────────────────────────
  const [allCustomers, setAllCustomers] = useState([]);
  const [custLoading,  setCustLoading]  = useState(false);
  const [custFilter,   setCustFilter]   = useState('');
  const [selectedIds,  setSelectedIds]  = useState(new Set());

  // effectiveIds always derived from the multi-select
  const effectiveIds = [...selectedIds];

  // ── Load customers on open ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setCustLoading(true);
      try {
        const res = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/crm/customers`,
          params: { limit: 500 },
        });
        setAllCustomers(res.data.data || []);
      } catch (_) {}
      setCustLoading(false);
    };
    load();
  }, [open, authCtx, axiosGlobal]);

  // ── Reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const defaultTitle = isUserMode
        ? 'CRM task'
        : `CRM — ${customerIds.length} customer${customerIds.length !== 1 ? 's' : ''}`;
      setTitle(defaultTitle);
      setAssigneeType('user');
      setSelectedUser(isUserMode ? { _id: prefilledUserId, firstName: prefilledUserName } : null);
      setSelectedGroup(null);
      setUserSearch('');
      setUserResults([]);
      setDescription('');
      setCustFilter('');
      setSelectedIds(new Set(customerIds.map(String)));
    }
  }, [open, customerIds, isUserMode, prefilledUserId, prefilledUserName]);

  // ── Load groups on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/groups` });
        setGroups(res.data || []);
      } catch (_) {}
    };
    load();
  }, [open, authCtx, axiosGlobal]);

  // ── Debounced user search ─────────────────────────────────────────────────
  useEffect(() => {
    if (assigneeType !== 'user' || !open) return;
    const t = setTimeout(async () => {
      if (!userSearch.trim()) { setUserResults([]); return; }
      try {
        const res = await authCtx.jwtInst({
          method: 'get', url: `${axiosGlobal.defaultTargetApi}/users`,
          params: { search: userSearch.trim(), limit: 8 },
        });
        setUserResults(res.data.data || res.data || []);
      } catch (_) {}
    }, 280);
    return () => clearTimeout(t);
  }, [userSearch, assigneeType, open, authCtx, axiosGlobal]);

  // ── Customer list helpers ─────────────────────────────────────────────────
  const custName = (c) => {
    const pi = c.personalInformation || {};
    return pi.companyName || `${pi.firstName || ''} ${pi.lastName || ''}`.trim() || c.phoneNumber || '—';
  };

  const filteredCustomers = allCustomers.filter(c => {
    if (!custFilter.trim()) return true;
    const q = custFilter.toLowerCase();
    return (
      custName(c).toLowerCase().includes(q) ||
      (c.phoneNumber || '').toLowerCase().includes(q)
    );
  });

  const toggleCustomer = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every(c => selectedIds.has(String(c._id)));

  const someFilteredSelected =
    filteredCustomers.some(c => selectedIds.has(String(c._id)));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredCustomers.forEach(c => next.delete(String(c._id)));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredCustomers.forEach(c => next.add(String(c._id)));
        return next;
      });
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) return;
    if (assigneeType === 'user'  && !selectedUser)  return;
    if (assigneeType === 'group' && !selectedGroup) return;
    if (effectiveIds.length === 0) return;

    setSaving(true);
    try {
      await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/crm/customers/bulk`,
        data: {
          action: 'assign',
          ids:    effectiveIds,
          title, description, assigneeType,
          assignedUser:  assigneeType === 'user'  ? selectedUser._id  : undefined,
          assignedGroup: assigneeType === 'group' ? selectedGroup._id : undefined,
        },
      });
      dispatch(actions.setShowSnackBar({
        status: true,
        msg: `Assigned ${effectiveIds.length} customer${effectiveIds.length !== 1 ? 's' : ''}`,
        type: 'success',
      }));
      onSave && onSave();
      onClose();
    } catch (err) {
      dispatch(actions.setShowSnackBar({
        status: true,
        msg: err?.response?.data?.message || 'Failed to assign',
        type: 'error',
      }));
    }
    setSaving(false);
  };

  const avatarSrc = (u) => u?.profileImage?.url ? `${apiBase}${u.profileImage.url}` : undefined;
  const userLabel = (u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.phoneNumber;
  const initials  = (u) => (userLabel(u)[0] || '?').toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isXs}
      PaperProps={{ sx: { bgcolor: T.CARD_BG, borderRadius: isXs ? 0 : '14px',
        border: `1px solid ${T.BD}`, backgroundImage: 'none' } }}>

      <DialogTitle sx={{ pb: 0, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: T.TEXT_PRI }}>
            {isUserMode
              ? `Assign customers to ${prefilledUserName || 'user'}`
              : 'Assign customers'}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mt: 0.25 }}>
            A task will be created and the assignee notified
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close"
          sx={{ color: T.TEXT_TER, mt: -0.5, mr: -0.5 }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5,
        overflowY: 'auto', flex: 1 }}>

        {/* ── Customer multi-select ── */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75, gap: 1 }}>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER,
              textTransform: 'uppercase', letterSpacing: '0.08em', flexGrow: 1 }}>
              Customers
            </Typography>
            {selectedIds.size > 0 && (
              <Chip label={`${selectedIds.size} selected`} size="small"
                sx={{ height: 20, fontSize: '0.68rem', borderRadius: '6px',
                  bgcolor: isDark ? 'rgba(100,181,246,0.12)' : 'rgba(33,150,243,0.1)',
                  color: '#64B5F6', fontWeight: 700,
                  '& .MuiChip-label': { px: 0.75 } }} />
            )}
          </Box>

          {/* Search filter */}
          <TextField
            placeholder="Filter customers…"
            size="small" fullWidth
            value={custFilter}
            onChange={e => setCustFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />
                </InputAdornment>
              ),
            }}
            sx={inputSx(T)}
          />

          {/* Select-all row */}
          {!custLoading && filteredCustomers.length > 0 && (
            <Box onClick={toggleAll}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5,
                px: 0.5, py: 0.25, borderRadius: '6px', cursor: 'pointer',
                '&:hover': { bgcolor: T.HOVER_BG } }}>
              <Checkbox
                size="small"
                checked={allFilteredSelected}
                indeterminate={someFilteredSelected && !allFilteredSelected}
                onChange={toggleAll}
                onClick={e => e.stopPropagation()}
                sx={{ p: 0.5, color: T.TEXT_TER,
                  '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: T.TEXT_PRI } }}
              />
              <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>
                {allFilteredSelected ? 'Deselect all' : `Select all${custFilter ? ' matching' : ''}`}
                {filteredCustomers.length !== allCustomers.length && (
                  <Box component="span" sx={{ color: T.TEXT_TER, ml: 0.5 }}>
                    ({filteredCustomers.length} of {allCustomers.length})
                  </Box>
                )}
              </Typography>
            </Box>
          )}

          {/* Scrollable customer list */}
          <Box sx={{ mt: 0.5, borderRadius: '10px', border: `1px solid ${T.BD}`,
            overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': { bgcolor: T.BD2, borderRadius: 2 },
          }}>
            {custLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={18} sx={{ color: T.TEXT_TER }} />
              </Box>
            ) : filteredCustomers.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER }}>
                  {allCustomers.length === 0 ? 'No customers found' : 'No matches'}
                </Typography>
              </Box>
            ) : (
              filteredCustomers.map((c, idx) => {
                const id       = String(c._id);
                const isChecked = selectedIds.has(id);
                const pi       = c.personalInformation || {};
                const name     = custName(c);
                const sub      = pi.companyName
                  ? `${pi.firstName || ''} ${pi.lastName || ''}`.trim()
                  : c.phoneNumber;
                return (
                  <Box key={id} onClick={() => toggleCustomer(id)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      px: 1.25, py: 0.6, cursor: 'pointer',
                      bgcolor: isChecked ? T.SEL_BG : 'transparent',
                      '&:hover': { bgcolor: isChecked ? T.SEL_BG : T.HOVER_BG },
                      borderBottom: idx < filteredCustomers.length - 1
                        ? `1px solid ${T.BD}` : 'none',
                    }}>
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      onChange={() => toggleCustomer(id)}
                      onClick={e => e.stopPropagation()}
                      sx={{ p: 0.25, flexShrink: 0, color: T.TEXT_TER,
                        '&.Mui-checked': { color: T.TEXT_PRI } }}
                    />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_PRI,
                        fontWeight: isChecked ? 600 : 400 }} noWrap>
                        {name}
                      </Typography>
                      {sub && (
                        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }} noWrap>
                          {sub}
                        </Typography>
                      )}
                    </Box>
                    {c.status && (
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        bgcolor: STATUS_COLOR[c.status] || T.TEXT_TER }} />
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* ── Task title ── */}
        <TextField label="Task title" size="small" fullWidth
          value={title} onChange={e => setTitle(e.target.value)}
          sx={inputSx(T)} InputLabelProps={{ sx: { fontSize: '0.8rem' } }} />

        {/* ── Description ── */}
        <TextField label="Notes (optional)" size="small" fullWidth multiline rows={2}
          value={description} onChange={e => setDescription(e.target.value)}
          sx={inputSx(T)} InputLabelProps={{ sx: { fontSize: '0.8rem' } }} />

        {/* ── Assignee type toggle — hidden when user is pre-filled ── */}
        {!isUserMode && (
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {[
              { id: 'user',  label: 'User',  Icon: PersonIcon  },
              { id: 'group', label: 'Group', Icon: GroupsIcon  },
            ].map(({ id, label, Icon }) => (
              <Chip key={id}
                icon={<Icon sx={{ fontSize: 14, color: assigneeType === id ? T.TEXT_PRI : T.TEXT_TER }} />}
                label={label}
                onClick={() => { setAssigneeType(id); setSelectedUser(null); setSelectedGroup(null); }}
                sx={{ height: 28, fontSize: '0.75rem', fontWeight: assigneeType === id ? 700 : 400,
                  borderRadius: '8px', cursor: 'pointer',
                  bgcolor:     assigneeType === id ? T.HOVER_BG : 'transparent',
                  border:      `1px solid ${assigneeType === id ? T.BD2 : T.BD}`,
                  color:       assigneeType === id ? T.TEXT_PRI : T.TEXT_TER,
                  '& .MuiChip-label': { pl: 0.5 },
                }} />
            ))}
          </Box>
        )}

        {/* ── User picker ── */}
        {assigneeType === 'user' && (
          <Box>
            {selectedUser ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1,
                px: 1.25, py: 1, borderRadius: '8px', border: `1px solid ${T.BD2}` }}>
                <Avatar src={avatarSrc(selectedUser)} sx={{ width: 28, height: 28, fontSize: '0.72rem',
                  bgcolor: T.CTRL_BG, color: T.TEXT_PRI }}>{initials(selectedUser)}</Avatar>
                <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_PRI, flexGrow: 1 }}>
                  {userLabel(selectedUser)}
                </Typography>
                {!isUserMode && (
                  <Button size="small" onClick={() => { setSelectedUser(null); setUserSearch(''); }}
                    sx={{ minWidth: 0, px: 0.75, py: 0.25, fontSize: '0.7rem', color: T.TEXT_TER,
                      textTransform: 'none', '&:hover': { color: T.TEXT_SEC } }}>
                    Change
                  </Button>
                )}
              </Box>
            ) : (
              <>
                <TextField placeholder="Search by name or phone…" size="small" fullWidth
                  value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  sx={inputSx(T)} />
                {userResults.length > 0 && (
                  <Box sx={{ mt: 0.5, borderRadius: '8px', border: `1px solid ${T.BD}`,
                    bgcolor: T.CARD_BG, overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
                    {userResults.map(u => (
                      <Box key={u._id}
                        onClick={() => { setSelectedUser(u); setUserSearch(''); setUserResults([]); }}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.25,
                          px: 1.5, py: 0.75, cursor: 'pointer',
                          '&:hover': { bgcolor: T.HOVER_BG },
                          '&:not(:last-child)': { borderBottom: `1px solid ${T.BD}` } }}>
                        <Avatar src={avatarSrc(u)} sx={{ width: 26, height: 26, fontSize: '0.68rem',
                          bgcolor: T.CTRL_BG, color: T.TEXT_PRI }}>{initials(u)}</Avatar>
                        <Box>
                          <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>{userLabel(u)}</Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>{u.phoneNumber}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* ── Group picker ── */}
        {assigneeType === 'group' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {groups.length === 0 ? (
              <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, textAlign: 'center', py: 2 }}>
                No groups found
              </Typography>
            ) : groups.map(g => (
              <Box key={g._id} onClick={() => setSelectedGroup(g)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.25,
                  px: 1.25, py: 0.75, borderRadius: '8px', cursor: 'pointer',
                  border: `1px solid ${selectedGroup?._id === g._id ? T.BD2 : T.BD}`,
                  bgcolor: selectedGroup?._id === g._id ? T.HOVER_BG : 'transparent',
                  '&:hover': { bgcolor: T.HOVER_BG } }}>
                <GroupsIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, fontWeight: 600 }}>{g.name}</Typography>
                  {g.members?.length > 0 && (
                    <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
                      {g.members.length} member{g.members.length !== 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>
                {selectedGroup?._id === g._id && (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#64B5F6' }} />
                )}
              </Box>
            ))}
          </Box>
        )}

      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} size="small"
          sx={{ color: T.TEXT_SEC, textTransform: 'none', fontSize: '0.8rem' }}>
          Cancel
        </Button>
        <Button variant="contained" size="small" onClick={handleSave}
          disabled={
            saving ||
            !title.trim() ||
            effectiveIds.length === 0 ||
            (assigneeType === 'user'  && !selectedUser) ||
            (assigneeType === 'group' && !selectedGroup)
          }
          sx={{ textTransform: 'none', fontSize: '0.8rem', borderRadius: '8px',
            minWidth: 80, position: 'relative',
            bgcolor: T.TEXT_PRI, color: T.CARD_BG,
            '&:hover': { bgcolor: T.TEXT_SEC },
            '&:disabled': { opacity: 0.4 } }}>
          {saving
            ? <CircularProgress size={16} sx={{ color: 'inherit' }} />
            : `Assign${effectiveIds.length > 0 ? ` (${effectiveIds.length})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const STATUS_COLOR = {
  new:       '#64B5F6',
  active:    '#81C784',
  follow_up: '#FFB74D',
  won:       '#4DB6AC',
  lost:      'rgba(255,255,255,0.2)',
};

function inputSx(T) {
  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px', fontSize: '0.82rem',
      bgcolor: T.CTRL_BG,
      '& fieldset': { borderColor: T.BD },
      '&:hover fieldset': { borderColor: T.BD2 },
      '&.Mui-focused fieldset': { borderColor: T.TEXT_PRI, borderWidth: '2px' },
    },
    '& .MuiOutlinedInput-input': { color: T.TEXT_PRI },
    '& .MuiInputLabel-root': { color: T.TEXT_TER },
    '& .MuiInputLabel-root.Mui-focused': { color: T.TEXT_PRI },
  };
}

export default AssignCustomersDialog;
