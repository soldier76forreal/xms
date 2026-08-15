import { useState, useEffect, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { actions } from '../../store/store';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

// ── Move / Copy destination picker (Phase 9 redesign) ─────────────────────────
// Same props + browsing mechanics as the legacy modal (also used by gallery.js
// — the contract must not change): the picker navigates the
// REAL URL (history.push) and dispatches openFilePickerFolder, which re-derives
// currentDisplayFilePicker from window.location.pathname; the URL is restored
// on close via lastUrl. Only the presentation is new.
export default function FilePickerModal(props) {
  const { t }       = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const location    = useLocation();
  const history     = useHistory();
  const theme       = useTheme();
  const isXs        = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark      = theme.palette.mode === 'dark';

  const currentDisplaySelect = useSelector((s) => s.currentDisplayFilePicker);
  const routeLinkSelect      = useSelector((s) => s.routeLinkFilePicker);
  const selectedItemsSelect  = useSelector((s) => s.selectedItems);

  const [loading, setLoading] = useState(false);
  const [lastUrl, setLastUrl] = useState('/files');

  const T = {
    DIALOG_BG: isDark ? '#0d0d0d'                : theme.palette.background.paper,
    CARD_BD:   isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    TEXT_PRI:  isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC:  isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    DIVIDER:   isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    HVR_BG:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    CTRL_BG:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    BTN_BG:    isDark ? '#ffffff'                : '#000000',
    BTN_CLR:   isDark ? '#000000'                : '#ffffff',
  };

  const getLastPart = (url) => url.split('/').at(-1);
  const count  = props.filePickerCount.count === 'single' ? 1 : selectedItemsSelect.length;
  const isCopy = props.copyMoveType === 'copy';

  useEffect(() => {
    if (props.openFilePicker === true) setLastUrl(location.pathname);
  }, [props.openFilePicker]);   // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    props.setOpenFilePicker(false);
    history.push(lastUrl);
  };

  const submit = async () => {
    setLoading(true);
    const temp = props.filePickerCount.count === 'single'
      ? [{ id: props.filePickerCount.idAndType.id, type: props.filePickerCount.idAndType.type, supFolder: currentDisplaySelect.id }]
      : selectedItemsSelect.map((e) => ({ id: e.id, type: e.type, supFolder: currentDisplaySelect.id }));
    try {
      await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/files/${props.copyMoveType === 'copy' ? 'folderCopy' : 'folderMove'}`,
        data: { dataArr: temp },
      });
      dispatch(actions.refresh());
      dispatch(actions.unselectAll());
      const dest = currentDisplaySelect.name === 'XFILE' ? t('files.homeBreadcrumb') : currentDisplaySelect.name;
      dispatch(actions.setShowSnackBar({ status: true, msg: isCopy ? t('files.copiedToDestination', { dest }) : t('files.movedToDestination', { dest }), type: 'success' }));
      setLoading(false);
      handleClose();
    } catch (err) {
      setLoading(false);
      const msg = err?.response?.data?.message
        || (typeof err?.response?.data === 'string' ? '' : '')
        || (isCopy ? t('files.failedToCopy') : t('files.failedToMove'));
      dispatch(actions.setShowSnackBar({ status: true, msg, type: 'error' }));
    }
  };

  const folders = (currentDisplaySelect?.docs || []).filter((e) => e.doc !== undefined);

  return (
    <Dialog open={props.openFilePicker} onClose={handleClose} fullScreen={isXs} maxWidth="sm" fullWidth
      PaperProps={{ sx: {
        bgcolor: T.DIALOG_BG, border: `1px solid ${T.CARD_BD}`,
        borderRadius: isXs ? 0 : '14px', backgroundImage: 'none',
        height: isXs ? '100%' : '70vh', display: 'flex', flexDirection: 'column',
      }}}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2, borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        {props.copyMoveType === 'copy'
          ? <ContentCopyIcon sx={{ fontSize: 17, color: T.TEXT_SEC }} />
          : <DriveFileMoveIcon sx={{ fontSize: 18, color: T.TEXT_SEC }} />}
        <Typography sx={{ flexGrow: 1, fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
          {isCopy ? t('files.copyItemsToHeader', { count }) : t('files.moveItemsToHeader', { count })}
        </Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Breadcrumb */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 3, py: 1.25, flexWrap: 'wrap',
        borderBottom: `1px solid ${T.DIVIDER}`, flexShrink: 0 }}>
        <Typography onClick={() => history.push('/files')}
          sx={{ fontSize: '0.75rem', fontWeight: 600, color: T.TEXT_SEC, cursor: 'pointer',
            '&:hover': { color: T.TEXT_PRI } }}>
          {t('files.homeBreadcrumb')}
        </Typography>
        {routeLinkSelect.map((p) => (
          <Box key={p} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ChevronRightIcon sx={{ fontSize: 13, color: T.TEXT_TER }} />
            <Typography onClick={() => history.push(`/files${p}`)} noWrap
              sx={{ fontSize: '0.75rem', color: T.TEXT_SEC, cursor: 'pointer', maxWidth: 130,
                '&:hover': { color: T.TEXT_PRI } }}>
              {getLastPart(p)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Folder list */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
        {props.openFilePicker && folders.length === 0 && (
          <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER, textAlign: 'center', py: 5 }}>
            {t('files.noSubfoldersHint')}
          </Typography>
        )}
        {props.openFilePicker && folders.map((e, i) => (
          <Box key={e.doc._id}
            onClick={() => {
              history.push(location.pathname === '/' ? `/files/${decodeURI(e.doc.name)}` : `${location.pathname}/${decodeURI(e.doc.name)}`);
              dispatch(actions.openFilePickerFolder({ id: e.doc._id, name: e.doc.name, index: i }));
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1, borderRadius: '10px',
              cursor: 'pointer', '&:hover': { bgcolor: T.HVR_BG } }}>
            <FolderIcon sx={{ fontSize: 20, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }} />
            <Typography noWrap sx={{ fontSize: '0.85rem', color: T.TEXT_PRI, flexGrow: 1 }}>
              {e.doc.name}
            </Typography>
            <ChevronRightIcon sx={{ fontSize: 17, color: T.TEXT_TER }} />
          </Box>
        ))}
      </Box>

      {/* Destination + actions */}
      <Box sx={{ px: 3, py: 1.25, borderTop: `1px solid ${T.DIVIDER}`, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
          {t('files.destinationLabel')}
        </Typography>
        <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
          {currentDisplaySelect?.name === 'XFILE' ? t('files.homeBreadcrumb') : currentDisplaySelect?.name}
        </Typography>
        <Button size="small" startIcon={<CreateNewFolderIcon sx={{ fontSize: 15 }} />}
          onClick={() => { props.setNewFileModal(true); props.setNewFolderType('inFilePicker'); }}
          sx={{ fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_SEC,
            '&:hover': { color: T.TEXT_PRI, bgcolor: T.HVR_BG } }}>
          {t('common.newFolder')}
        </Button>
      </Box>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1, flexShrink: 0 }}>
        <Button onClick={handleClose}
          sx={{ color: T.TEXT_SEC, textTransform: 'none', '&:hover': { bgcolor: T.HVR_BG, color: T.TEXT_PRI } }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={submit} disabled={loading}
          startIcon={loading ? <CircularProgress size={13} color="inherit" /> : null}
          sx={{ bgcolor: T.BTN_BG, color: T.BTN_CLR, fontWeight: 700, borderRadius: '8px', px: 3, textTransform: 'none',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' },
            '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' } }}>
          {loading ? (isCopy ? t('files.copyingEllipsis') : t('files.movingEllipsis')) : (isCopy ? t('files.copyHere') : t('files.moveHere'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
