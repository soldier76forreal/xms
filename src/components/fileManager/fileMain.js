import { Fragment  , useState} from "react";
import ReactDom from 'react-dom';
import Style from "./fileMain.module.scss"; 
import FileManagerNav from "../../tools/navs/fileManagerNav";
import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import { Add, ArrowBack, ArrowForward, ArrowRight, CheckBox, Delete, FileDownloadDoneOutlined, Folder, Image, Info, LocalActivity, Pin, PlusOne, Star, Upload } from "@mui/icons-material";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
import { Checkbox, Chip, Stack  } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagPlaceholder from '../../assets/imagePlaceHolder.png';
import Tooltip from '@mui/material/Tooltip';
import SearchInput from "../../tools/inputs/searchInput";
import BottomUploadList from "./bottomUploadList";
import ContentCut from '@mui/icons-material/ContentCut';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ContentPaste from '@mui/icons-material/ContentPaste';
import Cloud from '@mui/icons-material/Cloud';
import ShareIcon from '@mui/icons-material/Share';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DownloadIcon from '@mui/icons-material/Download';
import NewFileModal from "./newFileModal";
import DeleteModal from "./deleteModal";
import RenameModal from "./renameModal";
import FilePickerModal from "./filePickerModal";
import { useDispatch, useSelector } from "react-redux";
import {   actions, setFilesAsync, uploadFile } from "../../store/fileManager";
import { useEffect } from "react";
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useContext } from "react";
import { useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";


const ITEM_HEIGHT = 48;



const FileMainPortal = () =>{
    // Hooks
    const history = useHistory()
    
    const location = useLocation();
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const fileInputRef = useRef(null);
    const floatArray = useSelector((state) => state.float);
    const currentDisplay = useSelector((state) => state.currentDisplay);
    const uploadQueue = useSelector((state) => state.uploadQueue);

    const dataForDisplay = useSelector((state) => state.data);

    const dispatch = useDispatch();



    useEffect(() => {

        dispatch(actions.setFolder())
    }, [location]);



    //Modal states 
    const [newFileModal , setNewFileModal] = useState(false);
    const [renameFolder , setRenameFolder] = useState('');
    const [openRenameModal , setOpenRenameModal] = useState(false);
    const [selectedForChange , setSelectedForChange] = useState('');
    const [rightSideMenuExpend , setRightSideMenuExpend] = useState({status:false , choosen:'info'})
    const [selectedTagsForFile , setSelectedTagsForFile] = useState([]);

    //select Files
    const [selectedFiles , setSelectedFiles] = useState([])
    const [progress , setProgress] = useState('')

    
    
    //Click handler
    var tempChip =[]
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClose = () => {
      setAnchorEl(null);
    };
    const handleFileSelect = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async(e) => {
        const files = Array.from(e.target.files);
        dispatch(setFilesAsync({files:files}))
        .then(()=>{
            dispatch(uploadFile({authCtx:authCtx , axiosGlobal:axiosGlobal , files:uploadQueue , currentDisplay}))
        })
    };



//     const sendImagesData = async(e) =>{
//         //check if there is any file
//         if(e.length === 0){

//         }else{
//             //send file by one by one
//             for(var i = 0 ; e.length>i ; i++){
//                 const formData = new FormData();
//                 formData.append('images' , e[i]);
//                 //indicate file
//                 // setUploadingImage(i);
//                 try{
//                     const response = await authCtx.jwtInst({
//                         method:'post',
//                         url:`${axiosGlobal.defaultTargetApi}/files/uploadFile`,
//                         data:formData ,
//                         //progress bar precentage
//                         onUploadProgress: data => {                           
//                             console.log(Math.round((100 * data.loaded) / data.total))
//                           },
//                         config: { headers: {'Content-Type': 'multipart/form-data' }}
//                     })
//                     const data = await response.data;
//                     // console.log(data)
//                     // uploadedData.push(data);
//                     // //check if upload task finished
//                     // if(file.length !== 0 && uploadedData.length === file.length){
//                     //     //success msg
//                     //     setSuccessOpenToast(true);
//                     //     setSuccessMsgToast("آپلود شد");
//                     //     const closingSuccessMsgTimeOut = setTimeout(()=>{setSuccessOpenToast(false)}, 3000);
//                     //     //reset values for next uploads
//                     //     setFile([...[]]);
//                     //     setCurrentProgress('');
//                     //     setUploadingImage('');
//                     //     setUploadedData([...[]]);
//                     //     setProgress([{id:0 , progress:''} , {id:1, progress:''} , {id:2 , progress:''} , {id:3, progress:''} , {id:4 , progress:''} , {id:5 , progress:''}]);
//                     // }
//                 }catch(error){

//                 }
//             }
//     }
// }
    
    
    return(
        <Fragment>
            <NewFileModal setNewFileModal={setNewFileModal} newFileModal={newFileModal}></NewFileModal>
            <DeleteModal></DeleteModal>
            <RenameModal selectedForChange={selectedForChange} setOpenRenameModal={setOpenRenameModal} setRenameFolder={setRenameFolder} renameFolder={renameFolder} openRenameModal={openRenameModal}></RenameModal>
            <FilePickerModal></FilePickerModal>
            <Menu
                id="long-menu"
                MenuListProps={{
                'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                style: {
                    maxHeight: ITEM_HEIGHT * 7.5,
                    width: '20ch',
                },
                }}
            >
                <MenuItem>
                
                    <ListItemIcon>
                        <ShareIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Share</ListItemText>
                    </MenuItem>
                    <MenuItem>
                    <ListItemIcon>
                        <LinkIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Link</ListItemText>
                    </MenuItem>
                    <MenuItem>
                    <ListItemIcon>
                        <DownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Download</ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem>
                    <ListItemIcon>
                        <ContentCopyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy</ListItemText>
                    </MenuItem>
                    <MenuItem>
                    <ListItemIcon>
                        <DriveFileMoveIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Move</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={(e)=>{setOpenRenameModal(true);handleClose()}}>
                    <ListItemIcon>
                        <DriveFileRenameOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Rename</ListItemText>
                    </MenuItem>
                    <MenuItem>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
            {/* <div className={Style.fileManagerNav}>
                <FileManagerNav></FileManagerNav>
            </div> */}

            <div dir="" style={{padding:'0px'}} className={Style.mainContainer}>
                <Row>
                    <Col style={{ height:'100%', maxHeight:'100%'}} xs={0} md={0} lg={3} xl={3} xxl={2}>
                        <div>
                            <div className={Style.leftSizeMenu}>
                                <ul>
                                    <li>Home</li>
                                    <li>files</li>
                                    <li>Recent</li>
                                    <li>Photos</li>
                                    <li>Starred</li>
                                    <li>Shared</li>
                                    <li>Shared</li>
                                </ul>
                            </div>
                        </div>
                    </Col>
                        <div style={{margin:'0px auto 0px auto' ,textAlign:'center', position:'absolute'}}><BottomUploadList></BottomUploadList></div>
                    <Col style={{display:'flex' , minHeight: '89vh' , overflowY:'none'}} xs={12} md={12} lg={9} xl={9} xxl={10}>
                        <div style={{width:'100%' , padding:'0px 20px 0px 0px'}}>
                            <div style={{textAlign:'left' , fontFamily:'YekanBold', fontSize:'22px' , padding:'15px 0px 0px 10px'}}>XFILE<span style={{textAlign:'left' , fontFamily:'YekanLight', fontSize:'22px' , padding:'15px 0px 0px 10px'}}>/subFile</span></div>
                            <div className={Style.topSec}>
                                <div className={Style.funcBtn}>
                                    <input
                                        type="file"
                                        style={{ display: 'none' }}
                                        ref={fileInputRef}
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                    <botton onClick={handleFileSelect} className={Style.uploadBtn}>
                                        <Upload sx={{marginRight:'3px'}}></Upload>
                                        <span style={{marginTop:'2px'}}>Upload</span>
                                    </botton>
                                    <botton  onClick={()=>{setNewFileModal(true)}} className={Style.createBtn}>
                                        <Add></Add>
                                        <span style={{marginTop:'2px'}}>Create</span>
                                    </botton>
                                </div>
                            </div>
                            <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                            <div className={Style.gridOvDiv}>
                                {/* <h4>Files</h4> */}
                            </div>
                            <div style={{display:'flex'}}>
                                {currentDisplay.docs !== undefined ? currentDisplay.docs.map((e  , i)=>{
                                    
                                    if(e.subs !== undefined){
                                        if(e.doc !== undefined){
                                            
                                            return(
                                                
                                                <div key={i} onClick={()=>{history.push(`${location.pathname}/${e.doc.name}`); dispatch(actions.openFolder({id:e.doc._id , name:e.doc.name , index:i}));}} style={{margin:'2px'}} className={Style.folderDiv}>
                                                    <Folder className={Style.folderIcon}></Folder>
                                                    <div className={Style.fileName}>{e.doc.name}</div>
                                                    <div className={Style.subToolSection}>
                                                        <div style={{display:'inline-block' , float:'right'}}>
                                                            <IconButton
                                                                aria-label="more"
                                                                id="long-button"
                                                                aria-controls={open ? 'long-menu' : undefined}
                                                                aria-expanded={open ? 'true' : undefined}
                                                                aria-haspopup="true"
                                                                onClick={(event)=>{ event.stopPropagation();setAnchorEl(event.currentTarget);setRenameFolder(e.doc.name); setSelectedForChange(e.doc._id)}}
                                                            >
                                                                <MoreVertIcon />
                                                            </IconButton>
                                                        </div>
                                                        <div style={{display:'inline-block' , float:'left'}}>
                                                            <Checkbox  defaultChecked color="default" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    }else if(e.subs === undefined){
                                        if(e.doc !== undefined){

                                            return(
                                                <div key={i}  style={{margin:'2px'}} className={Style.imageDiv}>
                                                    <img src={FlagPlaceholder} className={Style.galleryImg}></img>
                                                    <div style={{padding:'5px 0px 0px 0px'}} className={Style.fileName}>{e.doc.name}</div>
                                                    <div className={Style.subToolSectionImg}>
                                                        <div style={{display:'inline-block' , float:'right'}}>
                                                            <IconButton
                                                                aria-label="more"
                                                                id="long-button"
                                                                aria-controls={open ? 'long-menu' : undefined}
                                                                aria-expanded={open ? 'true' : undefined}
                                                                aria-haspopup="true"
                                                                onClick={(event)=>{setAnchorEl(event.currentTarget);}}
                                                            >
                                                                <MoreVertIcon />
                                                            </IconButton>
                                                        </div>
                                                        <div style={{display:'inline-block' , float:'left'}}>
                                                            <Checkbox  defaultChecked color="default" />
                                                        </div>
                                                    </div>
                                                    {/* <div className={Style.fileType}>
                                                        <Image sx={{color:'white' , fontSize:'20px'}}></Image>
                                                    </div> */}
                                                </div>
                                            )
                                        }
                                    }
                                    
                                }):null}


                            </div>
                            
                        </div>
                        {rightSideMenuExpend.status === false?
                        
                            <div className={Style.minimizedState} >
                                <ul>          
                                    <Tooltip arrow style={{fontSize:'20px'}} title="open details panel" placement="left-start">
                                        <li onClick={()=>{setRightSideMenuExpend({status:true , choosen:rightSideMenuExpend.choosen})}} className={Style.showCloseRightSideMenu}><ArrowBack sx={{fontSize:'24px'}}></ArrowBack></li>
                                    </Tooltip>
                                    <Tooltip arrow style={{fontSize:'20px'}} title="info" placement="left-start">
                                        <li onClick={()=>{setRightSideMenuExpend({status:true , choosen:'info'})}} className={Style.normalRightSideMenu}><Info sx={{fontSize:'24px'}}></Info></li>
                                    </Tooltip>
                                    <Tooltip arrow style={{fontSize:'20px'}} title="pinned" placement="left-start">
                                        <li onClick={()=>{setRightSideMenuExpend({status:true , choosen:'pinned'})}} className={Style.normalRightSideMenu}><Star sx={{fontSize:'24px'}}></Star></li>
                                    </Tooltip>
                                    <Tooltip arrow style={{fontSize:'20px'}} title="activity" placement="left-start">
                                        <li onClick={()=>{setRightSideMenuExpend({status:true , choosen:'activity'})}} className={Style.normalRightSideMenu}><LocalActivity sx={{fontSize:'24px'}}></LocalActivity></li>
                                    </Tooltip>
                                </ul>
                            </div>
                        :rightSideMenuExpend.status === true ?
                            <div className={Style.expendedRightSideDiv}>
                                <ul style={{height:'100%'}}>          
                                        <li className={Style.showCloseRightSideMenuExp}>
                                            <div style={{display:'inline-block' , padding:'0px 0px 0px 15px' , fontFamily:'YekanBold' , fontSize:'15px' , width:'50%' , textAlign:'left'}}>
                                                XFILE
                                            </div>
                                            <div  style={{display:'inline-block' , width:'50%'}}>
                                                <button onClick={()=>{setRightSideMenuExpend({status:false , choosen:rightSideMenuExpend.choosen})}} className={Style.expendedRighSideBackBtn}>
                                                    <ArrowForward sx={{fontSize:'24px'}}></ArrowForward>

                                                </button>
                                            </div>
                                        </li>
                                        <li style={{height:rightSideMenuExpend.choosen === 'info'?'100%':'63px' , minHeight:'0px'}} onClick={()=>{setRightSideMenuExpend({status:true , choosen:'info'})}} className={Style.normalRightSideMenuExp}>
                                            <div className={Style.expdBtns}><Info sx={{fontSize:'24px'}}></Info><span style={{marginLeft:'1px'}}>info</span></div>
                                            <div style={{height:'100%' , display:rightSideMenuExpend.choosen === 'info'?'block':'none'}}>
                                                {/* <div className={Style.placeholderText}>
                                                    select files/folders to see the details and add tags to theme!
                                                </div> */}
                                                <div className={Style.infoDiv}>
                                                    {/* <div className={Style.selectedFiles}>
                                                        <div style={{margin:'0px auto 0px auto'}}>14<span>selected</span></div>
                                                    </div> */}
                                                    {/* <div className={Style.selectedFilesItself}>
                                                        <img src={FlagPlaceholder}></img>
                                                    </div> */}
                                                    <div className={Style.selectedFilesItself}>
                                                        <Folder className={Style.folderIconInfo}></Folder>
                                                    </div>
                                                    <div className={Style.searchInpDiv}>
                                                        <div style={{padding:'0px'}} className={Style.rightSideListTitle}>Tags</div>
                                                        <SearchInput selectedTagsForFile={selectedTagsForFile} setSelectedTagsForFile={setSelectedTagsForFile}></SearchInput>
                                                        <div style={{marginTop:'10px' , display:'flex' , flexWrap:'wrap'}}>
                                                            {selectedTagsForFile.map((e , i)=>{
                                                                return(
                                                                    <Chip
                                                                    key={i}
                                                                        sx={{
                                                                        margin:'2px',
                                                                        '& .MuiChip-deleteIcon:hover': {
                                                                            color: 'red',
                                                                        },
                                                                        '& .MuiChip-label': {
                                                                            padding: '2px 8px 0px 8px',
                                                                            fontSize:'12px'
                                                                        },
                                                                        }}
                                                                        label={e} onDelete={()=>{tempChip = selectedTagsForFile; tempChip.splice(i, 1); setSelectedTagsForFile([...tempChip])}} />
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className={Style.fileDetails}>
                                                        <div className={Style.rightSideListTitle}>Properties</div>
                                                        <div className={Style.fileDetailsTitleDiv}>
                                                            <ul>
                                                                <li><div>name</div><span>testacacvsv</span></li>
                                                                <li><div>size</div><span>testacacvsv</span></li>
                                                                <li><div>Modified</div><span>testacacvsv</span></li>
                                                                <li><div>type</div><span>testacacvsv</span></li>
                                                                
                                                            </ul>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li style={{height:rightSideMenuExpend.choosen === 'pinned'?'100%':'63px' , minHeight:'0px'}} onClick={()=>{setRightSideMenuExpend({status:true , choosen:'pinned'})}} className={Style.normalRightSideMenuExp}>
                                            <div className={Style.expdBtns}><Star sx={{fontSize:'24px'}}></Star><span style={{marginLeft:'1px'}}>pinned</span></div>
                                        </li>
                                        <li style={{height:rightSideMenuExpend.choosen === 'activity'?'100%':'62px' , minHeight:'0px'}} onClick={()=>{setRightSideMenuExpend({status:true , choosen:'activity'})}} className={Style.normalRightSideMenuExp}>
                                            <div className={Style.expdBtns}><LocalActivity sx={{fontSize:'24px'}}></LocalActivity><span >activity</span></div>
                                        </li>
                                </ul>
                            </div>
                        :null}                            
                    </Col>
                </Row>

            </div>
        </Fragment>
    )
}




const FileMain = (props)=>{
    return(
        <Fragment>
            {ReactDom.createPortal(
                <FileMainPortal>

                </FileMainPortal>
                ,
                document.getElementById('mainFiles')
                )}
        </Fragment>
    )
}
export default FileMain;