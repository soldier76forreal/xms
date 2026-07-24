import { createTheme } from '@mui/material/styles';

// ─── Shared tokens ────────────────────────────────────────────────────────────
// "YekanRegular" (already bundled — index.css @font-face, dana-*.woff) covers
// Persian AND Arabic glyphs properly; Inter falls back to tofu/missing glyphs
// for both scripts. Prepended only for fa/ar so Latin text still prefers Inter.
const fontStack = (lang) =>
  lang === 'fa' || lang === 'ar'
    ? '"YekanRegular", "Inter", "Roboto", sans-serif'
    : '"Inter", "Roboto", sans-serif';

const buildTypography = (lang) => ({
  fontFamily: fontStack(lang),
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
});

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
        // html gets the background too: index.css pins body to height:100%, so
        // content scrolled past the first viewport otherwise exposes the html
        // element behind it — which rendered WHITE even in dark mode.
        html: {
          backgroundColor: isLight ? '#FAFAFA' : '#060606',
        },
        body: {
          backgroundColor: isLight ? '#FAFAFA' : '#060606',
          color: isLight ? '#000000' : '#FFFFFF',
        },
        // The CRA mount node sits between body and the app — give it the theme
        // background + full height so it can never show through as white.
        '#root': {
          backgroundColor: isLight ? '#FAFAFA' : '#060606',
          minHeight: '100vh',
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
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.05)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isLight ? '#E0E0E0' : 'rgba(255,255,255,0.1)',
            borderWidth: '1.5px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: isLight ? '#BBBBBB' : 'rgba(255,255,255,0.22)',
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
          color: isLight ? '#666666' : 'rgba(255,255,255,0.45)',
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
          border: isLight ? '1.5px solid #EBEBEB' : '1.5px solid rgba(255,255,255,0.1)',
          backgroundColor: isLight ? '#FFFFFF' : '#181818',
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
          border: isLight ? '1.5px solid #EBEBEB' : '1.5px solid rgba(255,255,255,0.1)',
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: isLight ? '#EBEBEB' : 'rgba(255,255,255,0.07)',
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
          border: isLight ? '1.5px solid #EBEBEB' : '1.5px solid rgba(255,255,255,0.1)',
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
          borderBottom: isLight ? '1px solid #EBEBEB' : '1px solid rgba(255,255,255,0.07)',
          fontSize: '0.875rem',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          fontSize: '0.8125rem',
          color: isLight ? '#666666' : 'rgba(255,255,255,0.45)',
          backgroundColor: isLight ? '#FAFAFA' : '#111111',
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
          backgroundColor: isLight ? '#FFFFFF' : '#0d0d0d',
          borderBottom: isLight ? '1.5px solid #EBEBEB' : '1.5px solid rgba(255,255,255,0.07)',
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
// `direction` ('ltr' | 'rtl') is threaded through for Farsi/Arabic — MUI flips
// component defaults (Drawer anchor, icon margins, etc.) off this flag.
export const createLightTheme = (direction = 'ltr', lang = 'en') => createTheme({
  direction,
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
  typography: buildTypography(lang),
  shape,
  components: componentOverrides('light'),
});

// ─── Dark theme ───────────────────────────────────────────────────────────────
export const createDarkTheme = (direction = 'ltr', lang = 'en') => createTheme({
  direction,
  palette: {
    mode: 'dark',
    primary: { main: '#FFFFFF', contrastText: '#000000' },
    secondary: { main: '#AAAAAA', contrastText: '#000000' },
    // Dark tiers per the documented design language: app #060606 · panel #0d0d0d
    // · surface #111 · card #181818. The old values (#0F0F0F/#1A1A1A/#2A2A2A)
    // made theme-driven sections (Inventory) look mismatched next to the newer
    // hardcoded ones ("mixed theme").
    background: { default: '#060606', paper: '#111111' },
    text: { primary: '#FFFFFF', secondary: 'rgba(255,255,255,0.45)', disabled: 'rgba(255,255,255,0.2)' },
    divider: 'rgba(255,255,255,0.07)',
    error: { main: '#FF4D8D', contrastText: '#FFFFFF' },
    action: {
      hover: 'rgba(255,255,255,0.08)',
      selected: 'rgba(255,255,255,0.12)',
      disabled: 'rgba(255,255,255,0.26)',
      disabledBackground: 'rgba(255,255,255,0.06)',
    },
  },
  typography: buildTypography(lang),
  shape,
  components: componentOverrides('dark'),
});
