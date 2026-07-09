import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material';

import CloseIcon          from '@mui/icons-material/Close';
import EditIcon           from '@mui/icons-material/Edit';
import LocationOnIcon     from '@mui/icons-material/LocationOn';
import CallIcon           from '@mui/icons-material/Call';
import EmailIcon          from '@mui/icons-material/Email';
import WhatsAppIcon       from '@mui/icons-material/WhatsApp';
import TelegramIcon       from '@mui/icons-material/Telegram';
import InstagramIcon      from '@mui/icons-material/Instagram';
import ScheduleIcon       from '@mui/icons-material/Schedule';
import NoteAltIcon        from '@mui/icons-material/NoteAlt';
import PersonAddIcon      from '@mui/icons-material/PersonAdd';
import PersonIcon         from '@mui/icons-material/Person';
import FlagIcon           from '@mui/icons-material/Flag';
import SwapHorizIcon      from '@mui/icons-material/SwapHoriz';
import StarIcon           from '@mui/icons-material/Star';
import SendIcon           from '@mui/icons-material/Send';
import ChatIcon           from '@mui/icons-material/Chat';
import DeleteOutlineIcon  from '@mui/icons-material/DeleteOutline';
import MicIcon            from '@mui/icons-material/Mic';
import StopCircleIcon     from '@mui/icons-material/StopCircle';
import AttachFileIcon     from '@mui/icons-material/AttachFile';
import PlayCircleIcon     from '@mui/icons-material/PlayCircle';
import ImageIcon          from '@mui/icons-material/Image';
import Dialog from '@mui/material/Dialog';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { Can, usePermissions } from '../../contextApi/PermissionContext';
import { useDispatch } from 'react-redux';
import { deleteCrmCustomer } from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import RequestsTab from './tabs/requestsTab';

// ── constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  new:        { bg: 'rgba(100,149,237,0.15)', text: 'rgb(100,149,237)' },
  active:     { bg: 'rgba(72,199,142,0.15)',  text: 'rgb(72,199,142)'  },
  follow_up:  { bg: 'rgba(255,183,77,0.15)',  text: 'rgb(255,183,77)'  },
  won:        { bg: 'rgba(72,199,142,0.2)',   text: 'rgb(50,180,120)'  },
  lost:       { bg: 'rgba(255,77,141,0.15)',  text: 'rgb(255,77,141)'  },
};

const CHANNEL_CONFIG = {
  whatsApp:  { icon: <WhatsAppIcon  sx={{ fontSize: 15 }} />, build: h => `https://wa.me/${h}`,          label: 'WhatsApp' },
  phone:     { icon: <CallIcon      sx={{ fontSize: 15 }} />, build: h => `tel:${h}`,                    label: 'Call' },
  email:     { icon: <EmailIcon     sx={{ fontSize: 15 }} />, build: h => `mailto:${h}`,                 label: 'Email' },
  telegram:  { icon: <TelegramIcon  sx={{ fontSize: 15 }} />, build: h => `https://t.me/${h}`,           label: 'Telegram' },
  instagram: { icon: <InstagramIcon sx={{ fontSize: 15 }} />, build: h => `https://instagram.com/${h}`, label: 'Instagram' },
};

const ACTIVITY_CFG = {
  created:        { label: 'Customer created',  Icon: PersonAddIcon,   color: 'rgb(72,199,142)' },
  updated:        { label: 'Record updated',    Icon: EditIcon,        color: 'rgb(100,149,237)' },
  call_logged:    { label: 'Call logged',       Icon: CallIcon,        color: 'rgb(100,149,237)' },
  note:           { label: 'Note added',        Icon: NoteAltIcon,     color: 'rgb(255,183,77)'  },
  assigned:       { label: 'Assigned',          Icon: PersonIcon,      color: 'rgb(149,100,237)' },
  status_changed: { label: 'Status changed',    Icon: FlagIcon,        color: 'rgb(255,100,130)' },
  interest:       { label: 'Products updated',  Icon: StarIcon,        color: 'rgb(100,200,200)' },
  follow_up_set:  { label: 'Follow-up set',     Icon: ScheduleIcon,    color: 'rgb(255,183,77)'  },
};

const TABS = ['Details', 'Communication', 'Requests'];

function relativeDate(d) {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)   return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60)   return `${min}m ago`;
  const hr  = Math.floor(min / 60);
  if (hr  < 24)   return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30)  return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── CustomerDetail (main) ──────────────────────────────────────────────────────

const CustomerDetail = ({ customer, onClose, onEdit, onDeleted, initialTab = 0 }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab,    setActiveTab]    = useState(initialTab);
  const [confirmOpen,  setConfirmOpen]  = useState(false);

  // Re-sync when the caller requests a specific tab (e.g. "New communication"
  // from the card menu opens straight to Communication) — fires whenever the
  // customer changes OR the caller re-requests a tab on the SAME customer
  // (e.g. clicking "Invoices" from the menu while already viewing this customer).
  useEffect(() => { setActiveTab(initialTab); }, [customer._id, initialTab]);
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const { can }     = usePermissions();

  const T = {
    BG:       isDark ? '#0d0d0d' : theme.palette.background.default,
    SURF:     isDark ? '#151515' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    TAB_BG:   isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  if (!customer) return null;

  const pi           = customer.personalInformation || {};
  const isComp       = (pi.personOrCompany || pi.customerType) === 'company';
  const customerName = isComp
    ? (pi.companyName || '—')
    : `${pi.firstName || ''} ${pi.lastName || ''}`.trim() || '—';
  const location     = [pi.city, pi.State, pi.country].filter(Boolean).join(', ');
  const statusCfg    = STATUS_COLORS[customer.status] || STATUS_COLORS.new;

  const handleDeleteClick = () => setConfirmOpen(true);

  const handleDeleteConfirm = async () => {
    await dispatch(deleteCrmCustomer({ authCtx, axiosGlobal, id: customer._id }));
    onDeleted && onDeleted(customer._id);
    onClose();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: T.BG }}>

      {/* ── Header ── */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flexGrow: 1, minWidth: 0, pr: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: T.TEXT_PRI }}>
                {customerName}
              </Typography>
              {customer.status && (
                <Chip label={customer.status.replace('_', ' ')} size="small"
                  sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, borderRadius: '4px',
                    bgcolor: statusCfg.bg, color: statusCfg.text,
                    '& .MuiChip-label': { px: 0.75 } }} />
              )}
            </Box>
            {location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 12, color: T.TEXT_TER }} />
                <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_SEC }}>{location}</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
            {can('crm:customer:edit') && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={onEdit}
                  sx={{ color: T.TEXT_TER, width: 28, height: 28, '&:hover': { color: T.TEXT_PRI } }}>
                  <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
            {can('crm:customer:delete') && (
              <Tooltip title="Delete">
                <IconButton size="small" onClick={handleDeleteClick}
                  sx={{ color: T.TEXT_TER, width: 28, height: 28, '&:hover': { color: '#EA005A' } }}>
                  <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={onClose}
              sx={{ color: T.TEXT_TER, width: 28, height: 28, '&:hover': { color: T.TEXT_PRI } }}>
              <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Tags */}
        {(customer.tags || []).length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
            {(customer.tags || []).map(tag => (
              <Chip key={tag} label={tag} size="small"
                sx={{ height: 17, fontSize: '0.6rem', borderRadius: '4px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                  color: T.TEXT_SEC, '& .MuiChip-label': { px: 0.75 } }} />
            ))}
          </Box>
        )}
      </Box>

      {/* ── Tab bar ── */}
      <Box sx={{ px: 2, pt: 1.25, pb: 0, display: 'flex', gap: 0.5, flexShrink: 0 }}>
        {TABS.map((tab, i) => (
          <Button key={tab} size="small" onClick={() => setActiveTab(i)}
            sx={{ minWidth: 0, px: 1.5, py: '4px', borderRadius: '7px',
              fontSize: '0.75rem', fontWeight: activeTab === i ? 700 : 400,
              textTransform: 'none',
              color: activeTab === i ? T.TEXT_PRI : T.TEXT_TER,
              bgcolor: activeTab === i ? T.TAB_BG : 'transparent',
              '&:hover': { bgcolor: T.TAB_BG, color: T.TEXT_PRI } }}>
            {tab}
          </Button>
        ))}
      </Box>

      <Divider sx={{ borderColor: T.BD, mt: 1 }} />

      {/* ── Tab content ── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {activeTab === 0 && (
          <DetailsTab customer={customer} T={T} isDark={isDark} authCtx={authCtx} axiosGlobal={axiosGlobal} />
        )}
        {activeTab === 1 && (
          <CommunicationTab customerId={customer._id} T={T} isDark={isDark} authCtx={authCtx} axiosGlobal={axiosGlobal} />
        )}
        {activeTab === 2 && (
          <RequestsTab customer={customer} />
        )}
      </Box>

      {/* ── Delete confirm dialog ── */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete customer"
        message={`Delete "${customerName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </Box>
  );
};

// ── Details Tab ───────────────────────────────────────────────────────────────

const DetailsTab = ({ customer, T, isDark, authCtx, axiosGlobal }) => {
  const pi      = customer.personalInformation || {};
  const handles = customer.commHandles || {};
  const { can } = usePermissions();

  const [followUpDate, setFollowUpDate]   = useState('');
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpEditing, setFollowUpEditing] = useState(false);

  const existingFollowUp = customer.nextFollowUpAt
    ? new Date(customer.nextFollowUpAt).toISOString().split('T')[0]
    : '';

  const saveFollowUp = async () => {
    if (!followUpDate) return;
    setSavingFollowUp(true);
    try {
      await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/crm/customers/${customer._id}/follow-up`,
        data: { nextFollowUpAt: followUpDate },
      });
      setFollowUpEditing(false);
    } catch (_) {}
    setSavingFollowUp(false);
  };

  const isOverdue = customer.nextFollowUpAt && new Date(customer.nextFollowUpAt) < new Date();

  return (
    <Box sx={{ px: 2.5, py: 2 }}>

      {/* ── Contact info ── */}
      <SectionLabel label="Contact" T={T} />

      {/* Phone + click-to-contact */}
      {(customer.phoneNumber || customer.contactInfo?.phoneNumbers?.[0]?.number) && (
        <InfoRow label="Phone" T={T}>
          <ContactLink
            href={`tel:${customer.phoneNumber || customer.contactInfo?.phoneNumbers?.[0]?.number}`}
            icon={<CallIcon sx={{ fontSize: 14 }} />}
            text={customer.phoneNumber || customer.contactInfo?.phoneNumbers?.[0]?.number}
            T={T} />
        </InfoRow>
      )}

      {/* commHandles — one row per handle */}
      {(customer.commChannels || []).map(ch => {
        const cfg  = CHANNEL_CONFIG[ch];
        const handle = handles[ch];
        if (!cfg || !handle) return null;
        return (
          <InfoRow key={ch} label={cfg.label} T={T}>
            <ContactLink href={cfg.build(handle)} icon={cfg.icon} text={handle} T={T}
              external={ch !== 'phone' && ch !== 'email'} />
          </InfoRow>
        );
      })}

      {/* Legacy email fallback */}
      {!handles.email && customer.contactInfo?.emails?.[0]?.email && (
        <InfoRow label="Email" T={T}>
          <ContactLink href={`mailto:${customer.contactInfo.emails[0].email}`}
            icon={<EmailIcon sx={{ fontSize: 14 }} />}
            text={customer.contactInfo.emails[0].email} T={T} />
        </InfoRow>
      )}

      {/* ── Identity ── */}
      <SectionLabel label="Identity" T={T} mt={2} />

      {pi.personOrCompany || pi.customerType
        ? <InfoRow label="Type"    T={T}><PlainText text={(pi.personOrCompany || pi.customerType)} T={T} /></InfoRow>
        : null}
      {pi.contactPerson
        ? <InfoRow label="Contact person" T={T}><PlainText text={pi.contactPerson} T={T} /></InfoRow>
        : null}
      {pi.attractedBy
        ? <InfoRow label="Source"  T={T}><PlainText text={pi.attractedBy} T={T} /></InfoRow>
        : null}

      {/* ── Location ── */}
      {(pi.country || pi.city || pi.State || pi.address) && (
        <>
          <SectionLabel label="Location" T={T} mt={2} />
          {pi.country  && <InfoRow label="Country" T={T}><PlainText text={pi.country}  T={T} /></InfoRow>}
          {pi.State    && <InfoRow label="State"   T={T}><PlainText text={pi.State}    T={T} /></InfoRow>}
          {pi.city     && <InfoRow label="City"    T={T}><PlainText text={pi.city}     T={T} /></InfoRow>}
          {pi.address  && <InfoRow label="Address" T={T}><PlainText text={pi.address}  T={T} /></InfoRow>}
          {pi.postalCode && <InfoRow label="ZIP"   T={T}><PlainText text={pi.postalCode} T={T} /></InfoRow>}
        </>
      )}

      {/* ── Activity ── */}
      <SectionLabel label="Activity" T={T} mt={2} />

      {customer.lastCallAt && (
        <InfoRow label="Last call" T={T}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CallIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>
              {new Date(customer.lastCallAt).toLocaleDateString()} ({relativeDate(customer.lastCallAt)})
            </Typography>
          </Box>
        </InfoRow>
      )}

      {/* Follow-up */}
      <InfoRow label="Follow-up" T={T}>
        {followUpEditing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <TextField type="date" size="small" value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              inputProps={{ style: { fontSize: '0.78rem', padding: '3px 8px' } }}
              sx={{ width: 140, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD2 } }} />
            <Button size="small" disabled={!followUpDate || savingFollowUp}
              onClick={saveFollowUp} variant="contained"
              sx={{ minWidth: 0, height: 26, fontSize: '0.72rem', px: 1.5, textTransform: 'none' }}>
              {savingFollowUp ? <CircularProgress size={10} /> : 'Save'}
            </Button>
            <IconButton size="small" onClick={() => setFollowUpEditing(false)}
              sx={{ color: T.TEXT_TER, width: 24, height: 24 }}>
              <CloseIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {customer.nextFollowUpAt ? (
              <Typography sx={{ fontSize: '0.8rem',
                color: isOverdue ? '#FFB74D' : T.TEXT_PRI }}>
                <ScheduleIcon sx={{ fontSize: 13, verticalAlign: 'middle', mr: 0.5,
                  color: isOverdue ? '#FFB74D' : T.TEXT_TER }} />
                {new Date(customer.nextFollowUpAt).toLocaleDateString()}
                {isOverdue && <Chip label="overdue" size="small"
                  sx={{ ml: 0.75, height: 16, fontSize: '0.55rem', bgcolor: 'rgba(255,183,77,0.15)',
                    color: '#FFB74D', '& .MuiChip-label': { px: 0.5 } }} />}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>Not set</Typography>
            )}
            {can('crm:customer:edit') && (
              <IconButton size="small"
                onClick={() => { setFollowUpDate(existingFollowUp); setFollowUpEditing(true); }}
                sx={{ color: T.TEXT_TER, width: 22, height: 22, '&:hover': { color: T.TEXT_PRI } }}>
                <EditIcon sx={{ fontSize: 12 }} />
              </IconButton>
            )}
          </Box>
        )}
      </InfoRow>

      {/* ── Interested products ── */}
      {(customer.interestedProducts || []).length > 0 && (
        <>
          <SectionLabel label="Interested products" T={T} mt={2} />
          {customer.interestedProducts.map((ip, i) => (
            <InfoRow key={i} label={`Product ${i + 1}`} T={T}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }}>
                  {ip.productCode || ip.productId || '—'}
                </Typography>
                {ip.note && (
                  <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
                    {ip.note}
                  </Typography>
                )}
              </Box>
            </InfoRow>
          ))}
        </>
      )}

      {/* ── Meta ── */}
      <SectionLabel label="Meta" T={T} mt={2} />
      {customer.insertDate && (
        <InfoRow label="Created" T={T}>
          <PlainText text={new Date(customer.insertDate).toLocaleDateString()} T={T} />
        </InfoRow>
      )}
      {customer.updateDate && (
        <InfoRow label="Updated" T={T}>
          <PlainText text={`${new Date(customer.updateDate).toLocaleDateString()} (${relativeDate(customer.updateDate)})`} T={T} />
        </InfoRow>
      )}

      <Box sx={{ pb: 2 }} />
    </Box>
  );
};

// ── Communication Tab ─────────────────────────────────────────────────────────

const CommunicationTab = ({ customerId, T, isDark, authCtx, axiosGlobal }) => {
  const { can } = usePermissions();

  const [activities, setActivities] = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [hasMore, setHasMore]       = useState(false);

  const [logType, setLogType]   = useState('call_logged');
  const [logBody, setLogBody]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  // voice recording (native MediaRecorder — no new package) + image/video attach
  const [pendingFiles, setPendingFiles] = useState([]);   // File[] queued for the next submit
  const [recording, setRecording]       = useState(false);
  const [recordError, setRecordError]   = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const [lightbox, setLightbox] = useState(null);   // { kind:'image'|'video', url } for the viewer dialog

  const startRecording = async () => {
    setRecordError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setPendingFiles((prev) => [...prev, file]);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (_) {
      setRecordError('Microphone access denied or unavailable');
    }
  };
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleAttachFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };
  const removePendingFile = (idx) => setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  const load = useCallback(async (pg = 1) => {
    if (!can('crm:communication:view')) return;
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/crm/customers/${customerId}/communication`,
        params: { page: pg, limit: 20 },
      });
      if (pg === 1) {
        setActivities(res.data.data || []);
      } else {
        setActivities(prev => [...prev, ...(res.data.data || [])]);
      }
      setTotal(res.data.total || 0);
      setPage(pg);
    } catch (_) {}
    setLoading(false);
  }, [customerId, authCtx, axiosGlobal, can]);

  useEffect(() => { load(1); }, [customerId, load]);

  useEffect(() => {
    setHasMore(activities.length < total);
  }, [activities, total]);

  const submitLog = async () => {
    if (!logBody.trim() && pendingFiles.length === 0 && logType === 'note') return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', logType);
      formData.append('body', logBody.trim());
      pendingFiles.forEach((f) => formData.append('files', f));
      const res = await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/crm/customers/${customerId}/communication`,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setActivities(prev => [res.data, ...prev]);
      setTotal(t => t + 1);
      setPendingFiles([]);
      setLogBody('');
    } catch (_) {}
    setSubmitting(false);
  };

  if (!can('crm:communication:view')) {
    return (
      <Box sx={{ px: 2.5, py: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
          You don't have permission to view communication history
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2.5, py: 2 }}>

      {/* ── Log form ── */}
      {can('crm:communication:create') && (
        <Box sx={{ mb: 2.5, p: 1.5, borderRadius: '10px',
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${T.BD}` }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            {['call_logged', 'note'].map(t => (
              <Button key={t} size="small" onClick={() => setLogType(t)}
                sx={{ minWidth: 0, px: 1.25, py: '3px', borderRadius: '6px',
                  fontSize: '0.72rem', textTransform: 'none', fontWeight: logType === t ? 700 : 400,
                  color: logType === t ? T.TEXT_PRI : T.TEXT_TER,
                  bgcolor: logType === t ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : 'transparent' }}>
                {t === 'call_logged' ? 'Log call' : 'Add note'}
              </Button>
            ))}
          </Box>
          <TextField multiline minRows={2} fullWidth size="small"
            placeholder={logType === 'call_logged' ? 'Call outcome, topics discussed…' : 'Note…'}
            value={logBody}
            onChange={e => setLogBody(e.target.value)}
            sx={{ mb: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.BD },
              '& textarea': { fontSize: '0.8rem', color: T.TEXT_PRI } }} />

          {recordError && (
            <Typography sx={{ fontSize: '0.7rem', color: '#EA005A', mb: 1 }}>{recordError}</Typography>
          )}

          {pendingFiles.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {pendingFiles.map((f, i) => (
                <Chip key={i} size="small"
                  label={f.name.length > 22 ? f.name.slice(0, 19) + '…' : f.name}
                  onDelete={() => removePendingFile(i)}
                  sx={{ height: 22, fontSize: '0.68rem',
                    bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', color: T.TEXT_SEC }} />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={recording ? 'Stop recording' : 'Record a voice message'}>
              <IconButton size="small" onClick={recording ? stopRecording : startRecording}
                sx={{ color: recording ? '#EA005A' : T.TEXT_TER, width: 28, height: 28 }}>
                {recording ? <StopCircleIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Attach image or video">
              <IconButton size="small" component="label" sx={{ color: T.TEXT_TER, width: 28, height: 28 }}>
                <AttachFileIcon sx={{ fontSize: 17 }} />
                <input type="file" hidden multiple accept="image/*,video/*" onChange={handleAttachFiles} />
              </IconButton>
            </Tooltip>
            {recording && (
              <Typography sx={{ fontSize: '0.7rem', color: '#EA005A', fontWeight: 600 }}>
                Recording…
              </Typography>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" variant="contained" startIcon={<SendIcon sx={{ fontSize: 13 }} />}
              onClick={submitLog} disabled={submitting || (!logBody.trim() && pendingFiles.length === 0)}
              sx={{ fontSize: '0.72rem', height: 28, textTransform: 'none', borderRadius: '7px', px: 1.5 }}>
              {submitting ? <CircularProgress size={12} /> : 'Save'}
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Timeline ── */}
      {loading && activities.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5 }}>
              <Skeleton variant="circular" width={28} height={28} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="40%" height={14} />
                <Skeleton variant="text" width="70%" height={14} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : activities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <ChatIcon sx={{ fontSize: 36, color: T.TEXT_TER, mb: 1 }} />
          <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
            No activity yet
          </Typography>
        </Box>
      ) : (
        <Box sx={{ position: 'relative' }}>
          {/* vertical line */}
          <Box sx={{ position: 'absolute', left: 13, top: 0, bottom: 0, width: 1,
            bgcolor: T.BD, zIndex: 0 }} />

          {activities.map((act, i) => {
            const cfg = ACTIVITY_CFG[act.type] || ACTIVITY_CFG.updated;
            const IconComp = cfg.Icon;
            return (
              <Box key={act._id || i} sx={{ display: 'flex', gap: 1.5, mb: 2, position: 'relative', zIndex: 1 }}>
                {/* Icon dot */}
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  bgcolor: isDark ? '#1a1a1a' : '#fff',
                  border: `1.5px solid ${T.BD}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp sx={{ fontSize: 13, color: cfg.color }} />
                </Box>

                {/* Content */}
                <Box sx={{ flexGrow: 1, minWidth: 0, pt: 0.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: T.TEXT_PRI }}>
                      {cfg.label}
                    </Typography>
                    {act.actorName && (
                      <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
                        by {act.actorName}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, ml: 'auto' }}>
                      {relativeDate(act.date)}
                    </Typography>
                  </Box>

                  {act.body && (
                    <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, mt: 0.25,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {act.body}
                    </Typography>
                  )}

                  {/* Status change: old → new */}
                  {act.type === 'status_changed' && act.oldValue && act.newValue && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                      <Chip label={act.oldValue} size="small"
                        sx={{ height: 16, fontSize: '0.6rem', borderRadius: '3px',
                          bgcolor: 'rgba(255,255,255,0.05)', color: T.TEXT_TER,
                          '& .MuiChip-label': { px: 0.75 } }} />
                      <SwapHorizIcon sx={{ fontSize: 12, color: T.TEXT_TER }} />
                      <Chip label={act.newValue} size="small"
                        sx={{ height: 16, fontSize: '0.6rem', borderRadius: '3px',
                          bgcolor: (STATUS_COLORS[act.newValue] || {}).bg || 'rgba(255,255,255,0.05)',
                          color: (STATUS_COLORS[act.newValue] || {}).text || T.TEXT_SEC,
                          '& .MuiChip-label': { px: 0.75 } }} />
                    </Box>
                  )}

                  {/* Follow-up date */}
                  {act.type === 'follow_up_set' && act.newValue && (
                    <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER, mt: 0.25 }}>
                      {new Date(act.newValue).toLocaleDateString()}
                    </Typography>
                  )}

                  {/* Voice/image/video attachments */}
                  {act.media?.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.75 }}>
                      {act.media.filter(m => m.kind === 'audio').map((m, mi) => (
                        <audio key={mi} controls preload="none" style={{ height: 32, maxWidth: 260 }}
                          src={`${axiosGlobal.defaultTargetApi}/uploads/${m.diskName}`} />
                      ))}
                      {act.media.some(m => m.kind !== 'audio') && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {act.media.filter(m => m.kind !== 'audio').map((m, mi) => {
                            // Video without a thumbnail (ffmpeg extraction failed — non-fatal) falls
                            // back to a placeholder icon, NOT the raw video URL as an <img src>
                            // (browsers can't decode video bytes as an image).
                            const thumbUrl = m.kind === 'image'
                              ? `${axiosGlobal.defaultTargetApi}/uploads/${m.thumbnail || m.diskName}`
                              : (m.thumbnail ? `${axiosGlobal.defaultTargetApi}/uploads/${m.thumbnail}` : null);
                            const fullUrl = `${axiosGlobal.defaultTargetApi}/uploads/${m.diskName}`;
                            return (
                              <Box key={mi} onClick={() => setLightbox({ kind: m.kind, url: fullUrl })}
                                sx={{ width: 72, height: 72, borderRadius: '8px', overflow: 'hidden',
                                  border: `1px solid ${T.BD}`, cursor: 'pointer', position: 'relative',
                                  bgcolor: isDark ? '#111' : '#f2f2f2',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {thumbUrl ? (
                                  <Box component="img" src={thumbUrl} alt={m.name}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <ImageIcon sx={{ fontSize: 26, color: T.TEXT_TER }} />
                                )}
                                {m.kind === 'video' && (
                                  <PlayCircleIcon sx={{ position: 'absolute', top: '50%', left: '50%',
                                    transform: 'translate(-50%,-50%)', fontSize: 26, color: '#fff',
                                    filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.6))' }} />
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}

          {hasMore && (
            <Box sx={{ textAlign: 'center', pt: 1 }}>
              <Button size="small" onClick={() => load(page + 1)} disabled={loading}
                sx={{ fontSize: '0.72rem', color: T.TEXT_TER, textTransform: 'none' }}>
                {loading ? <CircularProgress size={12} sx={{ mr: 0.5 }} /> : null}
                Load more
              </Button>
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ pb: 2 }} />

      {/* Image/video lightbox */}
      <Dialog open={Boolean(lightbox)} onClose={() => setLightbox(null)} maxWidth="md"
        PaperProps={{ sx: { bgcolor: '#000', boxShadow: 'none' } }}>
        {lightbox?.kind === 'image' ? (
          <Box component="img" src={lightbox.url} alt=""
            sx={{ maxWidth: '90vw', maxHeight: '85vh', display: 'block' }} />
        ) : lightbox?.kind === 'video' ? (
          <Box component="video" src={lightbox?.url} controls autoPlay
            sx={{ maxWidth: '90vw', maxHeight: '85vh', display: 'block' }} />
        ) : null}
      </Dialog>
    </Box>
  );
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionLabel({ label, T, mt = 0 }) {
  return (
    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: T.TEXT_TER,
      textTransform: 'uppercase', letterSpacing: '0.09em',
      mt: mt, mb: 0.5 }}>
      {label}
    </Typography>
  );
}

function InfoRow({ label, children, T }) {
  return (
    <Box sx={{ display: 'flex', py: 0.6, borderBottom: `1px solid ${T.BD}`, minHeight: 32,
      alignItems: 'flex-start', gap: 1 }}>
      <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER,
        width: 110, flexShrink: 0, pt: 0.15 }}>
        {label}
      </Typography>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

function PlainText({ text, T }) {
  return (
    <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, wordBreak: 'break-word' }}>
      {text}
    </Typography>
  );
}

function ContactLink({ href, icon, text, T, external }) {
  return (
    <Box component="a" href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={e => e.stopPropagation()}
      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none',
        color: T.TEXT_PRI,
        '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
      <Box sx={{ color: T.TEXT_TER, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.8rem' }}>{text}</Typography>
    </Box>
  );
}

export default CustomerDetail;
