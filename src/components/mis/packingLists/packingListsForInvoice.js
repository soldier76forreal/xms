import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../../contextApi/PermissionContext';

// This invoice's linked packing lists — reverse lookup, replaces the old
// embedded packing-list section that used to live inside invoiceForm.js
// (Session 72, Phase 3). Mirrors the self-fetching reverse-lookup pattern
// already used by Inventory's productPriceRequests.js / Supply's productSupply.js.
export default function PackingListsForInvoice({ invoiceId }) {
  const { t } = useTranslation();
  const history = useHistory();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!can('mis:view') || !invoiceId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/mis/invoices/${invoiceId}/packing-lists` });
      setRows(res.data.data || []);
    } catch (_) { setRows([]); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx, axiosGlobal, invoiceId]);

  useEffect(() => { load(); }, [load]);

  if (!can('mis:view') || loading || rows.length === 0) return null;

  return (
    <Box sx={{ px: 3, pb: 2 }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
        textTransform: 'uppercase', color: 'text.disabled', mb: 1,
        display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LocalShippingIcon sx={{ fontSize: 13 }} /> {t('mis.plSectionOnInvoice')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {rows.map((pl) => (
          <Chip key={pl._id} size="small" clickable
            label={`#${pl.docNumber} — ${pl.driverInfo?.fullName || t('mis.plTypeLinked')}`}
            onClick={() => history.push(`/mis?openPackingList=${pl._id}`)}
            sx={{ fontSize: '0.68rem' }} />
        ))}
      </Box>
    </Box>
  );
}
