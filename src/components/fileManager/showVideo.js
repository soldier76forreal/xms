import Style from './showVideo.module.scss'
import React,{useState} from 'react'
import ReactDOM from 'react-dom'
import ReactDom from 'react-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import ReactPlayer from 'react-player'
import { CloseRounded } from '@mui/icons-material';
const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'auto',
    bgcolor: 'none',
    border: 'none',
    boxShadow: 0,
    p: 0,
  };
const ShowVideoPortal = (props) => {

    const handleOpen = () => props.setShowVideo(true);
    const handleClose = () =>props.setShowVideo(false);
	return (

        <div >
            {props.showVideo === true?
            <div onClick={handleClose} style={{width:'40px', height:'40px',backgroundColor:'white',border:'solid black 2px', top:'30px',right:'30px',position:'absolute' , borderRadius:'5px' , display:'flex',justifyContent:'center',alignItems:'center'}}>
                <CloseRounded sx={{fontSize:'32px'}}></CloseRounded>
            </div>
            :null}
            <Modal
            open={props.showVideo}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            >      
            <Box sx={style}>
                <ReactPlayer 
                controls 
                width='100%'
                height='100%'
                url={props.theVideo} />
            </Box>
            </Modal>
        </div>

	)
}


const ShowVideo = (props)=>{
    
    return(
      <React.Fragment>
          {ReactDom.createPortal(
              <ShowVideoPortal 
                showVideo={props.showVideo}
                setShowVideo={props.setShowVideo}
                theVideo={props.theVideo}
              ></ShowVideoPortal>
          ,
          document.getElementById('modal')
          
          )}

      </React.Fragment>
  );
}

export default ShowVideo;