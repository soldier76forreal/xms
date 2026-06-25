import { Fragment  , useContext} from "react"
import Style from './notficationCard.module.scss';
import { useHistory } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import moment from 'jalali-moment';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import ArticleIcon from '@mui/icons-material/Article';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AuthContext from "../authAndConnections/auth";
import jwtDecode from "jwt-decode";
import { Avatar, CircularProgress } from "@mui/material";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
// onClick={()=>{props.setPostOpen({status:true , id:props.i}); props.setShowPost(true); history.push('#showNotif')}}
// style={{backgroundColor:props.doc.type === 0?'#fff': props.doc.type === 1?'rgb(239, 156, 78)' :props.doc.type === 2?'rgb(112, 236, 139)':null , marginBottom:'10px'}} className={props.postOpen.status === true && props.postOpen.id === props.i ?`${Style.invoiceCard} ${Style.fadeOut}`:`${Style.invoiceCard} ${Style.fadeIn}`
const NotficationCard = (props) =>{
    const history = useHistory()
    const authCtx = useContext(AuthContext)
    if(props.data !== undefined){
        return(
            <Fragment>
                <div  key={props.i} dir='rtl' style={props.data.status === 0?{backgroundColor:"rgb(216, 237, 238)"}:props.data.status === 1?{backgroundColor:"rgb(234, 234, 234)"} :null} className={Style.invoiceCard}>
                    <div id={props.data.id} onClick={(e)=>{props.seen(e.target.id)}} className={Style.sideBtn}>
                        {props.loading.status === true && props.data.id === props.loading.id?
                            <div style={{display:'flex' , justifyContent:'center'}}>
                                <CircularProgress size='14px' color='inherit'></CircularProgress>
                            </div>
                        :
                            <div>
                                {props.data.status === 0?
                                    <RemoveRedEyeIcon sx={{fontSize:'20px'}}></RemoveRedEyeIcon>
                                :props.data.status === 1?  
                                    <VisibilityOffIcon sx={{fontSize:'20px'}}></VisibilityOffIcon>
                                :null}
                            </div>
                        }
                    </div>
                    <div  style={{width:'95%' , padding:'10px 7px 10px 10px' , height:'100%'}}>
                        <Row>
                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
    
                                <div className={Style.top}>
                                    <div  dir='rtl' className={Style.effectBy}>
                                    {props.data.type === 'sendRequest' || props.data.type === 'newInvoice' ? 
                                            <span><ArticleIcon sx={{marginLeft:'2px' , fontSize:'19px'}}></ArticleIcon>درخواست ها</span>
                                        :null}
                                    </div>
                                    <div className={Style.date}>
                                        تاریخ ارسال:<span>{moment(props.data.insertDate, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}</span>
                                    </div>
                                </div>
                                <div style={{padding:'4px 0px 4px 0px', textAlign:'right'}}>
                                    <div style={{padding:'3px 0px 0px 0px'}} className={Style.title}>
                                        <span>{props.data.type === 'sendRequest' ? `درخواست از طرف ${props.data.from.firstName} ${props.data.from.lastName} برای شما ارسال شده است ` :props.data.type === 'newInvoice' ? `تکمیل شده است ${props.data.from.firstName} ${props.data.from.lastName} درخواست توسط`:null}</span>
                                    </div>
                                    <div className={Style.dis}>
                                        <span>
                                            {props.data.document.preInvoice.productName}
                                        </span>
                                        <span>-</span>
                                        <span dir='rtl' className={Style.meter}>{props.data.document.preInvoice.meterage} متر</span>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            </Fragment>
        )

    }

}


export default NotficationCard;

