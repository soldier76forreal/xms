import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import StoreIcon from '@mui/icons-material/Store';
import { useTheme } from '@mui/material/styles';
import { useBranch } from '../../contextApi/BranchContext';

// Inventory + MIS are fully isolated per branch. Hidden entirely when the
// user only has one branch (or none) — nothing to switch between.
const BranchSwitcher = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { branches, activeBranchId, setActiveBranchId } = useBranch();

  if (branches.length <= 1) return null;

  return (
    <Tooltip title="Active branch — scopes Inventory & Invoices">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
        <StoreIcon sx={{ fontSize: 16, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
        <Select
          size="small"
          value={activeBranchId || ''}
          onChange={(e) => setActiveBranchId(e.target.value)}
          sx={{
            fontSize: '0.78rem', height: 30, minWidth: { xs: 84, sm: 120 },
            color: isDark ? 'rgba(255,255,255,0.87)' : 'inherit',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.15)' : undefined },
            '& .MuiSvgIcon-root': { color: isDark ? 'rgba(255,255,255,0.5)' : undefined },
          }}>
          {branches.map((b) => (
            <MenuItem key={b._id} value={b._id} sx={{ fontSize: '0.82rem' }}>{b.name}</MenuItem>
          ))}
        </Select>
      </Box>
    </Tooltip>
  );
};

export default BranchSwitcher;
