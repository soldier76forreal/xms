import Style from "./showTheLink.module.scss"; 
import { Fragment  , useState} from "react";
import ReactDom from 'react-dom';
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
import {   actions, setFilesAsync, uploadFile , getAllTags } from "../../store/store";
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
import CompanyLogo from "../overalStyle/companyLogo";
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import axios from "axios";
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import '../overalStyle/fileFolderGrid.scss'

const ShowTheLinkPortal = (props) =>{
    const [listStyle , setListStyle] =  useState('hr')
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const [filesFolders , setFilesFolders] = useState({});
    const [current , setCurrent] = useState({})
    const [stack , setStack] = useState([])

    const jwt = axios.create(
        ({
            baseURL:`${axiosGlobal.defaultTargetApi}`,
            withCredentials:true,
            headers:{
                Authorization : `Bearer ${urlParams.get('token')}`
            }
        })
    );
    const getInvoiceData = async() =>{
        try{
            const response = await jwt({
                method:'get',
                url:`${axiosGlobal.defaultTargetApi}/files/getFileForLink`,
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            const res = response.data;
            setFilesFolders(res)
            console.log(res)
            var temp = []
            for(var i=0;res.linkDoc.document.length > i ; i++){
                if(res.linkDoc.document[i].type === 'folder'){
                    const searchFolder = res.finalArr.find((e) => JSON.stringify(e.doc._id) === JSON.stringify(res.linkDoc.document[i].id));
                    temp.push(searchFolder)
                }else if(res.linkDoc.document[i].type === 'file'){
                    const searchFile = res.finalArr.find((e) => JSON.stringify(e.doc._id) === JSON.stringify(res.linkDoc.document[i].id));
                    temp.push(searchFile)
                }
            }
            setCurrent({name:'XFILE' , id:'root',docs:temp})
            setStack([...stack , {name:'XFILE' , id:'root',docs:temp}])
        }catch(err){
            console.log(err);
        }
    }
    useEffect(() => {
        getInvoiceData()

    }, []);

    const openFolder = (j) =>{
        const find = filesFolders.finalArr.filter(e=>{return JSON.stringify(e.doc._id) ===JSON.stringify(j)})[0]
        const finalFileForms =  []
        const finalFolderForms =  []
        for(var i = 0 ; find.subFiles.length>i ; i++){
            finalFileForms.push({type:'file',doc:find.subFiles[i]})
        }
        for(var w = 0 ; find.subFolders.length>w ; w++){
            finalFolderForms.push({type:'folder',doc:find.subFolders[w] , subFiles:find.subFolders[w].subFiles , subFolders:find.subFolders[w].subFolders})
        }
        const finalArr = finalFolderForms.concat(finalFileForms)
        setCurrent({name:find.doc.name , id:find.doc._id ,docs:finalArr})
        setStack([...stack , {name:find.doc.name , id:find.doc._id ,docs:finalArr}])
        console.log({name:find.doc.name , id:find.doc._id ,docs:finalArr})
    }
    const backBtn = () =>{
        var temp = stack;
        if(temp.length > 1){
            temp.length = temp.length-1
            setStack([...temp])
            console.log(temp)
            setCurrent(temp[temp.length-1])
        }
        
    }
    const lightbox = new PhotoSwipeLightbox({
    // may select multiple "galleries"
    gallery: '#gallery--getting-started',
    
    // Elements within gallery (slides)
    children: 'a',

    // setup PhotoSwipe Core dynamic import
    pswpModule: () => import('photoswipe')
    });
    lightbox.init();
    
    if(filesFolders.linkDoc !== undefined)
    return(
        <Fragment>
            <div className={Style.showFileDiv}>
            {filesFolders.linkDoc.showName===false && filesFolders.linkDoc.msg===null?
                <div className={Style.topSection}>
                    <div style={{left:'20px' , right:'auto'}} className={Style.logoDiv}>
                        <CompanyLogo link={window.location.origin} width='80px'></CompanyLogo>
                    </div>
                </div>
            :   
                <div className={Style.topSection}>
                    <div className={Style.nameAndMessage}>
                        {filesFolders.linkDoc.showName===true?<span className={Style.prName}><AccountCircleIcon sx={{fontSize:'24px'}}></AccountCircleIcon><spam style={{fontFamily:'YekanBold' , marginLeft:'2px'}}>From:</spam>{filesFolders.user.firstName} {filesFolders.user.lastName}</span>:null}
                        {filesFolders.linkDoc.msg!==null?<div className={Style.prSubName}><EmailIcon sx={{fontSize:'24px'}}></EmailIcon><spam style={{fontFamily:'YekanBold',marginLeft:'2px'}}>Message:</spam>{filesFolders.linkDoc.msg}</div>:null}
                    </div>
                    <div className={Style.logoDiv}>
                        <CompanyLogo link={axiosGlobal.externalLink} width='80px'></CompanyLogo>
                    </div>
                </div> 
            }    
                <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>

                {/* <div>
                    <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>

                    <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                </div> */}
                <div style={{overflowY:'scroll', height:'86vh'}} id="gallery--getting-started" >
                    <div  id="gallery--getting-started">
                        <div style={{width:'100%' , padding:'0px 0px 0px 0px'}}>
                            <div  className={Style.buttonDiv}>
                                <div style={{display:'flex',alignItems:'center', fontSize:'14px' , cursor:'pointer'}}>
                                    <div onClick={()=>{backBtn()}} className={Style.backBtn}><ArrowBackIosNewIcon sx={{color:'black' , fontSize:'24px'}}></ArrowBackIosNewIcon></div>
                                    <div className={Style.route}><span style={{cursor:'pointer'}} >XFILE</span><span className={Style.subRoute}>/cacac</span></div>
                                </div>
                                {/* <div className={Style.listStyle} style={{margin:'0px 0px 0px auto'}}>
                                    <ul>
                                        <li style={listStyle==='hr'?{backgroundColor:'black',color:'white',border:'0px'}:{border:'0px'}} ><ViewListIcon></ViewListIcon></li>
                                        <li><ViewModuleIcon></ViewModuleIcon></li>
                                    </ul>
                                </div> */}
                            </div>
                        </div>
                        {current.docs.map(e=>{
                            if(e.type === 'folder'){
                                return(
                                    <div onClick={()=>{openFolder(e.doc._id)}} className='containerItem'>
                                        <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                                        <div className='hrItem'>
                                                <div style={{ width:'100%' , display:'flex'}}>                                
                                                    <div style={{maxWidth:'35px'}}>
                                                        <Folder className='folderIcon'></Folder>
                                                    </div>
                                                    <span style={{justifyContent:'center' , marginLeft:'15px' , display:'flex' , alignItems:'center'}}>{e.doc.name}</span>
                                                </div>
                                                <div className='modified'>
                                                    <span>Modified:</span>{moment(e.doc.insertDate, 'YYYY/MM/DD').format('YYYY/MM/DD')}
                                                </div>
                                        </div>
                                    </div>
                                )
                            }else if(e.type === 'file'){
                                if(e.doc.format === 'jpg' || e.doc.format === 'JPG' || e.doc.format === 'png' ||e.doc.format === 'svg' || e.doc.format === 'jpeg'){
                                    return(
                                        <a style={{color:'black' , textDecoration:'none'}} className={Style.linkImg} href={`${axiosGlobal.defaultTargetApi}/uploads/${e.doc.metaData.filename}`}
                                            data-pswp-width={e.doc.dim.width} 
                                            data-pswp-height={e.doc.dim.height}
                                            target="_blank">
                                            <div className='containerItem'>
                                                <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                                                <div className='hrItem'>
                                                        <div style={{ width:'100%' , display:'flex'}}>                                
                                                            <div style={{maxWidth:'35px' , marginLeft:'5px'}}>
                                                                <img style={{width:'50px' , height:'50px' , objectFit:'cover'}} src={`${axiosGlobal.defaultTargetApi}/uploads/${e.doc.metaData.filename}`}></img>
                                                                {/* <FileIcon  extension={e.doc.format} {...defaultStyles[e.doc.format]} /> */}
                                                            </div>
                                                            <span className='hrLine'>{e.doc.name}</span>
                                                        </div>
                                                        <div className='modified'>
                                                            <span>Modified:</span>{moment(e.doc.insertDate, 'YYYY/MM/DD').format('YYYY/MM/DD')}
                                                        </div>
                                                </div>
                                            </div>
                                        </a>
                                    )

                                }else if(e.doc.format === 'mp4'){
                                    return(
                                        <div className='containerItem'>
                                            <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                                            <div className='hrItem'>
                                                    <div style={{ width:'100%' , display:'flex'}}>                                
                                                        <div style={{maxWidth:'35px' , marginLeft:'5px'}}>
                                                            <FileIcon  extension={e.doc.format} {...defaultStyles[e.doc.format]} />
                                                        </div>
                                                        <span style={{justifyContent:'center' , marginLeft:'8px' , display:'flex' , alignItems:'center'}}>{e.doc.name}</span>
                                                    </div>
                                                    <div className='modified'>
                                                        <span>Modified:</span>{moment(e.doc.insertDate, 'YYYY/MM/DD').format('YYYY/MM/DD')}
                                                    </div>
                                            </div>
                                        </div>
                                    )

                                }else if(e.doc.format === 'pdf'){
                                    return(
                                        <div className='containerItem'>
                                            <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                                            <div className='hrItem'>
                                                    <div style={{ width:'100%' , display:'flex'}}>                                
                                                        <div style={{maxWidth:'35px' , marginLeft:'5px'}}>
                                                            <FileIcon  extension={e.doc.format} {...defaultStyles[e.doc.format]} />
                                                        </div>
                                                        <span style={{justifyContent:'center' , marginLeft:'8px' , display:'flex' , alignItems:'center'}}>{e.doc.name}</span>
                                                    </div>
                                                    <div className='modified'>
                                                        <span>Modified:</span>{moment(e.doc.insertDate, 'YYYY/MM/DD').format('YYYY/MM/DD')}
                                                    </div>
                                            </div>
                                        </div>
                                    )

                                }


                            }
                        }
                        )}
                    </div>
                </div>



                <div className={Style.footer}>
                    POWERD BY <span> XCAPITAL</span>
                </div>
            </div>
        </Fragment>
    )
}

const ShowTheLink = (props)=>{
    return(
        <Fragment>
            {ReactDom.createPortal(
                <ShowTheLinkPortal>

                </ShowTheLinkPortal>
                ,
                document.getElementById('showLinkContent')
                )}
        </Fragment>
    )
}
export default ShowTheLink