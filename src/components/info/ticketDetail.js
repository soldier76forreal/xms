import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestoreFromTrashOutlinedIcon from '@mui/icons-material/RestoreFromTrashOutlined';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { actions } from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import { MediaGrid, MediaGalleryViewer, toMediaItems } from '../digitalMarketing/mediaGallery';
import {
  fetchTicket, deleteTicket, fetchAdminTicket, setAdminStatus, deleteAdminTicket, restoreAdminTicket,
} from './feedbackApi';
import { areaLabelKey, statusMeta, isEditable, TICKET_STATUSES } from './ticketMeta';
import { StatusChip, TypeBadge, formatStamp } from './ticketParts';
import TicketForm from './ticketForm';

const DANGER = '#EA005A';

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

// What a developer does with a report: move it along (with a note the reporter
// reads on their own copy), delete it, or bring a deleted one back.
function DeveloperPanel({ ticket, T, t, language, busy, onStatus, onDelete, onRestore }) {
  const [status, setStatus] = useState(ticket.status);
  const [note, setNote] = useState('');
  // A saved change adds a history entry: start the next one from a clean slate.
  const historyLength = (ticket.statusHistory || []).length;
  useEffect(() => { setStatus(ticket.status); setNote(''); }, [ticket._id, ticket.status, historyLength]);

  const panelSx = { mt: 2.5, p: 1.75, borderRadius: '12px', bgcolor: T.CTRL_BG, border: `1px solid ${T.BD2}` };
  const heading = (
    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.TEXT_SEC, mb: 1.25 }}>
      {t('info.devPanelTitle')}
    </Typography>
  );

  if (ticket.deleteDate) {
    return (
      <Box sx={panelSx}>
        {heading}
        <Typography sx={{ fontSize: '0.84rem', color: T.TEXT_PRI, mb: 1.25 }}>
          {t('info.devDeletedBanner', { name: ticket.deletedByName || '—', date: formatStamp(ticket.deleteDate, language) })}
        </Typography>
        <Button onClick={onRestore} disabled={busy} startIcon={<RestoreFromTrashOutlinedIcon sx={{ fontSize: 17 }} />}
          variant="outlined" size="small" sx={{ textTransform: 'none', borderRadius: '9px' }}>
          {t('info.devRestore')}
        </Button>
      </Box>
    );
  }

  const canUpdate = !busy && (status !== ticket.status || note.trim().length > 0);
  return (
    <Box sx={panelSx}>
      {heading}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField select label={t('info.devStatusLabel')} size="small" fullWidth value={status}
          onChange={(e) => setStatus(e.target.value)}
          SelectProps={{ native: true }} InputLabelProps={{ shrink: true }}>
          {TICKET_STATUSES.map((s) => <option key={s.value} value={s.value}>{t(s.labelKey)}</option>)}
        </TextField>
        <TextField label={t('info.devNoteLabel')} size="small" fullWidth multiline minRows={2} maxRows={8}
          value={note} onChange={(e) => setNote(e.target.value)}
          inputProps={{ maxLength: 1000 }} helperText={t('info.devNoteHint')} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => onStatus(status, note.trim())} disabled={!canUpdate} variant="contained" size="small"
            sx={{ textTransform: 'none', borderRadius: '9px', fontWeight: 700 }}>
            {busy ? t('info.saving') : t('info.devUpdate')}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onDelete} disabled={busy} startIcon={<DeleteOutlineIcon sx={{ fontSize: 17 }} />}
            size="small" sx={{ textTransform: 'none', borderRadius: '9px', color: DANGER }}>
            {t('info.delete')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// mode 'own'   — a person reading a report their data scope lets them see; the
//                owner gets Edit (while Open) and Delete.
// mode 'admin' — the developers' dashboard: any report, deleted ones included,
//                with the developer panel.
export default function TicketDetail({ ticketId, T, showBack, onBack, mode = 'own', canEdit = false, canDelete = false, onChanged, onDeleted }) {
  const { t, i18n } = useTranslation();
  const language = (i18n.language || 'en').slice(0, 2);
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const apiBase = axiosGlobal.defaultTargetApi;
  const admin = mode === 'admin';
  const myId = String(authCtx.decode?.id || authCtx.decode?._id || '');

  const [ticket, setTicket] = useState(null);
  const [state, setState] = useState('loading');     // loading | ready | missing | failed
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [techOpen, setTechOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const toast = useCallback((msg, type = 'success') => dispatch(actions.setShowSnackBar({ status: true, msg, type })), [dispatch]);
  const failMessage = (err) => (err && err.response && err.response.data && err.response.data.message) || t('info.actionFailed');

  const reload = useCallback(async () => {
    try {
      const doc = await (admin ? fetchAdminTicket : fetchTicket)(authCtx, axiosGlobal, ticketId);
      setTicket(doc); setState('ready');
    } catch (err) {
      // 404 covers "not yours" too — the server answers both the same way.
      setState(err && err.response && err.response.status === 404 ? 'missing' : 'failed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, admin]);

  useEffect(() => {
    setTicket(null); setState('loading'); setViewerIndex(-1); setTechOpen(false); setFormOpen(false);
    reload();
  }, [reload]);

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
  const isOwner = !admin && String(ticket.owner) === myId;
  const showEdit = isOwner && canEdit && isEditable(ticket.status);
  const showLocked = isOwner && canEdit && !isEditable(ticket.status);
  const showDelete = isOwner && canDelete;

  // ── what the owner does ──────────────────────────────────────────────────
  const afterEdit = () => { reload(); if (onChanged) onChanged(); };
  const handleDelete = async () => {
    setConfirmDelete(false); setBusy(true);
    try {
      if (admin) await deleteAdminTicket(authCtx, axiosGlobal, ticket._id);
      else await deleteTicket(authCtx, axiosGlobal, ticket._id);
      toast(t('info.deletedToast', { code: ticket.code }));
      if (admin) { reload(); if (onChanged) onChanged(); } else if (onDeleted) onDeleted(ticket._id);
    } catch (err) {
      toast(failMessage(err), 'error');
    } finally { setBusy(false); }
  };

  // ── what a developer does ────────────────────────────────────────────────
  const handleStatus = async (status, note) => {
    setBusy(true);
    try {
      const updated = await setAdminStatus(authCtx, axiosGlobal, ticket._id, { status, note });
      setTicket((prev) => ({ ...prev, ...updated }));
      toast(t('info.devUpdated', { code: ticket.code }));
      if (onChanged) onChanged();
    } catch (err) {
      toast(failMessage(err), 'error');
    } finally { setBusy(false); }
  };
  const handleRestore = async () => {
    setBusy(true);
    try {
      await restoreAdminTicket(authCtx, axiosGlobal, ticket._id);
      toast(t('info.devRestored', { code: ticket.code }));
      await reload();
      if (onChanged) onChanged();
    } catch (err) {
      toast(failMessage(err), 'error');
    } finally { setBusy(false); }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Box sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2, sm: 3 } }}>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.25 }}>
          {back}
          <Typography dir="ltr" sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_SEC, fontFamily: 'monospace' }}>{ticket.code}</Typography>
          <TypeBadge type={ticket.type} T={T} t={t} />
          <StatusChip status={ticket.status} T={T} t={t} />
          {ticket.deleteDate && (
            <Box sx={{ px: 1, py: '2px', borderRadius: '999px', border: `1px solid ${DANGER}66`, bgcolor: `${DANGER}1A` }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.TEXT_PRI }}>{t('info.filterDeleted')}</Typography>
            </Box>
          )}
        </Box>

        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: T.TEXT_PRI, lineHeight: 1.3, wordBreak: 'break-word' }}>
          {ticket.title}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mt: 2 }}>
          <Meta T={T} label={t('info.fieldSection')} value={t(areaLabelKey(ticket.area))} />
          <Meta T={T} label={t('info.sentBy')} value={ticket.createdByName} />
          <Meta T={T} label={t('info.sent')} value={formatStamp(ticket.insertDate, language)} />
          <Meta T={T} label={t('info.edited')} value={ticket.editedAt ? formatStamp(ticket.editedAt, language) : ''} />
        </Box>

        {(showEdit || showLocked || showDelete) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            {showEdit && (
              <Button onClick={() => setFormOpen(true)} disabled={busy} startIcon={<EditOutlinedIcon sx={{ fontSize: 17 }} />}
                variant="outlined" size="small" sx={{ textTransform: 'none', borderRadius: '9px' }}>
                {t('info.edit')}
              </Button>
            )}
            {showDelete && (
              <Button onClick={() => setConfirmDelete(true)} disabled={busy} startIcon={<DeleteOutlineIcon sx={{ fontSize: 17 }} />}
                size="small" sx={{ textTransform: 'none', borderRadius: '9px', color: DANGER }}>
                {t('info.delete')}
              </Button>
            )}
            {showLocked && (
              <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_TER }}>{t('info.lockedNote')}</Typography>
            )}
          </Box>
        )}

        {admin && (
          <DeveloperPanel ticket={ticket} T={T} t={t} language={language} busy={busy}
            onStatus={handleStatus} onDelete={() => setConfirmDelete(true)} onRestore={handleRestore} />
        )}

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
              // The same status twice in a row is a reply, not a move.
              const replyOnly = i > 0 && history[i - 1].status === entry.status;
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
                        : replyOnly
                          ? t('info.historyReplied', { name: entry.byName || '—' })
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

      {/* Kept mounted while open even if the report just got locked: the form is
          showing why, and closing it would throw away what the person typed. */}
      {(showEdit || formOpen) && (
        <TicketForm open={formOpen} ticket={ticket} onClose={() => setFormOpen(false)}
          onSaved={afterEdit} onLocked={afterEdit} />
      )}

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
        title={t('info.deleteTitle')} message={admin ? t('info.devDeleteMessage', { code: ticket.code }) : t('info.deleteMessage', { code: ticket.code })}
        confirmLabel={t('info.delete')} cancelLabel={t('common.cancel')} destructive />
    </Box>
  );
}
