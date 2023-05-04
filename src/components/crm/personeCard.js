import { Fragment , useState  , useContext , useEffect} from 'react';
import Style from './personeCard.module.scss'
import prFlag from '../../assets/per.png';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CardMenu from "./cardMenu";
import 'bootstrap/dist/css/bootstrap.min.css';
import AddIcon from '@mui/icons-material/Add';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
import { Call, PlusOne, WhatsApp } from "@mui/icons-material";
import Swal from 'sweetalert2'
import moment from 'jalali-moment'
import Flag from 'react-country-flag';
import withReactContent from 'sweetalert2-react-content'    
import AxiosGlobal from "../authAndConnections/axiosGlobalUrl";
import AuthContext from "../authAndConnections/auth";
import FlagPlaceholder from '../../assets/country.png';
import CallType from '../functions/callType';

const options = [
    'حذف',
    'ویرایش'
];



const PersoneCard = (props) =>{
    const MySwal = withReactContent(Swal)
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    
    var newestItem
    if(props.data.invoice.length !==0){
         newestItem = props.data.invoice.reduce(function(prev, current) {
            let prevDate = new Date(prev.preInvoice.insertDate);
            let currentDate = new Date(current.preInvoice.insertDate);
            return (prevDate > currentDate) ? prev : current;
          });
    }

    var last_Call
    if(props.data.customer.phoneCalls.length !==0){
        last_Call = props.data.customer.phoneCalls.reduce(function(prev, current) {
            let prevDate = new Date(prev.callDate);
            let currentDate = new Date(current.callDate);
            return (prevDate > currentDate) ? prev : current;
          });
    }
    return(
        <Fragment>
            <div onClick={(e)=>{props.setShowCustomer({status:true , id:props.data.customer._id});e.stopPropagation()}} dir="rtl" className={Style.divCard}>
                <div  className={Style.prof}>
                    <div  className={Style.profFlagDiv}>
                        {props.data.customer.personalInformation.country === null?
                            <div style={{width:'48px' , borderRadius:'15px' , height:'48px'}}>
                                <img src={FlagPlaceholder}></img>
                            </div>                        
                            :
                            <div style={{width:'48px' , borderRadius:'15px' , height:'48px'}}>
                                <Flag countryCode={props.data.customer.personalInformation.country} style={{height:'100%'  , width:'100%', position:'center', objectFit:"cover"}} svg/>
                            </div>
                        }
                        <div style={{margin:'0px 10px 0px 0px' , display:'flex', justifyContent:'center'}}>
                            <div style={{display:'flex', justifyContent:'center' , alignItems:'center'}} className={Style.profName}>
                                {props.data.customer.personalInformation.firstName}
                            </div>
                            <div style={{display:'flex', justifyContent:'center' , alignItems:'center'}} className={Style.profName}>
                                {props.data.customer.personalInformation.lastName}
                            </div>
                        </div>
                        <div style={{margin:'0px auto 0px 0px'}}>
                            <CardMenu data={props.data.customer} editCustomer={props.editCustomer} setEditCustomer={props.setEditCustomer} deleteModal={props.deleteModal} id={props.data.customer._id}></CardMenu>
                        </div>
                    </div>

                </div>
                <div style={{marginTop:'10px'}}>
                    <Row>
                        <Col style={{padding:'0px 10px 0px 3px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                            {props.data.customer.contactInfo.phoneNumbers.filter(e=>{return e.whatsApp === true}).length > 1?
                                <div onClick={(e)=>{e.stopPropagation();props.setOpenWhatsAppModal(true); props.setWhatsAppMsgList([...props.data.customer.contactInfo.phoneNumbers.filter(e=>{return e.whatsApp === true})]);}} className={Style.whatsAppChat}>
                                    <WhatsApp sx={{color:'#000'}}></WhatsApp>
                                </div>
                            :props.data.customer.contactInfo.phoneNumbers.filter(e=>{return e.whatsApp === true}).length === 1?
                                <a onClick={(e)=>{e.stopPropagation()}} href={`https://api.whatsapp.com/send?phone=${props.data.customer.contactInfo.phoneNumbers.filter(e=>{return e.whatsApp === true})[0].countryCode}${props.data.customer.contactInfo.phoneNumbers.filter(e=>{return e.whatsApp === true})[0].number}`}>
                                    <div className={Style.whatsAppChat}>
                                        <WhatsApp sx={{color:'#000'}}></WhatsApp>
                                    </div>
                                </a>
                            :props.data.customer.contactInfo.phoneNumbers.filter(e=>{return e.whatsApp === true}).length === 0?
                                <div onClick={(e)=>{e.stopPropagation()}}  className={Style.whatsAppChatDis}>
                                    <WhatsApp sx={{color:'#000'}}></WhatsApp>
                                </div>
                            :null}

                        </Col>
                        <Col style={{padding:'0px 3px 0px 10px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                            {props.data.customer.contactInfo.phoneNumbers.length > 1?
                                <div onClick={(e)=>{e.stopPropagation();props.setOpenCallModal({status:true , list:props.data.customer.contactInfo.phoneNumbers}); props.setTargetDocForCall({docId:props.data.customer._id , countryCode:'' , phoneNumber:'' , status:false})}} className={Style.call}>
                                    <Call sx={{color:'#fff'}}></Call>
                                </div>
                            :props.data.customer.contactInfo.phoneNumbers.length === 1?
                                <a onClick={(e)=>{e.stopPropagation();props.setTargetDocForCall({status:true , docId : props.data.customer._id ,countryCode:`${props.data.customer.contactInfo.phoneNumbers[0].countryCode}` , phoneNumber:`${props.data.customer.contactInfo.phoneNumbers[0].number}`});}} href={`tel:${props.data.customer.contactInfo.phoneNumbers[0].countryCode}${props.data.customer.contactInfo.phoneNumbers[0].number}`}>
                                    <div className={Style.call}>
                                        <Call sx={{color:'#fff'}}></Call>
                                    </div> 
                                </a>
                            :null}
                        </Col>
                        <Col style={{marginTop:'3px'}}  xs={12} md={12} lg={12} xl={12} xxl={12}>
                            <div className={Style.lastCall}>
                               آخرین تماس                                     
                            </div>
                            <div className={Style.lastCallSubs}>
                                {props.data.customer.phoneCalls.length ===0?
                                    'تماسی برقرار نشده است'
                                :
                                    `${last_Call.phoneNumber}-${CallType(last_Call.callReason)}-${last_Call.callStatus === true ? 'پاسخ داده شد':last_Call.callStatus === false ?'پاسخ داده نشد':null}`
                                }
                            </div>     
                        </Col>

                    </Row>
                </div>
                <div style={{width:'100%' , marginTop:'5px' , height:'2px' , backgroundColor:'rgb(180, 180, 180)'}}></div>
                <div style={{marginTop:'3px'}}>
                    <div className={Style.lastInvoiceTitle}>
                        آخرین درخواست                                     
                    </div>
                    <div className={Style.lastRequestsDiv}>
                        <div className={Style.statusDiv}>
                        </div>
                        <div  className={Style.newRequestBtn}>
                            <AddIcon></AddIcon>
                        </div>
                        <div className={Style.requestItSelf}>
                            {props.data.invoice.length === 0?
                                <span>درخواستی صادر نشده است</span>
                            :
                                <div style={{display:'flex' , justifyContent:'center'}}>
                                    <span>
                                        {newestItem.preInvoice.productName}
                                    </span>
                                    <span>-</span>
                                    <span dir='rtl' className={Style.meter}>{newestItem.preInvoice.meterage === null ? "متراژ:نامشخص":newestItem.preInvoice.meterage !== null? `متر ${newestItem.preInvoice.meterage}`:null}</span>
                                        {newestItem.preInvoice.dimentions !== undefined?<span>-</span>:null}
                                    <span dir='rtl' className={Style.meter}>{newestItem.preInvoice.dimentions !== undefined?`${newestItem.preInvoice.dimentions.width}*${newestItem.preInvoice.dimentions.height}*${newestItem.preInvoice.dimentions.diameter}`:null}</span>
                                </div>    
                            }
                        </div>
                    </div>
                </div>
                <div style={{width:'100%' , marginTop:'8px' , height:'2px' , backgroundColor:'rgb(180, 180, 180)'}}></div>
                <div className={Style.insertDate}>
                    {`ثبت شده توسط ${props.data.generatedBy.firstName} ${props.data.generatedBy.lastName}  در تاریخ ${moment(props.data.customer.insertDate, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}`}
                </div>
            </div>
        </Fragment>
    )
}


export default PersoneCard;