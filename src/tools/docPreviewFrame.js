import { useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

// Shows a server-rendered document (invoice / quotation, packing list, deal
// letter — the same HTML the PDF prints from) in a sandboxed iframe.
//
// The templates are laid out for an A4 page, so on a narrow screen the iframe
// used to clip them on the right. Instead, below `docWidth` the document is
// rendered at its real width and scaled down to fit — a phone sees the whole
// page, smaller, exactly as it will print. At full width nothing changes.
//
// `height` is the visible frame height (an sx value, so it can be responsive);
// the document still scrolls inside it.
export default function DocPreviewFrame({ html, title, height = { xs: 520, md: 860 }, docWidth = 794 }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = width && width < docWidth ? width / docWidth : 1;
  const scaled = scale < 1;

  return (
    // ltr wrapper: the scaled page is anchored top-left, whatever the UI direction
    // (the document inside the iframe keeps its own direction).
    <Box ref={ref} sx={{ width: '100%', height, overflow: 'hidden', bgcolor: '#ffffff', direction: 'ltr' }}>
      <Box component="iframe" srcDoc={html} title={title} sandbox=""
        sx={{
          display: 'block', border: 'none', bgcolor: '#ffffff',
          width: scaled ? `${docWidth}px` : '100%',
          // Taller by 1/scale, so once scaled it fills the frame exactly.
          height: scaled ? `${100 / scale}%` : '100%',
          transform: scaled ? `scale(${scale})` : 'none',
          transformOrigin: 'top left',
        }} />
    </Box>
  );
}
