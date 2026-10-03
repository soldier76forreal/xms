import { useState, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// Multi-select Inventory variety picker — search by the variant's OWN code
// (e.g. TR45Q10004018VFP), backed by GET /digitalMarketing/inventory-lookup,
// which already scopes results to the branches the caller can access (or
// every branch for a superAdmin) — the same cross-branch-but-scoped pattern
// WhatsApp Share's product picker uses. Selecting an option snapshots
// {productId, variantId, code, productName, branchId, branchName} — what the
// backend re-validates and re-snapshots anyway on save (see
// resolveTaggedProducts in routes/digitalMarketing/main.js), so a stale
// display value here is harmless.
export default function ProductVarietyPicker({ value = [], onChange, T, label }) {
  const { t } = useTranslation();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    const text = inputValue.trim();
    if (text.length < 2) { setOptions([]); return; }
    const mySeq = ++requestSeq.current;
    setLoading(true);
    const timer = setTimeout(() => {
      authCtx.jwtInst({
        method: 'get', url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/inventory-lookup`,
        params: { search: text },
      }).then((res) => { if (mySeq === requestSeq.current) setOptions(res.data?.data || []); })
        .catch(() => { if (mySeq === requestSeq.current) setOptions([]); })
        .finally(() => { if (mySeq === requestSeq.current) setLoading(false); });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  return (
    <Autocomplete
      multiple
      options={options}
      value={value}
      inputValue={inputValue}
      onInputChange={(e, v) => setInputValue(v)}
      onChange={(e, v) => onChange(v)}
      loading={loading}
      filterOptions={(x) => x}   // server already filtered — don't re-filter client-side
      isOptionEqualToValue={(opt, val) => String(opt.variantId) === String(val.variantId)}
      getOptionLabel={(opt) => opt.code || ''}
      noOptionsText={inputValue.trim().length < 2 ? t('dm.typeToSearchVariety') : t('dm.noMatchingVariety')}
      renderOption={(props, option) => (
        <li {...props} key={String(option.variantId)}>
          <div>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{option.code}</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              {[option.productName, option.branchName].filter(Boolean).join(' · ')}
            </Typography>
          </div>
        </li>
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip {...getTagProps({ index })} key={String(option.variantId)} size="small"
            label={option.code}
            sx={{ height: 22, fontSize: '0.7rem', bgcolor: T.INPUT_BG, color: T.TEXT_PRI }} />
        ))
      }
      renderInput={(params) => (
        <TextField {...params} size="small" label={label || t('dm.taggedVarietiesLabel')}
          placeholder={value.length ? '' : t('dm.searchByVarietyCodePlaceholder')}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={13} sx={{ mr: 1 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />
      )}
    />
  );
}
