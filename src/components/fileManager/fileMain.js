import { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import Menu from '@mui/material/Menu';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import StorageIcon from '@mui/icons-material/Storage';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import SectionTutorials from '../tutorials/sectionTutorials';
import { actions, setFilesAsync, uploadFile, startDownload } from '../../store/store';

import FileCard from './fileCard';
import FileDetailPanel from './fileDetailPanel';
import MediaViewer, { resolveMediaKind } from '../digitalMarketing/mediaViewer';
import NewFileModal from './newFileModal';
import RenameModal from './renameModal';
import DeleteModal from './deleteModal';
import ShareTheLink from './shareTheLink';
import FilePickerModal from './filePickerModal';
import TransferCenter from './transferCenter';
import SearchInputForTags from './searchInputForTags';
import StorageManagement from './storageManagement';

// ── File Manager — Phase 9 makeover ────────────────────────────────────────────
// Same dark/opacity master-detail shell as CRM/MIS/Inventory. Data layer
// (float/currentDisplay/routeLink, all URL-pathname-driven) is UNCHANGED from
// the legacy implementation — this file only replaces the presentation layer.
// Navigation contract preserved exactly: history.push(newPath) followed by
// dispatch(actions.setFolder()) re-derives the tree view from the now-updated
// window.location.pathname against the already-fetched state.data.
export default function FileMain() {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMob  = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();
  const apiBase     = axiosGlobal.defaultTargetApi;
  const myId        = String(authCtx.decode?.id || authCtx.decode?._id || '');

  const location = useLocation();
  const history  = useHistory();

  const data           = useSelector((s) => s.data);
  const currentDisplay = useSelector((s) => s.currentDisplay);
  const routeLink      = useSelector((s) => s.routeLink);
  const selectedItems  = useSelector((s) => s.selectedItems);
  const uploadQueue    = useSelector((s) => s.uploadQueue);
  const loading        = useSelector((s) => s.loading);

  const T = {
    APP_BG:   isDark ? '#060606' : theme.palette.background.default,
    PANEL_BG: isDark ? '#0d0d0d' : theme.palette.background.paper,
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const [search, setSearch] = useState('');
  const [mobileDetail, setMobileDetail] = useState(false);

  const [newFileModal, setNewFileModal] = useState(false);
  const [newFolderType, setNewFolderType] = useState('mainNewFolderBtn');

  const [openRenameModal, setOpenRenameModal] = useState(false);
  const [renameFolder, setRenameFolder] = useState('');
  const [fileFolderIdType, setFileFolderIdType] = useState(null);

  const [deleteFileModal, setDeleteFileModal] = useState(false);
  const [deleteCount, setDeleteCount] = useState('single');

  const [openFilePicker, setOpenFilePicker] = useState(false);
  const [filePickerCount, setFilePickerCount] = useState({ count: 'single', idAndType: null });
  const [copyMoveType, setCopyMoveType] = useState('move');

  const [openShareLink, setOpenShareLink] = useState(false);
  const [successToast, setSuccessToast] = useState({ status: false, msg: '' });
  const [tagMenuAnchor, setTagMenuAnchor] = useState(null);
  const [viewerMedia, setViewerMedia] = useState(null);   // { url, name, kind } — in-app preview from a card click
  const [storageOpen, setStorageOpen] = useState(false);

  const fileInputRef = useRef(null);

  // ── Navigation resync — the load-bearing effect from the legacy component.
  // Every route change (folder descend, breadcrumb jump, back button) re-reads
  // window.location.pathname inside the reducer and rebuilds float/currentDisplay.
  useEffect(() => {
    if (data.length !== 0 && openFilePicker === false) {
      dispatch(actions.setFolder());
    }
    if (openFilePicker === true) {
      dispatch(actions.openFilePickerFolder());
    }
  }, [location]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(actions.tagToShow());
  }, [selectedItems]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (successToast.status) {
      dispatch(actions.setShowSnackBar({ status: true, msg: successToast.msg, type: 'success' }));
      setSuccessToast({ status: false, msg: '' });
    }
  }, [successToast]);   // eslint-disable-line react-hooks/exhaustive-deps

  const getLastPart = (url) => url.split('/').at(-1);

  // ── Navigation ────────────────────────────────────────────────────────────
  const openFolder = (entry, index) => {
    const path = location.pathname === '/' ? `/files/${decodeURI(entry.doc.name)}` : `${location.pathname}/${decodeURI(entry.doc.name)}`;
    history.push(path);
    dispatch(actions.setFolder({ id: entry.doc._id, name: entry.doc.name, index }));
  };
  const goToRoot = () => history.push('/files');
  const goToBreadcrumb = (path) => history.push(`/files${path}`);

  // ── Selection ─────────────────────────────────────────────────────────────
  const selectOnly = (id, type) => {
    dispatch(actions.unselectAll());
    dispatch(actions.selectUnselect({ id, type }));
    if (isMob) setMobileDetail(true);
  };

  // Clicking a previewable file opens the in-app viewer right away (desktop
  // also selects it so the detail panel shows alongside). Non-previewable
  // types just select/drill down as before.
  const openFileCard = (doc) => {
    // resolveMediaKind matches dotted extensions — doc.format is bare ("png")
    const kind = resolveMediaKind(doc.format ? `.${doc.format}` : (doc.metaData?.originalname || ''));
    if (!isMob) selectOnly(doc._id, 'file');
    if (kind !== 'other' && doc.metaData?.filename) {
      setViewerMedia({
        url: `${apiBase}/uploads/${doc.metaData.filename}`,
        name: doc.name,
        kind,
      });
      if (isMob) { dispatch(actions.unselectAll()); dispatch(actions.selectUnselect({ id: doc._id, type: 'file' })); }
    } else if (isMob) {
      selectOnly(doc._id, 'file');
    }
  };
  const toggleCheck = (id, type) => dispatch(actions.selectUnselect({ id, type }));
  const closeDetail = () => { dispatch(actions.unselectAll()); setMobileDetail(false); };

  const isSelectMode = selectedItems.length > 0;
  const selectedEntry = useMemo(() => {
    if (selectedItems.length !== 1) return null;
    const sel = selectedItems[0];
    return (currentDisplay?.docs || []).find((e) =>
      sel.type === 'file' ? e.file?._id === sel.id : e.doc?._id === sel.id
    ) || null;
  }, [selectedItems, currentDisplay]);

  // ── Pin ───────────────────────────────────────────────────────────────────
  const togglePin = async (id, kind) => {
    try {
      await authCtx.jwtInst({ method: 'post', url: `${apiBase}/files/togglePin`, data: { itemId: id, kind } });
      dispatch(actions.refresh());
    } catch (err) {
      dispatch(actions.setShowSnackBar({ status: true, msg: t('files.failedTogglePin'), type: 'error' }));
    }
  };
  const isPinned = (doc) => (doc?.pinnedBy || []).map(String).includes(myId);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    dispatch(setFilesAsync({ files, uploadType: 'fileManager' })).then(() => {
      dispatch(uploadFile({ authCtx, axiosGlobal, files: uploadQueue, currentDisplay }));
    });
  };

  // ── Rename / Delete / Move / Copy / Share / Download ─────────────────────
  const openRename = (target, name) => { setFileFolderIdType(target); setRenameFolder(name); setOpenRenameModal(true); };
  const openDelete = (target) => { setFileFolderIdType(target); setDeleteCount('single'); setDeleteFileModal(true); };
  const openDeleteMulti = () => { setDeleteCount('multi'); setDeleteFileModal(true); };
  const openMove = (target) => { setFilePickerCount({ count: 'single', idAndType: target }); setCopyMoveType('move'); setOpenFilePicker(true); };
  const openCopy = (target) => { setFilePickerCount({ count: 'single', idAndType: target }); setCopyMoveType('copy'); setOpenFilePicker(true); };
  const openMoveMulti = () => { setFilePickerCount({ count: 'multi', idAndType: null }); setCopyMoveType('move'); setOpenFilePicker(true); };
  const openCopyMulti = () => { setFilePickerCount({ count: 'multi', idAndType: null }); setCopyMoveType('copy'); setOpenFilePicker(true); };
  const openShare = (target) => { setFilePickerCount({ count: 'single', idAndType: target }); setOpenShareLink(true); };
  const openShareMulti = () => { setFilePickerCount({ count: 'multi', idAndType: null }); setOpenShareLink(true); };

  // A single FILE downloads directly (exact original name, no zip wrapper);
  // anything else (a folder, or more than one item) goes through the zip
  // route. Both are tracked in the transfer center, not fire-and-forget.
  const handleDownload = (target, name) => {
    if (target.type === 'file') {
      dispatch(startDownload({ authCtx, axiosGlobal, kind: 'single', fileId: target.id, label: name || 'file' }));
    } else {
      dispatch(startDownload({ authCtx, axiosGlobal, kind: 'zip', selected: [target], label: `${name || 'folder'}.zip`, itemCount: 1 }));
    }
  };
  const handleDownloadMulti = () => {
    if (selectedItems.length === 1 && selectedEntry?.file) {
      handleDownload({ type: 'file', id: selectedEntry.file._id }, selectedEntry.file.name);
      return;
    }
    dispatch(startDownload({
      authCtx, axiosGlobal, kind: 'zip', selected: selectedItems,
      label: `download-${selectedItems.length}-items.zip`, itemCount: selectedItems.length,
    }));
  };

  // ── Pinned strip + grid (folders first) ──────────────────────────────────
  const allDocs = useMemo(() => currentDisplay?.docs || [], [currentDisplay]);
  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? allDocs.filter((e) => (e.file ? e.file.name : e.doc?.name || '').toLowerCase().includes(q))
      : allDocs;
    const folders = list.filter((e) => e.file === undefined);
    const files = list.filter((e) => e.file !== undefined);
    return [...folders, ...files];
  }, [allDocs, search]);

  const pinnedDocs = useMemo(() => allDocs.filter((e) => isPinned(e.file || e.doc)), [allDocs, myId]);   // eslint-disable-line react-hooks/exhaustive-deps

  const desktopSplit = !isMob;

  const cardGrid = (entries) => (
    <Box sx={{ display: 'grid', gap: 1.25,
      gridTemplateColumns: { xs: 'repeat(auto-fill, minmax(118px, 1fr))', sm: 'repeat(auto-fill, minmax(140px, 1fr))' } }}>
      {entries.map((e, i) => {
        const isFolder = e.file === undefined;
        const doc = isFolder ? e.doc : e.file;
        const sel = selectedItems.some((s) => s.id === doc._id);
        return (
          <FileCard key={doc._id} entry={e} apiBase={apiBase}
            selected={sel} checked={sel}
            pinned={isPinned(doc)} tags={[]}
            onOpen={() => (isFolder ? openFolder(e, i) : openFileCard(doc))}
            onToggleCheck={() => toggleCheck(doc._id, isFolder ? 'folder' : 'file')}
            onTogglePin={() => togglePin(doc._id, isFolder ? 'folder' : 'file')}
          />
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: T.APP_BG, overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      {!(isMob && mobileDetail) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
          bgcolor: isDark ? '#0d0d0d' : 'background.paper', borderBottom: `1px solid ${T.BD}`,
          flexShrink: 0, flexWrap: 'wrap' }}>

          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.TEXT_PRI, flexShrink: 0,
            display: { xs: 'none', sm: 'block' } }}>
            {t('dm.filesLabel')}
          </Typography>

          {/* Breadcrumb — horizontally scrollable on phones instead of wrapping */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 1, minWidth: 0,
            overflowX: 'auto', whiteSpace: 'nowrap',
            '&::-webkit-scrollbar': { display: 'none' } }}>
            <Typography onClick={goToRoot} sx={{ fontSize: '0.75rem', color: T.TEXT_SEC, cursor: 'pointer', flexShrink: 0,
              '&:hover': { color: T.TEXT_PRI } }}>
              XFILE
            </Typography>
            {routeLink.map((p) => (
              <Typography key={p} onClick={() => goToBreadcrumb(p)} noWrap
                sx={{ fontSize: '0.75rem', color: T.TEXT_TER, cursor: 'pointer', maxWidth: { xs: 90, sm: 140 }, flexShrink: 0,
                  '&:hover': { color: T.TEXT_PRI } }}>
                /{getLastPart(p)}
              </Typography>
            ))}
          </Box>

          {isSelectMode ? (
            // ── Bulk action bar ──
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexGrow: 1, justifyContent: 'flex-end' }}>
              <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC, mr: 1 }}>
                {t('files.selectedCount', { count: selectedItems.length })}
              </Typography>
              <Tooltip title={t('common.download')}>
                <IconButton size="small" onClick={handleDownloadMulti} sx={{ color: T.TEXT_SEC }}>
                  <DownloadIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              {can('files:upload') && (
                <>
                  <Tooltip title={t('files.moveTip')}>
                    <IconButton size="small" onClick={openMoveMulti} sx={{ color: T.TEXT_SEC }}>
                      <DriveFileMoveIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.copy')}>
                    <IconButton size="small" onClick={openCopyMulti} sx={{ color: T.TEXT_SEC }}>
                      <ContentCopyIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('files.tagTip')}>
                    <IconButton size="small" onClick={(e) => setTagMenuAnchor(e.currentTarget)} sx={{ color: T.TEXT_SEC }}>
                      <LocalOfferIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Menu anchorEl={tagMenuAnchor} open={Boolean(tagMenuAnchor)} onClose={() => setTagMenuAnchor(null)}
                    PaperProps={{ sx: { bgcolor: isDark ? '#181818' : 'background.paper', border: `1px solid ${T.BD}`,
                      borderRadius: '10px', p: 1.5, minWidth: 220 } }}>
                    <SearchInputForTags />
                  </Menu>
                </>
              )}
              {can('files:share') && (
                <Tooltip title={t('common.share')}>
                  <IconButton size="small" onClick={openShareMulti} sx={{ color: T.TEXT_SEC }}>
                    <ShareIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              )}
              {can('files:delete') && (
                <Tooltip title={t('common.delete')}>
                  <IconButton size="small" onClick={openDeleteMulti} sx={{ color: '#EA005A' }}>
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              )}
              <Button size="small" onClick={() => dispatch(actions.unselectAll())}
                sx={{ fontSize: '0.72rem', textTransform: 'none', color: T.TEXT_TER }}>
                {t('files.clearSelection')}
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexGrow: 1, maxWidth: 320,
                bgcolor: T.CTRL_BG, borderRadius: '8px', px: 1.25, py: '4px', border: `1px solid ${T.BD}` }}>
                <SearchIcon sx={{ fontSize: 16, color: T.TEXT_TER, flexShrink: 0 }} />
                <TextField variant="standard" placeholder={t('files.searchThisFolderPlaceholder')} fullWidth
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ disableUnderline: true, sx: { fontSize: '0.8rem', color: T.TEXT_PRI } }} />
              </Box>

              <Box sx={{ flexGrow: 1 }} />

              <Tooltip title={t('files.storageUsageTip')}>
                <IconButton size="small" onClick={() => setStorageOpen(true)} sx={{ color: T.TEXT_SEC }}>
                  <StorageIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>

              {can('files:upload') && (
                <>
                  <Tooltip title={t('common.newFolder')}>
                    <IconButton size="small" onClick={() => { setNewFolderType('mainNewFolderBtn'); setNewFileModal(true); }}
                      sx={{ color: T.TEXT_SEC }}>
                      <CreateNewFolderIcon sx={{ fontSize: 19 }} />
                    </IconButton>
                  </Tooltip>
                  <Button size="small" component="label" startIcon={<UploadFileIcon sx={{ fontSize: 15 }} />}
                    sx={{ bgcolor: isDark ? '#fff' : '#000', color: isDark ? '#000' : '#fff', fontWeight: 600,
                      borderRadius: '8px', px: 1.75, py: '5px', fontSize: '0.78rem', textTransform: 'none',
                      '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
                    {t('files.uploadAction')}
                    <input ref={fileInputRef} type="file" hidden multiple onChange={handleFileChange} />
                  </Button>
                  <SectionTutorials section="files" tag="files:upload" />
                </>
              )}
            </>
          )}
        </Box>
      )}

      {/* ── Body ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={26} sx={{ color: T.TEXT_TER }} />
        </Box>
      ) : (
        <Box sx={{ display: desktopSplit ? 'flex' : 'block', flexGrow: 1, overflow: 'hidden' }}>

          {/* List column */}
          {!(isMob && mobileDetail) && (
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              {pinnedDocs.length > 0 && !search && (
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <StarIcon sx={{ fontSize: 14, color: '#FFB74D' }} />
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.TEXT_TER }}>
                      {t('files.pinnedHeader')}
                    </Typography>
                  </Box>
                  {cardGrid(pinnedDocs)}
                </Box>
              )}

              {filteredDocs.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 8, opacity: 0.4 }}>
                  <InsertDriveFileIcon sx={{ fontSize: 42, color: T.TEXT_TER }} />
                  <Typography sx={{ fontSize: '0.82rem', color: T.TEXT_SEC }}>
                    {search ? t('files.noMatches') : t('files.folderEmpty')}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Checkbox size="small" checked={isSelectMode}
                      indeterminate={isSelectMode && selectedItems.length < allDocs.length}
                      onClick={() => dispatch(actions.selectAll())}
                      sx={{ p: '4px', color: T.TEXT_TER, '&.Mui-checked': { color: T.TEXT_PRI } }} />
                    <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>
                      {t('files.itemsCount', { count: filteredDocs.length })}
                    </Typography>
                  </Box>
                  {cardGrid(filteredDocs)}
                </>
              )}
            </Box>
          )}

          {/* Detail panel (desktop) / drill-down (mobile) */}
          {desktopSplit ? (
            <Box sx={{ width: selectedEntry ? 380 : 0, flexShrink: 0, borderLeft: selectedEntry ? `1px solid ${T.BD}` : 'none',
              overflow: 'hidden', transition: 'width 0.15s' }}>
              {selectedEntry && (
                <FileDetailPanel entry={selectedEntry} pinned={isPinned(selectedEntry.file || selectedEntry.doc)}
                  onClose={closeDetail}
                  onRename={(target, name) => openRename(target, name)} onMove={openMove} onCopy={openCopy}
                  onShare={openShare} onDelete={openDelete} onDownload={handleDownload}
                  onTogglePin={() => togglePin((selectedEntry.file || selectedEntry.doc)._id, selectedEntry.file ? 'file' : 'folder')}
                />
              )}
            </Box>
          ) : (
            mobileDetail && selectedEntry && (
              <Box sx={{ position: 'fixed', inset: '60px 0 0 0', bgcolor: T.APP_BG, zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 1, borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
                  <IconButton onClick={closeDetail} size="small" sx={{ color: T.TEXT_SEC }}>
                    <ArrowBackIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <Typography sx={{ fontSize: '0.875rem', color: T.TEXT_SEC, ml: 1 }}>{t('users.backButton')}</Typography>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <FileDetailPanel entry={selectedEntry} pinned={isPinned(selectedEntry.file || selectedEntry.doc)}
                    panelMode={false} onClose={closeDetail}
                    onRename={(target, name) => openRename(target, name)} onMove={openMove} onCopy={openCopy}
                    onShare={openShare} onDelete={openDelete} onDownload={handleDownload}
                    onTogglePin={() => togglePin((selectedEntry.file || selectedEntry.doc)._id, selectedEntry.file ? 'file' : 'folder')}
                  />
                </Box>
              </Box>
            )
          )}
        </Box>
      )}

      <TransferCenter />

      <StorageManagement open={storageOpen} onClose={() => setStorageOpen(false)} />

      <MediaViewer open={Boolean(viewerMedia)} onClose={() => setViewerMedia(null)} media={viewerMedia} />

      <NewFileModal newFileModal={newFileModal} setNewFileModal={setNewFileModal} newFolderType={newFolderType} />
      <RenameModal openRenameModal={openRenameModal} setOpenRenameModal={setOpenRenameModal}
        fileFolderIdType={fileFolderIdType} renameFolder={renameFolder} setRenameFolder={setRenameFolder} />
      <DeleteModal deleteFileModal={deleteFileModal} setDeleteFileModal={setDeleteFileModal}
        deleteCount={deleteCount} fileFolderIdType={fileFolderIdType} />
      <FilePickerModal openFilePicker={openFilePicker} setOpenFilePicker={setOpenFilePicker}
        filePickerCount={filePickerCount} copyMoveType={copyMoveType}
        setNewFileModal={setNewFileModal} setNewFolderType={setNewFolderType} />
      <ShareTheLink openShareLink={openShareLink} setOpenShareLink={setOpenShareLink}
        filePickerCount={{ idAndType: filePickerCount.count === 'single' ? [filePickerCount.idAndType] : selectedItems }}
        setSuccessToast={setSuccessToast} setNewFileModal={setNewFileModal} setNewFolderType={setNewFolderType} />
    </Box>
  );
}
