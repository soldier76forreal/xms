import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useTheme } from '@mui/material/styles';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PaidIcon from '@mui/icons-material/Paid';
import SendIcon from '@mui/icons-material/Send';

import { usePermissions } from '../../contextApi/PermissionContext';
import UnreadDot, { unreadRowTint } from '../../tools/unreadDot';

// status → chip colour (subtle alpha tints, dark/opacity language)
const STATUS_META = {
  draft:          { labelKey: 'mis.statusDraft',     color: '#9e9e9e' },
  sent:           { labelKey: 'mis.statusSent',      color: '#64b5f6' },
  accepted:       { labelKey: 'mis.statusAccepted',  color: '#81c784' },
  converted:      { labelKey: 'mis.statusConverted', color: '#ba68c8' },
  expired:        { labelKey: 'mis.statusExpired',   color: '#ffb74d' },
  issued:         { labelKey: 'mis.statusIssued',    color: '#64b5f6' },
  paid:           { labelKey: 'mis.statusPaid',      color: '#81c784' },
  partially_paid: { labelKey: 'mis.statusPartial',   color: '#ffb74d' },
  cancelled:      { labelKey: 'mis.statusCancelled', color: '#e57373' },
};

const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate  = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

export default function InvoiceCard({ doc, selected, unread, onSelect, onEdit, onPdf, onConvert, onDelete, onAssign }) {
  const { t } = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { can } = usePermissions();

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CARD_BG:  unread ? unreadRowTint(isDark) : (isDark ? '#181818' : theme.palette.background.paper),
    SEL_BG:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  };

  const [menuAnchor, setMenuAnchor] = useState(null);

  const isInvoice = doc.docType === 'invoice';
  const status    = STATUS_META[doc.status] || STATUS_META.draft;
  const permBase  = isInvoice ? 'mis:invoice' : 'mis:preinvoice';

  const paidSum   = isInvoice && doc.payment
    ? (Number(doc.payment.cash) || 0) + (Number(doc.payment.chequeBank) || 0) + (Number(doc.payment.card) || 0)
    : 0;

  const openMenu  = (e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); };
  const closeMenu = (e) => { e?.stopPropagation?.(); setMenuAnchor(null); };
  const act = (fn) => (e) => { closeMenu(e); fn && fn(doc); };

  const canConvert = !isInvoice && can('mis:preinvoice:convert') &&
    doc.status !== 'converted' && !doc.convertedToInvoiceId;

  return (
    <Box onClick={() => onSelect && onSelect(doc)}
      sx={{
        position: 'relative',
        mx: 1, mb: 0.75, px: 1.5, py: 1.25, borderRadius: '12px', cursor: 'pointer',
        border: `1px solid ${selected ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)') : T.BD}`,
        bgcolor: selected ? T.SEL_BG : T.CARD_BG,
        transition: 'border-color 0.15s, background-color 0.15s',
        '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)',
          '& .cardMenuBtn': { opacity: 1 } },
      }}>
      {unread && <UnreadDot />}

      {/* row 1 — type icon + number + docType chip + status chip + menu */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {isInvoice
          ? <ReceiptLongIcon  sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />
          : <RequestQuoteIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />}

        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
          #{doc.docNumber}
        </Typography>

        <Box sx={{ px: 0.75, py: '1px', borderRadius: '5px', border: `1px solid ${T.BD}`, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: 0.5,
            textTransform: 'uppercase', color: T.TEXT_SEC }}>
            {isInvoice ? t('mis.invoiceType') : t('mis.quoteType')}
          </Typography>
        </Box>

        <Box sx={{ px: 0.75, py: '1px', borderRadius: '5px', bgcolor: `${status.color}22`, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: status.color }}>
            {t(status.labelKey)}
          </Typography>
        </Box>

        {isInvoice && paidSum > 0 && (
          <PaidIcon sx={{ fontSize: 13, color: doc.status === 'paid' ? '#81c784' : '#ffb74d', flexShrink: 0 }} />
        )}

        {(doc.assignedTo || []).length > 0 && (
          <Tooltip title={doc.assignedByName ? t('mis.sentBy', { name: doc.assignedByName }) : t('mis.sentTooltip')}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              <SendIcon sx={{ fontSize: 12, color: '#64b5f6' }} />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: T.TEXT_TER }}>
                {doc.assignedTo.length}
              </Typography>
            </Box>
          </Tooltip>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <IconButton size="small" onClick={openMenu} className="cardMenuBtn"
          sx={{ width: 24, height: 24, color: T.TEXT_TER, opacity: { xs: 1, md: 0.15 },
            transition: 'opacity 0.15s' }}>
          <MoreVertIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      {/* row 2 — customer + date + total */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5, pl: '23px' }}>
        <Typography noWrap sx={{ fontSize: '0.76rem', color: T.TEXT_SEC, flexGrow: 1, minWidth: 0 }}>
          {doc.customerSnapshot?.name || '—'}
        </Typography>
        <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, flexShrink: 0 }}>
          {fmtDate(doc.issueDate)}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0 }}>
          {fmtMoney(doc.grandTotal)} <Box component="span" sx={{ fontSize: '0.62rem', color: T.TEXT_TER }}>AED</Box>
        </Typography>
      </Box>

      {/* quick-action menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{ sx: { minWidth: 170, bgcolor: isDark ? '#181818' : 'background.paper',
          border: `1px solid ${T.BD}`, borderRadius: '10px' } }}>

        {can(`${permBase}:edit`) && (
          <MenuItem dense onClick={act(onEdit)} sx={{ fontSize: '0.78rem' }}>
            <ListItemIcon><EditIcon sx={{ fontSize: 15 }} /></ListItemIcon>
            {t('common.edit')}
          </MenuItem>
        )}

        {can(`${permBase}:pdf`) && (
          <MenuItem dense onClick={act(onPdf)} sx={{ fontSize: '0.78rem' }}>
            <ListItemIcon><PictureAsPdfIcon sx={{ fontSize: 15 }} /></ListItemIcon>
            {t('mis.savePdf')}
          </MenuItem>
        )}

        {canConvert && (
          <MenuItem dense onClick={act(onConvert)} sx={{ fontSize: '0.78rem' }}>
            <ListItemIcon><SwapHorizIcon sx={{ fontSize: 15 }} /></ListItemIcon>
            {t('mis.convertToInvoice')}
          </MenuItem>
        )}

        {can(`${permBase}:edit`) && onAssign && (
          <MenuItem dense onClick={act(onAssign)} sx={{ fontSize: '0.78rem' }}>
            <ListItemIcon><SendIcon sx={{ fontSize: 15 }} /></ListItemIcon>
            {t('mis.sendToEllipsis')}
          </MenuItem>
        )}

        {can(`${permBase}:delete`) && (
          <MenuItem dense onClick={act(onDelete)} sx={{ fontSize: '0.78rem', color: '#EA005A' }}>
            <ListItemIcon><DeleteOutlineIcon sx={{ fontSize: 15, color: '#EA005A' }} /></ListItemIcon>
            {t('common.delete')}
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
