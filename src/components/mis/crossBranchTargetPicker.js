import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

// Session 72 — target-branch Autocomplete + Inventory/Supply source toggle,
// used by invoiceForm.js when tradeMode==='interBranch'. `branches` comes from
// GET /mis/cross-branch/branches (already excludes the caller's own branch).
// `locked` (+ `lockedName`) — the branch was detected from the record the user
// opened (an Inventory product, a supply record or deal letter), so it's shown
// but can't be changed. Used by the stock-request form; invoiceForm omits it.
// allowInventory=false (a user holding only inventory:forecast:request): the
// request can only be for forecast (Supply) lots, so the source is fixed.
export default function CrossBranchTargetPicker({
  branches, branchId, onBranchChange, source, onSourceChange, locked = false, lockedName = '',
  allowInventory = true,
}) {
  const { t } = useTranslation();
  const selected = branches.find((b) => String(b._id) === String(branchId)) || null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {locked ? (
        <TextField size="small" label={t('mis.targetBranchLabel')} disabled fullWidth
          value={(selected && selected.name) || lockedName || ''}
          helperText={t('mis.reqBranchDetected')}
          InputLabelProps={{ shrink: true, style: { fontSize: '0.75rem' } }}
          inputProps={{ style: { fontSize: '0.8rem' } }} />
      ) : (
        <Autocomplete
          options={branches}
          value={selected}
          onChange={(_, v) => onBranchChange(v ? v._id : '')}
          getOptionLabel={(b) => b?.name || ''}
          isOptionEqualToValue={(o, v) => String(o._id) === String(v?._id)}
          // The stock-request drawer sits at modal+1 (it can open over a
          // Dialog); a default popper (modal) would list its options behind it.
          slotProps={{ popper: { sx: { zIndex: (th) => th.zIndex.modal + 2 } } }}
          renderInput={(params) => (
            <TextField {...params} size="small" label={t('mis.targetBranchLabel')}
              InputLabelProps={{ style: { fontSize: '0.75rem' } }} inputProps={{ ...params.inputProps, style: { fontSize: '0.8rem' } }} />
          )}
        />
      )}
      {branchId && !allowInventory && (
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
          {t('mis.quoteAgainstForecastOnly')}
        </Typography>
      )}
      {branchId && allowInventory && (
        <Box>
          <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', mb: 0.5 }}>{t('mis.quoteAgainstLabel')}</Typography>
          <ToggleButtonGroup size="small" exclusive value={source}
            onChange={(_, v) => v && onSourceChange(v)}>
            <ToggleButton value="inventory" sx={{ fontSize: '0.72rem', textTransform: 'none', px: 1.5 }}>
              {t('mis.sourceInventory')}
            </ToggleButton>
            <ToggleButton value="supply" sx={{ fontSize: '0.72rem', textTransform: 'none', px: 1.5 }}>
              {t('mis.sourceSupply')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
    </Box>
  );
}
