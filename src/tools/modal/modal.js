import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const Modal = (props) => {
  return (
    <Dialog
      open={props.showModal === true}
      onClose={props.closeModalFn}
      maxWidth="xs"
      fullWidth
    >
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 1 }}>
          <DeleteOutlineIcon color="error" sx={{ fontSize: 72 }} />
          <DialogTitle sx={{ p: 0, textAlign: 'center' }}>مطمئن هستید؟</DialogTitle>
          <DialogContentText sx={{ textAlign: 'center', fontSize: '0.875rem' }}>
            این عملیات قابل بازگشت نیست.
          </DialogContentText>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={props.closeModalFn} variant="outlined" fullWidth>
          بستن
        </Button>
        <Button onClick={props.delete} variant="contained" color="error" fullWidth>
          حذف
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
