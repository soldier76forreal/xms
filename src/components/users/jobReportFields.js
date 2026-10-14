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
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';

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

const inputSx = (T) => ({
  '& .MuiOutlinedInput-root': {
    bgcolor: T.INPUT_BG, borderRadius: '8px', color: T.TEXT_PRI, fontSize: '0.8rem',
    '& fieldset': { borderColor: T.INPUT_BD },
  },
  '& .MuiInputLabel-root': { color: T.TEXT_SEC, fontSize: '0.78rem' },
  '& input, & textarea': { color: T.TEXT_PRI, fontSize: '0.8rem' },
});

// A dropdown a MUI portal renders: kept above whatever surface opened it. Set
// unconditionally — the standing portal z-index trap in this codebase is a
// control that opens invisibly behind the drawer it belongs to.
const popperSx = { popper: { sx: { zIndex: (theme) => theme.zIndex.modal + 2 } } };

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
export const CustomerField = ({ value, onChange, label, T, canCreate, onCreateNew, dense }) => {
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
          <TextField {...params} label={dense ? undefined : label} placeholder={dense ? label : undefined}
            sx={inputSx(T)}
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
export const VarietyField = ({ value, onChange, label, T, dense }) => {
  const { t } = useTranslation();
  const lang = useSpecLang();
  const [search, setSearch] = useState('');
  const { options, loading, denied } = useLookup('varieties', search);

  const selected = value || null;
  const merged = useMemo(() => {
    if (!value) return options;
    return options.some((o) => String(o.variantId) === String(value.variantId))
      ? options : [value, ...options];
  }, [options, value]);

  const nameOf = (o) => (lang === 'ar' && o.productNameAr) || o.productName || '';

  return (
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
        <TextField {...params} label={dense ? undefined : label} placeholder={dense ? label : undefined}
          sx={inputSx(T)}
          InputProps={{ ...params.InputProps,
            endAdornment: <>{loading ? <CircularProgress size={13} /> : null}{params.InputProps.endAdornment}</> }} />
      )}
    />
  );
};

// ── Digital Marketing content ────────────────────────────────────────────────
// One picker across all four DM record kinds — a rep remembers the content,
// not which sub-section of Digital Marketing it is filed under.
const DM_KIND_LABEL = {
  rawContent: 'dm.rawContents', readyToUpload: 'dm.readyToUpload',
  whatsappShare: 'dm.whatsappShares', linkPage: 'dm.externalLinks',
};

export const ContentField = ({ value, onChange, label, T, dense }) => {
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
        <Box component="li" {...props} key={`${o.kind}:${o.id}`} sx={{ fontSize: '0.78rem', py: '4px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: '100%' }}>
            <Box sx={{ flexGrow: 1 }}>{o.title || '—'}</Box>
            <Chip size="small" label={t(DM_KIND_LABEL[o.kind] || o.kind)}
              sx={{ height: 16, fontSize: '0.6rem' }} />
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params} label={dense ? undefined : label} placeholder={dense ? label : undefined}
          sx={inputSx(T)}
          InputProps={{ ...params.InputProps,
            endAdornment: <>{loading ? <CircularProgress size={13} /> : null}{params.InputProps.endAdornment}</> }} />
      )}
    />
  );
};

// ── One field, whatever its type ─────────────────────────────────────────────
// `dense` is the in-table variant: the column header already carries the label,
// so it moves to the placeholder and the field loses its own.
export const SpecField = ({ field, value, onChange, lang, T, dense, canCreateCustomer, onCreateCustomer }) => {
  const label = pickLabel(field.label, lang);
  const common = { size: 'small', fullWidth: true, sx: inputSx(T) };
  const labelProps = dense
    ? { placeholder: label }
    : { label, InputLabelProps: { shrink: true } };

  switch (field.type) {
    case 'customer':
      return (
        <CustomerField value={value} onChange={onChange} label={label} T={T} dense={dense}
          canCreate={canCreateCustomer} onCreateNew={onCreateCustomer} />
      );
    case 'variety':
      return <VarietyField value={value} onChange={onChange} label={label} T={T} dense={dense} />;
    case 'dmContent':
      return <ContentField value={value} onChange={onChange} label={label} T={T} dense={dense} />;

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
        <TextField {...common} label={label} InputLabelProps={{ shrink: true }} type="date"
          value={value ? String(value).slice(0, 10) : ''} onChange={(e) => onChange(e.target.value)} />
      );

    case 'time':
      return (
        <TextField {...common} label={dense ? undefined : label} InputLabelProps={{ shrink: true }} type="time"
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
export const SectionsReadOnlyView = ({ templateKey, sections, T }) => {
  const lang = useSpecLang();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    let cancelled = false;
    authCtx.jwtInst({
      method: 'get',
      url: `${axiosGlobal.defaultTargetApi}/users/jobReports/templates/${templateKey || 'classic'}`,
    })
      .then((res) => { if (!cancelled) setSpec(res.data.spec); })
      .catch(() => { if (!cancelled) setSpec(null); });
    return () => { cancelled = true; };
  }, [templateKey, authCtx, axiosGlobal.defaultTargetApi]);

  if (!spec) return <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>…</Typography>;

  const show = (field, value) => {
    if (value == null || value === '') return '—';
    switch (field.type) {
      case 'customer': return [value.name, value.phone].filter(Boolean).join(' · ') || '—';
      case 'variety': return [value.code, (lang === 'ar' && value.productNameAr) || value.productName]
        .filter(Boolean).join(' — ') || '—';
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {(spec.sections || []).map((section) => {
        const value = (sections || {})[section.key];
        const isTable = section.kind === 'table';
        const rows = isTable ? (value || []).filter((r) => !rowIsEmpty(r)) : [];
        const entries = isTable ? [] : Object.entries(value || {})
          .filter(([, v]) => v != null && v !== '' && !(typeof v === 'object' && !v));
        if (isTable ? !rows.length : !entries.length) return null;

        return (
          <Box key={section.key}>
            <Typography sx={{ fontSize: '0.65rem', color: T.TEXT_TER, textTransform: 'uppercase',
              letterSpacing: 1, fontWeight: 600, mb: 0.75 }}>
              {pickLabel(section.label, lang)}
            </Typography>

            {isTable ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 460,
                  '& th, & td': { border: `1px solid ${T.DIVIDER}`, padding: '4px 7px',
                    fontSize: '0.74rem', textAlign: 'start' },
                  '& th': { color: T.TEXT_TER, fontWeight: 600, fontSize: '0.66rem' },
                  '& td': { color: T.TEXT_SEC } }}>
                  <thead>
                    <tr>{(section.columns || []).map((c) => (
                      <th key={c.key}>{pickLabel(c.label, lang)}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>{(section.columns || []).map((c) => (
                        <td key={c.key}>{show(c, row[c.key])}</td>
                      ))}</tr>
                    ))}
                  </tbody>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.75 }}>
                  {computeTotals(section, rows).map((tot) => (
                    <Chip key={tot.key} size="small"
                      label={`${pickLabel(tot.label, lang)}: ${Number(tot.value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                      sx={{ height: 20, fontSize: '0.66rem' }} />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 0.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
                {entries.map(([key, v]) => {
                  const field = (section.fields || []).find((f) => f.key === key);
                  if (!field) return null;
                  return (
                    <Box key={key} sx={{ display: 'flex', gap: 0.75,
                      gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
                      <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, flexShrink: 0 }}>
                        {pickLabel(field.label, lang)}:
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_PRI,
                        whiteSpace: field.type === 'textarea' ? 'pre-wrap' : 'normal' }}>
                        {show(field, v)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export { useLookup };
