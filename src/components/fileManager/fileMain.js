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
import { Add, ArrowBack, ArrowDownward, ArrowForward, ArrowRight, CheckBox, Delete, FileDownloadDoneOutlined, Folder, Image, Info, LocalActivity, Pin, PlusOne, Search, Star, Upload } from "@mui/icons-material";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
import { Checkbox, Chip, CircularProgress, Grid, Stack  } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagPlaceholder from '../../assets/imagePlaceHolder.png';
import Tooltip from '@mui/material/Tooltip';
import SearchInputForTags from "./searchInputForTags";
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
import {   actions, setFilesAsync, uploadFile , getAllTags, deleteTag, downloadFileFolder } from "../../store/store";
import { useEffect } from "react";
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useContext } from "react";
import { useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { FileIcon, defaultStyles } from 'react-file-icon';
import VideoPlayer from 'simple-react-video-thumbnail'
import DocViewerBox from "./docViewer";
import moment from 'jalali-moment'
import ShareTheLink from "./shareTheLink";
import SuccessMsg from '../../tools/navs/successMsg';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import PdfView from "./pdfView";
import ShowVideo from "./showVideo";
import { getImageSize  } from 'react-image-size';
import Loader from "../../tools/loader/loader";
import '../overalStyle/fileFolderGrid.scss'
import '../overalStyle/overals.scss'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SpeedDialForResponsiveUpload from "./speedDialForResponsiveUpload";
import ViewListIcon from '@mui/icons-material/ViewList';
import LightProps from "../../tools/props/lightProps";
import AboutResponsive from "./aboutResponsive";
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
    const data = useSelector((state) => state.data);

    const dataForDisplay = useSelector((state) => state.data);
    const selectArr = useSelector((state) => state.selectedItems);
    
    const allTags = useSelector((state) => state.allTags);

    const route = useSelector((state) => state.routeLink);

    const loading = useSelector((state) => state.loading);
    const dispatch = useDispatch();

    const tagsToShow = useSelector((state) => state.tagsToShow);


    //success toast
    const [successToast , setSuccessToast] = useState({status:false , msg:''});

    //side menu 
    const [selectedSideMenu , setSelectedSideMenu] = useState('')

    //share link
    const [openShareLink , setOpenShareLink] = useState(false)

    //tags state 
    const [oneSelectedItemsTag , setOneSelectedItemsTag] = useState([])
    const [tagsForList , setTagsForList] = useState([])

    const [deletedTags , setDeletedTags] = useState([])
    const [chipChangeRefresh , setChipChangeRefresh] = useState(0)


    //Modal states 
    const [newFileModal , setNewFileModal] = useState(false);
    const [renameFolder , setRenameFolder] = useState('');
    const [openRenameModal , setOpenRenameModal] = useState(false);
    const [selectedForChange , setSelectedForChange] = useState('');
    const [rightSideMenuExpend , setRightSideMenuExpend] = useState({status:false , choosen:'info'})
    const [selectedTagsForFile , setSelectedTagsForFile] = useState([]);

    const [deleteFileModal , setDeleteFileModal]=useState(false);
    const [fileFolderIdType , setFileFolderIdType] = useState({type:'',id:''});
    const [downloadPath , setDownloadPath] = useState('');
    const [deleteCount , setDeleteCount]=useState('');



    const [newFolderType , setNewFolderType] = useState('');


    const [oneSelectedItem , setOneSelectedItem] = useState({});

    //select Files
    const [selectFileOnResponsive , setSelectFileOnResponsive] = useState(false)


    //copy move
    const [filePickerCount , setFilePickerCount] = useState({count:null , idAndType:null});
    const [openFilePicker , setOpenFilePicker] = useState(false);
    const [copyMoveType , setCopyMoveType] = useState('');





    //pdf reader
    const [pdfView , setPdfView] = useState(false)
    const [thePdf  , setThePdf] = useState('')




    
    //show video
    const [showVideo , setShowVideo] = useState(false)
    const [theVideo  , setTheVideo] = useState('')

  


    //photo swipe
    const [photoSwipe , setPhotoSwipe]=useState(false)
    const [filesForSwipe , setFilesForSwipe] = useState([                 
    {src: '',
    w: 1200,
    h: 900,
    title:null}])

    
    //Click handler
    var tempChip =[]
    const [anchorElActions, setAnchorElActions] = useState(null);
    const openAction = Boolean(anchorElActions);
    const handleCloseAction = () => {
        setAnchorElActions(null);
      };
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

    function getLastPart(url) {
        const parts = url.split('/');
        return parts.at(-1);
      }

    const sizeInMb = (e) =>{
        return (e / (1024*1024)).toFixed(2);
    }




    useEffect(() => {
        if(data.length !==0 && openFilePicker === false){
           dispatch(actions.setFolder());
        }
        if(openFilePicker === true){
           dispatch(actions.openFilePickerFolder());
        }
   }, [location]);
   


   useEffect(() => {
    setOneSelectedItemsTag([])
   if(selectArr.length === 1){
       if(allTags !== undefined){
           if(selectArr[0].type==='file'){
               var temp = allTags.filter(e=>{return(e.files.includes(selectArr[0].id))})
               setTagsForList([...allTags.filter(e=>{return(!e.files.includes(selectArr[0].id))})])
               setOneSelectedItemsTag([...temp])

           }else if(selectArr[0].type==='folder'){
               var temp = allTags.filter(e=>{return(e.folders.includes(selectArr[0].id))})
                setTagsForList([...allTags.filter(e=>{return(!e.folders.includes(selectArr[0].id))})])
               setOneSelectedItemsTag([...temp])
           }
       }
   }else if(selectArr.length > 1){
        setTagsForList([...allTags])
   }
}, [selectArr  ,chipChangeRefresh]);
   
   useEffect(() => {
       if(selectArr.length === 1 && selectArr[0].type === 'file'){
           const theInfo = currentDisplay.docs.filter(e=>{return e.file !== undefined?e.file._id === selectArr[0].id:null})[0]
           setOneSelectedItem(theInfo)
       }else if(selectArr.length === 1 && selectArr[0].type === 'folder'){
           const theInfo = currentDisplay.docs.filter(e=>{return e.doc !== undefined?e.doc._id === selectArr[0].id:null})[0]
           setOneSelectedItem(theInfo.doc)
       }
       dispatch(actions.tagToShow())
  }, [selectArr]);
   





    const lightbox = new PhotoSwipeLightbox({
    // may select multiple "galleries"
    gallery: '#gallery--getting-started',
    
    // Elements within gallery (slides)
    children: 'a',

    // setup PhotoSwipe Core dynamic import
    pswpModule: () => import('photoswipe')
    });
    lightbox.init();


    const newFolder = ()=>{
        setNewFileModal(true);
        setNewFolderType('mainNewFolderBtn')
    }

    return(
        <Fragment>
            {/* <LightProps content={<AboutResponsive></AboutResponsive>}></LightProps> */}
            <SpeedDialForResponsiveUpload
                newFolder={newFolder}
                handleFileSelect={handleFileSelect}
            ></SpeedDialForResponsiveUpload>
            <ShowVideo
                showVideo={showVideo}
                setShowVideo={setShowVideo}
                theVideo={theVideo}
            ></ShowVideo>
            <PdfView 
                thePdf={thePdf}
                setPdfView={setPdfView}
                pdfView={pdfView}
            ></PdfView>
            <SuccessMsg openMsg={successToast.status} msg={successToast.msg}></SuccessMsg>  

            <NewFileModal newFolderType={newFolderType} setNewFileModal={setNewFileModal} newFileModal={newFileModal}></NewFileModal>
            <DeleteModal
                deleteFileModal={deleteFileModal}
                setDeleteFileModal={setDeleteFileModal}
                fileFolderIdType={fileFolderIdType}
                setFileFolderIdType={setFileFolderIdType}
                deleteCount={deleteCount}
            ></DeleteModal>
            <RenameModal newFolderType={newFolderType} fileFolderIdType={fileFolderIdType} setFileFolderIdType={setFileFolderIdType}  setOpenRenameModal={setOpenRenameModal} setRenameFolder={setRenameFolder} renameFolder={renameFolder} openRenameModal={openRenameModal}></RenameModal>
            <FilePickerModal 
                openFilePicker={openFilePicker}
                setOpenFilePicker={setOpenFilePicker}
                filePickerCount={filePickerCount}
                setFilePickerCount={setFilePickerCount}
                setNewFileModal={setNewFileModal}
                setNewFolderType={setNewFolderType}
                copyMoveType={copyMoveType}
            ></FilePickerModal>

            <ShareTheLink successToast={successToast} setSuccessToast={setSuccessToast} filePickerCount={filePickerCount} fileFolderIdType={fileFolderIdType}  setOpenShareLink={setOpenShareLink} openShareLink={openShareLink}></ShareTheLink>
            
            {/* action menu */}
            <Menu
                id="long-menu"
                MenuListProps={{
                'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorElActions}
                open={openAction}
                onClose={handleCloseAction}
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
                <MenuItem onClick={()=>{setOpenShareLink(true);handleCloseAction(); setFilePickerCount({count:'multi',idAndType:selectArr})}}>
                    <ListItemIcon>
                        <LinkIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText >Link</ListItemText>
                </MenuItem>
                <MenuItem onClick={()=>{dispatch(downloadFileFolder({authCtx:authCtx , axiosGlobal:axiosGlobal , selected:selectArr}));handleCloseAction();}}>
                    <ListItemIcon>
                        <DownloadIcon fontSize="small" />
                    </ListItemIcon> 
                    <ListItemText>Download</ListItemText>
                </MenuItem>
                <MenuItem onClick={()=>{setCopyMoveType('copy');setOpenFilePicker(true);setFilePickerCount({count:'multi',idAndType:fileFolderIdType});handleCloseAction()}}>
                    <ListItemIcon>
                        <ContentCopyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy</ListItemText>
                </MenuItem>
                <MenuItem onClick={()=>{setCopyMoveType('move');setOpenFilePicker(true);setFilePickerCount({count:'multi',idAndType:fileFolderIdType});handleCloseAction();}}>
                    <ListItemIcon>
                        <DriveFileMoveIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Move</ListItemText>
                </MenuItem>
                <MenuItem onClick={()=>{handleCloseAction();setDeleteFileModal(true);setDeleteCount('multi')}}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

             {/* items menu */}
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
                    <MenuItem onClick={()=>{setOpenShareLink(true);handleClose();setFilePickerCount({count:'single',idAndType:[fileFolderIdType]})}}>
                    <ListItemIcon>
                        <LinkIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText >Link</ListItemText>
                    </MenuItem>
                    {fileFolderIdType.type === 'folder'?
                        <MenuItem onClick={()=>{dispatch(downloadFileFolder({authCtx:authCtx , axiosGlobal:axiosGlobal , selected:[fileFolderIdType]}));handleClose();}}>
                            <ListItemIcon>
                                <DownloadIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Download</ListItemText>
                        </MenuItem>
                        
                    :
                        <a style={{color:'black',textDecoration:'none'}} href={downloadPath} download='file/folder'>
                            <MenuItem>
                            <ListItemIcon>
                                <DownloadIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Download</ListItemText>
                            </MenuItem>
                        </a>
                    }
                    <Divider />
                    <MenuItem onClick={()=>{setCopyMoveType('copy');setOpenFilePicker(true);setFilePickerCount({count:'single',idAndType:fileFolderIdType});handleClose()}}>
                    <ListItemIcon>
                        <ContentCopyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={()=>{setCopyMoveType('move');setOpenFilePicker(true);setFilePickerCount({count:'single',idAndType:fileFolderIdType});handleClose();}}>
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
                    <MenuItem onClick={()=>{handleClose();setDeleteFileModal(true);setDeleteCount('single')}}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>


            <div dir="" style={{marginTop:'-5px' }} className={Style.mainContainer}>
                <Row>
                    {/* <Col style={{ height:'100%', maxHeight:'100%'}} xs={0} md={0} lg={3} xl={3} xxl={2}>
                        <div >
                            <div style={{minHeight: '100vh'}} className={Style.leftSizeMenu}>
                                <ul>
                                    <li style={selectedSideMenu === 'home'?{color:'black'}:null} onClick={()=>{setSelectedSideMenu('home')}}>Home</li>
                                    <li>files</li>
                                    <li>Recent</li>
                                    <li>Photos</li>
                                    <li>Starred</li>
                                    <li>Shared</li>
                                    <li>Shared</li>
                                </ul>
                            </div>
                        </div>
                    </Col> */}
                        <div style={{margin:'0px auto 0px auto', left:'5%' ,textAlign:'center', position:'absolute'}}><BottomUploadList></BottomUploadList></div>
                    <Col style={{display:'flex' , minHeight: '100vh' , overflowY:'none'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                        <div className={Style.fileMainDiv}>
                            <div className={Style.routeDiv}><span style={{cursor:'pointer'}} onClick={()=>{history.push('/files')}}>XFILE</span><span style={{textAlign:'left' , fontFamily:'YekanLight', fontSize:'22px' , padding:'0px 0px 0px 5px'}}>
                                {route.map(e=>{return(<span style={{cursor:'pointer'}} onClick={()=>{history.push(`/files${e}`)}}>/{getLastPart(e)}</span>)})}
                            </span></div>
                            
                            <div className='searchBar'>
                                <div style={{backgroundColor:'#e6e6e6',padding: '0px 0px 0px 6px', display:'flex',justifyContent:'center', alignItems:'center', height:'35px',borderTopLeftRadius:'5px',borderBottomLeftRadius:'5px'}}>
                                    <Search sx={{color:"black" , fontSize:'22px'}}></Search>
                                </div>
                                <input placeholder="Search here..."></input>
                                <div style={{backgroundColor:'rgb(84, 84, 84)',padding: '10px 0px 0px 0x', width:'65px', display:'flex',justifyContent:'center', alignItems:'center', height:'35px',borderTopRightRadius:'5px',borderBottomRightRadius:'5px'}}>
                                    <AutoFixHighIcon sx={{ fontSize:'22px' ,color:'white' , marginRight:'0px'}}></AutoFixHighIcon>
                                </div>
                            </div>
                            
                            <div className={Style.topSec}>
                                <div className={Style.funcBtn}>
                                    <input
                                        type="file"
                                        name="file"
                                        style={{ display: 'none' }}
                                        ref={fileInputRef}
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                    <botton onClick={handleFileSelect} className='btnWithIcon'>
                                        <span>Upload</span>
                                        <Upload></Upload>
                                    </botton>
                                    <botton style={{marginLeft:'10px'}} onClick={()=>{setNewFileModal(true);setNewFolderType('mainNewFolderBtn')}} className='btnWithIconOutLine'>
                                        <span>New Folder</span>
                                        <Add></Add>
                                    </botton>
                                    <div style={{marginLeft:'10px'}}>
                                        select all:
                                        <Checkbox onClick={()=>{dispatch(actions.selectAll())}}  color="default" />
                                    </div>

                                </div>

                                <div style={{position:'absolute'}} className={Style.SelectBtnDiv}>
                                    <botton onClick={()=>{setSelectFileOnResponsive(!selectFileOnResponsive)}} className={selectFileOnResponsive === false ?'btnOutLine':selectFileOnResponsive === true ?'btnOutLineRed':null}>{selectFileOnResponsive === false ?'Select':selectFileOnResponsive === true ?'Cancel':null}</botton>
                                </div>
                                {selectArr.length > 0?
                                    <div  className={Style.multiSelectActions}>
                                        <div className={Style.selectedItems}>
                                            <span>{selectArr.length}</span> item selected
                                        </div>
                                        <botton onClick={(event)=>{setAnchorElActions(event.currentTarget)}} className='btnWithIcon'>
                                            <span>Actions</span>
                                            <KeyboardArrowDownIcon sx={{ fontSize:'26px'}}></KeyboardArrowDownIcon>
                                        </botton>
                                            <botton style={{marginLeft:'10px'}} className='btnWithIconNoText'><ViewListIcon></ViewListIcon></botton>

                                    </div>
                                :null}
                            </div>
                            <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                            {selectFileOnResponsive === true?
                                <div className={Style.gridOvDiv}>
                                    {/* <h4>Files</h4> */}
                                    <div style={{marginLeft:'0px' , fontSize:'14px', margin:'0px auto 0px 0px'}}>
                                        select all:
                                        <Checkbox onClick={()=>{dispatch(actions.selectAll())}}  color="default" />
                                    </div>
                                    <div>
                                        selected:{selectArr.length}
                                    </div>
                                </div>
                            :null}        
                            {loading === true?
                                <div style={{display:'flex' , justifyContent:'center' , alignItems:'center' , height:'78vh' , overflowY:'hidden'}}>
                                    <Loader width='60px' color='black'></Loader>
                                </div>
                            :
                                <div className={Style.innerScroll}>
                                    <div style={{width:'100%'}} id="gallery--getting-started" >
                                        <Grid   columns={{ xs: 4, sm: 6, md: 8 , lg:12  }} sx={{ flexGrow: 1 }} rowSpacing={1} container spacing={1} item>
                                            {currentDisplay.docs !== undefined ? currentDisplay.docs.map((e  , i)=>{
                                                if(e.file !== undefined){
                                                    if(e.file.format === 'jpg' || e.file.format === 'JPG' || e.file.format === 'png' ||e.file.format === 'svg' || e.file.format === 'jpeg'){
                                                        return(
                                                            <Grid    key={i} item xs={2} >
                                                                <div   className='imageDivForFileFolder'>
                                                                    <div style={{height:'fit-container'}}>
                                                    
                                                                        {/* <div className={Style.fileIconDiv}>
                                                                            <FileIcon  extension={e.file.format} {...defaultStyles[e.file.format]} />
                                                                        </div> */}
                                                                            <a className={Style.linkImg} href={`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`} 
                                                                                data-pswp-width={e.dim.width} 
                                                                                data-pswp-height={e.dim.height} 
                                                                                target="_blank">
                                                                                <img src={`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`} className='galleryImgForFileFolder'></img>
                                                                            </a>
                                                                        <div style={{padding:'5px 0px 0px 0px'}} className='fileNameForFileFolder'>{e.file.metaData.originalname}</div>
                                                                        <div className='subToolSectionForFileFolder'>
                                                                            <div className={Style.menuNormal} style={{float:'right'}}>
                                                                                <IconButton
                                                                                    aria-label="more"
                                                                                    id="long-button"
                                                                                    aria-controls={open ? 'long-menu' : undefined}
                                                                                    aria-expanded={open ? 'true' : undefined}
                                                                                    aria-haspopup="true"
                                                                                    onClick={(event)=>{setAnchorEl(event.currentTarget);setRenameFolder(e.file.name); setFileFolderIdType({type:'file',id:e.file._id});setDownloadPath(`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`)}}
                                                                                >
                                                                                    <MoreVertIcon />
                                                                                </IconButton>
                                                                            </div>
                                                                            {selectFileOnResponsive === false?                                                                    
                                                                                <div className={Style.menuResponsive} style={{float:'right'}}>
                                                                                    <IconButton
                                                                                        aria-label="more"
                                                                                        id="long-button"
                                                                                        aria-controls={open ? 'long-menu' : undefined}
                                                                                        aria-expanded={open ? 'true' : undefined}
                                                                                        aria-haspopup="true"
                                                                                        onClick={(event)=>{setAnchorEl(event.currentTarget);setRenameFolder(e.file.name); setFileFolderIdType({type:'file',id:e.file._id});setDownloadPath(`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`)}}
                                                                                    >
                                                                                        <MoreVertIcon />
                                                                                    </IconButton>
                                                                                </div>
                                                                            :selectFileOnResponsive === true?                                                                    
                                                                                <div  className={Style.checkBoxDivSelect} style={{ float:'left'}}>
                                                                                    <Checkbox onClick={(event)=>{dispatch(actions.selectUnselect({id:e.file._id , type:'file'}));event.stopPropagation()}}  checked={selectArr.filter(v=>{return v.id === e.file._id}).length>0?true:false} color="default" />
                                                                                </div>
                                                                            :null}
                                                                            <div className={Style.checkBoxDiv} style={{float:'left' , zIndex:'1000'}}>
                                                                                <Checkbox onClick={(event)=>{dispatch(actions.selectUnselect({id:e.file._id , type:'file'}));event.stopPropagation()}}  checked={selectArr.filter(v=>{return v.id === e.file._id}).length>0?true:false} color="default" />
                                                                            </div>
                                                                        </div>
                                                                        {/* <div className={Style.fileType}>
                                                                            <Image sx={{color:'white' , fontSize:'20px'}}></Image>
                                                                        </div> */}
                                                                    </div>
                                                                </div>
                                                            </Grid> 
                                                        )
                                                    }else if(e.file.format === 'mp4'){
                                                        return(
                                                            <Grid  key={i} item xs={2}>
                                                                <div onClick={()=>{setShowVideo(true)
                                                                    setTheVideo(`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`)}} 
                                                                    className='imageDivForFileFolder'>
                                                                    {/* <div className={Style.fileIconDiv}>
                                                                        <FileIcon  extension={e.file.format} {...defaultStyles[e.file.format]} />
                                                                    </div> */}
                                                                    <video style={{zIndex:'1000' , maxHeight:'90px'}} width='100%'>
                                                                        <source src={`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`} type="video/mp4" />
                                                                    </video>
                                                                    {/* <VideoPlayer videoUrl={`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`}></VideoPlayer> */}
                                                                    {/* <img src={`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`} className={Style.galleryImg}></img> */}
                                                                    <div style={{padding:'5px 0px 0px 0px'}} className='fileNameForFileFolder'>{e.file.metaData.originalname}</div>
                                                                    <div className='subToolSectionForFileFolder'>
                                                                        <div className={Style.menuNormal} style={{ float:'right'}}>
                                                                            <IconButton
                                                                                aria-label="more"
                                                                                id="long-button"
                                                                                aria-controls={open ? 'long-menu' : undefined}
                                                                                aria-expanded={open ? 'true' : undefined}
                                                                                aria-haspopup="true"
                                                                                onClick={(event)=>{setAnchorEl(event.currentTarget);setRenameFolder(e.file.name);setFileFolderIdType({type:'file',id:e.file._id});setDownloadPath(`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`)}}
                                                                            >
                                                                                <MoreVertIcon />
                                                                            </IconButton>
                                                                        </div>
                                                                        {selectFileOnResponsive === false? 
                                                                            <div className={Style.menuResponsive} style={{float:'right'}}>
                                                                                <IconButton
                                                                                    aria-label="more"
                                                                                    id="long-button"
                                                                                    aria-controls={open ? 'long-menu' : undefined}
                                                                                    aria-expanded={open ? 'true' : undefined}
                                                                                    aria-haspopup="true"
                                                                                    onClick={(event)=>{setAnchorEl(event.currentTarget);setRenameFolder(e.file.name);setFileFolderIdType({type:'file',id:e.file._id});setDownloadPath(`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`)}}
                                                                                >
                                                                                    <MoreVertIcon />
                                                                                </IconButton>
                                                                            </div>
                                                                        :selectFileOnResponsive === true?
                                                                            <div className={Style.checkBoxDivSelect} style={{float:'left' , zIndex:'1000'}}>
                                                                                <Checkbox onClick={(event)=>{dispatch(actions.selectUnselect({id:e.file._id , type:'file'}));event.stopPropagation()}}  checked={selectArr.filter(v=>{return v.id === e.file._id}).length>0?true:false} color="default" />
                                                                            </div>
                                                                        :null}
                                                                        <div className={Style.checkBoxDiv} style={{float:'left' , zIndex:'1000'}}>
                                                                            <Checkbox onClick={(event)=>{dispatch(actions.selectUnselect({id:e.file._id , type:'file'}));event.stopPropagation()}}  checked={selectArr.filter(v=>{return v.id === e.file._id}).length>0?true:false} color="default" />
                                                                        </div>
                                                                    </div>
                                                                    {/* <div className={Style.fileType}>
                                                                        <Image sx={{color:'white' , fontSize:'20px'}}></Image>
                                                                    </div> */}
                                                                </div>
                                                            </Grid> 
                                                        )
                                                    }
                                                    else if(e.file.format === 'pdf'){
                                                        return(
                                                            <Grid key={i} item xs={2}>
                                                                <div  onClick={()=>{setPdfView(true); setThePdf(`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`)}}  className='imageDivForFileFolder'>
                                                                        <FileIcon  extension={e.file.format} {...defaultStyles[e.file.format]} />
                                                                    {/* <img src={FlagPlaceholder} className={Style.galleryImg}></img> */}
                                                                    <div style={{padding:'5px 0px 0px 0px'}} className='fileNameForFileFolder'>{e.file.metaData.originalname}</div>
                                                                    <div className={Style.subToolSection}>
                                                                        <div className={Style.menuNormal} style={{ float:'right'}}>
                                                                            <IconButton
                                                                                aria-label="more"
                                                                                id="long-button"
                                                                                aria-controls={open ? 'long-menu' : undefined}
                                                                                aria-expanded={open ? 'true' : undefined}
                                                                                aria-haspopup="true"
                                                                                onClick={(event)=>{setAnchorEl(event.currentTarget);setRenameFolder(e.file.name); setFileFolderIdType({type:'file',id:e.file._id});setDownloadPath(`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`)}}
                                                                            >
                                                                                <MoreVertIcon />
                                                                            </IconButton>
                                                                        </div>
                                                                        {selectFileOnResponsive === false? 
                                                                            <div className={Style.menuResponsive}  style={{ float:'right'}}>
                                                                                <IconButton
                                                                                    aria-label="more"
                                                                                    id="long-button"
                                                                                    aria-controls={open ? 'long-menu' : undefined}
                                                                                    aria-expanded={open ? 'true' : undefined}
                                                                                    aria-haspopup="true"
                                                                                    onClick={(event)=>{setAnchorEl(event.currentTarget);setRenameFolder(e.file.name); setFileFolderIdType({type:'file',id:e.file._id});setDownloadPath(`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`)}}
                                                                                >
                                                                                    <MoreVertIcon />
                                                                                </IconButton>
                                                                            </div>
                                                                        :selectFileOnResponsive === true?
                                                                            <div className={Style.checkBoxDivSelect} style={{ float:'left'}}>
                                                                                <Checkbox onClick={(event)=>{dispatch(actions.selectUnselect({id:e.file._id , type:'file'}));event.stopPropagation()}}  checked={selectArr.filter(v=>{return v.id === e.file._id}).length>0?true:false} color="default" />
                                                                            </div>
                                                                        :null}
                                                                        <div className={Style.checkBoxDiv} style={{ float:'left'}}>
                                                                            <Checkbox onClick={(event)=>{dispatch(actions.selectUnselect({id:e.file._id , type:'file'}));event.stopPropagation()}}  checked={selectArr.filter(v=>{return v.id === e.file._id}).length>0?true:false} color="default" />
                                                                        </div>
                                                                    </div>
                                                                    {/* <div className={Style.fileType}>
                                                                        <Image sx={{color:'white' , fontSize:'20px'}}></Image>
                                                                    </div> */}
                                                                </div>
                                                            </Grid>  
                                                        )
                                                    }
                                                    return(
                                                        <Grid  item xs={2} key={i} >
                                                            <div   className='imageDivForFileFolder'>
                                                                    <FileIcon  extension={e.file.format} {...defaultStyles[e.file.format]} />

                                                                {/* <img src={FlagPlaceholder} className={Style.galleryImg}></img> */}
                                                                <div style={{padding:'5px 0px 0px 0px'}} className={Style.fileName}>{e.file.metaData.originalname}</div>
                                                                <div className={Style.subToolSection}>
                                                                    <div className={Style.menuNormal} style={{ float:'right'}}>
                                                                        <IconButton
                                                                            aria-label="more"
                                                                            id="long-button"
                                                                            aria-controls={open ? 'long-menu' : undefined}
                                                                            aria-expanded={open ? 'true' : undefined}
                                                                            aria-haspopup="true"
                                                                            onClick={(event)=>{setAnchorEl(event.currentTarget);setRenameFolder(e.file.name); setFileFolderIdType({type:'file',id:e.file._id}); setDownloadPath(`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`)}}
                                                                        >
                                                                            <MoreVertIcon />
                                                                        </IconButton>
                                                                    </div>
                                                                    {selectFileOnResponsive === false? 
                                                                        <div className={Style.menuResponsive} style={{ float:'right'}}>
                                                                            <IconButton
                                                                                aria-label="more"
                                                                                id="long-button"
                                                                                aria-controls={open ? 'long-menu' : undefined}
                                                                                aria-expanded={open ? 'true' : undefined}
                                                                                aria-haspopup="true"
                                                                                onClick={(event)=>{setAnchorEl(event.currentTarget);setRenameFolder(e.file.name); setFileFolderIdType({type:'file',id:e.file._id});setDownloadPath(`${axiosGlobal.defaultTargetApi}/uploads/${e.file.metaData.filename}`)}}
                                                                            >
                                                                                <MoreVertIcon />
                                                                            </IconButton>
                                                                        </div>
                                                                    :selectFileOnResponsive === true?
                                                                        <div className={Style.checkBoxDivSelect} style={{ float:'left'}}>
                                                                            <Checkbox onClick={(event)=>{dispatch(actions.selectUnselect({id:e.file._id , type:'file'}));event.stopPropagation()}}  checked={selectArr.filter(v=>{return v.id === e.file._id}).length>0?true:false} color="default" />
                                                                        </div>
                                                                    :null}
                                                                    <div className={Style.checkBoxDiv} style={{ float:'left'}}>
                                                                        <Checkbox onClick={(event)=>{dispatch(actions.selectUnselect({id:e.file._id , type:'file'}));event.stopPropagation()}}  checked={selectArr.filter(v=>{return v.id === e.file._id}).length>0?true:false} color="default" />
                                                                    </div>
                                                                </div>
                                                                {/* <div className={Style.fileType}>
                                                                    <Image sx={{color:'white' , fontSize:'20px'}}></Image>
                                                                </div> */}
                                                            </div>
                                                        </Grid> 
                                                    )

                                                }else if(e.doc !== undefined){
                                                    return(
                                                        <Grid item xs={2} sm='2' md='2' xl='1'  key={i} >
                                                            <div key={i} onClick={()=>{history.push(location.pathname === '/'?`/files/${decodeURI(e.doc.name)}`:`${location.pathname}/${decodeURI(e.doc.name)}`); dispatch(actions.setFolder({id:e.doc._id , name:e.doc.name , index:i}));}} style={{margin:'2px'}} className='folderDivForFolder'>
                                                                <Folder className='folderIconForFolder'></Folder>
                                                                <div className='fileNameForFileFolder'>{e.doc.name}</div>
                                                                <div className='subToolSectionForFileFolder'>
                                                                    <div className={Style.menuNormal} style={{float:'right'}}>
                                                                        <IconButton
                                                                            aria-label="more"
                                                                            id="long-button"
                                                                            aria-controls={open ? 'long-menu' : undefined}
                                                                            aria-expanded={open ? 'true' : undefined}
                                                                            aria-haspopup="true"
                                                                            onClick={(event)=>{ event.stopPropagation();setAnchorEl(event.currentTarget);setRenameFolder(e.doc.name); setFileFolderIdType({type:'folder',id:e.doc._id})}}
                                                                        >
                                                                            <MoreVertIcon />
                                                                        </IconButton>
                                                                    </div>
                                                                    {selectFileOnResponsive === false? 
                                                                        <div className={Style.menuResponsive} style={{ float:'right'}}>
                                                                            <IconButton
                                                                                aria-label="more"
                                                                                id="long-button"
                                                                                aria-controls={open ? 'long-menu' : undefined}
                                                                                aria-expanded={open ? 'true' : undefined}
                                                                                aria-haspopup="true"
                                                                                onClick={(event)=>{ event.stopPropagation();setAnchorEl(event.currentTarget);setRenameFolder(e.doc.name); setFileFolderIdType({type:'folder',id:e.doc._id})}}
                                                                            >
                                                                                <MoreVertIcon />
                                                                            </IconButton>
                                                                        </div>
                                                                    :selectFileOnResponsive === true?
                                                                        <div className={Style.checkBoxDivSelect} style={{ float:'left'}}>
                                                                            <Checkbox onClick={(event)=>{dispatch(actions.selectUnselect({id:e.doc._id , type:'folder'}));event.stopPropagation()}}  checked={selectArr.filter(v=>{return v.id === e.doc._id}).length>0?true:false} color="default" />
                                                                        </div>
                                                                    :null}
                                                                    <div className={Style.checkBoxDiv} style={{ float:'left'}}>
                                                                        <Checkbox onClick={(event)=>{dispatch(actions.selectUnselect({id:e.doc._id , type:'folder'}));event.stopPropagation()}}  checked={selectArr.filter(v=>{return v.id === e.doc._id}).length>0?true:false} color="default" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Grid>
                                                    )

                                                }                   
                                            }):null}
            
                                        </Grid>
                                    </div>
                                </div>
                            }
                            
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
                                                        <SearchInputForTags list={tagsForList}  setChipChangeRefresh={setChipChangeRefresh} oneSelectedItemsTag={oneSelectedItemsTag} setOneSelectedItemsTag={setOneSelectedItemsTag} selectedTagsForFile={selectedTagsForFile} setSelectedTagsForFile={setSelectedTagsForFile}></SearchInputForTags>
                                                        <div style={{marginTop:'10px' , display:'flex' , flexWrap:'wrap'}}>
                                                            {tagsToShow.map((e , i)=>{
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
                                                                        label={e.tag} onDelete={()=>{dispatch(deleteTag({authCtx , axiosGlobal ,tagId:e._id ,selected:selectArr[0]}));dispatch(actions.removeTag(e._id))}} 
                                                                    />
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                
                                                        <div> 
                                                            {selectArr.length === 1 && selectArr[0].type === 'file' && oneSelectedItem.file !== undefined? 
                                                                
                                                                <div className={Style.fileDetails}>
                                                                    <div className={Style.rightSideListTitle}>Properties</div>
                                                                    <div className={Style.fileDetailsTitleDiv}>
                                                                        <ul>
                                                                            <li><div>name</div><span>{oneSelectedItem.file.metaData.originalname}</span></li>
                                                                            <li><div>size</div><span>{sizeInMb(oneSelectedItem.file.metaData.size)}MB</span></li>
                                                                            <li><div>Modified</div><span>{moment(oneSelectedItem.file.insertDate, 'YYYY/MM/DD').format('YYYY/MM/DD')}</span></li>
                                                                            <li><div>type</div><span>{oneSelectedItem.file.format}</span></li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            :selectArr.length === 1 && selectArr[0].type === 'folder'?
                                                                <div className={Style.fileDetails}>
                                                                    <div className={Style.rightSideListTitle}>Properties</div>
                                                                    <div className={Style.fileDetailsTitleDiv}>
                                                                        <ul>
                                                                            <li><div>name</div><span>{oneSelectedItem.name}</span></li>
                                                                            <li><div>Modified</div><span>{moment(oneSelectedItem.insertDate, 'YYYY/MM/DD').format('YYYY/MM/DD')}</span></li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            : selectArr.length > 1?null:null}
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