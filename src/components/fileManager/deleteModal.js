import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import DeleteIcon from '@mui/icons-material/Delete';
import Style from "./deleteModal.module.scss"; 
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useContext, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';

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

export default function DeleteModal(props) {

  const selectedItemsSelect = useSelector((state) => state.selectedItems);
  const handleOpen = () => props.setDeleteFileModal(true);
  const handleClose = () => props.setDeleteFileModal(false);
  const authCtx = useContext(AuthContext);
  const dispatch = useDispatch()

  const axiosGlobal = useContext(AxiosGlobal);
  const [loading , setLoading] = useState(false);

  const deleteFileFolder = async()=>{ 
    var data = []
    if(props.deleteCount === 'single'){
      data.push(props.fileFolderIdType)
    }else if(props.deleteCount === 'multi'){
      selectedItemsSelect.forEach(element => {
        data.push({type:element.type , id:element.id})
      });
    }
    try{
      setLoading(true);
      const response = await authCtx.jwtInst({
        method:'post',
        url:`${axiosGlobal.defaultTargetApi}/files/deleteFolderFile`,
        data:data,
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
      dispatch(actions.refresh())
      dispatch(actions.unselectAll())

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
        open={props.deleteFileModal}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <div style={{textAlign:'center'}}>
                <DeleteIcon sx={{fontSize:'180px'}}></DeleteIcon>
                <h3 style={{fontFamily:'YekanBold'}}>Delete foler?</h3>
                <h6>{props.deleteCount === 'single'?'1 item will be deleted!':props.deleteCount === 'multi'?`${selectedItemsSelect.length} item will be deleted!`:null}</h6>
                <div className={Style.buttonDiv}>
                    <div style={{margin:'0px auto 0px auto'}}>
                        <button onClick={handleClose} className={Style.cancelBtn}>Cancel</button>
                        <button onClick={deleteFileFolder} className={Style.okButton} style={{paddingLeft:'20px' , paddingRight:'20px'}}>{loading === true?<CircularProgress size='16px' color='inherit'></CircularProgress>:'Ok'}</button>                    
                    </div>
                </div>
            </div>
        </Box>
      </Modal>
  );
}