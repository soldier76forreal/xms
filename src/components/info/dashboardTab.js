import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { TimeSeriesBarChart, BreakdownBarList, CHART_COLORS } from '../analytics/analyticsChart';
import { fetchAdminOverview } from './feedbackApi';
import { TICKET_STATUSES, TICKET_TYPES, areaLabelKey, statusMeta } from './ticketMeta';
import TicketsTab from './ticketsTab';

// The developers' dashboard: how many bug reports and suggestions there are,
// what state they are in, what has been waiting too long — and, under "All
// reports", every one of them with the tools to answer it.
//
// Only rendered for a developer (info.js asks the server), and every call it
// makes is refused by the server for anyone else, so this is convenience, not
// the gate.

// Module scope — components declared inside another component remount on every render.

function Kpi({ label, value, color, onClick, T }) {
  const clickable = Boolean(onClick);
  return (
    <Box onClick={onClick} role={clickable ? 'button' : undefined} tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      sx={{
        p: 1.5, borderRadius: '12px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}`, minWidth: 0,
        cursor: clickable ? 'pointer' : 'default',
        '&:hover': clickable ? { borderColor: T.BD2 } : {},
      }}>
      <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.TEXT_TER }} noWrap>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
        {color && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />}
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: T.TEXT_PRI, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function Panel({ title, action, T, children }) {
  return (
    <Box sx={{ p: 1.75, borderRadius: '12px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}`, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.TEXT_SEC, flexGrow: 1 }}>
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}

function ViewButton({ active, onClick, Icon, children, T }) {
  return (
    <Button role="tab" aria-selected={active} onClick={onClick} startIcon={<Icon sx={{ fontSize: 14 }} />}
      sx={{
        minWidth: 0, height: 26, px: 1.25, py: 0, borderRadius: '7px', fontSize: '0.72rem', textTransform: 'none',
        fontWeight: active ? 700 : 400, color: active ? T.TEXT_PRI : T.TEXT_TER,
        bgcolor: active ? T.BD : 'transparent', '&:hover': { bgcolor: T.BD, color: T.TEXT_PRI },
      }}>
      {children}
    </Button>
  );
}

const RANGES = [7, 30, 90];

export default function DashboardTab({ T, openId, onOpenHandled, canEdit, canDelete }) {
  const { t } = useTranslation();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [view, setView] = useState(openId ? 'tickets' : 'overview');   // overview | tickets
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preset, setPreset] = useState(null);

  // A notification names a report: go straight to the list, which opens it.
  useEffect(() => { if (openId) setView('tickets'); }, [openId]);

  const load = useCallback(async () => {
    setLoading(true); setFailed(false);
    try { setData(await fetchAdminOverview(authCtx, axiosGlobal, days)); } catch (_) { setFailed(true); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // Coming back from triage shows the numbers as they are now.
  useEffect(() => { if (view === 'overview') load(); }, [view, load]);

  const openList = (filters) => { setPreset({ ...filters, nonce: Date.now() }); setView('tickets'); };

  const header = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 1.25, sm: 2 }, py: 0.9, flexShrink: 0, borderBottom: `1px solid ${T.BD}` }}>
      <Box role="tablist" sx={{ display: 'flex', gap: 0.5, bgcolor: T.CTRL_BG, borderRadius: '9px', p: '3px', border: `1px solid ${T.BD}` }}>
        <ViewButton T={T} Icon={InsightsOutlinedIcon} active={view === 'overview'} onClick={() => setView('overview')}>{t('info.dashViewOverview')}</ViewButton>
        <ViewButton T={T} Icon={FormatListBulletedIcon} active={view === 'tickets'} onClick={() => { setPreset(null); setView('tickets'); }}>{t('info.dashViewReports')}</ViewButton>
      </Box>
    </Box>
  );

  if (view === 'tickets') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {header}
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          <TicketsTab mode="admin" T={T} canView canCreate={false} canEdit={canEdit} canDelete={canDelete}
            openId={openId} onOpenHandled={onOpenHandled} preset={preset} />
        </Box>
      </Box>
    );
  }

  const byStatus = (data && data.byStatus) || {};
  const motion = (byStatus.in_review || 0) + (byStatus.planned || 0) + (byStatus.in_progress || 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {header}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1.25, sm: 2 } }}>
        {loading && !data && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={22} sx={{ color: T.TEXT_TER }} /></Box>
        )}
        {failed && !data && <Typography sx={{ fontSize: '0.84rem', color: T.TEXT_SEC, py: 4, textAlign: 'center' }}>{t('info.loadFailed')}</Typography>}

        {data && (
          <Box sx={{ maxWidth: 1100, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.25 }}>
              <Kpi T={T} label={t('info.kpiTotal')} value={data.total} onClick={() => openList({})} />
              <Kpi T={T} label={t('info.kpiNew')} value={data.newLast7} onClick={() => openList({})} />
              <Kpi T={T} label={t('info.kpiOpen')} value={byStatus.open || 0} color={statusMeta('open').color} onClick={() => openList({ status: 'open' })} />
              <Kpi T={T} label={t('info.kpiStale')} value={data.stale} color="#F59E0B" onClick={() => openList({ status: 'open', sort: 'oldest' })} />
              <Kpi T={T} label={t('info.kpiMotion')} value={motion} color={statusMeta('in_progress').color} />
              <Kpi T={T} label={t('info.kpiDone')} value={byStatus.done || 0} color={statusMeta('done').color} onClick={() => openList({ status: 'done' })} />
              <Kpi T={T} label={t('info.kpiDeclined')} value={byStatus.declined || 0} color={statusMeta('declined').color} onClick={() => openList({ status: 'declined' })} />
              <Kpi T={T} label={t('info.kpiDeleted')} value={data.deleted} onClick={() => openList({ deleted: true })} />
            </Box>

            {data.total === 0 && data.deleted === 0 && (
              <Typography sx={{ fontSize: '0.84rem', color: T.TEXT_SEC, textAlign: 'center', py: 2 }}>{t('info.adminEmptyHint')}</Typography>
            )}

            <Panel T={T} title={t('info.chartTitle')}
              action={(
                <Box component="select" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label={t('info.chartRange')}
                  sx={{ height: 26, px: 0.75, borderRadius: '8px', outline: 'none', fontSize: '0.72rem', fontFamily: 'inherit',
                    bgcolor: T.CTRL_BG, color: T.TEXT_PRI, border: `1px solid ${T.BD}`,
                    '& option': { backgroundColor: T.PANEL_BG, color: T.TEXT_PRI } }}>
                  {RANGES.map((d) => <option key={d} value={d}>{t('info.lastDays', { days: d })}</option>)}
                </Box>
              )}>
              <TimeSeriesBarChart points={data.daily} granularity="day" height={190}
                series={[
                  { key: 'created', label: t('info.chartCreated'), color: CHART_COLORS.series2 },
                  { key: 'done', label: t('info.chartDone'), color: CHART_COLORS.series1 },
                ]} />
            </Panel>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
              <Panel T={T} title={t('info.byType')}>
                <BreakdownBarList rows={TICKET_TYPES
                  .map((o) => ({ key: o.value, label: t(o.labelKey), count: (data.byType && data.byType[o.value]) || 0 }))} />
              </Panel>
              <Panel T={T} title={t('info.byStatus')}>
                <BreakdownBarList rows={TICKET_STATUSES
                  .map((s) => ({ key: s.value, label: t(s.labelKey), count: byStatus[s.value] || 0 }))} />
              </Panel>
              <Panel T={T} title={t('info.bySection')}>
                <BreakdownBarList rows={(data.byArea || []).map((r) => ({ key: r.key, label: t(areaLabelKey(r.key)), count: r.count }))} />
              </Panel>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
