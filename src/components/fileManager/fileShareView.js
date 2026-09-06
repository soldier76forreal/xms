import { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';
import moment from 'jalali-moment';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import MediaViewer, { resolveMediaKind, downloadFile } from '../digitalMarketing/mediaViewer';
import UserAvatar from '../main/userAvatar';

const IMG_FORMATS = ['jpg', 'JPG', 'png', 'PNG', 'svg', 'SVG', 'jpeg', 'JPGE', 'webp'];

// The public share page — rendered by shortLinkResolver.js when /l/:code turns
// out to be a File Manager share. PURELY PRESENTATIONAL: the resolver has
// already fetched `data` from the unauthenticated GET /files/public/share/:code,
// so nothing here touches AuthContext, jwtInst, or a permission check. That is
// the point — the audience for a share link is someone with no XMS account, and
// every asset it renders (/uploads static, /download/:diskName) is public too.
export default function FileShareView({ data }) {
  const { t }       = useTranslation();
  const axiosGlobal = useContext(AxiosGlobal);

  const payload = data;
  const [stack, setStack] = useState(() => {
    const finalArr  = Array.isArray(data?.finalArr) ? data.finalArr : [];
    const documents = Array.isArray(data?.linkDoc?.document) ? data.linkDoc.document : [];
    const rootDocs  = [];
    for (const d of documents) {
      const found = finalArr.find((e) => String(e?.doc?._id) === String(d.id));
      if (found) rootDocs.push(found);
    }
    return [{ name: 'XFILE', id: 'root', docs: rootDocs }];
  });
  const [viewerMedia, setViewerMedia] = useState(null);

  const T = {
    BG: '#060606', CARD_BG: '#111111', CARD_BD: 'rgba(255,255,255,0.08)',
    TEXT_PRI: '#ffffff', TEXT_SEC: 'rgba(255,255,255,0.45)', TEXT_TER: 'rgba(255,255,255,0.2)',
    ROW_BD: 'rgba(255,255,255,0.06)', ROW_HVR: 'rgba(255,255,255,0.04)',
  };

  const current = stack[stack.length - 1] || { name: 'XFILE', docs: [] };
  const finalArrSource = Array.isArray(payload?.finalArr) ? payload.finalArr : [];

  const openFolder = (folderId) => {
    const found = finalArrSource.find((e) => String(e?.doc?._id) === String(folderId));
    if (!found) return;
    const subFiles = Array.isArray(found.subFiles) ? found.subFiles : [];
    const subFolders = Array.isArray(found.subFolders) ? found.subFolders : [];
    const docs = [
      ...subFolders.map((f) => ({ type: 'folder', doc: f, subFiles: f.subFiles, subFolders: f.subFolders })),
      ...subFiles.map((f) => ({ type: 'file', doc: f })),
    ];
    setStack((prev) => [...prev, { name: found.doc?.name, id: found.doc?._id, docs }]);
  };

  const goBack = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const openFile = (doc) => {
    const url = `${axiosGlobal.defaultTargetApi}/uploads/${doc.metaData.filename}`;
    const kind = resolveMediaKind(doc.metaData?.mimetype || doc.format);
    if (kind === 'other') {
      downloadFile(url, doc.metaData?.originalname || doc.name);
      return;
    }
    setViewerMedia({ url, name: doc.metaData?.originalname || doc.name, kind });
  };

  const linkDoc = payload?.linkDoc || {};
  const sharedBy = payload?.user;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: T.BG, display: 'flex', justifyContent: 'center', px: 2, py: { xs: 3, sm: 6 } }}>
      <MediaViewer open={!!viewerMedia} onClose={() => setViewerMedia(null)} media={viewerMedia} />
      <Box sx={{ width: '100%', maxWidth: 640, borderRadius: '14px', bgcolor: T.CARD_BG,
        border: `1px solid ${T.CARD_BD}`, overflow: 'hidden', height: 'fit-content' }}>

        {(linkDoc.showName || linkDoc.msg) && (
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${T.ROW_BD}`, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {linkDoc.showName && sharedBy && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <UserAvatar userId={linkDoc.createdBy} size={18} />
                <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC }}>
                  {t('files.fromLabel')} {sharedBy.firstName} {sharedBy.lastName}
                </Typography>
              </Box>
            )}
            {linkDoc.msg && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: T.TEXT_SEC, mt: '2px' }} />
                <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_PRI }}>{linkDoc.msg}</Typography>
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${T.ROW_BD}`, display: 'flex', alignItems: 'center', gap: 1 }}>
          {stack.length > 1 && (
            <IconButton size="small" onClick={goBack} sx={{ color: T.TEXT_SEC }}>
              <ArrowBackIosNewIcon sx={{ fontSize: 15 }} />
            </IconButton>
          )}
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.TEXT_PRI }}>
            {current.name}
          </Typography>
        </Box>

        <Box>
          {current.docs.length === 0 && (
            <Typography sx={{ px: 2.5, py: 3, fontSize: '0.8rem', color: T.TEXT_TER, textAlign: 'center' }}>
              {t('files.emptyFolder')}
            </Typography>
          )}
          {current.docs.map((e, idx) => {
            if (!e?.doc) return null;
            const isFolder = e.type === 'folder';
            const isImg = !isFolder && IMG_FORMATS.includes(e.doc.format);
            return (
              <Box key={e.doc._id || idx}
                onClick={() => (isFolder ? openFolder(e.doc._id) : openFile(e.doc))}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.25,
                  borderBottom: `1px solid ${T.ROW_BD}`, cursor: 'pointer',
                  '&:hover': { bgcolor: T.ROW_HVR } }}>
                {isImg ? (
                  <Box component="img" src={`${axiosGlobal.defaultTargetApi}/uploads/${e.doc.metaData.filename}`}
                    sx={{ width: 34, height: 34, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                ) : isFolder ? (
                  <FolderIcon sx={{ fontSize: 22, color: T.TEXT_SEC, flexShrink: 0 }} />
                ) : (
                  <InsertDriveFileIcon sx={{ fontSize: 20, color: T.TEXT_SEC, flexShrink: 0 }} />
                )}
                <Typography noWrap sx={{ flexGrow: 1, fontSize: '0.82rem', color: T.TEXT_PRI }}>
                  {e.doc.name}
                </Typography>
                {!isFolder && <DownloadIcon sx={{ fontSize: 15, color: T.TEXT_TER, flexShrink: 0 }} />}
                <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, flexShrink: 0 }}>
                  {e.doc.insertDate ? moment(e.doc.insertDate).format('YYYY/MM/DD') : ''}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ px: 2.5, py: 1.5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
            {t('files.poweredBy')} XCAPITAL
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
