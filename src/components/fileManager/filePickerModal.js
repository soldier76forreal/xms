import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { CircularProgress, Divider } from '@mui/material';
import Style from "./filePickerModal.module.scss"; 
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
  p: 1,
};

export default function FilePickerModal(props) {
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const [loading , setLoading] = useState(false);

  const handleOpen = () => props.setOpenFilePicker(true);
  
  const handleClose = () => {
    props.setOpenFilePicker(false);
    history.push(lastUrl)
};
  const location = useLocation();
  const history = useHistory();

  const currentDisplaySelect = useSelector((state) => state.currentDisplayFilePicker);
  const routeLinkSelect = useSelector((state) => state.routeLinkFilePicker);
  const selectedItemsSelect = useSelector((state) => state.selectedItems);
  const floatSelect = useSelector((state) => state.float);
  const dispatch = useDispatch()
  const [lastUrl , setLastUrl] = useState({});

  function getLastPart(url) {
    const parts = url.split('/');
    return parts.at(-1);
  }
  useEffect(() => {
    if(props.openFilePicker === true){
        setLastUrl(location.pathname)
    }
  }, [props.openFilePicker]);


  const moveFileFolder = async() =>{   
        setLoading(true);
        var temp = []
        if(props.filePickerCount.count ==='single'){
            temp.push({id:props.filePickerCount.idAndType.id , type:props.filePickerCount.idAndType.type , supFolder:currentDisplaySelect.id})
        }else if(props.filePickerCount.count ==='multi'){
            temp = selectedItemsSelect.map(e=> {return {id:e.id , type:e.type , supFolder:currentDisplaySelect.id}})
        }
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/files/folderMove`,
                data:{dataArr:temp},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.refresh())
            setTimeout(()=>{
                setLoading(false)
                handleClose()
            }, 800)
            dispatch(actions.unselectAll())
        }catch(err){               
            console.log(err);
        }
    }
    const copyFileFolder = async() =>{   
        setLoading(true);
        var temp = []
        if(props.filePickerCount.count ==='single'){
            temp.push({id:props.filePickerCount.idAndType.id , type:props.filePickerCount.idAndType.type , supFolder:currentDisplaySelect.id})
        }else if(props.filePickerCount.count ==='multi'){
            temp = selectedItemsSelect.map(e=> {return {id:e.id , type:e.type , supFolder:currentDisplaySelect.id}})
        }

        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/files/folderCopy`,
                data:{dataArr:temp},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.refresh())
            setTimeout(()=>{
                setLoading(false)
                handleClose()
            }, 800)
            dispatch(actions.unselectAll())

        }catch(err){               
            console.log(err);
        }
    }
  return (
      <Modal
        open={props.openFilePicker}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <div style={{width:'100%'}}>
                {props.copyMoveType === 'copy'?
                    <div style={{padding:'15px 0px 15px 10px' ,fontSize:'17px', fontFamily:'YekanBold'}}>{`copy ${props.filePickerCount.count === 'single' ? 1 : selectedItemsSelect.length} item to…`}</div>
                :props.copyMoveType === 'move'?
                    <div style={{padding:'15px 0px 15px 10px' ,fontSize:'17px', fontFamily:'YekanBold'}}>{`Move ${props.filePickerCount.count === 'single' ? 1 : selectedItemsSelect.length} item to…`}</div>
                :null}
            </div>
            <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
           {props.openFilePicker === true?
            <div style={{padding:'8px 0px 14px 0px'}}>
                
                <div style={{textAlign:'left' , fontFamily:'YekanBold', fontSize:'13px'  , marginTop:'5px', padding:'0px 0px 0px 10px'}}>
                    <span style={{cursor:'pointer'}} onClick={()=>{history.push('/files')}}>XFILE</span>
                    <span style={{textAlign:'left' , fontFamily:'YekanLight', fontSize:'13px' , padding:'0px 0px 0px 10px'}}>
                        {routeLinkSelect.map(e=>{return(<span style={{cursor:'pointer'}} onClick={()=>{history.push(`/files${e}`)}}>/{getLastPart(e)}</span>)})}
                    </span>
                </div>
                <div className={Style.list}>
                    {currentDisplaySelect.docs.map((e,i)=>{
                        if(e.doc !== undefined){
                            return(
                                <div onClick={()=>{history.push(location.pathname === '/'?`/files/${decodeURI(e.doc.name)}`:`${location.pathname}/${decodeURI(e.doc.name)}`); dispatch(actions.openFilePickerFolder({id:e.doc._id , name:e.doc.name , index:i}));}} className={Style.listItSelf}>
                                    <Folder className={Style.folderIcon}></Folder>
                                    <div>{e.doc.name}</div>
                                    <div style={{margin:'0px 0px 0px auto' , padding:'0px 5px 0px 0px'}}><ArrowRight sx={{fontSize:'22px'}}></ArrowRight></div>
                                </div>
                            )
                        }
                    })}
                </div>
                <div  className={Style.buttonDiv}>
                    <div onClick={()=>{props.setNewFileModal(true);props.setNewFolderType('inFilePicker')}} style={{display:'flex',alignItems:'center', fontSize:'14px' , cursor:'pointer'}}>
                        New folder
                    </div>
                    <div style={{margin:'0px 0px 0px auto'}}>
                        <button onClick={handleClose} className={Style.cancelBtn}>Cancel</button>
                        {props.copyMoveType === 'move'?
                            <button onClick={moveFileFolder} className={Style.okButton} style={{paddingLeft:'20px' , paddingRight:'20px'}}>{loading === true?<CircularProgress size='13px' color='inherit'></CircularProgress>:'Ok'}</button>
                        :props.copyMoveType === 'copy'?
                            <button onClick={copyFileFolder} className={Style.okButton} style={{paddingLeft:'20px' , paddingRight:'20px'}}>{loading === true?<CircularProgress size='13px' color='inherit'></CircularProgress>:'Ok'}</button>
                        :null}
                    </div>
                </div>
            </div>
           :null}
        </Box>
      </Modal>
  );
}