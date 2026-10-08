import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DesktopWindowsOutlinedIcon from '@mui/icons-material/DesktopWindowsOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import RefreshIcon from '@mui/icons-material/Refresh';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { productPageUrl, websiteBase } from './productPageUrl';

// The product page exactly as a visitor will see it: the website's OWN page in a
// frame, not a look-alike. The form's current content (saved or not) is posted as a
// short-lived preview, and the page is opened with the token that points at it
// (?xms-preview=<token>), so what is on screen is the real template, the real
// gallery and varieties table, the real language and branch handling.
//
// The page refreshes a moment after you stop typing (never more than once every few
// seconds - every reload asks the website for its catalog again), and on demand.
// Without write access there is no token to make, so a PUBLISHED record is shown
// as it is on the site and a draft explains why it can't be.

const DEVICES = { desktop: 1280, tablet: 820, phone: 390 };
const IDLE_MS = 2200;          // quiet time after the last edit before the page reloads
const MIN_GAP_MS = 4000;       // ...and never more often than this

export default function ProductPagePreview({
  payload, contentId, published = false, canPreview = true, lang: langProp = 'en',
  preferredBranchIds = [], active = true, onLangChange,
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const base = useMemo(() => websiteBase(axiosGlobal), [axiosGlobal]);

  const T = {
    BD: isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
    CTRL_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.5)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.38)',
    STAGE: isDark ? '#050505' : '#e9ebef',
  };

  const [branches, setBranches] = useState([]);
  const [branchSlug, setBranchSlug] = useState('');
  const [branchChosen, setBranchChosen] = useState(false);     // the person picked one: stop choosing for them
  const [lang, setLang] = useState(langProp);
  const [device, setDevice] = useState('desktop');
  const [token, setToken] = useState('');
  const [bust, setBust] = useState(0);
  const [phase, setPhase] = useState('idle');            // idle | saving | loading | ready | error
  const [error, setError] = useState('');
  const [box, setBox] = useState({ w: 0, h: 0 });
  const stageRef = useRef(null);
  const lastPush = useRef(0);
  const tokenRef = useRef('');
  const pushing = useRef(false);

  useEffect(() => { setLang(langProp); }, [langProp]);

  // the website's branches (their URL slugs decide which branch's stock the page shows)
  useEffect(() => {
    let alive = true;
    fetch(`${axiosGlobal.defaultTargetApi}/public/website/branches`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body) => { if (alive) setBranches(body.data || []); })
      .catch(() => { /* the page still opens on the default branch */ });
    return () => { alive = false; };
  }, [axiosGlobal.defaultTargetApi]);

  // Until a branch is picked by hand, show the one that actually has this product in stock
  // (which can only be known once inventory has answered, after the page first opens).
  const preferredKey = preferredBranchIds.map(String).join(',');
  useEffect(() => {
    if (branchChosen || !branches.length) return;
    const stocked = branches.find((b) => preferredKey.split(',').includes(String(b._id)));
    setBranchSlug((stocked || branches[0]).websiteSlug || '');
  }, [branches, preferredKey, branchChosen]);

  // measure the stage so the page can be drawn at a real device width and scaled to fit
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    observer.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  // ── keep the preview current ──────────────────────────────────────────────
  const payloadKey = useMemo(() => JSON.stringify(payload || {}), [payload]);
  const push = useCallback(async () => {
    if (!canPreview || pushing.current) return;
    pushing.current = true;
    lastPush.current = Date.now();
    setPhase((p) => (p === 'ready' ? 'saving' : 'loading'));
    try {
      const res = await authCtx.jwtInst({
        method: 'post', url: `${axiosGlobal.defaultTargetApi}/digitalMarketing/product-content/preview`,
        data: { ...(payload || {}), id: contentId || undefined, token: tokenRef.current || undefined },
      });
      tokenRef.current = res.data.token;
      setToken(res.data.token);
      setBust((n) => n + 1);
      setError('');
    } catch (err) {
      setError((err && err.response && err.response.data && err.response.data.message) || t('dm.pcPreviewFailed'));
      setPhase('error');
    } finally {
      pushing.current = false;
    }
  }, [authCtx, axiosGlobal.defaultTargetApi, canPreview, contentId, payload, t]);

  useEffect(() => {
    if (!active || !canPreview) return undefined;
    const sinceLast = Date.now() - lastPush.current;
    const first = !tokenRef.current;
    const wait = first ? 0 : Math.max(IDLE_MS, MIN_GAP_MS - sinceLast);
    const timer = setTimeout(push, wait);
    return () => clearTimeout(timer);
  }, [payloadKey, active, canPreview]);   // eslint-disable-line react-hooks/exhaustive-deps

  const slug = (payload && (payload.slug || payload.code)) || '';
  const url = useMemo(() => {
    if (canPreview) {
      if (!token) return '';
      return productPageUrl({ base, branchSlug, lang, slug, token, bust });
    }
    return published && slug ? productPageUrl({ base, branchSlug, lang, slug, bust }) : '';
  }, [base, branchSlug, lang, slug, token, bust, canPreview, published]);

  const changeLang = (next) => { if (!next) return; setLang(next); if (onLangChange) onLangChange(next); };
  const reload = () => { if (canPreview) push(); else setBust((n) => n + 1); };

  const width = DEVICES[device];
  const scale = box.w ? Math.min(1, (box.w - 2) / width) : 1;
  const frameHeight = scale ? Math.max(300, Math.floor(box.h / scale)) : 600;
  const loading = phase === 'loading' || phase === 'saving';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', px: 1.25, py: 0.75, borderBottom: `1px solid ${T.BD}` }}>
        <ToggleButtonGroup size="small" exclusive value={lang} onChange={(e, v) => changeLang(v)} aria-label={t('dm.pcPreviewLanguage')}>
          {['en', 'ar', 'fa'].map((code) => (
            <ToggleButton key={code} value={code} sx={{ px: 1, py: 0.2, fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>{code}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        {branches.length > 1 && (
          <Select size="small" value={branchSlug} onChange={(e) => { setBranchChosen(true); setBranchSlug(e.target.value); }} displayEmpty
            inputProps={{ 'aria-label': t('dm.pcPreviewBranch') }}
            sx={{ height: 30, fontSize: '0.74rem', minWidth: 120, '& .MuiSelect-select': { py: 0.4 } }}>
            {branches.map((b) => <MenuItem key={b._id} value={b.websiteSlug || ''} sx={{ fontSize: '0.78rem' }}>{b.name}</MenuItem>)}
          </Select>
        )}
        <ToggleButtonGroup size="small" exclusive value={device} onChange={(e, v) => v && setDevice(v)} aria-label={t('dm.pcPreviewDevice')}>
          <ToggleButton value="desktop" sx={{ px: 0.9, py: 0.2 }} aria-label={t('dm.pcPreviewDesktop')}><DesktopWindowsOutlinedIcon sx={{ fontSize: 16 }} /></ToggleButton>
          <ToggleButton value="tablet" sx={{ px: 0.9, py: 0.2 }} aria-label={t('dm.pcPreviewTablet')}><TabletMacIcon sx={{ fontSize: 16 }} /></ToggleButton>
          <ToggleButton value="phone" sx={{ px: 0.9, py: 0.2 }} aria-label={t('dm.pcPreviewPhone')}><PhoneIphoneIcon sx={{ fontSize: 16 }} /></ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flex: 1 }} />
        {loading && <CircularProgress size={14} />}
        <Tooltip title={t('dm.pcPreviewReload')}><span><IconButton size="small" onClick={reload} disabled={!url && !canPreview} aria-label={t('dm.pcPreviewReload')}><RefreshIcon sx={{ fontSize: 18 }} /></IconButton></span></Tooltip>
        <Tooltip title={t('dm.pcPreviewOpen')}>
          <span><IconButton size="small" component="a" href={url || undefined} target="_blank" rel="noopener noreferrer" disabled={!url} aria-label={t('dm.pcPreviewOpen')}><OpenInNewIcon sx={{ fontSize: 17 }} /></IconButton></span>
        </Tooltip>
      </Box>

      <Box ref={stageRef} sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden', bgcolor: T.STAGE }}>
        {url ? (
          <Box sx={{ width: width * scale, height: '100%', mx: 'auto', overflow: 'hidden', bgcolor: '#fff',
            boxShadow: device === 'desktop' ? 'none' : '0 0 0 1px rgba(0,0,0,0.25)' }}>
            <Box component="iframe" key={`${branchSlug}-${lang}-${device}`} title={t('dm.pcPreviewTitle')} src={url}
              onLoad={() => setPhase('ready')}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              sx={{ width, height: frameHeight, border: 0, display: 'block', transform: `scale(${scale})`, transformOrigin: '0 0', bgcolor: '#fff' }} />
          </Box>
        ) : (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
            {phase === 'error' ? (
              <Box>
                <Typography sx={{ color: '#ef5350', fontSize: '0.82rem', mb: 1 }}>{error}</Typography>
                <Button size="small" onClick={push} sx={{ textTransform: 'none' }}>{t('dm.pcGalleryRetry')}</Button>
              </Box>
            ) : canPreview ? (
              <CircularProgress size={22} />
            ) : (
              <Typography sx={{ color: T.TEXT_SEC, fontSize: '0.8rem', maxWidth: 360 }}>{t('dm.pcPreviewDraftNoAccess')}</Typography>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ px: 1.25, py: 0.5, borderTop: `1px solid ${T.BD}`, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.64rem', color: T.TEXT_TER, flex: 1 }} noWrap>
          {phase === 'error' && url ? error : (canPreview ? t('dm.pcPreviewHint') : t('dm.pcPreviewLiveHint'))}
        </Typography>
      </Box>
    </Box>
  );
}
