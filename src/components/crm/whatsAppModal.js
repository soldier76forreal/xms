import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { WhatsApp } from '@mui/icons-material';
import Style from './whatsAppModal.module.scss'
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: 'none',
  boxShadow: 24,
  p: 4,
};

export default function WhatsAppModal(props) {

  const handleOpen = () => props.setOpenWhatsAppModal(true);
  const handleClose = () => props.setOpenWhatsAppModal(false);
  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={props.openWhatsAppModal}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={props.openWhatsAppModal}>
          <Box sx={style}>
            <div style={{width:'100%' , display:'flex' , justifyContent:'center'}}>
                <WhatsApp sx={{fontSize:'120px'}}></WhatsApp>
            </div>
            <div style={{padding:'10px 0px 0px 0px'}}>
              <div style={{fontFamily:'YekanBold' , display:'flex' , justifyContent:'center'  , marginBottom:'10px'}}>لیست شماره های واتساپ</div>
              {props.whatsAppMsgList.map(e=>{
                return(
                  <div style={{ marginBottom:'10px' , display:'flex' , justifyContent:'center'}}>
                    <div className={Style.btm}>     
                      
                      <a href={`https://api.whatsapp.com/send?phone=${e.countryCode}${e.number}`}>
                        <button>
                        ارسال پیام
                        </button>
                      </a>
                      <div style={{marginLeft:'5px' , display:'flex' ,width:'150px' , fontSize:'18px' , padding:'5px 10px 0px 10px'}}>
                        {e.countryCode}-{e.number}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}