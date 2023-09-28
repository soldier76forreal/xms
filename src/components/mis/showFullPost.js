import { Fragment , useState , useContext, useEffect  } from 'react';
import Style from './showFullPost.module.scss';
import ReactDom from 'react-dom';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl , Col} from 'react-bootstrap';
import PlaceIcon from '@mui/icons-material/Place';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Grid3x3Icon from '@mui/icons-material/Grid3x3';
import StraightenIcon from '@mui/icons-material/Straighten';
import BadgeIcon from '@mui/icons-material/Badge';
import MuiInput from '../../tools/inputs/muiInput';
import Datep from '../../tools/inputs/datePicker';
import Button from '@mui/material/Button';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import AuthContext from '../authAndConnections/auth';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import FactoryIcon from '@mui/icons-material/Factory';
import moment from 'jalali-moment'
import DateRangeIcon from '@mui/icons-material/DateRange';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GradeIcon from '@mui/icons-material/Grade';
import LineWeightIcon from '@mui/icons-material/LineWeight';
import WebSections from '../../contextApi/webSection';
import { useHistory } from 'react-router-dom';
import SocketContext from '../authAndConnections/socketReq';
import HeightIcon from '@mui/icons-material/Height';
import { CircularProgress } from '@mui/material';
import PrTitle from '../functions/prTItle';

const ShowFullPostPortal = (props) =>{
    const authContext = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const socketCtx = useContext(SocketContext);

    const webSections = useContext(WebSections);
    const history = useHistory()
    var decoded = jwtDecode(authContext.token);
    const [invoiceDate , setInvoiceDate] = useState(Date.now());
    const [costCnf, setCostCnf] = useState('');
    const [costFob , setCostFob] = useState('');
    const [factoryPrice , setFactoryPrice] = useState('');
    const [stoneThickness , setStoneThickness] = useState('');
    const [stoneRate , setStoneRate] = useState('');
    const [loading , setLoading] = useState(false);
    const [dateOfShipment , setDateOfShipment] = useState(Date.now());
    var id ='';

    
    const completeTheInvoice = async() =>{
            setLoading(true)
            const data = {
                id:props.data.doc._id,
                invoiceDate:invoiceDate,
                costCnf:costCnf,
                costFob:costFob,
                factoryPrice:factoryPrice,
                stoneThickness:stoneThickness,
                stoneRate:stoneRate,
                dateOfShipment:dateOfShipment,
                generatedBy:decoded.id
            }
            try{
                const response = await authContext.jwtInst({
                    method:'post',
                    url:`${axiosGlobal.defaultTargetApi}/mis/completeInvoice`,
                    data:data,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                setTimeout(()=>{
                    props.setSuccessToast({status:true , msg:'درخواست شما بروز رسانی شد'});
                    const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'درخواست شما بروز رسانی شد'})}, 3000);
                    props.setShowPost(false);
                    props.setPostOpen({status:false , id:null});
                    var temp = [];
                    var targetUserIds =[];
                    if(props.data.doc !== undefined){
                        if(props.data.doc.sharedTo.length !== 0){
                            props.data.doc.sharedTo.forEach(element => {
                                if(element.deleteDate === null){
                                    temp.push(element.to)
                                }
                            });
                            temp.push(props.data.doc.preInvoice.generatedBy)     
                            const result = temp.filter(word => JSON.stringify(word) !== JSON.stringify(jwtDecode(authContext.token).id));
                            targetUserIds = [...new Set(result)];
                            props.setContectRefresh(Math.random())
                            socketCtx.sendToContactsIo(targetUserIds ,jwtDecode(authContext.token).id ,props.data.doc._id ,'newInvoice');
                        }
                    }
                    setLoading(false)
                    props.setContectRefresh(Math.random());
                }, 1000)   
            }catch(err){
                console.log(err)
            }
        
    }
    


    if(props.data !== null){
        return(
            
            <Fragment>
          
            <div style={props.showPost === true?{display:'block'}:{display:'none'}}  className={props.showPost===true?`${Style.mainDiv} ${Style.fadeIn}`:`${Style.mainDiv} ${Style.fadeOut}`}>
                <div className={Style.topSection}>
                    <div onClick={()=>{ props.setShowPost(false); props.setPostOpen({status:false , id:props.showPost.id})}} className={Style.backBtn}><ArrowBackIosIcon className={Style.btn2} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                    <div className={Style.topTitle}>نمایش درخواست</div>
                </div>

                <div className={Style.formDiv} dir='rtl' style={{maxWidth:'700px'}}>
                    <div className={Style.secTitle}>درخواست</div>
                        <Row >
                            <Col style={{padding:'0px 5px 0px 5px'}}  xs={6} md={6} lg={6} xl={6} xxl={6}>
                                <div className={Style.ovDiv}>
                                    <div className={Style.name}>      
                                        <Grid3x3Icon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px'}}></Grid3x3Icon>
                                        <span>
                                            نام محصول
                                        </span>
                                    </div>
                                    <div className={Style.context}>
                                        {props.data.doc.preInvoice.productName}
                                    </div>
                                </div>
                            </Col>
                            <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                <div className={Style.ovDiv}>
                                    <div className={Style.name}>      
                                        <StraightenIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></StraightenIcon>
                                        <span>
                                            متراژ مورد نظر
                                        </span>
                                    </div>
                                    <div className={Style.context}>
                                        {props.data.doc.preInvoice.meterage === null?'وارد نشده' : props.data.doc.preInvoice.meterage}
                                    </div>
                                </div>
                        
                            </Col>
                        </Row>
                        <Row style={{marginTop:'8px'}}>
                            <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                <div className={Style.ovDiv}>
                                    <div className={Style.name}>      
                                        <PlaceIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></PlaceIcon>
                                        <span>
                                            مقصد
                                        </span>
                                    </div>
                                    <div className={Style.context}>
                                        {props.data.doc.preInvoice.destination}
                                    </div>
                                </div>
                            </Col>
                            <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                {/* {props.data.customer !== null && props.data.customer !== undefined ?                                
                                    <div className={Style.ovDiv}>
                                        <div className={Style.name}>      
                                            <BadgeIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></BadgeIcon>
                                            <span>
                                                نام شرکت
                                            </span>
                                        </div>
                                        {console.log(props.data.customer)}
                                        { props.data.customer !== undefined ?
                                            <div className={Style.context}>
                                                {PrTitle(props.data.customer.personalInformation.personTitle)} {props.data.customer.personalInformation.firstName} {props.data.customer.personalInformation.lastName}
                                            </div>
                                        
                                        :null}
                                    </div>
                                :props.data.customer === null?
                                    <div className={Style.ovDiv}>
                                        <div className={Style.name}>      
                                            <BadgeIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></BadgeIcon>
                                            <span>
                                                نام شرکت
                                            </span>
                                        </div>
                                        {console.log(props.data.doc.preInvoice.productName)}
                                        <div className={Style.context}>
                                            {props.data.doc.preInvoice.companyName}
                                        </div>
                                    </div>
                                :null} */}
                                     <div className={Style.ovDiv}>
                                        <div className={Style.name}>      
                                            <BadgeIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></BadgeIcon>
                                            <span>
                                                نام شرکت
                                            </span>
                                        </div>
                                        {console.log(props.data.doc.preInvoice.productName)}
                                        <div className={Style.context}>
                                            {props.data.doc.preInvoice.companyName}
                                        </div>
                                    </div>
                            </Col>
                        </Row>
              
                        
                            <Row style={{marginTop:'8px' , display:'flex' , justifyContent:'center'}}>
                               
                                
                                    <Col style={{padding:'0px 5px 0px 5px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div className={Style.ovDiv}>
                                            <div className={Style.name}>      
                                                <HeightIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></HeightIcon>
                                                <span>
                                                    ابعاد
                                                </span>
                                            </div>
                                            <div className={Style.context}>
                                                {props.data.doc.preInvoice.dimentions !== undefined?
                                                `${props.data.doc.preInvoice.dimentions.width}*${props.data.doc.preInvoice.dimentions.height}*${props.data.doc.preInvoice.dimentions.diameter}`
                                                :'وارد نشده'}
                                            </div>
                                        </div>
                                    </Col>
                            </Row>
                       
                            <div>
                                {props.data.doc.completeInvoice === undefined && props.data.doc.status !== 2?
                                    <div>
                                        {decoded.access.includes('inv') || decoded.access.includes('sa')?
                                            <div>
                                                <div className={Style.secTitle}>فاکتور</div>
                                                    <Row>
                                                        <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                            <MuiInput  onChange={(e)=>{setFactoryPrice(e.target.value)}} name='قیمت درب کارخانه' type='normal' width='100%'></MuiInput>
                                                        </Col>
                                                        <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                            <label style={{marginBottom:'5px' , fontSize:'13px'}}>تاریخ فاکتور</label>
                                                            <Datep  value={invoiceDate} onChange={(e)=>{setInvoiceDate(e)}}></Datep>                            
                                                        </Col>
                                                    </Row>
                                                    <Row style={{ marginTop:'8px'}}>
                                                        <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                            <MuiInput onChange={(e)=>{setCostFob(e.target.value)}} name='(fob)هزینه' type='normal' width='100%'></MuiInput>
                                                        </Col>
                                                        <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                            <MuiInput onChange={(e)=>{setCostCnf(e.target.value)}} name='(cnf)هزینه' type='normal' width='100%'></MuiInput>
                                                        </Col>
                                                    </Row>
                                                    <Row style={{ marginTop:'8px'}}>
                                                        <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                            <MuiInput onChange={(e)=>{setStoneRate(e.target.value)}} name='درجه کیفی محصول' type='normal' width='100%'></MuiInput>
                                                        </Col>
                                                        <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                            <MuiInput onChange={(e)=>{setStoneThickness(e.target.value)}} name='قطر محصول - سایز' type='normal' width='100%'></MuiInput>
                                                        </Col>
                                                    </Row> 
                                                    <Row style={{ marginTop:'8px'}}>
                                                        <Col style={{padding:'0px 5px 0px 5px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                            <label style={{marginBottom:'5px' , fontSize:'13px'}}>تاریخ آماده شدن محصول برای بارگیری</label>
                                                            <Datep value={dateOfShipment} onChange={(e)=>{setDateOfShipment(e)}}></Datep>    
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                            <div className={Style.btnDiv}>
                                                                <Button className={Style.btn} onClick={completeTheInvoice}  sx={{backgroundColor:'rgb(0, 0, 0)' , width:'80px' , fontSize:'15px' , color:'#fff'}} variant="contained">{loading === true ? <CircularProgress size='26px' color='inherit'></CircularProgress>:'ذخیره'}</Button>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            :null}
                                        </div>
                                    :props.data.doc.completeInvoice !== undefined && props.data.doc.status === 2?
                                    
                                    <div style={{marginTop:'8px'}}>
                                        <Row>
                                            <Col  style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                <div className={Style.ovDiv}>
                                                    <div className={Style.name}> 
                                                        <FactoryIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></FactoryIcon>
                                                        <span>
                                                            قیمت درب کارخانه    
                                                        </span>
                                                    </div>
                                                    <div className={Style.context}>
                                                        {props.data.doc.completeInvoice.factoryPrice}
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                <div className={Style.ovDiv}>
                                                    <div className={Style.name}>      
                                                        <DateRangeIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></DateRangeIcon>
                                                        <span>
                                                            تاریخ فاکتور
                                                        </span>
                                                    </div>
                                                    <div className={Style.context}>
                                                        {moment(props.data.doc.completeInvoice.invoiceDate).locale('fa').format('YYYY/MM/DD') }
                                                    </div>
                                                </div>
                                        
                                            </Col>
                                        </Row>
                                        <Row  style={{marginTop:'8px'}}>
                                            <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                <div className={Style.ovDiv}>
                                                    <div className={Style.name}>      
                                                        <AttachMoneyIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></AttachMoneyIcon>
                                                        <span>
                                                            هزینه(fob)
                                                        </span>
                                                    </div>
                                                    <div className={Style.context}>
                                                        {props.data.doc.completeInvoice.costFob}
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                <div className={Style.ovDiv}>
                                                    <div className={Style.name}>      
                                                        <AttachMoneyIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></AttachMoneyIcon>
                                                        <span>
                                                            هزینه(cnf)
                                                        </span>
                                                    </div>
                                                    <div className={Style.context}>
                                                        {props.data.doc.completeInvoice.costCnf}
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row style={{marginTop:'8px'}}>
                                            <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                <div className={Style.ovDiv}>
                                                    <div className={Style.name}>      
                                                        <GradeIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></GradeIcon>
                                                        <span>
                                                            درجه کیفی محصول
                                                        </span>
                                                    </div>
                                                    <div className={Style.context}>
                                                        {props.data.doc.completeInvoice.stoneRate}
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'0px 5px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                <div className={Style.ovDiv}>
                                                    <div className={Style.name}>      
                                                        <LineWeightIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></LineWeightIcon>
                                                        <span>
                                                            قطر محصول-سایز
                                                        </span>
                                                    </div>
                                                    <div className={Style.context}>
                                                        {props.data.doc.completeInvoice.stoneThickness}
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row style={{marginTop:'8px' , display:'flex' , justifyContent:'center'}}>

                                            <Col style={{padding:'0px 5px 0px 5px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                <div className={Style.ovDiv}>
                                                    <div className={Style.name}>      
                                                        <DateRangeIcon className={Style.icon} sx={{fontSize:'26px' , marginBottom:'0px' , marginLeft:'3px'}}></DateRangeIcon>
                                                        <span>
                                                           تاریخ آماده شدن محصول برای بارگیری
                                                        </span>
                                                    </div>
                                                    <div className={Style.context}>
                                                        {moment(props.data.doc.completeInvoice.dateOfShipment).locale('fa').format('YYYY/MM/DD') }
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                :null}
                            </div> 
                    </div>
            </div>
        </Fragment>
    )
}
}

const ShowFullPost = (props)=>{

    return(
      <Fragment>
          {ReactDom.createPortal(
              <ShowFullPostPortal setContectRefresh={props.setContectRefresh}  data={props.data} setShowPost={props.setShowPost} setPostOpen={props.setPostOpen} showPost={props.showPost} setSuccessToast={props.setSuccessToast} ></ShowFullPostPortal>
          ,
            document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}


export default ShowFullPost;