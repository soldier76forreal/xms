import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import { useHistory } from 'react-router-dom';
import AuthContext from './auth';
import AxiosGlobal from './axiosGlobalUrl';
import { COUNTRIES, DEFAULT_COUNTRY } from '../users/countryData';

// ── Design tokens (dark/opacity shell) ────────────────────────────────────────
const BG        = '#060606';
const CARD_BG   = '#111111';
const CARD_BD   = 'rgba(255,255,255,0.08)';
const INPUT_BG  = 'rgba(255,255,255,0.05)';
const INPUT_BD  = 'rgba(255,255,255,0.12)';
const INPUT_BDF = '#ffffff';
const TEXT_PRI  = '#ffffff';
const TEXT_SEC  = 'rgba(255,255,255,0.35)';
const TEXT_TER  = 'rgba(255,255,255,0.2)';
const ERR_CLR   = '#FF4D8D';
const BTN_BG    = '#ffffff';
const BTN_CLR   = '#000000';
const RESEND_S  = 60;

const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: INPUT_BG, borderRadius: '10px', color: TEXT_PRI,
    '& fieldset':             { borderColor: INPUT_BD },
    '&:hover fieldset':       { borderColor: 'rgba(255,255,255,0.25)' },
    '&.Mui-focused fieldset': { borderColor: INPUT_BDF, borderWidth: 2 },
  },
  '& input': { color: TEXT_PRI },
  '& input::placeholder': { color: TEXT_SEC, opacity: 1 },
};

const OTP_LENGTH = 6;

const LogIn = () => {
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const history     = useHistory();

  const [step,     setStep]     = useState('phone');
  const [phone,    setPhone]    = useState('');
  const [digits,   setDigits]   = useState(Array(OTP_LENGTH).fill(''));
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState('');
  const [attLeft,  setAttLeft]  = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [locked,   setLocked]   = useState(null);

  // Country code state
  const [country,    setCountry]    = useState(DEFAULT_COUNTRY);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuSearch, setMenuSearch] = useState('');

  const inputRefs = useRef([]);
  const timerRef  = useRef(null);

  // Auto-detect country from IP on mount
  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return;
        const data  = await res.json();
        const found = COUNTRIES.find(c => c.code === data.country_code);
        if (found) setCountry(found);
      } catch { /* silent fallback to default */ }
    };
    detect();
  }, []);

  // Cooldown timer
  const startCooldown = useCallback((seconds = RESEND_S) => {
    setCooldown(seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const lockRemaining = () => {
    if (!locked) return '';
    const ms  = new Date(locked.until) - new Date();
    if (ms <= 0) { setLocked(null); return ''; }
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleSendCode = async () => {
    if (!phone.trim()) { setError('Enter your phone number'); return; }
    setBusy(true); setError('');
    try {
      await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.authTargetApi}/auth/requestOtp`,
        data: { phoneNumber: phone.trim() },
      });
      setStep('code');
      setDigits(Array(OTP_LENGTH).fill(''));
      startCooldown(RESEND_S);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message;
      if (status === 423) {
        setLocked({ until: err.response.data.lockedUntil });
        setError(msg || 'Account is locked');
      } else if (status === 429) {
        const s = err?.response?.data?.cooldownSeconds;
        if (s) startCooldown(s);
        setError(msg || 'Too many requests — please wait');
      } else if (status === 404) {
        setError('This number is not registered');
      } else if (status === 403) {
        setError('Account is not active');
      } else {
        setError(msg || 'Failed to send code — please try again');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) { setError('Enter the complete 6-digit code'); return; }
    setBusy(true); setError(''); setAttLeft(null);
    try {
      const res = await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.authTargetApi}/auth/verifyOtp`,
        data: { phoneNumber: phone.trim(), otp },
      });
      authCtx.login(res.data.accessToken);
      history.push('/');
    } catch (err) {
      const status = err?.response?.status;
      const data   = err?.response?.data;
      if (status === 423) {
        setLocked({ until: data?.lockedUntil });
        setError(data?.message || 'Account is locked');
      } else if (status === 400 && data?.attemptsLeft !== undefined) {
        setAttLeft(data.attemptsLeft);
        setError(data?.message || 'Incorrect code');
      } else if (status === 400) {
        setError(data?.message || 'Invalid or expired code');
      } else {
        setError(data?.message || 'Server error — please try again');
      }
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setBusy(true); setError(''); setAttLeft(null);
    try {
      await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.authTargetApi}/auth/requestOtp`,
        data: { phoneNumber: phone.trim() },
      });
      setDigits(Array(OTP_LENGTH).fill(''));
      startCooldown(RESEND_S);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      const status = err?.response?.status;
      const data   = err?.response?.data;
      if (status === 429) {
        const s = data?.cooldownSeconds;
        if (s) startCooldown(s);
      }
      setError(data?.message || 'Failed to resend code');
    } finally {
      setBusy(false);
    }
  };

  const handleDigitChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');
    if (char && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft'  && index > 0)            inputRefs.current[index - 1]?.focus();
    else if   (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    else if   (e.key === 'Enter')                               handleVerify();
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next   = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const filteredCountries = menuSearch.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        c.dial.includes(menuSearch)
      )
    : COUNTRIES;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: BG, px: { xs: 2, sm: 0 } }}>
      <Box sx={{
        width: '100%',
        maxWidth: 360,
        p: { xs: '24px 20px', sm: '36px 32px' },
        borderRadius: '14px',
        bgcolor: CARD_BG,
        border: `1px solid ${CARD_BD}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
      }}>
        {/* Logo */}
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: TEXT_PRI, letterSpacing: 5, textAlign: 'center', mb: 0.5 }}>
          XMS
        </Typography>

        {/* ── PHONE STEP ────────────────────────────────────────────────────── */}
        {step === 'phone' && (
          <>
            <Typography variant="body2" sx={{ color: TEXT_SEC, textAlign: 'center', lineHeight: 1.7 }}>
              Enter your mobile number
            </Typography>

            {/* Country code + phone input row */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Country picker button */}
              <Button
                onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuSearch(''); }}
                sx={{
                  flexShrink: 0, minWidth: 80,
                  px: 1.25, py: '8px',
                  borderRadius: '10px',
                  bgcolor: INPUT_BG,
                  border: `1px solid ${INPUT_BD}`,
                  color: TEXT_PRI,
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  display: 'flex', gap: 0.5, alignItems: 'center',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.25)' },
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{country.flag}</span>
                <span style={{ color: TEXT_SEC, fontSize: '0.78rem' }}>{country.dial}</span>
              </Button>

              {/* Phone number input */}
              <TextField
                fullWidth size="small"
                placeholder="09xxxxxxxxx"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(''); setLocked(null); }}
                onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                inputProps={{ inputMode: 'numeric', dir: 'ltr' }}
                sx={inputSx}
                autoFocus
              />
            </Box>

            {/* Country dropdown menu */}
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              PaperProps={{
                sx: {
                  bgcolor: '#181818', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', maxHeight: 320, minWidth: 220,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  '&::-webkit-scrollbar': { width: 4 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 },
                },
              }}
            >
              {/* Search inside the menu */}
              <Box sx={{ px: 1.5, pt: 1, pb: 0.5, position: 'sticky', top: 0, bgcolor: '#181818', zIndex: 1 }}>
                <TextField
                  size="small" fullWidth
                  placeholder="Search country…"
                  value={menuSearch}
                  onChange={e => setMenuSearch(e.target.value)}
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '8px', color: TEXT_PRI,
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                    },
                    '& input': { color: TEXT_PRI, fontSize: '0.82rem', py: '6px' },
                    '& input::placeholder': { color: TEXT_SEC, opacity: 1 },
                  }}
                />
              </Box>
              {filteredCountries.map(c => (
                <MenuItem
                  key={c.code}
                  onClick={() => { setCountry(c); setMenuAnchor(null); }}
                  selected={c.code === country.code}
                  sx={{
                    color: TEXT_PRI, fontSize: '0.85rem', gap: 1.5,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.08)' },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
                  <span style={{ flexGrow: 1 }}>{c.name}</span>
                  <span style={{ color: TEXT_TER, fontFamily: 'monospace', fontSize: '0.75rem' }}>{c.dial}</span>
                </MenuItem>
              ))}
              {filteredCountries.length === 0 && (
                <MenuItem disabled sx={{ color: TEXT_TER, fontSize: '0.82rem' }}>No match</MenuItem>
              )}
            </Menu>

            {locked && (
              <Typography variant="caption" sx={{ color: ERR_CLR, textAlign: 'center', display: 'block' }}>
                Account locked — {lockRemaining()} remaining
              </Typography>
            )}
            {error && !locked && (
              <Typography variant="caption" sx={{ color: ERR_CLR, textAlign: 'center', display: 'block' }}>
                {error}
              </Typography>
            )}

            <Button
              fullWidth variant="contained" onClick={handleSendCode}
              disabled={busy || !!locked}
              startIcon={busy ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{
                bgcolor: BTN_BG, color: BTN_CLR, fontWeight: 700, borderRadius: '10px', py: '9px',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.88)' },
                '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.25)' },
              }}
            >
              {busy ? 'Sending…' : 'Send code'}
            </Button>
          </>
        )}

        {/* ── CODE STEP ────────────────────────────────────────────────────── */}
        {step === 'code' && (
          <>
            <Typography variant="body2" sx={{ color: TEXT_SEC, textAlign: 'center', lineHeight: 1.7 }}>
              Enter the 6-digit code sent to
              <Box component="span" sx={{ color: TEXT_PRI, mx: 0.5, fontFamily: 'monospace' }}>
                {country.flag} {phone}
              </Box>
            </Typography>

            {/* 6-box OTP input */}
            <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1 }, justifyContent: 'center', direction: 'ltr' }}>
              {digits.map((d, i) => (
                <TextField
                  key={i}
                  inputRef={el => { inputRefs.current[i] = el; }}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i, e)}
                  onPaste={i === 0 ? handleDigitPaste : undefined}
                  inputProps={{ maxLength: 1, inputMode: 'numeric',
                    // color forced inline: the login page is always dark-styled, but the
                    // app theme may be LIGHT — the global MuiOutlinedInput override would
                    // otherwise paint these digits black-on-dark (invisible)
                    style: { textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, padding: '8px 0', color: '#ffffff' } }}
                  sx={{
                    width: { xs: 40, sm: 44 },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: INPUT_BG, borderRadius: '8px', color: TEXT_PRI,
                      '& fieldset':             { borderColor: d ? 'rgba(255,255,255,0.4)' : INPUT_BD },
                      '&:hover fieldset':       { borderColor: 'rgba(255,255,255,0.3)' },
                      '&.Mui-focused fieldset': { borderColor: INPUT_BDF, borderWidth: 2 },
                    },
                  }}
                />
              ))}
            </Box>

            {error && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: ERR_CLR, display: 'block' }}>{error}</Typography>
                {attLeft !== null && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', mt: 0.5 }}>
                    {attLeft} attempt{attLeft !== 1 ? 's' : ''} remaining
                  </Typography>
                )}
              </Box>
            )}

            {locked && (
              <Typography variant="caption" sx={{ color: ERR_CLR, textAlign: 'center', display: 'block' }}>
                Account locked — {lockRemaining()} remaining
              </Typography>
            )}

            <Button
              fullWidth variant="contained"
              onClick={handleVerify}
              disabled={busy || digits.join('').length < OTP_LENGTH || !!locked}
              startIcon={busy ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{
                bgcolor: BTN_BG, color: BTN_CLR, fontWeight: 700, borderRadius: '10px', py: '9px',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.88)' },
                '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.25)' },
              }}
            >
              {busy ? 'Verifying…' : 'Verify'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                size="small" onClick={handleResend}
                disabled={cooldown > 0 || busy}
                sx={{
                  color: cooldown > 0 ? TEXT_TER : 'rgba(255,255,255,0.5)',
                  fontSize: '0.72rem', textTransform: 'none', p: 0, minWidth: 0,
                  '&:hover': { bgcolor: 'transparent', color: TEXT_PRI },
                  '&.Mui-disabled': { color: TEXT_TER },
                }}
              >
                {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
              </Button>

              <Button
                size="small"
                onClick={() => { setStep('phone'); setError(''); setAttLeft(null); setLocked(null); setDigits(Array(OTP_LENGTH).fill('')); }}
                sx={{
                  color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem',
                  textTransform: 'none', p: 0, minWidth: 0,
                  '&:hover': { bgcolor: 'transparent', color: TEXT_PRI },
                }}
              >
                Change number
              </Button>
            </Box>
          </>
        )}

        <Typography variant="caption" sx={{ color: TEXT_TER, textAlign: 'center', mt: 0.5 }}>
          XCAPITAL
        </Typography>
      </Box>
    </Box>
  );
};

export default LogIn;
