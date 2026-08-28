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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LockIcon from '@mui/icons-material/Lock';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CampaignIcon from '@mui/icons-material/Campaign';
import TelegramIcon from '@mui/icons-material/Telegram';
import CallIcon from '@mui/icons-material/Call';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LinkIcon from '@mui/icons-material/Link';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchLinkPage, deleteLinkPage, actions } from '../../store/store';
import LinkPageForm from './linkPageForm';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
import UserAvatar from '../main/userAvatar';

const TYPE_ICON = { whatsapp: WhatsAppIcon, whatsappChannel: CampaignIcon, telegram: TelegramIcon, phone: CallIcon, email: EmailIcon, website: LanguageIcon, address: LocationOnIcon, other: LinkIcon };
const TYPE_COLOR = { whatsapp: '#25D366', whatsappChannel: '#25D366', telegram: '#229ED9' };

export default function LinkPageDetail({ id, onClose, onDeleted }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const doc = useSelector((s) => s.dmSelectedLinkPage);
  const errorStatus = useSelector((s) => s.dmSelectedLinkPageErrorStatus);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    CARD_BG:  isDark ? '#151515' : 'rgba(0,0,0,0.02)',
  };

  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    await dispatch(fetchLinkPage({ authCtx, axiosGlobal, id }));
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

  const publicUrl = `${window.location.origin}/p/${doc.code}`;
  const coverUrl = doc.coverImage?.diskName ? `${axiosGlobal.defaultTargetApi}/uploads/${doc.coverImage.diskName}` : null;

  const handleDelete = async () => {
    await dispatch(deleteLinkPage({ authCtx, axiosGlobal, id: doc._id }));
    setConfirmDelete(false);
    onDeleted();
  };

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      dispatch(actions.setShowSnackBar({ status: true, msg: t('common.copyLink'), type: 'success' }));
    } catch (_) { /* clipboard denied, no-op */ }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 3, py: 2, borderBottom: `1px solid ${T.BD}` }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
          {doc.companyName}
        </Typography>
        {doc.restrictToOwner && (
          <Tooltip title={t('dm.linkPageRestrictToOwnerHint')}>
            <LockIcon sx={{ fontSize: 16, color: T.TEXT_TER, alignSelf: 'center' }} />
          </Tooltip>
        )}
        {can('digitalMarketing:linkPage:edit') && (
          <Tooltip title={t('common.edit')}>
            <IconButton size="small" onClick={() => setEditOpen(true)} sx={{ color: T.TEXT_SEC }}>
              <EditOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}
        {can('digitalMarketing:linkPage:delete') && (
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
        {coverUrl && (
          <Box component="img" src={coverUrl} alt="" sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '10px' }} />
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Chip label={doc.status === 'active' ? t('dm.linkPageStatusActive') : t('dm.linkPageStatusInactive')} size="small"
            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700,
              bgcolor: doc.status === 'active' ? '#81c78422' : '#9e9e9e22',
              color: doc.status === 'active' ? '#81c784' : '#9e9e9e' }} />
          <Chip label={(doc.language || 'en').toUpperCase()} size="small"
            sx={{ height: 20, fontSize: '0.65rem', bgcolor: T.CTRL_BG, color: T.TEXT_SEC }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.25, borderRadius: '10px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}` }}>
          <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_SEC, flexGrow: 1, minWidth: 0, fontFamily: 'monospace' }} noWrap>
            {publicUrl}
          </Typography>
          <Tooltip title={t('common.copyLink')}>
            <IconButton size="small" onClick={handleCopyPublicLink} sx={{ color: T.TEXT_TER }}>
              <ContentCopyIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('dm.linkPageOpenPublic')}>
            <IconButton size="small" component="a" href={publicUrl} target="_blank" rel="noopener noreferrer" sx={{ color: T.TEXT_TER }}>
              <OpenInNewIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {(doc.links || []).map((l, i) => {
            const Icon = TYPE_ICON[l.type] || LinkIcon;
            return (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: '10px',
                bgcolor: T.CARD_BG, border: `1px solid ${T.BD}` }}>
                <Icon sx={{ fontSize: 18, color: TYPE_COLOR[l.type] || T.TEXT_TER, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
                    {l.type === 'other' && l.label ? l.label : t(`dm.linkType${l.type.charAt(0).toUpperCase()}${l.type.slice(1)}`)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }} noWrap>
                    {l.value}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          {doc.createdByName && <UserAvatar userId={doc.createdBy} size={18} fontSize="0.6rem" />}
          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
            {doc.createdByName ? `${doc.createdByName} · ` : ''}
            {new Date(doc.insertDate).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>

      <LinkPageForm open={editOpen} onClose={() => setEditOpen(false)} linkPage={doc} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t('dm.linkPageDeleteTitle')}
        message={t('dm.linkPageDeleteMessage', { name: doc.companyName })}
        confirmLabel={t('common.delete')}
        destructive
      />
    </Box>
  );
}
