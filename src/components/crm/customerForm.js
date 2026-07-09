import { useState, useEffect, useContext, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import InputBase from '@mui/material/InputBase';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import { useTheme, useMediaQuery } from '@mui/material';
import { useDispatch } from 'react-redux';

import CloseIcon      from '@mui/icons-material/Close';
import AddIcon        from '@mui/icons-material/Add';
import SearchIcon     from '@mui/icons-material/Search';
import BusinessIcon   from '@mui/icons-material/Business';
import PersonIcon     from '@mui/icons-material/Person';
import WhatsAppIcon   from '@mui/icons-material/WhatsApp';
import CallIcon       from '@mui/icons-material/Call';
import EmailIcon      from '@mui/icons-material/Email';
import TelegramIcon   from '@mui/icons-material/Telegram';
import InstagramIcon  from '@mui/icons-material/Instagram';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { actions } from '../../store/store';
import useForm, { required } from '../../tools/hooks/useForm';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import COUNTRIES from './util/countryData';

// ── constants ─────────────────────────────────────────────────────────────────

const COMM_CHANNELS = [
  { key: 'whatsApp',  label: 'WhatsApp',  icon: <WhatsAppIcon  sx={{ fontSize: 15 }} /> },
  { key: 'phone',     label: 'Phone',     icon: <CallIcon      sx={{ fontSize: 15 }} /> },
  { key: 'email',     label: 'Email',     icon: <EmailIcon     sx={{ fontSize: 15 }} /> },
  { key: 'telegram',  label: 'Telegram',  icon: <TelegramIcon  sx={{ fontSize: 15 }} /> },
  { key: 'instagram', label: 'Instagram', icon: <InstagramIcon sx={{ fontSize: 15 }} /> },
];

const CHANNEL_PLACEHOLDER = {
  whatsApp:  '+971 50 123 4567',
  phone:     '+971 4 123 4567',
  email:     'name@example.com',
  telegram:  '@username',
  instagram: '@handle',
};

const STATUS_OPTIONS = [
  { value: 'new',       label: 'New' },
  { value: 'active',    label: 'Active' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'won',       label: 'Won' },
  { value: 'lost',      label: 'Lost' },
];

const ATTRACTED_BY_OPTIONS = ['Exhibition', 'Referral', 'Social media', 'Website', 'Cold call', 'Other'];

// initial form values — mirrors the customer model fields we care about
const buildInitial = (customer) => {
  if (!customer) {
    // Default country code = UAE
    const defaultCC = COUNTRIES.find(c => c.code === 'AE') || COUNTRIES[0];
    return {
      customerType: 'individual',
      firstName: '', lastName: '',
      companyName: '', contactPerson: '',
      phoneCountryCode: defaultCC,   // full country object
      phoneNumber: '',
      commChannels: [], commHandles: {},
      country: null,                 // full country object or null
      city: '',
      State: '', address: '', postalCode: '',
      attractedBy: '',
      status: 'new',
      tags: [],
      interestedProducts: [],
      explanations: '',
    };
  }
  const pi = customer.personalInformation || {};
  // Resolve country code object from stored ISO code
  const storedCC = customer.phoneCountryCode;
  const ccObj = storedCC
    ? (COUNTRIES.find(c => c.code === storedCC) || COUNTRIES.find(c => c.dialCode === storedCC) || null)
    : (COUNTRIES.find(c => c.code === 'AE') || null);
  // Resolve country object from stored name
  const storedCountry = pi.country || '';
  const countryObj = storedCountry
    ? (COUNTRIES.find(c => c.name.toLowerCase() === storedCountry.toLowerCase()) || null)
    : null;

  // Primary/shipping address lives in the top-level `address[]` array (addressSchema),
  // NOT under personalInformation (that nested object never declared these sub-fields,
  // so anything written there was silently dropped by Mongoose strict mode — bug fix).
  const addr = (customer.address && customer.address[0]) || {};

  return {
    customerType: pi.personOrCompany || pi.customerType || 'individual',
    firstName:    pi.firstName    || '',
    lastName:     pi.lastName     || '',
    companyName:  pi.companyName  || '',
    contactPerson:pi.contactPerson|| '',
    phoneCountryCode: ccObj,
    phoneNumber:  customer.phoneNumber || customer.contactInfo?.phoneNumbers?.[0]?.number || '',
    commChannels: customer.commChannels || [],
    commHandles:  customer.commHandles  || {},
    country:      countryObj,
    city:         addr.city       || '',
    State:        addr.province   || '',
    address:      addr.street     || '',
    postalCode:   addr.postalCode || '',
    attractedBy:  pi.attractedBy || '',
    status:       customer.status || 'new',
    tags:         customer.tags   || [],
    interestedProducts: customer.interestedProducts || [],
    explanations: customer.explanations || '',
  };
};

// ── CustomerForm ──────────────────────────────────────────────────────────────

const CustomerForm = ({ open, mode = 'new', customer, onClose, onSave }) => {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();

  const T = {
    BG:       isDark ? '#0d0d0d' : theme.palette.background.paper,
    SURF:     isDark ? '#111'    : '#f9f9f9',
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    ERR:      '#EA005A',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    CHIP_BG:  isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  };

  const buildSchema = (type) => ({
    ...(type === 'company'
      ? { companyName: [required('Company name is required')] }
      : { firstName:   [required('First name is required')] }),
    phoneNumber: [required('Phone number is required')],
  });

  const form = useForm(buildInitial(customer), buildSchema('individual'));

  const [saving,       setSaving]       = useState(false);
  const [dupError,     setDupError]     = useState(null);
  const [tagInput,     setTagInput]     = useState('');
  const [prodSearch,   setProdSearch]   = useState('');
  const [prodResults,  setProdResults]  = useState([]);
  const [prodLoading,  setProdLoading]  = useState(false);
  const [discardOpen,  setDiscardOpen]  = useState(false);

  // Reset form when customer or open changes
  useEffect(() => {
    if (open) {
      form.setValues(buildInitial(customer));
      setDupError(null);
      setTagInput('');
      setProdSearch('');
      setProdResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?._id]);

  // Product search (debounced)
  useEffect(() => {
    if (!prodSearch.trim()) { setProdResults([]); return; }
    const timer = setTimeout(async () => {
      setProdLoading(true);
      try {
        const res = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/crm/products-lookup`,
          params: { search: prodSearch },
        });
        setProdResults(Array.isArray(res.data) ? res.data : []);
      } catch (_) {}
      setProdLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [prodSearch, authCtx, axiosGlobal]);

  // Cities for the selected country
  const cityOptions = useMemo(() => {
    if (!form.values.country) return [];
    return form.values.country.cities || [];
  }, [form.values.country]);

  // ── helpers ────────────────────────────────────────────────────────────────

  const { values, errors, touched, isDirty, handleChange, handleBlur, fieldError,
    setErrors: setFormErrors, setTouched: setFormTouched } = form;

  const isEdit = mode === 'edit';

  const handleClose = () => {
    if (isDirty) {
      setDiscardOpen(true);
    } else {
      onClose();
    }
  };

  const handleDiscardConfirm = () => {
    setDiscardOpen(false);
    onClose();
  };

  const toggleChannel = (ch) => {
    const next = values.commChannels.includes(ch)
      ? values.commChannels.filter(c => c !== ch)
      : [...values.commChannels, ch];
    handleChange('commChannels', next);
    if (values.commChannels.includes(ch)) {
      const nextHandles = { ...values.commHandles };
      delete nextHandles[ch];
      handleChange('commHandles', nextHandles);
    }
  };

  const setHandle = (ch, val) =>
    handleChange('commHandles', { ...values.commHandles, [ch]: val });

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || values.tags.includes(t)) { setTagInput(''); return; }
    handleChange('tags', [...values.tags, t]);
    setTagInput('');
  };

  const removeTag = (t) => handleChange('tags', values.tags.filter(x => x !== t));

  // variant = undefined → whole-product (any variety) interest, matches an existing
  // entry by productId alone. variant given → a specific SKU, matches by variantId
  // (several varieties of the same root product can coexist as separate entries).
  const addProduct = (prod, variant) => {
    const key = variant ? variant._id : prod._id;
    const already = values.interestedProducts.some(ip =>
      variant ? String(ip.variantId) === String(key) : (!ip.variantId && String(ip.productId) === String(key))
    );
    if (already) return;
    handleChange('interestedProducts', [
      ...values.interestedProducts,
      {
        productId: prod._id,
        productCode: variant ? variant.code : prod.code,
        productName: prod.name,
        ...(variant ? { variantId: variant._id } : {}),
        note: '',
      },
    ]);
  };

  const removeProduct = (ip) =>
    handleChange('interestedProducts', values.interestedProducts.filter(x => x !== ip));

  const updateProductNote = (ip, note) =>
    handleChange('interestedProducts', values.interestedProducts.map(x => x === ip ? { ...x, note } : x));

  const [expandedProdId, setExpandedProdId] = useState(null);

  // ── submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const schema = buildSchema(values.customerType);
    let hasErr = false;
    const errs = {};
    for (const [field, validators] of Object.entries(schema)) {
      for (const v of validators) {
        const msg = v(values[field]);
        if (msg) { errs[field] = msg; hasErr = true; break; }
      }
    }
    if (hasErr) {
      setFormErrors(errs);
      setFormTouched(prev => Object.keys(schema).reduce((acc, k) => ({ ...acc, [k]: true }), prev));
      return;
    }

    setDupError(null);
    setSaving(true);

    const payload = {
      personalInformation: {
        personOrCompany: values.customerType,
        customerType:    values.customerType,
        firstName:       values.firstName,
        lastName:        values.lastName,
        companyName:     values.companyName,
        contactPerson:   values.contactPerson,
        country:         values.country?.name || '',
        attractedBy:     values.attractedBy,
      },
      // Primary/shipping address — the existing top-level address[] array (addressSchema),
      // not personalInformation (see buildInitial note). Single-entry array = one address per customer for now.
      address: (values.city || values.State || values.address || values.postalCode || values.country)
        ? [{
            country:    values.country?.name || '',
            city:       values.city,
            province:   values.State,
            street:     values.address,
            postalCode: values.postalCode,
          }]
        : [],
      phoneCountryCode:  values.phoneCountryCode?.code || '',
      phoneNumber:       values.phoneNumber,
      commChannels:      values.commChannels,
      commHandles:       values.commHandles,
      status:            values.status,
      tags:              values.tags,
      interestedProducts: values.interestedProducts.map(ip => ({
        productId: ip.productId,
        ...(ip.variantId ? { variantId: ip.variantId } : {}),
        note: ip.note || '',
      })),
      explanations: values.explanations,
    };

    try {
      let saved;
      if (isEdit) {
        const res = await authCtx.jwtInst({
          method: 'put',
          url: `${axiosGlobal.defaultTargetApi}/crm/customers/${customer._id}`,
          data: payload,
        });
        saved = res.data;
        dispatch(actions.crmUpsertCustomer(saved));
        dispatch(actions.setShowSnackBar({ status: true, msg: 'مشتری ویرایش شد', type: 'success' }));
      } else {
        const res = await authCtx.jwtInst({
          method: 'post',
          url: `${axiosGlobal.defaultTargetApi}/crm/customers`,
          data: payload,
        });
        saved = res.data;
        dispatch(actions.crmUpsertCustomer(saved));
        dispatch(actions.setShowSnackBar({ status: true, msg: 'مشتری اضافه شد', type: 'success' }));
      }
      onSave && onSave(saved);
      onClose();
    } catch (err) {
      if (err?.response?.status === 409) {
        setDupError('A customer with this phone number already exists.');
      } else {
        dispatch(actions.setShowSnackBar({ status: true, msg: 'خطا در ذخیره مشتری', type: 'error' }));
      }
    }
    setSaving(false);
  };

  // ── shared field sx ────────────────────────────────────────────────────────
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '9px', bgcolor: T.CTRL_BG, color: T.TEXT_PRI,
      '& fieldset': { borderColor: T.BD },
      '&:hover fieldset': { borderColor: T.BD2 },
      '&.Mui-focused fieldset': { borderColor: T.TEXT_PRI },
    },
    '& .MuiInputLabel-root': { color: T.TEXT_TER, fontSize: '0.8rem' },
    '& input, & textarea': { fontSize: '0.85rem' },
  };

  const autocompleteSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '9px', bgcolor: T.CTRL_BG, color: T.TEXT_PRI, p: '2px 8px',
      '& fieldset': { borderColor: T.BD },
      '&:hover fieldset': { borderColor: T.BD2 },
      '&.Mui-focused fieldset': { borderColor: T.TEXT_PRI },
    },
    '& .MuiInputLabel-root': { color: T.TEXT_TER, fontSize: '0.8rem' },
    '& input': { fontSize: '0.85rem', p: '4px 0 !important' },
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Drawer anchor="right" open={open} onClose={handleClose}
        PaperProps={{ sx: {
          width: { xs: '100vw', sm: 420, md: 460 },
          bgcolor: T.BG, display: 'flex', flexDirection: 'column',
        }}}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.75,
          borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
            {isEdit ? 'Edit customer' : 'New customer'}
          </Typography>
          <IconButton size="small" onClick={handleClose}
            sx={{ color: T.TEXT_TER, '&:hover': { color: T.TEXT_PRI } }}>
            <CloseIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>

        {/* ── Body ── */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2.5, py: 2 }}>

          {/* ── 1. Identity ── */}
          <SectionHeader label="Identity" T={T} />

          {/* Type toggle */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {[
              { value: 'individual', label: 'Individual', icon: <PersonIcon   sx={{ fontSize: 16 }} /> },
              { value: 'company',    label: 'Company',    icon: <BusinessIcon sx={{ fontSize: 16 }} /> },
            ].map(opt => (
              <Button key={opt.value} size="small" startIcon={opt.icon}
                onClick={() => handleChange('customerType', opt.value)}
                sx={{
                  flex: 1, borderRadius: '9px', textTransform: 'none',
                  fontSize: '0.8rem', fontWeight: values.customerType === opt.value ? 700 : 400,
                  color: values.customerType === opt.value ? T.TEXT_PRI : T.TEXT_TER,
                  bgcolor: values.customerType === opt.value
                    ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')
                    : T.CTRL_BG,
                  border: `1px solid ${values.customerType === opt.value ? T.BD2 : T.BD}`,
                }}>
                {opt.label}
              </Button>
            ))}
          </Box>

          {values.customerType === 'individual' ? (
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
              <TextField label="First name *" size="small" fullWidth
                value={values.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                error={!!fieldError('firstName')} helperText={fieldError('firstName')}
                sx={fieldSx} />
              <TextField label="Last name" size="small" fullWidth
                value={values.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
                sx={fieldSx} />
            </Box>
          ) : (
            <>
              <TextField label="Company name *" size="small" fullWidth
                value={values.companyName}
                onChange={e => handleChange('companyName', e.target.value)}
                onBlur={() => handleBlur('companyName')}
                error={!!fieldError('companyName')} helperText={fieldError('companyName')}
                sx={{ ...fieldSx, mb: 1.5 }} />
              <TextField label="Contact person" size="small" fullWidth
                value={values.contactPerson}
                onChange={e => handleChange('contactPerson', e.target.value)}
                sx={{ ...fieldSx, mb: 1.5 }} />
            </>
          )}

          <TextField label="Attracted by" size="small" fullWidth select
            value={values.attractedBy}
            onChange={e => handleChange('attractedBy', e.target.value)}
            sx={{ ...fieldSx, mb: 1.5 }}>
            <MenuItem value=""><em>— not set —</em></MenuItem>
            {ATTRACTED_BY_OPTIONS.map(o => <MenuItem key={o} value={o} sx={{ fontSize: '0.85rem' }}>{o}</MenuItem>)}
          </TextField>

          {/* ── 2. Contact & channels ── */}
          <SectionHeader label="Contact" T={T} />

          {/* Phone number with country code selector */}
          <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, alignItems: 'flex-start' }}>
            {/* Country code selector */}
            <Autocomplete
              value={values.phoneCountryCode}
              onChange={(_, val) => handleChange('phoneCountryCode', val)}
              options={COUNTRIES}
              getOptionLabel={opt => opt ? `${opt.flag} ${opt.dialCode}` : ''}
              isOptionEqualToValue={(opt, val) => opt.code === val?.code}
              disableClearable
              sx={{ width: 120, flexShrink: 0, ...autocompleteSx }}
              renderOption={(props, opt) => (
                <Box component="li" {...props} sx={{ fontSize: '0.8rem', py: '4px !important' }}>
                  <Typography sx={{ mr: 0.75, fontSize: '1rem' }}>{opt.flag}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mr: 0.5 }}>{opt.dialCode}</Typography>
                  <Typography sx={{ fontSize: '0.75rem' }}>{opt.name}</Typography>
                </Box>
              )}
              renderInput={params => (
                <TextField {...params} size="small" label="Code"
                  sx={autocompleteSx}
                  inputProps={{ ...params.inputProps, style: { fontSize: '0.8rem' } }} />
              )}
            />
            {/* Phone number field */}
            <TextField label="Phone number *" size="small" sx={{ ...fieldSx, flexGrow: 1 }}
              value={values.phoneNumber}
              onChange={e => { handleChange('phoneNumber', e.target.value); setDupError(null); }}
              onBlur={() => handleBlur('phoneNumber')}
              error={!!fieldError('phoneNumber') || !!dupError}
              helperText={fieldError('phoneNumber') || dupError}
              placeholder="50 123 4567" />
          </Box>

          {/* Channel chips */}
          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, mb: 0.75,
            textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Communication channels
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
            {COMM_CHANNELS.map(ch => {
              const active = values.commChannels.includes(ch.key);
              return (
                <Chip key={ch.key} size="small" clickable
                  icon={<Box sx={{ color: active ? T.TEXT_PRI : T.TEXT_TER, display: 'flex' }}>{ch.icon}</Box>}
                  label={ch.label}
                  onClick={() => toggleChannel(ch.key)}
                  sx={{ height: 26, fontSize: '0.75rem', borderRadius: '7px',
                    bgcolor: active
                      ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
                      : T.CHIP_BG,
                    color: active ? T.TEXT_PRI : T.TEXT_TER,
                    border: `1px solid ${active ? T.BD2 : T.BD}`,
                    '& .MuiChip-label': { px: 0.75 },
                    '& .MuiChip-icon': { ml: 0.75 },
                  }} />
              );
            })}
          </Box>

          {/* Handle inputs for selected channels */}
          {values.commChannels.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
              {values.commChannels.map(ch => {
                const cfg = COMM_CHANNELS.find(c => c.key === ch);
                return (
                  <TextField key={ch} label={cfg?.label || ch} size="small" fullWidth
                    value={values.commHandles[ch] || ''}
                    onChange={e => setHandle(ch, e.target.value)}
                    placeholder={CHANNEL_PLACEHOLDER[ch] || ''}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box sx={{ color: T.TEXT_TER, display: 'flex', alignItems: 'center' }}>
                            {cfg?.icon}
                          </Box>
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx} />
                );
              })}
            </Box>
          )}

          {/* ── 3. Location ── */}
          <SectionHeader label="Location" T={T} />

          {/* Country dropdown */}
          <Autocomplete
            value={values.country}
            onChange={(_, val) => {
              handleChange('country', val);
              handleChange('city', ''); // reset city when country changes
            }}
            options={COUNTRIES}
            getOptionLabel={opt => opt ? `${opt.flag} ${opt.name}` : ''}
            isOptionEqualToValue={(opt, val) => opt.code === val?.code}
            sx={{ mb: 1.5, ...autocompleteSx }}
            renderOption={(props, opt) => (
              <Box component="li" {...props} sx={{ fontSize: '0.8rem', py: '4px !important' }}>
                <Typography sx={{ mr: 0.75, fontSize: '1rem' }}>{opt.flag}</Typography>
                <Typography sx={{ fontSize: '0.85rem' }}>{opt.name}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', ml: 0.5 }}>{opt.dialCode}</Typography>
              </Box>
            )}
            renderInput={params => (
              <TextField {...params} size="small" label="Country"
                sx={autocompleteSx}
                inputProps={{ ...params.inputProps, style: { fontSize: '0.85rem' } }} />
            )}
          />

          {/* City: dropdown if country selected (has cities), else free text */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            {cityOptions.length > 0 ? (
              <Autocomplete
                value={values.city || null}
                onChange={(_, val) => handleChange('city', val || '')}
                options={cityOptions}
                freeSolo
                sx={{ flex: 1, ...autocompleteSx }}
                renderInput={params => (
                  <TextField {...params} size="small" label="City"
                    sx={autocompleteSx}
                    inputProps={{ ...params.inputProps, style: { fontSize: '0.85rem' } }}
                    onChange={e => handleChange('city', e.target.value)} />
                )}
              />
            ) : (
              <TextField label="City" size="small" fullWidth
                value={values.city}
                onChange={e => handleChange('city', e.target.value)}
                sx={fieldSx} />
            )}
            <TextField label="State / Province" size="small" fullWidth
              value={values.State}
              onChange={e => handleChange('State', e.target.value)}
              sx={fieldSx} />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <TextField label="Postal code" size="small" fullWidth
              value={values.postalCode}
              onChange={e => handleChange('postalCode', e.target.value)}
              sx={fieldSx} />
          </Box>

          <TextField label="Address" size="small" fullWidth multiline minRows={2}
            value={values.address}
            onChange={e => handleChange('address', e.target.value)}
            sx={{ ...fieldSx, mb: 1.5 }} />

          {/* ── 4. Interested products ── */}
          <SectionHeader label="Interested products" T={T} />

          {values.interestedProducts.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
              {values.interestedProducts.map((ip, idx) => (
                <Box key={ip.variantId || `${ip.productId}-${idx}`} sx={{ p: 1, borderRadius: '9px',
                  bgcolor: T.SURF, border: `1px solid ${T.BD}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, fontWeight: 600, fontFamily: ip.variantId ? 'monospace' : undefined }}>
                      {ip.productCode || ip.productName || String(ip.productId).slice(-6)}
                    </Typography>
                    <IconButton size="small" onClick={() => removeProduct(ip)}
                      sx={{ color: T.TEXT_TER, width: 22, height: 22, '&:hover': { color: T.ERR } }}>
                      <CloseIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Box>
                  {ip.productName && ip.productCode !== ip.productName && (
                    <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mb: 0.5 }}>
                      {ip.productName}{ip.variantId ? ' (specific variety)' : ' (any variety)'}
                    </Typography>
                  )}
                  <TextField size="small" fullWidth placeholder="Note (optional)"
                    value={ip.note || ''}
                    onChange={e => updateProductNote(ip, e.target.value)}
                    inputProps={{ style: { fontSize: '0.78rem', padding: '4px 8px' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '7px', bgcolor: T.CTRL_BG },
                      '& fieldset': { borderColor: T.BD } }} />
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75,
              bgcolor: T.CTRL_BG, borderRadius: '9px', px: 1.25, py: '6px',
              border: `1px solid ${T.BD}`, mb: 0.75 }}>
              <SearchIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />
              <InputBase value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                placeholder="Search inventory products…"
                sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, flex: 1,
                  '& input::placeholder': { color: T.TEXT_TER } }} />
              {prodLoading && <CircularProgress size={12} sx={{ color: T.TEXT_TER }} />}
            </Box>

            {prodResults.length > 0 && (
              <Box sx={{ borderRadius: '9px', border: `1px solid ${T.BD}`, overflow: 'hidden' }}>
                {prodResults.map((prod, i) => {
                  const wholeAdded = values.interestedProducts.some(ip => !ip.variantId && String(ip.productId) === String(prod._id));
                  const hasVariants = prod.variants && prod.variants.length > 0;
                  const expanded = expandedProdId === prod._id;
                  return (
                    <Box key={prod._id} sx={{ borderTop: i > 0 ? `1px solid ${T.BD}` : 'none' }}>
                      <Box
                        onClick={() => hasVariants ? setExpandedProdId(expanded ? null : prod._id) : addProduct(prod)}
                        sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', cursor: 'pointer',
                          '&:hover': { bgcolor: T.CTRL_BG } }}>
                        <Box>
                          <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>
                            {prod.code}
                          </Typography>
                          {prod.name && (
                            <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>{prod.name}</Typography>
                          )}
                        </Box>
                        {hasVariants
                          ? (expanded ? <ExpandLessIcon sx={{ fontSize: 16, color: T.TEXT_TER }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: T.TEXT_TER }} />)
                          : (wholeAdded && <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER }}>Added</Typography>)}
                      </Box>

                      {expanded && hasVariants && (
                        <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                          <Box onClick={() => !wholeAdded && addProduct(prod)}
                            sx={{ px: 2.5, py: 0.75, display: 'flex', justifyContent: 'space-between',
                              cursor: wholeAdded ? 'default' : 'pointer',
                              '&:hover': { bgcolor: wholeAdded ? undefined : T.CTRL_BG } }}>
                            <Typography sx={{ fontSize: '0.74rem', color: wholeAdded ? T.TEXT_TER : T.TEXT_PRI, fontStyle: 'italic' }}>
                              Any variety
                            </Typography>
                            {wholeAdded && <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER }}>Added</Typography>}
                          </Box>
                          {prod.variants.map((v) => {
                            const variantAdded = values.interestedProducts.some(ip => String(ip.variantId) === String(v._id));
                            return (
                              <Box key={v._id} onClick={() => !variantAdded && addProduct(prod, v)}
                                sx={{ px: 2.5, py: 0.75, display: 'flex', justifyContent: 'space-between',
                                  alignItems: 'center', cursor: variantAdded ? 'default' : 'pointer',
                                  '&:hover': { bgcolor: variantAdded ? undefined : T.CTRL_BG } }}>
                                <Typography sx={{ fontSize: '0.74rem', fontFamily: 'monospace',
                                  color: variantAdded ? T.TEXT_TER : T.TEXT_PRI }}>
                                  {v.code}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
                                    {v.quantity != null ? `${v.quantity} ${v.unit}` : ''}{v.price != null ? ` · ${v.price} AED` : ''}
                                  </Typography>
                                  {variantAdded && <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER }}>Added</Typography>}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* ── 5. Status & tags ── */}
          <SectionHeader label="Status & tags" T={T} />

          <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
            <InputLabel sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>Status</InputLabel>
            <Select value={values.status} label="Status"
              onChange={e => handleChange('status', e.target.value)}
              sx={{ borderRadius: '9px', bgcolor: T.CTRL_BG, fontSize: '0.85rem', color: T.TEXT_PRI,
                '& fieldset': { borderColor: T.BD }, '& .MuiSvgIcon-root': { color: T.TEXT_TER } }}>
              {STATUS_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.85rem' }}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {values.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {values.tags.map(tag => (
                <Chip key={tag} label={tag} size="small" onDelete={() => removeTag(tag)}
                  sx={{ height: 22, fontSize: '0.72rem', borderRadius: '5px',
                    bgcolor: T.CHIP_BG, color: T.TEXT_SEC,
                    '& .MuiChip-label': { px: 0.75 },
                    '& .MuiChip-deleteIcon': { color: T.TEXT_TER, fontSize: 13,
                      '&:hover': { color: T.ERR } } }} />
              ))}
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1,
              bgcolor: T.CTRL_BG, borderRadius: '9px', px: 1.25, py: '5px',
              border: `1px solid ${T.BD}` }}>
              <InputBase value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter…"
                sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, flex: 1,
                  '& input::placeholder': { color: T.TEXT_TER } }} />
            </Box>
            <IconButton size="small" onClick={addTag} disabled={!tagInput.trim()}
              sx={{ bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}`, borderRadius: '9px',
                width: 34, height: 34, color: T.TEXT_TER,
                '&:hover': { color: T.TEXT_PRI, borderColor: T.BD2 } }}>
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* ── 6. Notes ── */}
          <SectionHeader label="Notes" T={T} />
          <TextField label="Explanations / notes" size="small" fullWidth multiline minRows={3}
            value={values.explanations}
            onChange={e => handleChange('explanations', e.target.value)}
            sx={{ ...fieldSx, mb: 2 }} />
        </Box>

        {/* ── Footer ── */}
        <Box sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${T.BD}`,
          display: 'flex', gap: 1.25, flexShrink: 0, bgcolor: T.BG }}>
          <Button fullWidth variant="outlined" onClick={handleClose} disabled={saving}
            sx={{ borderRadius: '9px', textTransform: 'none', fontSize: '0.85rem',
              color: T.TEXT_SEC, borderColor: T.BD,
              '&:hover': { borderColor: T.BD2, bgcolor: T.CTRL_BG } }}>
            Cancel
          </Button>
          <Button fullWidth variant="contained" onClick={handleSubmit} disabled={saving}
            sx={{ borderRadius: '9px', textTransform: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
            {saving ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : (isEdit ? 'Save changes' : 'Add customer')}
          </Button>
        </Box>
      </Drawer>

      {/* ── Discard confirm dialog (replaces window.confirm) ── */}
      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={handleDiscardConfirm}
        title="Discard changes"
        message="You have unsaved changes. Discard them?"
        confirmLabel="Discard"
        destructive
      />
    </>
  );
};

// ── helpers ───────────────────────────────────────────────────────────────────

function SectionHeader({ label, T }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, mt: 0.5 }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: T.TEXT_TER,
        textTransform: 'uppercase', letterSpacing: '0.09em', flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ flexGrow: 1, height: 1, bgcolor: T.BD }} />
    </Box>
  );
}

export default CustomerForm;
