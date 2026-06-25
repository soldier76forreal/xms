import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { CircularProgress, Divider, Switch } from '@mui/material';
import Style from "./shareTheLink.module.scss"; 
import { ArrowRight, CheckBox, Folder } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useContext, useEffect, useRef, useState } from 'react';
import DatePicker from 'react-date-picker';
import {   actions, newLink, setFilesAsync, uploadFile } from "../../store/store";
import { useHistory, useLocation } from 'react-router-dom';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { alpha, styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
const PinkSwitch = styled(Switch)(({ theme }) => ({
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: '#000',
      '&:hover': {
        backgroundColor: alpha('#000', theme.palette.action.hoverOpacity),
      },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: '#000',
    },
  }));

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

export default function ShareTheLink(props) {
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const customDateRef = useRef()
    const dispatch = useDispatch();

    const [openDatePicker , setOpenDatePicker] = useState(false);




  const handleOpen = () => props.setOpenShareLink(true);
  
  const handleClose = () => {
    props.setOpenShareLink(false);
    history.push(lastUrl)
};
  const location = useLocation();
  const history = useHistory();

  const currentDisplaySelect = useSelector((state) => state.currentDisplayFilePicker);
  const routeLinkSelect = useSelector((state) => state.routeLinkFilePicker);
  const selectedItemsSelect = useSelector((state) => state.selectedItems);
  const floatSelect = useSelector((state) => state.float);
  const loading = useSelector((state) => state.newLinkCreationLoading);

  const [lastUrl , setLastUrl] = useState({});

  const [timer , setTimer] = useState(2880);
  const [msg , setMsg] = useState('');
  const [showMyName , setShowMyName] = useState(true);

  const [active , setActive] = useState('day');


  const ok = ()=>{
    dispatch(newLink({authCtx:authCtx , axiosGlobal:axiosGlobal, document:props.filePickerCount.idAndType, timer:timer, msg:msg ,displayName:showMyName}))
    props.setSuccessToast({status:true , msg:'Link copied to clipboard!'});
    const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'Link copied to clipboard!'})}, 3000);
    setTimeout(()=>{

        handleClose()
    }, 800)
  }

  return (
      <Modal
        open={props.openShareLink}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        sx={{zIndex:'10000', padding:'0px 30px 0px 30px'}}
        aria-describedby="modal-modal-description"
      >
        <div>
            <Box sx={style}>
                <div style={{width:'100%'}}>
                    <div style={{padding:'15px 0px 15px 10px' ,fontSize:'17px', fontFamily:'YekanBold'}}>Create link</div>
                </div>

                <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                <div style={{padding:'8px 0px 14px 0px'}}>
                    
                    <div style={{textAlign:'left' , fontFamily:'YekanBold', fontSize:'13px'  , marginTop:'10px' , marginBottom:'20px', padding:'0px 0px 0px 10px'}}>
                        <span style={{cursor:'pointer'}}>Set expiration time</span>
                    </div>
                    <div className={Style.expTimeList}>
                        <ul>
                            <div>
                                <li onClick={()=>{setTimer(60); setActive('hour')}} className={active === 'hour' ?Style.selectedLeftSide:Style.sidesLeft}>1<span style={{fontSize:'8px' , marginLeft:'2px'}}>Hour</span></li>
                                <li onClick={()=>{setTimer(2880); setActive('day')}} className={active === 'day' ?Style.selected:Style.centers}>2<span style={{fontSize:'8px' , marginLeft:'2px'}}>Day</span></li>
                                <li onClick={()=>{setTimer(20160); setActive('weeks')}} className={active === 'weeks' ?Style.selected:Style.centers}>2<span style={{fontSize:'8px' , marginLeft:'2px'}}>Weeks</span></li>
                                <li  onClick={()=>{setTimer(20160); setActive('weeks')}} className={active === 'customTime' ?Style.selectedLeftSide:Style.LeftRight}>No limit</li>
                            </div>
                        </ul>
                    </div>
                    {openDatePicker === true?
                        <div>
                                {/* <DayPicker
                                mode="single"
                                // selected={selected}
                                // onSelect={setSelected}
                                // footer={footer}
                                /> */}
                        </div>
                    :null}
                    <div style={{fontSize:'13px' , textAlign:'center' , marginTop:'10px'}}>This link will expire from now!</div>
                    <div style={{marginTop:'25px'}}>
                        <div style={{textAlign:'left' , fontFamily:'YekanBold', fontSize:'13px'  , marginTop:'10px' , marginBottom:'0px', padding:'0px 0px 0px 10px'}}>
                            <span style={{cursor:'pointer'}}>Write your message...</span>
                        </div>
                        
                        <div className={Style.inputDiv}>
                            <input value={msg} onChange={(e)=>{setMsg(e.target.value)}} placeholder='...'></input>
                        </div>
                    </div>

                    <div style={{marginTop:'15px'}}>                    
                        <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                            <div>
                                <div style={{paddingTop:'0px'}} className={Style.buttonDiv}>
                                    <div onClick={()=>{props.setNewFileModal(true);props.setNewFolderType('inFilePicker')}} style={{display:'flex',alignItems:'center', fontSize:'14px' , cursor:'pointer'}}>
                                        Display my name
                                    </div>
                                    <div style={{margin:'0px 0px 0px auto'}}>
                                        <PinkSwitch onChange={()=>{showMyName===true?setShowMyName(false):setShowMyName(true)}} checked={showMyName} />                        
                                    </div>
                                </div>
                            </div>
                        <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                    </div>



                    <div  className={Style.buttonDiv}>
                        <button onClick={handleClose} className={Style.cancelBtn}>Cancel</button>
                        <button onClick={ok}  className={Style.okButton} style={{paddingLeft:'20px' , paddingRight:'20px'}}>{loading === true?<span style={{paddingLeft:'14px', paddingRight:'14px'}}><CircularProgress size='13px' color='inherit'></CircularProgress></span>:'Create'}</button>
                    </div>
                    
                </div>
            </Box>
        </div>
      </Modal>
  );
}