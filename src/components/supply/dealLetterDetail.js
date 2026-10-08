import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import StorefrontIcon from '@mui/icons-material/Storefront';

import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { usePermissions } from '../../contextApi/PermissionContext';
import {
  fetchSupplyDealLetter, updateSupplyDealLetter, saveSupplyDealLetterStatus,
  updateSupplyDealLetterPricing, receiveSupplyDealLetterStock, downloadSupplyDealLetterPdf,
} from '../../store/store';
import DealLetterActivity from './dealLetterActivity';
import DealLetterForm from './dealLetterForm';
import CrossBranchRequestForm from '../mis/crossBranchRequestForm';
import DocPreviewFrame from '../../tools/docPreviewFrame';

const STAGES = ['purchasing', 'processing', 'final_product'];
const STAGE_LABEL_KEY = {
  purchasing: 'supply.statusPurchasing',
  processing: 'supply.statusProcessing',
  final_product: 'supply.statusFinalProduct',
};

// readOnly / branchName: opened from a branch this deal letter's branch merely
// SHARED its Supply with. Everything is readable — that's how the other branch
// decides what to ask for — nothing is editable, and the one action offered is
// requesting the lot.
export default function DealLetterDetail({ dealLetterId, onClose, readOnly = false, branchName = '', onRequested }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const { can } = usePermissions();

  const dealLetter = useSelector((s) => s.supplySelectedDealLetter);
  const loading = useSelector((s) => s.supplySelectedDealLetterLoading);

  const [editingLines, setEditingLines] = useState(false);
  const [lineDrafts, setLineDrafts] = useState({});
  const [editingPricing, setEditingPricing] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [receiveDrafts, setReceiveDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('document');     // 'document' | 'manage'
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [requestPreset, setRequestPreset] = useState(null);   // lot request (null = closed)

  useEffect(() => {
    if (!dealLetterId) return;
    dispatch(fetchSupplyDealLetter({ authCtx, axiosGlobal, id: dealLetterId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealLetterId]);

  // The contract markup is fetched rather than iframe-src'd, because an iframe
  // src can't carry the JWT — same approach as the invoice and packing-list
  // previews. Declared before the early returns below: hooks must run on every
  // render, including the loading one.
  // `previewFor` is the deal letter the contract on screen belongs to: without it the
  // previous record's contract stayed up while the next one loaded.
  const previewFor = useRef('');
  const loadPreview = useCallback(async () => {
    const key = String(dealLetterId || '');
    previewFor.current = key;
    setPreviewHtml('');
    if (!dealLetterId) return;
    setPreviewLoading(true);
    try {
      const res = await authCtx.jwtInst({
        method: 'get',
        url: `${axiosGlobal.defaultTargetApi}/supply/deal-letters/${dealLetterId}/html`,
        responseType: 'text',
      });
      if (previewFor.current !== key) return;   // another deal letter was opened meanwhile
      setPreviewHtml(typeof res.data === 'string' ? res.data : '');
    } catch (_) {
      if (previewFor.current === key) setPreviewHtml('');
    } finally {
      if (previewFor.current === key) setPreviewLoading(false);
    }
  }, [authCtx, axiosGlobal, dealLetterId]);

  // Re-fetch when the record changes, so an edit or a status advance shows in
  // the document immediately.
  useEffect(() => { loadPreview(); }, [loadPreview, dealLetter?.updateDate, dealLetter?.status]);

  if (loading && !dealLetter) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={20} /></Box>;
  }
  if (!dealLetter) return null;

  const stageIndex = STAGES.indexOf(dealLetter.status);
  const nextStage = STAGES[stageIndex + 1];

  const startEditLines = () => {
    const drafts = {};
    dealLetter.varietyLines.forEach((l) => { drafts[l.variantId] = { forecastQty: l.forecastQty, finalQty: l.finalQty }; });
    setLineDrafts(drafts);
    setEditingLines(true);
  };
  const saveLines = async () => {
    setBusy(true);
    try {
      await dispatch(updateSupplyDealLetter({
        authCtx, axiosGlobal, id: dealLetter._id,
        data: {
          varietyLines: dealLetter.varietyLines.map((l) => ({
            variantId: l.variantId,
            forecastQty: lineDrafts[l.variantId]?.forecastQty ?? l.forecastQty,
            finalQty: lineDrafts[l.variantId]?.finalQty ?? l.finalQty,
          })),
        },
      })).unwrap();
      setEditingLines(false);
    } catch (_) { /* keep edit mode open */ } finally { setBusy(false); }
  };

  const startEditPricing = () => {
    const drafts = {};
    dealLetter.varietyLines.forEach((l) => { drafts[l.variantId] = l.price ?? ''; });
    setPriceDrafts(drafts);
    setEditingPricing(true);
  };
  const savePricing = async () => {
    setBusy(true);
    try {
      await dispatch(updateSupplyDealLetterPricing({
        authCtx, axiosGlobal, id: dealLetter._id,
        lines: dealLetter.varietyLines.map((l) => ({ variantId: l.variantId, price: priceDrafts[l.variantId] === '' ? null : Number(priceDrafts[l.variantId]) })),
      })).unwrap();
      setEditingPricing(false);
    } catch (_) { /* keep edit mode open */ } finally { setBusy(false); }
  };

  const advanceStatus = async () => {
    if (!nextStage) return;
    setBusy(true);
    try {
      await dispatch(saveSupplyDealLetterStatus({ authCtx, axiosGlobal, id: dealLetter._id, status: nextStage })).unwrap();
    } catch (_) { /* validation message shown via snackbar */ } finally { setBusy(false); }
  };

  const submitReceive = async (variantId) => {
    const qty = Number(receiveDrafts[variantId]);
    if (!qty || qty <= 0) return;
    setBusy(true);
    try {
      await dispatch(receiveSupplyDealLetterStock({
        authCtx, axiosGlobal, id: dealLetter._id, lines: [{ variantId, quantity: qty }],
      })).unwrap();
      setReceiveDrafts((prev) => ({ ...prev, [variantId]: '' }));
    } catch (_) { /* error toast already shown */ } finally { setBusy(false); }
  };

  const canEdit = !readOnly && can('supply:dealLetter:edit');
  const canPrice = !readOnly && can('supply:dealLetter:price:edit');
  const canReceive = !readOnly && can('supply:dealLetter:receive');
  const canRequest = readOnly && can('mis:crossBranch:quote') && can('mis:preinvoice:create');

  // Request the lot: every variety still to come, pre-filled with what's left
  // of it — the forecast while it's being bought/processed, final minus what's
  // already been received once it's finished. The requester trims from there.
  const openLotRequest = () => {
    const isFinal = dealLetter.status === 'final_product';
    const all = (dealLetter.varietyLines || []).map((l) => {
      // what the lot can still give — net of stone already promised to
      // accepted quotations / requests
      const left = Math.max(0, (isFinal
        ? (Number(l.finalQty) || 0) - (Number(l.receivedQty) || 0)
        : (Number(l.forecastQty) || 0)) - (Number(l.allocatedQty) || 0));
      return {
        productId: dealLetter.productId, variantId: l.variantId,
        code: l.variantCode, name: l.variantCode, unit: l.unit,
        quantity: left > 0 ? String(left) : '',
        available: left, supplyStage: dealLetter.status,
        lotLabel: dealLetter.contract?.number || dealLetter.coupeSeller?.name || '',
        sourceType: 'supply', supplyDealLetterId: dealLetter._id,
      };
    });
    const withSomethingLeft = all.filter((l) => l.available > 0);
    setRequestPreset({
      branchId: dealLetter.branchId, branchName, source: 'supply',
      supplyRecordId: dealLetter.supplyId,
      lines: withSomethingLeft.length ? withSomethingLeft : all,
    });
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    await dispatch(downloadSupplyDealLetterPdf({
      authCtx, axiosGlobal, id: dealLetterId, number: dealLetter?.contract?.number,
    }));
    setDownloading(false);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Title · actions · close on one row; on a phone the close button
          stays beside the title and the actions take a row of their own. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', flex: { xs: 1, sm: '0 1 auto' }, minWidth: 0 }} noWrap>
          {t('supply.dealLetter')}
          {dealLetter.contract?.number ? ` · ${dealLetter.contract.number}` : ''}
        </Typography>

        {onClose && (
          <IconButton size="small" onClick={onClose} sx={{ order: { xs: 2, sm: 4 } }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        <Box sx={{ ml: { xs: 0, sm: 'auto' }, display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap',
          width: { xs: '100%', sm: 'auto' }, order: { xs: 3, sm: 3 } }}>
          {canRequest && (
            <Tooltip title={t('supply.requestLotTip', { branch: branchName || t('inventory.thisBranch') })}>
              <Button size="small" variant="contained" onClick={openLotRequest}
                startIcon={<StorefrontIcon sx={{ fontSize: 14 }} />}
                sx={{ fontSize: '0.7rem', textTransform: 'none', height: 28 }}>
                {t('supply.requestLot')}
              </Button>
            </Tooltip>
          )}
          {/* The record opens as the CONTRACT — the same markup the PDF prints
              from — with the operational controls one click away. */}
          <ToggleButtonGroup size="small" exclusive value={view}
            onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="document" sx={{ px: 1, py: 0.25 }}>
              <Tooltip title={t('supply.viewContract')}><ArticleOutlinedIcon sx={{ fontSize: 15 }} /></Tooltip>
            </ToggleButton>
            <ToggleButton value="manage" sx={{ px: 1, py: 0.25 }}>
              <Tooltip title={t('supply.viewManage')}><TuneIcon sx={{ fontSize: 15 }} /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Button size="small" variant="outlined" onClick={handleDownloadPdf} disabled={downloading}
            startIcon={downloading ? <CircularProgress size={12} /> : <PictureAsPdfIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.7rem', textTransform: 'none', height: 28 }}>
            {t('supply.downloadContract')}
          </Button>

          {canEdit && (
            <Tooltip title={t('supply.editContract')}>
              <IconButton size="small" onClick={() => setEditOpen(true)}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── contract document ── */}
      {view === 'document' && (
        <Box>
          {previewLoading && !previewHtml ? (
            <Skeleton variant="rectangular" height={640} sx={{ borderRadius: '10px' }} />
          ) : previewHtml ? (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px',
              overflow: 'hidden', bgcolor: '#fff' }}>
              <DocPreviewFrame html={previewHtml} title="deal-letter-contract"
                height={{ xs: 560, md: 900 }} />
            </Box>
          ) : (
            <Box sx={{ py: 5, textAlign: 'center', border: '1px dashed', borderColor: 'divider',
              borderRadius: '10px' }}>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>
                {t('supply.contractPreviewUnavailable')}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {view === 'manage' && (<>
      <Stepper activeStep={stageIndex} sx={{ mb: 3 }}>
        {STAGES.map((s) => (
          <Step key={s}><StepLabel>{t(STAGE_LABEL_KEY[s])}</StepLabel></Step>
        ))}
      </Stepper>

      {canEdit && nextStage && (
        <Button size="small" variant="outlined" startIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
          onClick={advanceStatus} disabled={busy} sx={{ mb: 2 }}>
          {t('supply.advanceTo', { stage: t(STAGE_LABEL_KEY[nextStage]) })}
        </Button>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled' }}>
          {t('supply.coupeSpecLabel')}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem' }}>{dealLetter.coupeSpec || '—'}</Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled' }}>
          {t('supply.coupeSellerLabel')}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem' }}>
          {dealLetter.coupeSeller?.name} {dealLetter.coupeSeller?.phone ? `· ${dealLetter.coupeSeller.phone}` : ''}
        </Typography>
        {dealLetter.coupeSeller?.notes && (
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{dealLetter.coupeSeller.notes}</Typography>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', flex: 1 }}>
          {t('supply.varietyLinesLabel')}
        </Typography>
        {canEdit && !editingLines && (
          <IconButton size="small" onClick={startEditLines}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
        )}
        {editingLines && (
          <>
            <IconButton size="small" onClick={saveLines} disabled={busy}><CheckIcon sx={{ fontSize: 16, color: 'success.main' }} /></IconButton>
            <IconButton size="small" onClick={() => setEditingLines(false)}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
          </>
        )}
        {canPrice && !editingPricing && (
          <Button size="small" onClick={startEditPricing} sx={{ fontSize: '0.68rem', textTransform: 'none', ml: 1 }}>
            {t('supply.editPricing')}
          </Button>
        )}
        {editingPricing && (
          <>
            <IconButton size="small" onClick={savePricing} disabled={busy}><CheckIcon sx={{ fontSize: 16, color: 'success.main' }} /></IconButton>
            <IconButton size="small" onClick={() => setEditingPricing(false)}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
          </>
        )}
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('supply.colCode')}</TableCell>
              <TableCell align="right">{t('supply.colForecast')}</TableCell>
              <TableCell align="right">{t('supply.colFinal')}</TableCell>
              <TableCell align="right">{t('supply.colPrice')}</TableCell>
              <TableCell align="right">{t('supply.colReceived')}</TableCell>
              <TableCell align="right">
                <Tooltip title={t('supply.colPromisedTip')}><span>{t('supply.colPromised')}</span></Tooltip>
              </TableCell>
              {dealLetter.status === 'final_product' && canReceive && <TableCell align="right">{t('supply.colReceive')}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {dealLetter.varietyLines.map((l) => {
              // promised stone never goes into sellable stock (the server caps it too)
              const remaining = (l.finalQty || 0) - (l.receivedQty || 0) - (l.allocatedQty || 0);
              return (
                <TableRow key={l.variantId}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{l.variantCode}</TableCell>
                  <TableCell align="right">
                    {editingLines ? (
                      <TextField size="small" type="number" value={lineDrafts[l.variantId]?.forecastQty ?? ''}
                        onChange={(e) => setLineDrafts((p) => ({ ...p, [l.variantId]: { ...p[l.variantId], forecastQty: e.target.value } }))}
                        sx={{ width: 90 }} />
                    ) : (l.forecastQty ?? '—')}
                  </TableCell>
                  <TableCell align="right">
                    {editingLines ? (
                      <TextField size="small" type="number" value={lineDrafts[l.variantId]?.finalQty ?? ''}
                        onChange={(e) => setLineDrafts((p) => ({ ...p, [l.variantId]: { ...p[l.variantId], finalQty: e.target.value } }))}
                        sx={{ width: 90 }} />
                    ) : (l.finalQty ?? '—')}
                  </TableCell>
                  <TableCell align="right">
                    {editingPricing ? (
                      <TextField size="small" type="number" value={priceDrafts[l.variantId] ?? ''}
                        onChange={(e) => setPriceDrafts((p) => ({ ...p, [l.variantId]: e.target.value }))}
                        sx={{ width: 90 }} />
                    ) : (l.price != null ? `${l.price} ${l.currency}` : '—')}
                  </TableCell>
                  <TableCell align="right">{l.receivedQty || 0}</TableCell>
                  <TableCell align="right" sx={{ color: (l.allocatedQty || 0) > 0 ? '#ba68c8' : undefined }}>
                    {l.allocatedQty || 0}
                  </TableCell>
                  {dealLetter.status === 'final_product' && canReceive && (
                    <TableCell align="right">
                      {remaining > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                          <TextField size="small" type="number" placeholder={String(remaining)}
                            value={receiveDrafts[l.variantId] ?? ''}
                            onChange={(e) => setReceiveDrafts((p) => ({ ...p, [l.variantId]: e.target.value }))}
                            sx={{ width: 80 }} />
                          <Button size="small" variant="contained" disabled={busy}
                            onClick={() => submitReceive(l.variantId)}>
                            {t('supply.receive')}
                          </Button>
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: '0.7rem', color: 'success.main' }}>{t('supply.fullyReceived')}</Typography>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      <Divider sx={{ my: 3 }} />

      <DealLetterActivity dealLetterId={dealLetter._id} stage={dealLetter.status} readOnly={readOnly} />
      </>)}

      {!readOnly && (
        <DealLetterForm open={editOpen} onClose={() => setEditOpen(false)}
          supplyId={dealLetter.supplyId} productId={dealLetter.productId} dealLetter={dealLetter} />
      )}

      <CrossBranchRequestForm
        open={Boolean(requestPreset)}
        onClose={() => setRequestPreset(null)}
        onSaved={onRequested}
        preset={requestPreset} />
    </Box>
  );
}
