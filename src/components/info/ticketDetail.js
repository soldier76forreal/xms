import { useState, useEffect, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { MediaGrid, MediaGalleryViewer, toMediaItems } from '../digitalMarketing/mediaGallery';
import { fetchTicket } from './feedbackApi';
import { areaLabelKey, statusMeta } from './ticketMeta';
import { StatusChip, TypeBadge, formatStamp } from './ticketParts';

// Module scope — see the note in ticketForm.js about components inside components.
function Block({ title, T, children }) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.TEXT_TER, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Meta({ label, value, T }) {
  if (!value) return null;
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.TEXT_TER }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_PRI, wordBreak: 'break-word' }}>{value}</Typography>
    </Box>
  );
}

export default function TicketDetail({ ticketId, T, showBack, onBack }) {
  const { t, i18n } = useTranslation();
  const language = (i18n.language || 'en').slice(0, 2);
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const apiBase = axiosGlobal.defaultTargetApi;

  const [ticket, setTicket] = useState(null);
  const [state, setState] = useState('loading');     // loading | ready | missing | failed
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [techOpen, setTechOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTicket(null); setState('loading'); setViewerIndex(-1); setTechOpen(false);
    fetchTicket(authCtx, axiosGlobal, ticketId)
      .then((doc) => { if (!cancelled) { setTicket(doc); setState('ready'); } })
      // 404 covers "not yours" too — the server answers both the same way.
      .catch((err) => { if (!cancelled) setState(err && err.response && err.response.status === 404 ? 'missing' : 'failed'); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const voiceNotes = useMemo(() => (ticket ? ticket.attachments.filter((a) => a.isVoice) : []), [ticket]);
  // A phone's HEIC photo is shown through its JPEG copy; the original stays the download.
  const mediaItems = useMemo(() => (ticket
    ? toMediaItems(ticket.attachments.filter((a) => !a.isVoice)
      .map((a) => ({ ...a, diskName: a.previewDiskName || a.diskName })), apiBase)
    : []), [ticket, apiBase]);

  const back = showBack && (
    <IconButton size="small" onClick={onBack} aria-label={t('info.back')} sx={{ color: T.TEXT_SEC, mr: 1, flexShrink: 0 }}>
      <ArrowBackIcon sx={{ fontSize: 19 }} />
    </IconButton>
  );

  if (state === 'loading') {
    return (
      <Box sx={{ p: 3 }}>
        {back}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={22} sx={{ color: T.TEXT_TER }} /></Box>
      </Box>
    );
  }
  if (state !== 'ready') {
    return (
      <Box sx={{ p: 3 }}>
        {back}
        <Typography sx={{ fontSize: '0.88rem', color: T.TEXT_SEC, mt: 2 }}>
          {state === 'missing' ? t('info.ticketMissing') : t('info.loadFailed')}
        </Typography>
      </Box>
    );
  }

  const ctx = ticket.context || {};
  const history = ticket.statusHistory || [];

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Box sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2, sm: 3 } }}>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.25 }}>
          {back}
          <Typography dir="ltr" sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_SEC, fontFamily: 'monospace' }}>{ticket.code}</Typography>
          <TypeBadge type={ticket.type} T={T} t={t} />
          <StatusChip status={ticket.status} T={T} t={t} />
        </Box>

        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: T.TEXT_PRI, lineHeight: 1.3, wordBreak: 'break-word' }}>
          {ticket.title}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mt: 2 }}>
          <Meta T={T} label={t('info.fieldSection')} value={t(areaLabelKey(ticket.area))} />
          <Meta T={T} label={t('info.sentBy')} value={ticket.createdByName} />
          <Meta T={T} label={t('info.sent')} value={formatStamp(ticket.insertDate, language)} />
        </Box>

        <Block T={T} title={t('info.description')}>
          {ticket.description
            ? <Typography sx={{ fontSize: '0.9rem', color: T.TEXT_PRI, lineHeight: 1.65, whiteSpace: 'pre-wrap', unicodeBidi: 'plaintext', wordBreak: 'break-word' }}>
              {ticket.description}
            </Typography>
            : <Typography sx={{ fontSize: '0.84rem', color: T.TEXT_TER }}>{t('info.noDescription')}</Typography>}
        </Block>

        {voiceNotes.length > 0 && (
          <Block T={T} title={t('info.voiceNotes')}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {voiceNotes.map((v, i) => (
                <Box key={v.fileId || v.diskName} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 0.75, borderRadius: '10px',
                  bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
                  <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_SEC, flexShrink: 0, pl: 0.5 }}>{t('info.voiceNoteN', { n: i + 1 })}</Typography>
                  <Box component="audio" controls preload="metadata" src={`${apiBase}/uploads/${v.diskName}`} sx={{ flexGrow: 1, minWidth: 0, height: 34 }} />
                </Box>
              ))}
            </Box>
          </Block>
        )}

        {mediaItems.length > 0 && (
          <Block T={T} title={t('info.attachments')}>
            <MediaGrid items={mediaItems} T={T}
              onOpen={(item) => setViewerIndex(Math.max(0, mediaItems.findIndex((m) => m.id === item.id)))} />
          </Block>
        )}

        <Block T={T} title={t('info.statusHistory')}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {history.map((entry, i) => {
              const meta = statusMeta(entry.status);
              return (
                <Box key={i} sx={{ display: 'flex', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: meta.color, mt: '5px' }} />
                    {i < history.length - 1 && <Box sx={{ width: 2, flexGrow: 1, bgcolor: T.BD, mt: 0.5 }} />}
                  </Box>
                  <Box sx={{ pb: 1.75, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.84rem', color: T.TEXT_PRI }}>
                      {i === 0
                        ? t('info.historySubmitted', { name: entry.byName || '—' })
                        : t('info.historyChanged', { status: t(meta.labelKey), name: entry.byName || '—' })}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>{formatStamp(entry.at, language)}</Typography>
                    {entry.note && (
                      <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC, mt: 0.5, whiteSpace: 'pre-wrap', unicodeBidi: 'plaintext' }}>{entry.note}</Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Block>

        {(ctx.appVersion || ctx.path || ctx.userAgent) && (
          <Box sx={{ mt: 2 }}>
            <Button size="small" onClick={() => setTechOpen((v) => !v)} endIcon={<ExpandMoreIcon sx={{ transform: techOpen ? 'rotate(180deg)' : 'none' }} />}
              sx={{ textTransform: 'none', color: T.TEXT_SEC, fontSize: '0.78rem', px: 0 }}>
              {t('info.details')}
            </Button>
            {techOpen && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mt: 1, p: 1.5, borderRadius: '12px', bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
                <Meta T={T} label={t('info.appVersion')} value={ctx.appVersion ? `v${ctx.appVersion}` : ''} />
                <Meta T={T} label={t('info.serverVersion')} value={ctx.apiVersion ? `v${ctx.apiVersion}` : ''} />
                <Meta T={T} label={t('info.detailPage')} value={ctx.path} />
                <Meta T={T} label={t('info.detailLanguage')} value={ctx.language} />
                <Meta T={T} label={t('info.detailWindow')} value={ctx.viewport} />
                <Meta T={T} label={t('info.detailBrowser')} value={ctx.userAgent} />
              </Box>
            )}
          </Box>
        )}
      </Box>

      <MediaGalleryViewer open={viewerIndex >= 0} items={mediaItems} index={viewerIndex}
        onClose={() => setViewerIndex(-1)} onIndexChange={setViewerIndex} />
    </Box>
  );
}
