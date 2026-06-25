import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { CircularProgress, Divider } from '@mui/material';
import Style from "./selectTitleModal.module.scss"; 
import { ArrowRight, Folder } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useContext, useEffect, useState } from 'react';
import {   actions, setFilesAsync, uploadFile } from "../../store/store";
import { useHistory, useLocation } from 'react-router-dom';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '95%',
    maxWidth:'600px',
  bgcolor: 'background.paper',
  border:'none',
  boxShadow: 24,
  zIndex:'1000000',
  p: 1,
};

export default function SelectTitleModal(props) {
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const [loading , setLoading] = useState(false);

  const handleOpen = () => props.setOpenFilePicker(true);
  
  const handleClose = () => {
    props.setSelectTitleModal(false);
    
};
  const location = useLocation();
  const history = useHistory();

  const currentDisplaySelect = useSelector((state) => state.currentDisplayFilePicker);
  const routeLinkSelect = useSelector((state) => state.routeLinkFilePicker);
  const selectedItemsSelect = useSelector((state) => state.selectedItems);
  const floatSelect = useSelector((state) => state.float);
  const dispatch = useDispatch()
  const [lastUrl , setLastUrl] = useState({});




  return (
      <Modal
        open={props.selectTitleModal}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>

        </Box>
      </Modal>
  );
}