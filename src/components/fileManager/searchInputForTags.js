import { useState, useEffect, useContext } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

const filter = createFilterOptions();

// ── Tag picker (Phase 9 redesign — MUI Autocomplete, replaces react-select) ───
// Same store contract as the legacy widget: options = tagsForList (tags not
// already on the selection), applies to state.selectedItems via POST /addTag
// (existing tag by id, or a brand-new one by label), then refreshTag.
export default function SearchInputForTags() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const selectedItemsSelect = useSelector((s) => s.selectedItems);
  const tagsForList         = useSelector((s) => s.tagsForList);

  const [value, setValue] = useState(null);
  const [busy, setBusy]   = useState(false);

  const T = {
    INPUT_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD: isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    MENU_BG:  isDark ? '#181818'                : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
  };

  useEffect(() => {
    dispatch(actions.tagsForListDisp());
  }, [selectedItemsSelect, dispatch]);

  const addTags = async (option) => {
    if (!option || busy) return;
    setBusy(true);
    try {
      await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/files/addTag`,
        data: {
          tag: option.id === undefined ? { label: option.label } : option,
          selected: selectedItemsSelect,
        },
      });
      dispatch(actions.refreshTag());
      dispatch(actions.setShowSnackBar({ status: true, msg: `Tag “${option.label}” added`, type: 'success' }));
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to add tag', type: 'error' }));
    }
    setValue(null);
    setBusy(false);
  };

  const options = (tagsForList || []).map((e) => ({ id: e._id, label: e.tag }));

  return (
    <Autocomplete
      size="small"
      value={value}
      disabled={busy || selectedItemsSelect.length === 0}
      options={options}
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.label || '')}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      onChange={(_, newValue) => {
        if (typeof newValue === 'string') addTags({ label: newValue });
        else if (newValue?.inputValue) addTags({ label: newValue.inputValue });
        else if (newValue) addTags(newValue);
      }}
      filterOptions={(opts, params) => {
        const filtered = filter(opts, params);
        const input = params.inputValue.trim();
        if (input !== '' && !opts.some((o) => o.label.toLowerCase() === input.toLowerCase())) {
          filtered.push({ inputValue: input, label: `Add new tag: “${input}”`, isNew: true });
        }
        return filtered;
      }}
      selectOnFocus clearOnBlur handleHomeEndKeys freeSolo
      renderOption={(liProps, option) => (
        <Box component="li" {...liProps} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.82rem' }}>
          {option.isNew
            ? <AddIcon sx={{ fontSize: 15, color: T.TEXT_SEC }} />
            : <LocalOfferIcon sx={{ fontSize: 13, color: T.TEXT_SEC }} />}
          <Typography sx={{ fontSize: '0.82rem' }}>{option.label}</Typography>
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params} placeholder="Add a tag…"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI, fontSize: '0.82rem',
              '& fieldset': { borderColor: T.INPUT_BD },
              '&.Mui-focused fieldset': { borderColor: T.TEXT_PRI, borderWidth: 1.5 },
            },
            '& input::placeholder': { color: T.TEXT_SEC, opacity: 1 },
          }} />
      )}
      slotProps={{
        paper: { sx: { bgcolor: T.MENU_BG, border: `1px solid ${T.BD}`, borderRadius: '10px',
          color: T.TEXT_PRI, backgroundImage: 'none' } },
      }}
    />
  );
}
