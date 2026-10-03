import { useState, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import PrintIcon from '@mui/icons-material/Print';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import CropLandscapeOutlinedIcon from '@mui/icons-material/CropLandscapeOutlined';

import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { downloadMisPalletLabelPdf } from '../../../store/store';

// Downloads the real server-rendered (Puppeteer) label PDF for ONE pallet —
// not a browser print dialog, since each label prints at its own physical
// size rather than A4.
//
// Two kinds of label, picked from the print button's menu:
//   slab  — لیبل اسلب: portrait, every cut on the pallet listed with its size
//   short — پالت کوتاه: one wide strip — code, L/W/H, pieces, pallet code and
//           the quality letter, for a pallet of one size
const LABEL_KINDS = [
  { kind: 'slab',  Icon: ViewAgendaOutlinedIcon,    titleKey: 'mis.labelKindSlab',  descKey: 'mis.labelKindSlabDesc' },
  { kind: 'short', Icon: CropLandscapeOutlinedIcon, titleKey: 'mis.labelKindShort', descKey: 'mis.labelKindShortDesc' },
];

function useLabelDownload({ packingListId, docNumber, palletId, lang }) {
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const [downloading, setDownloading] = useState(false);
  const download = async (kind) => {
    setDownloading(true);
    await dispatch(downloadMisPalletLabelPdf({ authCtx, axiosGlobal, id: packingListId, palletId, docNumber, lang, kind }));
    setDownloading(false);
  };
  return { downloading, download };
}

// The label-kind menu both entry points share.
function LabelKindMenu({ anchorEl, onClose, onPick, palletId }) {
  const { t } = useTranslation();
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ sx: { borderRadius: '10px', minWidth: 250 } }}>
      <Typography sx={{ px: 2, pt: 0.75, pb: 0.5, fontSize: '0.62rem', fontWeight: 700, letterSpacing: 0.8,
        textTransform: 'uppercase', color: 'text.disabled' }}>
        {t('mis.labelKindMenuTitle', { pallet: palletId })}
      </Typography>
      {LABEL_KINDS.map(({ kind, Icon, titleKey, descKey }) => (
        <MenuItem key={kind} onClick={() => { onClose(); onPick(kind); }} sx={{ py: 1, gap: 1.25, alignItems: 'flex-start' }}>
          <Icon sx={{ fontSize: 18, mt: '2px', color: 'text.secondary' }} />
          <Box>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{t(titleKey)}</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>{t(descKey)}</Typography>
          </Box>
        </MenuItem>
      ))}
    </Menu>
  );
}

// Compact button. ALWAYS names its pallet, then asks which label to print.
export default function PalletLabelButton({ packingListId, docNumber, palletId, lang }) {
  const { t } = useTranslation();
  const { downloading, download } = useLabelDownload({ packingListId, docNumber, palletId, lang });
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <Button size="small" onClick={(e) => setAnchor(e.currentTarget)} disabled={downloading}
        startIcon={downloading ? <CircularProgress size={12} /> : <PrintIcon sx={{ fontSize: 14 }} />}
        endIcon={<ArrowDropDownIcon sx={{ fontSize: 16 }} />}
        sx={{ fontSize: '0.66rem', textTransform: 'none', minWidth: 0 }}>
        {t('mis.printLabelFor', { pallet: palletId })}
      </Button>
      <LabelKindMenu anchorEl={anchor} onClose={() => setAnchor(null)} onPick={download} palletId={palletId} />
    </>
  );
}

// A card per pallet for the Document view — shaped like the printed label
// (portrait) and showing what's actually on the pallet, so it's obvious which
// label you're about to print before you print it.
export function PalletLabelCard({ pallet, index, packingListId, docNumber, lang }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { downloading, download } = useLabelDownload({
    packingListId, docNumber, palletId: pallet.palletId, lang,
  });
  const [anchor, setAnchor] = useState(null);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)',
    BD_HOVER: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.9)'  : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.5)'  : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)',
    CARD_BG:  isDark ? 'rgba(255,255,255,0.03)' : '#fff',
    STRIP_BG: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
  };

  const items = pallet.items || [];
  const pcs = items.reduce((a, it) => a + (Number(it.pcs) || 0), 0);
  const sqm = items.reduce((a, it) => a + (Number(it.sqm) || 0), 0);
  const codes = [...new Set(items.map((it) => it.code).filter(Boolean))];

  return (
    <Box onClick={downloading ? undefined : (e) => setAnchor(e.currentTarget)}
      sx={{
        width: 168, flexShrink: 0, display: 'flex', flexDirection: 'column',
        border: `1px solid ${T.BD}`, borderRadius: '10px', bgcolor: T.CARD_BG,
        overflow: 'hidden', cursor: downloading ? 'progress' : 'pointer',
        transition: 'border-color 0.15s, transform 0.15s',
        '&:hover': { borderColor: T.BD_HOVER, transform: 'translateY(-1px)' },
      }}>

      {/* Top strip — position in the shipment + pallet id, the thing the
          label is printed big with. */}
      <Box sx={{ px: 1.25, pt: 1, pb: 0.75, bgcolor: T.STRIP_BG, borderBottom: `1px solid ${T.BD}` }}>
        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: 0.8,
          textTransform: 'uppercase', color: T.TEXT_TER }}>
          {t('mis.plPalletOf', { n: index + 1 })}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: T.TEXT_PRI, lineHeight: 1.15 }}>
            {pallet.palletId}
          </Typography>
          {pallet.reference && (
            <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: T.TEXT_SEC }} noWrap>
              {pallet.reference}
            </Typography>
          )}
        </Box>
      </Box>

      {/* What's on it */}
      <Box sx={{ px: 1.25, py: 1, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        {pallet.processingType && (
          <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC }} noWrap>
            {pallet.processingType}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
          {codes.slice(0, 2).map((c) => (
            <Box key={c} sx={{ fontFamily: 'monospace', fontSize: '0.62rem', px: 0.6, py: '1px',
              borderRadius: '4px', border: `1px solid ${T.BD}`, color: T.TEXT_SEC,
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c}
            </Box>
          ))}
          {codes.length > 2 && (
            <Typography sx={{ fontSize: '0.62rem', color: T.TEXT_TER }}>+{codes.length - 2}</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto', pt: 0.5 }}>
          <Box>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: T.TEXT_PRI,
              fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{pcs}</Typography>
            <Typography sx={{ fontSize: '0.58rem', color: T.TEXT_TER, textTransform: 'uppercase' }}>
              {t('mis.plColPcs')}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: T.TEXT_PRI,
              fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{sqm.toFixed(2)}</Typography>
            <Typography sx={{ fontSize: '0.58rem', color: T.TEXT_TER, textTransform: 'uppercase' }}>
              {t('mis.plColSqm')}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: T.TEXT_PRI,
              fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{items.length}</Typography>
            <Typography sx={{ fontSize: '0.58rem', color: T.TEXT_TER, textTransform: 'uppercase' }}>
              {t('mis.plRowsShort')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* The action, naming its pallet — opens the label-kind menu */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6,
        py: 0.8, borderTop: `1px solid ${T.BD}`, color: T.TEXT_PRI }}>
        {downloading
          ? <CircularProgress size={13} />
          : <PrintIcon sx={{ fontSize: 15 }} />}
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
          {downloading ? t('mis.plPreparingLabel') : t('mis.printLabelFor', { pallet: pallet.palletId })}
        </Typography>
        {!downloading && <ArrowDropDownIcon sx={{ fontSize: 16, ml: -0.4 }} />}
      </Box>

      {/* Clicks inside the menu must not bubble back to the card. */}
      <Box onClick={(e) => e.stopPropagation()}>
        <LabelKindMenu anchorEl={anchor} onClose={() => setAnchor(null)} onPick={download} palletId={pallet.palletId} />
      </Box>
    </Box>
  );
}
