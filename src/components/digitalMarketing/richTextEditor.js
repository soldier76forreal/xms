import { useContext, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import PlaceholderExtension from '@tiptap/extension-placeholder';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ImageIcon from '@mui/icons-material/Image';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import TitleIcon from '@mui/icons-material/Title';
import { useDispatch } from 'react-redux';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { uploadBlogInlineImage } from '../../store/store';

// TipTap's own node/mark schema (StarterKit + Link + Image) never emits
// <script>/<iframe>/event-handler attributes on its own — the toolbar is the
// ONLY way to produce markup here, there's no "raw HTML" escape hatch. The
// server still sanitizes on write (see api/utils/sanitizeHtml.js) as
// defense against a direct API call bypassing this editor entirely.
export default function RichTextEditor({ value, onChange, dir = 'ltr', placeholder }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch    = useDispatch();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const fileInputRef = useRef(null);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.1)'  : theme.palette.divider,
    BG:       isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    TEXT_PRI: isDark ? '#ffffff'                : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.5)'  : theme.palette.text.secondary,
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      ImageExtension.configure({ inline: false }),
      PlaceholderExtension.configure({ placeholder: placeholder || '' }),
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: { dir, style: 'min-height:220px;outline:none;' },
    },
  });

  // Keep the editor in sync when switching language tabs (each tab holds its
  // own HTML string in the parent's state) — TipTap doesn't react to a
  // changed `content` prop on its own after mount.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || '') !== current) editor.commands.setContent(value || '', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({ editorProps: { attributes: { dir, style: 'min-height:220px;outline:none;' } } });
  }, [editor, dir]);

  if (!editor) return null;

  const btnSx = (active) => ({
    width: 28, height: 28, borderRadius: '6px', color: active ? T.TEXT_PRI : T.TEXT_SEC,
    bgcolor: active ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)') : 'transparent',
  });

  const setLink = () => {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL', prev || 'https://');
    if (url === null) return;
    if (!url) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const pickImage = () => fileInputRef.current?.click();
  const onImageSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await dispatch(uploadBlogInlineImage({ authCtx, axiosGlobal, formData })).unwrap();
      const url = `${axiosGlobal.defaultTargetApi}${result.url}`;
      editor.chain().focus().setImage({ src: url }).run();
    } catch (_) { /* snackbar already shown by the thunk */ }
  };

  return (
    <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap', p: 0.75, bgcolor: T.BG, borderBottom: `1px solid ${T.BD}` }}>
        <Tooltip title="Bold">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} sx={btnSx(editor.isActive('bold'))}>
            <FormatBoldIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} sx={btnSx(editor.isActive('italic'))}>
            <FormatItalicIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Heading">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} sx={btnSx(editor.isActive('heading', { level: 2 }))}>
            <TitleIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Bullet list">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} sx={btnSx(editor.isActive('bulletList'))}>
            <FormatListBulletedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered list">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} sx={btnSx(editor.isActive('orderedList'))}>
            <FormatListNumberedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Quote">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleBlockquote().run()} sx={btnSx(editor.isActive('blockquote'))}>
            <FormatQuoteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Link">
          <IconButton size="small" onClick={setLink} sx={btnSx(editor.isActive('link'))}>
            <LinkIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        {editor.isActive('link') && (
          <Tooltip title="Remove link">
            <IconButton size="small" onClick={() => editor.chain().focus().unsetLink().run()} sx={btnSx(false)}>
              <LinkOffIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Image">
          <IconButton size="small" onClick={pickImage} sx={btnSx(false)}>
            <ImageIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={onImageSelected} />
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: T.BD }} />
        <Tooltip title="Undo">
          <IconButton size="small" onClick={() => editor.chain().focus().undo().run()} sx={btnSx(false)}>
            <UndoIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo">
          <IconButton size="small" onClick={() => editor.chain().focus().redo().run()} sx={btnSx(false)}>
            <RedoIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{
        px: 2, py: 1.5, minHeight: 220, maxHeight: 420, overflowY: 'auto', fontSize: '0.86rem', color: T.TEXT_PRI,
        '& .ProseMirror': { outline: 'none' },
        '& .ProseMirror p.is-editor-empty:first-of-type::before': {
          content: 'attr(data-placeholder)', color: T.TEXT_SEC, float: 'left', height: 0, pointerEvents: 'none',
        },
        '& img': { maxWidth: '100%', borderRadius: '6px' },
        '& blockquote': { borderInlineStart: `3px solid ${T.BD}`, margin: 0, paddingInlineStart: '12px', color: T.TEXT_SEC },
        '& a': { color: theme.palette.primary.main },
      }}>
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
