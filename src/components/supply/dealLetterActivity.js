import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import AttachFileIcon from '@mui/icons-material/AttachFile';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { fetchSupplyDealLetterActivity, postSupplyDealLetterActivity } from '../../store/store';
import { usePermissions } from '../../contextApi/PermissionContext';

const STAGE_LABEL_KEY = {
  purchasing: 'supply.statusPurchasing',
  processing: 'supply.statusProcessing',
  final_product: 'supply.statusFinalProduct',
};

const TYPE_LABEL_KEY = {
  created: 'supply.activityCreated',
  status_changed: 'supply.activityStatusChanged',
  forecast_updated: 'supply.activityForecastUpdated',
  final_updated: 'supply.activityFinalUpdated',
  price_updated: 'supply.activityPriceUpdated',
  received: 'supply.activityReceived',
  note: null,
  deleted: 'supply.activityDeleted',
};

const fmtDateTime = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleString();
};

// Follow-up log for a deal letter — text OR a recorded voice note (or both),
// one entry per submission, newest first. Mirrors CRM's Communication tab
// MediaRecorder pattern (native browser API, no new package).
// readOnly: viewed from a branch this deal letter was merely SHARED with — the
// log is readable, but posting to it is the owning branch's business (the
// server refuses it anyway).
export default function DealLetterActivity({ dealLetterId, stage, readOnly = false }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();
  const canPost = !readOnly && can('supply:dealLetter:followUp:create');

  const activities = useSelector((s) => s.supplyDealLetterActivity);

  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const load = useCallback(async () => {
    if (!dealLetterId) return;
    setLoading(true);
    try {
      await dispatch(fetchSupplyDealLetterActivity({ authCtx, axiosGlobal, dealLetterId })).unwrap();
    } catch (_) { /* ignore */ }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealLetterId]);

  useEffect(() => { load(); }, [load]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setPendingFiles((prev) => [...prev, file]);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (_) { /* mic permission denied or unavailable */ }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const handleAttach = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const submit = async () => {
    if (!body.trim() && pendingFiles.length === 0) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('body', body);
      pendingFiles.forEach((f) => formData.append('files', f));
      await dispatch(postSupplyDealLetterActivity({ authCtx, axiosGlobal, dealLetterId, formData })).unwrap();
      setBody(''); setPendingFiles([]);
    } catch (_) { /* keep the draft on failure */ } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
        color: 'text.disabled', display: 'block', mb: 1.5 }}>
        {t('supply.followUpTitle')}
      </Typography>

      {canPost && (
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 2 }}>
        <TextField size="small" fullWidth multiline maxRows={4} value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('supply.followUpPlaceholder')} />
        <Tooltip title={recording ? t('supply.stopRecording') : t('supply.recordVoice')}>
          <IconButton size="small" onClick={recording ? stopRecording : startRecording}
            sx={{ color: recording ? '#EA005A' : 'text.secondary' }}>
            {recording ? <StopCircleIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('supply.attachFile')}>
          <IconButton size="small" component="label" sx={{ color: 'text.secondary' }}>
            <AttachFileIcon sx={{ fontSize: 18 }} />
            <input type="file" hidden multiple accept="image/*,video/*" onChange={handleAttach} />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('supply.send')}>
          <span>
            <IconButton size="small" onClick={submit} disabled={sending || (!body.trim() && pendingFiles.length === 0)}
              sx={{ color: 'primary.main' }}>
              {sending ? <CircularProgress size={16} /> : <SendIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      )}

      {canPost && pendingFiles.length > 0 && (
        <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mb: 1 }}>
          {t('supply.attachedCount', { count: pendingFiles.length })}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {loading && activities.length === 0 ? (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{t('common.loading')}</Typography>
        ) : activities.length === 0 ? (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{t('supply.noFollowUpsYet')}</Typography>
        ) : (
          activities.map((act) => (
            <Box key={act._id} sx={{ px: 1.5, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700 }}>{act.actorName || '—'}</Typography>
                {act.stage && (
                  <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>· {t(STAGE_LABEL_KEY[act.stage] || act.stage)}</Typography>
                )}
                <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', ml: 'auto' }}>{fmtDateTime(act.date)}</Typography>
              </Box>
              {TYPE_LABEL_KEY[act.type] && (
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontStyle: 'italic' }}>
                  {t(TYPE_LABEL_KEY[act.type])}
                </Typography>
              )}
              {act.body && <Typography sx={{ fontSize: '0.78rem' }}>{act.body}</Typography>}
              {(act.media || []).filter((m) => m.kind === 'audio').map((m, mi) => (
                <audio key={mi} controls preload="none" style={{ height: 32, maxWidth: 260, marginTop: 4 }}
                  src={`${axiosGlobal.defaultTargetApi}/uploads/${m.diskName}`} />
              ))}
              {(act.media || []).filter((m) => m.kind !== 'audio').length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                  {act.media.filter((m) => m.kind !== 'audio').map((m, mi) => (
                    <a key={mi} href={`${axiosGlobal.defaultTargetApi}/uploads/${m.diskName}`} target="_blank" rel="noreferrer">
                      <Box component="img" src={`${axiosGlobal.defaultTargetApi}/uploads/${m.thumbnail || m.diskName}`}
                        sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '6px', border: '1px solid', borderColor: 'divider' }} />
                    </a>
                  ))}
                </Box>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
