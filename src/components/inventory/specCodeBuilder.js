import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { actions } from '../../store/store';
import {
  GRADES, CUT_NAMES, FILL_NAMES, FINISH_NAMES, buildStoneCode, parseStoneCode,
} from './util/codeParser';

// Specification -> variety code: the other way in to a stone variety.
//
// A variety is normally picked by its code (search, click). Here someone who only knows
// WHAT they need - quality, length, width, thickness, cut / fill / finish - enters that
// and gets the code (XX##GLLLLWWTT[VC][FU][PH]). If the variety exists in the product it
// is picked from stock; if it doesn't, it can be added to the product on the spot and
// used. One component for every form that picks varieties: the host says how to search
// products, which product is fixed (if one is), and whether adding is allowed.
//
//   searchProducts(term)  -> products, each { _id, code, name, defaultUnit, variants: [...] }
//   fixedProduct          -> a product that is already decided (no picker), with `variants`
//                            or a loadVariants(product) that returns them
//   canCreate             -> may add a variety to the product (permission + it is OUR catalogue)
//   onUse(product, variant) -> a variety was found / created and should be used
//   onCreated(product, variant) -> a variety was added (the host refreshes its own lists)
//   usedCodes             -> Set of codes already on the document (shown, not blocked)
//   showInventory         -> show the found variety's stock and list price (off for forms that are
//                            not about stock on hand: supply deal letters, packing lists)

const GRADE_CODES = Object.keys(GRADES);
const ALL = '';
const EMPTY = { grade: 'Q', lengthCm: '', widthCm: '', thicknessMm: '', unsized: false, cut: ALL, fill: ALL, finish: ALL };
const UNITS = ['M2', 'ML', 'PCS'];

const fmtQty = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SpecCodeBuilder({
  searchProducts, fixedProduct = null, loadVariants = null, canCreate = false, onUse, onCreated,
  usedCodes = null, noPermissionHint = '', showInventory = true,
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const T = {
    BD: isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider,
    CTRL_BG: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.88)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.5)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)',
  };
  const field = { '& .MuiOutlinedInput-root': { bgcolor: T.CTRL_BG, borderRadius: '8px', fontSize: '0.8rem' }, '& .MuiInputLabel-root': { fontSize: '0.78rem' } };
  // A menu belongs above whatever surface opened it. This builder is used inside drawers
  // that are themselves raised over a dialog, where a default-level popper would paint
  // underneath them - invisibly, with no error (the MUI portal trap in CLAUDE.md).
  const above = { zIndex: (th) => th.zIndex.modal + 2 };
  const menuAbove = { MenuProps: { sx: above } };

  // The product is the host's (fixedProduct, read straight from props so a refreshed variety
  // list reaches us) or the one picked here.
  const [picked, setPicked] = useState(null);
  const product = fixedProduct || picked;
  const [term, setTerm] = useState('');
  const [options, setOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loaded, setLoaded] = useState(null);                  // variants fetched for a fixed product
  const [spec, setSpec] = useState(EMPTY);
  const [unit, setUnit] = useState('M2');
  const [added, setAdded] = useState([]);                      // varieties created here, before the host refreshes
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // The host passes these as plain props (usually new function/object identities every
  // render), so they are read through refs and the effects below key on the product's id.
  const searchRef = useRef(searchProducts);
  searchRef.current = searchProducts;
  const variantsRef = useRef(loadVariants);
  variantsRef.current = loadVariants;
  const fixedKey = fixedProduct ? String(fixedProduct._id) : '';

  // product search (only when the host did not fix the product)
  useEffect(() => {
    if (fixedProduct) return undefined;
    let alive = true;
    setLoadingProducts(true);
    const timer = setTimeout(async () => {
      try {
        const rows = await searchRef.current(term);
        if (alive) setOptions(Array.isArray(rows) ? rows : []);
      } catch (_) { if (alive) setOptions([]); }
      if (alive) setLoadingProducts(false);
    }, 300);
    return () => { alive = false; clearTimeout(timer); };
  }, [term, fixedKey]);   // eslint-disable-line react-hooks/exhaustive-deps

  // a fixed product whose varieties come from somewhere else (Supply's own lookup)
  const productKey = product ? String(product._id) : '';
  useEffect(() => {
    let alive = true;
    setLoaded(null);
    if (product && !product.variants && variantsRef.current) {
      Promise.resolve(variantsRef.current(product)).then((rows) => { if (alive) setLoaded(rows || []); }).catch(() => { if (alive) setLoaded([]); });
    }
    return () => { alive = false; };
  }, [productKey]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (product && product.defaultUnit) setUnit(product.defaultUnit); }, [productKey]);   // eslint-disable-line react-hooks/exhaustive-deps

  const variants = useMemo(() => {
    const base = (product && (product.variants || loaded)) || [];
    const seen = new Set(base.map((v) => String(v.code).toUpperCase()));
    return [...base, ...added.filter((v) => !seen.has(String(v.code).toUpperCase()))];
  }, [product, loaded, added]);

  // ── the code ───────────────────────────────────────────────────────────────
  const built = useMemo(() => buildStoneCode({
    productCode: product && product.code, grade: spec.grade, lengthCm: spec.lengthCm, widthCm: spec.widthCm,
    thicknessMm: spec.thicknessMm, unsized: spec.unsized, cut: spec.cut, fill: spec.fill, finish: spec.finish,
  }), [product, spec]);
  const code = built.code;
  const parsed = useMemo(() => (code ? parseStoneCode(code) : null), [code]);
  const match = useMemo(() => (code ? variants.find((v) => String(v.code).toUpperCase() === code) : null), [code, variants]);

  // sizes / qualities that already exist in this product, one click to load
  const existing = useMemo(() => {
    const seen = new Set();
    return variants.map((v) => ({ v, p: parseStoneCode(v.code) })).filter(({ p }) => p && p.valid)
      .filter(({ v }) => { const k = String(v.code).toUpperCase(); if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 12);
  }, [variants]);

  const set = (name) => (e) => { setError(''); setSpec((s) => ({ ...s, [name]: e.target.value })); };
  const load = (p) => {
    setError('');
    setSpec({
      grade: p.grade, unsized: p.unsized, lengthCm: p.unsized ? '' : String(p.lengthCm), widthCm: p.unsized ? '' : String(p.widthCm),
      thicknessMm: String(p.thicknessMm), cut: p.cut || ALL, fill: p.fill || ALL, finish: p.finish || ALL,
    });
  };

  // NB not named use*: eslint's rules-of-hooks reads any use-prefixed function as a Hook.
  const handOver = (variant) => { if (onUse && product) onUse(product, variant); };

  const createAndUse = async () => {
    if (!product || !code) return;
    setBusy(true);
    setError('');
    try {
      const res = await authCtx.jwtInst({
        method: 'post', url: `${axiosGlobal.defaultTargetApi}/inventory/variants`,
        data: { code, productId: product._id, unit },
      });
      const doc = res.data.data;
      const variant = {
        _id: doc._id, code: doc.code, unit: doc.unit, quantity: doc.quantity != null ? doc.quantity : 0,
        price: doc.price != null ? doc.price : null, spec: doc.spec,
      };
      setAdded((list) => [...list, variant]);
      dispatch(actions.setShowSnackBar({ status: true, type: 'success', msg: t('inventory.specCreated', { code: doc.code, product: product.name || product.code }) }));
      if (onCreated) onCreated(product, variant);
      handOver(variant);
    } catch (err) {
      const data = err && err.response && err.response.data;
      setError(err && err.response && err.response.status === 403
        ? t('inventory.specNoPermission')
        : (data && data.message) || t('inventory.specCreateFailed'));
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (name) => Boolean(built.errors[name]) && String(spec[name] ?? '') !== '';
  const nothingEntered = !spec.lengthCm && !spec.widthCm && !spec.thicknessMm && !spec.unsized;

  return (
    <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Typography sx={{ fontSize: '0.72rem', color: T.TEXT_TER }}>{t('inventory.specIntro')}</Typography>

      {!fixedProduct && (
        <Autocomplete size="small" options={product && !options.some((o) => String(o._id) === String(product._id)) ? [product, ...options] : options}
          loading={loadingProducts} value={product} filterOptions={(x) => x}
          slotProps={{ popper: { sx: above } }}
          getOptionLabel={(p) => (p ? `${p.name || p.code} (${p.code})` : '')}
          isOptionEqualToValue={(a, b) => String(a._id) === String(b._id)}
          onChange={(e, p) => { setPicked(p); setError(''); }}
          onInputChange={(e, text, reason) => { if (reason === 'input') setTerm(text); }}
          noOptionsText={t('inventory.specNoProducts')}
          renderInput={(params) => (
            <TextField {...params} label={t('inventory.specProduct')} placeholder={t('inventory.specProductPlaceholder')} sx={field}
              InputProps={{ ...params.InputProps, endAdornment: (<>{loadingProducts ? <CircularProgress size={14} /> : null}{params.InputProps.endAdornment}</>) }} />
          )} />
      )}
      {fixedProduct && (
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI }}>
          {fixedProduct.name || fixedProduct.code} <Box component="span" sx={{ fontFamily: 'monospace', color: T.TEXT_TER }}>{fixedProduct.code}</Box>
        </Typography>
      )}

      {product && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1, alignItems: 'start' }}>
            <TextField select size="small" label={t('inventory.specQuality')} value={spec.grade} onChange={set('grade')} sx={field} SelectProps={menuAbove}>
              {GRADE_CODES.map((g) => <MenuItem key={g} value={g} sx={{ fontSize: '0.8rem' }}>{g} - {GRADES[g].name}</MenuItem>)}
            </TextField>
            <TextField size="small" type="number" label={t('inventory.specLength')} value={spec.lengthCm} onChange={set('lengthCm')}
              disabled={spec.unsized} error={fieldError('lengthCm')} inputProps={{ min: 0, step: '0.1' }}
              helperText={fieldError('lengthCm') ? t('inventory.specErrLength') : ' '} sx={field} />
            <TextField size="small" type="number" label={t('inventory.specWidth')} value={spec.widthCm} onChange={set('widthCm')}
              disabled={spec.unsized} error={fieldError('widthCm')} inputProps={{ min: 0, step: '1' }}
              helperText={fieldError('widthCm') ? t('inventory.specErrWidth') : ' '} sx={field} />
            <TextField size="small" type="number" label={t('inventory.specThickness')} value={spec.thicknessMm} onChange={set('thicknessMm')}
              error={fieldError('thicknessMm')} inputProps={{ min: 0, step: '1' }}
              helperText={fieldError('thicknessMm') ? t('inventory.specErrThickness') : ' '} sx={field} />
          </Box>
          <FormControlLabel sx={{ mt: -1, '& .MuiFormControlLabel-label': { fontSize: '0.74rem', color: T.TEXT_SEC } }}
            control={<Checkbox size="small" checked={spec.unsized} onChange={(e) => { setError(''); setSpec((s) => ({ ...s, unsized: e.target.checked })); }} />}
            label={t('inventory.specUnsized')} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
            <TextField select size="small" label={t('inventory.specCut')} value={spec.cut} onChange={set('cut')} sx={field} SelectProps={menuAbove}>
              <MenuItem value={ALL} sx={{ fontSize: '0.8rem' }}>{t('inventory.specNotSpecified')}</MenuItem>
              {Object.entries(CUT_NAMES).map(([k, name]) => <MenuItem key={k} value={k} sx={{ fontSize: '0.8rem' }}>{name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label={t('inventory.specFill')} value={spec.fill} onChange={set('fill')} sx={field} SelectProps={menuAbove}>
              <MenuItem value={ALL} sx={{ fontSize: '0.8rem' }}>{t('inventory.specNotSpecified')}</MenuItem>
              {Object.entries(FILL_NAMES).map(([k, name]) => <MenuItem key={k} value={k} sx={{ fontSize: '0.8rem' }}>{name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label={t('inventory.specFinish')} value={spec.finish} onChange={set('finish')} sx={field} SelectProps={menuAbove}>
              <MenuItem value={ALL} sx={{ fontSize: '0.8rem' }}>{t('inventory.specNotSpecified')}</MenuItem>
              {Object.entries(FINISH_NAMES).map(([k, name]) => <MenuItem key={k} value={k} sx={{ fontSize: '0.8rem' }}>{name}</MenuItem>)}
            </TextField>
          </Box>

          {existing.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, mb: 0.5 }}>{t('inventory.specExisting')}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {existing.map(({ v, p }) => (
                  <Chip key={v._id || v.code} size="small" clickable onClick={() => load(p)}
                    label={`${p.grade} ${p.unsized ? t('inventory.specUnsizedShort') : `${p.lengthCm}×${p.widthCm}`}×${p.thicknessMm}${[p.cut, p.fill, p.finish].filter(Boolean).join('')}`}
                    sx={{ height: 22, fontSize: '0.66rem', fontFamily: 'monospace' }} />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ borderTop: `1px solid ${T.BD}`, pt: 1.25 }}>
            {!code ? (
              <Typography sx={{ fontSize: '0.74rem', color: T.TEXT_TER }}>
                {nothingEntered ? t('inventory.specEnterSpec') : t('inventory.specIncomplete')}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '0.64rem', color: T.TEXT_TER, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('inventory.specCode')}</Typography>
                  <Typography data-testid="spec-code" sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.02rem', color: T.TEXT_PRI }}>{code}</Typography>
                  {parsed && parsed.valid && (
                    <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }}>
                      {[parsed.gradeName, parsed.unsized ? t('inventory.specUnsizedShort') : `${parsed.lengthCm} × ${parsed.widthCm} cm`, `${parsed.thicknessMm} mm`,
                        parsed.cutName, parsed.fillName, parsed.finishName].filter(Boolean).join(' · ')}
                    </Typography>
                  )}
                </Box>

                {match ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <CheckCircleIcon sx={{ fontSize: 17, color: '#66bb6a' }} />
                    <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_PRI, flex: 1, minWidth: 160 }}>
                      {showInventory
                        ? t('inventory.specFound', { qty: fmtQty(match.quantity), unit: match.unit })
                        : t('inventory.specFoundPlain')}
                      {showInventory && match.price != null ? ` · ${fmtMoney(match.price)} AED` : ''}
                      {usedCodes && usedCodes.has(code) ? ` · ${t('inventory.specAlreadyUsed')}` : ''}
                    </Typography>
                    <Button size="small" variant="contained" onClick={() => handOver(match)} sx={{ textTransform: 'none', borderRadius: '8px' }}>
                      {t('inventory.specUse')}
                    </Button>
                    {showInventory && Number(match.quantity) <= 0 && (
                      <Typography sx={{ fontSize: '0.68rem', color: '#ffb74d', width: '100%' }}>{t('inventory.specNoStock')}</Typography>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <ErrorOutlineIcon sx={{ fontSize: 17, color: '#ffb74d' }} />
                    <Typography sx={{ fontSize: '0.76rem', color: T.TEXT_PRI, flex: 1, minWidth: 160 }}>
                      {t('inventory.specNotFound', { product: product.name || product.code })}
                    </Typography>
                    {canCreate ? (
                      <>
                        <TextField select size="small" value={unit} onChange={(e) => setUnit(e.target.value)} label={t('inventory.specUnit')} sx={{ ...field, width: 92 }} SelectProps={menuAbove}>
                          {[...new Set([product.defaultUnit, ...UNITS].filter(Boolean))].map((u) => <MenuItem key={u} value={u} sx={{ fontSize: '0.8rem' }}>{u}</MenuItem>)}
                        </TextField>
                        <Button size="small" variant="contained" disabled={busy} onClick={createAndUse}
                          startIcon={busy ? <CircularProgress size={13} color="inherit" /> : <AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
                          sx={{ textTransform: 'none', borderRadius: '8px' }}>
                          {t('inventory.specAddAndUse', { product: product.name || product.code })}
                        </Button>
                      </>
                    ) : (
                      <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, width: '100%' }}>{noPermissionHint || t('inventory.specCannotAdd')}</Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ py: 0 }}>{error}</Alert>}
        </>
      )}
    </Box>
  );
}
