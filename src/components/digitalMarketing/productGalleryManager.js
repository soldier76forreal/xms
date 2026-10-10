import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddLinkIcon from '@mui/icons-material/AddLink';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FindReplaceIcon from '@mui/icons-material/FindReplace';
import ReplayIcon from '@mui/icons-material/Replay';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { assetUrl, thumbPath, formatBytes } from './productPageUrl';

// The product page's image gallery, as a working tool rather than a list of links:
// drop / pick / paste images (several at once, uploaded in parallel with progress),
// drag tiles to reorder (or use the arrows), choose the main image, write alt text,
// view each one full size, replace or remove it, and see at a glance which images are
// small, heavy, duplicated or missing alt text.
//
// `value` is the gallery as the record stores it ([{ url, alt, order }], first = main).
// Everything that changes it goes through onChange(updater) - an updater function, so
// several uploads finishing at the same moment can't overwrite each other.

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,.heic,.heif';
const MAX_BYTES = 10 * 1024 * 1024;
const PARALLEL = 3;
const LOW_RES_PX = 900;
const HEAVY_BYTES = 4 * 1024 * 1024;

const looksLikeImage = (file) => /^image\//i.test(file.type || '') || /\.(jpe?g|png|webp|avif|gif|heic|heif)$/i.test(file.name || '');
const withOrder = (list) => list.map((item, order) => ({ ...item, order }));
let uid = 0;
const nextId = () => `u${Date.now().toString(36)}${(uid += 1)}`;

// One image in the grid. `item.width/height/bytes` are known only for images uploaded in
// this editing session (the API reports them); stored ones are checked when opened.
function GalleryTile({
  item, index, total, selected, selecting, isDropTarget, isDragging, duplicate,
  src, onSelect, onMove, onMain, onView, onReplace, onRemove, onAlt,
  onDragStart, onDragOver, onDrop, onDragEnd, t, T,
}) {
  const [full, setFull] = useState(false);          // the thumbnail is missing: show the image itself
  const lowRes = item.width && Math.max(item.width, item.height || 0) < LOW_RES_PX;
  const heavy = item.bytes && item.bytes > HEAVY_BYTES;
  const noAlt = !String(item.alt || '').trim();
  const isMain = index === 0;
  const iconSx = { color: '#fff', bgcolor: 'rgba(0,0,0,0.55)', width: 26, height: 26, '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } };

  return (
    <Box
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(index)); onDragStart(index); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(index); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(index); }}
      onDragEnd={onDragEnd}
      sx={{
        position: 'relative', borderRadius: '10px', overflow: 'hidden', bgcolor: T.CARD,
        border: `2px solid ${isDropTarget ? '#64b5f6' : (selected ? '#64b5f6' : (isMain ? T.BD2 : T.BD))}`,
        opacity: isDragging ? 0.4 : 1, transition: 'border-color .12s, opacity .12s',
        '&:hover .tileTools, &:focus-within .tileTools': { opacity: 1 },
      }}>
      <Box sx={{ position: 'relative', aspectRatio: '4 / 3', bgcolor: T.CTRL_BG, cursor: 'grab' }}>
        <Box component="img" src={full ? src.full : (src.thumb || src.full)} alt={item.alt || ''} draggable={false}
          onError={() => { if (!full && src.thumb) setFull(true); }}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none' }} />

        <Box sx={{ position: 'absolute', top: 6, left: 6, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Checkbox size="small" checked={selected} onChange={() => onSelect(index)}
            inputProps={{ 'aria-label': t('dm.pcGallerySelect') }}
            sx={{ p: 0.25, color: '#fff', bgcolor: 'rgba(0,0,0,0.45)', borderRadius: '6px', opacity: (selecting || selected) ? 1 : 0,
              '&.Mui-checked': { color: '#64b5f6' } }} className="tileTools" />
          {isMain ? (
            <Box sx={{ px: 0.8, py: '2px', borderRadius: '6px', bgcolor: '#64b5f6', color: '#0b1a2b', fontSize: '0.62rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <StarIcon sx={{ fontSize: 11 }} />{t('dm.pcGalleryMain')}
            </Box>
          ) : (
            <Box sx={{ px: 0.7, py: '1px', borderRadius: '6px', bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '0.62rem', fontWeight: 700 }}>
              {index + 1}
            </Box>
          )}
        </Box>

        <Box className="tileTools" sx={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 0.5, opacity: { xs: 1, md: 0 }, transition: 'opacity .12s' }}>
          <Tooltip title={t('dm.pcGalleryView')}><IconButton size="small" onClick={() => onView(index)} sx={iconSx} aria-label={t('dm.pcGalleryView')}><ZoomInIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
          <Tooltip title={t('dm.pcGalleryReplace')}><IconButton size="small" onClick={() => onReplace(index)} sx={iconSx} aria-label={t('dm.pcGalleryReplace')}><FindReplaceIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
          <Tooltip title={t('dm.pcGalleryRemove')}><IconButton size="small" onClick={() => onRemove(index)} sx={{ ...iconSx, '&:hover': { bgcolor: '#c0004a' } }} aria-label={t('dm.pcGalleryRemove')}><DeleteOutlineIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
        </Box>

        <Box className="tileTools" sx={{ position: 'absolute', bottom: 6, left: 6, right: 6, display: 'flex', alignItems: 'center', gap: 0.5, opacity: { xs: 1, md: 0 }, transition: 'opacity .12s' }}>
          <Tooltip title={t('dm.pcGalleryMoveBack')}><span><IconButton size="small" disabled={index === 0} onClick={() => onMove(index, index - 1)} sx={iconSx} aria-label={t('dm.pcGalleryMoveBack')}><ArrowBackIcon sx={{ fontSize: 15 }} /></IconButton></span></Tooltip>
          <Tooltip title={t('dm.pcGalleryMoveForward')}><span><IconButton size="small" disabled={index === total - 1} onClick={() => onMove(index, index + 1)} sx={iconSx} aria-label={t('dm.pcGalleryMoveForward')}><ArrowForwardIcon sx={{ fontSize: 15 }} /></IconButton></span></Tooltip>
          <Box sx={{ flex: 1 }} />
          {!isMain && (
            <Tooltip title={t('dm.pcGalleryMakeMain')}><IconButton size="small" onClick={() => onMain(index)} sx={iconSx} aria-label={t('dm.pcGalleryMakeMain')}><StarBorderIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
          )}
        </Box>

        {(lowRes || heavy || duplicate) && (
          <Box sx={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', gap: 0.5 }}>
            {lowRes && (
              <Tooltip title={t('dm.pcGalleryLowRes', { w: item.width, h: item.height })}>
                <WarningAmberIcon sx={{ fontSize: 18, color: '#ffb74d', filter: 'drop-shadow(0 0 2px #000)' }} />
              </Tooltip>
            )}
            {heavy && (
              <Tooltip title={t('dm.pcGalleryHeavy', { size: formatBytes(item.bytes) })}>
                <WarningAmberIcon sx={{ fontSize: 18, color: '#ef5350', filter: 'drop-shadow(0 0 2px #000)' }} />
              </Tooltip>
            )}
            {duplicate && (
              <Tooltip title={t('dm.pcGalleryDuplicate')}>
                <WarningAmberIcon sx={{ fontSize: 18, color: '#ba68c8', filter: 'drop-shadow(0 0 2px #000)' }} />
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ p: 0.75 }}>
        <TextField size="small" fullWidth value={item.alt || ''} onChange={(e) => onAlt(index, e.target.value)}
          placeholder={t('dm.pcGalleryAlt')} inputProps={{ 'aria-label': t('dm.pcGalleryAltHint'), maxLength: 200 }}
          error={false}
          sx={{ '& .MuiOutlinedInput-root': { height: 28, fontSize: '0.72rem', borderRadius: '7px', bgcolor: T.CTRL_BG },
            '& input': { py: 0 } }} />
        {noAlt && (
          <Typography sx={{ fontSize: '0.6rem', color: '#ffb74d', mt: 0.3, lineHeight: 1.2 }}>{t('dm.pcGalleryAltMissing')}</Typography>
        )}
      </Box>
    </Box>
  );
}

// A file on its way up (or one that did not make it).
function UploadTile({ job, onRetry, onDismiss, t, T }) {
  const failed = job.status === 'error';
  return (
    <Box sx={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1px dashed ${failed ? '#ef5350' : T.BD2}`, bgcolor: T.CARD }}>
      <Box sx={{ position: 'relative', aspectRatio: '4 / 3', bgcolor: T.CTRL_BG }}>
        {job.preview && <Box component="img" src={job.preview} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: failed ? 0.25 : 0.45 }} />}
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.75, p: 1, textAlign: 'center' }}>
          {failed ? (
            <>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef5350' }}>{t('dm.pcGalleryFailed')}</Typography>
              <Typography sx={{ fontSize: '0.64rem', color: T.TEXT_SEC }}>{job.error}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {job.file && <Button size="small" startIcon={<ReplayIcon sx={{ fontSize: 13 }} />} onClick={() => onRetry(job)} sx={{ textTransform: 'none', fontSize: '0.68rem' }}>{t('dm.pcGalleryRetry')}</Button>}
                <Button size="small" onClick={() => onDismiss(job)} sx={{ textTransform: 'none', fontSize: '0.68rem' }}>{t('dm.pcGalleryDismiss')}</Button>
              </Box>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.TEXT_PRI }} noWrap>{t('dm.pcGalleryUploading')}</Typography>
              <Box sx={{ width: '80%' }}><LinearProgress variant="determinate" value={job.progress} sx={{ height: 5, borderRadius: 3 }} /></Box>
              <Typography sx={{ fontSize: '0.62rem', color: T.TEXT_SEC, maxWidth: '90%' }} noWrap>{job.name}</Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// Full-size view with the real pixel size, arrows to walk the gallery.
function GalleryViewer({ items, index, onIndex, onClose, srcOf, t, T }) {
  const [natural, setNatural] = useState(null);
  const item = items[index];
  useEffect(() => { setNatural(null); }, [index]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length);
      else if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onIndex]);
  if (!item) return null;
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: '#0b0b0b', backgroundImage: 'none', borderRadius: '14px', overflow: 'hidden' } }}>
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', maxHeight: '82vh', p: 1 }}>
        <Box component="img" src={srcOf(item).full} alt={item.alt || ''} onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          sx={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain' }} />
        <IconButton onClick={onClose} aria-label={t('common.close')} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' }}><CloseIcon /></IconButton>
        {items.length > 1 && (
          <>
            <IconButton onClick={() => onIndex((index - 1 + items.length) % items.length)} aria-label={t('dm.pcGalleryMoveBack')} sx={{ position: 'absolute', left: 8, top: '50%', color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' }}><ArrowBackIcon /></IconButton>
            <IconButton onClick={() => onIndex((index + 1) % items.length)} aria-label={t('dm.pcGalleryMoveForward')} sx={{ position: 'absolute', right: 8, top: '50%', color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' }}><ArrowForwardIcon /></IconButton>
          </>
        )}
      </Box>
      <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', borderTop: `1px solid ${T.BD}` }}>
        <Typography sx={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>{index + 1} / {items.length}</Typography>
        {natural && (
          <Typography sx={{ color: natural.w < LOW_RES_PX && natural.h < LOW_RES_PX ? '#ffb74d' : 'rgba(255,255,255,0.55)', fontSize: '0.74rem' }}>
            {natural.w} × {natural.h} px
          </Typography>
        )}
        <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.74rem', flex: 1, minWidth: 0 }} noWrap>{item.alt || t('dm.pcGalleryAltMissing')}</Typography>
      </Box>
    </Dialog>
  );
}

export default function ProductGalleryManager({ value, onChange, title }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const gallery = value || [];

  const T = {
    BD: isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    BD2: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.2)',
    CARD: isDark ? '#141414' : theme.palette.background.paper,
    CTRL_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.5)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.38)',
  };

  const [queue, setQueue] = useState([]);                 // uploads in flight / failed
  const [selected, setSelected] = useState(() => new Set());
  const [dragFrom, setDragFrom] = useState(null);       // what is being dragged (for the styling)
  const dragSource = useRef(null);                      // ...and for the drop itself: no render in between
  const [dragOver, setDragOver] = useState(null);
  const [fileDrag, setFileDrag] = useState(false);
  const [viewer, setViewer] = useState(-1);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlText, setUrlText] = useState('');
  const [urlError, setUrlError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInput = useRef(null);
  const replaceIndex = useRef(-1);
  const replaceInput = useRef(null);

  const commit = useCallback((updater) => onChange((prev) => withOrder(updater(prev || []))), [onChange]);
  const srcOf = useCallback((item) => ({
    full: assetUrl(item.url, axiosGlobal),
    thumb: thumbPath(item.url) ? assetUrl(thumbPath(item.url), axiosGlobal) : '',
  }), [axiosGlobal]);

  const duplicates = useMemo(() => {
    const seen = new Map();
    gallery.forEach((item) => seen.set(item.url, (seen.get(item.url) || 0) + 1));
    return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([url]) => url));
  }, [gallery]);

  // ── uploading ──────────────────────────────────────────────────────────────
  const patchJob = (id, patch) => setQueue((q) => q.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  const dropJob = (id) => setQueue((q) => {
    const job = q.find((j) => j.id === id);
    if (job && job.preview) URL.revokeObjectURL(job.preview);
    return q.filter((j) => j.id !== id);
  });

  const sendOne = useCallback(async (job, replaceAt = -1) => {
    patchJob(job.id, { status: 'uploading', progress: 0, error: '' });
    try {
      const form = new FormData();
      form.append('images', job.file);
      const res = await authCtx.jwtInst({
        method: 'post', url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/product-content/gallery/upload`, data: form,
        onUploadProgress: (e) => { if (e.total) patchJob(job.id, { progress: Math.round((e.loaded / e.total) * 100) }); },
      });
      const done = (res.data.data || [])[0];
      if (!done) throw new Error((res.data.failed && res.data.failed[0] && res.data.failed[0].message) || t('dm.pcGalleryFailed'));
      const stored = { url: done.url, alt: '', width: done.width, height: done.height, bytes: done.bytes };
      commit((prev) => {
        if (replaceAt >= 0 && prev[replaceAt]) {
          const next = prev.slice();
          next[replaceAt] = { ...stored, alt: prev[replaceAt].alt || '' };      // same place, same alt text
          return next;
        }
        return [...prev, stored];
      });
      dropJob(job.id);
    } catch (err) {
      const data = err && err.response && err.response.data;
      patchJob(job.id, {
        status: 'error',
        error: (data && ((data.failed && data.failed[0] && data.failed[0].message) || data.message)) || err.message || t('dm.pcGalleryFailed'),
      });
    }
  }, [authCtx, axiosGlobal.defaultTargetApi, commit, t]);   // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = useCallback(async (fileList, replaceAt = -1) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const jobs = [];
    const problems = [];
    files.forEach((file) => {
      if (!looksLikeImage(file)) { problems.push(t('dm.pcGalleryBadType', { name: file.name })); return; }
      if (file.size > MAX_BYTES) { problems.push(t('dm.pcGalleryTooBig', { name: file.name })); return; }
      jobs.push({ id: nextId(), name: file.name, file, progress: 0, status: 'uploading', preview: /^image\/(jpeg|png|webp|gif|avif)$/i.test(file.type) ? URL.createObjectURL(file) : '' });
    });
    setNotice(problems.join(' · '));
    if (!jobs.length) return;
    setQueue((q) => [...q, ...jobs]);
    // a small pool, so a dozen photos don't open a dozen connections at once
    let cursor = 0;
    const worker = async () => {
      while (cursor < jobs.length) {
        const job = jobs[cursor]; cursor += 1;
        await sendOne(job, replaceAt);
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL, jobs.length) }, worker));
  }, [sendOne, t]);

  const retry = (job) => sendOne(job);

  // ── editing the list ───────────────────────────────────────────────────────
  const move = (from, to) => {
    if (from === to || to < 0 || to >= gallery.length) return;
    commit((prev) => { const next = prev.slice(); const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; });
  };
  const makeMain = (index) => move(index, 0);
  const remove = (index) => { commit((prev) => prev.filter((_, i) => i !== index)); setSelected(new Set()); };
  const setAlt = (index, text) => commit((prev) => prev.map((item, i) => (i === index ? { ...item, alt: text } : item)));
  const toggleSelect = (index) => setSelected((old) => { const next = new Set(old); if (next.has(index)) next.delete(index); else next.add(index); return next; });
  const removeSelected = () => { commit((prev) => prev.filter((_, i) => !selected.has(i))); setSelected(new Set()); };
  const fillAlt = () => {
    const base = String(title || '').trim();
    if (!base) return;
    commit((prev) => prev.map((item, i) => (String(item.alt || '').trim() ? item : { ...item, alt: i === 0 ? base : `${base} - ${i + 1}` })));
  };

  const addUrl = () => {
    const url = urlText.trim();
    if (!/^(https?:\/\/|\/[^/])/i.test(url)) { setUrlError(t('dm.pcGalleryUrlInvalid')); return; }
    commit((prev) => [...prev, { url, alt: '' }]);
    setUrlText(''); setUrlError(''); setUrlOpen(false);
  };

  // dragging tiles to reorder
  const startDrag = (index) => { dragSource.current = index; setDragFrom(index); };
  const finishDrag = () => { dragSource.current = null; setDragFrom(null); setDragOver(null); };
  const dropOnTile = (to) => { if (dragSource.current !== null) move(dragSource.current, to); finishDrag(); };

  // files dropped / pasted on the zone
  const onZoneDrop = (e) => {
    e.preventDefault(); setFileDrag(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };
  const onPaste = (e) => {
    const files = [...(e.clipboardData ? e.clipboardData.files : [])].filter(looksLikeImage);
    if (files.length) { e.preventDefault(); addFiles(files); }
  };

  const missingAlt = gallery.filter((item) => !String(item.alt || '').trim()).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI }}>
          {t('dm.pcGalleryCount', { count: gallery.length })}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, flex: 1, minWidth: 180 }}>{t('dm.pcGalleryHint')}</Typography>
        {selected.size > 0 && (
          <>
            <Typography sx={{ fontSize: '0.72rem', color: '#64b5f6', fontWeight: 700 }}>{t('dm.pcGallerySelected', { count: selected.size })}</Typography>
            <Button size="small" color="error" startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />} onClick={removeSelected} sx={{ textTransform: 'none', fontSize: '0.72rem' }}>{t('dm.pcGalleryRemoveSelected')}</Button>
            <Button size="small" onClick={() => setSelected(new Set())} sx={{ textTransform: 'none', fontSize: '0.72rem' }}>{t('dm.pcGalleryClearSelection')}</Button>
          </>
        )}
        {selected.size === 0 && missingAlt > 0 && String(title || '').trim() && (
          <Button size="small" onClick={fillAlt} sx={{ textTransform: 'none', fontSize: '0.72rem' }}>{t('dm.pcGalleryFillAlt')}</Button>
        )}
        <Button size="small" startIcon={<AddLinkIcon sx={{ fontSize: 15 }} />} onClick={() => setUrlOpen((open) => !open)} sx={{ textTransform: 'none', fontSize: '0.72rem' }}>{t('dm.pcGalleryAddUrl')}</Button>
      </Box>

      {urlOpen && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1.25 }}>
          <TextField size="small" fullWidth autoFocus value={urlText} onChange={(e) => { setUrlText(e.target.value); setUrlError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && urlText.trim()) { e.preventDefault(); addUrl(); } }}
            placeholder={t('dm.pcGalleryUrlPlaceholder')} error={Boolean(urlError)} helperText={urlError} />
          <Button variant="contained" size="small" onClick={addUrl} sx={{ textTransform: 'none', height: 40 }}>{t('dm.pcGalleryUrlAdd')}</Button>
        </Box>
      )}

      {notice && <Alert severity="warning" onClose={() => setNotice('')} sx={{ mb: 1.25 }}>{notice}</Alert>}

      <Box tabIndex={0} onPaste={onPaste}
        onDragOver={(e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); setFileDrag(true); } }}
        onDragLeave={() => setFileDrag(false)} onDrop={onZoneDrop}
        sx={{ outline: 'none', borderRadius: '12px', p: 1, border: `2px dashed ${fileDrag ? '#64b5f6' : T.BD2}`,
          bgcolor: fileDrag ? 'rgba(100,181,246,0.08)' : 'transparent', transition: 'border-color .12s, background-color .12s',
          '&:focus-visible': { borderColor: '#64b5f6' } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
          {gallery.map((item, index) => (
            <GalleryTile key={`${item.url}-${index}`} item={item} index={index} total={gallery.length}
              selected={selected.has(index)} selecting={selected.size > 0}
              isDragging={dragFrom === index} isDropTarget={dragOver === index && dragFrom !== null && dragFrom !== index}
              duplicate={duplicates.has(item.url)} src={srcOf(item)}
              onSelect={toggleSelect} onMove={move} onMain={makeMain} onView={setViewer}
              onReplace={(i) => { replaceIndex.current = i; if (replaceInput.current) replaceInput.current.click(); }}
              onRemove={remove} onAlt={setAlt}
              onDragStart={startDrag} onDragOver={setDragOver} onDrop={dropOnTile} onDragEnd={finishDrag}
              t={t} T={T} />
          ))}
          {queue.map((job) => <UploadTile key={job.id} job={job} onRetry={retry} onDismiss={(j) => dropJob(j.id)} t={t} T={T} />)}
          <Box role="button" tabIndex={0} onClick={() => fileInput.current && fileInput.current.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.current && fileInput.current.click(); } }}
            sx={{ aspectRatio: '4 / 3', borderRadius: '10px', border: `1px dashed ${T.BD2}`, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 0.5, p: 1, cursor: 'pointer', textAlign: 'center', color: T.TEXT_SEC,
              '&:hover': { borderColor: '#64b5f6', color: '#64b5f6' }, minHeight: 96 }}>
            <CloudUploadOutlinedIcon sx={{ fontSize: 26 }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>{t('dm.pcGalleryDrop')}</Typography>
          </Box>
        </Box>
        {!gallery.length && !queue.length && (
          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER, mt: 1, px: 0.5 }}>{t('dm.pcGalleryEmpty')}</Typography>
        )}
        <Typography sx={{ fontSize: '0.64rem', color: T.TEXT_TER, mt: 1, px: 0.5 }}>{t('dm.pcGalleryFormats')}</Typography>
      </Box>

      <input ref={fileInput} type="file" accept={ACCEPT} multiple hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={replaceInput} type="file" accept={ACCEPT} hidden
        onChange={(e) => { const at = replaceIndex.current; addFiles(e.target.files, at); e.target.value = ''; replaceIndex.current = -1; }} />

      {viewer >= 0 && (
        <GalleryViewer items={gallery} index={Math.min(viewer, gallery.length - 1)} onIndex={setViewer}
          onClose={() => setViewer(-1)} srcOf={srcOf} t={t} T={T} />
      )}
    </Box>
  );
}
