import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// Drop at the bottom of a scrollable list. Fires onIntersect() once when it
// scrolls into view (guarded by hasMore/loading so it doesn't refire mid-load
// or after the list is exhausted). Shared by CRM / MIS / Inventory so the
// same scroll-pagination behavior doesn't get re-implemented three times.
const InfiniteScrollSentinel = ({ onIntersect, hasMore, loading }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!hasMore || !ref.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) onIntersect();
    }, { rootMargin: '200px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onIntersect]);

  if (!hasMore) return null;

  return (
    <Box ref={ref} sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
      <CircularProgress size={20} />
    </Box>
  );
};

export default InfiniteScrollSentinel;
