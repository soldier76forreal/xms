import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

const GRADE_LABEL = { Q: 'Super', QS: 'Super+', W: 'Momtaz', E: 'Grade 1', R: 'Grade 2', T: 'Grade 3' };
const CUT_LABEL   = { V: 'Veincut', C: 'Crosscut' };
const FILL_LABEL  = { F: 'Filled', U: 'Unfilled' };
const FINISH_LABEL = { P: 'Polished', H: 'Honed' };

function SpecRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 90, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

function FinishChips({ cut, fill, finish }) {
  const chips = [];
  if (cut)    chips.push({ key: 'cut',    label: CUT_LABEL[cut] || cut });
  if (fill)   chips.push({ key: 'fill',   label: FILL_LABEL[fill] || fill });
  if (finish) chips.push({ key: 'finish', label: FINISH_LABEL[finish] || finish });
  if (chips.length === 0) return <Typography variant="body2" sx={{ fontWeight: 500 }}>—</Typography>;
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {chips.map((c) => (
        <Chip key={c.key} label={c.label} size="small"
          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 500 }} />
      ))}
    </Box>
  );
}

const SpecPanel = ({ spec, productCode }) => {
  if (!spec) return null;

  const dims = spec.unsized
    ? `Unsized slab — thickness ${spec.thicknessMm} mm`
    : `${spec.lengthCm} × ${spec.widthCm} cm · ${spec.thicknessMm} mm thick`;

  return (
    <Box
      sx={{
        border: '1.5px solid',
        borderColor: 'divider',
        borderRadius: '14px',
        bgcolor: 'background.paper',
        p: 2.5,
        mb: 3,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'text.disabled', display: 'block', mb: 1.5 }}>
        Specification
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {productCode && <SpecRow label="Product code" value={productCode} />}
        <SpecRow label="Stone" value={spec.stoneTypeName || spec.stoneType} />
        <SpecRow label="Quarry" value={spec.quarryCode} />
        <SpecRow label="Grade" value={spec.gradeName ? `${spec.grade} — ${spec.gradeName}` : spec.grade} />
        <SpecRow label="Dimensions" value={dims} />
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 90, flexShrink: 0 }}>
          Finish
        </Typography>
        <FinishChips cut={spec.cut} fill={spec.fill} finish={spec.finish} />
      </Box>

      {spec.raw && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 90, display: 'inline-block' }}>
            Raw code
          </Typography>
          <Typography
            variant="caption"
            component="code"
            sx={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: 0.5, ml: 1 }}
          >
            {spec.raw}
          </Typography>
        </Box>
      )}

      {spec.parseWarnings?.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {spec.parseWarnings.map((w, i) => (
            <Typography key={i} variant="caption" sx={{ color: 'warning.main', fontSize: '0.7rem' }}>
              ⚠ {w}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SpecPanel;
