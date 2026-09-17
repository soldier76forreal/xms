import { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { linkReadyToUpload } from '../../store/store';

// Alternative to ReadyToUploadForm's "create new" flow — picks an EXISTING
// ready-to-upload record (one with no rawContentId yet, i.e. made via the
// standalone "New" button) and attaches it to this raw content batch instead
// of creating a fresh one.
export default function LinkReadyToUploadDialog({ open, onClose, rawContentId, T, isDark }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkingId, setLinkingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/ready-to-upload`,
        params: { unlinked: 'true', limit: 30, ...(search ? { search } : {}) },
      });
      setItems(res.data.data || []);
    } catch (_) { setItems([]); }
    setLoading(false);
  }, [authCtx, axiosGlobal, search]);

  useEffect(() => { if (open) { setSearch(''); setError(''); load(); } }, [open]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!open) return; const tmr = setTimeout(load, 300); return () => clearTimeout(tmr); }, [search]);   // eslint-disable-line react-hooks/exhaustive-deps

  const doLink = async (readyToUploadId) => {
    setLinkingId(readyToUploadId);
    setError('');
    try {
      await dispatch(linkReadyToUpload({ authCtx, axiosGlobal, id: rawContentId, readyToUploadId })).unwrap();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('dm.failedToSubmit'));
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { bgcolor: T.DIALOG_BG, backgroundImage: 'none', borderRadius: '14px' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: T.TEXT_PRI }}>
          {t('dm.linkExistingReadyToUpload')}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField size="small" fullWidth placeholder={t('common.search')} value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: T.INPUT_BG, borderRadius: '10px' } }} />

        {error && <Typography sx={{ fontSize: '0.78rem', color: '#FF4D8D' }}>{error}</Typography>}

        <Box sx={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={20} sx={{ color: T.TEXT_TER }} />
            </Box>
          ) : items.length === 0 ? (
            <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, textAlign: 'center', py: 3 }}>
              {t('dm.noUnlinkedReadyToUpload')}
            </Typography>
          ) : items.map((it) => (
            <Box key={it._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.1,
              borderRadius: '10px', bgcolor: T.CTRL_BG, border: `1px solid ${T.DIVIDER}` }}>
              <InsertDriveFileIcon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 600, color: T.TEXT_PRI }}>
                  {it.title?.trim() || t('dm.previewFileFallback')}
                </Typography>
                <Typography noWrap sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
                  {[it.language, it.platform].filter(Boolean).join(' · ') || '—'}
                </Typography>
              </Box>
              <Button size="small" variant="outlined" startIcon={<LinkIcon sx={{ fontSize: 13 }} />}
                disabled={linkingId === it._id} onClick={() => doLink(it._id)}
                sx={{ fontSize: '0.68rem', textTransform: 'none', borderRadius: '8px', flexShrink: 0 }}>
                {linkingId === it._id ? <CircularProgress size={12} /> : t('dm.linkAction')}
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Dialog>
  );
}
