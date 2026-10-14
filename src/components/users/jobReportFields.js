// ── Job report form — field renderers and the three live pickers ────────────
// The form is drawn from a SPEC the server sends (GET /users/jobReports/
// templates), not from a hard-coded layout, so a template added in
// api/utils/jobReportTemplates.js appears here with no frontend change at all.
//
// Field labels come from the spec in all three languages rather than through
// t(): the server has to print the very same labels onto the A4 sheet, and one
// copy is what stops the screen and the paper from drifting apart. The app's
// own chrome around them (buttons, "Saved", "Add row") still uses t() as usual.
//
// Everything here is declared at MODULE scope. A component defined inside
// another component's body is a new type on every render, which remounts the
// subtree on each keystroke and throws the caret out of the field being typed
// in — the defect this app has already been bitten by six times.
import { useState, useEffect, useContext, useMemo } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ListSubheader from '@mui/material/ListSubheader';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PinterestIcon from '@mui/icons-material/Pinterest';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import LanguageIcon from '@mui/icons-material/Language';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import PublicIcon from '@mui/icons-material/Public';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// Which language the spec's labels are read in. The form opens in the user's
// own language, exactly as asked — i18n.language IS that choice, persisted by
// languageContext.
export const pickLabel = (label, lang) => {
  if (!label) return '';
  if (typeof label === 'string') return label;
  return label[lang] || label.en || '';
};

export const useSpecLang = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);
  return ['en', 'ar', 'fa'].includes(lang) ? lang : 'en';
};

// Where a field's title goes. On a desktop table the column header already
// says it, so the control carries only a placeholder; on a phone there are no
// column headers and a placeholder disappears the moment you type — so the
// title sits ABOVE the control, as a caption that stays put.
//   'float'   floating MUI label (a form field with room for one)
//   'none'    nothing but a placeholder (a desktop table cell under a header)
//   'above'   a caption above the control (every field on a phone)
export const labelModeFor = ({ dense, stacked }) => (stacked ? 'above' : dense ? 'none' : 'float');

export const FieldLabel = ({ children, T }) => (
  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: T.TEXT_SEC,
    mb: 0.4, letterSpacing: '0.01em' }}>
    {children}
  </Typography>
);

const inputSx = (T, stacked) => ({
  '& .MuiOutlinedInput-root': {
    bgcolor: T.INPUT_BG, borderRadius: stacked ? '10px' : '8px', color: T.TEXT_PRI,
    fontSize: stacked ? '1rem' : '0.8rem',
    ...(stacked ? { minHeight: 44 } : {}),
    '& fieldset': { borderColor: T.INPUT_BD },
  },
  '& .MuiInputLabel-root': { color: T.TEXT_SEC, fontSize: '0.78rem' },
  // 16px on a phone: anything smaller and iOS zooms the whole page on focus.
  '& input, & textarea': { color: T.TEXT_PRI, fontSize: stacked ? '1rem' : '0.8rem' },
  '& .MuiSelect-select': { fontSize: stacked ? '1rem' : '0.8rem' },
});

// A dropdown a MUI portal renders: kept above whatever surface opened it. Set
// unconditionally — the standing portal z-index trap in this codebase is a
// control that opens invisibly behind the drawer it belongs to.
const popperSx = { popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 2 } } };
const menuSx = { MenuProps: { sx: { zIndex: (theme) => theme.zIndex.modal + 2 } } };

// ── Social channels ─────────────────────────────────────────────────────────
// The LIST (values, labels, colours) comes from the server's template registry
// so the printed sheet names the same channels; only the icon components live
// here, keyed by the registry's `icon` name. MUI ships no TikTok, Snapchat or X
// glyph, so those three get a readable stand-in rather than a logo drawn from
// memory and drawn wrong.
const CHANNEL_ICONS = {
  whatsapp: WhatsAppIcon, instagram: InstagramIcon, telegram: TelegramIcon,
  facebook: FacebookRoundedIcon, youtube: YouTubeIcon, linkedin: LinkedInIcon,
  pinterest: PinterestIcon, email: EmailIcon, sms: SmsIcon, website: LanguageIcon,
  tiktok: MusicNoteIcon, snapchat: ChatBubbleIcon, other: PublicIcon,
};

// A brand colour is chosen for a logo, not for text on white — Snapchat yellow
// is invisible here. Anything too light is darkened until it can be read.
const readable = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum <= 0.62) return `#${m[1]}`;
  const k = 0.52 / lum;
  [r, g, b] = [r, g, b].map((c) => Math.max(0, Math.round(c * k)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

export const ChannelIcon = ({ channel, size = 16 }) => {
  if (!channel) return null;
  const Icon = CHANNEL_ICONS[channel.icon] || PublicIcon;
  // X ships no MUI glyph. A letter in a box would be read out as text and sit
  // next to the label as a second "X", so the mark is drawn instead.
  if (channel.icon === 'x') {
    return (
      <Box aria-hidden sx={{ width: size, height: size, borderRadius: '4px', bgcolor: '#000',
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <CloseIcon sx={{ fontSize: size * 0.7, color: '#fff' }} />
      </Box>
    );
  }
  return <Icon sx={{ fontSize: size, color: readable(channel.color), flexShrink: 0 }} />;
};

// ── Pick it, or type it ─────────────────────────────────────────────────────
// Some rows are about something the app knows (a catalogued stone, a customer
// on file) and some are not. Rather than forcing free text into a picker — or
// losing the link by making everything free text — the field carries both and
// this switches between them. The stored shape says which was used, so nothing
// downstream has to guess.
const ModeToggle = ({ isText, onToggle, T, titleText, titlePick, big }) => {
  const { t } = useTranslation();
  const side = big ? 44 : 26;   // 44px is the smallest comfortable touch target
  return (
    <Tooltip title={isText ? (titlePick || t('users.jrSwitchToPicker')) : (titleText || t('users.jrSwitchToText'))}>
      <IconButton size="small" onClick={onToggle}
        sx={{ width: side, height: side, borderRadius: big ? '10px' : '7px', flexShrink: 0,
          color: T.TEXT_SEC, bgcolor: T.INPUT_BG, border: `1px solid ${T.INPUT_BD}`,
          '&:hover': { bgcolor: T.INPUT_BG, color: T.TEXT_PRI } }}>
        {isText ? <ManageSearchIcon sx={{ fontSize: big ? 20 : 15 }} />
          : <TextFieldsIcon sx={{ fontSize: big ? 19 : 14 }} />}
      </IconButton>
    </Tooltip>
  );
};

// ── Debounced remote search, shared by all three pickers ────────────────────
function useLookup(path, search) {
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const term = (search || '').trim();
    if (term.length < 2) { setOptions([]); return undefined; }
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/users/jobReports/lookup/${path}`,
          params: { search: term },
        });
        if (!cancelled) { setOptions(res.data.data || []); setDenied(false); }
      } catch (err) {
        // A 403 is not a failure to report as an error: it means this person
        // does not hold the section's view permission, so the picker says so
        // instead of looking broken.
        if (!cancelled) { setOptions([]); setDenied(err?.response?.status === 403); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(id); };
  }, [path, search, authCtx, axiosGlobal.defaultTargetApi]);

  return { options, loading, denied };
}

// ── Customer ─────────────────────────────────────────────────────────────────
// Pick one from CRM, or — with crm:customer:create — add one on the spot. The
// "add" button does not create anything itself: it hands off to the shared
// customerForm Drawer (the single place a customer is created in this app),
// and the saved record comes straight back onto the row.
export const CustomerField = ({ value, onChange, label, T, canCreate, onCreateNew, dense, stacked }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { options, loading, denied } = useLookup('customers', search);

  // The picked value has to stay in the option list or MUI treats it as an
  // unknown value and clears the field — it is prepended when a fresh search
  // has not returned it.
  const selected = value || null;
  const merged = useMemo(() => {
    if (!value) return options;
    return options.some((o) => String(o.customerId) === String(value.customerId))
      ? options : [value, ...options];
  }, [options, value]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
      <Autocomplete
        fullWidth size="small" options={merged} value={selected} loading={loading}
        disabled={denied}
        isOptionEqualToValue={(o, v) => String(o.customerId) === String(v.customerId)}
        getOptionLabel={(o) => (o ? [o.name, o.phone].filter(Boolean).join(' · ') : '')}
        filterOptions={(x) => x}
        onInputChange={(_, v, reason) => { if (reason === 'input') setSearch(v); }}
        onChange={(_, v) => onChange(v ? { customerId: v.customerId, name: v.name, phone: v.phone } : null)}
        noOptionsText={denied ? t('users.jrNoCrmAccess')
          : (search.trim().length < 2 ? t('users.jrTypeToSearch') : t('common.noResults'))}
        slotProps={popperSx}
        renderOption={(props, o) => (
          <Box component="li" {...props} key={String(o.customerId)} sx={{ fontSize: '0.78rem', py: '4px !important' }}>
            <Box>
              <Box sx={{ fontWeight: 600 }}>{o.name || '—'}</Box>
              <Box sx={{ fontSize: '0.68rem', opacity: 0.6, direction: 'ltr' }}>{o.phone}</Box>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField {...params}
            label={labelModeFor({ dense, stacked }) === 'float' ? label : undefined}
            placeholder={labelModeFor({ dense, stacked }) === 'none' ? label : undefined}
            sx={inputSx(T, stacked)}
            InputProps={{ ...params.InputProps,
              endAdornment: <>{loading ? <CircularProgress size={13} /> : null}{params.InputProps.endAdornment}</> }} />
        )}
      />
      {canCreate && !denied && (
        <Button onClick={onCreateNew} size="small" title={t('users.jrAddCustomer')}
          sx={{ minWidth: 28, width: 28, height: 28, p: 0, borderRadius: '8px',
            color: T.TEXT_SEC, bgcolor: T.INPUT_BG, border: `1px solid ${T.INPUT_BD}` }}>
          <AddIcon sx={{ fontSize: 15 }} />
        </Button>
      )}
    </Box>
  );
};

// ── Inventory variety ────────────────────────────────────────────────────────
// A stone is referenced by its real product code, never typed as free text —
// which is what lets a report tie back to the catalogue.
export const VarietyField = ({ value, onChange, label, T, dense, allowText, stacked }) => {
  const { t } = useTranslation();
  const lang = useSpecLang();
  const [search, setSearch] = useState('');
  // A value already stored as free text opens in text mode, so reopening a
  // report shows it the way it was written.
  const [isText, setIsText] = useState(!!(value && value.text && !value.variantId));
  const { options, loading, denied } = useLookup('varieties', isText ? '' : search);

  const toggleMode = () => {
    setIsText((prev) => {
      // Switching modes clears the other mode's value rather than leaving a
      // stale reference behind a text box that no longer shows it.
      onChange(null);
      return !prev;
    });
  };

  // Hooks run before any branch: React requires the same order on every
  // render, and the text-mode return below is a branch.
  const selected = (value && value.variantId) ? value : null;
  const merged = useMemo(() => {
    if (!value || !value.variantId) return options;
    return options.some((o) => String(o.variantId) === String(value.variantId))
      ? options : [value, ...options];
  }, [options, value]);

  if (allowText && isText) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
        <TextField fullWidth size="small" sx={inputSx(T, stacked)}
          label={labelModeFor({ dense, stacked }) === 'float' ? label : undefined}
          placeholder={labelModeFor({ dense, stacked }) === 'float' ? t('users.jrTypeItInstead') : label}
          InputLabelProps={{ shrink: true }}
          value={(value && value.text) || ''}
          onChange={(e) => onChange(e.target.value ? { text: e.target.value } : null)} />
        <ModeToggle isText onToggle={toggleMode} T={T} big={stacked} />
      </Box>
    );
  }

  const nameOf = (o) => (lang === 'ar' && o.productNameAr) || o.productName || '';

  const picker = (
    <Autocomplete
      fullWidth size="small" options={merged} value={selected} loading={loading} disabled={denied}
      isOptionEqualToValue={(o, v) => String(o.variantId) === String(v.variantId)}
      getOptionLabel={(o) => (o ? [o.code, nameOf(o)].filter(Boolean).join(' — ') : '')}
      filterOptions={(x) => x}
      onInputChange={(_, v, reason) => { if (reason === 'input') setSearch(v); }}
      onChange={(_, v) => onChange(v ? {
        variantId: v.variantId, productId: v.productId, code: v.code,
        productName: v.productName, productNameAr: v.productNameAr, unit: v.unit,
      } : null)}
      noOptionsText={denied ? t('users.jrNoInventoryAccess')
        : (search.trim().length < 2 ? t('users.jrTypeToSearch') : t('common.noResults'))}
      slotProps={popperSx}
      renderOption={(props, o) => (
        <Box component="li" {...props} key={String(o.variantId)} sx={{ fontSize: '0.78rem', py: '4px !important' }}>
          <Box>
            <Box sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{o.code}</Box>
            <Box sx={{ fontSize: '0.68rem', opacity: 0.6 }}>
              {nameOf(o)}{o.branchName ? ` · ${o.branchName}` : ''}
              {o.quantity != null ? ` · ${o.quantity} ${o.unit || ''}` : ''}
            </Box>
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params}
          label={labelModeFor({ dense, stacked }) === 'float' ? label : undefined}
          placeholder={labelModeFor({ dense, stacked }) === 'none' ? label : undefined}
          sx={inputSx(T, stacked)}
          InputProps={{ ...params.InputProps,
            endAdornment: <>{loading ? <CircularProgress size={13} /> : null}{params.InputProps.endAdornment}</> }} />
      )}
    />
  );

  return allowText ? (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
      {picker}
      <ModeToggle isText={false} onToggle={toggleMode} T={T} big={stacked} />
    </Box>
  ) : picker;
};

// ── Digital Marketing content ────────────────────────────────────────────────
// One picker across all four DM record kinds — a rep remembers the content,
// not which sub-section of Digital Marketing it is filed under.
// These are the locale keys that actually exist (dm.tab*). The earlier
// dm.rawContents / dm.readyToUpload guesses were never defined, so i18next
// fell back to printing the key itself on the chip.
const DM_KIND_LABEL = {
  rawContent: 'dm.tabRawContents', readyToUpload: 'dm.tabReadyToUpload',
  whatsappShare: 'dm.tabWhatsappShares', linkPage: 'dm.tabLinkPages',
};

export const ContentField = ({ value, onChange, label, T, dense, stacked }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { options, loading, denied } = useLookup('content', search);

  const selected = useMemo(
    () => (value ? { kind: value.kind, id: value.recordId || value.id, title: value.title } : null),
    [value],
  );
  const merged = useMemo(() => {
    if (!selected) return options;
    return options.some((o) => `${o.kind}:${o.id}` === `${selected.kind}:${selected.id}`)
      ? options : [selected, ...options];
  }, [options, selected]);

  return (
    <Autocomplete
      fullWidth size="small" options={merged} value={selected} loading={loading} disabled={denied}
      isOptionEqualToValue={(o, v) => `${o.kind}:${o.id}` === `${v.kind}:${v.id}`}
      getOptionLabel={(o) => (o ? o.title || '' : '')}
      filterOptions={(x) => x}
      onInputChange={(_, v, reason) => { if (reason === 'input') setSearch(v); }}
      onChange={(_, v) => onChange(v ? { kind: v.kind, id: v.id, title: v.title } : null)}
      noOptionsText={denied ? t('users.jrNoDmAccess')
        : (search.trim().length < 2 ? t('users.jrTypeToSearch') : t('common.noResults'))}
      slotProps={popperSx}
      renderOption={(props, o) => (
        <Box component="li" {...props} key={`${o.kind}:${o.id}`}
          sx={{ fontSize: '0.78rem', py: '6px !important', alignItems: 'flex-start !important' }}>
          {/* The title wraps and the kind chip holds its own column — left to
              share one row they overlapped as soon as a title ran to two lines. */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%', minWidth: 0 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
              {o.title || '—'}
            </Box>
            <Chip size="small" label={t(DM_KIND_LABEL[o.kind] || o.kind)}
              sx={{ height: 18, fontSize: '0.6rem', flexShrink: 0, mt: '1px',
                '& .MuiChip-label': { px: 0.75 } }} />
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params}
          label={labelModeFor({ dense, stacked }) === 'float' ? label : undefined}
          placeholder={labelModeFor({ dense, stacked }) === 'none' ? label : undefined}
          sx={inputSx(T, stacked)}
          InputProps={{ ...params.InputProps,
            endAdornment: <>{loading ? <CircularProgress size={13} /> : null}{params.InputProps.endAdornment}</> }} />
      )}
    />
  );
};

// ── Recipient — a channel, a customer, or just words ────────────────────────
// Content goes out to a platform at least as often as to a named person, and
// sometimes to neither ("the walk-in group"). All three are first class here;
// the stored value says which was meant.
export const RecipientField = ({ value, onChange, label, T, dense, stacked, channels, canCreate, onCreateNew }) => {
  const { t } = useTranslation();
  const lang = useSpecLang();
  const mode = (value && value.mode) || 'channel';
  const [isText, setIsText] = useState(mode === 'text');

  const toggleMode = () => {
    setIsText((prev) => { onChange(null); return !prev; });
  };

  if (isText) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
        <TextField fullWidth size="small" sx={inputSx(T, stacked)}
          label={labelModeFor({ dense, stacked }) === 'float' ? label : undefined}
          placeholder={labelModeFor({ dense, stacked }) === 'float' ? t('users.jrTypeItInstead') : label}
          InputLabelProps={{ shrink: true }}
          value={(value && value.text) || ''}
          onChange={(e) => onChange(e.target.value ? { mode: 'text', text: e.target.value } : null)} />
        <ModeToggle isText onToggle={toggleMode} T={T} big={stacked} />
      </Box>
    );
  }

  // One list, two groups: every channel, then a search over CRM. Keeping them
  // in a single control is what makes "who did this go to" one question
  // instead of three.
  const channelOptions = (channels || []).map((c) => ({ kind: 'channel', channel: c }));
  const selected = value && value.mode === 'channel'
    ? channelOptions.find((o) => o.channel.value === value.channel) || null
    : null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
      {value && value.mode === 'customer' ? (
        <CustomerField value={value} label={label} T={T} dense={dense} stacked={stacked}
          canCreate={canCreate} onCreateNew={onCreateNew}
          onChange={(v) => onChange(v ? { mode: 'customer', ...v } : null)} />
      ) : (
        <TextField select fullWidth size="small" sx={inputSx(T, stacked)}
          label={labelModeFor({ dense, stacked }) === 'float' ? label : undefined}
          InputLabelProps={{ shrink: true }}
          value={selected ? selected.channel.value : ''}
          SelectProps={{
            ...menuSx,
            displayEmpty: labelModeFor({ dense, stacked }) !== 'float',
            renderValue: (v) => {
              if (!v) return <Box component="span" sx={{ opacity: 0.5 }}>{dense ? label : ''}</Box>;
              if (v === '__customer') return '';
              const ch = (channels || []).find((c) => c.value === v);
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <ChannelIcon channel={ch} size={15} />
                  <Box component="span">{pickLabel(ch && ch.label, lang)}</Box>
                </Box>
              );
            },
          }}
          onChange={(e) => {
            if (e.target.value === '__customer') { onChange({ mode: 'customer' }); return; }
            onChange(e.target.value ? { mode: 'channel', channel: e.target.value } : null);
          }}>
          <MenuItem value=""><em>—</em></MenuItem>
          {(channels || []).map((c) => (
            <MenuItem key={c.value} value={c.value} sx={{ fontSize: '0.8rem', gap: 0.75 }}>
              <ChannelIcon channel={c} size={16} />
              {pickLabel(c.label, lang)}
            </MenuItem>
          ))}
          <ListSubheader sx={{ fontSize: '0.64rem', lineHeight: 2, bgcolor: 'transparent' }}>
            {t('users.jrOrAPerson')}
          </ListSubheader>
          <MenuItem value="__customer" sx={{ fontSize: '0.8rem', gap: 0.75 }}>
            <PersonIcon sx={{ fontSize: 16, opacity: 0.6 }} />
            {t('users.jrPickCustomer')}
          </MenuItem>
        </TextField>
      )}
      <ModeToggle isText={false} onToggle={toggleMode} T={T} big={stacked} />
    </Box>
  );
};

// ── One field, whatever its type ─────────────────────────────────────────────
// `dense` is the in-table variant: the column header already carries the label,
// so it moves to the placeholder and the field loses its own.
export const SpecField = (props) => {
  const { field, lang, T, stacked } = props;
  const label = pickLabel(field.label, lang);
  // On a phone the title is a caption above the control, so it is still
  // readable once the field has something in it.
  if (stacked) {
    return (
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <FieldLabel T={T}>{label}</FieldLabel>
        <SpecControl {...props} />
      </Box>
    );
  }
  return <SpecControl {...props} />;
};

const SpecControl = ({ field, value, onChange, lang, T, dense, stacked, canCreateCustomer, onCreateCustomer, channels }) => {
  const label = pickLabel(field.label, lang);
  const mode = labelModeFor({ dense, stacked });
  const common = { size: 'small', fullWidth: true, sx: inputSx(T, stacked) };
  const labelProps = mode === 'float'
    ? { label, InputLabelProps: { shrink: true } }
    : { placeholder: mode === 'none' ? label : undefined };

  switch (field.type) {
    case 'customer':
      return (
        <CustomerField value={value} onChange={onChange} label={label} T={T} dense={dense} stacked={stacked}
          canCreate={canCreateCustomer} onCreateNew={onCreateCustomer} />
      );
    case 'variety':
      return <VarietyField value={value} onChange={onChange} label={label} T={T} dense={dense} stacked={stacked}
        allowText={field.allowText} />;
    case 'recipient':
      return (
        <RecipientField value={value} onChange={onChange} label={label} T={T} dense={dense} stacked={stacked}
          channels={channels} canCreate={canCreateCustomer} onCreateNew={onCreateCustomer} />
      );
    case 'dmContent':
      return <ContentField value={value} onChange={onChange} label={label} T={T} dense={dense} stacked={stacked} />;

    case 'select':
      return (
        <TextField {...common} {...labelProps} select
          value={value || ''} onChange={(e) => onChange(e.target.value)}
          SelectProps={{ MenuProps: { sx: { zIndex: (theme) => theme.zIndex.modal + 2 } } }}>
          <MenuItem value=""><em>—</em></MenuItem>
          {(field.options || []).map((opt) => (
            // The VALUE stays the English literal; only the label is
            // translated. Translating a stored value is the data-integrity
            // rule this app does not break.
            <MenuItem key={opt.value} value={opt.value}>{pickLabel(opt.label, lang)}</MenuItem>
          ))}
        </TextField>
      );

    case 'textarea':
      return (
        <TextField {...common} {...labelProps} multiline minRows={field.rows || 4}
          value={value || ''} onChange={(e) => onChange(e.target.value)} />
      );

    case 'date':
      return (
        <TextField {...common} label={mode === 'float' ? label : undefined} InputLabelProps={{ shrink: true }} type="date"
          value={value ? String(value).slice(0, 10) : ''} onChange={(e) => onChange(e.target.value)} />
      );

    case 'time':
      return (
        <TextField {...common} label={mode === 'float' ? label : undefined} InputLabelProps={{ shrink: true }} type="time"
          value={value || ''} onChange={(e) => onChange(e.target.value)} />
      );

    case 'number':
    case 'money':
      return (
        <TextField {...common} {...labelProps} type="number"
          inputProps={{ min: field.min, step: 'any', style: { direction: 'ltr' } }}
          value={value == null ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      );

    default:
      return (
        <TextField {...common} {...labelProps}
          value={value || ''} onChange={(e) => onChange(e.target.value)} />
      );
  }
};

// Live totals while typing. The server recomputes these on save and its answer
// is what gets stored and printed — this is only so the person filling the
// sheet can see the figure add up.
export const computeTotals = (section, rows) => (section.totals || []).map((tot) => ({
  key: tot.key,
  label: tot.label,
  value: tot.of
    ? (rows || []).reduce((sum, r) => sum + (Number(r[tot.of]) || 0), 0)
    : (rows || []).length,
}));

export const applyComputedRow = (section, row) => {
  const next = { ...row };
  (section.columns || []).forEach((col) => {
    if (!col.computed) return;
    const [a, b] = String(col.computed).split('*');
    const x = Number(next[a]);
    const y = Number(next[b]);
    next[col.key] = (Number.isFinite(x) && Number.isFinite(y)) ? Math.round(x * y * 100) / 100 : null;
  });
  return next;
};

// A row nobody has touched yet. Used to decide whether a section counts as
// filled in the navigator, and to keep a blank trailing row from being saved.
export const rowIsEmpty = (row) => Object.values(row || {}).every(
  (v) => v == null || v === '' || (typeof v === 'object' && !v),
);

export const SectionHint = ({ children, T }) => (
  <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, mt: 0.5 }}>{children}</Typography>
);

// ── Read-only view of a filed report's sections ──────────────────────────────
// The detail panel shows a template-driven report the way it was filed. It
// fetches the spec by key rather than being handed one, because a manager on
// the classic form opens a salesperson's sheet and has no spec of their own to
// render it with.
// A reference cell is an object, so plain truthiness would call {text:''}
// filled — the same test the server uses before it stores a row.
const cellEmpty = (v) => {
  if (v == null || v === '') return true;
  if (typeof v !== 'object') return false;
  return Object.values(v).every((inner) => inner == null || inner === '');
};

export const SectionsReadOnlyView = ({ templateKey, sections, T }) => {
  const { t } = useTranslation();
  const lang = useSpecLang();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const [spec, setSpec] = useState(null);
  const [channelList, setChannelList] = useState([]);

  useEffect(() => {
    let cancelled = false;
    authCtx.jwtInst({
      method: 'get',
      url: `${axiosGlobal.defaultTargetApi}/users/jobReports/templates/${templateKey || 'classic'}`,
    })
      .then((res) => {
        if (cancelled) return;
        setSpec(res.data.spec);
        setChannelList(res.data.channels || []);
      })
      .catch(() => { if (!cancelled) setSpec(null); });
    return () => { cancelled = true; };
  }, [templateKey, authCtx, axiosGlobal.defaultTargetApi]);

  if (!spec) return <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>…</Typography>;

  const show = (field, value) => {
    if (value == null || value === '') return '—';
    switch (field.type) {
      case 'customer': return [value.name, value.phone].filter(Boolean).join(' · ') || '—';
      case 'variety':
        if (value.text) return value.text;
        return [value.code, (lang === 'ar' && value.productNameAr) || value.productName]
          .filter(Boolean).join(' — ') || '—';
      case 'recipient': {
        if (value.mode === 'customer') return [value.name, value.phone].filter(Boolean).join(' · ') || '—';
        if (value.mode === 'text') return value.text || '—';
        const ch = (channelList || []).find((c) => c.value === value.channel);
        return ch ? pickLabel(ch.label, lang) : (value.channel || '—');
      }
      case 'dmContent': return value.title || '—';
      case 'date': return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      case 'number':
      case 'money': return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
      case 'select': {
        const opt = (field.options || []).find((o) => o.value === value);
        return opt ? pickLabel(opt.label, lang) : String(value);
      }
      default: return String(value);
    }
  };

  // A filed sheet reads as a document: each section is a titled card, figures
  // sit in their own column and the answers carry the weight, not the labels.
  const ACCENT = '#64b5f6';

  const filled = (spec.sections || []).map((section) => {
    const value = (sections || {})[section.key];
    const isTable = section.kind === 'table';
    const rows = isTable ? (value || []).filter((r) => !rowIsEmpty(r)) : [];
    const entries = isTable ? [] : Object.entries(value || {})
      .filter(([, v]) => !cellEmpty(v));
    return { section, isTable, rows, entries };
  }).filter((x) => (x.isTable ? x.rows.length : x.entries.length));

  const emptyNames = (spec.sections || [])
    .filter((sec) => !filled.some((f) => f.section.key === sec.key))
    .map((sec) => pickLabel(sec.label, lang));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {filled.map(({ section, isTable, rows, entries }) => (
        <Box key={section.key} sx={{
          border: `1px solid ${T.DIVIDER}`, borderRadius: '12px', overflow: 'hidden',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.75, py: 1,
            borderBottom: `1px solid ${T.DIVIDER}`,
            bgcolor: T.ROW_BG || 'transparent' }}>
            <Box sx={{ width: 3, height: 14, borderRadius: '2px', bgcolor: ACCENT, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI, letterSpacing: '0.01em' }}>
              {pickLabel(section.label, lang)}
            </Typography>
            {isTable && (
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, ml: 'auto' }}>
                {rows.length}
              </Typography>
            )}
          </Box>

          {isTable ? (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 520,
                  '& th, & td': { padding: '8px 12px', fontSize: '0.8rem', textAlign: 'start',
                    borderBottom: `1px solid ${T.DIVIDER}` },
                  '& th': { color: T.TEXT_TER, fontWeight: 600, fontSize: '0.64rem',
                    textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' },
                  '& td': { color: T.TEXT_PRI, lineHeight: 1.45 },
                  '& tbody tr:last-of-type td': { borderBottom: 'none' },
                  '& td.num': { fontVariantNumeric: 'tabular-nums', direction: 'ltr',
                    fontWeight: 600, whiteSpace: 'nowrap' } }}>
                  <thead>
                    <tr>{(section.columns || []).map((c) => (
                      <th key={c.key}>{pickLabel(c.label, lang)}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>{(section.columns || []).map((c) => (
                        <td key={c.key} className={c.type === 'number' || c.type === 'money' ? 'num' : undefined}>
                          {show(c, row[c.key])}
                        </td>
                      ))}</tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
              {!!(section.totals || []).length && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', px: 1.75, py: 1,
                  borderTop: `1px solid ${T.DIVIDER}` }}>
                  {computeTotals(section, rows).map((tot) => (
                    <Box key={tot.key} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6 }}>
                      <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
                        {pickLabel(tot.label, lang)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: T.TEXT_PRI,
                        fontVariantNumeric: 'tabular-nums', direction: 'ltr' }}>
                        {Number(tot.value).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ display: 'grid', gap: 0, px: 0, py: 0,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
              {entries.map(([key, v]) => {
                const field = (section.fields || []).find((f) => f.key === key);
                if (!field) return null;
                const wide = field.type === 'textarea';
                return (
                  <Box key={key} sx={{ px: 1.75, py: 1.1, minWidth: 0,
                    gridColumn: wide ? '1 / -1' : 'auto',
                    borderBottom: `1px solid ${T.DIVIDER}`,
                    '&:last-of-type': { borderBottom: 'none' } }}>
                    <Typography sx={{ fontSize: '0.62rem', color: T.TEXT_TER, textTransform: 'uppercase',
                      letterSpacing: 0.7, fontWeight: 600, mb: 0.35 }}>
                      {pickLabel(field.label, lang)}
                    </Typography>
                    <Typography sx={{ fontSize: wide ? '0.84rem' : '0.88rem', color: T.TEXT_PRI,
                      fontWeight: wide ? 400 : 600, lineHeight: wide ? 1.7 : 1.3,
                      whiteSpace: wide ? 'pre-wrap' : 'normal',
                      fontVariantNumeric: 'tabular-nums' }}>
                      {show(field, v)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      ))}

      {/* Naming what was left blank is part of the record — a reader should
          not have to infer it from an absence. */}
      {!!emptyNames.length && (
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, lineHeight: 1.6 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>{t('users.jrNothingRecorded')}:</Box>{' '}
          {emptyNames.join(' · ')}
        </Typography>
      )}
    </Box>
  );
};

export { useLookup };
