import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { WhatsApp } from '@mui/icons-material';
import Style from './callModal.module.scss'
import Call from '@mui/icons-material/Call';
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

export default function CallModal(props) {

  const handleOpen = () => props.setOpenCallModal({status:true , list:props.openCallModal.list});
  const handleClose = () => props.setOpenCallModal({status:false , list:props.openCallModal.list});
  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={props.openCallModal.status}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={props.openCallModal.status}>
          <Box sx={style}>
            <div style={{width:'100%' , display:'flex' , justifyContent:'center'}}>
                <Call sx={{fontSize:'120px'}}></Call>
            </div>
            <div style={{padding:'5px 0px 0px 0px'}}>
              <div style={{fontFamily:'YekanBold' , display:'flex' , justifyContent:'center'  , marginBottom:'10px'}}>لیست شماره های تماس</div>
              {props.openCallModal.list.map(e=>{
                return(
                  <div style={{ marginBottom:'10px' , display:'flex' , justifyContent:'center'}}>
                    <div className={Style.btm}>     
                      <a onClick={()=>{props.setTargetDocForCall({status:true , docId : props.targetDocForCall.docId , phoneNumber:`${e.number}` , countryCode:`${e.countryCode}`}); handleClose() }} href={`tel:${e.countryCode}${e.number}`}>
                        <button>
                            <Call></Call>
                        </button>
                      </a>
                      <div style={{marginLeft:'5px' , display:'flex' , fontSize:'18px' , padding:'5px 10px 0px 10px'}}>
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