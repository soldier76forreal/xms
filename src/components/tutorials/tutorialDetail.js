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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import MovieIcon from '@mui/icons-material/Movie';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchTutorial, deleteTutorial } from '../../store/store';
import TutorialForm from './tutorialForm';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import MediaViewer, { resolveMediaKind, downloadFile } from '../digitalMarketing/mediaViewer';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
import UserAvatar from '../main/userAvatar';
import { sectionLabel } from './sectionLabels';

const kindIcon = (kind, sx) => {
  if (kind === 'image') return <ImageIcon sx={sx} />;
  if (kind === 'video') return <MovieIcon sx={sx} />;
  if (kind === 'pdf')   return <PictureAsPdfIcon sx={sx} />;
  return <InsertDriveFileIcon sx={sx} />;
};

export default function TutorialDetail({ id, onClose, onDeleted }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const doc = useSelector((s) => s.selectedTutorial);
  const errorStatus = useSelector((s) => s.selectedTutorialErrorStatus);

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
  const [viewerMedia, setViewerMedia] = useState(null);
  const [tab, setTab] = useState('content');

  // Who watched this tutorial. Local state rather than a Redux slice — it's
  // view-local, only ever read by this panel, and always refetched on open.
  const [views, setViews] = useState({ viewers: [], totalViews: 0, uniqueViewers: 0 });
  const [viewsLoading, setViewsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    await dispatch(fetchTutorial({ authCtx, axiosGlobal, id }));
    setLoading(false);
  }, [id, authCtx, axiosGlobal, dispatch]);

  useEffect(() => { load(); }, [load]);

  // Reset to the content tab whenever a different tutorial is opened, so the
  // panel never lands on a stale Views list from the previous record.
  useEffect(() => { setTab('content'); }, [id]);

  // Fetched only when the Views tab is actually opened. Deliberately re-runs
  // on every open: opening the detail writes a 'viewed' row server-side, so a
  // cached roster would always be one view stale.
  useEffect(() => {
    if (tab !== 'views' || !id) return;
    let cancelled = false;
    setViewsLoading(true);
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/tutorials/${id}/views` })
      .then((res) => { if (!cancelled) setViews(res.data || { viewers: [], totalViews: 0, uniqueViewers: 0 }); })
      .catch(() => { if (!cancelled) setViews({ viewers: [], totalViews: 0, uniqueViewers: 0 }); })
      .finally(() => { if (!cancelled) setViewsLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, id]);

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

  const handleDelete = async () => {
    await dispatch(deleteTutorial({ authCtx, axiosGlobal, id: doc._id }));
    setConfirmDelete(false);
    onDeleted();
  };

  const openFile = (f) => {
    setViewerMedia({
      url: `${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`,
      name: f.name, kind: resolveMediaKind(f.kind === 'pdf' ? 'application/pdf' : f.name),
    });
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 3, py: 2, borderBottom: `1px solid ${T.BD}` }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
          {doc.title}
        </Typography>
        {can('tutorials:edit') && (
          <Tooltip title={t('common.edit')}>
            <IconButton size="small" onClick={() => setEditOpen(true)} sx={{ color: T.TEXT_SEC }}>
              <EditOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}
        {can('tutorials:delete') && (
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

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{ px: 3, minHeight: 38, borderBottom: `1px solid ${T.BD}`,
          '& .MuiTab-root': { minHeight: 38, fontSize: '0.75rem', textTransform: 'none', color: T.TEXT_SEC },
          '& .Mui-selected': { color: T.TEXT_PRI },
          '& .MuiTabs-indicator': { bgcolor: T.TEXT_PRI } }}>
        <Tab value="content" label={t('tutorials.tabContent')} />
        <Tab value="views"   label={t('tutorials.tabViews')} />
      </Tabs>

      {tab === 'views' ? (
        <Box sx={{ px: 3, py: 2 }}>
          {viewsLoading ? (
            <>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" height={64} sx={{ mt: 1, borderRadius: '10px' }} />
            </>
          ) : views.viewers.length === 0 ? (
            <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER }}>
              {t('tutorials.noViewsYet')}
            </Typography>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                <VisibilityOutlinedIcon sx={{ fontSize: 15, color: T.TEXT_TER }} />
                <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC }}>
                  {t('tutorials.viewsSummary', {
                    people: views.uniqueViewers,
                    views: views.totalViews,
                  })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {views.viewers.map((v, i) => (
                  <Box key={v.actorId || `${v.actorName}-${i}`}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25,
                      borderRadius: '10px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}` }}>
                    <UserAvatar userId={v.actorId} size={26} fontSize="0.7rem" />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI }} noWrap>
                        {v.actorName || '—'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
                        {t('tutorials.lastWatched', { date: new Date(v.lastViewedAt).toLocaleString() })}
                      </Typography>
                    </Box>
                    {v.count > 1 && (
                      <Chip label={t('tutorials.watchCount', { count: v.count })} size="small"
                        sx={{ height: 19, fontSize: '0.62rem', bgcolor: T.CTRL_BG, color: T.TEXT_SEC }} />
                    )}
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      ) : (
      <Box sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip label={sectionLabel(doc.section, t)} size="small"
            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: T.CTRL_BG, color: T.TEXT_SEC }} />
          <Chip label={t(`tutorials.lang${doc.language?.toUpperCase()}`, doc.language)} size="small"
            sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'transparent', color: T.TEXT_TER, border: `1px solid ${T.BD}` }} />
          {(doc.tags || []).map((tag) => (
            <Chip key={tag} label={tag} size="small"
              sx={{ height: 20, fontSize: '0.6rem', bgcolor: 'transparent', color: T.TEXT_TER, border: `1px solid ${T.BD}` }} />
          ))}
        </Box>

        {doc.description && (
          <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC, whiteSpace: 'pre-wrap' }}>
            {doc.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {(doc.files || []).map((f) => {
            const thumbUrl = f.thumbnail ? `${axiosGlobal.defaultTargetApi}/uploads/${f.thumbnail}` : null;
            return (
              <Box key={f.fileId} onClick={() => openFile(f)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: '10px',
                  bgcolor: T.CARD_BG, border: `1px solid ${T.BD}`, cursor: 'pointer',
                  '&:hover': { borderColor: T.TEXT_TER } }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '8px', flexShrink: 0, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: T.CTRL_BG }}>
                  {thumbUrl
                    ? <Box component="img" src={thumbUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : kindIcon(f.kind, { fontSize: 18, color: T.TEXT_TER })}
                </Box>
                <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_PRI, flexGrow: 1, minWidth: 0 }} noWrap>
                  {f.name}
                </Typography>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); downloadFile(`${axiosGlobal.defaultTargetApi}/uploads/${f.diskName}`, f.name); }}
                  sx={{ color: T.TEXT_TER }}>
                  <DownloadIcon sx={{ fontSize: 16 }} />
                </IconButton>
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
      )}

      <MediaViewer open={Boolean(viewerMedia)} onClose={() => setViewerMedia(null)} media={viewerMedia}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }} />

      <TutorialForm open={editOpen} onClose={() => setEditOpen(false)} tutorial={doc} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t('tutorials.deleteTitle')}
        message={t('tutorials.deleteMessage', { title: doc.title })}
        confirmLabel={t('common.delete')}
        destructive
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      />
    </Box>
  );
}
