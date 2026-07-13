import { useState, useEffect, useContext } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';

// Import fields mirror the backend's IMPORT_SETTABLE_FIELDS (routes/inventory/main.js) —
// code always drives matching/creation and isn't itself a toggle.
const IMPORT_FIELDS = [
  { key: 'name',     label: 'Name' },
  { key: 'unit',     label: 'Unit' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'price',    label: 'Price' },
  { key: 'category', label: 'Category' },
];

const ImportExportDialog = ({ open, onClose, onImportSuccess, branchId }) => {
  const theme  = useTheme();
  const isXs   = useMediaQuery(theme.breakpoints.down('sm'));
  const authCtx     = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const [tab, setTab] = useState(can('inventory:export') ? 'export' : 'import');

  // export state
  const [exportFields, setExportFields] = useState([]);
  const [exportSelected, setExportSelected] = useState(new Set());
  const [exporting, setExporting] = useState(false);

  // import state
  const [importFile, setImportFile] = useState(null);
  const [importSelected, setImportSelected] = useState(new Set(IMPORT_FIELDS.map(f => f.key)));
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    if (!open || !can('inventory:export')) return;
    authCtx.jwtInst({ method: 'get', url: `${axiosGlobal.defaultTargetApi}/inventory/export/fields` })
      .then((res) => {
        const fields = res.data.fields || [];
        setExportFields(fields);
        setExportSelected(new Set(fields.map(f => f.key)));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) { setImportFile(null); setImportResult(null); }
  }, [open]);

  const toggleExportField = (key) => setExportSelected((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });
  const toggleImportField = (key) => setImportSelected((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/inventory/export`,
        params: { fields: [...exportSelected].join(','), branchId },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-export-${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (_) { /* handled by generic error UI below via state if needed */ }
    setExporting(false);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('fields', [...importSelected].join(','));
      formData.append('branchId', branchId || '');
      const res = await authCtx.jwtInst({
        method: 'post',
        url: `${axiosGlobal.defaultTargetApi}/inventory/import`,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data.data);
      if ((res.data.data.created > 0 || res.data.data.updated > 0) && onImportSuccess) onImportSuccess();
    } catch (err) {
      setImportResult({ error: err?.response?.data?.message || 'Import failed' });
    }
    setImporting(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isXs}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem',
        display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="span" sx={{ flexGrow: 1 }}>Import / Export Inventory</Box>
        <IconButton size="small" onClick={onClose} aria-label="Close"
          sx={{ color: 'text.secondary' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        {can('inventory:export') && <Tab value="export" label="Export" sx={{ textTransform: 'none' }} />}
        {can('inventory:import') && <Tab value="import" label="Import" sx={{ textTransform: 'none' }} />}
      </Tabs>

      <DialogContent sx={{ pt: 2.5 }}>
        {tab === 'export' && (
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Select which columns to include in the exported .xlsx file (one row per variant/SKU).
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {exportFields.map((f) => (
                <FormControlLabel key={f.key} sx={{ width: { xs: '100%', sm: '48%' } }}
                  control={<Checkbox size="small" checked={exportSelected.has(f.key)}
                    onChange={() => toggleExportField(f.key)} />}
                  label={<Typography variant="body2">{f.label}</Typography>} />
              ))}
            </Box>
          </Box>
        )}

        {tab === 'import' && (
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Upload an .xlsx file with a CODE column (stone code) — rows are matched/created by
              code. Select which columns to apply from the sheet; unselected columns are left untouched
              on existing variants.
            </Typography>

            <Button component="label" variant="outlined" size="small"
              startIcon={<UploadFileIcon sx={{ fontSize: 16 }} />} sx={{ mb: 1.5, textTransform: 'none' }}>
              {importFile ? importFile.name : 'Choose .xlsx file'}
              <input type="file" accept=".xlsx,.xls" hidden
                onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }} />
            </Button>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
              {IMPORT_FIELDS.map((f) => (
                <FormControlLabel key={f.key} sx={{ width: { xs: '100%', sm: '48%' } }}
                  control={<Checkbox size="small" checked={importSelected.has(f.key)}
                    onChange={() => toggleImportField(f.key)} />}
                  label={<Typography variant="body2">{f.label}</Typography>} />
              ))}
            </Box>

            {importResult && (
              <Box sx={{ mt: 1.5 }}>
                {importResult.error ? (
                  <Alert severity="error">{importResult.error}</Alert>
                ) : (
                  <>
                    <Alert severity={importResult.errors?.length ? 'warning' : 'success'} sx={{ mb: 1 }}>
                      Processed {importResult.processed} rows — {importResult.created} created,
                      {' '}{importResult.updated} updated, {importResult.skipped} skipped.
                    </Alert>
                    {importResult.errors?.length > 0 && (
                      <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                        {importResult.errors.map((e, i) => (
                          <Typography key={i} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                            Row {e.row} ({e.code}): {e.message}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Close</Button>
        {tab === 'export' && (
          <Button variant="contained" size="small" onClick={handleExport}
            disabled={exporting || exportSelected.size === 0}
            startIcon={exporting ? <CircularProgress size={14} /> : <DownloadIcon sx={{ fontSize: 16 }} />}>
            Download
          </Button>
        )}
        {tab === 'import' && (
          <Button variant="contained" size="small" onClick={handleImport}
            disabled={importing || !importFile}
            startIcon={importing ? <CircularProgress size={14} /> : <UploadFileIcon sx={{ fontSize: 16 }} />}>
            Upload &amp; Import
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportExportDialog;
