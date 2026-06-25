import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { WhatsApp } from '@mui/icons-material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Style from './errorModal.module.scss'
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

export default function ErrorModal(props) {

  const handleOpen = () => props.setErrorStatus(true);
  const handleClose = () => props.setErrorStatus(false);
  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={props.errorStatus}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={props.errorStatus}>
          <Box sx={style}>
            <div style={{ textAlign:'center'  , justifyContent:'center'}}>
                <div style={{width:'100%' , display:'flex' , justifyContent:'center'}}>
                    <WarningAmberIcon sx={{fontSize:'135px'}}></WarningAmberIcon>
                </div>
                <div style={{padding:'10px 0px 0px 0px' , fontSize:'28px' , color:'red' , textAlign:'center', fontFamily:'yekanBold'}}>
                    خطا
                </div>
                <div style={{padding:'10px 0px 0px 0px' , fontSize:'16px' , textAlign:'center', fontFamily:'yekanBold'}}>
                {props.errorContext}    
                </div>
                <div onClick={handleClose} style={{backgroundColor:'#000' , cursor:'pointer' , margin:'20px auto 0px auto' , color:'#fff' , maxWidth:'70px' , fontSize:'13px' , padding:'7px 0px 7px 0px' , display:'flex' , justifyContent:'center'}}>
                    باشه
                </div>
            </div>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}