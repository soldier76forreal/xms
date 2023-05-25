import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { Divider } from '@mui/material';
import Style from "./filePickerModal.module.scss"; 
import { ArrowRight, Folder } from '@mui/icons-material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  border:'none',
  boxShadow: 24,
  p: 1,
};

export default function FilePickerModal() {
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
            <div style={{width:'100%'}}>
                <div style={{padding:'15px 0px 15px 10px' ,fontSize:'17px', fontFamily:'YekanBold'}}>Move 1 item to…</div>
            </div>
            <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
            <div style={{padding:'8px 0px 14px 0px'}}>
                <div style={{textAlign:'left' , fontFamily:'YekanBold', fontSize:'13px'  , marginTop:'5px', padding:'0px 0px 0px 10px'}}>XFILE<span style={{textAlign:'left' , fontFamily:'YekanLight', fontSize:'13px' , padding:'0px 0px 0px 10px'}}>/subFile</span></div>
                <div className={Style.list}>
                    <div className={Style.listItSelf}>
                        <Folder className={Style.folderIcon}></Folder>
                        <div>this is a test</div>
                    </div>
                    <div className={Style.listItSelf}>
                        <Folder className={Style.folderIcon}></Folder>
                        <div>this is a test</div>
                        <div style={{margin:'0px 0px 0px auto' , padding:'0px 5px 0px 0px'}}><ArrowRight sx={{fontSize:'22px'}}></ArrowRight></div>
                    </div>
                </div>
                <div  className={Style.buttonDiv}>
                    <div style={{display:'flex',alignItems:'center', fontSize:'14px' , cursor:'pointer'}}>
                        New folder
                    </div>
                    <div style={{margin:'0px 0px 0px auto'}}>
                        <button className={Style.cancelBtn}>Cancel</button>
                        <button className={Style.okButton} style={{paddingLeft:'20px' , paddingRight:'20px'}}>Ok</button>
                    </div>
                </div>
            </div>
        </Box>
      </Modal>
  );
}