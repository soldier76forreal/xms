import { useState, useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';

import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { fetchMisCompanyProfile, saveMisCompanyProfile } from '../../../store/store';

// Phase 6 — companyProfile settings editor (Session 45, admin / mis:settings:edit).
// The STATIC invoice template header/footer: seller identity + TRN, bank block,
// VAT default, thank-you note, quote validity. NEVER hardcoded in the template —
// this editor is the single place these values are maintained.

const SECTIONS = [
  {
    title: 'Seller identity',
    fields: [
      { key: 'nameAr',          label: 'Company name (Arabic)', rtl: true },
      { key: 'nameEn',          label: 'Company name (English)' },
      { key: 'trn',             label: 'TRN (ب.ض — seller VAT no.)' },
      { key: 'branchAddressAr', label: 'Branch / address (Arabic)', rtl: true },
      { key: 'phonesText',      label: 'Phones (comma-separated)' },
      { key: 'email',           label: 'Email' },
      { key: 'website',         label: 'Website' },
    ],
  },
  {
    title: 'Bank details',
    fields: [
      { key: 'bank.name',          label: 'Bank name' },
      { key: 'bank.accountNumber', label: 'Account number' },
      { key: 'bank.iban',          label: 'IBAN' },
      { key: 'bank.branch',        label: 'Branch' },
      { key: 'bank.swift',         label: 'SWIFT' },
    ],
  },
  {
    title: 'Document defaults',
    fields: [
      { key: 'vatRate',                      label: 'VAT rate (%)', type: 'number' },
      { key: 'quotationValidityDefaultDays', label: 'Quote validity (days)', type: 'number' },
      { key: 'thankYouNoteAr',               label: 'Thank-you note (Arabic)', rtl: true, multiline: true },
    ],
  },
];

const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const setPath = (obj, path, value) => {
  const keys = path.split('.');
  const next = { ...obj };
  let cur = next;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value;
    else { cur[k] = { ...(cur[k] || {}) }; cur = cur[k]; }
  });
  return next;
};

export default function CompanyProfileDrawer({ open, onClose }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const profile = useSelector(s => s.misCompanyProfile);

  const T = {
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
  };

  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) dispatch(fetchMisCompanyProfile({ authCtx, axiosGlobal }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (profile) {
      setValues({ ...profile, phonesText: (profile.phones || []).join(', ') });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const { phonesText, _id, key, updateDate, updatedBy, __v, ...rest } = values;
    const data = {
      ...rest,
      phones: (phonesText || '').split(',').map(p => p.trim()).filter(Boolean),
      vatRate: Number(values.vatRate) || 0,
      quotationValidityDefaultDays: Number(values.quotationValidityDefaultDays) || 0,
    };
    await dispatch(saveMisCompanyProfile({ authCtx, axiosGlobal, data }));
    setSaving(false);
    onClose();
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100vw', sm: 400 },
        bgcolor: T.PANEL_BG, borderLeft: `1px solid ${T.BD}` } }}>

      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5,
        borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
          Invoice template settings
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: T.TEXT_TER }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 2,
        display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {SECTIONS.map(section => (
          <Box key={section.title}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', color: T.TEXT_TER, mb: 1.25 }}>
              {section.title}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {section.fields.map(f => (
                <TextField key={f.key} size="small" fullWidth
                  label={f.label}
                  type={f.type || 'text'}
                  multiline={Boolean(f.multiline)}
                  minRows={f.multiline ? 2 : undefined}
                  value={getPath(values, f.key) ?? ''}
                  onChange={(e) => setValues(v => setPath(v, f.key, e.target.value))}
                  inputProps={{ style: { fontSize: '0.8rem', direction: f.rtl ? 'rtl' : 'ltr' } }}
                  InputLabelProps={{ style: { fontSize: '0.75rem' } }}
                  sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD } }} />
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${T.BD}`, display: 'flex', gap: 1, flexShrink: 0 }}>
        <Button fullWidth variant="contained" size="small" disabled={saving} onClick={handleSave}
          sx={{ fontSize: '0.78rem', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}>
          {saving ? <CircularProgress size={14} sx={{ mr: 0.75 }} /> : null}
          Save settings
        </Button>
      </Box>
    </Drawer>
  );
}
