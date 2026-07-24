import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Inventory2Icon from '@mui/icons-material/Inventory2';

// Delete confirm for an invoice/pre-invoice. When the doc already decremented
// stock (paid invoice — see stockDecremented on the model), offers an
// opt-in "restore stock" checkbox so deleting a mistaken invoice doesn't leave
// a phantom stock deduction with nothing to explain it. Defaults to checked —
// restoring is the safer default for inventory accuracy. Mirrors the styling
// of tools/modal/confirmDialog.js but needs the extra checkbox, so it's its
// own small component rather than extending the shared generic one.
export default function DeleteInvoiceDialog({ doc, open, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [restoreStock, setRestoreStock] = useState(true);

  useEffect(() => { if (open) setRestoreStock(true); }, [open, doc?._id]);

  if (!doc) return null;

  const isInvoice = doc.docType === 'invoice';
  const label = isInvoice ? t('mis.docTypeInvoice') : t('mis.docTypeQuotation');
  const showStockOption = isInvoice && doc.stockDecremented;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '14px',
          border: t => `1.5px solid ${t.palette.divider}`,
          backgroundImage: 'none',
          minWidth: 340,
        }
      }}
    >
      <DialogTitle sx={{ fontSize: '15px', fontWeight: 700, pb: 1 }}>
        {t('mis.deleteDocTitle', { type: label, number: doc.docNumber })}
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <DialogContentText sx={{ fontSize: '13px', color: 'text.secondary' }}>
          {t('mis.deleteDocMessage')}
        </DialogContentText>

        {showStockOption && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: '10px', border: t => `1px solid ${t.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Inventory2Icon sx={{ fontSize: 16, color: 'text.secondary', mt: '2px', flexShrink: 0 }} />
              <Box>
                <FormControlLabel
                  sx={{ m: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={restoreStock}
                      onChange={(e) => setRestoreStock(e.target.checked)}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                      {t('mis.restoreStock')}
                    </Typography>
                  }
                />
                <Typography sx={{ fontSize: '12px', color: 'text.secondary', lineHeight: 1.4 }}>
                  {t('mis.restoreStockNote')}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          size="small"
          variant="outlined"
          sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '13px' }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={() => { onConfirm(showStockOption && restoreStock); onClose(); }}
          size="small"
          variant="contained"
          sx={{
            borderRadius: '10px', textTransform: 'none', fontSize: '13px',
            bgcolor: '#EA005A', '&:hover': { bgcolor: '#c0004a' },
          }}
        >
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
