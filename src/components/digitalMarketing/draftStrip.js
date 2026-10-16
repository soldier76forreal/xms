// ── "You have an unsent draft" ──────────────────────────────────────────────
// Pinned above the list so a half-filled batch is something you SEE rather
// than something you have to remember. The draft itself never left this
// browser — uploading is what creates a record — so this is deliberately not
// styled as a row in the list: it is a reminder, not an item.
import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';

import { listDrafts, clearDraft } from './draftStore';
import ConfirmDialog from '../../tools/modal/confirmDialog';

const relTime = (ts, t) => {
  if (!ts) return '';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return t('dm.draftJustNow');
  if (mins < 60) return t('dm.draftMinutesAgo', { count: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t('dm.draftHoursAgo', { count: hours });
  return new Date(ts).toLocaleDateString();
};

/**
 * @param kind     'rawContent' | 'readyToUpload'
 * @param onOpen   called with the draft when the person wants to carry on
 * @param refreshKey bump it to re-read after the form closes
 */
export default function DraftStrip({ kind, onOpen, T, refreshKey }) {
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState([]);
  const [confirmKey, setConfirmKey] = useState(null);

  const reload = useCallback(async () => {
    setDrafts(await listDrafts(kind));
  }, [kind]);

  useEffect(() => { reload(); }, [reload, refreshKey]);

  // Another tab may have saved or sent one; re-read when this one is looked at
  // again rather than showing a draft that is already gone.
  useEffect(() => {
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);

  const discard = async () => {
    const key = confirmKey;
    setConfirmKey(null);
    if (!key) return;
    await clearDraft(key);
    reload();
  };

  if (!drafts.length) return null;

  return (
    <>
      {drafts.map((d) => {
        const fields = d.fields || {};
        const fileCount = (d.files || []).length;
        const bits = [
          fields.title || t('dm.draftUntitled'),
          fileCount ? t('dm.draftFileCount', { count: fileCount }) : null,
          fields.textContent ? t('dm.draftHasText') : null,
        ].filter(Boolean);

        return (
          <Box key={d.key} sx={{
            display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25,
            px: 1.5, py: 1.25, borderRadius: '12px',
            border: `1px dashed ${T.BD || T.DIVIDER}`,
            bgcolor: 'rgba(255,193,7,0.08)',
          }}>
            <EditNoteIcon sx={{ fontSize: 20, color: '#B26A00', flexShrink: 0 }} />
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: '#B26A00',
                textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('dm.draftUnsent')}
              </Typography>
              <Typography noWrap sx={{ fontSize: '0.82rem', color: T.TEXT_PRI }}>
                {bits.join(' · ')}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: T.TEXT_TER }}>
                {relTime(d.updatedAt, t)}
                {d.droppedContent ? ` · ${t('dm.draftNeedsRepick')}` : ''}
              </Typography>
            </Box>
            <Button size="small" variant="contained" onClick={() => onOpen(d)}
              sx={{ textTransform: 'none', borderRadius: '8px', flexShrink: 0 }}>
              {t('dm.draftContinue')}
            </Button>
            <Tooltip title={t('common.discard')}>
              <IconButton size="small" onClick={() => setConfirmKey(d.key)}
                sx={{ color: T.TEXT_TER, flexShrink: 0 }}>
                <DeleteOutlineIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}

      <ConfirmDialog
        open={Boolean(confirmKey)}
        onClose={() => setConfirmKey(null)}
        onConfirm={discard}
        title={t('dm.discardDraftTitle')}
        message={t('dm.discardDraftMessage')}
        confirmLabel={t('common.discard')}
        destructive
      />
    </>
  );
}
