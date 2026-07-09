import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchRawContentChat, sendRawContentChatMessage, actions } from '../../store/store';

const fmtTime = (d) => {
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

// Real-time chat on a raw content record — text, voice, or file messages,
// Telegram-style. One Socket.io room per rawContentId; the frontend joins on
// mount and leaves on unmount (dm:joinRawContent / dm:leaveRawContent).
export default function RawContentChat({ rawContentId, T, isDark }) {
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const messages = useSelector(s => s.dmRawContentChat);
  const total    = useSelector(s => s.dmRawContentChatTotal);
  const myId     = String(authCtx.decode?.id || authCtx.decode?._id || '');

  const [loading, setLoading]   = useState(true);
  const [body, setBody]         = useState('');
  const [sending, setSending]   = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const scrollRef         = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    await dispatch(fetchRawContentChat({ authCtx, axiosGlobal, id: rawContentId, params: { page: 1, limit: 50 } }));
    setLoading(false);
  }, [rawContentId, authCtx, axiosGlobal, dispatch]);

  useEffect(() => { load(); }, [load]);

  // Join/leave the room + listen for real-time deliveries
  useEffect(() => {
    const socket = authCtx.socket;
    if (!socket || !rawContentId) return;
    socket.emit('dm:joinRawContent', rawContentId);
    const handler = (msg) => {
      if (String(msg.rawContentId) === String(rawContentId)) {
        dispatch(actions.dmRawChatPush(msg));
      }
    };
    socket.on('dm:chat:new', handler);
    return () => {
      socket.emit('dm:leaveRawContent', rawContentId);
      socket.off('dm:chat:new', handler);
    };
  }, [authCtx.socket, rawContentId, dispatch]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async (payload) => {
    setSending(true);
    try {
      await dispatch(sendRawContentChatMessage({ authCtx, axiosGlobal, id: rawContentId, formData: payload })).unwrap();
      setBody('');
    } catch (_) { /* snackbar already dispatched */ }
    setSending(false);
  };

  const handleSendText = () => {
    if (!body.trim()) return;
    const fd = new FormData();
    fd.append('body', body.trim());
    sendMessage(fd);
  };

  const handleAttach = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    sendMessage(fd);
  };

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
        const fd = new FormData();
        fd.append('file', file);
        sendMessage(fd);
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

  const openFile = (diskName) => diskName && window.open(`${axiosGlobal.defaultTargetApi}/uploads/${diskName}`, '_blank');

  return (
    <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${T.BD}` }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
        color: T.TEXT_TER, mb: 1 }}>
        Chat with creator {total > 0 ? `· ${total}` : ''}
      </Typography>

      <Box ref={scrollRef} sx={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={18} sx={{ color: T.TEXT_TER }} />
          </Box>
        ) : messages.length === 0 ? (
          <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_TER, textAlign: 'center', py: 2 }}>
            No messages yet
          </Typography>
        ) : messages.map((m) => {
          const mine = String(m.senderId) === myId;
          return (
            <Box key={m._id} sx={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <Box sx={{ maxWidth: '78%', px: 1.25, py: 0.75, borderRadius: '12px',
                bgcolor: mine ? (isDark ? '#ffffff' : '#000000') : T.CTRL_BG,
                color: mine ? (isDark ? '#000000' : '#ffffff') : T.TEXT_PRI }}>
                {!mine && (
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.7, mb: 0.2 }}>
                    {m.senderName}
                  </Typography>
                )}
                {m.type === 'text' && (
                  <Typography sx={{ fontSize: '0.8rem' }}>{m.body}</Typography>
                )}
                {m.type === 'voice' && (
                  <audio controls src={`${axiosGlobal.defaultTargetApi}/uploads/${m.fileDiskName}`} style={{ height: 32, maxWidth: 200 }} />
                )}
                {m.type === 'file' && (
                  <Typography onClick={() => openFile(m.fileDiskName)}
                    sx={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' } }}>
                    <InsertDriveFileIcon sx={{ fontSize: 14 }} /> {m.fileName}
                  </Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: '0.62rem', color: T.TEXT_TER, mt: 0.25 }}>{fmtTime(m.date)}</Typography>
            </Box>
          );
        })}
      </Box>

      {can('digitalMarketing:rawContent:chat') && (
        <Box>
          {recordError && <Typography sx={{ fontSize: '0.7rem', color: '#EA005A', mb: 0.5 }}>{recordError}</Typography>}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={recording ? 'Stop recording' : 'Record a voice message'}>
              <IconButton size="small" onClick={recording ? stopRecording : startRecording}
                sx={{ color: recording ? '#EA005A' : T.TEXT_TER }}>
                {recording ? <StopCircleIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Attach a file">
              <IconButton size="small" component="label" sx={{ color: T.TEXT_TER }}>
                <AttachFileIcon sx={{ fontSize: 17 }} />
                <input type="file" hidden onChange={handleAttach} />
              </IconButton>
            </Tooltip>
            <TextField size="small" fullWidth placeholder="Message…" value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendText(); }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.CTRL_BG, borderRadius: '10px', fontSize: '0.8rem' } }} />
            <Button size="small" variant="contained" onClick={handleSendText}
              disabled={sending || !body.trim()}
              sx={{ minWidth: 0, borderRadius: '8px', px: 1.5 }}>
              {sending ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 15 }} />}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
