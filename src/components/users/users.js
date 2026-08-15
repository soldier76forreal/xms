import { useState, useEffect, useContext, useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ShieldIcon from '@mui/icons-material/Shield';
import GroupsIcon from '@mui/icons-material/Groups';
import StoreIcon from '@mui/icons-material/Store';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { Can, usePermissions } from '../../contextApi/PermissionContext';
import UserCard from './userCard';
import ShowUser from './showUser';
import UserForm from './userForm';
import RolesManager from './rolesManager';
import GroupsManager from './groupsManager';
import BranchesManager from './branchesManager';
import TaskList from './taskList';
import RolePanel from './rolePanel';
import GroupPanel from './groupPanel';
import TaskPanel from './taskPanel';

// ── Theme-derived tokens ──────────────────────────────────────────────────────
const useT = () => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    BG:       isDark ? '#060606'                 : theme.palette.background.default,
    CARD_BG:  isDark ? '#111111'                 : theme.palette.background.paper,
    CARD_BD:  isDark ? 'rgba(255,255,255,0.07)'  : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff'                 : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)'  : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'   : 'rgba(0,0,0,0.3)',
    DIVIDER:  isDark ? 'rgba(255,255,255,0.07)'  : theme.palette.divider,
    INPUT_BG: isDark ? 'rgba(255,255,255,0.04)'  : 'rgba(0,0,0,0.03)',
    INPUT_BD: isDark ? 'rgba(255,255,255,0.1)'   : theme.palette.divider,
    BTN_BG:   isDark ? '#ffffff'                 : '#000000',
    BTN_CLR:  isDark ? '#000000'                 : '#ffffff',
    isDark,
  };
};

// ── Tab button ────────────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, children, T }) => (
  <Button size="small" onClick={onClick}
    sx={{
      fontWeight: active ? 700 : 400, fontSize: '0.82rem', textTransform: 'none',
      borderRadius: '8px', px: 2, py: '5px',
      color: active ? T.TEXT_PRI : T.TEXT_SEC,
      bgcolor: active ? (T.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)') : 'transparent',
      border: active ? `1px solid ${T.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}` : '1px solid transparent',
      '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)', color: T.TEXT_PRI },
      transition: 'all 0.12s',
    }}>
    {children}
  </Button>
);

// ── Empty right-panel placeholder ─────────────────────────────────────────────
const EMPTY_ICONS = {
  users:    PeopleAltIcon,
  roles:    ShieldIcon,
  groups:   GroupsIcon,
  branches: StoreIcon,
  tasks:    AssignmentIcon,
};
const EMPTY_LABEL_KEYS = {
  users:    'users.selectUserToViewDetails',
  roles:    'users.selectRoleToViewPerms',
  groups:   'users.selectGroupToViewMembers',
  branches: 'users.branchesEmptyHint',
  tasks:    'users.selectTaskToViewDetails',
};
const EmptyPanel = ({ tab, T }) => {
  const { t } = useTranslation();
  const Icon = EMPTY_ICONS[tab] || PeopleAltIcon;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 1.5, opacity: 0.35, p: 4 }}>
      <Icon sx={{ fontSize: 42, color: T.TEXT_TER }} />
      <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC, textAlign: 'center' }}>
        {t(EMPTY_LABEL_KEYS[tab])}
      </Typography>
    </Box>
  );
};

// ── My Profile card ───────────────────────────────────────────────────────────
const MyProfileCard = ({ user, apiBase, selected, onClick, T }) => {
  const { t } = useTranslation();
  const isDark = T.isDark;
  const initials = ((user.firstName || '')[0] || '') + ((user.lastName || '')[0] || '') || '?';
  return (
    <Box onClick={onClick} sx={{
      display: 'flex', alignItems: 'center', gap: 1.5,
      px: 1.75, py: 1.25, borderRadius: '12px', cursor: 'pointer',
      mb: 0.5,
      border: `1.5px solid ${selected
        ? (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)')
        : (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)')}`,
      bgcolor: selected
        ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
        : (isDark ? 'rgba(255,255,255,0.02)' : '#fff'),
      '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' },
      transition: 'all 0.12s',
    }}>
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '50%',
          bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, overflow: 'hidden',
        }}>
          {user.profileImage?.url
            ? <img src={`${apiBase}${user.profileImage.url}`} alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </Box>
        <Box sx={{
          position: 'absolute', bottom: 1, right: 1, width: 9, height: 9,
          borderRadius: '50%', border: `1.5px solid ${isDark ? '#111' : '#fff'}`,
          bgcolor: user.isOnline ? '#4CAF50' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
        }} />
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.TEXT_PRI, lineHeight: 1.3 }}>
          {t('users.myProfileLabel')}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }} noWrap>
          {user.firstName} {user.lastName}
        </Typography>
      </Box>
      <AccountCircleIcon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />
    </Box>
  );
};

// ── User list view ────────────────────────────────────────────────────────────
const UserListView = ({ socket, onSelect, selectedId }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const apiBase     = axiosGlobal.defaultTargetApi;
  const T           = useT();
  const { t }       = useTranslation();
  const currentUserId = String(authCtx.decode?.id || authCtx.decode?._id || '');

  const [users,           setUsers]           = useState([]);
  const [selfUser,        setSelfUser]        = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [total,           setTotal]           = useState(0);
  const [formOpen,        setFormOpen]        = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/users`,
        params: { search: debouncedSearch },
      });
      const all = res.data.data || [];
      const self = all.find(u => String(u._id) === currentUserId);
      if (self) setSelfUser(self);
      setUsers(all.filter(u => String(u._id) !== currentUserId));
      setTotal(res.data.total || 0);
    } catch {
      dispatch(actions.setShowSnackBar({ status: true, msg: t('users.failedLoadUsers'), type: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Live presence updates (all users + self)
  useEffect(() => {
    if (!socket) return;
    const handler = ({ userId, isOnline, lastSeen }) => {
      setUsers(prev => prev.map(u =>
        String(u._id) === String(userId)
          ? { ...u, isOnline, lastSeen: isOnline ? u.lastSeen : (lastSeen || u.lastSeen) }
          : u
      ));
      setSelfUser(prev => {
        if (!prev || String(prev._id) !== String(userId)) return prev;
        return { ...prev, isOnline, lastSeen: isOnline ? prev.lastSeen : (lastSeen || prev.lastSeen) };
      });
    };
    socket.on('presence:update', handler);
    return () => socket.off('presence:update', handler);
  }, [socket]);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI, flexGrow: 1 }}>
          {t('users.usersHeader')}
          {total > 0 && (
            <Box component="span" sx={{ ml: 1.5, fontSize: '0.75rem', fontWeight: 400, color: T.TEXT_SEC }}>
              {total}
            </Box>
          )}
        </Typography>
        <Can permission="users:create">
          <Button size="small" startIcon={<PersonAddIcon sx={{ fontSize: 14 }} />}
            onClick={() => setFormOpen(true)}
            sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 600,
              borderRadius: '8px', px: 1.75, py: '5px', fontSize: '0.78rem', textTransform: 'none',
              '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
            {t('users.newShort')}
          </Button>
        </Can>
      </Box>

      <TextField fullWidth size="small" placeholder={t('users.searchNameOrPhone')}
        value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: T.TEXT_SEC }} /></InputAdornment> }}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI,
            '& fieldset':             { borderColor: T.INPUT_BD },
            '&:hover fieldset':       { borderColor: T.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' },
            '&.Mui-focused fieldset': { borderColor: T.TEXT_PRI, borderWidth: 1.5 },
          },
          '& input::placeholder': { color: T.TEXT_SEC, opacity: 1 },
          '& input': { color: T.TEXT_PRI },
        }}
      />

      {/* My Profile — always shown at top */}
      {selfUser && (
        <>
          <MyProfileCard
            user={selfUser}
            apiBase={apiBase}
            selected={String(selfUser._id) === String(selectedId)}
            onClick={() => onSelect(String(selfUser._id))}
            T={T}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 0.5 }}>
            <Box sx={{ flexGrow: 1, height: '1px', bgcolor: T.DIVIDER }} />
            <Typography sx={{ fontSize: '0.62rem', color: T.TEXT_TER, textTransform: 'uppercase',
              letterSpacing: '0.08em', flexShrink: 0 }}>
              {t('users.teamDivider')}
            </Typography>
            <Box sx={{ flexGrow: 1, height: '1px', bgcolor: T.DIVIDER }} />
          </Box>
        </>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={24} sx={{ color: T.TEXT_TER }} />
        </Box>
      ) : users.length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: T.TEXT_SEC, py: 6, fontSize: '0.875rem' }}>
          {debouncedSearch ? t('users.noUsersMatchSearch') : t('users.noOtherUsersYet')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {users.map(user => (
            <UserCard key={String(user._id)} user={user} apiBase={apiBase}
              selected={String(user._id) === String(selectedId)}
              onClick={() => onSelect(String(user._id))} />
          ))}
        </Box>
      )}

      <UserForm mode="new" open={formOpen} onClose={() => setFormOpen(false)}
        onSave={(newId) => { fetchUsers(); if (newId) onSelect(String(newId)); }} />
    </>
  );
};

// ── Mobile detail header with back arrow ─────────────────────────────────────
const MobileDetailHeader = ({ onBack, T }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 1,
      borderBottom: `1px solid ${T.DIVIDER}`, bgcolor: T.BG, flexShrink: 0 }}>
      <IconButton onClick={onBack} size="small"
        sx={{ color: T.TEXT_SEC, '&:hover': { color: T.TEXT_PRI, bgcolor: T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' } }}>
        <ArrowBackIcon sx={{ fontSize: 20 }} />
      </IconButton>
      <Typography sx={{ fontSize: '0.875rem', color: T.TEXT_SEC, ml: 1 }}>{t('users.backButton')}</Typography>
    </Box>
  );
};

// ── Root Users component ──────────────────────────────────────────────────────
const Users = () => {
  const authCtx           = useContext(AuthContext);
  const { can, isSuperAdmin } = usePermissions();
  const T                 = useT();
  const { t }              = useTranslation();
  const theme           = useTheme();
  const isMd            = useMediaQuery(theme.breakpoints.up('md'));
  const location        = useLocation();
  const history          = useHistory();

  const [tab,            setTab]            = useState('users');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRole,   setSelectedRole]   = useState(null);
  const [selectedGroup,  setSelectedGroup]  = useState(null);
  const [selectedTask,   setSelectedTask]   = useState(null);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);

  const clearSelections = () => {
    setSelectedUserId(null);
    setSelectedRole(null);
    setSelectedGroup(null);
    setSelectedTask(null);
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    clearSelections();
  };

  const handleTaskUpdate = useCallback((updatedTask) => {
    if (updatedTask) setSelectedTask(updatedTask);
    setTaskRefreshKey(k => k + 1);
  }, []);

  // Deep link from a notification click or a "copy link" short link:
  // /users?open=<userId> selects that user on the Users tab (ShowUser
  // self-fetches by id). Cleared afterwards so it doesn't re-trigger on
  // later re-renders.
  useEffect(() => {
    const openId = new URLSearchParams(location.search).get('open');
    if (!openId) return;
    setTab('users');
    setSelectedUserId(openId);
    history.replace('/users');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Current selection for the active tab
  const currentSelection = { users: selectedUserId, roles: selectedRole, groups: selectedGroup, tasks: selectedTask }[tab];

  // Desktop: always split layout (list left, detail right)
  const desktopSplit = isMd;
  // Mobile: when something is selected, show detail full-screen
  const mobileDetail = !isMd && !!currentSelection;

  // Roles / Groups / Branches are superAdmin-only (backend gates them with
  // requireSuperAdmin — never a permission key). Tasks stays permission-gated.
  const tabs = [
    { id: 'users',  labelKey: 'users.tabUsers'  },
    ...(isSuperAdmin ? [{ id: 'roles',    labelKey: 'users.tabRoles'    }] : []),
    ...(isSuperAdmin ? [{ id: 'groups',   labelKey: 'users.tabGroups'   }] : []),
    ...(isSuperAdmin ? [{ id: 'branches', labelKey: 'users.tabBranches' }] : []),
    ...(can('tasks:view') ? [{ id: 'tasks', labelKey: 'users.tabTasks' }] : []),
  ];

  // ── Right panel content ─────────────────────────────────────────────────────
  const renderDetail = (panelMode = true) => {
    switch (tab) {
      case 'users':
        return selectedUserId
          ? <ShowUser key={selectedUserId} userId={selectedUserId} panelMode={panelMode}
              onClose={clearSelections} onUnlock={() => {}} socket={authCtx.socket} />
          : panelMode ? <EmptyPanel tab="users" T={T} /> : null;
      case 'roles':
        return selectedRole
          ? <RolePanel role={selectedRole} />
          : panelMode ? <EmptyPanel tab="roles" T={T} /> : null;
      case 'groups':
        return selectedGroup
          ? <GroupPanel group={selectedGroup} />
          : panelMode ? <EmptyPanel tab="groups" T={T} /> : null;
      case 'tasks':
        return selectedTask
          ? <TaskPanel task={selectedTask} currentUserId={authCtx.decode?.id} onUpdate={handleTaskUpdate} />
          : panelMode ? <EmptyPanel tab="tasks" T={T} /> : null;
      default:
        return panelMode ? <EmptyPanel tab={tab} T={T} /> : null;
    }
  };

  return (
    <Box sx={{ bgcolor: T.BG, minHeight: 'calc(100vh - 60px)' }}>

      {/* Mobile full-screen detail */}
      {mobileDetail && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
          <MobileDetailHeader onBack={clearSelections} T={T} />
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {renderDetail(false)}
          </Box>
        </Box>
      )}

      {/* Main layout (hidden on mobile when detail is open) */}
      {!mobileDetail && (
        <Box sx={{
          display: desktopSplit ? 'flex' : 'block',
          height:  desktopSplit ? 'calc(100vh - 60px)' : 'auto',
        }}>

          {/* ── Left panel ── */}
          <Box sx={{
            width:       desktopSplit ? 320 : '100%',
            flexShrink:  0,
            overflowY:   desktopSplit ? 'auto' : 'visible',
            borderRight: desktopSplit ? `1px solid ${T.DIVIDER}` : 'none',
            display:     'flex',
            flexDirection: 'column',
          }}>
            {/* Tab bar */}
            {tabs.length > 1 && (
              <Box sx={{
                display: 'flex', gap: 0.5, flexWrap: 'wrap',
                px: 2, pt: 2.5, pb: 1.5,
                position: desktopSplit ? 'sticky' : 'static',
                top: 0, zIndex: 1,
                bgcolor: T.BG,
                borderBottom: desktopSplit ? `1px solid ${T.DIVIDER}` : 'none',
              }}>
                {tabs.map(tabItem => (
                  <TabBtn key={tabItem.id} active={tab === tabItem.id} onClick={() => handleTabChange(tabItem.id)} T={T}>
                    {t(tabItem.labelKey)}
                  </TabBtn>
                ))}
              </Box>
            )}

            {/* Tab content */}
            <Box sx={{ px: desktopSplit ? 2 : 3, py: desktopSplit ? 2 : 3, flexGrow: 1 }}>
              {tab === 'users' && (
                <UserListView socket={authCtx.socket}
                  onSelect={setSelectedUserId} selectedId={selectedUserId} />
              )}
              {tab === 'roles' && (
                <RolesManager onSelect={setSelectedRole} selectedId={selectedRole?._id} />
              )}
              {tab === 'groups' && (
                <GroupsManager onSelect={setSelectedGroup} selectedId={selectedGroup?._id} />
              )}
              {tab === 'branches' && (
                <BranchesManager />
              )}
              {tab === 'tasks' && (
                <TaskList onSelect={setSelectedTask} selectedId={selectedTask?._id} refreshKey={taskRefreshKey} />
              )}
            </Box>
          </Box>

          {/* ── Right panel (desktop only) ── */}
          {desktopSplit && (
            <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: T.BG }}>
              {renderDetail(true)}
            </Box>
          )}

        </Box>
      )}
    </Box>
  );
};

export default Users;
