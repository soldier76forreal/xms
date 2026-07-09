import { useState, useRef, useCallback, useEffect } from 'react';

// ── Built-in validators ───────────────────────────────────────────────────────

export const required = (msg = 'Required') =>
  (v) => {
    if (v === null || v === undefined) return msg;
    if (Array.isArray(v))  return v.length === 0 ? msg : null;
    if (typeof v === 'string') return v.trim() === '' ? msg : null;
    return null;
  };

export const email = (msg = 'Invalid email') =>
  (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ? msg : null;

export const minLength = (n, msg) =>
  (v) => v && String(v).trim().length < n ? (msg || `Min ${n} chars`) : null;

export const maxLength = (n, msg) =>
  (v) => v && String(v).trim().length > n ? (msg || `Max ${n} chars`) : null;

export const minSelected = (n, msg) =>
  (v) => (!Array.isArray(v) || v.length < n) ? (msg || `Select at least ${n}`) : null;

// ── useForm ───────────────────────────────────────────────────────────────────

export default function useForm(initialValues, schema = {}) {
  const [values,  setValuesState] = useState(() => clone(initialValues));
  const [errors,  setErrors]      = useState({});
  const [touched, setTouched]     = useState({});

  // Keep a ref always in sync with the current values (for synchronous reads)
  const valuesRef  = useRef(clone(initialValues));
  const baselineRef = useRef(JSON.stringify(initialValues));

  useEffect(() => { valuesRef.current = values; }, [values]);

  const isDirty = JSON.stringify(values) !== baselineRef.current;

  const runField = useCallback((field, value) => {
    for (const v of (schema[field] || [])) {
      const msg = v(value);
      if (msg) return msg;
    }
    return null;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((field, value) => {
    valuesRef.current = { ...valuesRef.current, [field]: value };
    setValuesState(prev => ({ ...prev, [field]: value }));
    setTouched(prev => {
      if (!prev[field]) return prev;
      const err = runField(field, value);
      setErrors(e => err ? { ...e, [field]: err } : omit(e, field));
      return prev;
    });
  }, [runField]);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = runField(field, valuesRef.current[field]);
    setErrors(prev => err ? { ...prev, [field]: err } : omit(prev, field));
  }, [runField]);

  // Validate all schema fields; returns true if clean.
  // Uses valuesRef so it always reads the latest values synchronously.
  const validate = useCallback(() => {
    const errs = {};
    const allTouched = {};
    for (const field of Object.keys(schema)) {
      allTouched[field] = true;
      const err = runField(field, valuesRef.current[field]);
      if (err) errs[field] = err;
    }
    setErrors(errs);
    setTouched(prev => ({ ...prev, ...allTouched }));
    return Object.keys(errs).length === 0;
  }, [schema, runField]);

  const reset = useCallback((newInitial) => {
    const v = clone(newInitial !== undefined ? newInitial : initialValues);
    valuesRef.current  = v;
    baselineRef.current = JSON.stringify(v);
    setValuesState(v);
    setErrors({});
    setTouched({});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setValues = useCallback((newValues) => {
    const v = clone(newValues);
    valuesRef.current   = v;
    baselineRef.current = JSON.stringify(v);
    setValuesState(v);
    setErrors({});
    setTouched({});
  }, []);

  const setField = useCallback((field, value) => handleChange(field, value), [handleChange]);

  const fieldError = useCallback(
    (field) => (touched[field] ? errors[field] || null : null),
    [touched, errors]
  );

  return { values, errors, touched, isDirty, handleChange, handleBlur, validate, reset, setValues, setField, fieldError, setErrors, setTouched };
}

function clone(v) {
  try { return JSON.parse(JSON.stringify(v ?? {})); } catch { return v; }
}
function omit(obj, key) { const n = { ...obj }; delete n[key]; return n; }
