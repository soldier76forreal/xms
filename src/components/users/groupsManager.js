import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { Can } from '../../contextApi/PermissionContext';

const useT = () => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    CARD_BG:   isDark ? '#111111'                : theme.palette.background.paper,
    CARD_BD:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    HVR_BD:    isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.18)',
    HVR_BG:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    MBR_BG:    isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    SEL_BG:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    SEL_BD:    isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)',
    BTN_BG:    isDark ? '#ffffff'                : '#000000',
    BTN_CLR:   isDark ? '#000000'                : '#ffffff',
    ERR_CLR:   '#FF4D8D',
    DIALOG_BG: isDark ? '#0d0d0d'               : theme.palette.background.paper,
    AVATAR_BG: isDark ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.08)',
    isDark,
  };
};

const getInitials = (u) =>
  ((u.firstName || '').charAt(0) + (u.lastName || '').charAt(0)).toUpperCase() || '?';

// ── GroupForm ─────────────────────────────────────────────────────────────────
const GroupForm = ({ open, onClose, onSave, group }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const { t }       = useTranslation();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const T           = useT();

  const isNew = !group;

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI,
      '& fieldset':             { borderColor: T.INPUT_BD },
      '&:hover fieldset':       { borderColor: T.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.3)' },
      '&.Mui-focused fieldset': { borderColor: T.isDark ? '#ffffff' : '#000000', borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root':             { color: T.TEXT_SEC },
    '& .MuiInputLabel-root.Mui-focused': { color: T.TEXT_PRI },
    '& input':    { color: T.TEXT_PRI },
    '& textarea': { color: T.TEXT_PRI },
  };

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [members,     setMembers]     = useState([]);
  const [admins,      setAdmins]      = useState([]); // array of userId strings
  const [userSearch,  setUserSearch]  = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!open) return;
    setError(''); setUserSearch(''); setUserResults([]);
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setMembers(group._membersPopulated || []);
      setAdmins((group.admins || []).map(String));
    } else {
      setName(''); setDescription(''); setMembers([]); setAdmins([]);
    }
  }, [open, group]);

  useEffect(() => {
    if (!userSearch.trim()) { setUserResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await authCtx.jwtInst({
          method: 'get', url: `${axiosGlobal.defaultTargetApi}/users`,
          params: { search: userSearch, limit: 8 },
        });
        const currentIds = new Set(members.map(m => String(m._id)));
        setUserResults((res.data.data || []).filter(u => !currentIds.has(String(u._id))));
      } catch { setUserResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [userSearch, members]);

  const addMember = (u) => { setMembers(prev => [...prev, u]); setUserSearch(''); setUserResults([]); };
  const removeMember = (id) => {
    setMembers(prev => prev.filter(m => String(m._id) !== String(id)));
    setAdmins(prev => prev.filter(a => a !== String(id)));
  };
  const toggleAdmin = (id) => {
    const sid = String(id);
    setAdmins(prev => prev.includes(sid) ? prev.filter(a => a !== sid) : [...prev, sid]);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError(t('users.groupNameRequired')); return; }
    setSaving(true); setError('');
    try {
      const data = {
        name:        name.trim(),
        description: description.trim(),
        members:     members.map(m => m._id),
        admins:      admins,
      };
      if (isNew) {
        await authCtx.jwtInst({ method: 'post', url: `${axiosGlobal.defaultTargetApi}/groups`, data });
      } else {
        await authCtx.jwtInst({ method: 'put', url: `${axiosGlobal.defaultTargetApi}/groups/${group._id}`, data });
      }
      dispatch(actions.setShowSnackBar({ status: true, msg: isNew ? t('users.groupCreated') : t('users.groupUpdated'), type: 'success' }));
      onSave();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('users.failedSaveGroup'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open} onClose={onClose} fullScreen={isXs} maxWidth="sm" fullWidth
      PaperProps={{ sx: { bgcolor: T.DIALOG_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: isXs ? 0 : '14px', backgroundImage: 'none' } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {isNew ? t('users.newGroupHeader') : t('users.editGroupHeader', { name: group?.name })}
        </Typography>
        <IconButton onClick={onClose} size="small"
          sx={{ color: T.TEXT_SEC, '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField label={t('users.groupNameLabel')} size="small" fullWidth value={name}
          onChange={e => { setName(e.target.value); setError(''); }} sx={inputSx} />
        <TextField label={t('users.descriptionLabel')} size="small" fullWidth multiline rows={2} value={description}
          onChange={e => setDescription(e.target.value)} sx={inputSx} />

        <Divider sx={{ borderColor: T.DIVIDER }} />

        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1 }}>
          {t('users.membersCountLabel', { count: members.length })}
          {admins.length > 0 && (
            <Box component="span" sx={{ ml: 1, color: '#FFB74D' }}>
              {t('users.adminsCountSuffix', { count: admins.length })}
            </Box>
          )}
        </Typography>

        {/* Member list with admin toggle */}
        {members.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {members.map(m => {
              const isAdmin = admins.includes(String(m._id));
              return (
                <Box key={String(m._id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 1.5, py: 1, bgcolor: T.MBR_BG, borderRadius: '8px',
                  border: `1px solid ${isAdmin ? 'rgba(255,183,77,0.25)' : 'transparent'}` }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: T.AVATAR_BG,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
                    {getInitials(m)}
                  </Box>
                  <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_PRI, flexGrow: 1 }}>
                    {m.firstName} {m.lastName}
                    <Box component="span" sx={{ ml: 1, fontFamily: 'monospace', fontSize: '0.72rem', color: T.TEXT_TER }}>
                      {m.phoneNumber}
                    </Box>
                  </Typography>
                  {/* Admin toggle */}
                  <Tooltip title={isAdmin ? t('users.removeAdminRole') : t('users.makeGroupAdmin')} placement="top">
                    <IconButton size="small" onClick={() => toggleAdmin(m._id)}
                      sx={{ color: isAdmin ? '#FFB74D' : T.TEXT_TER,
                        '&:hover': { color: '#FFB74D', bgcolor: 'rgba(255,183,77,0.08)' } }}>
                      {isAdmin ? <StarIcon sx={{ fontSize: 15 }} /> : <StarBorderIcon sx={{ fontSize: 15 }} />}
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={() => removeMember(m._id)}
                    sx={{ color: T.TEXT_TER, '&:hover': { color: T.ERR_CLR, bgcolor: 'rgba(255,77,141,0.08)' } }}>
                    <RemoveCircleOutlineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Add member search */}
        <TextField size="small" fullWidth
          placeholder={t('users.searchAddMember')}
          value={userSearch}
          onChange={e => setUserSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {searching
                  ? <CircularProgress size={14} sx={{ color: T.TEXT_TER }} />
                  : <SearchIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />}
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI,
              '& fieldset': { borderColor: T.INPUT_BD },
              '&:hover fieldset': { borderColor: T.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.3)' },
              '&.Mui-focused fieldset': { borderColor: T.isDark ? '#ffffff' : '#000000', borderWidth: 1.5 },
            },
            '& input': { color: T.TEXT_PRI },
            '& input::placeholder': { color: T.TEXT_SEC, opacity: 1 },
          }}
        />

        {/* Search results */}
        {userResults.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: -1 }}>
            {userResults.map(u => (
              <Box key={String(u._id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5,
                px: 1.5, py: 0.75, borderRadius: '8px', cursor: 'pointer',
                '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}
                onClick={() => addMember(u)}>
                <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: T.AVATAR_BG,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.68rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
                  {getInitials(u)}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>{u.firstName} {u.lastName}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, fontFamily: 'monospace' }}>{u.phoneNumber}</Typography>
                </Box>
                <PersonAddIcon sx={{ fontSize: 15, color: T.TEXT_TER }} />
              </Box>
            ))}
          </Box>
        )}

        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
        <Button onClick={onClose}
          sx={{ color: T.TEXT_SEC, textTransform: 'none', '&:hover': { bgcolor: T.HVR_BG, color: T.TEXT_PRI } }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, borderRadius: '8px', px: 3, textTransform: 'none',
            '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' },
            '&.Mui-disabled': { bgcolor: T.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: T.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)' } }}>
          {saving ? t('users.saving') : isNew ? t('users.create') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main GroupsManager ────────────────────────────────────────────────────────
const GroupsManager = ({ onSelect = null, selectedId = null }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const T           = useT();
  const { t }       = useTranslation();

  const [groups,    setGroups]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [formOpen,  setFormOpen]  = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/groups` });
      const raw = res.data || [];
      const enriched = await Promise.all(raw.map(async (g) => {
        if (!g.members || g.members.length === 0) return { ...g, _membersPopulated: [] };
        try {
          const memberIds = g.members.map(String);
          const usersRes  = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/users`, params: { limit: 200 } });
          const populated = (usersRes.data.data || []).filter(u => memberIds.includes(String(u._id)));
          return { ...g, _membersPopulated: populated };
        } catch { return { ...g, _membersPopulated: [] }; }
      }));
      setGroups(enriched);
    } catch {
      dispatch(actions.setShowSnackBar({ status: true, msg: t('users.failedLoadGroups'), type: 'error' }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleDelete = async (group) => {
    if (!window.confirm(t('users.deleteGroupConfirm', { name: group.name }))) return;
    setDeleting(group._id);
    try {
      await authCtx.jwtInst({ method: 'delete', url: `${axiosGlobal.defaultTargetApi}/groups/${group._id}` });
      dispatch(actions.setShowSnackBar({ status: true, msg: t('users.groupDeleted'), type: 'success' }));
      fetchGroups();
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || t('users.failedDelete'), type: 'error' }));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress size={26} sx={{ color: T.TEXT_TER }} />
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER }}>
          {t('users.groupCount', { count: groups.length })}
        </Typography>
        <Can permission="users:group:edit">
          <Button size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />}
            onClick={() => { setEditGroup(null); setFormOpen(true); }}
            sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 600, borderRadius: '8px', px: 2, py: '5px',
              fontSize: '0.78rem', textTransform: 'none',
              '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
            {t('users.newGroup')}
          </Button>
        </Can>
      </Box>

      {groups.length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: T.TEXT_SEC, py: 6, fontSize: '0.875rem' }}>
          {t('users.noGroupsYet')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {groups.map(group => {
            const isSelected = String(group._id) === String(selectedId);
            const adminCount = (group.admins || []).length;
            return (
              <Box key={group._id}
                onClick={() => onSelect && onSelect(group)}
                sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                  bgcolor: isSelected ? T.SEL_BG : T.CARD_BG,
                  border: `1px solid ${isSelected ? T.SEL_BD : T.CARD_BD}`,
                  borderRadius: '12px', cursor: onSelect ? 'pointer' : 'default',
                  '&:hover': { borderColor: isSelected ? T.SEL_BD : T.HVR_BD },
                  transition: 'border-color 0.15s, background-color 0.15s' }}>

                <GroupsIcon sx={{ fontSize: 18, color: T.TEXT_TER, flexShrink: 0 }} />

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: T.TEXT_PRI }}>
                    {group.name}
                  </Typography>
                  {group.description && (
                    <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, lineHeight: 1.4 }}>
                      {group.description}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC }}>
                    {t('users.memberCountShort', { count: (group.members || []).length })}
                  </Typography>
                  {adminCount > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.25 }}>
                      <StarIcon sx={{ fontSize: 11, color: '#FFB74D' }} />
                      <Typography sx={{ fontSize: '0.65rem', color: '#FFB74D' }}>
                        {t('users.adminCountShort', { count: adminCount })}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Can permission="users:group:edit">
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <IconButton size="small"
                      onClick={(e) => { e.stopPropagation(); setEditGroup(group); setFormOpen(true); }}
                      sx={{ color: T.TEXT_TER, '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
                      <EditIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    <IconButton size="small" disabled={deleting === group._id}
                      onClick={(e) => { e.stopPropagation(); handleDelete(group); }}
                      sx={{ color: T.TEXT_TER, '&:hover': { color: T.ERR_CLR, bgcolor: 'rgba(255,77,141,0.08)' } }}>
                      {deleting === group._id
                        ? <CircularProgress size={13} sx={{ color: T.TEXT_TER }} />
                        : <DeleteIcon sx={{ fontSize: 15 }} />}
                    </IconButton>
                  </Box>
                </Can>
              </Box>
            );
          })}
        </Box>
      )}

      <GroupForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={fetchGroups}
        group={editGroup}
      />
    </Box>
  );
};

export default GroupsManager;
