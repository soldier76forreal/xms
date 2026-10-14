// ── Job report form — one dynamic form for every template ───────────────────
// Drawn entirely from the spec the server sends (GET /users/jobReports/
// templates). The classic free-text report and the salesperson daily sheet are
// the same component rendering two different specs; a third template is a
// backend file and nothing here.
//
// Three things the paper form could never do, and the reason this exists:
//   · a customer, a stone and a piece of content are LIVE references into CRM,
//     Inventory and Digital Marketing, not handwriting
//   · it autosaves while you type, so a phone call mid-report costs nothing
//   · its sections are filled in any order — the navigator jumps straight to
//     the one you have the answer for and remembers the rest
//
// It is a Drawer, not a Dialog, deliberately: the "customer is not in CRM yet"
// shortcut opens the shared customerForm Drawer on top of this one, and two
// Drawers stack by DOM order. Raising this to a Dialog would drop that form
// behind it — the portal z-index trap this codebase has been caught by before.
import { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import SendIcon from '@mui/icons-material/Send';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import CustomerForm from '../crm/customerForm';
import ConfirmDialog from '../../tools/modal/confirmDialog';
import { usePermissions } from '../../contextApi/PermissionContext';
import { actions } from '../../store/store';
import {
  SpecField, pickLabel, useSpecLang, computeTotals, applyComputedRow, rowIsEmpty,
} from './jobReportFields';

const todayStr = () => new Date().toISOString().slice(0, 10);
const AUTOSAVE_MS = 1500;

// An empty value shaped the way each section kind stores it.
const blankFor = (section) => (section.kind === 'table' ? [] : {});

// Where a template keeps one of the model's own columns (reportDate / title /
// body). Returned as a {sectionKey, fieldKey} pair so nothing here has to
// assume a section is called 'core' — a later template may name its sections
// anything, and guessing wrong would silently file every report as today.
const boundAt = (spec, bind) => {
  const sections = (spec && spec.sections) || [];
  for (let i = 0; i < sections.length; i += 1) {
    const field = (sections[i].fields || []).find((f) => f.bind === bind);
    if (field) return { sectionKey: sections[i].key, fieldKey: field.key };
  }
  return null;
};

const readBound = (spec, values, bind) => {
  const at = boundAt(spec, bind);
  return at ? (values[at.sectionKey] || {})[at.fieldKey] : null;
};

// A report filed BEFORE templates existed carries title/body in its own
// columns and no `sections` at all. Seeding the form from `sections` alone
// would show those fields blank and then save the blanks back over real text —
// so they are read back through the template's own `bind`.
const seedFromReport = (spec, base, report) => {
  const values = { ...base, ...(report.sections || {}) };
  ['reportDate', 'title', 'body'].forEach((bind) => {
    const at = boundAt(spec, bind);
    if (!at) return;
    const current = (values[at.sectionKey] || {})[at.fieldKey];
    if (current != null && current !== '') return;
    const fromDoc = bind === 'reportDate'
      ? (report.reportDate ? String(report.reportDate).slice(0, 10) : '')
      : (report[bind] || '');
    if (fromDoc) values[at.sectionKey] = { ...(values[at.sectionKey] || {}), [at.fieldKey]: fromDoc };
  });
  return values;
};

const emptyRow = (section) => {
  const row = {};
  (section.columns || []).forEach((c) => { row[c.key] = null; });
  return row;
};

// How many answers a section holds — drives the navigator's "done" dot, so the
// person can see at a glance which parts of the sheet they have been through.
const sectionFilledCount = (section, value) => {
  if (section.kind === 'table') return (value || []).filter((r) => !rowIsEmpty(r)).length;
  return Object.values(value || {}).filter(
    (v) => v != null && v !== '' && !(typeof v === 'object' && !v),
  ).length;
};

// ── Navigator ────────────────────────────────────────────────────────────────
const SectionNav = ({ spec, values, active, onPick, lang, T, horizontal }) => (
  <Box sx={{
    display: 'flex', gap: 0.5, flexShrink: 0,
    ...(horizontal
      ? { flexDirection: 'row', overflowX: 'auto', px: 1.5, py: 1, borderBottom: `1px solid ${T.BD}` }
      : { flexDirection: 'column', width: 208, overflowY: 'auto', p: 1, borderInlineEnd: `1px solid ${T.BD}` }),
  }}>
    {(spec.sections || []).map((section) => {
      const filled = sectionFilledCount(section, values[section.key]);
      const isActive = active === section.key;
      return (
        <Button key={section.key} onClick={() => onPick(section.key)}
          sx={{
            justifyContent: horizontal ? 'center' : 'flex-start', textTransform: 'none',
            textAlign: horizontal ? 'center' : 'start', flexShrink: 0,
            minWidth: horizontal ? 'auto' : 0, px: 1.25, py: 0.75, borderRadius: '8px',
            fontSize: '0.72rem', lineHeight: 1.25, whiteSpace: horizontal ? 'nowrap' : 'normal',
            fontWeight: isActive ? 700 : 400,
            color: isActive ? T.TEXT_PRI : T.TEXT_SEC,
            bgcolor: isActive ? T.CTRL_BG : 'transparent',
            '&:hover': { bgcolor: T.CTRL_BG },
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, width: '100%' }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              bgcolor: filled ? '#4caf50' : T.TEXT_TER,
            }} />
            <Box sx={{ flexGrow: 1 }}>{pickLabel(section.label, lang)}</Box>
            {filled > 0 && section.kind === 'table' && (
              <Box sx={{ fontSize: '0.62rem', opacity: 0.6 }}>{filled}</Box>
            )}
          </Box>
        </Button>
      );
    })}
  </Box>
);

// ── A `fields` section ───────────────────────────────────────────────────────
const FieldsSection = ({ section, value, onField, lang, T, canCreateCustomer, onCreateCustomer }) => (
  <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
    {(section.fields || []).map((field) => (
      <Box key={field.key} sx={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
        <SpecField field={field} value={(value || {})[field.key]} lang={lang} T={T}
          onChange={(v) => onField(field.key, v)}
          canCreateCustomer={canCreateCustomer}
          onCreateCustomer={() => onCreateCustomer(section.key, null, field.key)} />
      </Box>
    ))}
  </Box>
);

// ── A `table` section ────────────────────────────────────────────────────────
// Rows are cards on a phone and a real table on a desktop: the salesperson
// sheet has five to seven columns, which no phone shows as a grid worth using.
const TableSection = ({ section, rows, onRows, lang, T, isNarrow, canCreateCustomer, onCreateCustomer }) => {
  const { t } = useTranslation();
  const list = rows || [];
  const totals = computeTotals(section, list);

  const setCell = (index, key, val) => {
    const next = list.map((row, i) => (i === index ? applyComputedRow(section, { ...row, [key]: val }) : row));
    onRows(next);
  };
  const addRow = () => onRows([...list, emptyRow(section)]);
  const removeRow = (index) => onRows(list.filter((_, i) => i !== index));

  const gridCols = (section.columns || []).map((c) => `minmax(0, ${c.width || 1}fr)`).join(' ');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {!isNarrow && list.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: `28px ${gridCols} 32px`, gap: 0.75, px: 0.25 }}>
          {['#', ...(section.columns || []).map((c) => pickLabel(c.label, lang)), ''].map((head, i) => (
            <Typography key={i} sx={{ fontSize: '0.64rem', color: T.TEXT_TER, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 0.4 }}>{head}</Typography>
          ))}
        </Box>
      )}

      {list.map((row, index) => (
        isNarrow ? (
          <Box key={index} sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', p: 1.25,
            display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, flexGrow: 1 }}>#{index + 1}</Typography>
              <IconButton size="small" onClick={() => removeRow(index)} sx={{ color: T.TEXT_TER, width: 24, height: 24 }}>
                <DeleteOutlineIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>
            {(section.columns || []).map((col) => (
              <SpecField key={col.key} field={col} value={row[col.key]} lang={lang} T={T}
                onChange={(v) => setCell(index, col.key, v)}
                canCreateCustomer={canCreateCustomer}
                onCreateCustomer={() => onCreateCustomer(section.key, index, col.key)} />
            ))}
          </Box>
        ) : (
          <Box key={index} sx={{ display: 'grid', gridTemplateColumns: `28px ${gridCols} 32px`,
            gap: 0.75, alignItems: 'center' }}>
            <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_TER }}>{index + 1}</Typography>
            {(section.columns || []).map((col) => (
              <SpecField key={col.key} field={col} value={row[col.key]} lang={lang} T={T} dense
                onChange={(v) => setCell(index, col.key, v)}
                canCreateCustomer={canCreateCustomer}
                onCreateCustomer={() => onCreateCustomer(section.key, index, col.key)} />
            ))}
            <IconButton size="small" onClick={() => removeRow(index)} sx={{ color: T.TEXT_TER, width: 26, height: 26 }}>
              <DeleteOutlineIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        )
      ))}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Button onClick={addRow} startIcon={<AddIcon sx={{ fontSize: 15 }} />} size="small"
          sx={{ textTransform: 'none', fontSize: '0.74rem', color: T.TEXT_SEC, borderRadius: '8px' }}>
          {t('users.jrAddRow')}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {totals.map((tot) => (
          <Chip key={tot.key} size="small"
            label={`${pickLabel(tot.label, lang)}: ${Number(tot.value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
            sx={{ height: 22, fontSize: '0.68rem', bgcolor: T.CTRL_BG, color: T.TEXT_PRI }} />
        ))}
      </Box>
    </Box>
  );
};

// ── The form ─────────────────────────────────────────────────────────────────
const JobReportForm = ({ open, onClose, onSaved, editingReport, T, isDark }) => {
  const { t } = useTranslation();
  const lang = useSpecLang();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('lg'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const dispatch = useDispatch();
  const { can } = usePermissions();

  const isEditing = !!editingReport && editingReport.status !== 'draft';

  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({});
  const [active, setActive] = useState('');
  const [reportId, setReportId] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [files, setFiles] = useState([]);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [customerTarget, setCustomerTarget] = useState(null);  // where a newly created customer lands
  const [discardOpen, setDiscardOpen] = useState(false);

  const dirtyRef = useRef(false);
  const reportIdRef = useRef(null);
  const valuesRef = useRef({});
  useEffect(() => { reportIdRef.current = reportId; }, [reportId]);
  useEffect(() => { valuesRef.current = values; }, [values]);

  // ── Load the spec, then any draft already in progress ────────────────────
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true); setError(''); setSavedAt(null); setFiles([]);
    dirtyRef.current = false;

    (async () => {
      try {
        const key = editingReport?.templateKey;
        const res = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/users/jobReports/templates${key ? `/${key}` : ''}`,
        });
        if (cancelled) return;
        const loaded = res.data.spec;
        setSpec(loaded);
        setActive((loaded.sections || [])[0]?.key || '');

        const base = {};
        (loaded.sections || []).forEach((s) => { base[s.key] = blankFor(s); });

        if (editingReport) {
          setReportId(editingReport._id);
          setValues(seedFromReport(loaded, base, editingReport));
          setFiles(editingReport.files || []);
          setLoading(false);
          return;
        }

        // Resume today's unfinished sheet rather than starting a second one
        // beside it — the whole point of autosaving in the first place.
        const draftRes = await authCtx.jwtInst({
          method: 'get',
          url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/draft`,
          params: { templateKey: loaded.key, reportDate: todayStr() },
        });
        if (cancelled) return;
        const draft = draftRes.data.draft;
        if (draft) {
          setReportId(draft._id);
          setValues({ ...base, ...(draft.sections || {}) });
          setFiles(draft.files || []);
          setSavedAt(draft.autoSavedAt || null);
        } else {
          setReportId(null);
          // The date starts on today — the one answer the form can fill in for you.
          const at = boundAt(loaded, 'reportDate');
          if (at) base[at.sectionKey] = { ...base[at.sectionKey], [at.fieldKey]: todayStr() };
          setValues(base);
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || t('users.failedLoad'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingReport]);

  // ── Autosave ─────────────────────────────────────────────────────────────
  const saveDraft = useCallback(async () => {
    if (isEditing || !spec) return null;
    setSaving(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/draft`,
        data: {
          reportId: reportIdRef.current || undefined,
          templateKey: spec.key,
          reportDate: readBound(spec, valuesRef.current, 'reportDate') || todayStr(),
          sections: valuesRef.current,
        },
      });
      setReportId(res.data._id);
      reportIdRef.current = res.data._id;
      setSavedAt(res.data.autoSavedAt);
      dirtyRef.current = false;
      return res.data._id;
    } catch (err) {
      // An autosave that fails must never interrupt typing — it says so
      // quietly and the next pause tries again.
      setError(t('users.jrAutosaveFailed'));
      return null;
    } finally {
      setSaving(false);
    }
  }, [isEditing, spec, authCtx, axiosGlobal.defaultTargetApi, t]);

  useEffect(() => {
    if (!open || isEditing || !spec || loading || !dirtyRef.current) return undefined;
    const id = setTimeout(() => { saveDraft(); }, AUTOSAVE_MS);
    return () => clearTimeout(id);
  }, [values, open, isEditing, spec, loading, saveDraft]);

  // Leaving the form with unsaved keystrokes would lose them — flush first.
  const flushAndClose = async () => {
    if (!isEditing && dirtyRef.current) await saveDraft();
    onClose();
  };

  const setSection = (key, next) => {
    dirtyRef.current = true;
    setValues((prev) => ({ ...prev, [key]: next }));
  };
  const setField = (sectionKey, fieldKey, value) => {
    dirtyRef.current = true;
    setValues((prev) => ({ ...prev, [sectionKey]: { ...(prev[sectionKey] || {}), [fieldKey]: value } }));
  };

  // ── The "customer is not in CRM yet" shortcut ────────────────────────────
  // customerForm is the ONE place a customer is created in this app; this just
  // opens it and drops the saved record onto the cell that asked for it.
  const openCustomerForm = (sectionKey, rowIndex, fieldKey) =>
    setCustomerTarget({ sectionKey, rowIndex, fieldKey });

  const handleCustomerCreated = (saved) => {
    const target = customerTarget;
    setCustomerTarget(null);
    if (!saved || !target) return;
    const info = saved.personalInformation || {};
    const picked = {
      customerId: saved._id,
      name: info.companyName || [info.firstName, info.lastName].filter(Boolean).join(' ').trim() || saved.phoneNumber || '',
      phone: saved.phoneNumber || '',
    };
    dirtyRef.current = true;
    setValues((prev) => {
      if (target.rowIndex == null) {
        return { ...prev, [target.sectionKey]: { ...(prev[target.sectionKey] || {}), [target.fieldKey]: picked } };
      }
      const rows = [...(prev[target.sectionKey] || [])];
      rows[target.rowIndex] = { ...rows[target.rowIndex], [target.fieldKey]: picked };
      return { ...prev, [target.sectionKey]: rows };
    });
  };

  // ── Attachments ──────────────────────────────────────────────────────────
  // Uploaded immediately, against the draft, so a photo survives the same
  // phone call the text does. A draft has to exist first, so the pending
  // keystrokes are flushed before the upload.
  const uploadFiles = async (picked) => {
    if (!picked.length) return;
    let id = reportIdRef.current;
    if (!id) id = await saveDraft();
    if (!id) { setError(t('users.jrAutosaveFailed')); return; }

    const form = new FormData();
    picked.forEach((file) => form.append('files', file));
    try {
      const res = await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/${id}`,
        data: form,
      });
      setFiles(res.data.files || []);
    } catch (err) {
      setError(err?.response?.data?.message || t('users.jrUploadFailed'));
    }
  };

  const handleAttach = (e) => {
    // Read the FileList into a real array BEFORE clearing the input: clearing
    // empties the live list, and the state updater runs later.
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    uploadFiles(picked);
  };

  const removeFile = async (fileId) => {
    const id = reportIdRef.current;
    if (!id) return;
    const form = new FormData();
    form.append('removeFileIds', JSON.stringify([String(fileId)]));
    try {
      const res = await authCtx.jwtInst({
        method: 'put',
        url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/${id}`,
        data: form,
      });
      setFiles(res.data.files || []);
    } catch (err) {
      setError(err?.response?.data?.message || t('users.jrUploadFailed'));
    }
  };

  const startRecording = async () => {
    setRecordError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        uploadFiles([new File([blob], `voice-report-${Date.now()}.webm`, { type: 'audio/webm' })]);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (_) {
      setRecordError(t('crm.micDenied'));
    }
  };
  const stopRecording = () => {
    try { mediaRecorderRef.current && mediaRecorderRef.current.stop(); } catch (_) { /* already stopped */ }
    setRecording(false);
  };

  // ── Submit / save ────────────────────────────────────────────────────────
  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      if (isEditing) {
        await authCtx.jwtInst({
          method: 'put',
          url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/${editingReport._id}`,
          data: {
            templateKey: spec.key,
            reportDate: readBound(spec, values, 'reportDate') || todayStr(),
            sections: JSON.stringify(values),
          },
        });
      } else {
        const id = reportIdRef.current || await saveDraft();
        if (!id) throw new Error('draft');
        await authCtx.jwtInst({
          method: 'post',
          url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/${id}/submit`,
          data: { templateKey: spec.key, reportDate: readBound(spec, values, 'reportDate') || todayStr(), sections: values },
        });
      }
      dispatch(actions.setShowSnackBar({
        status: true, type: 'success',
        msg: isEditing ? t('users.jrSaved') : t('users.jrSubmitted'),
      }));
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t('users.jrSubmitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const discardDraft = async () => {
    setDiscardOpen(false);
    const id = reportIdRef.current;
    if (id) {
      try {
        await authCtx.jwtInst({
          method: 'delete',
          url: `${axiosGlobal.defaultTargetApi}/users/me/jobReports/draft/${id}`,
        });
      } catch (_) { /* already gone — closing is still the right outcome */ }
    }
    dirtyRef.current = false;
    onSaved && onSaved();
    onClose();
  };

  const activeSection = useMemo(
    () => (spec?.sections || []).find((s) => s.key === active) || (spec?.sections || [])[0],
    [spec, active],
  );

  const canCreateCustomer = can('crm:customer:create');

  const savedLabel = saving ? t('users.jrSaving')
    : savedAt ? `${t('users.jrSavedAt')} ${new Date(savedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : t('users.jrNotSavedYet');

  return (
    <>
      <Drawer anchor="right" open={open} onClose={flushAndClose}
        PaperProps={{ sx: {
          width: { xs: '100vw', md: '92vw', lg: 1180 }, maxWidth: '100vw',
          bgcolor: T.CARD_BG, display: 'flex', flexDirection: 'column',
        } }}>

        {/* header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5,
          borderBottom: `1px solid ${T.BD}`, flexShrink: 0 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: '0.92rem', fontWeight: 700, color: T.TEXT_PRI }}>
              {spec ? pickLabel(spec.label, lang) : t('users.jobReportsHeader')}
            </Typography>
            {spec && (
              <Typography noWrap sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
                {pickLabel(spec.description, lang)}
              </Typography>
            )}
          </Box>

          {!isEditing && (
            <Tooltip title={savedLabel}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: T.TEXT_TER, flexShrink: 0 }}>
                {saving ? <CloudQueueIcon sx={{ fontSize: 15 }} /> : <CloudDoneIcon sx={{ fontSize: 15 }} />}
                {!isXs && <Typography sx={{ fontSize: '0.66rem' }}>{savedLabel}</Typography>}
              </Box>
            </Tooltip>
          )}

          <IconButton size="small" onClick={flushAndClose} sx={{ color: T.TEXT_SEC }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {loading || !spec ? (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={44} />)}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: isNarrow ? 'column' : 'row',
            flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>

            <SectionNav spec={spec} values={values} active={active} onPick={setActive}
              lang={lang} T={T} horizontal={isNarrow} />

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2.5 }, minWidth: 0 }}>
              {activeSection && (
                <>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.TEXT_PRI, mb: 0.25 }}>
                    {pickLabel(activeSection.label, lang)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.66rem', color: T.TEXT_TER, mb: 2 }}>
                    {t('users.jrSectionHint')}
                  </Typography>

                  {activeSection.kind === 'table' ? (
                    <TableSection section={activeSection} rows={values[activeSection.key]}
                      onRows={(rows) => setSection(activeSection.key, rows)}
                      lang={lang} T={T} isNarrow={isXs}
                      canCreateCustomer={canCreateCustomer} onCreateCustomer={openCustomerForm} />
                  ) : (
                    <FieldsSection section={activeSection} value={values[activeSection.key]}
                      onField={(fieldKey, v) => setField(activeSection.key, fieldKey, v)}
                      lang={lang} T={T}
                      canCreateCustomer={canCreateCustomer} onCreateCustomer={openCustomerForm} />
                  )}

                  {/* Attachments live with the whole report, not a section, so
                      they sit under the last one rather than being repeated. */}
                  {activeSection.key === (spec.sections || [])[spec.sections.length - 1]?.key && (
                    <Box sx={{ mt: 3 }}>
                      <Divider sx={{ borderColor: T.BD, mb: 1.5 }} />
                      <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER, textTransform: 'uppercase',
                        letterSpacing: 0.6, fontWeight: 600, mb: 1 }}>
                        {t('users.attachments')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {files.map((f) => (
                          <Chip key={String(f.fileId)} size="small"
                            label={f.name?.length > 24 ? `${f.name.slice(0, 21)}…` : f.name}
                            onDelete={() => removeFile(f.fileId)}
                            sx={{ height: 22, fontSize: '0.68rem', bgcolor: T.CTRL_BG, color: T.TEXT_SEC }} />
                        ))}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={recording ? t('crm.stopRecording') : t('crm.recordVoiceMessage')}>
                          <IconButton size="small" onClick={recording ? stopRecording : startRecording}
                            sx={{ color: recording ? '#EA005A' : T.TEXT_TER, width: 28, height: 28 }}>
                            {recording ? <StopCircleIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('crm.attachImageVideo')}>
                          <IconButton size="small" component="label" sx={{ color: T.TEXT_TER, width: 28, height: 28 }}>
                            <AttachFileIcon sx={{ fontSize: 17 }} />
                            <input type="file" hidden multiple accept="image/*,video/*" onChange={handleAttach} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('users.attachDocument')}>
                          <IconButton size="small" component="label" sx={{ color: T.TEXT_TER, width: 28, height: 28 }}>
                            <DescriptionIcon sx={{ fontSize: 17 }} />
                            <input type="file" hidden multiple onChange={handleAttach} />
                          </IconButton>
                        </Tooltip>
                        {recording && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#EA005A', fontWeight: 600 }}>
                            {t('crm.recording')}
                          </Typography>
                        )}
                      </Box>
                      {recordError && (
                        <Typography sx={{ fontSize: '0.7rem', color: '#EA005A', mt: 0.5 }}>{recordError}</Typography>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        )}

        {/* footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5,
          borderTop: `1px solid ${T.BD}`, flexShrink: 0, flexWrap: 'wrap' }}>
          {error && (
            <Typography sx={{ fontSize: '0.7rem', color: '#EA005A', flexBasis: '100%' }}>{error}</Typography>
          )}
          {!isEditing && reportId && (
            <Button onClick={() => setDiscardOpen(true)} size="small"
              sx={{ textTransform: 'none', fontSize: '0.74rem', color: '#EA005A' }}>
              {t('users.jrDiscardDraft')}
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={flushAndClose} sx={{ textTransform: 'none', fontSize: '0.78rem', color: T.TEXT_SEC }}>
            {isEditing ? t('common.cancel') : t('users.jrCloseKeepDraft')}
          </Button>
          <Button variant="contained" onClick={submit} disabled={submitting || loading || !spec}
            startIcon={submitting ? <CircularProgress size={13} color="inherit" />
              : isEditing ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <SendIcon sx={{ fontSize: 15 }} />}
            sx={{ fontSize: '0.78rem', textTransform: 'none', borderRadius: '8px', px: 2.5,
              bgcolor: T.BTN_BG, color: T.BTN_CLR,
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)' } }}>
            {isEditing ? t('common.save') : t('users.jrSubmit')}
          </Button>
        </Box>
      </Drawer>

      {/* The shared CRM form — one place a customer is ever created. */}
      <CustomerForm
        open={!!customerTarget}
        mode="new"
        customer={null}
        onClose={() => setCustomerTarget(null)}
        onSave={handleCustomerCreated}
      />

      <ConfirmDialog
        open={discardOpen}
        title={t('users.jrDiscardDraft')}
        message={t('users.jrDiscardDraftConfirm')}
        confirmLabel={t('common.delete')}
        destructive
        onClose={() => setDiscardOpen(false)}
        onConfirm={discardDraft}
      />
    </>
  );
};

export default JobReportForm;
