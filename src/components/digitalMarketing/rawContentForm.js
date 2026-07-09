import { useState, useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { createRawContent } from '../../store/store';

const USE_CASES = ['Anything', 'Ad campaign', 'Organic post', 'Product showcase', 'Behind the scenes', 'Announcement'];
const PLATFORMS = ['Anything', 'Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'X'];

let localKeyCounter = 0;
const nextLocalKey = () => `f${Date.now()}_${localKeyCounter++}`;

// Batch-upload Drawer form — pick any number of files, each openable/previewable
// with per-file Delete/Replace, a text description field, and a voice-message
// button (native MediaRecorder — no new package) as an alternative to typing.
export default function RawContentForm({ open, onClose }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    CARD_BG:   isDark ? '#151515'                : 'rgba(0,0,0,0.02)',
    CARD_BD:   isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    INPUT_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    INPUT_BD:  isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    ERR_CLR:   '#FF4D8D',
  };

  const [language, setLanguage] = useState('');
  const [useCase, setUseCase]   = useState('Anything');
  const [platform, setPlatform] = useState('Anything');
  const [pendingFiles, setPendingFiles] = useState([]);   // [{ key, file, description, voiceFile }]
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [recordingKey, setRecordingKey] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const replaceInputRef  = useRef(null);
  const replaceTargetKey = useRef(null);

  const resetForm = () => {
    setLanguage(''); setUseCase('Anything'); setPlatform('Anything');
    setPendingFiles([]); setError('');
  };

  const handleClose = () => {
    if (pendingFiles.length && !window.confirm('Discard this raw content batch?')) return;
    resetForm();
    onClose();
  };

  const addFiles = (fileList) => {
    const newEntries = Array.from(fileList).map((file) => ({
      key: nextLocalKey(), file, description: '', voiceFile: null,
    }));
    setPendingFiles((prev) => [...prev, ...newEntries]);
  };

  const removeFile = (key) => setPendingFiles((prev) => prev.filter((f) => f.key !== key));

  const updateDescription = (key, text) =>
    setPendingFiles((prev) => prev.map((f) => (f.key === key ? { ...f, description: text } : f)));

  const openReplace = (key) => {
    replaceTargetKey.current = key;
    replaceInputRef.current?.click();
  };
  const handleReplaceChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPendingFiles((prev) => prev.map((f) => (f.key === replaceTargetKey.current ? { ...f, file } : f)));
  };

  const openPreview = (file) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank', 'noopener');
  };

  const startVoiceDescription = async (key) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const voiceFile = new File([blob], `voice-desc-${Date.now()}.webm`, { type: 'audio/webm' });
        setPendingFiles((prev) => prev.map((f) => (f.key === key ? { ...f, voiceFile } : f)));
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingKey(key);
    } catch (_) {
      setError('Microphone access denied or unavailable');
    }
  };
  const stopVoiceDescription = () => {
    mediaRecorderRef.current?.stop();
    setRecordingKey(null);
  };

  const handleSave = async () => {
    if (!pendingFiles.length) { setError('Add at least one file'); return; }
    setSaving(true); setError('');
    try {
      const formData = new FormData();
      formData.append('language', language);
      formData.append('useCase', useCase);
      formData.append('platform', platform);

      const descriptions = [];
      const voiceFlags    = [];
      pendingFiles.forEach((f) => {
        formData.append('files', f.file);
        descriptions.push(f.description || '');
        voiceFlags.push(!!f.voiceFile);
      });
      formData.append('descriptions', JSON.stringify(descriptions));
      formData.append('voiceDescriptionFlags', JSON.stringify(voiceFlags));
      pendingFiles.forEach((f) => { if (f.voiceFile) formData.append('voiceDescriptions', f.voiceFile); });

      await dispatch(createRawContent({ authCtx, axiosGlobal, formData })).unwrap();
      resetForm();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to upload');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}
      PaperProps={{ sx: { width: isXs ? '100vw' : 480, bgcolor: T.DIALOG_BG, backgroundImage: 'none' } }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          New raw content batch
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* ── File picker ── */}
        <Box>
          <Button component="label" fullWidth startIcon={<AddPhotoAlternateIcon sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: '10px', border: `1.5px dashed ${T.INPUT_BD}`, py: 1.5,
              color: T.TEXT_SEC, textTransform: 'none', fontSize: '0.8rem',
              '&:hover': { borderColor: T.TEXT_PRI, color: T.TEXT_PRI } }}>
            Select images, videos, voice messages, PDFs, or other files
            <input type="file" hidden multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </Button>
          <input ref={replaceInputRef} type="file" hidden onChange={handleReplaceChosen} />
        </Box>

        {/* ── Per-file list ── */}
        {pendingFiles.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {pendingFiles.map((f) => (
              <Box key={f.key} sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.CARD_BG, border: `1px solid ${T.CARD_BD}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography onClick={() => openPreview(f.file)} noWrap
                    sx={{ fontSize: '0.78rem', color: T.TEXT_PRI, flexGrow: 1, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}>
                    <OpenInNewIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />
                    {f.file.name}
                  </Typography>
                  <Tooltip title="Replace file">
                    <IconButton size="small" onClick={() => openReplace(f.key)} sx={{ color: T.TEXT_TER, width: 26, height: 26 }}>
                      <ChangeCircleIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove file">
                    <IconButton size="small" onClick={() => removeFile(f.key)} sx={{ color: T.ERR_CLR, width: 26, height: 26 }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <TextField size="small" fullWidth placeholder="Description…"
                    value={f.description} onChange={(e) => updateDescription(f.key, e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px', fontSize: '0.78rem' } }} />
                  {f.voiceFile && !((recordingKey === f.key)) ? (
                    <Tooltip title="Voice description recorded">
                      <PlayCircleIcon sx={{ fontSize: 20, color: '#81c784', flexShrink: 0 }}
                        onClick={() => window.open(URL.createObjectURL(f.voiceFile), '_blank')} />
                    </Tooltip>
                  ) : (
                    <Tooltip title={recordingKey === f.key ? 'Stop recording' : 'Record a voice description'}>
                      <IconButton size="small"
                        onClick={() => (recordingKey === f.key ? stopVoiceDescription() : startVoiceDescription(f.key))}
                        sx={{ color: recordingKey === f.key ? T.ERR_CLR : T.TEXT_TER, flexShrink: 0 }}>
                        {recordingKey === f.key ? <StopCircleIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Divider sx={{ borderColor: T.DIVIDER }} />

        {/* ── Batch-level fields ── */}
        <TextField label="Language" size="small" fullWidth value={language}
          onChange={(e) => setLanguage(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        <TextField select label="Suggested use case" size="small" fullWidth value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}>
          {USE_CASES.map((u) => <option key={u} value={u}>{u}</option>)}
        </TextField>

        <TextField select label="Suggested platform" size="small" fullWidth value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }}
          SelectProps={{ native: true }}>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </TextField>

        {error && <Typography sx={{ fontSize: '0.82rem', color: T.ERR_CLR }}>{error}</Typography>}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${T.DIVIDER}` }}>
        <Button onClick={handleClose} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>Cancel</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleSave} disabled={saving} variant="contained"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700 }}>
          {saving ? 'Uploading…' : 'Upload batch'}
        </Button>
      </Box>
    </Drawer>
  );
}
