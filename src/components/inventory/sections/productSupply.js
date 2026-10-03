import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../../contextApi/PermissionContext';

const STAGE_LABEL_KEY = {
  purchasing: 'supply.statusPurchasing',
  processing: 'supply.statusProcessing',
  final_product: 'supply.statusFinalProduct',
};
const STAGE_COLOR = { purchasing: '#64b5f6', processing: '#ffb74d', final_product: '#81c784' };

const PREVIEW_COUNT = 5;

// This product's Supply deal letters (a Supply record — and every deal letter
// under it — is always for exactly ONE product) — mirrors productPriceRequests.js's
// reverse-lookup pattern exactly (self-fetching local state, preview/expand).
// Shown for every product (no feature flag) since Supply, unlike the
// public-website integration, is a finished feature.
export default function ProductSupply({ productId }) {
  const { t } = useTranslation();
  const history = useHistory();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!can('supply:view') || !productId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/supply/by-product/${productId}` });
      setRows(res.data.data || []);
    } catch (_) { setRows([]); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCtx, axiosGlobal, productId]);

  useEffect(() => { load(); }, [load]);

  if (!can('supply:view') || !productId) return null;

  const shown = expanded ? rows : rows.slice(0, PREVIEW_COUNT);

  return (
    <Box sx={{ mt: 3, border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
      bgcolor: 'background.paper', px: 2.5, py: 2 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 1, color: 'text.disabled', display: 'block', mb: 1.5 }}>
        {rows.length > 0 ? t('supply.supplyForCount', { count: rows.length }) : t('supply.supplyFor')}
      </Typography>

      {loading ? (
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '10px' }} />
      ) : rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.78rem', py: 1 }}>
          {t('supply.noSupplyForProduct')}
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {shown.map((dl) => (
              <Box key={dl._id}
                onClick={() => history.push(`/supply?open=${dl.supplyId}`)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1,
                  border: '1px solid', borderColor: 'divider', borderRadius: '10px', cursor: 'pointer' }}>
                {dl.recordCode && (
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, color: '#64b5f6', flexShrink: 0 }}>
                    {dl.recordCode}
                  </Typography>
                )}
                <Chip label={t(STAGE_LABEL_KEY[dl.status] || dl.status)} size="small"
                  sx={{ bgcolor: `${STAGE_COLOR[dl.status]}22`, color: STAGE_COLOR[dl.status], fontWeight: 700, fontSize: '0.6rem' }} />
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', flex: 1 }} noWrap>
                  {dl.coupeSeller?.name} {dl.coupeSpec ? `— ${dl.coupeSpec}` : ''}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
                  {dl.varietyLines?.length || 0} {t('supply.varietiesShort')}
                </Typography>
              </Box>
            ))}
          </Box>
          {rows.length > PREVIEW_COUNT && (
            <Button size="small" onClick={() => setExpanded((e) => !e)}
              startIcon={expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
              sx={{ mt: 1, fontSize: '0.7rem', textTransform: 'none', color: 'text.disabled' }}>
              {expanded ? t('inventory.showLess') : t('inventory.showAllCount', { count: rows.length })}
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
