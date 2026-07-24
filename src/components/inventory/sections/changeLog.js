import { useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ImageIcon from '@mui/icons-material/Image';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import TuneIcon from '@mui/icons-material/Tune';
import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { useSelector } from 'react-redux';

const LIMIT = 25;

const UNIT_LABELS = { M2: 'm²', ML: 'ml', PCS: 'pcs', SQFT: 'ft²', LNFT: 'lnft' };

const TYPE_META = {
  quantity: { labelKey: 'inventory.logTypeStock',  color: '#6fa46f' },
  price:    { labelKey: 'inventory.logTypePrice',  color: '#90afc5' },
  media:    { labelKey: 'inventory.logTypeMedia',  color: '#c49a6c' },
  created:  { labelKey: 'inventory.logTypeNew',    color: '#888888' },
  spec:     { labelKey: 'inventory.logTypeSpec',   color: '#9b8fa0' },
  status:   { labelKey: 'inventory.logTypeStatus', color: '#888888' },
};

const FILTERS = [
  { key: 'all',      labelKey: 'inventory.filterAll' },
  { key: 'quantity', labelKey: 'inventory.logTypeStock' },
  { key: 'price',    labelKey: 'inventory.logTypePrice' },
  { key: 'media',    labelKey: 'inventory.logTypeMedia' },
];

function formatDate(d) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
}

function formatNum(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

// ── Log row ───────────────────────────────────────────────────────────────────
function LogRow({ log, variantMap }) {
  const { t } = useTranslation();
  const metaEntry = TYPE_META[log.changeType];
  const meta = metaEntry ? { label: t(metaEntry.labelKey), color: metaEntry.color } : { label: log.changeType, color: '#888' };
  const unit  = UNIT_LABELS[log.unit] || log.unit || '';

  // Try to resolve variant code from the variantMap passed in
  const variantCode = log.subjectType === 'variant' && variantMap[String(log.subjectId)]
    ? variantMap[String(log.subjectId)]
    : null;

  let summary = null;

  if (log.changeType === 'quantity') {
    const isAdd  = log.delta > 0;
    const sign   = isAdd ? '+' : '';
    summary = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isAdd
            ? <AddCircleOutlineIcon sx={{ fontSize: 15, color: 'success.main' }} />
            : <RemoveCircleOutlineIcon sx={{ fontSize: 15, color: 'error.main' }} />}
          <Typography variant="body2"
            sx={{ fontWeight: 700, color: isAdd ? 'success.main' : 'error.main', lineHeight: 1 }}>
            {sign}{formatNum(log.delta)} {unit}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {formatNum(log.oldValue)} → {formatNum(log.newValue)} {unit}
        </Typography>
        {log.reason && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>· {log.reason}</Typography>
        )}
      </Box>
    );
  } else if (log.changeType === 'price') {
    const cur = log.currency || 'AED';
    summary = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <AttachMoneyIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {log.oldValue != null ? `${log.oldValue} ${cur}` : '—'}
          {' → '}
          {log.newValue != null ? `${log.newValue} ${cur}` : '—'}
        </Typography>
      </Box>
    );
  } else if (log.changeType === 'media') {
    const isAdded = log.mediaRef?.action === 'added';
    summary = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <ImageIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption"
          sx={{ color: isAdded ? 'success.main' : 'error.main', fontWeight: 600 }}>
          {isAdded ? t('inventory.mediaAdded') : t('inventory.mediaRemoved')}
        </Typography>
        {log.mediaRef?.name && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            — {log.mediaRef.name}
          </Typography>
        )}
      </Box>
    );
  } else if (log.changeType === 'created') {
    const code = log.newValue?.code || '';
    summary = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <FiberNewIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('inventory.variantCreated')}{code ? ` — ` : ''}
          {code && (
            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{code}</Box>
          )}
        </Typography>
      </Box>
    );
  } else if (log.changeType === 'spec') {
    summary = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <TuneIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {log.field}: {String(log.oldValue ?? '—')} → {String(log.newValue ?? '—')}
        </Typography>
      </Box>
    );
  } else {
    summary = (
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {log.field ? `${log.field}: ` : ''}{String(log.newValue ?? '—')}
      </Typography>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '120px 1fr auto' },
          gap: { xs: 0.5, sm: 1.5 },
          py: 1.25, px: 2,
          alignItems: 'center',
          '&:hover': { bgcolor: 'action.hover' },
          transition: 'background 0.1s',
        }}
      >
        {/* Type chip + subject hint */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip
            label={meta.label}
            size="small"
            sx={{
              height: 20, fontSize: '0.65rem', fontWeight: 700, border: 'none',
              bgcolor: meta.color + '22', color: meta.color, minWidth: 48,
            }}
          />
          {variantCode ? (
            <Typography variant="caption"
              sx={{ fontFamily: 'monospace', fontSize: '0.67rem', color: 'text.disabled' }}
              noWrap>
              {variantCode}
            </Typography>
          ) : log.subjectType === 'product' ? (
            <Typography variant="caption" sx={{ fontSize: '0.67rem', color: 'text.disabled' }}>
              {t('inventory.productSubject')}
            </Typography>
          ) : null}
        </Box>

        {/* Summary */}
        <Box>{summary}</Box>

        {/* Date + who */}
        <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, whiteSpace: 'nowrap' }}>
          <Typography variant="caption"
            sx={{ color: 'text.disabled', display: 'block', fontSize: '0.68rem' }}>
            {formatDate(log.date || log.createdAt)}
          </Typography>
          {log.changedByName && (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
              {log.changedByName}
            </Typography>
          )}
        </Box>
      </Box>
    </>
  );
}

// ── ChangeLog ─────────────────────────────────────────────────────────────────
// Product-level history by default (all logs for the product, incl. its
// variants). Pass `variantId` instead to scope to a single SKU's own history
// (GET /inventory/variants/:id/logs).
const ChangeLog = ({ productId, variantId }) => {
  const { t } = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  // Build a code lookup from Redux variants: { variantId: code }
  const invVariants = useSelector((s) => s.invVariants) || [];
  const variantMap  = Object.fromEntries(invVariants.map((v) => [String(v._id), v.code]));

  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [more,    setMore]    = useState(false); // loading more (not initial)
  const [filter,  setFilter]  = useState('all');
  const [skip,    setSkip]    = useState(0);

  const fetchLogs = useCallback(async (theSkip, theFilter, append = false) => {
    if (!productId && !variantId) return;
    append ? setMore(true) : setLoading(true);
    try {
      const params = { limit: LIMIT, skip: theSkip };
      if (theFilter !== 'all') params.changeType = theFilter;

      const url = variantId
        ? `${axiosGlobal.defaultTargetApi}/inventory/variants/${variantId}/logs`
        : `${axiosGlobal.defaultTargetApi}/inventory/products/${productId}/logs`;
      const res = await authCtx.jwtInst({ method: 'get', url, params });
      const incoming = res.data.data || [];
      const tot      = res.data.total || 0;
      setTotal(tot);
      setLogs((prev) => append ? [...prev, ...incoming] : incoming);
    } catch { /* non-fatal */ } finally {
      append ? setMore(false) : setLoading(false);
    }
  }, [productId, variantId, authCtx, axiosGlobal]);

  // Reset on subject or filter change
  useEffect(() => {
    setSkip(0);
    setLogs([]);
    fetchLogs(0, filter, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, variantId, filter]);

  const handleLoadMore = () => {
    const newSkip = skip + LIMIT;
    setSkip(newSkip);
    fetchLogs(newSkip, filter, true);
  };

  const hasMore = logs.length < total;

  return (
    <Box
      sx={{
        border: '1.5px solid', borderColor: 'divider', borderRadius: '14px',
        bgcolor: 'background.paper', overflow: 'hidden', mb: 3,
      }}
    >
      {/* Header */}
      <Box sx={{
        px: 2, py: 1.5,
        borderBottom: '1.5px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
      }}>
        <Typography variant="caption"
          sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled' }}>
          {t('inventory.changeLog')}
          {total > 0 && (
            <Box component="span" sx={{ ml: 1, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              ({total})
            </Box>
          )}
        </Typography>

        {/* Filter chips */}
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={t(f.labelKey)}
              size="small"
              onClick={() => setFilter(f.key)}
              variant={filter === f.key ? 'filled' : 'outlined'}
              sx={{
                height: 22, fontSize: '0.7rem', cursor: 'pointer',
                fontWeight: filter === f.key ? 700 : 400,
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      ) : logs.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {t('inventory.noChangeHistory')}
          </Typography>
        </Box>
      ) : (
        <>
          {logs.map((log, i) => (
            <Box key={log._id || i}>
              <LogRow log={log} variantMap={variantMap} />
              {i < logs.length - 1 && <Divider />}
            </Box>
          ))}

          {/* Load more */}
          {hasMore && (
            <>
              <Divider />
              <Box sx={{ px: 2, py: 1.25, textAlign: 'center' }}>
                <Button
                  size="small"
                  onClick={handleLoadMore}
                  disabled={more}
                  startIcon={more ? <CircularProgress size={12} color="inherit" /> : null}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {more ? t('inventory.loading') : t('inventory.loadMoreRemaining', { count: total - logs.length })}
                </Button>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default ChangeLog;
