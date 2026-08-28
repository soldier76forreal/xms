import { useState, useEffect, useContext, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import StoreIcon from '@mui/icons-material/Store';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';
import COUNTRIES from '../crm/util/countryData';

// ── Branch management (superAdmin only) ───────────────────────────────────────
// Branches are fully isolated Inventory + Invoice sections. CRUD here is gated
// by requireSuperAdmin server-side; this whole tab is only mounted for a
// superAdmin (see users.js). Per-user branch ASSIGNMENT lives in userForm.js.

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

// ── BranchForm Dialog (new / edit) ────────────────────────────────────────────
const BranchForm = ({ open, onClose, onSave, branch }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const { t }       = useTranslation();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const T           = useT();

  const isNew = !branch;

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
  const [country,     setCountry]     = useState(null);
  const [status,      setStatus]      = useState('active');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (branch) {
      setName(branch.name || '');
      setDescription(branch.description || '');
      setCountry(COUNTRIES.find((c) => c.code === branch.country) || null);
      setStatus(branch.status || 'active');
    } else {
      setName(''); setDescription(''); setCountry(null); setStatus('active');
    }
  }, [open, branch]);

  const handleSave = async () => {
    if (!name.trim()) { setError(t('users.branchNameRequired')); return; }
    setSaving(true); setError('');
    try {
      const data = { name: name.trim(), description: description.trim(), status, country: country?.code || null };
      if (isNew) {
        await authCtx.jwtInst({ method: 'post', url: `${axiosGlobal.defaultTargetApi}/branches`, data });
      } else {
        await authCtx.jwtInst({ method: 'put', url: `${axiosGlobal.defaultTargetApi}/branches/${branch._id}`, data });
      }
      dispatch(actions.setShowSnackBar({ status: true, msg: isNew ? t('users.branchCreated') : t('users.branchUpdated'), type: 'success' }));
      onSave();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('users.failedSaveBranch'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open} onClose={onClose} fullScreen={isXs} maxWidth="xs" fullWidth
      PaperProps={{ sx: {
        bgcolor: T.DIALOG_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: isXs ? 0 : '14px', backgroundImage: 'none',
      }}}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {isNew ? t('users.newBranch') : t('users.editBranch', { name: branch?.name })}
        </Typography>
        <IconButton onClick={onClose} size="small"
          sx={{ color: T.TEXT_SEC, '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, pt: 2.5, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label={t('users.branchNameLabel')} size="small" fullWidth value={name}
          onChange={e => { setName(e.target.value); setError(''); }} sx={inputSx} autoFocus />
        <TextField label={t('users.descriptionLabel')} size="small" fullWidth multiline rows={2} value={description}
          onChange={e => setDescription(e.target.value)} sx={inputSx} />

        <Autocomplete
          value={country}
          onChange={(_, val) => setCountry(val)}
          options={COUNTRIES}
          getOptionLabel={opt => opt ? `${opt.flag} ${opt.name}` : ''}
          isOptionEqualToValue={(opt, val) => opt.code === val?.code}
          renderOption={(props, opt) => (
            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{opt.flag}</span> {opt.name}
            </Box>
          )}
          renderInput={params => (
            <TextField {...params} size="small" label={t('users.branchCountryLabel')} sx={inputSx}
              inputProps={{ ...params.inputProps, style: { fontSize: '0.85rem' } }} />
          )}
        />

        {!isNew && (
          <Box>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
              {t('users.statusLabel')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              {[{ v: 'active', l: t('users.statusActive') }, { v: 'archived', l: t('users.statusArchived') }].map(opt => {
                const sel = status === opt.v;
                return (
                  <Button key={opt.v} size="small" onClick={() => setStatus(opt.v)}
                    sx={{ minWidth: 0, px: 2, py: '4px', borderRadius: '8px', fontSize: '0.75rem',
                      fontWeight: sel ? 700 : 400, textTransform: 'none',
                      color: sel ? T.TEXT_PRI : T.TEXT_TER,
                      bgcolor: sel ? (T.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)') : 'transparent',
                      border: `1px solid ${sel ? (T.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : T.INPUT_BD}`,
                      '&:hover': { bgcolor: T.HVR_BG, color: T.TEXT_PRI } }}>
                    {opt.l}
                  </Button>
                );
              })}
            </Box>
          </Box>
        )}

        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </Box>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5, gap: 1 }}>
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

// ── Main BranchesManager ──────────────────────────────────────────────────────
const BranchesManager = () => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const T           = useT();
  const { t }       = useTranslation();
  const { refreshBranches } = useBranch();

  const [branches,  setBranches]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [formOpen,  setFormOpen]  = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [deleting,  setDeleting]  = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/branches` });
      setBranches(res.data || []);
    } catch {
      setBranches([]);
    }
    setLoading(false);
  }, [authCtx.jwtInst, axiosGlobal.defaultTargetApi]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const afterMutation = () => { fetchAll(); refreshBranches(); };

  const handleDelete = async (branch) => {
    if (!window.confirm(t('users.deleteBranchConfirm', { name: branch.name }))) return;
    setDeleting(branch._id);
    try {
      await authCtx.jwtInst({ method: 'delete', url: `${axiosGlobal.defaultTargetApi}/branches/${branch._id}` });
      dispatch(actions.setShowSnackBar({ status: true, msg: t('users.branchDeleted'), type: 'success' }));
      afterMutation();
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
          {t('users.branchCount', { count: branches.length })}
        </Typography>
        <Button size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />}
          onClick={() => { setEditBranch(null); setFormOpen(true); }}
          sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 600, borderRadius: '8px', px: 2, py: '5px',
            fontSize: '0.78rem', textTransform: 'none',
            '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
          {t('users.newBranch')}
        </Button>
      </Box>

      <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mb: 2, lineHeight: 1.5 }}>
        {t('users.branchesIntro')}
      </Typography>

      {branches.length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: T.TEXT_SEC, py: 6, fontSize: '0.875rem' }}>
          {t('users.noBranchesYet')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {branches.map(branch => (
            <Box key={branch._id}
              sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}`, borderRadius: '12px',
                '&:hover': { borderColor: T.HVR_BD }, transition: 'border-color 0.15s' }}>

              <StoreIcon sx={{ fontSize: 18, color: branch.status === 'archived' ? T.TEXT_TER : T.TEXT_SEC, flexShrink: 0 }} />

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: T.TEXT_PRI }}>
                    {branch.name}
                  </Typography>
                  {branch.status === 'archived' && (
                    <Chip label={t('users.archivedBadge')} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700,
                      bgcolor: T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      color: T.TEXT_TER, borderRadius: '3px', '& .MuiChip-label': { px: 0.75 } }} />
                  )}
                </Box>
                {branch.description && (
                  <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, lineHeight: 1.4 }}>
                    {branch.description}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <IconButton size="small"
                  onClick={() => { setEditBranch(branch); setFormOpen(true); }}
                  sx={{ color: T.TEXT_TER, '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
                  <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton size="small" disabled={deleting === branch._id}
                  onClick={() => handleDelete(branch)}
                  sx={{ color: T.TEXT_TER, '&:hover': { color: T.ERR_CLR, bgcolor: 'rgba(255,77,141,0.08)' } }}>
                  {deleting === branch._id
                    ? <CircularProgress size={13} sx={{ color: T.TEXT_TER }} />
                    : <DeleteIcon sx={{ fontSize: 15 }} />}
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Divider sx={{ borderColor: 'transparent', my: 1 }} />

      <BranchForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={afterMutation}
        branch={editBranch}
      />
    </Box>
  );
};

export default BranchesManager;
