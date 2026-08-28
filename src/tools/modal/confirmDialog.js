import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button
} from '@mui/material';

/**
 * Reusable in-app confirmation dialog (replaces window.confirm).
 * Props:
 *   open, onClose, onConfirm
 *   title, message
 *   confirmLabel (default "Confirm"), cancelLabel (default "Cancel")
 *   destructive — makes confirm button red (#EA005A)
 *   sx — optional passthrough to the root Dialog (e.g. a zIndex bump when this
 *        confirm can be opened from inside another Dialog/Drawer, which would
 *        otherwise sit behind it — see tutorialForm.js for a real example)
 */
export default function ConfirmDialog({
  open, onClose, onConfirm,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  sx,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={sx}
      PaperProps={{
        sx: {
          borderRadius: '14px',
          border: t => `1.5px solid ${t.palette.divider}`,
          backgroundImage: 'none',
          minWidth: 320,
        }
      }}
    >
      <DialogTitle sx={{ fontSize: '15px', fontWeight: 700, pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <DialogContentText sx={{ fontSize: '13px', color: 'text.secondary' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          size="small"
          variant="outlined"
          sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '13px' }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={() => { onConfirm(); onClose(); }}
          size="small"
          variant="contained"
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontSize: '13px',
            ...(destructive && {
              bgcolor: '#EA005A',
              '&:hover': { bgcolor: '#c0004a' },
            }),
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
