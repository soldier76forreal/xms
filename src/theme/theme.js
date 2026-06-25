import { createTheme } from '@mui/material/styles';

// ─── Shared tokens ────────────────────────────────────────────────────────────
const typography = {
  fontFamily: '"Inter", "Roboto", sans-serif',
  fontSize: 14,
  h1: { fontSize: '1.5rem', fontWeight: 700 },
  h2: { fontSize: '1.25rem', fontWeight: 700 },
  h3: { fontSize: '1.125rem', fontWeight: 700 },
  h4: { fontSize: '1rem', fontWeight: 700 },
  h5: { fontSize: '0.9375rem', fontWeight: 700 },
  h6: { fontSize: '0.875rem', fontWeight: 700 },
  subtitle1: { fontSize: '1rem', fontWeight: 500 },
  subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
  body1: { fontSize: '0.875rem' },
  body2: { fontSize: '0.8125rem' },
  caption: { fontSize: '0.75rem' },
  button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none' },
};

const shape = { borderRadius: 10 };

// ─── Component overrides factory ──────────────────────────────────────────────
// `mode` is 'light' | 'dark'
// `palette` is the resolved palette so overrides can reference colors
const componentOverrides = (mode) => {
  const isLight = mode === 'light';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        body: {
          backgroundColor: isLight ? '#FAFAFA' : '#0F0F0F',
          color: isLight ? '#000000' : '#FFFFFF',
        },
        // Thin, neutral scrollbar
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: isLight ? '#D0D0D0' : '#3A3A3A',
          borderRadius: 3,
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 20,
          paddingRight: 20,
          fontWeight: 600,
          fontSize: '0.875rem',
          lineHeight: 1.4,
        },
        containedPrimary: {
          backgroundColor: isLight ? '#000000' : '#FFFFFF',
          color: isLight ? '#FFFFFF' : '#000000',
          '&:hover': {
            backgroundColor: isLight ? '#222222' : '#E0E0E0',
          },
        },
        outlinedPrimary: {
          borderWidth: '1.5px',
          borderColor: isLight ? '#000000' : '#FFFFFF',
          color: isLight ? '#000000' : '#FFFFFF',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
          },
        },
        textPrimary: {
          color: isLight ? '#000000' : '#FFFFFF',
          '&:hover': {
            backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
          },
        },
        // Destructive — use color="error" on the Button
        containedError: {
          backgroundColor: isLight ? '#EA005A' : '#FF4D8D',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: isLight ? '#C4004C' : '#E0326D',
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: 8,
        },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: isLight ? '#FFFFFF' : '#1A1A1A',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isLight ? '#E0E0E0' : '#3A3A3A',
            borderWidth: '1.5px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isLight ? '#BBBBBB' : '#555555',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: isLight ? '#000000' : '#FFFFFF',
            borderWidth: '2px',
          },
        },
        input: {
          padding: '10px 14px',
          fontSize: '0.875rem',
          color: isLight ? '#000000' : '#FFFFFF',
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          color: isLight ? '#666666' : '#AAAAAA',
          '&.Mui-focused': {
            color: isLight ? '#000000' : '#FFFFFF',
          },
        },
      },
    },

    MuiSelect: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: isLight ? '1.5px solid #EBEBEB' : '1.5px solid #2A2A2A',
          backgroundColor: isLight ? '#FFFFFF' : '#1A1A1A',
          boxShadow: 'none',
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundImage: 'none',
        },
        outlined: {
          border: isLight ? '1.5px solid #EBEBEB' : '1.5px solid #2A2A2A',
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: isLight ? '#EBEBEB' : '#2A2A2A',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.8125rem',
          fontWeight: 500,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: isLight ? '1.5px solid #EBEBEB' : '1.5px solid #2A2A2A',
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          backgroundImage: 'none',
        },
      },
    },

    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: 4000,
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: isLight ? '1px solid #EBEBEB' : '1px solid #2A2A2A',
          fontSize: '0.875rem',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          fontSize: '0.8125rem',
          color: isLight ? '#666666' : '#AAAAAA',
          backgroundColor: isLight ? '#FAFAFA' : '#141414',
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
          fontWeight: 500,
          backgroundColor: isLight ? '#000000' : '#FFFFFF',
          color: isLight ? '#FFFFFF' : '#000000',
        },
        arrow: {
          color: isLight ? '#000000' : '#FFFFFF',
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 4 },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: isLight ? '#FFFFFF' : '#0F0F0F',
          borderBottom: isLight ? '1.5px solid #EBEBEB' : '1.5px solid #2A2A2A',
          color: isLight ? '#000000' : '#FFFFFF',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: 48,
        },
      },
    },
  };
};

// ─── Light theme ──────────────────────────────────────────────────────────────
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#000000', contrastText: '#FFFFFF' },
    secondary: { main: '#444444', contrastText: '#FFFFFF' },
    background: { default: '#FAFAFA', paper: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', disabled: '#BBBBBB' },
    divider: '#EBEBEB',
    error: { main: '#EA005A', contrastText: '#FFFFFF' },
    action: {
      hover: 'rgba(0,0,0,0.04)',
      selected: 'rgba(0,0,0,0.08)',
      disabled: 'rgba(0,0,0,0.26)',
      disabledBackground: 'rgba(0,0,0,0.06)',
    },
  },
  typography,
  shape,
  components: componentOverrides('light'),
});

// ─── Dark theme ───────────────────────────────────────────────────────────────
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FFFFFF', contrastText: '#000000' },
    secondary: { main: '#AAAAAA', contrastText: '#000000' },
    background: { default: '#0F0F0F', paper: '#1A1A1A' },
    text: { primary: '#FFFFFF', secondary: '#AAAAAA', disabled: '#555555' },
    divider: '#2A2A2A',
    error: { main: '#FF4D8D', contrastText: '#FFFFFF' },
    action: {
      hover: 'rgba(255,255,255,0.08)',
      selected: 'rgba(255,255,255,0.12)',
      disabled: 'rgba(255,255,255,0.26)',
      disabledBackground: 'rgba(255,255,255,0.06)',
    },
  },
  typography,
  shape,
  components: componentOverrides('dark'),
});
