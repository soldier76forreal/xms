import { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import LinkIcon from '@mui/icons-material/Link';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { actions } from '../../store/store';
import { copyText } from '../../tools/clipboard';

// One-click "copy link" for a record detail header — creates a short link AND
// copies it to the clipboard in the same click (the double-function the
// button is specified to have). Drop into any detail view's action row:
// <CopyLinkButton module="crm" entityType="customer" entityId={customer._id} />
export default function CopyLinkButton({ module, entityType, entityId, size = 'small', sx }) {
  const { t }       = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch    = useDispatch();
  const theme       = useTheme();
  const isDark      = theme.palette.mode === 'dark';
  const [busy, setBusy] = useState(false);

  const TEXT_TER = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)';
  const TEXT_PRI = isDark ? '#ffffff' : theme.palette.text.primary;

  const handleClick = async (e) => {
    e.stopPropagation();
    if (busy || !entityId) return;
    setBusy(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/shortlinks`,
        data: { module, entityType, entityId },
      });
      const link = `${window.location.origin}/l/${res.data.code}`;
      const copied = await copyText(link);
      dispatch(actions.setShowSnackBar({
        status: true,
        msg: copied ? t('common.linkCopied') : link,
        type: copied ? 'success' : 'info',
      }));
    } catch (_) {
      dispatch(actions.setShowSnackBar({ status: true, msg: t('common.linkCreateFailed'), type: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip title={t('common.copyLink')}>
      <span>
        <IconButton size={size} onClick={handleClick} disabled={busy}
          sx={{ color: TEXT_TER, width: 28, height: 28, '&:hover': { color: TEXT_PRI }, ...sx }}>
          {busy ? <CircularProgress size={14} color="inherit" /> : <LinkIcon sx={{ fontSize: 15 }} />}
        </IconButton>
      </span>
    </Tooltip>
  );
}
