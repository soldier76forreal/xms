import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import DeleteIcon from '@mui/icons-material/Delete';
import Style from "./deleteModal.module.scss"; 

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function DeleteModal() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <div style={{textAlign:'center'}}>
                <DeleteIcon sx={{fontSize:'180px'}}></DeleteIcon>
                <h3 style={{fontFamily:'YekanBold'}}>Delete foler?</h3>
                <h6>Folder Name</h6>
                <div className={Style.buttonDiv}>
                    <div style={{margin:'0px auto 0px auto'}}>
                        <button className={Style.cancelBtn}>Cancel</button>
                        <button className={Style.okButton} style={{paddingLeft:'20px' , paddingRight:'20px'}}>Ok</button>                    
                    </div>
                </div>
            </div>
        </Box>
      </Modal>
  );
}