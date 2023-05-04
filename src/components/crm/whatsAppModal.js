import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { WhatsApp } from '@mui/icons-material';
import Style from './whatsAppModal.module.scss';
import CloseIcon from '@mui/icons-material/Close';

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
          <Box className={Style.container} sx={style}>
            <div onClick={handleClose} style={{marginTop:'0px' , position:'absolute' , right:'0px' , backgroundColor:'black' , padding:'10px' , borderBottomLeftRadius:'10px'}}><CloseIcon sx={{color:'white'}}></CloseIcon></div>
            <div style={{padding:'40px 30px 40px 30px'}}>           
              <div className={Style.callIconDiv}>
                  <WhatsApp className={Style.callIcon}></WhatsApp>
              </div>
              <div style={{padding:'5px 0px 0px 0px'}}>
                <div className={Style.callNumberListTitle}>لیست شماره های واتساپ</div>
                {props.whatsAppMsgList.map(e=>{
                  return(
                    <div className={Style.callBtn}>
                      <div className={Style.btm}>     
                        <a href={`https://api.whatsapp.com/send?phone=${e.countryCode}${e.number}`}>
                          <button>
                          ارسال پیام
                          </button>
                        </a>
                        <div className={Style.number}>
                          {e.countryCode}-{e.number}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div> 
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}