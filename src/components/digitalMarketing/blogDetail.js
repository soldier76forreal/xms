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

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import { fetchBlogPost, deleteBlogPost, actions } from '../../store/store';
import BlogEditor from './blogEditor';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import RestrictedAccessScreen from '../main/restrictedAccessScreen';
import { LANGUAGES, isRtlLang } from '../../i18n';

const byLang = (doc, base, lang) => {
  if (lang === 'en') return doc[base] || '';
  const suffix = lang === 'ar' ? 'Ar' : 'Fa';
  return doc[`${base}${suffix}`] || '';
};

// Detail/preview pane for a Blog post (see blogSection.js). Renders the
// TipTap body HTML with the same styling the public site's post page uses,
// so this genuinely previews "what a visitor will see" — not just a raw
// field dump — with a language switcher since every post carries all 3.
export default function BlogDetail({ id, onClose, onDeleted }) {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can }     = usePermissions();

  const doc = useSelector((s) => s.dmSelectedBlogPost);
  const errorStatus = useSelector((s) => s.dmSelectedBlogPostErrorStatus);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    CARD_BG:  isDark ? '#151515' : 'rgba(0,0,0,0.02)',
  };

  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lang, setLang] = useState('en');

  const load = useCallback(async () => {
    setLoading(true);
    await dispatch(fetchBlogPost({ authCtx, axiosGlobal, id }));
    setLoading(false);
  }, [id, authCtx, axiosGlobal, dispatch]);

  useEffect(() => { load(); setLang('en'); }, [load]);

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

  const coverUrl = doc.coverImage?.diskName ? `${axiosGlobal.defaultTargetApi}/uploads/${doc.coverImage.diskName}` : null;
  const publicUrl = doc.slug ? `${axiosGlobal.publicWebsiteUrl}/${lang}/blog/${doc.slug}` : null;
  const title = byLang(doc, 'title', lang);
  const excerpt = byLang(doc, 'excerpt', lang);
  const body = byLang(doc, 'body', lang);

  const handleDelete = async () => {
    await dispatch(deleteBlogPost({ authCtx, axiosGlobal, id: doc._id }));
    setConfirmDelete(false);
    onDeleted();
  };

  const handleCopyPublicLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      dispatch(actions.setShowSnackBar({ status: true, msg: t('common.copyLink'), type: 'success' }));
    } catch (_) { /* clipboard denied, no-op */ }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 3, py: 2, borderBottom: `1px solid ${T.BD}` }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: T.TEXT_PRI, flexGrow: 1 }} noWrap>
          {doc.title}
        </Typography>
        {can('digitalMarketing:blog:edit') && (
          <Tooltip title={t('common.edit')}>
            <IconButton size="small" onClick={() => setEditOpen(true)} sx={{ color: T.TEXT_SEC }}>
              <EditOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}
        {can('digitalMarketing:blog:delete') && (
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Chip label={doc.status === 'published' ? t('dm.blogStatusPublished') : t('dm.blogStatusDraft')} size="small"
            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700,
              bgcolor: doc.status === 'published' ? '#81c78422' : '#9e9e9e22',
              color: doc.status === 'published' ? '#81c784' : '#9e9e9e' }} />
          <Box sx={{ display: 'flex', gap: 0.5, bgcolor: T.CTRL_BG, borderRadius: '8px', p: '2px', ml: 'auto' }}>
            {LANGUAGES.map((l) => (
              <Box key={l.code} component="button" onClick={() => setLang(l.code)}
                sx={{ border: 'none', cursor: 'pointer', minWidth: 0, px: 1, py: 0.25, borderRadius: '6px',
                  fontSize: '0.68rem', fontWeight: lang === l.code ? 700 : 400,
                  color: lang === l.code ? T.TEXT_PRI : T.TEXT_TER,
                  bgcolor: lang === l.code ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent' }}>
                {l.nativeLabel}
              </Box>
            ))}
          </Box>
        </Box>

        {doc.slug && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.25, borderRadius: '10px', bgcolor: T.CARD_BG, border: `1px solid ${T.BD}` }}>
            <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_SEC, flexGrow: 1, minWidth: 0, fontFamily: 'monospace' }} noWrap>
              {publicUrl}
            </Typography>
            <Tooltip title={t('common.copyLink')}>
              <IconButton size="small" onClick={handleCopyPublicLink} sx={{ color: T.TEXT_TER }}>
                <ContentCopyIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            {doc.status === 'published' && (
              <Tooltip title={t('dm.linkPageOpenPublic')}>
                <IconButton size="small" component="a" href={publicUrl} target="_blank" rel="noopener noreferrer" sx={{ color: T.TEXT_TER }}>
                  <OpenInNewIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {/* ── Preview — same visual treatment as the public post page ── */}
        <Box sx={{ borderRadius: '12px', border: `1px solid ${T.BD}`, overflow: 'hidden', bgcolor: T.CARD_BG }}>
          {coverUrl && (
            <Box component="img" src={coverUrl} alt="" sx={{ width: '100%', height: 180, objectFit: 'cover' }} />
          )}
          <Box sx={{ p: 2.5 }} dir={isRtlLang(lang) ? 'rtl' : 'ltr'}>
            {!title ? (
              <Typography sx={{ fontSize: '0.8rem', color: T.TEXT_TER, fontStyle: 'italic' }}>
                {t('dm.blogNoContentForLanguage')}
              </Typography>
            ) : (
              <>
                <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: T.TEXT_PRI, mb: excerpt ? 0.75 : 1.5 }}>
                  {title}
                </Typography>
                {excerpt && (
                  <Typography sx={{ fontSize: '0.85rem', color: T.TEXT_SEC, mb: 1.5 }}>
                    {excerpt}
                  </Typography>
                )}
                <Box
                  sx={{
                    fontSize: '0.85rem', color: T.TEXT_PRI, lineHeight: 1.7,
                    '& p': { my: 1 }, '& h2': { fontSize: '1rem', fontWeight: 700, mt: 2, mb: 1 },
                    '& img': { maxWidth: '100%', borderRadius: '8px' },
                    '& blockquote': { borderInlineStart: `3px solid ${T.BD2}`, m: 0, pl: 1.5, color: T.TEXT_SEC },
                    '& a': { color: theme.palette.primary.main },
                    '& ul, & ol': { pl: 3 },
                  }}
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </>
            )}
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>
          {doc.createdByName ? `${doc.createdByName} · ` : ''}
          {t('dm.blogUpdated')} {new Date(doc.updateDate).toLocaleDateString()}
          {doc.publishedAt ? ` · ${t('dm.blogPublished')} ${new Date(doc.publishedAt).toLocaleDateString()}` : ''}
        </Typography>
      </Box>

      <BlogEditor open={editOpen} onClose={() => setEditOpen(false)} post={doc} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t('dm.blogDeleteTitle')}
        message={t('dm.blogDeleteMessage', { title: doc.title })}
        confirmLabel={t('common.delete')}
        destructive
      />
    </Box>
  );
}
