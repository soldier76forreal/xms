import { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import FolderIcon from '@mui/icons-material/Folder';
import { FileIcon, defaultStyles } from 'react-file-icon';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { actions, deleteTag } from '../../store/store';
import MediaViewer, { resolveMediaKind } from '../digitalMarketing/mediaViewer';
import SearchInputForTags from './searchInputForTags';

const fmtSize = (bytes) => {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

const TABS = [
  { id: 'details',  labelKey: 'files.detailsTab' },
  { id: 'tags',     labelKey: 'files.tagsTab' },
  { id: 'activity', labelKey: 'files.activityTab' },
];

const ACTIVITY_LABEL_KEYS = {
  upload: 'files.actUploaded', new_folder: 'files.actFolderCreated', rename: 'files.renamed', move: 'files.actMoved',
  copy: 'files.actCopied', delete: 'files.actDeleted', tag_added: 'files.actTagAdded', tag_removed: 'files.actTagRemoved',
  share_link: 'files.actShareLinkCreated', download: 'files.actDownloaded',
};

// ── Detail panel — Details / Tags / Activity (Phase 9) ────────────────────────
// entry: the tree-entry {doc,subs} (folder) or {file} (file) for the SOLE
// selected item. Preview uses the shared Digital Marketing MediaViewer — no
// window.open, everything renders in-app.
export default function FileDetailPanel({ entry, pinned, onClose, onRename, onMove, onCopy, onShare, onDelete, onDownload, onTogglePin, panelMode = true }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();
  const apiBase     = axiosGlobal.defaultTargetApi;

  const tagsToShow = useSelector((s) => s.tagsToShow);

  const [tab, setTab] = useState('details');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const isFolder = entry.file === undefined;
  const doc  = isFolder ? entry.doc : entry.file;
  const kind = isFolder ? 'folder' : 'file';
  const format = !isFolder ? (doc.format || '').toLowerCase() : null;
  const fileUrl = !isFolder && doc.metaData?.filename ? `${apiBase}/uploads/${doc.metaData.filename}` : null;
  // resolveMediaKind matches dotted extensions — format is bare ("png")
  const mediaKind = fileUrl ? resolveMediaKind(`.${format}`) : null;
  const previewable = mediaKind && mediaKind !== 'other';

  const itemCount = isFolder ? (doc.subFolders?.length || 0) + (doc.subFiles?.length || 0) : null;

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${apiBase}/files/activity`,
        params: { itemId: doc._id, limit: 40 },
      });
      setActivity(res.data || []);
    } catch { setActivity([]); }
    setActivityLoading(false);
  }, [doc._id, apiBase, authCtx]);

  useEffect(() => { setTab('details'); }, [doc._id]);
  useEffect(() => { if (tab === 'activity') loadActivity(); }, [tab, loadActivity]);

  const removeTag = async (tagId) => {
    await dispatch(deleteTag({ authCtx, axiosGlobal, tagId, selected: { id: doc._id, type: kind } }));
    dispatch(actions.removeTag(tagId));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography noWrap sx={{ fontSize: '0.92rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }}>
            {doc.name}
          </Typography>
          {panelMode && (
            <IconButton size="small" onClick={onClose} sx={{ color: T.TEXT_TER }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>

        {/* Actions row */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1.25 }}>
          {previewable && (
            <Button size="small" variant="outlined" onClick={() => setViewerOpen(true)}
              sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: '8px' }}>
              {t('common.preview')}
            </Button>
          )}
          {can('files:upload') && (
            <Tooltip title={t('files.renameHeader')}>
              <IconButton size="small" onClick={() => onRename({ type: kind, id: doc._id }, doc.name)}
                sx={{ color: T.TEXT_SEC }}>
                <DriveFileRenameOutlineIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          )}
          {can('files:upload') && (
            <Tooltip title={t('files.moveTip')}>
              <IconButton size="small" onClick={() => onMove({ type: kind, id: doc._id })} sx={{ color: T.TEXT_SEC }}>
                <DriveFileMoveIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          )}
          {can('files:upload') && (
            <Tooltip title={t('common.copy')}>
              <IconButton size="small" onClick={() => onCopy({ type: kind, id: doc._id })} sx={{ color: T.TEXT_SEC }}>
                <ContentCopyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          {can('files:share') && (
            <Tooltip title={t('common.share')}>
              <IconButton size="small" onClick={() => onShare({ type: kind, id: doc._id })} sx={{ color: T.TEXT_SEC }}>
                <ShareIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          {!isFolder && (
            <Tooltip title={t('common.download')}>
              <IconButton size="small" onClick={() => onDownload({ type: kind, id: doc._id }, doc.name)} sx={{ color: T.TEXT_SEC }}>
                <DownloadIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={pinned ? t('files.unpinTip') : t('files.pinTip')}>
            <IconButton size="small" onClick={onTogglePin} sx={{ color: pinned ? '#FFB74D' : T.TEXT_SEC }}>
              {pinned ? <StarIcon sx={{ fontSize: 17 }} /> : <StarBorderIcon sx={{ fontSize: 17 }} />}
            </IconButton>
          </Tooltip>
          {can('files:delete') && (
            <Tooltip title={t('common.delete')}>
              <IconButton size="small" onClick={() => onDelete({ type: kind, id: doc._id })} sx={{ color: '#EA005A' }}>
                <DeleteOutlineIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Tab bar */}
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
          {TABS.map((tabItem) => (
            <Button key={tabItem.id} size="small" onClick={() => setTab(tabItem.id)}
              sx={{
                minWidth: 0, px: 1.5, py: '3px', borderRadius: '7px',
                fontSize: '0.72rem', fontWeight: tab === tabItem.id ? 700 : 400, textTransform: 'none',
                color: tab === tabItem.id ? T.TEXT_PRI : T.TEXT_TER,
                bgcolor: tab === tabItem.id ? T.CTRL_BG : 'transparent',
                '&:hover': { bgcolor: T.CTRL_BG, color: T.TEXT_PRI },
              }}>
              {t(tabItem.labelKey)}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2.5, py: 2 }}>

        {tab === 'details' && (
          <Box>
            {/* Thumbnail / icon block */}
            <Box onClick={() => previewable && setViewerOpen(true)}
              sx={{
                height: 160, borderRadius: '12px', mb: 2, cursor: previewable ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              }}>
              {isFolder ? (
                <FolderIcon sx={{ fontSize: 64, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }} />
              ) : doc.thumbnail ? (
                <Box component="img" src={`${apiBase}/uploads/${doc.thumbnail}`} alt={doc.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Box sx={{ width: 56 }}>
                  <FileIcon extension={format} {...(defaultStyles[format] || {})} />
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {isFolder ? (
                <>
                  <Row label={t('files.itemsLabel')} value={itemCount} T={T} />
                </>
              ) : (
                <>
                  <Row label={t('files.typeLabel')} value={format?.toUpperCase() || '—'} T={T} />
                  <Row label={t('files.sizeLabel')} value={fmtSize(doc.metaData?.size)} T={T} />
                </>
              )}
              <Row label={t('files.uploadedByLabel')} value={doc.uploadedByName || '—'} T={T} />
              <Row label={t('files.dateLabel')} value={fmtDate(doc.insertDate)} T={T} />
              {doc.updateDate && <Row label={t('files.lastUpdatedLabel')} value={fmtDate(doc.updateDate)} T={T} />}
            </Box>
          </Box>
        )}

        {tab === 'tags' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {can('files:upload') && <SearchInputForTags />}
            {tagsToShow.length === 0 ? (
              <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, textAlign: 'center', py: 3 }}>
                {t('files.noTagsOnItem')}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {tagsToShow.map((tag) => (
                  <Chip key={tag._id} label={tag.tag} size="small"
                    onDelete={can('files:upload') ? () => removeTag(tag._id) : undefined}
                    sx={{ height: 24, fontSize: '0.72rem', borderRadius: '6px',
                      bgcolor: T.CTRL_BG, color: T.TEXT_PRI }} />
                ))}
              </Box>
            )}
          </Box>
        )}

        {tab === 'activity' && (
          activityLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={20} sx={{ color: T.TEXT_TER }} />
            </Box>
          ) : activity.length === 0 ? (
            <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_TER, textAlign: 'center', py: 3 }}>
              {t('files.noActivityRecordedYet')}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {activity.map((a, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', mt: '6px', flexShrink: 0,
                    bgcolor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_PRI }}>
                      {ACTIVITY_LABEL_KEYS[a.type] ? t(ACTIVITY_LABEL_KEYS[a.type]) : a.type}
                      {a.actorName ? <Box component="span" sx={{ color: T.TEXT_SEC }}> — {a.actorName}</Box> : null}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>{fmtDate(a.date)}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )
        )}
      </Box>

      {previewable && (
        <MediaViewer open={viewerOpen} onClose={() => setViewerOpen(false)}
          media={{ url: fileUrl, name: doc.name, kind: mediaKind }} />
      )}
    </Box>
  );
}

const Row = ({ label, value, T }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
    <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_TER }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_PRI, fontWeight: 500, textAlign: 'right' }}>{value}</Typography>
  </Box>
);
