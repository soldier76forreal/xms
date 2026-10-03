import { useState, useEffect, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Tooltip from '@mui/material/Tooltip';
import StoreIcon from '@mui/icons-material/Store';
import VisibilityIcon from '@mui/icons-material/Visibility';

import AuthContext from '../../components/authAndConnections/auth';
import AxiosGlobal from '../../components/authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';

// Per-section branch selector for Inventory and Supply.
//
// Two groups: the branches the user actually holds (fully editable, and picking
// one also moves the app-wide active branch so the rest of the UI stays in
// step), and branches that have SHARED their catalogue via Branch settings —
// those open read-only, backed by the server's requireBranchRead() gate.
//
// Controlled: the parent owns `value` + `readOnly` and gets {branchId, readOnly,
// branchName} back, so it can disable its own create/edit actions while a
// shared branch is being viewed (and name that branch, e.g. as a request target).
//
// Shared entries carry a `shared:<id>` value, so picking one is ALWAYS a
// read-only look — even when the same branch also sits under "My branches"
// (a superAdmin holds every branch, so for them it always does). That look is
// what puts the Request buttons in front of them: browsing as the active
// branch, requesting from the one being viewed.
const SHARED = 'shared:';

export default function SectionBranchSelect({ value, readOnly = false, onChange, size = 'small' }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { branches: ownBranches, activeBranchId, setActiveBranchId } = useBranch();

  const [shared, setShared] = useState([]);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  // Shared WITH THE ACTIVE BRANCH — the branch any request would come from.
  useEffect(() => {
    if (!activeBranchId) { setShared([]); return undefined; }
    let cancelled = false;
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/branches/shared-with-me`,
      params: { branchId: activeBranchId } })
      .then((res) => { if (!cancelled) setShared(res.data.data || []); })
      .catch(() => { if (!cancelled) setShared([]); });
    return () => { cancelled = true; };
  }, [authCtx, axiosGlobal, activeBranchId]);

  const ownIds = useMemo(() => new Set((ownBranches || []).map((b) => String(b._id))), [ownBranches]);

  // Nothing to choose between — don't take up toolbar space.
  if ((ownBranches || []).length <= 1 && shared.length === 0) return null;

  const currentId = String(value || activeBranchId || '');
  // A branch you don't hold can only ever be a read-only look, whatever the
  // parent says.
  const isShared = Boolean(currentId) && (readOnly || !ownIds.has(currentId));
  const selectValue = currentId ? (isShared ? `${SHARED}${currentId}` : currentId) : '';

  const handleChange = (e) => {
    const raw = String(e.target.value);
    const pickedShared = raw.startsWith(SHARED);
    const id = pickedShared ? raw.slice(SHARED.length) : raw;
    const ro = pickedShared || !ownIds.has(id);
    // Picking one of your OWN branches moves the app-wide active branch too, so
    // MIS/CRM don't silently disagree with what Inventory is showing. A shared
    // branch never does — it's a look, not a context switch.
    if (!ro) setActiveBranchId(id);
    const picked = [...(ownBranches || []), ...shared].find((b) => String(b._id) === id);
    onChange && onChange({ branchId: id, readOnly: ro, branchName: picked ? picked.name : '' });
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Select value={selectValue} onChange={handleChange} size={size}
        renderValue={() => {
          const b = [...(ownBranches || []), ...shared].find((x) => String(x._id) === currentId);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isShared
                ? <VisibilityIcon sx={{ fontSize: 13, color: '#ffb74d' }} />
                : <StoreIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />}
              <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_PRI }} noWrap>
                {b ? b.name : '—'}
              </Typography>
            </Box>
          );
        }}
        sx={{ height: 30, minWidth: 130, bgcolor: T.CTRL_BG, borderRadius: '9px',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
          '& .MuiSelect-select': { py: 0, display: 'flex', alignItems: 'center' } }}>

        {(ownBranches || []).length > 0 && (
          <ListSubheader sx={{ fontSize: '0.62rem', textTransform: 'uppercase',
            letterSpacing: 1, lineHeight: 2.2, color: T.TEXT_TER, bgcolor: 'transparent' }}>
            {t('branch.myBranches')}
          </ListSubheader>
        )}
        {(ownBranches || []).map((b) => (
          <MenuItem key={String(b._id)} value={String(b._id)} sx={{ fontSize: '0.8rem' }}>
            <StoreIcon sx={{ fontSize: 14, mr: 1, color: T.TEXT_TER }} />
            {b.name}
          </MenuItem>
        ))}

        {shared.length > 0 && (
          <ListSubheader sx={{ fontSize: '0.62rem', textTransform: 'uppercase',
            letterSpacing: 1, lineHeight: 2.2, color: T.TEXT_TER, bgcolor: 'transparent' }}>
            {t('branch.sharedWithMe')}
          </ListSubheader>
        )}
        {shared.map((b) => (
          <MenuItem key={`${SHARED}${b._id}`} value={`${SHARED}${b._id}`} sx={{ fontSize: '0.8rem' }}>
            <VisibilityIcon sx={{ fontSize: 14, mr: 1, color: '#ffb74d' }} />
            {b.name}
            <Typography sx={{ ml: 'auto', pl: 1, fontSize: '0.62rem', color: T.TEXT_TER }}>
              {t('branch.readOnly')}
            </Typography>
          </MenuItem>
        ))}
      </Select>

      {isShared && (
        <Tooltip title={t('branch.readOnlyHelp')}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, px: 0.7, py: '2px',
            borderRadius: '5px', bgcolor: '#ffb74d1a', flexShrink: 0 }}>
            <VisibilityIcon sx={{ fontSize: 11, color: '#ffb74d' }} />
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#ffb74d' }}>
              {t('branch.readOnly')}
            </Typography>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}
