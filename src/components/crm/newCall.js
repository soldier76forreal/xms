import { Fragment , useState , useContext , useRef , useEffect } from 'react';
import Style from './newCall.module.scss'
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
import { Call } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import AuthContext from '../authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import { CircularProgress, FormControlLabel, Switch } from '@mui/material';
import { useHistory } from 'react-router-dom';
import ToggleBtn from '../../tools/buttons/toggleBtn';
import MultiSelect from '../../tools/inputs/multiSelect';
import ErrorModal from '../../tools/navs/errorModal';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';


const NewCallPortal = (props) =>{
        const authContext = useContext(AuthContext);
        const axiosGlobal = useContext(AxiosGlobal);
        var decoded = jwtDecode(authContext.token);
        const dispatch = useDispatch()
        const history = useHistory();

        //pre invoice states
        const [callDate , setCallDate] = useState(Date.now());
        const [callReason , setCallReason] = useState('');
        const [targetRequest , setTargetRequest] = useState([]);
        const [errorStatus , setErrorStatus] = useState(null);

        const [invoices , setInvoices] = useState([]);
        const [loading , setLoading] = useState(false);

        const [callStatus , setCallStatus] = useState(null);
        const [callDescription , setCallDescription] = useState('');

        const saveNewCall = async() =>{
            setLoading(true)
            if(callDate === '' || callReason==='' || callStatus=== null){
                setErrorStatus(true)
                setLoading(false)
            }else{

            
                const data = {
                    docId:props.newCallStatus.docId,
                    phoneNumber:props.targetDocForCall.phoneNumber,
                    countryCode:props.targetDocForCall.countryCode,
                    callDate:callDate,
                    callReason:callReason,
                    targetRequest:targetRequest,
                    callStatus:callStatus,
                    callDescription:callDescription
                }
            
                try{
                    const response = await authContext.jwtInst({
                        method:'post',
                        url:`${axiosGlobal.defaultTargetApi}/crm/saveNewCall`,
                        data:data,
                        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                    })
                    dispatch(actions.crmRefresh())
                    setTimeout(()=>{
                        setLoading(false)
                        props.setSuccessToast({status:true , msg:'تماس جدید ثبت شد'});
                        const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false ,msg:'تماس جدید ثبت شد'})}, 3000);
                        props.setNewCallStatus({docId:'' , phoneNumber:'' , status:false})
                    }, 800)
                    
                }catch(err){               
                    console.log(err);
                    setLoading(false)
                }
            }
        }


        const getAllInvoices = async() =>{
 
            try{
                const response = await authContext.jwtInst({
                    method:'get',
                    params:{id:props.newCallStatus.docId},
                    url:`${axiosGlobal.defaultTargetApi}/mis/getAllInvoicesForSelect`,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                var temp = [...response.data];
                
                temp.sort((a,b)=>{
                    return new Date(b.preInvoice.insertDate) - new Date(a.preInvoice.insertDate);
                })
                var temp2 = []
                for(var i=0 ; temp.length>i ; i++){
                    temp2.push({value:temp[i]._id , name:`${temp[i].preInvoice.productName}-${temp[i].preInvoice.meterage}`})
                }
                setInvoices([...temp2])
            }catch(err){               
                console.log(err);
            }
        }
        useEffect(() => {
            if(props.newCallStatus.status === true){
                    getAllInvoices()
            }
        }, [props.newCallStatus.status]);
    return(
        <Fragment>
                <ErrorModal  errorContext='برای ثبت تماس؛ تاریخ تماس، دلیل تماس و وضعیت تماس را وارد کنید' setErrorStatus={setErrorStatus} errorStatus={errorStatus}></ErrorModal>
                <div style={props.newCallStatus.status === true?{display:'block'}:{display:'none'}}  className={props.newCallStatus.status === true? `${Style.newInvoice} ${Style.fadeIn}` : props.newCallStatus.status === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                    <div className={Style.topSection}>
                        <div onClick={()=>{props.setNewCallStatus({status:false , id:''}); history.push('#newPreInvoices')}} className={Style.backBtn}><ArrowBackIosIcon className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                        <div className={Style.topTitle}>ثبت تماس</div>
                    </div>
                    <div style={{overflowY:'scroll' , height:'95vh'}}>              
                        <div style={{padding:'10px 25px 0px 25px'}}  className={Style.formDiv}>
                            <Row>
                                <Col  xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div className={Style.callBtnDiv} >
                                        <div className={Style.callBtnTitle}>:ثبت تماس برای شماره</div>
                                        <div style={{ marginBottom:'10px' , marginRight:'8px' , display:'flex' , justifyContent:'center'}}>
                                            <div className={Style.btm}>     
                                                <a href={`tel:${props.targetDocForCall.countryCode}-${props.targetDocForCall.phoneNumber}`}>
                                                    <button>
                                                        <Call></Call>
                                                    </button>
                                                </a>
                                                <div style={{marginLeft:'5px' , display:'flex' ,width:'150px' , fontSize:'18px' , padding:'5px 10px 0px 10px'}}>
                                                    {props.targetDocForCall.countryCode}-{props.targetDocForCall.phoneNumber}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            <Row style={{marginBottom:'10px'}}>
                                <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div>
                                        <label style={{marginBottom:'5px' , fontSize:'13px'}}>تاریخ تماس</label>
                                        <Datep  onChange={(e)=>{setCallDate(e)}}></Datep>    
                                    </div>
                                </Col>
                            </Row>
                            <Row style={{marginBottom:'10px'}}>
                                <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div>
                                        <div>
                                            <label style={{marginBottom:'5px' , fontSize:'13px'}}>دلیل تماس</label>
                                        </div>
                                        <ToggleBtn setCallReason={setCallReason} type='callType'></ToggleBtn>
                                    </div>  
                                </Col>
                            </Row>
                            <Row style={{marginBottom:'10px'}}>
                                <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div>
                                        <div>
                                            <label style={{marginBottom:'5px' , fontSize:'13px'}}>درخواست هدف</label>
                                        </div>
                                            <MultiSelect options={invoices}  setTargetRequest={setTargetRequest} type='normal' width='100%'></MultiSelect>

                                        {/* <CustomSelect options={allCustomer} onChange={(e)=>{setCompanyName(e.value)}} selectType='selectCustomer' placeholder="مشتری ها"></CustomSelect> */}
                                    </div>
                                </Col>
                            </Row>
                            <Row style={{marginBottom:'10px'}}>
                                <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div>
                                        <div>
                                            <label style={{marginBottom:'5px' , fontSize:'13px'}}>وضعیت تماس</label>
                                        </div>
                                        <ToggleBtn setCallStatus={setCallStatus} type='callStatus'></ToggleBtn>
                                    </div>  
                                </Col>
                            </Row>
                            <Row style={{marginBottom:'10px'}}>
                                <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div dir='rtl'>
                                        <label style={{marginBottom:'5px' , fontSize:'13px'}}>توضیحات مختصر</label>
                                        <textarea onChange={(e)=>{setCallDescription(e.target.value)}}  id="w3review" name="w3review" rows="5" style={{width:'100%'}} cols="50"></textarea>                                            
                                    </div>      
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div className={Style.btnDiv}>
                                        <bottom onClick={saveNewCall} className={Style.submitBtn}>
                                            {loading === true ?<CircularProgress size='25px' color='inherit'></CircularProgress> :'ثبت'}
                                        </bottom>
                                    </div>
                                </Col>
                            </Row>
                        </div>      
                    </div>
                </div>

       </Fragment>
    )
}

const NewCall = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <NewCallPortal successToast={props.successToast} setSuccessToast={props.setSuccessToast}  setTargetDocForCall={props.setTargetDocForCall} targetDocForCall={props.targetDocForCall} setNewCallStatus={props.setNewCallStatus} newCallStatus={props.newCallStatus} ></NewCallPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default NewCall;