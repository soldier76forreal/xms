import { Fragment , useState , useContext , useRef , useEffect } from 'react';
import Style from './reportForm.module.scss'
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl , Col} from 'react-bootstrap';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import MuiInput from '../../tools/inputs/muiInput';
import MuiSelect from '../../tools/inputs/muiSelect';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import axios from 'axios';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import ReactDom from 'react-dom';
import Datep from '../../tools/inputs/datePicker';
import { Add, Category, Delete, Diversity1, Edit, PlusOne } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import AuthContext from '../authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import {  Chip, CircularProgress, Divider, FormControlLabel, Switch, TextareaAutosize } from '@mui/material';
import { useHistory } from 'react-router-dom';
import MultiSelect from '../../tools/inputs/multiSelect';
import IconBotton from '../../tools/buttons/iconBtn';
import AddIcon from '@mui/icons-material/Add';
import CustomSelect from '../../tools/inputs/customSelect';
import Avatar from '@mui/material/Avatar';
import ProfilePhoto from '../../assets/imagePlaceHolder.png';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import '../overalStyle/overals.scss'
import SelectTitleModal from './selectTitleModal';
import TitleModal from './titleModal';
import Dropzone, {useDropzone} from 'react-dropzone';
import SnackBarSuccess from '../../tools/navs/snackBar';
import { useDispatch, useSelector } from 'react-redux';
import { actions, getSubmitedJobReports, setFileForRetry, setFilesAsync, uploadFile } from '../../store/store';
import moment from 'moment';
import WebSections from '../../contextApi/webSection';
import Gallery from '../../tools/navs/gallery';
import { ArrowBackIos, ArrowDownward, FileCopy, HighlightOff, HourglassBottom, UploadFile } from "@mui/icons-material";
import DescriptionIcon from '@mui/icons-material/Description';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { fi, te } from 'date-fns/locale';

const ReportFormPortal = (props) =>{
        const authContext = useContext(AuthContext);
        const axiosGlobal = useContext(AxiosGlobal);
        const dispatch = useDispatch()
        const jobReportTitles = useSelector((state) => state.jobReportTitles);
        const userProfile = useSelector((state) => state.userProfile);
        const currentDisplay = useSelector((state) => state.currentDisplay);
        const uploadQueue = useSelector((state) => state.uploadQueue);
        const jobReportUploadedFile = useSelector((state) => state.jobReportUploadedFile);
        const navDownloadList = useSelector((state) => state.downloadNavMenu);
        const jobReportsForPerson = useSelector((state) => state.jobReportsForPerson);


    
        const webSections = useContext(WebSections);

        var decoded = jwtDecode(authContext.token);
        const history = useHistory();
        const [openTitleModal , setOpenTitleModal] = useState(false)
        const [minimizedStatus , setMinimizedStatus] = useState({uploaded:null , allFiles:null})

        const {acceptedFiles, getRootProps, getInputProps} = useDropzone();
        const [titlesAgain , setTitlesAgain]= useState(0); 
        const [contentBox , setContentBox] = useState([{id:0,title:'',explanation:'',_id:null}])
        const [files , setFiles] = useState([])
        const [filesToShow , setFilesToShow] = useState([])

        const [contentBoxListItemId , setContentBoxListItemId] = useState('')
        const [titleExpToEdit , setTitleExpToEdit] = useState('')

        // const [page, setPage] = useState(1);
        // const canvasRef = useRef(null);
        // const { pdfDocument, pdfPage } = usePdf({
        // file: props.pdfView === true?:'',
        // page,
        // canvasRef,
        // });

        useEffect(() => {
            const filter = uploadQueue.filter(e=>{return e.uploaded === true})
            setMinimizedStatus({uploaded:filter.length , allFiles:uploadQueue.length})
        }, [uploadQueue]);

        const syncData = async()=>{

            
            try{
                const response = await authContext.jwtInst({
                    method:'post',
                    url:`${axiosGlobal.defaultTargetApi}/jobReport/addJobReport`,
                    data:{files:files , contentBox:contentBox ,date:props.currentFormTitle},
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                dispatch(getSubmitedJobReports({authCtx:authContext , axiosGlobal:axiosGlobal}))
                props.setJobReportFormView(false)
    
            }catch(err){
                console.log(err);
            }
        }

        useEffect(() => {

            var temp = files
            for(var i = 0 ; jobReportUploadedFile.length > i ; i++){
                temp.push(jobReportUploadedFile[i]._id)
            }
            const filter = jobReportsForPerson.filter(e=>{return moment(e.calenderDate).format('l') === moment(props.currentFormTitle).format('l')})
            var mergedArr
            if(filter.length > 0){
                const fileIds =[]

                filter[0].filesToShow.forEach(e => {
                    var checkIfExist = files.filter
                    fileIds.push(e.file._id)
                });
                let arr = [...fileIds, ...temp];
                 mergedArr = [...new Set(arr)]
            }else if(filter.length === 0){
                mergedArr= temp
            }
            setFiles([...mergedArr])
        }, [jobReportUploadedFile]);

        useEffect(() => {
            setContentBox([...[{id:0,title:'',explanation:'',_id:null}]])
            setFilesToShow([...[]])            
            if(props.jobReportFormView === true){
                const filter = jobReportsForPerson.filter(e=>{return moment(e.calenderDate).format('l') === moment(props.currentFormTitle).format('l')})
                var reportContentTemp = []
                    if(filter[0] !== undefined){
                        if(filter.length>0){
                            filter[0].reportContent.map((e,i)=>{
                                reportContentTemp.push({id:i,title:e.title,explanation:e.explanation})
                            })
                            setContentBox([...reportContentTemp])
                            setFilesToShow([...filter[0].filesToShow])
                            // const fileIds =[]
                            
                            // filter[0].filesToShow.forEach(e => {
                            //     var checkIfExist = files.filter
                            //     fileIds.push(e.file._id)
                            // });
                            // setFiles([...fileIds])
                            setTitlesAgain(Math.random())
                        }
                    }

                
                
            }
        }, [jobReportsForPerson , props.jobReportFormView, props.currentFormTitle]);


        useEffect(() => {
            dispatch(actions.setJobReportProfile([]))                
        }, [props.currentFormTitle]);

        const addExplanationToTitle = async({i,data})=>{
            try{
              if(data.title === ''){
                dispatch(actions.setShowSnackBar({status:true,msg:'Enter or select the title',type:'error'}))
        
              }else if(data.explanation === ''){
                dispatch(actions.setShowSnackBar({status:true,msg:'Enter the explanation',type:'error'}))

              }else{
                if(data._id === null){
                    const response = await authContext.jwtInst({
                        method:'post',
                        url:`${axiosGlobal.defaultTargetApi}/jobReport/addNewPreset`,
                        data:{data},
                        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                    })
                    dispatch(actions.setUserProfileRefresh())
                    dispatch(actions.setShowSnackBar({status:true,msg:'Preset created',type:'success'}))

                }else if(data._id !== null){
                    const response = await authContext.jwtInst({
                        method:'post',
                        url:`${axiosGlobal.defaultTargetApi}/jobReport/addExplToPreset`,
                        data:{data},
                        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                    })
                    dispatch(actions.setUserProfileRefresh())
                    dispatch(actions.setShowSnackBar({status:true,msg:'Explanation added to the title preset',type:'success'}))

                }
              }
            }catch(err){
                console.log(err);
            }
        }
        
        useEffect(() => {
            var temp = contentBox
            for(var i = 0  ; temp.length>i ; i++){
                var tempDoc = temp[i]
                const itemId = jobReportTitles.filter(j=>{return(j.title === tempDoc.title)})
                if(itemId.length > 0){
                    temp[i]._id = itemId[0]._id
                }
            }
            setContentBox([...temp])
        }, [jobReportTitles , titlesAgain ]);

        const addNewBox =()=>{
            var temp1 = contentBox
            var temp2 = []
            temp1.push({id:0,title:'',explanation:'',_id:null})
            for(var i=0 ; temp1.length>i ; i++){
                temp2.push({id:i,title:temp1[i].title,explanation:temp1[i].explanation,_id:temp1[i]._id})
            }
            setContentBox([...temp2])
        }
        const deleteContentBox =({i})=>{
            var temp1 = contentBox.filter(e=>{return(e.id !== i)})
            var temp2 = []
            for(var h=0 ; temp1.length>h ; h++){
                temp2.push({id:h,title:temp1[h].title,explanation:temp1[h].explanation,_id:temp1[h]._id})
            }
            setContentBox([...temp2])
        }

        useEffect(() => {
            if(acceptedFiles.length>0){
                dispatch(setFilesAsync({files:acceptedFiles , uploadType:'jobReport'}))
                .then(()=>{
                    dispatch(uploadFile({authCtx:authContext , axiosGlobal:axiosGlobal , files:uploadQueue , currentDisplay}))
                })
            }
        }, [acceptedFiles]);
    return(
        <Fragment>  

                <TitleModal titleExpToEdit={titleExpToEdit} setTitleExpToEdit={setTitleExpToEdit}  contentBoxListItemId={contentBoxListItemId} setContentBox={setContentBox} contentBox={contentBox} setOpenTitleModal={setOpenTitleModal} openTitleModal={openTitleModal}></TitleModal>
                <div style={props.jobReportFormView === true?{display:'block'}:{display:'none'}}  className={props.jobReportFormView === true? `${Style.newInvoice} ${Style.fadeIn}` : props.jobReportFormView === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                    <div className={Style.topSection}>
                        <div onClick={()=>{props.setJobReportFormView(false); history.push('#jobReportFormView')}} className={Style.backBtn}><ArrowBackIosIcon className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                        <div className={Style.topTitle}>Job report form</div>
                    </div>
                    <div style={{overflowY:'scroll', maxWidth:'700px' , height:'95vh', padding:'0px 0px 40px 0px' , margin:'0px auto 0px auto'}}>   
                        <Container>

                            <div className={Style.header}>
                                <div className={Style.profileSection}>
                                    <div className={Style.profileAndName}>
                                        <Avatar
                                            alt="Remy Sharp"
                                            src={jwtDecode(authContext.token).profileImage  === undefined && authContext.login === false ?ProfilePhoto:jwtDecode(authContext.token).profileImage !== undefined && authContext.login === true ? `${authContext.defaultTargetApi}/uploads/${jwtDecode(authContext.token).profileImage.filename}`:null}
                                            sx={{ width: 80, height: 80 }}
                                        />
                                        <div style={{marginLeft:'10px'}}>
                                            <div className={Style.profileName}>{userProfile.firstName} {userProfile.lastName}</div>
                                            <div className={Style.profileRole}>
                                                {userProfile.access !== undefined ?
                                                    userProfile.access.map(data=>{
                                                        for(var i=0 ; webSections.listOfSections.length >i; i++){
                                                            if(webSections.listOfSections[i].value === data){
                                                                return(
                                                                    webSections.listOfSections[i].jobTitle                                                                )
                                                            }
                                                        }
                                                    })
                                                    :null
                                                }
                                                    
                                            </div>
                                        </div>
                                    </div>
                                    <Divider sx={{borderBottomWidth:'1px' , marginTop:'10px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                                    <div className={Style.briefInformation}>
                                        <div className={Style.dateInformation}>
                                            <CalendarMonthIcon sx={{fontSize:'32px'}}></CalendarMonthIcon>
                                            <span style={{fontFamily:'YekanBold'}}>Date:</span><span>{moment(props.currentFormTitle).format('l') === moment(Date.now()).format('l') ?'Today-':null}{moment(props.currentFormTitle).format('dddd')} {moment(props.currentFormTitle).format('l')}</span>
                                        </div>
                                        <div className={Style.lineVr}></div>
                                        <div className={Style.dateInformation}>
                                            <ListAltIcon sx={{fontSize:'32px'}}></ListAltIcon>
                                            <span style={{fontFamily:'YekanBold'}}>Form type:</span><span>Job report</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={Style.sectionTitles}>
                                <Row>
                                    <Col  xs={9} sm={9} md={9} lg={9} xl={9} xxl={9}>
                                        Explaintion
                                    </Col>
                                    <Col  xs={3} sm={3} md={3} lg={3} xl={3} xxl={3}>
                                        Title
                                    </Col>
                                </Row>
                            </div>
                            <div className={Style.formItself}>
                                {contentBox.map((e,i)=>{
                                    return(
                                        <Row   key={i}>
                                            <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
                                                <div className={Style.toolbar}>
                                                    <div style={{height:'100%',fontSize:'15px',backgroundColor:'rgb(85, 85, 85)',color:'white',padding:'6px 10px 3px 10px',marginRight:'10px',borderRadius:"5px"}}>{i+1}</div>
                                                    <div onClick={()=>{addExplanationToTitle({i,data:e})}} className={Style.toolbarDesign}>
                                                        {e._id === null?<Add></Add>:<Edit sx={{color:'black'}}></Edit>}
                                                    </div>
                                                    
                                                    <div onClick={()=>{deleteContentBox({i})}} style={{margin:'0px 0px 0px auto'}} className={Style.toolbarDesign}>
                                                        <Delete sx={{color:'red',marginLeft:'-5px'}}></Delete>Delete content box
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{paddingRight:'0px'}} xs={9} sm={9} md={9} lg={9} xl={9} xxl={9}>
                                                <textarea onChange={(e)=>{var temp=contentBox; temp[i].explanation = e.target.value; setContentBox([...temp])}} value={contentBox[i].explanation} name="" className={Style.lined} cols="30">

                                                </textarea>
                                            </Col>
                                            <Col style={{paddingLeft:'0px'}}  xs={3} sm={3} md={3} lg={3} xl={3} xxl={3}>
                                                <div onClick={()=>{setOpenTitleModal(true);setContentBoxListItemId(e.id)}} className={Style.number}>
                                                    {e.title === ''?
                                                        `Click to select title...`
                                                    :e.title}

                                                </div>
                                            </Col>
                                        </Row>
                                    )
                                })}


                            </div>
                            <div style={{marginBottom:'20px'}} onClick={addNewBox} className={Style.addDiv}>
                                <div  className={Style.addIconDiv}><AddIcon sx={{fontSize:'45px'}}></AddIcon></div>
                            </div>

                            <div style={{padding:'0px 0px 5px 5px',fontSize:'19px',fontFamily:'YekanBold'}}>Upload file</div>
                            <div style={{backgroundColor:'#eaeaea',border:'dashed 2px black',height:'80px',display:'flex',justifyContent:'center',alignItems:'center'}} {...getRootProps({className: 'dropzone'})}>
                                <input  {...getInputProps()} />
                                <p style={{marginTop:'16px'}}>Drop or click</p>
                                
                            </div>
                            <div style={{marginTop:'15px'}}>
                                {uploadQueue.length === 0?
                                    <div style={{width:'100%',margin:'0px auto 0px auto', display:'flex', justifyContent:'center',alignItems:'center', height:'15vh' , padding:"0px 15px 0px 15px", color:'gray'}}>
                                        Upload list is empty...
                                    </div>
                                    :
                                    <div style={{paddingBottom:'50px',width:'100%'}} className={Style.list}>
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
                                                                    <div className={Style.fileName} >{e.file.name}</div>
                                                                    <div className={Style.caption} style={{textAlign:'left' , color:'gray', padding:'0px'}}>uploading...</div>
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
                                                                <div style={{display:'inline-block', maxWidth:'60%'}}>
                                                                    <div className={Style.fileName} >{e.file.name}</div>
                                                                    <div className={Style.caption} style={{textAlign:'left' , color:'gray', padding:'0px'}}>uploaded</div>
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
                                                                    <div className={Style.fileName} >{e.file.name}</div>
                                                                    <div className={Style.caption} style={{textAlign:'left' , color:'gray', padding:'0px'}}>canceled</div>
                                                                </div>
                                                                <div style={{margin:'0px 0px 0px auto', fontSize:'14px'}}>
                                                                    <button onClick={()=>{dispatch(setFileForRetry({index:i})).then(()=>{dispatch(uploadFile({authCtx:authContext , axiosGlobal:axiosGlobal , files:uploadQueue , currentDisplay}))});}} style={{border:'none', padding:'5px 10px 5px 10px'}}>retry</button>
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
                                                                    <div className={Style.fileName} >{e.file.name}</div>
                                                                    <div className={Style.caption} style={{textAlign:'left' , color:'red', padding:'0px'}}>There is an error</div>
                                                                </div>
                                                                <div style={{margin:'0px 0px 0px auto', fontSize:'14px'}}>
                                                                    <button onClick={()=>{dispatch(setFileForRetry({index:i})).then(()=>{dispatch(uploadFile({authCtx:authContext , axiosGlobal:axiosGlobal , files:uploadQueue , currentDisplay}))});}} style={{border:'none', padding:'5px 10px 5px 10px'}}>retry</button>
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
                                                                    <div className={Style.fileName}>{e.file.name}</div>
                                                                    <div className={Style.caption} style={{textAlign:'left' , color:'gray', padding:'0px'}}>Waiting in queue...</div>
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
                                }
                                
                            </div>
                            <Gallery  filesToShow={filesToShow}></Gallery>
                            <Divider sx={{borderBottomWidth:'1px' , marginTop:'10px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>

                            <div className={Style.btnDiv}>
                                <bottom onClick={syncData} className={Style.submitBtn}>
                                    save
                                    {/* {loading === true ?<CircularProgress size='25px' color='inherit'></CircularProgress> :'Submit'} */}
                                </bottom>
                            </div>
                        </Container>
                    </div>
                    
                </div>

       </Fragment>
    )
}

const ReportForm = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <ReportFormPortal currentFormTitle={props.currentFormTitle} setCurrentFormTitle={props.setCurrentFormTitle}  jobReportFormView={props.jobReportFormView} setJobReportFormView={props.setJobReportFormView}></ReportFormPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default ReportForm;