import { useRef, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

// Drag handle for a resizable sidebar. Pair with useSidebarWidth().
//
//   side='right'  the handle sits on the sidebar's right edge (a LEFT-hand
//                 sidebar: nav rail, master list) — dragging right widens it.
//   side='left'   the handle sits on the left edge (a RIGHT-hand detail
//                 panel) — dragging left widens it.
//
// Pointer events rather than mouse events so a trackpad, a pen and a touch
// drag all work through one path, and setPointerCapture keeps the drag alive
// when the pointer outruns the 5px handle (which it always does).
//
// Desktop only by default: a 5px drag target is not a real touch target, and
// on mobile these panels are a full-width drill-down where width is
// meaningless anyway.
export default function SidebarResizer({ width, onResize, side = 'right', onDoubleClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const startRef = useRef(null);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, startWidth: width };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handlePointerMove = useCallback((e) => {
    if (!startRef.current) return;
    const delta = e.clientX - startRef.current.x;
    onResize(startRef.current.startWidth + (side === 'right' ? delta : -delta));
  }, [onResize, side]);

  const endDrag = useCallback((e) => {
    if (!startRef.current) return;
    startRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) { /* already released */ }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // A drag interrupted by an alt-tab or a thrown error must not leave the
  // whole page stuck with a resize cursor and no text selection.
  useEffect(() => () => {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation="vertical"
      title=""
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: -3,
        width: 6,
        cursor: 'col-resize',
        zIndex: 5,
        display: { xs: 'none', md: 'block' },
        // Invisible until approached — a permanent vertical line on every
        // panel edge would be visual noise for a control most people use once.
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0, bottom: 0, left: '50%',
          width: 2, transform: 'translateX(-50%)',
          bgcolor: 'transparent',
          transition: 'background-color 0.12s',
        },
        '&:hover::after, &:active::after': {
          bgcolor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.24)',
        },
      }}
    />
  );
}
