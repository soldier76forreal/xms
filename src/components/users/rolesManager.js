import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ShieldIcon from '@mui/icons-material/Shield';
import { useTheme, useMediaQuery } from '@mui/material';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { Can } from '../../contextApi/PermissionContext';

const useT = () => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    CARD_BG:  isDark ? '#111111'                : theme.palette.background.paper,
    CARD_BD:  isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    INPUT_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD: isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:  isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    HVR_BD:   isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.18)',
    HVR_BG:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    BTN_BG:   isDark ? '#ffffff'                : '#000000',
    BTN_CLR:  isDark ? '#000000'                : '#ffffff',
    ERR_CLR:  '#FF4D8D',
    DIALOG_BG: isDark ? '#0d0d0d'              : theme.palette.background.paper,
    isDark,
  };
};

// ── RoleForm Dialog (new / edit) ──────────────────────────────────────────────
const RoleForm = ({ open, onClose, onSave, role, allPermissions }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const T           = useT();

  const isNew = !role;

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
  const [selected,    setSelected]    = useState(new Set());
  const [dataScopes,  setDataScopes]  = useState({});
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [expandedMods, setExpandedMods] = useState(new Set());   // collapsed by default — headers show counts

  const toggleModuleExpand = (mod) => {
    setExpandedMods(prev => {
      const next = new Set(prev);
      next.has(mod) ? next.delete(mod) : next.add(mod);
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;
    setError('');
    if (role) {
      setName(role.name || '');
      setDescription(role.description || '');
      setSelected(new Set(role.permissions || []));
      setDataScopes(role.dataScopes || {});
    } else {
      setName(''); setDescription(''); setSelected(new Set()); setDataScopes({});
    }
  }, [open, role]);

  const setScope = (module, value) => {
    setDataScopes(prev => {
      const next = { ...prev };
      if (value === 'all') {
        delete next[module]; // 'all' = no restriction, so remove the key
      } else {
        next[module] = value;
      }
      return next;
    });
  };

  const togglePerm = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleModule = (keys) => {
    const allChecked = keys.every(k => selected.has(k));
    setSelected(prev => {
      const next = new Set(prev);
      keys.forEach(k => allChecked ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Role name is required'); return; }
    setSaving(true); setError('');
    try {
      const data = { name: name.trim(), description: description.trim(), permissions: Array.from(selected), dataScopes };
      if (isNew) {
        await authCtx.jwtInst({ method: 'post', url: `${axiosGlobal.defaultTargetApi}/roles`, data });
      } else {
        await authCtx.jwtInst({ method: 'put', url: `${axiosGlobal.defaultTargetApi}/roles/${role._id}`, data });
      }
      dispatch(actions.setShowSnackBar({ status: true, msg: isNew ? 'Role created' : 'Role updated', type: 'success' }));
      onSave();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const byModule = allPermissions.byModule || {};

  return (
    <Dialog
      open={open} onClose={onClose} fullScreen={isXs} maxWidth="sm" fullWidth
      PaperProps={{ sx: {
        bgcolor: T.DIALOG_BG,
        border: `1px solid ${T.CARD_BD}`,
        borderRadius: isXs ? 0 : '14px',
        backgroundImage: 'none',
        // Fill 90% of viewport height so permissions get maximum room
        height: isXs ? '100%' : '90vh',
        maxHeight: isXs ? '100%' : '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}}
    >
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {isNew ? 'New Role' : `Edit — ${role?.name}`}
        </Typography>
        <IconButton onClick={onClose} size="small"
          sx={{ color: T.TEXT_SEC, '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* ── Top fields (fixed height) ── */}
      <Box sx={{ px: 3, pt: 2.5, pb: 2, display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        <TextField label="Role name" size="small" fullWidth value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          disabled={!isNew && role?.isSystem}
          sx={inputSx}
        />
        <TextField label="Description" size="small" fullWidth multiline rows={2} value={description}
          onChange={e => setDescription(e.target.value)} sx={inputSx}
        />
      </Box>

      <Divider sx={{ borderColor: T.DIVIDER, flexShrink: 0 }} />

      {/* ── ONE unified scroll area: collapsible permission groups + data
           visibility. Replaces the old cramped layout (an always-expanded
           permission list squeezed above a 280px sub-scroll). ── */}
      <Box sx={{ px: 3, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1 }}>
          Permissions · {selected.size} selected
        </Typography>
      </Box>

      <Box sx={{
        flex: 1, overflowY: 'auto', px: 3, pb: 1.5,
        minHeight: 0, // required for flex children to shrink below content size
        display: 'flex', flexDirection: 'column', gap: 0.75,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: T.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
          borderRadius: 2,
        },
      }}>
        {Object.keys(byModule).length === 0 ? (
          <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, py: 1 }}>
            No permissions found. Run{' '}
            <Box component="code" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              node api/scripts/seedPermissions.js
            </Box>{' '}
            on the server to load the permission catalog.
          </Typography>
        ) : (
          Object.entries(byModule).map(([mod, perms]) => {
            const keys        = perms.map(p => p.key);
            const checkedCount = keys.filter(k => selected.has(k)).length;
            const allChecked  = checkedCount === keys.length;
            const someChecked = !allChecked && checkedCount > 0;
            const expanded    = expandedMods.has(mod);
            return (
              <Box key={mod} sx={{
                border: `1px solid ${T.CARD_BD}`, borderRadius: '10px',
                bgcolor: T.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {/* Module header — checkbox selects all; the rest toggles expand */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.75, cursor: 'pointer',
                  '&:hover': { bgcolor: T.HVR_BG } }}
                  onClick={() => toggleModuleExpand(mod)}>
                  <Checkbox
                    size="small" checked={allChecked} indeterminate={someChecked}
                    onClick={(e) => { e.stopPropagation(); toggleModule(keys); }}
                    sx={{ p: 0, color: T.TEXT_TER,
                      '&.Mui-checked': { color: T.TEXT_PRI },
                      '&.MuiCheckbox-indeterminate': { color: T.TEXT_SEC },
                    }}
                  />
                  <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_PRI, flexGrow: 1,
                    textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    {mod}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: checkedCount ? T.TEXT_SEC : T.TEXT_TER, fontWeight: 600 }}>
                    {checkedCount}/{keys.length}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER, width: 14, textAlign: 'center' }}>
                    {expanded ? '▾' : '▸'}
                  </Typography>
                </Box>
                {expanded && (
                  <Box sx={{ px: 1.25, pb: 0.75, display: 'flex', flexDirection: 'column', gap: 0.25,
                    borderTop: `1px solid ${T.DIVIDER}`, pt: 0.5 }}>
                    {perms.map(p => (
                      <Box key={p.key}
                        onClick={() => togglePerm(p.key)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', py: 0.25,
                          borderRadius: '6px',
                          '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' } }}>
                        <Checkbox size="small" checked={selected.has(p.key)}
                          sx={{ p: '2px', color: T.TEXT_TER, '&.Mui-checked': { color: T.TEXT_PRI } }} />
                        <Typography sx={{ fontSize: '0.78rem', color: selected.has(p.key) ? T.TEXT_PRI : T.TEXT_SEC }}>
                          {p.key.substring(p.key.indexOf(':') + 1)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            );
          })
        )}

        <Divider sx={{ borderColor: T.DIVIDER, my: 1.5 }} />

        {/* ── Data Visibility — same scroll region, no more 280px sub-scroll ── */}
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER,
          textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
          Data Visibility · per section
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mb: 1.5 }}>
          Restricts what data users with this role can see. "Own" = only records they created. "Group" = records from their group members. "All" = no restriction.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[
            { id: 'crm',       label: 'CRM'        },
            { id: 'mis',       label: 'Invoices'   },
            { id: 'inventory', label: 'Inventory'  },
            { id: 'files',     label: 'Files'      },
            { id: 'tasks',     label: 'Tasks'      },
          ].map(({ id, label }) => {
            const current = dataScopes[id] || 'all';
            return (
              <Box key={id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, width: 80, flexShrink: 0 }}>
                  {label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[
                    { value: 'mine',  label: 'Own'   },
                    { value: 'group', label: 'Group' },
                    { value: 'all',   label: 'All'   },
                  ].map(opt => {
                    const isActive = current === opt.value;
                    return (
                      <Button key={opt.value} size="small" onClick={() => setScope(id, opt.value)}
                        sx={{
                          minWidth: 0, px: 1.5, py: '3px', borderRadius: '6px',
                          fontSize: '0.72rem', fontWeight: isActive ? 700 : 400,
                          textTransform: 'none',
                          color:   isActive ? T.TEXT_PRI : T.TEXT_TER,
                          bgcolor: isActive
                            ? (T.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)')
                            : 'transparent',
                          border: `1px solid ${isActive
                            ? (T.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
                            : 'transparent'}`,
                          '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', color: T.TEXT_PRI },
                        }}>
                        {opt.label}
                      </Button>
                    );
                  })}
                </Box>
                {dataScopes[id] && dataScopes[id] !== 'all' && (
                  <Typography sx={{ fontSize: '0.65rem', color: '#FFB74D', ml: 0.5 }}>
                    restricted
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>

        {error && (
          <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR, mt: 1.5 }}>
            {error}
          </Typography>
        )}
      </Box>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1, flexShrink: 0,
        borderTop: `1px solid ${T.DIVIDER}` }}>
        <Button onClick={onClose}
          sx={{ color: T.TEXT_SEC, textTransform: 'none', '&:hover': { bgcolor: T.HVR_BG, color: T.TEXT_PRI } }}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, borderRadius: '8px', px: 3, textTransform: 'none',
            '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' },
            '&.Mui-disabled': { bgcolor: T.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: T.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)' } }}>
          {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main RolesManager ─────────────────────────────────────────────────────────
const RolesManager = ({ onSelect = null, selectedId = null }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const T           = useT();

  const [roles,       setRoles]       = useState([]);
  const [permissions, setPermissions] = useState({ byModule: {}, flat: [] });
  const [loading,     setLoading]     = useState(true);
  const [formOpen,    setFormOpen]    = useState(false);
  const [editRole,    setEditRole]    = useState(null);
  const [deleting,    setDeleting]    = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [rolesRes, permsRes] = await Promise.allSettled([
      authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/roles` }),
      authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/permissions` }),
    ]);
    setRoles(rolesRes.status === 'fulfilled' ? rolesRes.value.data || [] : []);
    setPermissions(permsRes.status === 'fulfilled' ? permsRes.value.data || { byModule: {}, flat: [] } : { byModule: {}, flat: [] });
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (role) => {
    if (role.isSystem) return;
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    setDeleting(role._id);
    try {
      await authCtx.jwtInst({ method: 'delete', url: `${axiosGlobal.defaultTargetApi}/roles/${role._id}` });
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Role deleted', type: 'success' }));
      fetchAll();
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to delete', type: 'error' }));
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
          {roles.length} role{roles.length !== 1 ? 's' : ''}
        </Typography>
        <Can permission="users:role:edit">
          <Button size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />}
            onClick={() => { setEditRole(null); setFormOpen(true); }}
            sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 600, borderRadius: '8px', px: 2, py: '5px',
              fontSize: '0.78rem', textTransform: 'none',
              '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
            New Role
          </Button>
        </Can>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {roles.map(role => {
          const isSelected = String(role._id) === String(selectedId);
          return (
          <Box key={role._id}
            onClick={() => onSelect && onSelect(role)}
            sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
              bgcolor: isSelected ? (T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : T.CARD_BG,
              border: `1px solid ${isSelected ? (T.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)') : T.CARD_BD}`,
              borderRadius: '12px', cursor: onSelect ? 'pointer' : 'default',
              '&:hover': { borderColor: isSelected ? (T.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)') : T.HVR_BD },
              transition: 'border-color 0.15s, background-color 0.15s' }}>

            <ShieldIcon sx={{ fontSize: 18, color: role.isSystem ? T.TEXT_SEC : T.TEXT_TER, flexShrink: 0 }} />

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: T.TEXT_PRI }}>
                  {role.name}
                </Typography>
                {role.isSystem && (
                  <Chip label="system" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700,
                    bgcolor: T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    color: T.TEXT_TER, borderRadius: '3px',
                    '& .MuiChip-label': { px: 0.75 } }} />
                )}
              </Box>
              {role.description && (
                <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, lineHeight: 1.4 }}>
                  {role.description}
                </Typography>
              )}
            </Box>

            <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC, flexShrink: 0 }}>
              {(role.permissions || []).length} perms
            </Typography>

            <Can permission="users:role:edit">
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <IconButton size="small"
                  onClick={(e) => { e.stopPropagation(); setEditRole(role); setFormOpen(true); }}
                  sx={{ color: T.TEXT_TER, '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
                  <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
                {!role.isSystem && (
                  <IconButton size="small" disabled={deleting === role._id}
                    onClick={(e) => { e.stopPropagation(); handleDelete(role); }}
                    sx={{ color: T.TEXT_TER, '&:hover': { color: T.ERR_CLR, bgcolor: 'rgba(255,77,141,0.08)' } }}>
                    {deleting === role._id
                      ? <CircularProgress size={13} sx={{ color: T.TEXT_TER }} />
                      : <DeleteIcon sx={{ fontSize: 15 }} />}
                  </IconButton>
                )}
              </Box>
            </Can>
          </Box>
          );
        })}
      </Box>

      <RoleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={fetchAll}
        role={editRole}
        allPermissions={permissions}
      />
    </Box>
  );
};

export default RolesManager;
