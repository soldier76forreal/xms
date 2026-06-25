import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          py: 6,
          px: 3,
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon color="error" sx={{ fontSize: 56 }} />
        <Typography variant="h6" color="text.primary">
          Something went wrong
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </Typography>
        <Button variant="outlined" size="small" onClick={this.reset}>
          Try again
        </Button>
      </Box>
    );
  }
}

export default ErrorBoundary;
