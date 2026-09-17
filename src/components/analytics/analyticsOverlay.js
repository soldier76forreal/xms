import { useState, useEffect, useCallback, useContext } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useBranch } from '../../contextApi/BranchContext';
import { TimeSeriesBarChart, BreakdownBarList } from './analyticsChart';

const PRESETS = [
  { key: '7d',  labelKey: 'analytics.preset7d' },
  { key: '30d', labelKey: 'analytics.preset30d' },
  { key: '90d', labelKey: 'analytics.preset90d' },
  { key: '12m', labelKey: 'analytics.preset12m' },
];

// Shared, module-agnostic Analytics overlay — a full-screen Dialog (per the
// app's "Drawer/overlay only, no separate pages" convention, extended here to
// a full-screen surface since a dashboard needs the room a side Drawer
// doesn't have). Every section wires its own `series`/`breakdowns` mapping
// and points `endpoint` at its own GET .../analytics route (see
// inventory.js for the reference wiring) — this component only knows the
// shared response envelope, never a module's field names directly.
//
// Filters (date-range preset row) sit in ONE row above every chart/stat and
// scope everything below them (dataviz skill's interaction.md) — there is
// exactly one fetch per range change, not one per widget.
export default function AnalyticsOverlay({
  open, onClose, title, endpoint, branchScoped = false, series = [], breakdowns = [],
}) {
  const { t }       = useTranslation();
  const theme       = useTheme();
  const isDark      = theme.palette.mode === 'dark';
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { activeBranchId } = useBranch();

  const T = {
    BG:       isDark ? '#060606' : theme.palette.background.default,
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    CARD_BG:  isDark ? '#151515' : 'rgba(0,0,0,0.02)',
    BD:       isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    TEXT_PRI: isDark ? '#ffffff' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
  };

  const [preset, setPreset]         = useState('30d');
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);

  const load = useCallback(async () => {
    if (branchScoped && !activeBranchId) return;
    setLoading(true); setError(false);
    try {
      const params = { preset };
      if (preset === 'custom' && customFrom && customTo) { params.from = customFrom; params.to = customTo; }
      if (branchScoped) params.branchId = activeBranchId;
      const res = await authCtx.jwtInst({
        method: 'get', url: `${axiosGlobal.defaultTargetApi}${endpoint}`, params,
      });
      setData(res.data);
    } catch (_) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo, branchScoped, activeBranchId, endpoint, authCtx, axiosGlobal]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const applyCustom = () => { if (customFrom && customTo) { setPreset('custom'); } };

  return (
    <Dialog open={open} onClose={onClose} fullScreen
      PaperProps={{ sx: { bgcolor: T.BG, backgroundImage: 'none' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 2, sm: 3 }, py: 2,
        borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: T.TEXT_PRI, flexGrow: 1 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* ── One filter row, scopes everything below it ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap',
        px: { xs: 2, sm: 3 }, py: 1.5, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        {PRESETS.map((p) => {
          const active = preset === p.key;
          return (
            <Button key={p.key} size="small" onClick={() => { setPreset(p.key); setCustomOpen(false); }}
              sx={{ minWidth: 0, height: 26, px: 1.2, borderRadius: '7px', fontSize: '0.7rem',
                fontWeight: active ? 700 : 400, textTransform: 'none',
                color: active ? T.TEXT_PRI : T.TEXT_SEC,
                bgcolor: active ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)') : 'transparent',
                border: `1px solid ${active ? T.BD2 : 'transparent'}` }}>
              {t(p.labelKey)}
            </Button>
          );
        })}
        <Button size="small" onClick={() => setCustomOpen((v) => !v)}
          sx={{ minWidth: 0, height: 26, px: 1.2, borderRadius: '7px', fontSize: '0.7rem',
            fontWeight: preset === 'custom' ? 700 : 400, textTransform: 'none',
            color: preset === 'custom' ? T.TEXT_PRI : T.TEXT_SEC,
            bgcolor: preset === 'custom' ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)') : 'transparent',
            border: `1px solid ${preset === 'custom' ? T.BD2 : 'transparent'}` }}>
          {t('analytics.presetCustom')}
        </Button>
        {customOpen && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 0.5 }}>
            <TextField type="date" size="small" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.CTRL_BG, borderRadius: '8px', fontSize: '0.75rem', height: 30 } }} />
            <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>{t('analytics.toLabel')}</Typography>
            <TextField type="date" size="small" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.CTRL_BG, borderRadius: '8px', fontSize: '0.75rem', height: 30 } }} />
            <Button size="small" variant="contained" disabled={!customFrom || !customTo} onClick={applyCustom}
              sx={{ height: 30, fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px' }}>
              {t('common.apply')}
            </Button>
          </Box>
        )}
        {loading && <CircularProgress size={14} sx={{ color: T.TEXT_TER, ml: 1 }} />}
      </Box>

      {/* ── Body — dims (not unmounts) while refetching, per the "refetch keeps the frame" rule ── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, py: 2.5,
        opacity: loading && data ? 0.5 : 1, transition: 'opacity 0.15s' }}>
        {error && !data && (
          <Typography sx={{ fontSize: '0.82rem', color: '#EA005A', textAlign: 'center', py: 6 }}>
            {t('analytics.failedToLoad')}
          </Typography>
        )}
        {!error && !data && loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={24} sx={{ color: T.TEXT_TER }} />
          </Box>
        )}
        {branchScoped && !activeBranchId && (
          <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_TER, textAlign: 'center', py: 6 }}>
            {t('analytics.selectBranchFirst')}
          </Typography>
        )}

        {data && (
          <>
            {/* KPI tiles */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: `repeat(${data.kpis.length}, 1fr)` },
              gap: 1.5, mb: 3 }}>
              {data.kpis.map((k) => (
                <Box key={k.key} sx={{ p: 1.75, borderRadius: '12px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}` }}>
                  <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC, textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                    {k.label}
                  </Typography>
                  <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: T.TEXT_PRI, lineHeight: 1.1 }}>
                    {k.value}
                  </Typography>
                  {typeof k.delta === 'number' && (
                    <Typography sx={{ fontSize: '0.68rem', mt: 0.4,
                      color: k.delta > 0 ? '#43a047' : k.delta < 0 ? '#EA005A' : T.TEXT_TER }}>
                      {k.delta > 0 ? '+' : ''}{k.delta}% {t('analytics.vsPreviousPeriod')}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            {/* Time series */}
            {series.length > 0 && (
              <Box sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: '12px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}`, mb: 2.5 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                  color: T.TEXT_TER, mb: 1.5 }}>
                  {t('analytics.overTime')}
                </Typography>
                <TimeSeriesBarChart points={data.timeSeries} series={series} granularity={data.range?.granularity} />
              </Box>
            )}

            {/* Breakdowns */}
            <Box sx={{ display: 'grid', gridTemplateColumns: isXs ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
              {breakdowns.map((b) => {
                const rows = data.breakdowns?.[b.key] || [];
                return (
                  <Box key={b.key} sx={{ p: 2, borderRadius: '12px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}` }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                      color: T.TEXT_TER, mb: 1.25 }}>
                      {b.title}
                    </Typography>
                    <BreakdownBarList rows={rows} valueKey={b.valueKey || 'count'} />
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
}
