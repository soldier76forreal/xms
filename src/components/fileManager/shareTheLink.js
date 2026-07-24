import { useState, useEffect, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import LinkIcon from '@mui/icons-material/Link';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { newLink } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// Clipboard with a fallback: navigator.clipboard only exists on secure origins
// (https / localhost) — on a LAN http:// origin it's undefined, which is why
// the old share flow silently failed. execCommand works everywhere.
const copyText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
};

const EXPIRY_OPTIONS = [
  { minutes: 60,    labelKey: 'files.expiry1Hour'  },
  { minutes: 1440,  labelKey: 'files.expiry1Day'   },
  { minutes: 2880,  labelKey: 'files.expiry2Days'  },
  { minutes: 20160, labelKey: 'files.expiry2Weeks' },
  { minutes: 43200, labelKey: 'files.expiry30Days' },
];

// ── Share-link dialog (Phase 9 redesign — same props as the legacy modal) ─────
// Two stages: configure (expiry / message / show-name) → created (the link is
// DISPLAYED with a copy button — never assumed to have reached the clipboard).
export default function ShareTheLink(props) {
  const { t }       = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark      = theme.palette.mode === 'dark';

  const loading = useSelector((s) => s.newLinkCreationLoading);

  const [timer, setTimer]           = useState(2880);
  const [msg, setMsg]               = useState('');
  const [showMyName, setShowMyName] = useState(true);
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied]         = useState(false);

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    CARD_BD:   isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    HVR_BG:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    CTRL_BG:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    BTN_BG:    isDark ? '#ffffff'                : '#000000',
    BTN_CLR:   isDark ? '#000000'                : '#ffffff',
  };

  useEffect(() => {
    if (props.openShareLink) {
      setCreatedLink(''); setCopied(false); setMsg(''); setTimer(2880); setShowMyName(true);
    }
  }, [props.openShareLink]);

  const handleClose = () => props.setOpenShareLink(false);

  const create = async () => {
    try {
      const link = await dispatch(newLink({
        authCtx, axiosGlobal,
        document: props.filePickerCount.idAndType,
        timer, msg, displayName: showMyName,
      })).unwrap();
      setCreatedLink(link);
      // Best-effort auto-copy — the visible link + button is the real path
      const ok = await copyText(link);
      if (ok) {
        setCopied(true);
        props.setSuccessToast && props.setSuccessToast({ status: true, msg: t('files.linkCopiedToast') });
      }
    } catch (_) { /* snackbar dispatched by the thunk */ }
  };

  const handleCopy = async () => {
    const ok = await copyText(createdLink);
    setCopied(ok);
    if (ok) props.setSuccessToast && props.setSuccessToast({ status: true, msg: t('files.linkCopiedToast') });
  };

  return (
    <Dialog open={props.openShareLink} onClose={handleClose} maxWidth="xs" fullWidth
      sx={{ zIndex: 10000 }}
      PaperProps={{ sx: {
        bgcolor: T.DIALOG_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: '14px', backgroundImage: 'none',
        mx: isXs ? 2 : 'auto',
      }}}>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}` }}>
        <ShareIcon sx={{ fontSize: 17, color: T.TEXT_SEC }} />
        <Typography sx={{ flexGrow: 1, fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {createdLink ? t('files.linkCreated') : t('files.createShareLink')}
        </Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {createdLink ? (
        /* ── Stage 2: link ready ── */
        <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC }}>
            {t('files.anyoneWithLinkCanView', { count: Array.isArray(props.filePickerCount.idAndType) ? props.filePickerCount.idAndType.length : 1 })}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1,
            bgcolor: T.CTRL_BG, border: `1px solid ${T.INPUT_BD}`, borderRadius: '10px' }}>
            <LinkIcon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />
            <Typography noWrap sx={{ fontSize: '0.76rem', color: T.TEXT_PRI, flexGrow: 1, direction: 'ltr' }}>
              {createdLink}
            </Typography>
            <Button size="small" onClick={handleCopy}
              startIcon={copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
              sx={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, textTransform: 'none',
                borderRadius: '7px', px: 1.25,
                bgcolor: copied ? 'transparent' : T.BTN_BG,
                color: copied ? '#81c784' : T.BTN_CLR,
                border: copied ? '1px solid rgba(129,199,132,0.4)' : 'none',
                '&:hover': { bgcolor: copied ? 'transparent' : (isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)') } }}>
              {copied ? t('files.copied') : t('common.copy')}
            </Button>
          </Box>
          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
            {t('files.expiresInFromNow', {
              label: EXPIRY_OPTIONS.find((o) => o.minutes === timer)
                ? t(EXPIRY_OPTIONS.find((o) => o.minutes === timer).labelKey)
                : t('files.minutesFallback', { count: timer }),
            })}
          </Typography>
        </Box>
      ) : (
        /* ── Stage 1: configure ── */
        <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.25 }}>

          <Box>
            <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
              {t('files.linkExpiresAfter')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {EXPIRY_OPTIONS.map((opt) => {
                const sel = timer === opt.minutes;
                return (
                  <Button key={opt.minutes} size="small" onClick={() => setTimer(opt.minutes)}
                    sx={{ minWidth: 0, px: 1.5, py: '4px', borderRadius: '8px', fontSize: '0.74rem',
                      fontWeight: sel ? 700 : 400, textTransform: 'none',
                      color: sel ? T.TEXT_PRI : T.TEXT_TER,
                      bgcolor: sel ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)') : 'transparent',
                      border: `1px solid ${sel ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : T.INPUT_BD}`,
                      '&:hover': { bgcolor: T.HVR_BG, color: T.TEXT_PRI } }}>
                    {t(opt.labelKey)}
                  </Button>
                );
              })}
            </Box>
          </Box>

          <TextField fullWidth size="small" placeholder={t('files.messagePlaceholderOptional')}
            value={msg} onChange={(e) => setMsg(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: T.INPUT_BG, borderRadius: '10px', color: T.TEXT_PRI,
                '& fieldset': { borderColor: T.INPUT_BD },
                '&.Mui-focused fieldset': { borderColor: T.TEXT_PRI, borderWidth: 1.5 },
              },
              '& input::placeholder': { color: T.TEXT_SEC, opacity: 1 },
            }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_PRI }}>{t('files.displayMyName')}</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>{t('files.recipientSeesWhoShared')}</Typography>
            </Box>
            <Switch size="small" checked={showMyName} onChange={() => setShowMyName((v) => !v)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: isDark ? '#fff' : '#000' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' },
              }} />
          </Box>
        </Box>
      )}

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5, gap: 1 }}>
        <Button onClick={handleClose}
          sx={{ color: T.TEXT_SEC, textTransform: 'none', '&:hover': { bgcolor: T.HVR_BG, color: T.TEXT_PRI } }}>
          {createdLink ? t('files.done') : t('common.cancel')}
        </Button>
        {!createdLink && (
          <Button onClick={create} disabled={loading}
            startIcon={loading ? <CircularProgress size={13} color="inherit" /> : <LinkIcon sx={{ fontSize: 15 }} />}
            sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, borderRadius: '8px', px: 3, textTransform: 'none',
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' },
              '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' } }}>
            {loading ? t('files.creatingEllipsis') : t('files.createLink')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
