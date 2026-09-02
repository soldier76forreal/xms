import { useState, useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CampaignIcon from '@mui/icons-material/Campaign';
import TelegramIcon from '@mui/icons-material/Telegram';
import CallIcon from '@mui/icons-material/Call';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LinkIcon from '@mui/icons-material/Link';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { createLinkPage, updateLinkPage } from '../../store/store';
import { enqueueUpload } from '../../tools/uploadCenter/uploadManager';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import { LANGUAGES } from '../../i18n';

const LINK_TYPES = [
  { value: 'whatsapp',        labelKey: 'dm.linkTypeWhatsapp',        Icon: WhatsAppIcon, color: '#25D366' },
  { value: 'whatsappChannel', labelKey: 'dm.linkTypeWhatsappChannel', Icon: CampaignIcon, color: '#25D366' },
  { value: 'telegram', labelKey: 'dm.linkTypeTelegram', Icon: TelegramIcon, color: '#229ED9' },
  { value: 'phone',    labelKey: 'dm.linkTypePhone',    Icon: CallIcon,     color: '#888' },
  { value: 'email',    labelKey: 'dm.linkTypeEmail',    Icon: EmailIcon,    color: '#888' },
  { value: 'website',  labelKey: 'dm.linkTypeWebsite',  Icon: LanguageIcon, color: '#888' },
  { value: 'address',  labelKey: 'dm.linkTypeAddress',  Icon: LocationOnIcon, color: '#888' },
  { value: 'other',    labelKey: 'dm.linkTypeOther',    Icon: LinkIcon,     color: '#888' },
];

let localKeyCounter = 0;
const nextLocalKey = () => `l${Date.now()}_${localKeyCounter++}`;

// Create/edit Drawer for an External Link Page (see linkPageSection.js). Company
// name is placed LAST in the form per explicit request — every other field
// (cover, links, restrict-to-me, active toggle) comes before it.
export default function LinkPageForm({ open, onClose, linkPage = null }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const isEdit = Boolean(linkPage);

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    CARD_BG:   isDark ? '#151515'                : 'rgba(0,0,0,0.02)',
    CARD_BD:   isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    ERR_CLR:   '#FF4D8D',
  };

  const [coverFile, setCoverFile] = useState(null);      // newly picked File
  const [coverPreview, setCoverPreview] = useState(null); // object URL or existing disk URL
  const [links, setLinks] = useState([]);                 // [{ key, type, label, value }] — array order IS the display order
  const [active, setActive] = useState(true);
  const [restrictToOwner, setRestrictToOwner] = useState(false);
  const [language, setLanguage] = useState('en');
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (linkPage) {
      setCompanyName(linkPage.companyName || '');
      setLinks((linkPage.links || []).map((l) => ({ key: nextLocalKey(), ...l })));
      setActive(linkPage.status !== 'inactive');
      setRestrictToOwner(!!linkPage.restrictToOwner);
      setLanguage(linkPage.language || 'en');
      setCoverPreview(linkPage.coverImage?.diskName ? `${axiosGlobal.defaultTargetApi}/uploads/${linkPage.coverImage.diskName}` : null);
    } else {
      setCompanyName(''); setLinks([]); setActive(true); setRestrictToOwner(false); setLanguage('en'); setCoverPreview(null);
    }
    setCoverFile(null); setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, linkPage]);

  const hasUnsaved = companyName || links.length > 0 || coverFile;

  const handleClose = () => {
    if (hasUnsaved) { setConfirmDiscard(true); return; }
    onClose();
  };
  const discardAndClose = () => onClose();

  const pickCover = (file) => {
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const addLink = () => setLinks((prev) => [...prev, { key: nextLocalKey(), type: 'whatsapp', label: '', value: '' }]);
  const removeLink = (key) => setLinks((prev) => prev.filter((l) => l.key !== key));
  const updateLink = (key, field, val) => setLinks((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: val } : l)));
  const moveLink = (key, dir) => setLinks((prev) => {
    const idx = prev.findIndex((l) => l.key === key);
    const swapWith = idx + dir;
    if (idx < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
    const next = [...prev];
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    return next;
  });

  // Metadata saves immediately (JSON, no file). A newly picked cover is
  // handed to the Upload Center separately and finishes in the background —
  // dmLinkPageCover SETS the cover field (never appends; a page has exactly
  // one), so this is correct whether the page was just created or already
  // had a different cover.
  const handleSave = async () => {
    if (!companyName.trim()) { setError(t('dm.linkPageCompanyNameRequired')); return; }
    if (links.some((l) => !l.value.trim())) { setError(t('dm.linkPageValueRequired')); return; }

    setSaving(true); setError('');
    try {
      const metadata = {
        companyName: companyName.trim(),
        links: links.map(({ type, label, value }) => ({ type, label, value: value.trim() })),
        language,
        status: active ? 'active' : 'inactive',
        restrictToOwner,
      };

      const saved = isEdit
        ? await dispatch(updateLinkPage({ authCtx, axiosGlobal, id: linkPage._id, formData: metadata })).unwrap()
        : await dispatch(createLinkPage({ authCtx, axiosGlobal, formData: metadata })).unwrap();

      if (coverFile) {
        enqueueUpload({ purpose: 'dmLinkPageCover', targetId: saved._id, file: coverFile, sectionLabel: t('nav.digitalMarketing') });
      }

      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('dm.linkPageFailedToSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}
      PaperProps={{ sx: { width: isXs ? '100vw' : 480, bgcolor: T.DIALOG_BG, backgroundImage: 'none' } }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {isEdit ? t('dm.editLinkPage') : t('dm.newLinkPage')}
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* ── Page language — fixes what the PUBLIC page renders in, no
            visitor-facing switcher (a customer has no account/preference to honor) ── */}
        <TextField select size="small" label={t('dm.linkPageLanguageLabel')} value={language}
          onChange={(e) => setLanguage(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.nativeLabel}</option>)}
        </TextField>

        {/* ── Cover image ── */}
        <Box>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.TEXT_TER, mb: 1 }}>
            {t('dm.linkPageCoverImage')}
          </Typography>
          {coverPreview ? (
            <Box sx={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', height: 140 }}>
              <Box component="img" src={coverPreview} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <Button component="label" size="small"
                sx={{ position: 'absolute', bottom: 8, right: 8, fontSize: '0.68rem', textTransform: 'none',
                  bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '6px', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                {t('dm.linkPageChangeCover')}
                <input type="file" hidden accept="image/*" onChange={(e) => { pickCover(e.target.files?.[0]); e.target.value = ''; }} />
              </Button>
            </Box>
          ) : (
            <Button component="label" fullWidth startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 16 }} />}
              sx={{ borderRadius: '10px', border: `1.5px dashed ${T.INPUT_BD}`, py: 1.5,
                color: T.TEXT_SEC, textTransform: 'none', fontSize: '0.8rem',
                '&:hover': { borderColor: T.TEXT_PRI, color: T.TEXT_PRI } }}>
              {t('dm.linkPageSelectCover')}
              <input type="file" hidden accept="image/*" onChange={(e) => { pickCover(e.target.files?.[0]); e.target.value = ''; }} />
            </Button>
          )}
        </Box>

        {/* ── Links ── */}
        <Box>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.TEXT_TER, mb: 1 }}>
            {t('dm.linkPageLinksLabel')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {links.map((l, idx) => {
              const meta = LINK_TYPES.find((lt) => lt.value === l.type) || LINK_TYPES[0];
              return (
                <Box key={l.key} sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
                    <meta.Icon sx={{ fontSize: 18, color: meta.color, flexShrink: 0 }} />
                    <TextField select size="small" value={l.type} onChange={(e) => updateLink(l.key, 'type', e.target.value)}
                      SelectProps={{ native: true }}
                      sx={{ flex: '1 1 100px', minWidth: 0, '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', fontSize: '0.78rem' } }}>
                      {LINK_TYPES.map((lt) => <option key={lt.value} value={lt.value}>{t(lt.labelKey)}</option>)}
                    </TextField>
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />
                    <Box sx={{ display: 'flex', gap: 0.25, ml: 'auto' }}>
                      <Tooltip title={t('dm.linkPageMoveUp')}>
                        <span>
                          <IconButton size="small" onClick={() => moveLink(l.key, -1)} disabled={idx === 0}
                            sx={{ color: T.TEXT_TER, width: 26, height: 26 }}>
                            <ArrowUpwardIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={t('dm.linkPageMoveDown')}>
                        <span>
                          <IconButton size="small" onClick={() => moveLink(l.key, 1)} disabled={idx === links.length - 1}
                            sx={{ color: T.TEXT_TER, width: 26, height: 26 }}>
                            <ArrowDownwardIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={t('dm.linkPageRemoveLink')}>
                        <IconButton size="small" onClick={() => removeLink(l.key)} sx={{ color: T.ERR_CLR, width: 26, height: 26 }}>
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  {l.type === 'other' && (
                    <TextField size="small" fullWidth placeholder={t('dm.linkPageLabelPlaceholder')}
                      value={l.label} onChange={(e) => updateLink(l.key, 'label', e.target.value)}
                      sx={{ mb: 1, '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', fontSize: '0.78rem' } }} />
                  )}
                  <TextField size="small" fullWidth placeholder={t(`dm.linkTypeValuePlaceholder_${l.type}`)}
                    value={l.value} onChange={(e) => updateLink(l.key, 'value', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', fontSize: '0.78rem' } }} />
                </Box>
              );
            })}
            <Button onClick={addLink} startIcon={<AddIcon sx={{ fontSize: 15 }} />}
              sx={{ alignSelf: 'flex-start', fontSize: '0.75rem', textTransform: 'none', color: T.TEXT_SEC }}>
              {t('dm.linkPageAddLink')}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ borderColor: T.DIVIDER }} />

        <FormControlLabel
          control={<Checkbox size="small" checked={restrictToOwner} onChange={(e) => setRestrictToOwner(e.target.checked)} />}
          label={<Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>{t('dm.linkPageRestrictToOwner')}</Typography>} />
        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, mt: -1.5 }}>{t('dm.linkPageRestrictToOwnerHint')}</Typography>

        <FormControlLabel
          control={<Checkbox size="small" checked={active} onChange={(e) => setActive(e.target.checked)} />}
          label={<Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>{t('dm.linkPageActiveToggle')}</Typography>} />

        <Divider sx={{ borderColor: T.DIVIDER }} />

        {/* ── Company name — LAST field in the form, per explicit request ── */}
        <TextField label={t('dm.linkPageCompanyName')} size="small" fullWidth value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </Box>

      <Box sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${T.DIVIDER}` }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>{t('common.cancel')}</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={handleSave} disabled={saving} variant="contained"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700 }}>
            {saving ? t('dm.linkPageSavingEllipsis') : (isEdit ? t('common.save') : t('dm.linkPageCreateButton'))}
          </Button>
        </Box>
      </Box>

      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={discardAndClose}
        title={t('dm.linkPageDiscardTitle')}
        message={t('dm.linkPageDiscardMessage')}
        confirmLabel={t('common.discard')}
        destructive
      />
    </Drawer>
  );
}
