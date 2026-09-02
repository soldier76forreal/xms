import { useState, useEffect, useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '@mui/material/useMediaQuery';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import AuthContext from '../authAndConnections/auth';
import { updateRawContent, updateReadyToUpload } from '../../store/store';
import MediaViewer, { resolveMediaKind } from './mediaViewer';
import { enqueueUpload } from '../../tools/uploadCenter/uploadManager';

// Full edit form for ONE file inside either a raw content batch OR a
// ready-to-upload record: rename, replace the actual file, and (raw content
// only) set/replace/remove the spoken voice description. `kind` picks the
// target endpoint via the matching thunk — one dialog, two subjects, no
// duplicated file-edit UI (raw content's own description field + voice notes
// don't apply to ready-to-upload's finished/final files, so that section is
// hidden when kind==='readyToUpload').
export default function DmFileEditDialog({ open, onClose, file, recordId, kind = 'rawContent' }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const isRaw = kind === 'rawContent';

  const T = {
    INPUT_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)',
    ERR_CLR:  '#FF4D8D',
  };

  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [newFile, setNewFile]         = useState(null);   // replacement File
  const [voiceAction, setVoiceAction] = useState('keep'); // 'keep' | 'remove' | 'new'
  const [voiceFile, setVoiceFile]     = useState(null);   // new recording
  const [recording, setRecording]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [viewerMedia, setViewerMedia] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const replaceInputRef  = useRef(null);

  useEffect(() => {
    if (open && file) {
      setName(file.name || '');
      setDescription(file.description || '');
      setNewFile(null);
      setVoiceAction('keep');
      setVoiceFile(null);
      setRecording(false);
    }
  }, [open, file]);

  if (!file) return null;

  const hasExistingVoice = isRaw && Boolean(file.voiceDescriptionDiskName);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setVoiceFile(new File([blob], `voice-desc-${Date.now()}.webm`, { type: 'audio/webm' }));
        setVoiceAction('new');
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (_) { /* mic denied — silently ignore, user can still save the rest */ }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  // Metadata (name/description/voice-removal) is a small JSON PUT, applied
  // immediately — there's no file involved, so no reason to route it through
  // the Upload Center. A replacement file or a new voice recording is handed
  // to the Upload Center instead and finishes in the background; both target
  // this entry by its EXISTING fileId (extra.editFileId / extra.mainFileId),
  // which — unlike the create form — is already known, so there's no
  // sequencing to do: both can enqueue immediately and independently.
  const handleSave = async () => {
    setSaving(true);
    try {
      const metadata = { editFileId: String(file.fileId), editFileName: name };
      if (isRaw) {
        metadata.editFileDescription = description;
        if (voiceAction === 'remove') metadata.editFileRemoveVoice = 'true';
      }

      const thunk = isRaw ? updateRawContent : updateReadyToUpload;
      await dispatch(thunk({ authCtx, axiosGlobal, id: recordId, formData: metadata })).unwrap();

      const sectionLabel = t('nav.digitalMarketing');
      if (newFile) {
        enqueueUpload({
          purpose: isRaw ? 'dmRawContentReplace' : 'dmReadyToUploadReplace',
          targetId: recordId, extra: { editFileId: String(file.fileId) },
          file: newFile, sectionLabel,
        });
      }
      if (isRaw && voiceAction === 'new' && voiceFile) {
        enqueueUpload({
          purpose: 'dmRawContentVoice',
          targetId: recordId, extra: { mainFileId: String(file.fileId) },
          file: voiceFile, sectionLabel,
        });
      }

      onClose();
    } catch (_) { /* snackBar handled in the thunk */ }
    setSaving(false);
  };

  const previewNewFile = () => {
    if (!newFile) return;
    setViewerMedia({ url: URL.createObjectURL(newFile), name: newFile.name, kind: resolveMediaKind(newFile.type || newFile.name) });
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth fullScreen={isXs}>
      <DialogTitle sx={{ px: 3, py: 2.25, fontWeight: 700, fontSize: '0.95rem',
        display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="span" sx={{ flexGrow: 1 }}>{t('dm.editFile')}</Box>
        <IconButton size="small" onClick={onClose} disabled={saving} aria-label={t('common.close')} sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: '4px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label={t('dm.fileNameLabel')} size="small" fullWidth value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px' } }} />

        {isRaw && (
          <TextField label={t('users.descriptionLabel')} size="small" fullWidth multiline minRows={2} value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '8px' } }} />
        )}

        {/* Replace the actual file */}
        <Box>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.TEXT_TER, mb: 0.75 }}>
            {t('dm.fileSectionLabel')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button component="label" size="small" variant="outlined"
              startIcon={<ChangeCircleIcon sx={{ fontSize: 16 }} />}
              sx={{ textTransform: 'none', borderRadius: '8px' }}>
              {newFile ? t('dm.chosen') : t('dm.replaceFile')}
              <input ref={replaceInputRef} type="file" hidden
                onChange={(e) => { setNewFile(e.target.files?.[0] || null); e.target.value = ''; }} />
            </Button>
            <Typography onClick={newFile ? previewNewFile : undefined} noWrap
              sx={{ fontSize: '0.76rem', color: newFile ? T.TEXT_SEC : T.TEXT_TER,
                cursor: newFile ? 'pointer' : 'default', flexGrow: 1,
                '&:hover': newFile ? { textDecoration: 'underline' } : {} }}>
              {newFile ? newFile.name : t('dm.keepingCurrentFile')}
            </Typography>
          </Box>
        </Box>

        {/* Voice description — raw content only */}
        {isRaw && (
          <Box>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.TEXT_TER, mb: 0.75 }}>
              {t('dm.voiceDescriptionLabel')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {voiceAction === 'keep' && hasExistingVoice && (
                <Tooltip title={t('dm.playCurrent')}>
                  <IconButton size="small" sx={{ color: '#81c784' }}
                    onClick={() => setViewerMedia({
                      url: `${axiosGlobal.defaultTargetApi}/uploads/${file.voiceDescriptionDiskName}`,
                      name: t('dm.voiceDescriptionFallback'), kind: 'audio' })}>
                    <PlayCircleIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
              {voiceAction === 'new' && voiceFile && (
                <Tooltip title={t('dm.playNewRecording')}>
                  <PlayCircleIcon sx={{ fontSize: 20, color: '#81c784', cursor: 'pointer' }}
                    onClick={() => setViewerMedia({ url: URL.createObjectURL(voiceFile), name: t('dm.newVoice'), kind: 'audio' })} />
                </Tooltip>
              )}

              <Button size="small" variant="outlined"
                onClick={recording ? stopRecording : startRecording}
                startIcon={recording ? <StopCircleIcon sx={{ fontSize: 16 }} /> : <MicIcon sx={{ fontSize: 16 }} />}
                sx={{ textTransform: 'none', borderRadius: '8px', color: recording ? T.ERR_CLR : undefined,
                  borderColor: recording ? T.ERR_CLR : undefined }}>
                {recording ? t('dm.stop') : (hasExistingVoice || voiceFile ? t('dm.reRecord') : t('dm.record'))}
              </Button>

              {(hasExistingVoice || voiceFile) && voiceAction !== 'remove' && (
                <Tooltip title={t('dm.removeVoiceDescription')}>
                  <IconButton size="small" sx={{ color: T.ERR_CLR }}
                    onClick={() => { setVoiceAction('remove'); setVoiceFile(null); }}>
                    <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              )}
              {voiceAction === 'remove' && (
                <Typography sx={{ fontSize: '0.74rem', color: T.ERR_CLR }}>{t('dm.willBeRemoved')}</Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.25 }}>
        <Button onClick={onClose} size="small" disabled={saving} sx={{ color: T.TEXT_SEC, textTransform: 'none' }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} size="small" variant="contained" disabled={saving || recording}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
          {saving ? t('users.saving') : t('common.save')}
        </Button>
      </DialogActions>

      <MediaViewer open={Boolean(viewerMedia)} onClose={() => setViewerMedia(null)} media={viewerMedia} />
    </Dialog>
  );
}
