import { Fragment , useState  , useContext , useEffect} from 'react';
import Style from './personeCardMinimized.module.scss'
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
import FrequentBtn from '../functions/frequentBtn';

const options = [
    'حذف',
    'ویرایش'
];



const PersoneCardMinimized = (props) =>{
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
    if(props.data.customer.communication.length !==0){
        last_Call = props.data.customer.communication.reduce(function(prev, current) {
            let prevDate = new Date(prev.communicationDate);
            let currentDate = new Date(current.communicationDate);
            return (prevDate > currentDate) ? prev : current;
          });
    }
    return(
        <Fragment>
            <div onClick={(e)=>{props.setShowCustomer({status:true , id:props.data.customer._id});e.stopPropagation()}}  className={Style.divCard}>
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
                        {props.data.customer.personalInformation.personOrCompany ==='pr'?
                            <div style={{margin:'0px 0px 0px 10px' , display:'flex', justifyContent:'center'}}>
                                <div style={{display:'flex', justifyContent:'center' , alignItems:'center',marginRight:'3px'}} className={Style.profName}>
                                    {props.data.customer.personalInformation.firstName}
                                </div>
                                <div style={{display:'flex', justifyContent:'center' , alignItems:'center'}} className={Style.profName}>
                                    {props.data.customer.personalInformation.lastName}
                                </div>
                            </div>
                        :props.data.customer.personalInformation.personOrCompany === 'com'?
                            <div style={{margin:'0px 0px 0px 10px' , display:'flex', justifyContent:'center'}}>
                                <div style={{display:'flex', justifyContent:'center' , alignItems:'center',marginRight:'3px'}} className={Style.profName}>
                                    {props.data.customer.personalInformation.companyName}
                                </div>
                            </div>
                        :
                            <div style={{margin:'0px 0px 0px 10px' , display:'flex', justifyContent:'center'}}>
                                <div style={{display:'flex', justifyContent:'center' , alignItems:'center',marginRight:'3px'}} className={Style.profName}>
                                    {props.data.customer.personalInformation.firstName}
                                </div>
                                <div style={{display:'flex', justifyContent:'center' , alignItems:'center'}} className={Style.profName}>
                                    {props.data.customer.personalInformation.lastName}
                                </div>
                            </div>
                        }
                        <div style={{margin:'0px 0px 0px auto'}}>
                            <CardMenu data={props.data.customer} editCustomer={props.editCustomer} setEditCustomer={props.setEditCustomer} deleteModal={props.deleteModal} id={props.data.customer._id}></CardMenu>
                        </div>
                    </div>
                </div>
                <div style={{marginTop:'10px'}}>
                    <Row>
                        <Col style={{padding:'0px 3px 0px 10px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
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
                        <Col style={{padding:'0px 10px 0px 3px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                            <FrequentBtn data={props.data.customer}></FrequentBtn>
                        </Col>

                    </Row>
                </div>
                <div style={{backgroundColor:props.data.customer.personalInformation.customerType==='cc'?'rgb(112, 236, 139)':props.data.customer.personalInformation.customerType==='le'?'rgb(239, 156, 78)':props.data.customer.personalInformation.customerType==='pc'?'rgb(219, 219, 219)':'rgb(219, 219, 219)'}} className={Style.bottomIndc} >

                </div>
            </div>
        </Fragment>
    )
}


export default PersoneCardMinimized;