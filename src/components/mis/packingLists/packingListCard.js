import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import LinkIcon from '@mui/icons-material/Link';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

// draft vs final — the status was previously not surfaced anywhere in the list,
// so a finalised list looked identical to a half-filled draft.
const STATUS = {
  draft: { color: '#ffb74d', labelKey: 'mis.plStatusDraft' },
  final: { color: '#81c784', labelKey: 'mis.plStatusFinal' },
};

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

// One metric in the bottom strip.
function Metric({ value, label, T }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.35 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.TEXT_PRI,
        fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.62rem', color: T.TEXT_TER }}>{label}</Typography>
    </Box>
  );
}

export default function PackingListCard({ doc, selected, onClick, T }) {
  const { t } = useTranslation();
  const st = STATUS[doc.status] || STATUS.draft;
  const isLinked = doc.type === 'linked';
  const totals = doc.totals || {};
  const destination = doc.shippingDestination || doc.destinationAddress || '';
  const driver = doc.driverInfo?.fullName || '';

  return (
    <Box onClick={onClick} sx={{
      position: 'relative', px: 1.5, py: 1.25, borderRadius: '10px', cursor: 'pointer',
      border: '1px solid', borderColor: selected ? T.BD2 : 'transparent',
      bgcolor: selected ? T.CTRL_BG : 'transparent',
      transition: 'background-color 0.12s, border-color 0.12s',
      '&:hover': { bgcolor: T.CTRL_BG },
      // Status rail down the leading edge — readable at a glance while scanning.
      '&::before': {
        content: '""', position: 'absolute', insetInlineStart: 0, top: 10, bottom: 10,
        width: '3px', borderRadius: '3px', bgcolor: st.color,
      },
      pl: 2,
    }}>
      {/* Row 1 — number, type, status, date */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: T.TEXT_PRI, flexShrink: 0 }}>
          #{doc.docNumber}
        </Typography>

        <Tooltip title={isLinked ? t('mis.plTypeLinked') : t('mis.plTypeFree')}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3,
            px: 0.6, py: '1px', borderRadius: '4px', bgcolor: T.CTRL_BG, flexShrink: 0 }}>
            {isLinked
              ? <LinkIcon sx={{ fontSize: 11, color: T.TEXT_SEC }} />
              : <InventoryIcon sx={{ fontSize: 11, color: T.TEXT_SEC }} />}
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: T.TEXT_SEC }}>
              {isLinked
                ? (doc.invoiceIds?.length > 1
                    ? t('mis.plLinkedCount', { count: doc.invoiceIds.length })
                    : t('mis.plTypeLinked'))
                : t('mis.plTypeFree')}
            </Typography>
          </Box>
        </Tooltip>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3,
          px: 0.6, py: '1px', borderRadius: '4px', bgcolor: `${st.color}1a`, flexShrink: 0 }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: st.color }} />
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: st.color }}>
            {t(st.labelKey)}
          </Typography>
        </Box>

        <Typography sx={{ ml: 'auto', fontSize: '0.66rem', color: T.TEXT_TER, flexShrink: 0 }}>
          {fmtDate(doc.insertDate)}
        </Typography>
      </Box>

      {/* Row 2 — where it's going / who's driving */}
      {(destination || driver) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6, minWidth: 0 }}>
          {destination && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, minWidth: 0, flex: 1 }}>
              <PlaceOutlinedIcon sx={{ fontSize: 12, color: T.TEXT_TER, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }} noWrap>
                {destination}
              </Typography>
            </Box>
          )}
          {driver && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, minWidth: 0,
              flexShrink: destination ? 1 : 0, maxWidth: destination ? '45%' : '100%' }}>
              <PersonOutlineIcon sx={{ fontSize: 12, color: T.TEXT_TER, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }} noWrap>
                {driver}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Row 3 — the numbers that matter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Metric value={totals.totalPallets ?? (doc.pallets?.length || 0)}
          label={t('mis.plMetricPallets')} T={T} />
        <Metric value={totals.totalPcs || 0} label={t('mis.plColPcs')} T={T} />
        <Metric value={(totals.totalSqm || 0).toFixed(2)} label={t('mis.plColSqm')} T={T} />
      </Box>
    </Box>
  );
}
