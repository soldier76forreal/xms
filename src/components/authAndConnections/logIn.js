import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckIcon from '@mui/icons-material/Check';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from './auth';
import AxiosGlobal from './axiosGlobalUrl';
import LanguageCtx from '../../contextApi/languageContext';
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
const POST_LOGIN_REDIRECT_KEY = 'xms_postLoginRedirect';

// After a short link bounces a logged-out visitor here, ShortLinkResolver
// stashes where to send them back to. Consumed once, on the next successful
// login, from either step (OTP or the password fallback).
const consumePostLoginRedirect = () => {
  const dest = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  return dest || '/';
};

const LogIn = () => {
  const { t }       = useTranslation();
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const history     = useHistory();
  const { language, setLanguage, languages } = useContext(LanguageCtx);
  const [langAnchor, setLangAnchor] = useState(null);

  const [step,     setStep]     = useState('phone');   // 'phone' | 'code' | 'password'
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    if (!phone.trim()) { setError(t('auth.errPhoneRequired')); return; }
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
        setError(msg || t('auth.errAccountLocked'));
      } else if (status === 429) {
        const s = err?.response?.data?.cooldownSeconds;
        if (s) startCooldown(s);
        setError(msg || t('auth.errTooManyRequests'));
      } else if (status === 404) {
        setError(t('auth.errNotRegistered'));
      } else if (status === 403) {
        setError(t('auth.errAccountInactive'));
      } else {
        setError(msg || t('auth.errSendCodeFailed'));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) { setError(t('auth.errCodeIncomplete')); return; }
    setBusy(true); setError(''); setAttLeft(null);
    try {
      const res = await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.authTargetApi}/auth/verifyOtp`,
        data: { phoneNumber: phone.trim(), otp },
      });
      authCtx.login(res.data.accessToken);
      history.push(consumePostLoginRedirect());
    } catch (err) {
      const status = err?.response?.status;
      const data   = err?.response?.data;
      if (status === 423) {
        setLocked({ until: data?.lockedUntil });
        setError(data?.message || t('auth.errAccountLocked'));
      } else if (status === 400 && data?.attemptsLeft !== undefined) {
        setAttLeft(data.attemptsLeft);
        setError(data?.message || t('auth.errIncorrectCode'));
      } else if (status === 400) {
        setError(data?.message || t('auth.errInvalidOrExpiredCode'));
      } else {
        setError(data?.message || t('auth.errServerRetry'));
      }
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setBusy(false);
    }
  };

  // Password fallback (reinstated 2026-07-11) — for users who can't receive
  // the OTP SMS. Same lockout as OTP; 10 attempts instead of 5.
  const handlePasswordLogin = async () => {
    if (!phone.trim())    { setError(t('auth.errPhoneRequired'));    return; }
    if (!password)        { setError(t('auth.errPasswordRequired')); return; }
    setBusy(true); setError(''); setAttLeft(null);
    try {
      const res = await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.authTargetApi}/auth/loginPassword`,
        data: { phoneNumber: phone.trim(), password },
      });
      authCtx.login(res.data.accessToken);
      history.push(consumePostLoginRedirect());
    } catch (err) {
      const status = err?.response?.status;
      const data   = err?.response?.data;
      if (status === 423) {
        setLocked({ until: data?.lockedUntil });
        setError(data?.message || t('auth.errAccountLocked'));
      } else if (status === 400 && data?.attemptsLeft !== undefined) {
        setAttLeft(data.attemptsLeft);
        setError(data?.message || t('auth.errIncorrectPassword'));
      } else if (status === 404) {
        setError(t('auth.errNotRegistered'));
      } else if (status === 403) {
        setError(t('auth.errAccountInactive'));
      } else {
        setError(data?.message || t('auth.errServerRetry'));
      }
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
      setError(data?.message || t('auth.errResendFailed'));
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: BG, px: { xs: 2, sm: 0 }, position: 'relative' }}>
      {/* Language switcher — the ONLY way to change language before logging in,
          since the in-app rail/drawer picker isn't reachable yet. */}
      <IconButton
        onClick={(e) => setLangAnchor(e.currentTarget)}
        sx={{ position: 'fixed', top: 16, insetInlineEnd: 16, color: TEXT_SEC,
          border: `1px solid ${INPUT_BD}`, borderRadius: '10px', width: 36, height: 36,
          '&:hover': { color: TEXT_PRI, bgcolor: INPUT_BG } }}
      >
        <TranslateIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu
        anchorEl={langAnchor}
        open={Boolean(langAnchor)}
        onClose={() => setLangAnchor(null)}
        PaperProps={{ sx: { bgcolor: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', minWidth: 160 } }}
      >
        {languages.map((l) => {
          const active = l.code === language;
          return (
            <MenuItem key={l.code} dense
              onClick={() => { setLanguage(l.code); setLangAnchor(null); }}
              sx={{ fontSize: '0.82rem', gap: 1 }}>
              <Box sx={{ flexGrow: 1 }}>{l.nativeLabel}</Box>
              {active && <CheckIcon sx={{ fontSize: 15 }} />}
            </MenuItem>
          );
        })}
      </Menu>

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
              {t('auth.enterMobileNumber')}
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
                placeholder={t('auth.phonePlaceholder')}
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
                {t('auth.accountLockedRemaining', { time: lockRemaining() })}
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
              {busy ? t('auth.sending') : t('auth.sendCode')}
            </Button>

            {/* Password fallback — for users who can't receive the SMS */}
            <Typography
              onClick={() => { setStep('password'); setError(''); setAttLeft(null); }}
              sx={{ fontSize: '0.75rem', color: TEXT_SEC, textAlign: 'center', cursor: 'pointer',
                '&:hover': { color: TEXT_PRI, textDecoration: 'underline' } }}>
              {t('auth.cantReceiveCode')}
            </Typography>
          </>
        )}

        {/* ── PASSWORD STEP (fallback when OTP SMS can't be received) ───────── */}
        {step === 'password' && (
          <>
            <Typography variant="body2" sx={{ color: TEXT_SEC, textAlign: 'center', lineHeight: 1.7 }}>
              {t('auth.signInWithPhoneAndPassword')}
            </Typography>

            <TextField
              fullWidth size="small"
              placeholder={t('auth.phonePlaceholder')}
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(''); setLocked(null); }}
              inputProps={{ inputMode: 'numeric', dir: 'ltr' }}
              sx={inputSx}
              autoFocus={!phone}
            />

            <TextField
              fullWidth size="small"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.password')}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
              inputProps={{ dir: 'ltr' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      edge="end"
                      sx={{ color: TEXT_SEC }}
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
              autoFocus={!!phone}
            />

            {locked && (
              <Typography variant="caption" sx={{ color: ERR_CLR, textAlign: 'center', display: 'block' }}>
                {t('auth.accountLockedRemaining', { time: lockRemaining() })}
              </Typography>
            )}
            {error && !locked && (
              <Typography variant="caption" sx={{ color: ERR_CLR, textAlign: 'center', display: 'block' }}>
                {error}{attLeft !== null ? ` ${t('auth.attemptsLeft', { count: attLeft })}` : ''}
              </Typography>
            )}

            <Button
              fullWidth variant="contained" onClick={handlePasswordLogin}
              disabled={busy || !!locked}
              startIcon={busy ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{
                bgcolor: BTN_BG, color: BTN_CLR, fontWeight: 700, borderRadius: '10px', py: '9px',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.88)' },
                '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.25)' },
              }}
            >
              {busy ? t('auth.signingIn') : t('auth.signIn')}
            </Button>

            <Typography
              onClick={() => { setStep('phone'); setPassword(''); setShowPassword(false); setError(''); setAttLeft(null); }}
              sx={{ fontSize: '0.75rem', color: TEXT_SEC, textAlign: 'center', cursor: 'pointer',
                '&:hover': { color: TEXT_PRI, textDecoration: 'underline' } }}>
              {t('auth.useCodeInstead')}
            </Typography>
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
                    {t('auth.attemptsRemaining', { count: attLeft })}
                  </Typography>
                )}
              </Box>
            )}

            {locked && (
              <Typography variant="caption" sx={{ color: ERR_CLR, textAlign: 'center', display: 'block' }}>
                {t('auth.accountLockedRemaining', { time: lockRemaining() })}
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
              {busy ? t('auth.verifying') : t('auth.verify')}
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
                {cooldown > 0 ? t('auth.resendCodeIn', { seconds: cooldown }) : t('auth.resendCode')}
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
                {t('auth.changeNumber')}
              </Button>
            </Box>

            {/* Password fallback — reachable right where a missing SMS is noticed */}
            <Typography
              onClick={() => { setStep('password'); setError(''); setAttLeft(null); setDigits(Array(OTP_LENGTH).fill('')); }}
              sx={{ fontSize: '0.75rem', color: TEXT_SEC, textAlign: 'center', cursor: 'pointer',
                '&:hover': { color: TEXT_PRI, textDecoration: 'underline' } }}>
              {t('auth.cantReceiveCode')}
            </Typography>
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
