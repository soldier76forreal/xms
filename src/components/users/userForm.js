import { useState, useEffect, useContext, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useTheme, useMediaQuery } from '@mui/material';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { COUNTRIES, DEFAULT_COUNTRY } from './countryData';

const getInitials = (firstName, lastName) => {
  const f = (firstName || '').charAt(0).toUpperCase();
  const l = (lastName  || '').charAt(0).toUpperCase();
  return f + l || '?';
};

const UserForm = ({ mode = 'new', user, userAccess, open, onClose, onSave }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const { isSuperAdmin } = usePermissions();
  const theme       = useTheme();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark      = theme.palette.mode === 'dark';

  // Theme tokens
  const T = {
    CARD_BG:   isDark ? '#0d0d0d'                : theme.palette.background.paper,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    INPUT_BDF: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    CARD_BD:   isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    ERR_CLR:   '#FF4D8D',
    BTN_BG:    isDark ? '#ffffff'                : '#000000',
    BTN_CLR:   isDark ? '#000000'                : '#ffffff',
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI,
      '& fieldset':             { borderColor: T.INPUT_BD },
      '&:hover fieldset':       { borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.3)' },
      '&.Mui-focused fieldset': { borderColor: T.INPUT_BDF, borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root':             { color: T.TEXT_SEC },
    '& .MuiInputLabel-root.Mui-focused': { color: T.TEXT_PRI },
    '& input':    { color: T.TEXT_PRI },
    '& textarea': { color: T.TEXT_PRI },
  };

  // Form state
  const [firstName,      setFirstName]      = useState('');
  const [lastName,       setLastName]       = useState('');
  const [phoneNumber,    setPhoneNumber]    = useState('');
  const [countryCode,    setCountryCode]    = useState(DEFAULT_COUNTRY);
  const [countryMenu,    setCountryMenu]    = useState(null);
  const [countrySearch,  setCountrySearch]  = useState('');
  const [validation,     setValidation]     = useState(true);
  const [selectedRoles,    setSelectedRoles]    = useState([]);
  const [selectedGroups,   setSelectedGroups]   = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [avatarFile,     setAvatarFile]     = useState(null);
  const [avatarPreview,  setAvatarPreview]  = useState(null);

  const [roles,       setRoles]       = useState([]);
  const [groups,      setGroups]      = useState([]);
  const [branches,    setBranches]    = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setError(''); setAvatarFile(null);

    if (mode === 'edit' && user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName   || '');
      setPhoneNumber('');
      setValidation(user.validation !== false);
      const stored = user.countryCode ? COUNTRIES.find(c => c.dial === user.countryCode) : null;
      setCountryCode(stored || DEFAULT_COUNTRY);
      const thumb = user.profileImage?.thumbnail || user.profileImage?.url;
      setAvatarPreview(thumb ? `${axiosGlobal.defaultTargetApi}${thumb}` : null);
      setSelectedRoles((userAccess?.roles  || []).map(String));
      setSelectedGroups((userAccess?.groups || []).map(String));
      setSelectedBranches((userAccess?.branches || []).map(String));
    } else {
      setFirstName(''); setLastName(''); setPhoneNumber('');
      setCountryCode(DEFAULT_COUNTRY); setValidation(true);
      setAvatarPreview(null); setSelectedRoles([]); setSelectedGroups([]); setSelectedBranches([]);
    }

    fetchMeta();
  }, [open]);

  const fetchMeta = async () => {
    setLoadingMeta(true);
    const [rolesRes, groupsRes, branchesRes] = await Promise.allSettled([
      isSuperAdmin
        ? authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/roles` })
        : Promise.resolve({ data: [] }),
      isSuperAdmin
        ? authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/groups` })
        : Promise.resolve({ data: [] }),
      isSuperAdmin
        ? authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/branches` })
        : Promise.resolve({ data: [] }),
    ]);
    setRoles(rolesRes.status  === 'fulfilled' ? rolesRes.value.data  || [] : []);
    setGroups(groupsRes.status === 'fulfilled' ? groupsRes.value.data || [] : []);
    setBranches(branchesRes.status === 'fulfilled' ? branchesRes.value.data || [] : []);
    setLoadingMeta(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const toggleRole  = (id) => setSelectedRoles(prev =>
    prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
  );
  const toggleGroup = (id) => setSelectedGroups(prev =>
    prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
  );
  const toggleBranch = (id) => setSelectedBranches(prev =>
    prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
  );

  const handleSave = async () => {
    if (!firstName.trim()) { setError('First name is required'); return; }
    if (!lastName.trim())  { setError('Last name is required');  return; }
    if (mode === 'new' && !phoneNumber.trim()) { setError('Phone number is required'); return; }

    setSaving(true); setError('');
    try {
      let savedId;

      if (mode === 'new') {
        const res = await authCtx.jwtInst({
          method: 'post',
          url: `${axiosGlobal.defaultTargetApi}/users`,
          data: {
            firstName:   firstName.trim(),
            lastName:    lastName.trim(),
            phoneNumber: phoneNumber.trim(),
            countryCode: countryCode.dial,
            validation,
            roles:  selectedRoles,
            groups: selectedGroups,
            ...(isSuperAdmin ? { branches: selectedBranches } : {}),
          },
        });
        savedId = res.data._id;
      } else {
        await authCtx.jwtInst({
          method: 'put',
          url: `${axiosGlobal.defaultTargetApi}/users/${user._id}`,
          data: {
            firstName:   firstName.trim(),
            lastName:    lastName.trim(),
            countryCode: countryCode.dial,
            validation,
            roles:  selectedRoles,
            groups: selectedGroups,
            ...(isSuperAdmin ? { branches: selectedBranches } : {}),
          },
        });
        savedId = user._id;
      }

      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        await authCtx.jwtInst({
          method: 'post',
          url: `${axiosGlobal.defaultTargetApi}/users/${savedId}/avatar`,
          data: fd,
        });
      }

      dispatch(actions.setShowSnackBar({
        status: true,
        msg:    mode === 'new' ? 'User created' : 'User updated',
        type:   'success',
      }));
      onSave(savedId);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(firstName, lastName);

  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dial.includes(countrySearch)
      )
    : COUNTRIES;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isXs}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: T.CARD_BG,
          border: `1px solid ${T.CARD_BD}`,
          borderRadius: isXs ? 0 : '14px',
          backgroundImage: 'none',
        },
      }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`,
      }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {mode === 'new' ? 'New User' : 'Edit User'}
        </Typography>
        <IconButton
          onClick={onClose} size="small"
          sx={{ color: T.TEXT_SEC, '&:hover': { color: T.TEXT_PRI, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' } }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Avatar picker */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              position: 'relative', width: 64, height: 64, borderRadius: '50%',
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
              border: `1px solid ${T.INPUT_BD}`,
              '&:hover .cam-overlay': { opacity: 1 },
            }}
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (
                <Typography sx={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 700, color: T.TEXT_PRI,
                }}>
                  {initials}
                </Typography>
              )
            }
            <Box className="cam-overlay" sx={{
              position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.15s',
            }}>
              <CameraAltIcon sx={{ fontSize: 20, color: '#fff' }} />
            </Box>
          </Box>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          <Box>
            <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_PRI, fontWeight: 500 }}>Profile photo</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mt: 0.3 }}>Click avatar to upload</Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: T.DIVIDER }} />

        {/* Name fields */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <TextField
            label="First name" size="small" fullWidth
            value={firstName}
            onChange={e => { setFirstName(e.target.value); setError(''); }}
            sx={inputSx}
          />
          <TextField
            label="Last name" size="small" fullWidth
            value={lastName}
            onChange={e => { setLastName(e.target.value); setError(''); }}
            sx={inputSx}
          />
        </Box>

        {/* Phone + country code — new user only */}
        {mode === 'new' && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            {/* Country code picker */}
            <Button
              onClick={(e) => { setCountryMenu(e.currentTarget); setCountrySearch(''); }}
              sx={{
                flexShrink: 0, minWidth: 88,
                px: 1.25, py: '8px', height: 40,
                borderRadius: '10px',
                bgcolor: T.INPUT_BG,
                border: `1px solid ${T.INPUT_BD}`,
                color: T.TEXT_PRI,
                textTransform: 'none', fontSize: '0.82rem', fontFamily: 'monospace',
                display: 'flex', gap: 0.5, alignItems: 'center',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' },
              }}
            >
              <span style={{ fontSize: '1rem' }}>{countryCode.flag}</span>
              <span style={{ color: T.TEXT_SEC, fontSize: '0.75rem' }}>{countryCode.dial}</span>
            </Button>

            <TextField
              label="Phone number" size="small" fullWidth
              placeholder="09xxxxxxxxx"
              value={phoneNumber}
              onChange={e => { setPhoneNumber(e.target.value); setError(''); }}
              inputProps={{ dir: 'ltr' }}
              sx={inputSx}
            />
          </Box>
        )}

        {/* Country code for edit mode */}
        {mode === 'edit' && (
          <Box>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
              Country
            </Typography>
            <Button
              onClick={(e) => { setCountryMenu(e.currentTarget); setCountrySearch(''); }}
              sx={{
                px: 1.75, py: '6px', borderRadius: '10px',
                bgcolor: T.INPUT_BG, border: `1px solid ${T.INPUT_BD}`,
                color: T.TEXT_PRI, textTransform: 'none', fontSize: '0.85rem',
                display: 'flex', gap: 1, alignItems: 'center',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
              }}
            >
              <span style={{ fontSize: '1rem' }}>{countryCode.flag}</span>
              <span>{countryCode.name}</span>
              <span style={{ color: T.TEXT_SEC, fontFamily: 'monospace', fontSize: '0.8rem' }}>{countryCode.dial}</span>
            </Button>
          </Box>
        )}

        {/* Country menu */}
        <Menu
          anchorEl={countryMenu}
          open={Boolean(countryMenu)}
          onClose={() => setCountryMenu(null)}
          PaperProps={{
            sx: {
              bgcolor: isDark ? '#181818' : '#ffffff',
              border: `1px solid ${T.CARD_BD}`,
              borderRadius: '10px', maxHeight: 300, minWidth: 220,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(128,128,128,0.3)', borderRadius: 2 },
            },
          }}
        >
          <Box sx={{ px: 1.5, pt: 1, pb: 0.5, position: 'sticky', top: 0, bgcolor: isDark ? '#181818' : '#ffffff', zIndex: 1 }}>
            <TextField
              size="small" fullWidth placeholder="Search…"
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: T.INPUT_BG, borderRadius: '8px', color: T.TEXT_PRI,
                  '& fieldset': { borderColor: T.INPUT_BD },
                  '&.Mui-focused fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' },
                },
                '& input': { color: T.TEXT_PRI, fontSize: '0.82rem', py: '6px' },
                '& input::placeholder': { color: T.TEXT_SEC, opacity: 1 },
              }}
            />
          </Box>
          {filteredCountries.map(c => (
            <MenuItem
              key={c.code}
              onClick={() => { setCountryCode(c); setCountryMenu(null); }}
              selected={c.code === countryCode.code}
              sx={{
                color: T.TEXT_PRI, fontSize: '0.85rem', gap: 1.5,
                '&.Mui-selected': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              }}
            >
              <span style={{ fontSize: '1rem' }}>{c.flag}</span>
              <span style={{ flexGrow: 1 }}>{c.name}</span>
              <span style={{ color: T.TEXT_TER, fontFamily: 'monospace', fontSize: '0.75rem' }}>{c.dial}</span>
            </MenuItem>
          ))}
          {filteredCountries.length === 0 && (
            <MenuItem disabled sx={{ color: T.TEXT_TER, fontSize: '0.82rem' }}>No match</MenuItem>
          )}
        </Menu>

        {/* Active toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_PRI }}>Active</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>Inactive users cannot log in</Typography>
          </Box>
          <Switch
            checked={validation}
            onChange={e => setValidation(e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: isDark ? '#fff' : '#000' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' },
              '& .MuiSwitch-track': { bgcolor: T.INPUT_BD },
            }}
          />
        </Box>

        <Divider sx={{ borderColor: T.DIVIDER }} />

        {/* Roles — superAdmin only */}
        {isSuperAdmin && (
          <Box>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
              Roles
            </Typography>
            {loadingMeta ? (
              <CircularProgress size={16} sx={{ color: T.TEXT_TER }} />
            ) : roles.length === 0 ? (
              <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER }}>No roles available</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {roles.map(r => {
                  const sel = selectedRoles.includes(String(r._id));
                  return (
                    <Chip
                      key={r._id}
                      label={r.name}
                      onClick={() => toggleRole(String(r._id))}
                      size="small"
                      sx={{
                        height: 26, fontSize: '0.75rem', fontWeight: sel ? 600 : 400,
                        cursor: 'pointer', borderRadius: '6px',
                        bgcolor: sel ? T.BTN_BG : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                        color:   sel ? T.BTN_CLR : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                        border:  sel ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                        '&:hover': { bgcolor: sel ? (isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)') : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)') },
                        '& .MuiChip-label': { px: 1.25 },
                        transition: 'all 0.12s',
                      }}
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* Groups — superAdmin only */}
        {isSuperAdmin && groups.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
              Groups
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {groups.map(g => {
                const sel = selectedGroups.includes(String(g._id));
                return (
                  <Chip
                    key={g._id}
                    label={g.name}
                    onClick={() => toggleGroup(String(g._id))}
                    size="small"
                    sx={{
                      height: 26, fontSize: '0.75rem', fontWeight: sel ? 600 : 400,
                      cursor: 'pointer', borderRadius: '6px',
                      bgcolor: sel ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                      color:   sel ? T.TEXT_PRI : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
                      border:  `1px solid ${sel ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                      '&:hover': { bgcolor: sel ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)') },
                      '& .MuiChip-label': { px: 1.25 },
                      transition: 'all 0.12s',
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Branches — superAdmin only. Each branch is an isolated Inventory + Invoice section. */}
        {isSuperAdmin && branches.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
              Branches
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mb: 1 }}>
              Which branches this user can access (Inventory + Invoices are isolated per branch).
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {branches.map(b => {
                const sel = selectedBranches.includes(String(b._id));
                return (
                  <Chip
                    key={b._id}
                    label={b.name}
                    onClick={() => toggleBranch(String(b._id))}
                    size="small"
                    sx={{
                      height: 26, fontSize: '0.75rem', fontWeight: sel ? 600 : 400,
                      cursor: 'pointer', borderRadius: '6px',
                      bgcolor: sel ? T.BTN_BG : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                      color:   sel ? T.BTN_CLR : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                      border:  sel ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                      '&:hover': { bgcolor: sel ? (isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)') : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)') },
                      '& .MuiChip-label': { px: 1.25 },
                      transition: 'all 0.12s',
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {error && (
          <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>
        )}

      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            color: T.TEXT_SEC, fontWeight: 500, textTransform: 'none',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: T.TEXT_PRI },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{
            bgcolor: T.BTN_BG, color: T.BTN_CLR,
            fontWeight: 700, borderRadius: '8px', px: 3,
            textTransform: 'none', fontSize: '0.85rem',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' },
            '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
          }}
        >
          {saving ? 'Saving…' : mode === 'new' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;
