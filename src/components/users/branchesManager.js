import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import StoreIcon from '@mui/icons-material/Store';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { actions, fetchUserDirectory } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import COUNTRIES from '../crm/util/countryData';

// ── Branch management (superAdmin only) ───────────────────────────────────────
// Branches are fully isolated Inventory + Invoice sections. CRUD here is gated
// by requireSuperAdmin server-side; this whole tab is only mounted for a
// superAdmin (see users.js). Per-user branch ASSIGNMENT lives in userForm.js.
// The list feeds the section's shared right-hand detail panel (branchPanel.js),
// the same master/detail contract RolesManager and GroupsManager use.

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
    SEL_BD:   isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
    SEL_BG:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
    BTN_BG:   isDark ? '#ffffff'                : '#000000',
    BTN_CLR:  isDark ? '#000000'                : '#ffffff',
    ERR_CLR:  '#FF4D8D',
    DIALOG_BG: isDark ? '#0d0d0d'              : theme.palette.background.paper,
    isDark,
  };
};

const TEMPLATE_FIELDS = [
  ['customerInvoice',      'users.templateCustomerInvoice'],
  ['customerQuotation',    'users.templateCustomerQuotation'],
  ['interBranchInvoice',   'users.templateInterBranchInvoice'],
  ['interBranchQuotation', 'users.templateInterBranchQuotation'],
  ['packingList',          'users.templatePackingList'],
  ['label',                'users.templateLabel'],
  ['dealLetter',           'users.templateDealLetter'],
];

const EMPTY_TEMPLATES = {
  customerInvoice: 'classic', customerQuotation: 'classic',
  interBranchInvoice: 'classic', interBranchQuotation: 'classic',
  packingList: 'classic', label: 'classic', dealLetter: 'classic',
};

// ── BranchForm Dialog (new / edit) ────────────────────────────────────────────
// Grouped into three tabs rather than one long scroll: the old single-column
// `maxWidth="xs"` dialog stacked ~13 controls (including six identical template
// selects) into a narrow strip that had to be scrolled end to end.
const BranchForm = ({ open, onClose, onSave, branch, allBranches = [] }) => {
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
    '& .MuiFormHelperText-root': { color: T.TEXT_TER, fontSize: '0.68rem' },
  };

  // Any portalled popper opened from inside this Dialog must sit ABOVE it —
  // both default to theme.zIndex.modal, which is the standing MUI trap.
  const popperSx = { popper: { sx: { zIndex: (th) => th.zIndex.modal + 2 } } };

  const [tab,         setTab]         = useState(0);
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [country,     setCountry]     = useState(null);
  const [status,      setStatus]      = useState('active');
  const [notifyUsers, setNotifyUsers] = useState([]);
  const [address,         setAddress]         = useState('');
  const [phone,           setPhone]           = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [websiteSlug, setWebsiteSlug] = useState('');
  const [flagFile, setFlagFile] = useState(null);
  const [misTemplates, setMisTemplates] = useState({ ...EMPTY_TEMPLATES });
  const [crossBranchAccess, setCrossBranchAccess] = useState([]);   // branch ids
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const userDirectory = useSelector((s) => s.userDirectory) || {};
  const directoryOptions = Object.keys(userDirectory);

  useEffect(() => {
    dispatch(fetchUserDirectory({ authCtx, axiosGlobal }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    setError(''); setTab(0);
    if (branch) {
      setName(branch.name || '');
      setDescription(branch.description || '');
      setCountry(COUNTRIES.find((c) => c.code === branch.country) || null);
      setStatus(branch.status || 'active');
      setNotifyUsers((branch.associates || branch.priceRequestNotifyUsers || []).map(String));
      setAddress(branch.address || '');
      setPhone(branch.phone || '');
      setInstagramHandle(String(branch.instagramHandle || '').replace(/^@/, ''));
      setWebsiteSlug(branch.websiteSlug || branch.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '');
      setFlagFile(null);
      setMisTemplates({ ...EMPTY_TEMPLATES, ...(branch.misTemplates || {}) });
      setCrossBranchAccess((branch.crossBranchAccess || []).map(String));
    } else {
      setName(''); setDescription(''); setCountry(null); setStatus('active'); setNotifyUsers([]);
      setAddress(''); setPhone(''); setInstagramHandle('');
      setWebsiteSlug(''); setFlagFile(null);
      setMisTemplates({ ...EMPTY_TEMPLATES });
      setCrossBranchAccess([]);
    }
  }, [open, branch]);

  const handleSave = async () => {
    if (!name.trim()) { setTab(0); setError(t('users.branchNameRequired')); return; }
    setSaving(true); setError('');
    try {
      const data = {
        name: name.trim(), description: description.trim(), status, country: country?.code || null,
        associates: notifyUsers,
        priceRequestNotifyUsers: notifyUsers,
        address: address.trim(), phone: phone.trim(),
        instagramHandle: instagramHandle.trim().replace(/^@/, ''),
        websiteSlug: websiteSlug.trim(),
        misTemplates,
        crossBranchAccess,
      };
      const saved = isNew
        ? await authCtx.jwtInst({ method: 'post', url: `${axiosGlobal.defaultTargetApi}/branches`, data })
        : await authCtx.jwtInst({ method: 'put', url: `${axiosGlobal.defaultTargetApi}/branches/${branch._id}`, data });
      if (flagFile) {
        const image = new FormData();
        image.append('flag', flagFile);
        await authCtx.jwtInst({
          method: 'post',
          url: `${axiosGlobal.defaultTargetApi}/branches/${saved.data._id}/flag`,
          data: image,
        });
      }
      dispatch(actions.setShowSnackBar({ status: true,
        msg: isNew ? t('users.branchCreated') : t('users.branchUpdated'), type: 'success' }));
      onSave();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('users.failedSaveBranch'));
    } finally {
      setSaving(false);
    }
  };

  const tabSx = {
    minHeight: 38, textTransform: 'none', fontSize: '0.78rem', fontWeight: 600,
    color: T.TEXT_TER, '&.Mui-selected': { color: T.TEXT_PRI },
  };

  return (
    <Dialog
      open={open} onClose={onClose} fullScreen={isXs} maxWidth="sm" fullWidth
      PaperProps={{ sx: {
        bgcolor: T.DIALOG_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: isXs ? 0 : '14px', backgroundImage: 'none',
      }}}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, pt: 2, pb: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {isNew ? t('users.newBranch') : t('users.editBranch', { name: branch?.name })}
        </Typography>
        <IconButton onClick={onClose} size="small"
          sx={{ color: T.TEXT_SEC, '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{ px: 3, minHeight: 38, borderBottom: `1px solid ${T.DIVIDER}`,
          '& .MuiTabs-indicator': { bgcolor: T.TEXT_PRI, height: 2 } }}>
        <Tab label={t('users.branchDetailsTab')} sx={tabSx} />
        <Tab label={t('users.branchContactTab')} sx={tabSx} />
        <Tab label={t('users.branchDocumentsTab')} sx={tabSx} />
      </Tabs>

      <Box sx={{ px: 3, pt: 2.5, pb: 2, minHeight: isXs ? 'auto' : 340,
        display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* ── Tab 0 — identity ── */}
        {tab === 0 && (<>
          <TextField label={t('users.branchNameLabel')} size="small" fullWidth value={name}
            onChange={e => { setName(e.target.value); setError(''); }} sx={inputSx} autoFocus />

          <TextField label={t('users.descriptionLabel')} size="small" fullWidth multiline rows={3}
            value={description} onChange={e => setDescription(e.target.value)} sx={inputSx} />

          <Autocomplete
            value={country}
            onChange={(_, val) => setCountry(val)}
            options={COUNTRIES}
            slotProps={popperSx}
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
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase',
                letterSpacing: 1, mb: 1 }}>
                {t('users.statusLabel')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                {[{ v: 'active', l: t('users.statusActive') }, { v: 'archived', l: t('users.statusArchived') }]
                  .map(opt => {
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
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mt: 0.75 }}>
                {t('users.branchArchiveHelper')}
              </Typography>
            </Box>
          )}

          {/* Which OTHER branches may browse THIS branch's Inventory + Supply
              and raise stock requests against it. Only meaningful on an
              existing branch, since it needs an id to exclude itself. */}
          {!isNew && (
            <Box>
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase',
                letterSpacing: 1, mb: 0.75 }}>
                {t('users.branchSharingSection')}
              </Typography>
              <Autocomplete
                multiple size="small"
                options={allBranches
                  .filter((b) => String(b._id) !== String(branch?._id))
                  .map((b) => String(b._id))}
                slotProps={popperSx}
                getOptionLabel={(id) => {
                  const b = allBranches.find((x) => String(x._id) === String(id));
                  return b ? b.name : '';
                }}
                value={crossBranchAccess}
                onChange={(_, val) => setCrossBranchAccess(val)}
                renderTags={(value, getTagProps) => value.map((id, i) => {
                  const b = allBranches.find((x) => String(x._id) === String(id));
                  return <Chip size="small" key={id} label={b ? b.name : id}
                    {...getTagProps({ index: i })} />;
                })}
                renderInput={(params) => (
                  <TextField {...params} label={t('users.branchSharedWithLabel')} sx={inputSx} />
                )}
              />
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mt: 0.5, lineHeight: 1.6 }}>
                {t('users.branchSharedWithHelper')}
              </Typography>
            </Box>
          )}
        </>)}

        {/* ── Tab 1 — contact / public site ── */}
        {tab === 1 && (<>
          <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, lineHeight: 1.5 }}>
            {t('users.branchPublicSiteHelper')}
          </Typography>

          <TextField label={t('users.branchAddressLabel')} size="small" fullWidth
            multiline rows={3} value={address}
            onChange={e => setAddress(e.target.value)} sx={inputSx} />

          <TextField label={t('users.branchPhoneLabel')} size="small" fullWidth value={phone}
            type="tel" inputProps={{ dir: 'ltr', inputMode: 'tel' }}
            onChange={e => setPhone(e.target.value)}
            sx={{ ...inputSx, '& input': { ...inputSx['& input'], fontFamily: 'monospace' } }} />

          <TextField label={t('users.branchInstagramLabel')} size="small" fullWidth
            value={instagramHandle} placeholder="lmc.ksa"
            onChange={e => setInstagramHandle(e.target.value.replace(/^@/, ''))}
            InputProps={{ startAdornment: (
              <InputAdornment position="start">
                <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_TER }}>@</Typography>
              </InputAdornment>
            ) }}
            inputProps={{ dir: 'ltr', autoCapitalize: 'none', spellCheck: false }}
            helperText={instagramHandle ? `instagram.com/${instagramHandle}` : t('users.branchInstagramHelper')}
            sx={inputSx} />
          <TextField label={t('users.branchWebsiteSlugLabel')} size="small" fullWidth
            value={websiteSlug} placeholder="ksa"
            onChange={e => setWebsiteSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            inputProps={{ dir: 'ltr', autoCapitalize: 'none', spellCheck: false }}
            helperText={websiteSlug ? `lazulitemarble.com/${websiteSlug}/ · lazulitemarble.com/${websiteSlug}/ar/` : t('users.branchWebsiteSlugHelper')}
            sx={inputSx} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {branch?.flagImage && !flagFile && (
              <Box component="img" src={`${axiosGlobal.defaultTargetApi}${branch.flagImage}`}
                alt="" sx={{ width: 48, height: 36, objectFit: 'contain' }} />
            )}
            <Button component="label" variant="outlined" size="small" sx={{ textTransform: 'none' }}>
              {t('users.branchFlagUpload')}
              <input hidden type="file" accept="image/png,image/jpeg,image/webp"
                onChange={e => setFlagFile(e.target.files?.[0] || null)} />
            </Button>
            {flagFile && <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC }}>{flagFile.name}</Typography>}
          </Box>
        </>)}

        {/* ── Tab 2 — documents ── */}
        {tab === 2 && (<>
          <Box>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase',
              letterSpacing: 1, mb: 0.75 }}>
              {t('users.branchMisTemplatesSection')}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, mb: 1.5, lineHeight: 1.5 }}>
              {t('users.branchTemplatesHelper')}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: isXs ? '1fr' : '1fr 1fr', gap: 1.5 }}>
              {TEMPLATE_FIELDS.map(([key, labelKey]) => (
                <TextField key={key} select size="small" fullWidth sx={inputSx}
                  label={t(labelKey)} InputLabelProps={{ shrink: true }}
                  value={misTemplates[key] || 'classic'}
                  SelectProps={{ MenuProps: { sx: { zIndex: (th) => th.zIndex.modal + 2 } } }}
                  onChange={(e) => setMisTemplates((m) => ({ ...m, [key]: e.target.value }))}>
                  <MenuItem value="classic">{t('users.templateClassic')}</MenuItem>
                </TextField>
              ))}
            </Box>
          </Box>

          <Box>
            <Autocomplete
              multiple size="small"
              options={directoryOptions}
              slotProps={popperSx}
              getOptionLabel={(id) => {
                const u = userDirectory[id];
                return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '';
              }}
              value={notifyUsers}
              onChange={(_, val) => setNotifyUsers(val)}
              renderTags={(value, getTagProps) => value.map((id, i) => (
                <Chip size="small" key={id}
                  label={userDirectory[id] ? `${userDirectory[id].firstName || ''} ${userDirectory[id].lastName || ''}`.trim() : ''}
                  {...getTagProps({ index: i })} />
              ))}
              renderInput={(params) => (
                <TextField {...params} label={t('users.branchNotifyUsersLabel')} sx={inputSx} />
              )}
            />
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, mt: 0.5 }}>
              {t('users.branchNotifyUsersHelper')}
            </Typography>
          </Box>
        </>)}

        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </Box>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5, gap: 1, borderTop: `1px solid ${T.DIVIDER}` }}>
        <Button onClick={onClose}
          sx={{ color: T.TEXT_SEC, textTransform: 'none', '&:hover': { bgcolor: T.HVR_BG, color: T.TEXT_PRI } }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, borderRadius: '8px', px: 3,
            textTransform: 'none',
            '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' },
            '&.Mui-disabled': { bgcolor: T.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
              color: T.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)' } }}>
          {saving ? t('users.saving') : isNew ? t('users.create') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main BranchesManager ──────────────────────────────────────────────────────
const BranchesManager = ({ onSelect, selectedId, editRequest }) => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const T           = useT();
  const { t }       = useTranslation();
  const { refreshBranches, activeBranchId } = useBranch();

  const [branches,   setBranches]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [formOpen,   setFormOpen]   = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search,     setSearch]     = useState('');

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

  // The detail panel's Edit button raises a request here, so there is still
  // exactly one form instance in the section.
  useEffect(() => {
    if (!editRequest?.branch) return;
    setEditBranch(editRequest.branch);
    setFormOpen(true);
  }, [editRequest?.key]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the open detail panel in step with a save: re-hand the caller the
  // freshly fetched branch, otherwise the panel keeps rendering the old copy.
  useEffect(() => {
    if (!selectedId || !onSelect || branches.length === 0) return;
    const fresh = branches.find((b) => String(b._id) === String(selectedId));
    if (fresh) onSelect(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]);

  const afterMutation = () => { fetchAll(); refreshBranches(); };

  const handleDelete = async () => {
    const branch = confirmDel;
    setConfirmDel(null);
    if (!branch) return;
    setDeleting(branch._id);
    try {
      await authCtx.jwtInst({ method: 'delete', url: `${axiosGlobal.defaultTargetApi}/branches/${branch._id}` });
      dispatch(actions.setShowSnackBar({ status: true, msg: t('users.branchDeleted'), type: 'success' }));
      if (String(selectedId) === String(branch._id)) onSelect && onSelect(null);
      afterMutation();
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true,
        msg: err?.response?.data?.message || t('users.failedDelete'), type: 'error' }));
    } finally {
      setDeleting(null);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) => {
      const c = COUNTRIES.find((x) => x.code === b.country);
      return `${b.name || ''} ${b.description || ''} ${c?.name || ''}`.toLowerCase().includes(q);
    });
  }, [branches, search]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress size={26} sx={{ color: T.TEXT_TER }} />
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
        <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER }}>
          {t('users.branchCount', { count: branches.length })}
        </Typography>
        <Button size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />}
          onClick={() => { setEditBranch(null); setFormOpen(true); }}
          sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 600, borderRadius: '8px',
            px: 2, py: '5px', fontSize: '0.78rem', textTransform: 'none', flexShrink: 0,
            '&:hover': { bgcolor: T.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
          {t('users.newBranch')}
        </Button>
      </Box>

      {/* Search — only once there are enough branches for it to matter */}
      {branches.length > 4 && (
        <TextField size="small" fullWidth value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t('users.branchSearchPlaceholder')}
          sx={{ mb: 1.5,
            '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI,
              '& fieldset': { borderColor: T.INPUT_BD } },
            '& input': { color: T.TEXT_PRI, fontSize: '0.82rem' } }}
          InputProps={{ startAdornment: (
            <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: T.TEXT_TER }} /></InputAdornment>
          ) }} />
      )}

      <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mb: 2, lineHeight: 1.5 }}>
        {t('users.branchesIntro')}
      </Typography>

      {visible.length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: T.TEXT_SEC, py: 6, fontSize: '0.875rem' }}>
          {search ? t('users.branchNoneMatch') : t('users.noBranchesYet')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {visible.map(branch => {
            const country = COUNTRIES.find((c) => c.code === branch.country) || null;
            const archived = branch.status === 'archived';
            const selected = String(selectedId) === String(branch._id);
            const isActive = String(activeBranchId) === String(branch._id);
            return (
              <Box key={branch._id}
                onClick={() => onSelect && onSelect(branch)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.75, py: 1.25,
                  bgcolor: selected ? T.SEL_BG : T.CARD_BG,
                  border: `1.5px solid ${selected ? T.SEL_BD : T.CARD_BD}`,
                  borderRadius: '12px', cursor: onSelect ? 'pointer' : 'default',
                  opacity: archived ? 0.65 : 1,
                  '&:hover': { borderColor: selected ? T.SEL_BD : T.HVR_BD },
                  transition: 'border-color 0.15s, background-color 0.15s' }}>

                {/* Flag, or a generic store mark when no country is set */}
                <Box sx={{ width: 32, height: 32, borderRadius: '9px', flexShrink: 0,
                  bgcolor: T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: country ? '1.05rem' : undefined }}>
                  {branch.flagImage
                    ? <Box component="img" src={`${axiosGlobal.defaultTargetApi}${branch.flagImage}`}
                        alt="" sx={{ width: 24, height: 18, objectFit: 'contain' }} />
                    : country ? country.flag : <StoreIcon sx={{ fontSize: 16, color: T.TEXT_SEC }} />}
                </Box>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: T.TEXT_PRI }}>
                      {branch.name}
                    </Typography>
                    {isActive && (
                      <Tooltip title={t('users.branchActiveTooltip')}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#81C784' }} />
                      </Tooltip>
                    )}
                    {archived && (
                      <Chip label={t('users.archivedBadge')} size="small"
                        sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, borderRadius: '3px',
                          bgcolor: T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          color: T.TEXT_TER, '& .MuiChip-label': { px: 0.75 } }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, lineHeight: 1.4 }} noWrap>
                    {[country?.name, branch.description].filter(Boolean).join(' · ') || t('users.branchNoDescription')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                  <IconButton size="small"
                    onClick={(e) => { e.stopPropagation(); setEditBranch(branch); setFormOpen(true); }}
                    sx={{ color: T.TEXT_TER, '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
                    <EditIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                  <IconButton size="small" disabled={deleting === branch._id}
                    onClick={(e) => { e.stopPropagation(); setConfirmDel(branch); }}
                    sx={{ color: T.TEXT_TER, '&:hover': { color: T.ERR_CLR, bgcolor: 'rgba(255,77,141,0.08)' } }}>
                    {deleting === branch._id
                      ? <CircularProgress size={13} sx={{ color: T.TEXT_TER }} />
                      : <DeleteIcon sx={{ fontSize: 15 }} />}
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <BranchForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={afterMutation}
        branch={editBranch}
        allBranches={branches}
      />

      <ConfirmDialog
        open={Boolean(confirmDel)}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title={t('users.branchDeleteTitle')}
        message={t('users.deleteBranchConfirm', { name: confirmDel?.name })}
        destructive
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </Box>
  );
};

export { BranchForm };
export default BranchesManager;
