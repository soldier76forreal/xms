import { useContext, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslation } from 'react-i18next';
import moment from 'jalali-moment';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
import MediaViewer, { resolveMediaKind, downloadFile } from '../digitalMarketing/mediaViewer';
import UserAvatar from '../main/userAvatar';

const IMG_FORMATS = ['jpg', 'JPG', 'png', 'PNG', 'svg', 'SVG', 'jpeg', 'JPGE', 'webp'];

// The internal-only replacement for the legacy public /showLink page — rendered
// by shortLinkResolver.js when a resolved short link's module is 'files'.
// Requires login (enforced by the resolver before this ever mounts) and
// requires files:view (enforced server-side by GET /files/shortlinks/:code).
export default function FileShareView({ code }) {
  const { t }       = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [payload, setPayload] = useState(null);
  const [stack, setStack] = useState([]);
  const [viewerMedia, setViewerMedia] = useState(null);

  const T = {
    BG: '#060606', CARD_BG: '#111111', CARD_BD: 'rgba(255,255,255,0.08)',
    TEXT_PRI: '#ffffff', TEXT_SEC: 'rgba(255,255,255,0.45)', TEXT_TER: 'rgba(255,255,255,0.2)',
    ROW_BD: 'rgba(255,255,255,0.06)', ROW_HVR: 'rgba(255,255,255,0.04)',
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErrorStatus(null);
      try {
        const res = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/files/shortlinks/${code}`,
        });
        if (cancelled) return;
        const data = res.data;
        const finalArr = Array.isArray(data?.finalArr) ? data.finalArr : [];
        const documents = Array.isArray(data?.linkDoc?.document) ? data.linkDoc.document : [];
        const rootDocs = [];
        for (const d of documents) {
          const found = finalArr.find((e) => String(e?.doc?._id) === String(d.id));
          if (found) rootDocs.push(found);
        }
        setPayload(data);
        setStack([{ name: 'XFILE', id: 'root', docs: rootDocs }]);
      } catch (err) {
        if (!cancelled) setErrorStatus(err?.response?.status || 500);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: T.BG }}>
        <CircularProgress size={28} sx={{ color: T.TEXT_SEC }} />
      </Box>
    );
  }

  if (errorStatus === 403) return <RestrictedAccessScreen />;
  if (errorStatus) return <RestrictedAccessScreen message={t('restricted.linkExpired')} />;

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
