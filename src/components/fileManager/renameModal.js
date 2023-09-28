import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { CircularProgress, Divider } from '@mui/material';
import Style from "./renameModal.module.scss"; 
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border:'none',
  boxShadow: 24,
  p: 1,
};

export default function RenameModal(props) {
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const [loading , setLoading] = useState(false);
  const dispatch = useDispatch()
  const handleOpen = () => props.setOpenRenameModal(true);
  const handleClose = () => props.setOpenRenameModal(false);
  const renameFolder = async()=>{
    
      try{
        setLoading(true);
        const response = await authCtx.jwtInst({
          method:'post',
          url:`${axiosGlobal.defaultTargetApi}/files/folderRename`,
          data:{typeId:props.fileFolderIdType , newName:props.renameFolder},
          config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
        })
        dispatch(actions.refresh())
        setTimeout(()=>{
          setLoading(false)
          handleClose()
        }, 800)

      }catch(err){
        console.log(err)
      }
  }
  return (
    
      <Modal
        open={props.openRenameModal}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <div style={{width:'100%'}}>
                <div style={{padding:'15px 0px 15px 10px' ,fontSize:'17px', fontFamily:'YekanBold'}}>Rename</div>
            </div>
            <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
            <div style={{padding:'8px 0px 14px 0px'}}>
                <div className={Style.inputDiv}>
                    <input value={props.renameFolder} onChange={(e)=>{props.setRenameFolder(e.target.value)}} placeholder='Name'></input>
                </div>
                <div className={Style.buttonDiv}>
                    <button onClick={handleClose} className={Style.cancelBtn}>Cancel</button>
                    <button onClick={renameFolder} className={Style.okButton} style={{paddingLeft:'20px' , paddingRight:'20px'}}>{loading === true?<CircularProgress size='13px' color='inherit'></CircularProgress>:'Ok'}</button>
                </div>

            </div>
        </Box>
      </Modal>

  );
}