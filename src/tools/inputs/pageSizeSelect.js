import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

const OPTIONS = [20, 40, 60, 100];

// Selectable page size for scroll-based pagination (CRM / MIS / Inventory).
// Default is 40 per the spec; changing it resets the caller's list to page 1.
const PageSizeSelect = ({ value, onChange, sx }) => (
  <TextField
    select size="small" value={value} onChange={(e) => onChange(Number(e.target.value))}
    sx={{ minWidth: 84, ...sx }}
    SelectProps={{ sx: { fontSize: '0.78rem' } }}
  >
    {OPTIONS.map((n) => (
      <MenuItem key={n} value={n} sx={{ fontSize: '0.8rem' }}>{n} / page</MenuItem>
    ))}
  </TextField>
);

export default PageSizeSelect;
