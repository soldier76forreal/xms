import { Fragment, useContext, useState } from "react";
import Style from "./bottomUploadList.module.scss"; 
import { ArrowDownward, FileCopy, HighlightOff, HourglassBottom, UploadFile } from "@mui/icons-material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import Box from '@mui/material/Box';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LinearProgress from '@mui/material/LinearProgress';
import { useDispatch, useSelector } from "react-redux";
import {   actions, setFileForRetry, setFilesAsync, uploadFile } from "../../store/store";
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';


import { useEffect } from "react";

function BottomUploadList(props) {
    const dispatch=useDispatch()
    const [togger , setToggler] = useState(false);
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    
    const [minimizedStatus , setMinimizedStatus] = useState({uploaded:null , allFiles:null})
    const currentDisplay = useSelector((state) => state.currentDisplay);
    const uploadQueue = useSelector((state) => state.uploadQueue);
    const onGoingUpload = useSelector((state) => state.onGoingUpload);

    useEffect(() => {
        const filter = uploadQueue.filter(e=>{return e.uploaded === true})
        setMinimizedStatus({uploaded:filter.length , allFiles:uploadQueue.length})
    }, [uploadQueue]);
    const toggler = () =>{
        setToggler(!togger)
    }
    // temp.push({uploading:false , file:element, progress:0 , uploaded:null , error:{status:false , msg:''}})
    const handleFileChange = async(i) => {
        dispatch(setFileForRetry({index:i}));
        // dispatch(uploadFile({authCtx:authCtx , axiosGlobal:axiosGlobal , files:uploadQueue , currentDisplay}))
    };
  return (
    <Fragment>
        <div style={{height:togger===true?'400px':'40px',backgroundColor:'white' ,zIndex:'1000'}} className={Style.bottomDiv}>
            <div onClick={toggler} className={Style.innerDiv}>
                <span>{`${minimizedStatus.uploaded} of ${minimizedStatus.allFiles} upload complete`}</span>
                <div onClick={toggler}>{togger===true?<KeyboardArrowDownIcon></KeyboardArrowDownIcon>:<KeyboardArrowUpIcon></KeyboardArrowUpIcon>}</div>

            </div>
            <div style={{paddingBottom:'50px'}} className={Style.list}>
                {uploadQueue.map((e,i)=>{
                    
                    //uploading
                    if(e.cancel === false &&e.uploading === true && e.uploaded === null && e.error.status === false && e.show === true){
                        return(
                            <div className={Style.listItem}>
                                <div style={{padding:'5px 0px 5px 0px'}}>
                                    <div style={{display:'flex' ,  alignItems:'center' , width:'100%' , padding:'0px 10px 0px 10px'}}>
                                        <UploadFile sx={{color:'black', fontSize:'22px'}}></UploadFile>
                                        <div style={{display:'flex' , padding:'10px' , justifyContent:'center', alignItems:'center'}}>
                                            <DescriptionIcon sx={{fontSize:'20px' , color:'gray'}}></DescriptionIcon>
                                        </div>
                                        <div style={{display:'inline-block'}}>
                                            <div style={{fontSize:'16px'}}>{e.file.name}</div>
                                            <div style={{textAlign:'left',fontSize:'14px' , color:'gray', padding:'0px'}}>uploading...</div>
                                        </div>
                                        <div style={{margin:'0px 0px 0px auto', fontSize:'14px'}}>
                                            <button onClick={()=>{dispatch(actions.cancelTheUploading({index:i ,uploading:false , cancel:true ,uploaded:false})); e.cancelToken.cancel()}} style={{border:'none', padding:'5px 10px 5px 10px'}}>cancel</button>
                                        </div>
                                    </div>
                                </div>
                                <Box sx={{ width: '100%' }}>
                                    <LinearProgress  variant="determinate" value={e.progress} />
                                </Box>
                            </div>
                        )
                    }else if(e.cancel === false &&e.uploading === false && e.uploaded === true && e.error.status === false && e.show === true){
                        return(
                            <div className={Style.listItem}>
                                <div style={{padding:'5px 0px 5px 0px'}}>
                                    <div style={{display:'flex' ,  alignItems:'center' , width:'100%' , padding:'0px 10px 0px 10px'}}>
                                        <CheckCircleOutlineIcon  sx={{color:'green' , fontSize:'22px'}}></CheckCircleOutlineIcon>
                                        <div style={{display:'flex' , padding:'10px' , justifyContent:'center', alignItems:'center'}}>
                                            <DescriptionIcon sx={{fontSize:'18px' , color:'gray'}}></DescriptionIcon>
                                        </div>
                                        <div style={{display:'inline-block'}}>
                                            <div style={{fontSize:'16px'}}>{e.file.name}</div>
                                            <div style={{textAlign:'left',fontSize:'14px' , color:'gray', padding:'0px'}}>uploaded</div>
                                        </div>
                                        <div style={{margin:'0px 0px 0px auto', fontSize:'14px'}}>
                                        </div>
                                    </div>
                                </div>
                                <Box sx={{ width: '100%' }}>
                                    <LinearProgress  variant="determinate" value={e.progress} />
                                </Box>
                            </div>
                        )
                    }else if(e.cancel === true && e.uploading === false && e.uploaded === false && e.error.status === true && e.show === true){
                         
                        return(
                            <div className={Style.listItem}>
                                <div style={{padding:'5px 0px 5px 0px'}}>
                                    <div style={{display:'flex' ,  alignItems:'center' , width:'100%' , padding:'0px 10px 0px 10px'}}>
                                        <HighlightOff sx={{color:'red', fontSize:'22px'}}></HighlightOff>
                                        <div style={{display:'flex' , padding:'10px' , justifyContent:'center', alignItems:'center'}}>
                                            <DescriptionIcon sx={{fontSize:'20px' , color:'gray'}}></DescriptionIcon>
                                        </div>
                                        <div style={{display:'inline-block'}}>
                                            <div style={{fontSize:'16px'}}>{e.file.name}</div>
                                            <div style={{textAlign:'left',fontSize:'14px' , color:'gray', padding:'0px'}}>canceled</div>
                                        </div>
                                        <div style={{margin:'0px 0px 0px auto', fontSize:'14px'}}>
                                            <button onClick={()=>{dispatch(setFileForRetry({index:i})).then(()=>{dispatch(uploadFile({authCtx:authCtx , axiosGlobal:axiosGlobal , files:uploadQueue , currentDisplay}))});}} style={{border:'none', padding:'5px 10px 5px 10px'}}>retry</button>
                                        </div>
                                    </div>
                                </div>
                                <Box sx={{ width: '100%' }}>
                                    <LinearProgress  variant="determinate" value={e.progress} />
                                </Box>
                            </div>
                        )
                    }else if(e.cancel === false && e.uploading === false && e.uploaded === false && e.error.status === true && e.show === true){
                        return(
                            <div className={Style.listItem}>
                                <div style={{padding:'5px 0px 5px 0px'}}>
                                    <div style={{display:'flex' ,  alignItems:'center' , width:'100%' , padding:'0px 10px 0px 10px'}}>
                                        <HighlightOff sx={{color:'red', fontSize:'22px'}}></HighlightOff>
                                        <div style={{display:'flex' , padding:'10px' , justifyContent:'center', alignItems:'center'}}>
                                            <DescriptionIcon sx={{fontSize:'20px' , color:'gray'}}></DescriptionIcon>
                                        </div>
                                        <div style={{display:'inline-block'}}>
                                            <div style={{fontSize:'16px'}}>{e.file.name}</div>
                                            <div style={{textAlign:'left',fontSize:'14px' , color:'red', padding:'0px'}}>There is an error</div>
                                        </div>
                                        <div style={{margin:'0px 0px 0px auto', fontSize:'14px'}}>
                                            <button onClick={()=>{dispatch(setFileForRetry({index:i})).then(()=>{dispatch(uploadFile({authCtx:authCtx , axiosGlobal:axiosGlobal , files:uploadQueue , currentDisplay}))});}} style={{border:'none', padding:'5px 10px 5px 10px'}}>retry</button>
                                        </div>
                                    </div>
                                </div>
                                <Box sx={{ width: '100%' }}>
                                    <LinearProgress  variant="determinate" value={e.progress} />
                                </Box>
                            </div>
                        )
                    }else if(e.cancel === false && e.uploading === false && e.uploaded === null && e.error.status === false && e.show === true){
                        return(
                            <div className={Style.listItem}>
                                <div style={{padding:'5px 0px 5px 0px'}}>
                                    <div style={{display:'flex' ,  alignItems:'center' , width:'100%' , padding:'0px 10px 0px 10px'}}>
                                        <HourglassBottom sx={{color:'black', fontSize:'22px'}}></HourglassBottom>
                                        <div style={{display:'flex' , padding:'10px' , justifyContent:'center', alignItems:'center'}}>
                                            <DescriptionIcon sx={{fontSize:'20px' , color:'gray'}}></DescriptionIcon>
                                        </div>
                                        <div style={{display:'inline-block'}}>
                                            <div style={{fontSize:'16px'}}>{e.file.name}</div>
                                            <div style={{textAlign:'left',fontSize:'14px' , color:'gray', padding:'0px'}}>Waiting in queue...</div>
                                        </div>
                                        <div style={{margin:'0px 0px 0px auto', fontSize:'14px'}}>
                                            <button onClick={()=>{dispatch(actions.cancelTheUploading({index:i ,uploading:false , cancel:true ,uploaded:false}));}} style={{border:'none', padding:'5px 10px 5px 10px'}}>cancel</button>
                                        </div>
                                    </div>
                                </div>
                                <Box sx={{ width: '100%' }}>
                                    <LinearProgress  variant="determinate" value={e.progress} />
                                </Box>
                            </div>
                        )
                    }
                    
                })}

            </div>
        </div>
    </Fragment>

  );
}

export default BottomUploadList;