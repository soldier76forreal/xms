import { useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ViewListIcon from '@mui/icons-material/ViewList';

import AuthContext from '../../authAndConnections/auth';
import AxiosGlobal from '../../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../../contextApi/PermissionContext';
import { fetchMisPackingList, deleteMisPackingList, downloadMisPackingListPdf } from '../../../store/store';
import ConfirmDialog from '../../../tools/modal/confirmDialog';
import PackingListForm from './packingListForm';
import PalletLabelButton, { PalletLabelCard } from './palletLabelButton';
import DocPreviewFrame from '../../../tools/docPreviewFrame';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

// One labelled value in the meta grid. Blank values are skipped by the caller,
// so the panel never shows a column of dashes.
function Meta({ label, value, T, mono }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 0.5, color: T.TEXT_TER, mb: 0.15 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_PRI,
        fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function PackingListDetail({ packingListId, onBack }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const doc = useSelector((s) => s.misSelectedPackingList);
  const refreshKey = useSelector((s) => s.misPackingListRefreshKey);

  const T = {
    BD:       isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider,
    BD2:      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    TEXT_PRI: isDark ? 'rgba(255,255,255,0.87)' : theme.palette.text.primary,
    TEXT_SEC: isDark ? 'rgba(255,255,255,0.45)' : theme.palette.text.secondary,
    TEXT_TER: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    CTRL_BG:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const [lang, setLang] = useState('en');
  const [view, setView] = useState('document');        // 'document' | 'data'
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!packingListId) return;
    dispatch(fetchMisPackingList({ authCtx, axiosGlobal, id: packingListId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packingListId, refreshKey]);

  // The record opens as the DOCUMENT — the same HTML the PDF export renders
  // from (GET /:id/html), so what's on screen is what gets printed. An iframe
  // src can't carry the JWT, so the markup is fetched and injected via srcDoc.
  const loadPreview = useCallback(async () => {
    if (!packingListId) return;
    setPreviewLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/mis/packing-lists/${packingListId}/html`,
        params: { lang }, responseType: 'text',
      });
      setPreviewHtml(typeof res.data === 'string' ? res.data : '');
    } catch (_) {
      setPreviewHtml('');
    } finally {
      setPreviewLoading(false);
    }
  }, [authCtx, axiosGlobal, packingListId, lang]);

  useEffect(() => { loadPreview(); }, [loadPreview, refreshKey]);

  const handleDownload = async () => {
    setDownloading(true);
    await dispatch(downloadMisPackingListPdf({ authCtx, axiosGlobal, id: packingListId, docNumber: doc?.docNumber, lang }));
    setDownloading(false);
  };

  const handleDelete = async () => {
    await dispatch(deleteMisPackingList({ authCtx, axiosGlobal, id: packingListId })).unwrap();
    setDeleteConfirm(false);
    onBack();
  };

  if (!doc || doc._id !== packingListId) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={20} /></Box>;
  }

  const d = doc.driverInfo || {}, v = doc.vehicleInfo || {};
  const ca = doc.customsAgent || {}, lo = doc.loadingOfficer || {};

  const metaRows = [
    [t('mis.driverFullNameField'), d.fullName],
    [t('mis.driverPhoneField'), d.phone],
    [t('mis.driverNationalIdField'), d.nationalId],
    [t('mis.driverSmartNumberField'), d.smartNumber],
    [t('mis.trailerPlateField'), v.trailerPlateNumber],
    [t('mis.trailerSmartNumberField'), v.trailerSmartNumber],
    [t('mis.driverIbanField'), d.iban],
    [t('mis.loadingOfficerNameField'), lo.name],
    [t('mis.loadingOfficerPhoneField'), lo.phone],
    [t('mis.customsAgentNameField'), ca.name],
    [t('mis.customsAgentPhoneField'), ca.phone],
    [t('mis.shippingDestinationField'), doc.shippingDestination],
    [t('mis.originAddressField'), doc.originAddress],
    [t('mis.destinationAddressField'), doc.destinationAddress],
  ].filter(([, val]) => val !== undefined && val !== null && String(val).trim() !== '');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25,
        borderBottom: `1px solid ${T.BD}`, flexShrink: 0, flexWrap: 'wrap' }}>
        <IconButton size="small" onClick={onBack}>
          <ArrowBackIcon sx={{ fontSize: 18, color: T.TEXT_SEC }} />
        </IconButton>

        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.TEXT_PRI }}>
              {t('mis.plDocTitle')} #{doc.docNumber}
            </Typography>
            <Chip size="small"
              label={doc.type === 'linked' ? t('mis.plTypeLinked') : t('mis.plTypeFree')}
              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
          </Box>
          <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC }}>
            {fmtDate(doc.insertDate)}
            {` · ${t('mis.plPalletCount', { count: doc.pallets?.length || 0 })}`}
            {` · ${t('mis.plTotalsSummary', { pcs: doc.totals?.totalPcs || 0, sqm: (doc.totals?.totalSqm || 0).toFixed(2) })}`}
          </Typography>
        </Box>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {/* Document vs raw data */}
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, val) => val && setView(val)}>
            <ToggleButton value="document" sx={{ px: 1, py: 0.25 }}>
              <Tooltip title={t('mis.plViewDocument')}><ArticleOutlinedIcon sx={{ fontSize: 15 }} /></Tooltip>
            </ToggleButton>
            <ToggleButton value="data" sx={{ px: 1, py: 0.25 }}>
              <Tooltip title={t('mis.plViewData')}><ViewListIcon sx={{ fontSize: 15 }} /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Select size="small" value={lang} onChange={(e) => setLang(e.target.value)}
            sx={{ height: 28, fontSize: '0.72rem', minWidth: 86 }}>
            <MenuItem value="en" sx={{ fontSize: '0.78rem' }}>English</MenuItem>
            <MenuItem value="ar" sx={{ fontSize: '0.78rem' }}>العربية</MenuItem>
            <MenuItem value="fa" sx={{ fontSize: '0.78rem' }}>فارسی</MenuItem>
          </Select>

          {can('mis:packingList:pdf') && (
            <Button size="small" variant="outlined" onClick={handleDownload} disabled={downloading}
              startIcon={downloading ? <CircularProgress size={12} /> : <PictureAsPdfIcon sx={{ fontSize: 14 }} />}
              sx={{ fontSize: '0.7rem', textTransform: 'none', height: 28 }}>
              {t('mis.savePdf')}
            </Button>
          )}
          {can('mis:packingList:edit') && (
            <Tooltip title={t('common.edit')}>
              <IconButton size="small" onClick={() => setEditOpen(true)}>
                <EditIcon sx={{ fontSize: 16, color: T.TEXT_SEC }} />
              </IconButton>
            </Tooltip>
          )}
          {can('mis:packingList:delete') && (
            <Tooltip title={t('common.delete')}>
              <IconButton size="small" onClick={() => setDeleteConfirm(true)}>
                <DeleteOutlineIcon sx={{ fontSize: 16, color: T.TEXT_SEC }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 2 }}>

        {view === 'document' ? (
          <>
            {previewLoading && !previewHtml ? (
              <Skeleton variant="rectangular" height={520} sx={{ borderRadius: '10px' }} />
            ) : previewHtml ? (
              <Box sx={{ border: `1px solid ${T.BD}`, borderRadius: '10px', overflow: 'hidden', bgcolor: '#fff' }}>
                <DocPreviewFrame html={previewHtml} title={`packing-list-${doc.docNumber}`}
                  height={{ xs: 520, md: 860 }} />
              </Box>
            ) : (
              <Box sx={{ py: 5, textAlign: 'center', border: `1px dashed ${T.BD}`, borderRadius: '10px' }}>
                <DescriptionIcon sx={{ fontSize: 28, color: T.TEXT_TER, mb: 0.5 }} />
                <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_TER }}>
                  {t('mis.previewUnavailable')}
                </Typography>
              </Box>
            )}

            {/* Per-pallet label printing sits under the document, where the
                pallets it refers to are visible. */}
            {can('mis:packingList:pdf') && (doc.pallets || []).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: 1, color: T.TEXT_TER, mb: 1 }}>
                  {t('mis.plLabelsSection')}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: T.TEXT_SEC, mb: 1.25 }}>
                  {t('mis.plLabelsHelp')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                  {doc.pallets.map((p, i) => (
                    <PalletLabelCard key={p.palletId} pallet={p} index={i}
                      packingListId={packingListId} docNumber={doc.docNumber} lang={lang} />
                  ))}
                </Box>
              </Box>
            )}
          </>
        ) : (
          <>
            {/* ── Shipment meta ── */}
            {metaRows.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: 1, color: T.TEXT_TER, mb: 1 }}>
                  {t('mis.plShipmentSection')}
                </Typography>
                <Box sx={{ display: 'grid', gap: 1.5,
                  gridTemplateColumns: isXs ? '1fr 1fr' : 'repeat(auto-fill, minmax(190px, 1fr))',
                  p: 1.5, border: `1px solid ${T.BD}`, borderRadius: '10px', bgcolor: T.CTRL_BG }}>
                  {metaRows.map(([label, value]) => (
                    <Meta key={label} label={label} value={value} T={T} />
                  ))}
                </Box>
              </Box>
            )}

            {/* ── Pallets ── */}
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: 1, color: T.TEXT_TER, mb: 1 }}>
              {t('mis.plPalletsSection')}
            </Typography>

            {(doc.pallets || []).map((pallet) => {
              const pt = (pallet.items || []).reduce((a, it) => {
                a.pcs += Number(it.pcs) || 0; a.sqm += Number(it.sqm) || 0; return a;
              }, { pcs: 0, sqm: 0 });
              return (
                <Box key={pallet.palletId} sx={{ mb: 1.5, border: `1px solid ${T.BD}`,
                  borderRadius: '12px', overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1,
                    bgcolor: T.CTRL_BG, borderBottom: `1px solid ${T.BD}` }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: T.TEXT_PRI }}>
                      {pallet.palletId}
                    </Typography>
                    {pallet.reference && (
                      <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: T.TEXT_SEC }}>
                        {pallet.reference}
                      </Typography>
                    )}
                    {pallet.processingType && (
                      <Chip size="small" label={pallet.processingType}
                        sx={{ height: 18, fontSize: '0.6rem' }} />
                    )}
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1.25, alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC }}>
                        {pt.pcs} {t('mis.plColPcs')}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_SEC }}>
                        {pt.sqm.toFixed(2)} {t('mis.plColSqm')}
                      </Typography>
                      {can('mis:packingList:pdf') && (
                        <PalletLabelButton packingListId={packingListId} docNumber={doc.docNumber}
                          palletId={pallet.palletId} lang={lang} />
                      )}
                    </Box>
                  </Box>

                  {/* Item table — right-aligned tabular numbers, real headers */}
                  <Box sx={{ px: 1.5, py: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, pb: 0.5, borderBottom: `1px solid ${T.BD}` }}>
                      {[
                        { l: t('mis.plColCode'), w: 150, a: 'left' },
                        { l: t('mis.plColLength'), w: 60 },
                        { l: t('mis.plColWidth'), w: 60 },
                        { l: t('mis.plColThickness'), w: 60 },
                        { l: t('mis.plColPcs'), w: 60 },
                        { l: t('mis.plColSqm'), w: 76 },
                      ].map((c) => (
                        <Typography key={c.l} sx={{ width: c.w, flexShrink: 0, fontSize: '0.6rem',
                          fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
                          color: T.TEXT_TER, textAlign: c.a === 'left' ? 'left' : 'right' }}>
                          {c.l}
                        </Typography>
                      ))}
                    </Box>
                    {(pallet.items || []).map((it, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, py: 0.55,
                        borderBottom: i < pallet.items.length - 1 ? `1px solid ${T.BD}` : 'none' }}>
                        <Typography sx={{ width: 150, flexShrink: 0, fontFamily: 'monospace',
                          fontSize: '0.73rem', color: T.TEXT_PRI }} noWrap>{it.code}</Typography>
                        {[it.lengthCm, it.widthCm, it.thicknessCm, it.pcs].map((val, k) => (
                          <Typography key={k} sx={{ width: 60, flexShrink: 0, fontSize: '0.73rem',
                            textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: T.TEXT_SEC }}>
                            {val ?? '—'}
                          </Typography>
                        ))}
                        <Typography sx={{ width: 76, flexShrink: 0, fontSize: '0.73rem', fontWeight: 600,
                          textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: T.TEXT_PRI }}>
                          {it.sqm != null ? Number(it.sqm).toFixed(2) : '—'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}

            {/* Grand total */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', px: 1.5, py: 1.25,
              border: `1px solid ${T.BD2}`, borderRadius: '10px', bgcolor: T.CTRL_BG }}>
              <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_SEC }}>
                {t('mis.plPalletCount', { count: doc.pallets?.length || 0 })}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_PRI, fontWeight: 700 }}>
                {doc.totals?.totalPcs || 0} {t('mis.plColPcs')}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: T.TEXT_PRI, fontWeight: 700 }}>
                {(doc.totals?.totalSqm || 0).toFixed(2)} {t('mis.plColSqm')}
              </Typography>
            </Box>

            {doc.notes && (
              <Box sx={{ mt: 2, p: 1.25, borderRadius: '9px', bgcolor: T.CTRL_BG, border: `1px solid ${T.BD}` }}>
                <Typography sx={{ fontSize: '0.78rem', color: T.TEXT_SEC, whiteSpace: 'pre-wrap' }}>
                  {doc.notes}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      <PackingListForm open={editOpen} onClose={() => setEditOpen(false)} packingList={doc} />
      <ConfirmDialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} onConfirm={handleDelete}
        title={t('mis.plDeleteTitle')} message={t('mis.plDeleteMessage')} destructive
        confirmLabel={t('common.delete')} cancelLabel={t('common.cancel')} />
    </Box>
  );
}
