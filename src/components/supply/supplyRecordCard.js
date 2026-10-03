import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

// Deal-letter stages, in pipeline order. Colours match dealLetterDetail.js.
const STAGES = [
  { key: 'purchasing',    color: '#64b5f6', labelKey: 'supply.statusPurchasing' },
  { key: 'processing',    color: '#ffb74d', labelKey: 'supply.statusProcessing' },
  { key: 'final_product', color: '#81c784', labelKey: 'supply.statusFinalProduct' },
];

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

export default function SupplyRecordCard({ record, selected, onClick, T }) {
  const { t } = useTranslation();

  // stageCounts is supplied by the list route; absent on an older payload, in
  // which case the stage strip simply doesn't render.
  const counts = record.stageCounts || null;
  const total = record.dealLetterCount || 0;

  return (
    <Box onClick={onClick} sx={{
      px: 1.5, py: 1.25, borderRadius: '10px', cursor: 'pointer',
      border: '1px solid',
      borderColor: selected ? T.BD2 : 'transparent',
      bgcolor: selected ? T.CTRL_BG : 'transparent',
      transition: 'background-color 0.12s, border-color 0.12s',
      '&:hover': { bgcolor: T.CTRL_BG },
    }}>
      {/* Row 1 — product code chip + title + date */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <Box sx={{
          fontFamily: 'monospace', fontSize: '0.66rem', fontWeight: 700, letterSpacing: 0.5,
          px: 0.75, py: '2px', borderRadius: '5px', flexShrink: 0,
          bgcolor: T.CTRL_BG, color: T.TEXT_PRI, border: `1px solid ${T.BD}`,
        }}>
          {record.productCode || '—'}
        </Box>
        <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: T.TEXT_PRI, flex: 1, minWidth: 0 }} noWrap>
          {record.title}
        </Typography>
        <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, flexShrink: 0 }}>
          {fmtDate(record.date)}
        </Typography>
      </Box>

      {/* Row 2 — the record's unique code (SR-0001…) + product name */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.6, minWidth: 0 }}>
        {record.code && (
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 700,
            color: '#64b5f6', flexShrink: 0, letterSpacing: 0.3 }}>
            {record.code}
          </Typography>
        )}
        {record.productName && (
          <Typography sx={{ fontSize: '0.73rem', color: T.TEXT_SEC, minWidth: 0 }} noWrap>
            {record.productName}
          </Typography>
        )}
      </Box>

      {/* Row 3 — deal-letter stage strip */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
        {total === 0 ? (
          <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>
            {t('supply.noDealLettersYet')}
          </Typography>
        ) : counts ? (
          STAGES.filter((s) => counts[s.key] > 0).map((s) => (
            <Tooltip key={s.key} title={t(s.labelKey)}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4,
                px: 0.6, py: '1px', borderRadius: '4px', bgcolor: `${s.color}1a` }}>
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: s.color }} />
                <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: s.color }}>
                  {counts[s.key]}
                </Typography>
              </Box>
            </Tooltip>
          ))
        ) : (
          <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER }}>
            {t('supply.dealLetterCount', { count: total })}
          </Typography>
        )}
        {counts && total > 0 && (
          <Typography sx={{ fontSize: '0.64rem', color: T.TEXT_TER, ml: 0.25 }}>
            {t('supply.dealLetterCount', { count: total })}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
