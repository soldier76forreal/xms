import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { TimeSeriesBarChart, BreakdownBarList, CHART_COLORS } from '../analytics/analyticsChart';

// Digital Marketing → Website analytics.
//
// Two halves, kept apart on purpose. TRAFFIC is what the public site reports about
// itself (first-party events, no third-party script); it is empty until the site is
// instrumented, and the page says so rather than drawing flat zeros. OUTCOMES is what
// XMS already knows — price requests, the offers answering them, the invoices they
// became, and the state of the product pages — which is real with no tracking at all.
// The join between them is the funnel: views → requests → offers → accepted → invoices.

const RANGES = ['7d', '30d', '90d', '365d'];
const BREAKDOWNS = ['channel', 'country', 'device', 'language', 'page', 'referrer', 'campaign'];

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US');
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtHours = (h, t) => {
  if (h == null) return '—';
  if (h < 1) return t('dm.anMinutes', { count: Math.max(1, Math.round(h * 60)) });
  if (h < 48) return t('dm.anHours', { count: Math.round(h) });
  return t('dm.anDays', { count: Math.round(h / 24) });
};

// Defined at module scope: a component declared inside another is a new type on every
// render, so React remounts its subtree each time (see NOTES in CLAUDE.md).
function Panel({ title, hint, children, T, right }) {
  return (
    <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '14px', bgcolor: T.CARD_BG, p: { xs: 1.5, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: 1,
          textTransform: 'uppercase', color: T.TEXT_TER }}>{title}</Typography>
        {hint && (
          <Tooltip title={hint}>
            <InfoOutlinedIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />
          </Tooltip>
        )}
        <Box sx={{ flex: 1 }} />
        {right}
      </Box>
      {children}
    </Box>
  );
}

function Kpi({ label, value, sub, change, T }) {
  const up = change != null && change > 0;
  const down = change != null && change < 0;
  return (
    <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '12px', bgcolor: T.CARD_BG, px: 1.5, py: 1.25, minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: 0.6,
        textTransform: 'uppercase', color: T.TEXT_TER }} noWrap>{label}</Typography>
      <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: T.TEXT_PRI, lineHeight: 1.3 }}>{value}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 18 }}>
        {change != null && (
          <>
            {up && <ArrowUpwardIcon sx={{ fontSize: 12, color: '#66bb6a' }} />}
            {down && <ArrowDownwardIcon sx={{ fontSize: 12, color: '#ef5350' }} />}
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: up ? '#66bb6a' : down ? '#ef5350' : T.TEXT_TER }}>
              {Math.abs(change)}%
            </Typography>
          </>
        )}
        {sub && <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC }} noWrap>{sub}</Typography>}
      </Box>
    </Box>
  );
}

function FunnelBar({ steps, T, t }) {
  const top = Math.max(1, ...steps.map((s) => s.value));
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {steps.map((s, i) => {
        const width = Math.max(2, (s.value / top) * 100);
        const prev = i ? steps[i - 1].value : null;
        const drop = prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_SEC, width: 116, flexShrink: 0 }} noWrap>
              {t(`dm.anFunnel_${s.key}`)}
            </Typography>
            <Box sx={{ flexGrow: 1, height: 18, borderRadius: '4px', bgcolor: T.GRID, overflow: 'hidden' }}>
              <Box sx={{ width: `${width}%`, height: '100%', borderRadius: '4px',
                bgcolor: i === 0 ? CHART_COLORS.series2 : CHART_COLORS.series1, opacity: 0.85 }} />
            </Box>
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: T.TEXT_PRI, width: 64, textAlign: 'right', flexShrink: 0 }}>
              {fmt(s.value)}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, width: 46, textAlign: 'right', flexShrink: 0 }}>
              {drop == null ? '' : `${drop}%`}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default function WebsiteAnalyticsSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob = useMediaQuery(theme.breakpoints.down('md'));
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const T = {
    BD: isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    CARD_BG: isDark ? '#111' : theme.palette.background.paper,
    GRID: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.38)',
    CTRL_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const [range, setRange] = useState('30d');
  const [by, setBy] = useState('channel');
  const [overview, setOverview] = useState(null);
  const [series, setSeries] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [products, setProducts] = useState([]);
  const [content, setContent] = useState(null);
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const base = `${axiosGlobal.defaultTargetApi}/digitalMarketing/analytics`;
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const get = (path) => authCtx.jwtInst({ method: 'get', url: `${base}${path}` }).then((r) => r.data);
      const [o, s, b, p, c, r] = await Promise.all([
        get(`/overview?range=${range}`),
        get(`/timeseries?range=${range}`),
        get(`/breakdown?range=${range}&by=${by}`),
        get(`/products?range=${range}`),
        get('/content'),
        get(`/requests?range=${range}`),
      ]);
      setOverview(o); setSeries(s.data || []); setBreakdown(b.data || []);
      setProducts(p.data || []); setContent(c); setRequests(r);
    } catch (err) {
      const res = err && err.response;
      setError((res && res.data && res.data.message) || (res ? `HTTP ${res.status}` : t('dm.anLoadFailed')));
    } finally {
      setLoading(false);
    }
  }, [authCtx, base, range, by, t]);

  useEffect(() => { load(); }, [load]);

  const chartPoints = useMemo(() => series.map((d) => ({
    date: d.day, pageViews: d.pageViews, requests: d.requests,
  })), [series]);
  const chartSeries = useMemo(() => ([
    { key: 'pageViews', label: t('dm.anPageViews'), color: CHART_COLORS.series2 },
    { key: 'requests', label: t('dm.anRequests'), color: CHART_COLORS.series1 },
  ]), [t]);
  const breakdownRows = useMemo(() => breakdown.map((r) => ({
    key: r.key, label: r.key, count: r.visitors || r.events,
  })), [breakdown]);

  const traffic = overview && overview.traffic;
  const outcomes = overview && overview.outcomes;
  const money = Boolean(overview && overview.showMoney);

  if (loading && !overview) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress size={22} /></Box>;
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', px: { xs: 1.25, md: 2.5 }, py: 2 }}>
      <Box sx={{ maxWidth: 1240, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* range + refresh */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: T.TEXT_PRI, flexGrow: 1 }}>
            {t('dm.anTitle')}
          </Typography>
          <Select value={range} onChange={(e) => setRange(e.target.value)} size="small"
            inputProps={{ 'aria-label': t('dm.anRange') }}
            sx={{ height: 30, fontSize: '0.74rem', bgcolor: T.CTRL_BG,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD }, '& .MuiSvgIcon-root': { color: T.TEXT_TER } }}>
            {RANGES.map((r) => <MenuItem key={r} value={r} sx={{ fontSize: '0.78rem' }}>{t(`dm.anRange_${r}`)}</MenuItem>)}
          </Select>
          <Tooltip title={t('dm.anRefresh')}>
            <span><IconButton size="small" onClick={load} disabled={loading} sx={{ color: T.TEXT_TER }}>
              <RefreshIcon sx={{ fontSize: 17 }} />
            </IconButton></span>
          </Tooltip>
        </Box>

        {error && (
          <Box sx={{ border: '1px solid #ef535055', borderRadius: '12px', bgcolor: '#ef535011', px: 2, py: 1.25 }}>
            <Typography sx={{ fontSize: '0.78rem', color: '#ef5350' }}>{error}</Typography>
          </Box>
        )}

        {/* The honest empty state: outcomes are real, traffic is not measured yet. */}
        {traffic && !traffic.instrumented && (
          <Box sx={{ border: `1px dashed ${T.BD}`, borderRadius: '12px', bgcolor: T.CTRL_BG, px: 2, py: 1.5,
            display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
            <InfoOutlinedIcon sx={{ fontSize: 16, color: T.TEXT_SEC, mt: '2px' }} />
            <Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI }}>
                {t('dm.anNoTrafficTitle')}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC, lineHeight: 1.6 }}>
                {t('dm.anNoTrafficBody')}
              </Typography>
            </Box>
          </Box>
        )}

        {/* ── the numbers ── */}
        <Box sx={{ display: 'grid', gap: 1.25,
          gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', sm: 'repeat(3, minmax(0,1fr))', md: 'repeat(4, minmax(0,1fr))' } }}>
          <Kpi T={T} label={t('dm.anVisitors')} value={fmt(traffic && traffic.visitors)} change={traffic && traffic.change.visitors} />
          <Kpi T={T} label={t('dm.anPageViews')} value={fmt(traffic && traffic.pageViews)} change={traffic && traffic.change.pageViews} />
          <Kpi T={T} label={t('dm.anProductViews')} value={fmt(traffic && traffic.productViews)}
            sub={traffic && traffic.pagesPerSession ? t('dm.anPagesPerSession', { n: traffic.pagesPerSession }) : ''} />
          <Kpi T={T} label={t('dm.anContactClicks')} value={fmt(traffic && traffic.contactClicks)} />
          <Kpi T={T} label={t('dm.anRequests')} value={fmt(outcomes && outcomes.requests)} change={outcomes && outcomes.requestsChange} />
          <Kpi T={T} label={t('dm.anUnanswered')} value={fmt(outcomes && outcomes.unanswered)}
            sub={outcomes && outcomes.requestToOfferHours != null ? t('dm.anAnswerIn', { time: fmtHours(outcomes.requestToOfferHours, t) }) : ''} />
          <Kpi T={T} label={t('dm.anAccepted')} value={fmt(outcomes && outcomes.accepted)}
            sub={outcomes && outcomes.acceptanceRate != null ? t('dm.anOfRate', { n: outcomes.acceptanceRate }) : ''} />
          {money ? (
            <Kpi T={T} label={t('dm.anInvoicedValue')} value={`${fmtMoney(outcomes && outcomes.invoicedValue)} AED`}
              sub={outcomes && outcomes.offeredValue ? t('dm.anOffered', { value: fmtMoney(outcomes.offeredValue) }) : ''} />
          ) : (
            <Kpi T={T} label={t('dm.anNewCustomers')} value={fmt(outcomes && outcomes.newCustomers)} />
          )}
        </Box>

        {/* ── over time ── */}
        <Panel T={T} title={t('dm.anOverTime')} hint={t('dm.anOverTimeHint')}>
          <TimeSeriesBarChart points={chartPoints} series={chartSeries} granularity="day" height={isMob ? 170 : 220} />
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            {chartSeries.map((s) => (
              <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: s.color }} />
                <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Panel>

        {/* ── funnel + where visitors come from ── */}
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <Panel T={T} title={t('dm.anFunnel')} hint={t('dm.anFunnelHint')}>
            {overview && <FunnelBar steps={overview.funnel} T={T} t={t} />}
          </Panel>

          <Panel T={T} title={t('dm.anWhereFrom')}
            right={(
              <Select value={by} onChange={(e) => setBy(e.target.value)} size="small"
                inputProps={{ 'aria-label': t('dm.anBreakdownBy') }}
                sx={{ height: 26, fontSize: '0.7rem', bgcolor: T.CTRL_BG,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD }, '& .MuiSvgIcon-root': { color: T.TEXT_TER } }}>
                {BREAKDOWNS.map((b) => <MenuItem key={b} value={b} sx={{ fontSize: '0.76rem' }}>{t(`dm.anBy_${b}`)}</MenuItem>)}
              </Select>
            )}>
            <BreakdownBarList rows={breakdownRows} valueKey="count" />
          </Panel>
        </Box>

        {/* ── products: what the site showed, and what people asked for ── */}
        <Panel T={T} title={t('dm.anProducts')} hint={t('dm.anProductsHint')}>
          {products.length === 0 ? (
            <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_TER }}>{t('dm.anNoProductData')}</Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', minWidth: 640, borderCollapse: 'collapse',
                '& th': { fontSize: '0.62rem', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                  color: T.TEXT_TER, textAlign: 'right', py: 0.75, px: 1, borderBottom: `1px solid ${T.BD}`, whiteSpace: 'nowrap' },
                '& th:first-of-type, & td:first-of-type': { textAlign: 'left' },
                '& td': { fontSize: '0.76rem', color: T.TEXT_SEC, textAlign: 'right', py: 0.75, px: 1,
                  borderBottom: `1px solid ${T.BD}`, whiteSpace: 'nowrap' } }}>
                <Box component="thead"><Box component="tr">
                  <Box component="th">{t('dm.anProduct')}</Box>
                  <Box component="th">{t('dm.anViews')}</Box>
                  <Box component="th">{t('dm.anOutOfStockViews')}</Box>
                  <Box component="th">{t('dm.anRequests')}</Box>
                  <Box component="th">{t('dm.anQuantity')}</Box>
                  <Box component="th">{t('dm.anRequestRate')}</Box>
                  <Box component="th">{t('dm.anPage')}</Box>
                </Box></Box>
                <Box component="tbody">
                  {products.slice(0, 15).map((p) => (
                    <Box component="tr" key={p.code}>
                      <Box component="td" sx={{ color: T.TEXT_PRI }}>
                        <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.code}</Box>
                        {p.name ? <Box component="span" sx={{ color: T.TEXT_SEC }}> · {p.name.slice(0, 40)}</Box> : null}
                      </Box>
                      <Box component="td">{fmt(p.views)}</Box>
                      <Box component="td" sx={{ color: p.outOfStockViews ? '#ffb74d' : undefined }}>{fmt(p.outOfStockViews)}</Box>
                      <Box component="td" sx={{ color: p.requests ? T.TEXT_PRI : undefined, fontWeight: p.requests ? 700 : 400 }}>{fmt(p.requests)}</Box>
                      <Box component="td">{fmt(p.quantity)}</Box>
                      <Box component="td">{p.requestRate == null ? '—' : `${p.requestRate}%`}</Box>
                      <Box component="td">
                        {!p.hasPage
                          ? <Box component="span" sx={{ color: '#ef5350' }}>{t('dm.anNoPage')}</Box>
                          : p.published
                            ? <Box component="span" sx={{ color: '#81c784' }}>{t('dm.pcStatusPublished')}</Box>
                            : <Box component="span" sx={{ color: '#9e9e9e' }}>{t('dm.pcStatusDraft')}</Box>}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Panel>

        {/* ── requests: where they come from, where they stand ── */}
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <Panel T={T} title={t('dm.anRequestsBySource')}>
            <BreakdownBarList rows={(requests ? requests.bySource : []).map((r) => ({ key: r.key, label: t(`dm.anSource_${r.key}`, r.key), count: r.value }))} valueKey="count" />
          </Panel>
          <Panel T={T} title={t('dm.anRequestsByStatus')}>
            <BreakdownBarList rows={(requests ? requests.byStatus : []).map((r) => ({ key: r.key, label: t(`crm.priceRequestStatus${r.key[0].toUpperCase()}${r.key.slice(1)}`, r.key), count: r.value }))} valueKey="count" />
          </Panel>
          <Panel T={T} title={t('dm.anRequestsByCountry')}>
            <BreakdownBarList rows={(requests ? requests.byCountry : []).map((r) => ({ key: r.key, label: r.key, count: r.value }))} valueKey="count" />
          </Panel>
          <Panel T={T} title={t('dm.anRequestsByBranch')}>
            <BreakdownBarList rows={(requests ? requests.byBranch : []).map((r) => ({ key: r.key, label: r.key, count: r.value }))} valueKey="count" />
          </Panel>
        </Box>

        {/* ── the pages themselves: what you can fix before any traffic lands ── */}
        {content && (
          <Panel T={T} title={t('dm.anContentHealth')} hint={t('dm.anContentHealthHint')}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC }}>
                {t('dm.anPagesTotal')} <b style={{ color: T.TEXT_PRI }}>{fmt(content.total)}</b>
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC }}>
                {t('dm.pcStatusPublished')} <b style={{ color: '#81c784' }}>{fmt(content.published)}</b>
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC }}>
                {t('dm.pcStatusDraft')} <b style={{ color: '#9e9e9e' }}>{fmt(content.drafts)}</b>
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))' } }}>
              {Object.entries(content.missing).map(([key, info]) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'baseline', gap: 1, px: 1.25, py: 0.9,
                  border: `1px solid ${T.BD}`, borderRadius: '10px' }}>
                  <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_SEC, flexGrow: 1 }}>
                    {t(`dm.anMissing_${key}`)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 800,
                    color: info.count ? '#ffb74d' : '#81c784' }}>{fmt(info.count)}</Typography>
                </Box>
              ))}
            </Box>
            {content.recent && content.recent.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: 0.6,
                  textTransform: 'uppercase', color: T.TEXT_TER, mb: 0.75 }}>{t('dm.anRecentlyEdited')}</Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {content.recent.map((p) => (
                    <Box key={p.code || p.slug} sx={{ px: 1, py: 0.4, border: `1px solid ${T.BD}`, borderRadius: '8px' }}>
                      <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }} noWrap>
                        <b style={{ fontFamily: 'monospace', color: T.TEXT_PRI }}>{p.code}</b>
                        {' · '}{new Date(p.updated).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Panel>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}><CircularProgress size={16} /></Box>
        )}
        <Box sx={{ height: 8 }} />
      </Box>
    </Box>
  );
}
