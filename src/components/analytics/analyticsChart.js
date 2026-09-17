import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Hand-rolled SVG charts — no charting library dependency (see the analytics
// plan: the app has none today and adding one needs sign-off). Follows the
// dataviz skill's mark specs: <=24px bars, 4px rounded data-end / square
// baseline, 2px surface gaps between bars, hairline recessive gridlines,
// per-bar hover tooltip (bars don't get a crosshair — the mark IS the hit
// target), text never carries the series color.
//
// Categorical pair, validated (scripts/validate_palette.js, both light+dark
// surfaces, all checks pass): green #43a047 (inbound/positive-direction
// series) + blue #1e88e5 (outbound/neutral series) — reused as the app's
// fixed two-series order everywhere an analytics chart needs exactly two
// series. Single-series breakdown bars use the same blue alone (a magnitude
// ranking has no identity to encode in hue — see choosing-a-form.md).
export const CHART_COLORS = { series1: '#43a047', series2: '#1e88e5' };

function fmtCompact(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function fmtDateTick(iso, granularity) {
  const d = new Date(iso);
  if (granularity === 'month') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  if (granularity === 'week')  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function useChartTokens() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    isDark,
    GRID:     isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    TOOLTIP_BG: isDark ? '#1c1c1c' : '#ffffff',
    TOOLTIP_BD: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
  };
}

// ── Time series — 1 or 2 series of day/week/month-bucketed bars ────────────
// points: [{date, count, [seriesKey]: number, ...}]
// series: [{key, label, color}] — length 1 or 2
export function TimeSeriesBarChart({ points, series, granularity, height = 200 }) {
  const T = useChartTokens();
  const [hover, setHover] = useState(null); // { index, x, y }

  const width = 640; // viewBox units — scales via SVG's own responsive width:100%
  const padL = 40, padR = 8, padT = 8, padB = 24;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxVal = Math.max(1, ...points.flatMap((p) => series.map((s) => Number(p[s.key]) || 0)));
  const yMax = niceCeil(maxVal);
  const yTicks = [0, yMax * 0.5, yMax];

  const n = Math.max(points.length, 1);
  const groupW = plotW / n;
  const barGap = 2; // dataviz spec: 2px surface gap between adjacent bars
  const barW = Math.min(24, (groupW - barGap * (series.length + 1)) / series.length);

  const yFor = (v) => padT + plotH - (Math.min(v, yMax) / yMax) * plotH;

  if (!points.length) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_TER }}>No data in this range</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {series.length > 1 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 0.75, pl: `${padL}px` }}>
          {series.map((s) => (
            <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 2, borderRadius: 1, bgcolor: s.color }} />
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={width - padR} y1={yFor(t)} y2={yFor(t)} stroke={T.GRID} strokeWidth={1} />
            <text x={padL - 6} y={yFor(t)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill={T.TEXT_TER}>
              {fmtCompact(t)}
            </text>
          </g>
        ))}

        {points.map((p, i) => {
          const groupX = padL + i * groupW;
          const showTick = n <= 12 || i % Math.ceil(n / 12) === 0;
          return (
            <g key={i}>
              {series.map((s, si) => {
                const val = Number(p[s.key]) || 0;
                const barH = Math.max(0, plotH - (yFor(val) - padT));
                const x = groupX + barGap + si * (barW + barGap);
                const y = yFor(val);
                const isHovered = hover?.index === i;
                return (
                  <rect key={s.key}
                    x={x} y={y} width={Math.max(barW, 0)} height={barH}
                    rx={4} ry={4}
                    fill={s.color} opacity={isHovered ? 1 : 0.85}
                    style={{ transition: 'opacity 0.1s' }}
                  />
                );
              })}
              {/* Full-height transparent hit target — bigger than the painted bars, one per bucket */}
              <rect x={groupX} y={padT} width={groupW} height={plotH} fill="transparent"
                tabIndex={0}
                onMouseEnter={() => setHover({ index: i })}
                onMouseLeave={() => setHover((h) => (h?.index === i ? null : h))}
                onFocus={() => setHover({ index: i })}
                onBlur={() => setHover((h) => (h?.index === i ? null : h))}
                style={{ cursor: 'pointer', outline: 'none' }}
              />
              {showTick && (
                <text x={groupX + groupW / 2} y={height - 6} textAnchor="middle" fontSize="9" fill={T.TEXT_TER}>
                  {fmtDateTick(p.date, granularity)}
                </text>
              )}
            </g>
          );
        })}
      </Box>

      {hover && points[hover.index] && (
        <Box sx={{
          position: 'absolute', top: 4, right: 4, px: 1.25, py: 0.75, borderRadius: '8px',
          bgcolor: T.TOOLTIP_BG, border: `1px solid ${T.TOOLTIP_BD}`, pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', minWidth: 120,
        }}>
          <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC, mb: 0.25 }}>
            {fmtDateTick(points[hover.index].date, granularity)}
          </Typography>
          {series.map((s) => (
            <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 2, borderRadius: 1, bgcolor: s.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700 }}>
                {fmtCompact(points[hover.index][s.key])}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Breakdown — ranked horizontal bars, single hue (magnitude, not identity) ─
// rows: [{key, label, count, ...}]; valueKey picks which numeric field is the
// bar length (defaults to 'count' — pass e.g. 'quantity' for a sum-based breakdown).
export function BreakdownBarList({ rows, valueKey = 'count', color = CHART_COLORS.series2 }) {
  const T = useChartTokens();
  const [hoverKey, setHoverKey] = useState(null);
  if (!rows.length) {
    return <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_TER, py: 1 }}>No data in this range</Typography>;
  }
  const max = Math.max(1, ...rows.map((r) => Number(r[valueKey]) || 0));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {rows.map((r) => {
        const val = Number(r[valueKey]) || 0;
        const pct = Math.max(2, (val / max) * 100);
        const isHovered = hoverKey === r.key;
        return (
          <Box key={String(r.key)}
            onMouseEnter={() => setHoverKey(r.key)} onMouseLeave={() => setHoverKey(null)}
            tabIndex={0} onFocus={() => setHoverKey(r.key)} onBlur={() => setHoverKey(null)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, outline: 'none' }}>
            <Typography noWrap sx={{ fontSize: '0.74rem', color: T.TEXT_SEC, width: 100, flexShrink: 0 }}>
              {r.label}
            </Typography>
            <Box sx={{ flexGrow: 1, height: 16, borderRadius: '4px', bgcolor: T.GRID, position: 'relative', overflow: 'hidden' }}>
              <Box sx={{
                width: `${pct}%`, height: '100%', borderRadius: '4px', bgcolor: color,
                opacity: isHovered ? 1 : 0.85, transition: 'width 0.2s, opacity 0.1s',
              }} />
            </Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, width: 48, textAlign: 'right', flexShrink: 0 }}>
              {fmtCompact(val)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function niceCeil(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}
