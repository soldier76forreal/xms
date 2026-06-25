
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { Divider } from '@mui/material';
import Style from "./newFileModal.module.scss"; 
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

import AuthContext from '../authAndConnections/auth';
import { useContext } from 'react';
import { useState } from 'react';
import jwtDecode from 'jwt-decode';
import { CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from "react-redux";
import { actions } from '../../store/store';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth:350,
  width: '100%',
  bgcolor: 'background.paper',
  border:'none',
  boxShadow: 24,
  padding:'0px 40px 0px 40px',
  p: 1,
};

export default function NewFileModal(props) {  
    const authContext = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const handleOpen = () => props.setNewFileModal(true);
    const handleClose = () => props.setNewFileModal(false);
    const dispatch = useDispatch()
    const [loading , setLoading] = useState(false);
    const [theName , setTheName] = useState('');
    const currentDisplay = useSelector((state) => state.currentDisplay);
    const currentDisplayFilePicker = useSelector((state) => state.currentDisplayFilePicker);

    const newFile = async() =>{   
        const decodeJwt = jwtDecode(authContext.token)
        setLoading(true);
        var temp = []
        var current;
        var data;
        if(props.newFolderType === 'inFilePicker'){
            data = {
                supFolder:currentDisplayFilePicker.id,
                name:theName 
            }
        }else if(props.newFolderType === 'mainNewFolderBtn'){
            data = {
                supFolder:currentDisplay.id,
                name:theName 
            }
        }
        try{
            const response = await authContext.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/files/newFolder`,
                data:data,
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })

            dispatch(actions.refresh())
    
            setTimeout(()=>{
                setLoading(false)
                handleClose()
            }, 800)
        }catch(err){               
            console.log(err);
        }
    }


  return (
      <Modal
        open={props.newFileModal}
        onClose={handleClose}
        sx={{zIndex:'20000'}}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <div style={{width:'100%'}}>
                <div style={{padding:'15px 0px 15px 10px' ,fontSize:'17px', fontFamily:'YekanBold'}}>New folder</div>
            </div>
            <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
            <div style={{padding:'8px 0px 14px 0px'}}>
                <div className={Style.inputDiv}>
                    <input onChange={(e)=>{setTheName(e.target.value)}} placeholder='Name'></input>
                </div>
                <div className={Style.buttonDiv}>
                    <button onClick={handleClose} className={Style.cancelBtn}>Cancel</button>
                    <button onClick={newFile} className={Style.okButton} style={{paddingLeft:'20px' , paddingRight:'20px'}}>{loading === true?<CircularProgress size='13px' color='inherit'></CircularProgress>:'Ok'}</button>
                </div>

            </div>
        </Box>
      </Modal> 
       );
}