import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

const OPTIONS = [20, 40, 60, 100];

// Selectable page size for scroll-based pagination (CRM / MIS / Inventory).
// Default is 40 per the spec; changing it resets the caller's list to page 1.
//
// A caller may pass a compact `height` (CRM / MIS use 26). That height lands
// on the outer FormControl, so the input inside is told to fill it — before,
// the input kept its default ~40px and hung below the header row, border and
// all. Callers that pass no height keep the standard small select untouched.
const PageSizeSelect = ({ value, onChange, sx }) => {
  const compact = sx && sx.height != null;
  return (
    <TextField
      select size="small" value={value} onChange={(e) => onChange(Number(e.target.value))}
      sx={{
        minWidth: 84,
        ...(compact ? {
          '& .MuiInputBase-root': { height: '100%' },
          '& .MuiSelect-select': { display: 'flex', alignItems: 'center', minHeight: 0, py: 0, height: '100%' },
        } : {}),
        ...sx,
      }}
      SelectProps={{ sx: { fontSize: '0.78rem' } }}
    >
      {OPTIONS.map((n) => (
        <MenuItem key={n} value={n} sx={{ fontSize: '0.8rem' }}>{n} / page</MenuItem>
      ))}
    </TextField>
  );
};

export default PageSizeSelect;
