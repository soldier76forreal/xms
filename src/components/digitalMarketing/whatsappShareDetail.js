import { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchWhatsappShare, deleteWhatsappShare, actions } from '../../store/store';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
import UserAvatar from '../main/userAvatar';
import { countryFlag, formatQty } from '../inventory/util/whatsappTemplate';

export default function WhatsappShareDetail({ id, onClose, onDeleted }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const doc = useSelector((s) => s.dmSelectedWhatsappShare);
  const errorStatus = useSelector((s) => s.dmSelectedWhatsappShareErrorStatus);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    CARD_BG:  isDark ? '#151515' : 'rgba(0,0,0,0.02)',
  };

  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    await dispatch(fetchWhatsappShare({ authCtx, axiosGlobal, id }));
    setLoading(false);
  }, [id, authCtx, axiosGlobal, dispatch]);

  useEffect(() => { load(); }, [load]);

  if (errorStatus === 403 || errorStatus === 404) {
    return <RestrictedAccessScreen />;
  }

  if (loading || !doc || String(doc._id) !== String(id)) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: '10px' }} />
      </Box>
    );
  }

  const name = doc.nameLanguage === 'ar' ? (doc.productNameAr || doc.productName) : doc.productName;

  const handleDelete = async () => {
    await dispatch(deleteWhatsappShare({ authCtx, axiosGlobal, id: doc._id }));
    setConfirmDelete(false);
    onDeleted();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(doc.text);
      dispatch(actions.setShowSnackBar({ status: true, msg: t('inventory.shareCopyTextSuccess'), type: 'success' }));
    } catch (_) { /* clipboard denied, no-op */ }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 3, py: 2, borderBottom: `1px solid ${T.BD}` }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
          {name || doc.variantCode}
        </Typography>
        {can('inventory:share:whatsapp') && (
          <Tooltip title={t('common.delete')}>
            <IconButton size="small" onClick={() => setConfirmDelete(true)} sx={{ color: '#FF4D8D' }}>
              <DeleteOutlineIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}
        <IconButton size="small" onClick={onClose} sx={{ color: T.TEXT_SEC }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip icon={<WhatsAppIcon sx={{ fontSize: 14 }} />}
            label={doc.action === 'openedWhatsApp' ? t('dm.whatsappShareActionOpened') : t('dm.whatsappShareActionCopied')}
            size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#25D36622', color: '#25D366' }} />
          <Chip label={doc.variantCode} size="small" sx={{ height: 20, fontSize: '0.65rem', fontFamily: 'monospace', bgcolor: T.CTRL_BG, color: T.TEXT_SEC }} />
          <Chip label={(doc.language || 'en').toUpperCase()} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: T.CTRL_BG, color: T.TEXT_SEC }} />
        </Box>

        {doc.branches?.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ color: T.TEXT_TER, display: 'block', mb: 0.5 }}>
              {t('inventory.shareBranchesLabel')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {doc.branches.map((b, i) => (
                <Typography key={i} sx={{ fontSize: '0.78rem', color: T.TEXT_PRI }}>
                  {countryFlag(b.country)} {b.branchName} — {formatQty(b.quantity)} {b.unit}
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        {doc.contactName && (
          <Box>
            <Typography variant="caption" sx={{ color: T.TEXT_TER, display: 'block', mb: 0.5 }}>
              {t('inventory.shareContactLabel')}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_PRI }}>
              {doc.contactName} {doc.contactWaNumber ? `(+${doc.contactWaNumber})` : ''}
            </Typography>
          </Box>
        )}

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: T.TEXT_TER, flexGrow: 1 }}>
              {t('inventory.sharePreviewLabel')}
            </Typography>
            <Tooltip title={t('inventory.shareCopyText')}>
              <IconButton size="small" onClick={handleCopy} sx={{ color: T.TEXT_TER }}>
                <ContentCopyIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}`,
            whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: T.TEXT_PRI,
            direction: doc.language === 'en' ? 'ltr' : 'rtl' }}>
            {doc.text}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          {doc.createdByName && <UserAvatar userId={doc.createdBy} size={18} fontSize="0.6rem" />}
          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
            {doc.createdByName ? `${doc.createdByName} · ` : ''}
            {new Date(doc.insertDate).toLocaleString()}
          </Typography>
        </Box>
      </Box>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t('dm.whatsappShareDeleteTitle')}
        message={t('dm.whatsappShareDeleteMessage')}
        confirmLabel={t('common.delete')}
        destructive
      />
    </Box>
  );
}
