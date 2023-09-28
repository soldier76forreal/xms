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
import { Diversity1 } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import AuthContext from '../authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import {  CircularProgress, Divider, FormControlLabel, Switch, TextareaAutosize } from '@mui/material';
import { useHistory } from 'react-router-dom';
import MultiSelect from '../../tools/inputs/multiSelect';
import IconBotton from '../../tools/buttons/iconBtn';
import AddIcon from '@mui/icons-material/Add';
import NewCustomer from '../crm/newCustomer';
import CustomSelect from '../../tools/inputs/customSelect';
import { usePdf } from '@mikecousins/react-pdf';
import Avatar from '@mui/material/Avatar';
import ProfilePhoto from '../../assets/imagePlaceHolder.png';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import '../overalStyle/overals.scss'
import SelectTitleModal from './selectTitleModal';

const ReportFormPortal = (props) =>{
        const authContext = useContext(AuthContext);
        const axiosGlobal = useContext(AxiosGlobal);
        var decoded = jwtDecode(authContext.token);
        const history = useHistory();
        const [selectTitleModal , setSelectTitleModal] = useState(true)
        // const [page, setPage] = useState(1);
        // const canvasRef = useRef(null);
        // const { pdfDocument, pdfPage } = usePdf({
        // file: props.pdfView === true?:'',
        // page,
        // canvasRef,
        // });
    return(
        <Fragment>  
                <SelectTitleModal setSelectTitleModal={setSelectTitleModal} selectTitleModal={selectTitleModal}></SelectTitleModal>
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
                                            <div className={Style.profileName}>Reza rezaei</div>
                                            <div className={Style.profileRole}>Reza rezaei</div>
                                        </div>
                                    </div>
                                    <Divider sx={{borderBottomWidth:'1px' , marginTop:'10px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                                    <div className={Style.briefInformation}>
                                        <div className={Style.dateInformation}>
                                            <CalendarMonthIcon sx={{fontSize:'32px'}}></CalendarMonthIcon>
                                            <span style={{fontFamily:'YekanBold'}}>Date:</span><span>Today-Sunday 2023/02/25</span>
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
                                
                                    <Row>
                                        <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div className={Style.toolbar}>

                                            </div>
                                        </Col>
                                        <Col style={{paddingRight:'0px'}} xs={9} sm={9} md={9} lg={9} xl={9} xxl={9}>
                                            <textarea name="" className={Style.lined} cols="30">
                                                Hello Test
                                                I would like this to be on line.
                                                Very line.
                                            </textarea>
                                        </Col>
                                        <Col style={{paddingLeft:'0px'}}  xs={3} sm={3} md={3} lg={3} xl={3} xxl={3}>
                                            <div onClick={()=>{setSelectTitleModal(true)}} className={Style.number}>
                                                1-Click to select title...

                                            </div>
                                        </Col>
                                    </Row>
                                

                                <Divider sx={{borderBottomWidth:'1px' , margin:'10px 0px 10px 0px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                                <Row>
                                    <Col  xs={9} sm={9} md={9} lg={9} xl={9} xxl={9}>
                                        <textarea name="" className={Style.lined} cols="30">
                                            Hello Test
                                            I would like this to be on line.
                                            Very line.
                                        </textarea>
                                    </Col>
                                    <Col  xs={3} sm={3} md={3} lg={3} xl={3} xxl={3}>

                                    </Col>
                                </Row>
                                <Divider sx={{borderBottomWidth:'1px' , margin:'10px 0px 10px 0px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                                <Row>
                                    <Col  xs={9} sm={9} md={9} lg={9} xl={9} xxl={9}>
                                        <textarea name="" className={Style.lined} cols="30">
                                            Hello Test
                                            I would like this to be on line.
                                            Very line.
                                        </textarea>
                                    </Col>
                                    <Col  xs={3} sm={3} md={3} lg={3} xl={3} xxl={3}>

                                    </Col>
                                </Row>
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
              <ReportFormPortal  jobReportFormView={props.jobReportFormView} setJobReportFormView={props.setJobReportFornView}></ReportFormPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default ReportForm;