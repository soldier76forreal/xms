import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';

/**
 * Wraps content with a skeleton loading state.
 *
 * Props:
 *   loading   {boolean}  — show skeletons when true
 *   variant   {string}   — 'text' | 'card' | 'table' | 'rectangular'  (default: 'text')
 *   count     {number}   — number of skeleton rows/cards  (default: 5)
 *   height    {number}   — override skeleton height
 *   width     {string|number} — override skeleton width (rectangular only)
 *   children  {node}     — rendered when loading is false
 */
const SkeletonWrapper = ({
  loading,
  children,
  variant = 'text',
  count = 5,
  height,
  width,
}) => {
  if (!loading) return children ?? null;

  if (variant === 'card') {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: count }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Box
              sx={{
                p: 2,
                border: '1.5px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Skeleton variant="text" width="55%" height={22} />
              <Skeleton variant="text" width="35%" height={18} sx={{ mt: 0.5 }} />
              <Skeleton
                variant="rectangular"
                height={height ?? 80}
                sx={{ mt: 1.5, borderRadius: 1 }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (variant === 'table') {
    return (
      <Box>
        {Array.from({ length: count }).map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Skeleton variant="circular" width={36} height={36} sx={{ flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="text" width="50%" height={20} />
              <Skeleton variant="text" width="30%" height={16} sx={{ mt: 0.25 }} />
            </Box>
            <Skeleton
              variant="rectangular"
              width={72}
              height={30}
              sx={{ borderRadius: 1, flexShrink: 0 }}
            />
          </Box>
        ))}
      </Box>
    );
  }

  if (variant === 'rectangular') {
    return (
      <Skeleton
        variant="rectangular"
        width={width ?? '100%'}
        height={height ?? 200}
        sx={{ borderRadius: 2 }}
      />
    );
  }

  // default: stacked text lines
  return (
    <Box>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === count - 1 ? '60%' : '100%'}
          height={height ?? 24}
          sx={{ mb: 0.25 }}
        />
      ))}
    </Box>
  );
};

export default SkeletonWrapper;
