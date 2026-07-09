import { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';

import CallIcon          from '@mui/icons-material/Call';
import EmailIcon         from '@mui/icons-material/Email';
import WhatsAppIcon      from '@mui/icons-material/WhatsApp';
import TelegramIcon      from '@mui/icons-material/Telegram';
import InstagramIcon     from '@mui/icons-material/Instagram';
import ExpandMoreIcon    from '@mui/icons-material/ExpandMore';
import ExpandLessIcon    from '@mui/icons-material/ExpandLess';
import ScheduleIcon      from '@mui/icons-material/Schedule';
import LocationOnIcon    from '@mui/icons-material/LocationOn';
import MoreVertIcon      from '@mui/icons-material/MoreVert';
import EditIcon          from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCommentIcon    from '@mui/icons-material/AddComment';
import DashboardIcon     from '@mui/icons-material/Dashboard';
import ReceiptLongIcon   from '@mui/icons-material/ReceiptLong';
import ImageIcon         from '@mui/icons-material/Image';
// Status icons
import FiberNewIcon      from '@mui/icons-material/FiberNew';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon   from '@mui/icons-material/EmojiEvents';
import CancelIcon        from '@mui/icons-material/Cancel';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { actions, deleteCrmCustomer } from '../../store/store';
import { Can, usePermissions } from '../../contextApi/PermissionContext';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import { ISO_MAP, NAME_MAP } from './util/countryData';

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  new:       { bg: 'rgba(100,149,237,0.15)', text: 'rgb(100,149,237)', Icon: FiberNewIcon,    label: 'New'       },
  active:    { bg: 'rgba(72,199,142,0.15)',  text: 'rgb(72,199,142)',  Icon: CheckCircleIcon, label: 'Active'    },
  follow_up: { bg: 'rgba(255,183,77,0.15)',  text: 'rgb(255,183,77)',  Icon: ScheduleIcon,    label: 'Follow-up' },
  won:       { bg: 'rgba(72,199,142,0.2)',   text: 'rgb(50,180,120)',  Icon: EmojiEventsIcon, label: 'Won'       },
  lost:      { bg: 'rgba(255,77,141,0.15)',  text: 'rgb(255,77,141)', Icon: CancelIcon,      label: 'Lost'      },
};

// ── channel contact links ─────────────────────────────────────────────────────

const CHANNEL_ICONS = {
  whatsApp:  { icon: <WhatsAppIcon  sx={{ fontSize: 16 }} />, build: h => `https://wa.me/${h}` },
  phone:     { icon: <CallIcon      sx={{ fontSize: 16 }} />, build: h => `tel:${h}` },
  email:     { icon: <EmailIcon     sx={{ fontSize: 16 }} />, build: h => `mailto:${h}` },
  telegram:  { icon: <TelegramIcon  sx={{ fontSize: 16 }} />, build: h => `https://t.me/${h}` },
  instagram: { icon: <InstagramIcon sx={{ fontSize: 16 }} />, build: h => `https://instagram.com/${h}` },
};

function getContactLinks(customer) {
  const links = [];
  const h  = customer.commHandles || {};
  const ch = customer.commChannels || [];

  for (const [key, cfg] of Object.entries(CHANNEL_ICONS)) {
    if ((ch.includes(key) || key === 'phone') && h[key]) {
      links.push({ key, href: cfg.build(h[key]), icon: cfg.icon, label: key });
    }
  }

  if (!links.length) {
    const phone = customer.contactInfo?.phoneNumbers?.[0];
    if (phone) {
      links.push({ key: 'phone', href: `tel:+${phone.countryCode}${phone.number}`,
        icon: <CallIcon sx={{ fontSize: 16 }} />, label: 'phone' });
      if (phone.whatsApp)
        links.push({ key: 'whatsApp', href: `https://wa.me/${phone.countryCode}${phone.number}`,
          icon: <WhatsAppIcon sx={{ fontSize: 16 }} />, label: 'whatsApp' });
    }
    const email = customer.contactInfo?.emails?.[0]?.email;
    if (email)
      links.push({ key: 'email', href: `mailto:${email}`, icon: <EmailIcon sx={{ fontSize: 16 }} />, label: 'email' });
  }

  return links.slice(0, 5);
}

function relativeDate(d) {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0)   return 'today';
  if (days === 1)   return 'yesterday';
  if (days < 30)   return `${days}d ago`;
  if (days < 365)  return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Resolve flag + country name from phone country code or from personal-information.country */
function resolveCountryDisplay(customer) {
  const phoneCC = customer.phoneCountryCode; // ISO2 code stored on model
  const piCountry = (customer.personalInformation || {}).country || '';

  // Try phoneCountryCode first (ISO2 → lookup)
  if (phoneCC && ISO_MAP[phoneCC]) {
    return { flag: ISO_MAP[phoneCC].flag, name: ISO_MAP[phoneCC].name };
  }
  // Try to match personalInformation.country as a name
  if (piCountry) {
    const match = NAME_MAP[piCountry.toLowerCase()];
    if (match) return { flag: match.flag, name: match.name };
    // No match — just return the text without a flag
    return { flag: null, name: piCountry };
  }
  return null;
}

// ── CustomerCard ──────────────────────────────────────────────────────────────

const CustomerCard = ({
  customer, selected, checked, showCheckbox,
  onSelect, onCheck, expanded, onExpand,
  onEdit, onAddToMyDesk,
}) => {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const [hovering,    setHovering]    = useState(false);
  const [menuAnchor,  setMenuAnchor]  = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [addingDesk,  setAddingDesk]  = useState(false);

  const T = {
    CARD_BG: isDark ? (selected ? '#1c1c1c' : '#131313') : (selected ? 'rgba(0,0,0,0.04)' : theme.palette.background.paper),
    CARD_BD: isDark
      ? (selected ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)')
      : (selected ? 'rgba(0,0,0,0.3)' : theme.palette.divider),
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    HVR_BG:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    MENU_BG:  isDark ? '#1a1a1a' : '#fff',
  };

  const pi      = customer.personalInformation || {};
  const isComp  = (pi.personOrCompany || pi.customerType) === 'company';
  const name    = isComp
    ? (pi.companyName || '—')
    : `${pi.firstName || ''} ${pi.lastName || ''}`.trim() || '—';

  const statusKey = customer.status || 'new';
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.new;
  const StatusIcon = statusCfg.Icon;

  const tags     = customer.tags || [];
  const links    = getContactLinks(customer);
  const lastCall = relativeDate(customer.lastCallAt);
  const followUp = customer.nextFollowUpAt ? new Date(customer.nextFollowUpAt) : null;
  const isOverdue = followUp && followUp < new Date();
  const countryDisplay = resolveCountryDisplay(customer);

  const phone  = customer.phoneNumber || customer.contactInfo?.phoneNumbers?.[0]?.number || '';
  const email  = (customer.commHandles || {}).email || customer.contactInfo?.emails?.[0]?.email || '';

  const showCb = showCheckbox || checked || hovering;

  // ── handlers ──────────────────────────────────────────────────────────────

  const openMenu = (e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); };
  const closeMenu = () => setMenuAnchor(null);

  const handleMenuEdit = (e) => {
    e.stopPropagation();
    closeMenu();
    onEdit && onEdit(customer);
  };

  const handleMenuDeleteClick = (e) => {
    e.stopPropagation();
    closeMenu();
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteCrmCustomer({ authCtx, axiosGlobal, id: customer._id }));
      dispatch(actions.setShowSnackBar({ status: true, msg: 'مشتری حذف شد', type: 'success' }));
    } catch (_) {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'خطا در حذف مشتری', type: 'error' }));
    }
    setDeleting(false);
  };

  // Communication tab (index 1) — both "New communication" and "Send image"
  // land here: the paperclip/mic attach controls live inside that tab (Session 46+8).
  const handleMenuCommunication = (e) => {
    e.stopPropagation();
    closeMenu();
    onSelect && onSelect(customer, 1);
  };

  const handleMenuAddToDesk = async (e) => {
    e.stopPropagation();
    closeMenu();
    if (!onAddToMyDesk) return;
    setAddingDesk(true);
    await onAddToMyDesk([customer._id]);
    setAddingDesk(false);
  };

  // Requests tab (index 2) — the real "New invoice" / "New quote" buttons
  // live there (requestsTab.js), each individually gated per doc type.
  const handleMenuInvoice = (e) => {
    e.stopPropagation();
    closeMenu();
    onSelect && onSelect(customer, 2);
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Box
        onClick={() => onSelect(customer)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        sx={{
          mx: 1, mb: 0.5, borderRadius: '12px', cursor: 'pointer',
          border: `1px solid ${T.CARD_BD}`,
          bgcolor: T.CARD_BG,
          transition: 'border-color 0.15s, background-color 0.15s',
          '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.2)' },
        }}
      >
        {/* ── Main row ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 1.25, gap: 1 }}>

          {/* Checkbox */}
          <Box sx={{ width: 28, flexShrink: 0, opacity: showCb ? 1 : 0, transition: 'opacity 0.15s',
            pointerEvents: showCb ? 'auto' : 'none' }}>
            <Checkbox size="small" checked={checked}
              onChange={e => { e.stopPropagation(); onCheck(customer._id, e.target.checked); }}
              onClick={e => e.stopPropagation()}
              sx={{ p: 0, color: T.TEXT_TER, '&.Mui-checked': { color: T.TEXT_PRI } }} />
          </Box>

          {/* Status icon */}
          <Tooltip title={statusCfg.label}>
            <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <StatusIcon sx={{ fontSize: 16, color: statusCfg.text }} />
            </Box>
          </Tooltip>

          {/* Name + location */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: T.TEXT_PRI,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </Typography>
              {isComp && pi.contactPerson && (
                <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, flexShrink: 0 }}>
                  · {pi.contactPerson}
                </Typography>
              )}
            </Box>

            {/* Country flag + name */}
            {countryDisplay && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.1 }}>
                {countryDisplay.flag && (
                  <Typography sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
                    {countryDisplay.flag}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                  <LocationOnIcon sx={{ fontSize: 10, color: T.TEXT_TER }} />
                  <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
                    {pi.city ? `${pi.city}, ` : ''}{countryDisplay.name}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Right: contact icons + expand + menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
            {links.slice(0, 3).map(l => (
              <Tooltip key={l.key} title={l.label}>
                <IconButton size="small" component="a" href={l.href}
                  onClick={e => e.stopPropagation()}
                  target={l.key !== 'phone' && l.key !== 'email' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  sx={{ color: T.TEXT_TER, width: 26, height: 26,
                    '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
                  {l.icon}
                </IconButton>
              </Tooltip>
            ))}

            <IconButton size="small" onClick={e => { e.stopPropagation(); onExpand(customer._id); }}
              sx={{ color: T.TEXT_TER, width: 26, height: 26,
                '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
              {expanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
            </IconButton>

            {/* Quick action menu */}
            <IconButton size="small" onClick={openMenu}
              sx={{ color: T.TEXT_TER, width: 26, height: 26,
                '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG },
                opacity: (hovering || Boolean(menuAnchor)) ? 1 : 0,
                transition: 'opacity 0.15s' }}>
              {(deleting || addingDesk) ? <CircularProgress size={13} sx={{ color: T.TEXT_TER }} /> : <MoreVertIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
        </Box>

        {/* ── Tags row (always visible if present) ── */}
        {tags.length > 0 && (
          <Box sx={{ px: 2.5, pb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {tags.slice(0, 4).map(tag => (
              <Chip key={tag} label={tag} size="small"
                sx={{ height: 16, fontSize: '0.6rem', borderRadius: '3px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  color: T.TEXT_SEC, '& .MuiChip-label': { px: 0.75 } }} />
            ))}
            {tags.length > 4 && (
              <Typography sx={{ fontSize: '0.6rem', color: T.TEXT_TER, alignSelf: 'center' }}>
                +{tags.length - 4}
              </Typography>
            )}
          </Box>
        )}

        {/* ── Expanded detail section ── */}
        <Collapse in={expanded}>
          <Box sx={{
            px: 2.5, pb: 1.5, pt: 1,
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : theme.palette.divider}`,
          }}>
            {/* Phone + email row */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
              {phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CallIcon sx={{ fontSize: 12, color: T.TEXT_TER }} />
                  <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>{phone}</Typography>
                </Box>
              )}
              {email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 12, color: T.TEXT_TER }} />
                  <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>{email}</Typography>
                </Box>
              )}
            </Box>

            {/* Last call + follow-up */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
              {lastCall && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CallIcon sx={{ fontSize: 12, color: T.TEXT_TER }} />
                  <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>Last call: {lastCall}</Typography>
                </Box>
              )}
              {followUp && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: isOverdue ? '#FFB74D' : T.TEXT_TER }} />
                  <Typography sx={{ fontSize: '0.72rem', color: isOverdue ? '#FFB74D' : T.TEXT_SEC }}>
                    {isOverdue ? 'Overdue: ' : 'Follow-up: '}
                    {followUp.toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Channels */}
            {(customer.commChannels || []).length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 0.75 }}>
                {(customer.commChannels || []).map(ch => (
                  <Chip key={ch} label={ch} size="small"
                    sx={{ height: 16, fontSize: '0.6rem', borderRadius: '3px',
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      color: T.TEXT_SEC, '& .MuiChip-label': { px: 0.75 } }} />
                ))}
              </Box>
            )}

            {/* Attracted by + interested products count */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {pi.attractedBy && (
                <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
                  via {pi.attractedBy}
                </Typography>
              )}
              {(customer.interestedProducts || []).length > 0 && (
                <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
                  {customer.interestedProducts.length} product interest{customer.interestedProducts.length !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* ── Quick action Menu ── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        onClick={e => e.stopPropagation()}
        PaperProps={{
          sx: {
            bgcolor: T.MENU_BG,
            border: t => `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : t.palette.divider}`,
            borderRadius: '12px',
            minWidth: 200,
            boxShadow: isDark
              ? '0 8px 24px rgba(0,0,0,0.6)'
              : '0 4px 20px rgba(0,0,0,0.12)',
            '& .MuiMenuItem-root': {
              fontSize: '0.8rem',
              px: 1.5, py: 0.75,
              borderRadius: '6px',
              mx: 0.5,
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
            },
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Can permission="crm:customer:edit">
          <MenuItem onClick={handleMenuEdit}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <EditIcon sx={{ fontSize: 15, color: T.TEXT_SEC }} />
            </ListItemIcon>
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>Edit</Typography>
          </MenuItem>
        </Can>

        {can('crm:communication:create') && (
          <MenuItem onClick={handleMenuCommunication}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <AddCommentIcon sx={{ fontSize: 15, color: T.TEXT_SEC }} />
            </ListItemIcon>
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>New communication</Typography>
          </MenuItem>
        )}

        <MenuItem onClick={handleMenuAddToDesk}>
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DashboardIcon sx={{ fontSize: 15, color: T.TEXT_SEC }} />
          </ListItemIcon>
          <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>Add to My Desk</Typography>
        </MenuItem>

        {(can('mis:invoice:create') || can('mis:preinvoice:create')) && (
          <MenuItem onClick={handleMenuInvoice}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <ReceiptLongIcon sx={{ fontSize: 15, color: T.TEXT_SEC }} />
            </ListItemIcon>
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>Invoices / quotes</Typography>
          </MenuItem>
        )}

        {can('crm:communication:create') && (
          <MenuItem onClick={handleMenuCommunication}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <ImageIcon sx={{ fontSize: 15, color: T.TEXT_SEC }} />
            </ListItemIcon>
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>Send image</Typography>
          </MenuItem>
        )}

        <Can permission="crm:customer:delete">
          <Divider sx={{ my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }} />
          <MenuItem onClick={handleMenuDeleteClick}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <DeleteOutlineIcon sx={{ fontSize: 15, color: '#EA005A' }} />
            </ListItemIcon>
            <Typography sx={{ fontSize: '0.8rem', color: '#EA005A' }}>Delete</Typography>
          </MenuItem>
        </Can>
      </Menu>

      {/* ── Delete confirm dialog ── */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete customer"
        message={`Delete "${name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
};

export default CustomerCard;
