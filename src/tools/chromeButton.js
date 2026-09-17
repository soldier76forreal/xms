import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

// "Breathing Metal Chrome" — the app-wide visual convention for AI/Analytics
// buttons (see CLAUDE.md's THEME SYSTEM section). Originally defined inline in
// inventory.js's "Full Analytics" button; extracted here so every section's
// Analytics trigger shares the exact same animation instead of re-pasting the
// keyframes per file.
export const CHROME_SX = {
  '@keyframes chromePulse': {
    '0%, 100%': { backgroundPosition: '0% 50%' },
    '50%':      { backgroundPosition: '100% 50%' },
  },
  background: 'linear-gradient(90deg, #9e9e9e, #ffffff, #bdbdbd, #e0e0e0, #9e9e9e)',
  backgroundSize: '300% auto',
  animation: 'chromePulse 3s ease infinite',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 700,
  display: 'inline',
};

// Full, ready-to-drop trigger button — same markup as Inventory's original,
// now reusable by every section's Analytics overlay.
export default function ChromeButton({ label, onClick, size = 'small', sx }) {
  return (
    <Button
      size={size} variant="outlined" onClick={onClick}
      startIcon={<AutoGraphIcon sx={{ fontSize: 15 }} />}
      sx={{
        borderRadius: 2, border: '1px solid #9e9e9e',
        color: 'text.primary', fontSize: '0.72rem',
        position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,#9e9e9e 0%,#ffffff 30%,#bdbdbd 50%,#ffffff 70%,#9e9e9e 100%)',
          backgroundSize: '300% auto', opacity: 0.15,
          animation: 'chromePulse 3s ease infinite',
        },
        '@keyframes chromePulse': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        ...sx,
      }}
    >
      <Box component="span" sx={CHROME_SX}>{label}</Box>
    </Button>
  );
}
