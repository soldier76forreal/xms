//css
import Style from './showCustomer.module.scss';
//hooks
import { Fragment , useEffect , React , useState , useContext} from 'react';
//frameworks
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
//imports
import NormalTopFilterSection from '../../tools/crm/normalTopFilterSection';
import CustomerTable from '../../tools/crm/customerTable';
import BigOneWithDot from '../../tools/titles/bigOneWithDot';
import CallMissedOutgoingIcon from '@mui/icons-material/CallMissedOutgoing';
import TextInputNormal from '../../tools/inputs/textInputNormal';
import CustomSelect from '../../tools/inputs/customSelect';
import IconBotton from '../../tools/buttons/iconBtn';
import MultiSelect from '../../tools/inputs/multiSelect';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LittleOneNormal from '../../tools/titles/littleOneNormal';
import NormalBtn from '../../tools/buttons/normalBtn';
import Datep from '../../tools/inputs/datePicker';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import axios from 'axios';
import ReactDom from 'react-dom';
import { useHistory } from 'react-router-dom';
import { ArrowBackIos, Call } from '@mui/icons-material';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'    
import jwtDecode from 'jwt-decode';
import AuthContext from '../authAndConnections/auth';
import WhatsApp from '../../assets/whatsapp.png';
import WhatsAppBW from '../../assets/whatsappB&W.png';
import DateMenu from './dateMenu';
import MiladiDatePicker from '../../tools/inputs/datePickerMiladi';
import prFlag from '../../assets/per.png';
import moment from 'jalali-moment';
import HejriDatePicker from '../../tools/inputs/datePickerHejri';
import { Avatar, Grid } from '@mui/material';
import CountriesInFarsi from '../functions/listOfCountryesInFarsi';
import PrTitle from '../functions/prTItle';
import DateType from '../functions/dateType';
import CustomerOrigin from '../functions/customerOrigin';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import Flag from 'react-country-flag';
import NavigationIcon from '@mui/icons-material/Navigation';
import ToggleBtn from '../../tools/buttons/toggleBtn';
import Accordion from '@mui/material/Accordion';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NoData from '../../tools/navs/noData';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CallMadeIcon from '@mui/icons-material/CallMade';
import FeedIcon from '@mui/icons-material/Feed';
import CallIcon from '@mui/icons-material/Call';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
const ShowCustomerPortal = (props) =>{
    //hooks
    const axiosCtx = useContext(AxiosGlobal);
    const authCtx = useContext(AuthContext);
    const history = useHistory();
    var decoded = jwtDecode(authCtx.token);
    const MySwal = withReactContent(Swal)
    //personal information states
    const [firstName , setFirstName] = useState(null);
    const [lastName , setLastName] = useState(null);
    const [personCountry , setPersonCountry] = useState(null);
    const [personTitle , setPersonTitle] = useState(null);
    const [customerType , setCustomerType] = useState(null);
    const [customerOrigin , setCustomerOrigin] = useState(null);
    const [dateOfBrith , setDateOfBrith] = useState(null);
    const [listType , setListType] = useState('prInformation');
    const [value , setValue] = useState(0);
    const [calls , setCalls] = useState([]);

    const [customerFavoriteProducts , setCustomerFavoriteProducts] = useState([]);
    const [calenderType , setCalenderType] = useState('');

    //phone numbers information states

    const [phoneNumbers , setPhoneNumbers] = useState([{title:'' , countryCode:'' , number:'' , whatsApp:true}]);

    //emails information states
    const [emails , setEmails] = useState([{email:''}]);

    //address information states
    const [addresses  , setAddresses] = useState([{country:'' , province:'' , city:'' , neighbourhood:'' , street:'' , plate:'' , postalCode:'' , mapLink:'' , addressExplanations:''}]);
    const callType =[ {value:'sales' , pr:'فروش'} ,  {value:'requestFollowUp' , pr:'پی گیری درخواست'} ,  {value:'invoiceFollowUp' , pr:'پی گیری فاکتور'} , {value:'customerSatisfaction' , pr:'رضایت مشتری'}]


    useEffect(() => {
        if(props.showCustomer.status === true){
           var result = props.persons.filter(e=>{if(e !==undefined){return JSON.stringify(e.customer._id) === JSON.stringify(props.showCustomer.id)}});
                if(result[0].customer.personalInformation.firstName !==null){
                    setFirstName(result[0].customer.personalInformation.firstName)
                }
                if(result[0].customer.personalInformation.lastName !==null){
                    setLastName(result[0].customer.personalInformation.lastName)
                }
                if(result[0].customer.personalInformation.country !==null){
                    setPersonCountry(result[0].customer.personalInformation.country)
                }
                if(result[0].customer.personalInformation.personTitle !==null){
                    setPersonTitle(result[0].customer.personalInformation.personTitle)
                }
                if(result[0].customer.personalInformation.customerType !==null){
                    setCustomerType(result[0].customer.personalInformation.customerType)
                }
                if(result[0].customer.personalInformation.attractedBy !==null){
                    setCustomerOrigin(result[0].customer.personalInformation.attractedBy)
                }
                if(result[0].customer.personalInformation.dateOfBirth !==null){
                    setDateOfBrith(result[0].customer.personalInformation.dateOfBirth.date)
                }
                if(result[0].customer.personalInformation.dateOfBirth !==null){
                    setCalenderType(result[0].customer.personalInformation.dateOfBirth.dateType)

                }

                setPhoneNumbers([...result[0].customer.contactInfo.phoneNumbers])
                
                if(result[0].customer.address !==null){
                    setAddresses([...result[0].customer.address])
                    console.log(result[0].customer.address)
                }else if(result[0].customer.address ===null){
                    setAddresses(null)
                    console.log(result[0].customer.address)
                }
                if(result[0].customer.contactInfo.emails !==null){
                    setEmails([...result[0].customer.contactInfo.emails])
                }else if(result[0].customer.contactInfo.emails ===null){
                    setEmails(null)
                }
                

                if(result[0].customer.phoneCalls.length !==0){
                    setCalls([...result[0].customer.phoneCalls])
                }
                
        }
    }, [props.showCustomer])
    


    //numbers phone call onChange
    const getPrTitle = (e , j) =>{
        var tempAr = [...phoneNumbers];
        tempAr[j.name].title = e.id;
        setPhoneNumbers([...tempAr]);
        console.log(phoneNumbers)
    }

    const getCountryCode = (e , j) =>{
        var tempAr = [...phoneNumbers];
        tempAr[j.name].countryCode = e.phone;
        setPhoneNumbers([...tempAr]);
        console.log(phoneNumbers)
    }

    const getPhoneNumber = (e) =>{
        var tempAr = [...phoneNumbers];
        tempAr[e.target.name].number = e.target.value;
        setPhoneNumbers([...tempAr]);
        console.log(phoneNumbers)
    }



    //email onChange 
    const getEmail = (e) =>{
        var tempAr = [...emails];
        tempAr[e.target.name].email = e.target.value;
        setEmails([...tempAr]);
        console.log(emails)
    }



    //address onChange
    const getAddressCountry = (e , j) =>{
        var tempAr = [...addresses];
        tempAr[j.name].country = e.code;
        setAddresses([...tempAr]);
        console.log(addresses)
    }


    const getProvince = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].province = e.target.value;
        setAddresses([...tempAr]);
        console.log(addresses)
    }

    
    const getCity = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].city = e.target.value;
        setAddresses([...tempAr]);
        console.log(addresses)
    }

    const getNeighbourhood = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].neighbourhood = e.target.value;
        setAddresses([...tempAr]);
        console.log(addresses)
    }
    const getStreet = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].street = e.target.value;
        setAddresses([...tempAr]);
        console.log(addresses)
    }
    const getPlate = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].plate = e.target.value;
        setAddresses([...tempAr]);
        console.log(addresses)
    }
    const getPostalCode = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].postalCode = e.target.value;
        setAddresses([...tempAr]);
        console.log(addresses)
    }
    const getMapLink = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].mapLink = e.target.value;
        setAddresses([...tempAr]);
        console.log(addresses)
    }
    const getAddressExplanations = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].addressExplanations = e.target.value;
        setAddresses([...tempAr]);
        console.log(addresses)
    }


    const saveData = async() =>{
        const dataToSend = {
            personalInformation:{
                firstName : firstName,
                lastName : lastName,
                country:personCountry,
                personTitle:personTitle,
                customerType : customerType,
                customerOrigin:customerOrigin,
                dateOfBrith:dateOfBrith,
                calenderType:calenderType
            },
            phoneNumberInformation : phoneNumbers,
            email:emails[0].email === '' ? null : emails,
            address:addresses[0].country === '' ? null : addresses,
            generatedBy:decoded.id
        }
        
        if(firstName === '' || lastName === '' || phoneNumbers[0].number ==='' || phoneNumbers[0].countryCode ==='' || phoneNumbers[0].title ===''){
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'برای اضافه کردن مشتری جدید، باید حداقل نام و نام خانوادگی شماره تماس را وارد کنید',
              })
        }else{
            try{
                const response = await axios({
                    method:"post",
                    data:dataToSend,
                    url:`${axiosCtx.defaultTargetApi}/crm/getTheBlogForMain`,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                const dataRes = response.data;
                props.setSuccessToast({status:true , msg:'مشتری جدید ایجاد شد'});
                const closingNewPreInvoice = setTimeout(()=>{props.setNewCustomer(false)}, 500);
                const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'مشتری جدید ایجاد شد'})}, 3000);
            }catch(err){
                console.log(err);
            } 
        }      
    }


    const handleChange = (event, newValue) => {
        setValue(newValue);
        if(newValue === 0){
            setListType('prInformation')
        }else if(newValue === 1){
            setListType('prCalls')
        }else if(newValue === 2){
            setListType('prRequests')
        }
      };

    return(
        <Fragment>
            
            <div style={props.showCustomer.status === true?{display:'block'}:{display:'none'}}  className={props.showCustomer.status === true? `${Style.newInvoice} ${Style.fadeIn}` : props.showCustomer.status === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                <div className={Style.topSection}>
                    <div onClick={()=>{props.setShowCustomer({status:false , id:''});}} className={Style.backBtn}><ArrowBackIos className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIos></div>
                    <div className={Style.topTitle}>مشخصات و فعالیت ها</div>
                </div>
                <div className={Style.ovDiv}  dir='rtl'  style={{maxWidth:'700px' , overflowx:'none' , overflowY:'scroll' , height:'95vh' , position:'relative' , padding:"0px 0px 100px 0px"}}>
                    <div style={{padding:'0px 25px 0px 25px'}}>      
                        {listType === 'prInformation' ?
                            <div>
                                <div className={Style.titlePaddign}>
                                    <div style={{textAlign:'right' , width:'50%'}}>
                                        <BigOneWithDot text="مشخصات فردی"></BigOneWithDot>
                                    </div>
                                    <div style={{textAlign:'left' , width:'50%' , display:'felex', alignContent:'center'}}><Button style={{color:'rgb(162, 162, 162)'}} variant="outlined" >ویرایش</Button></div>
                                </div>
                                <div className={Style.personalInformationFirstOne}>
                                    <Row className="g-0">
                                            <Col style={{padding:'10px 5px 0px 5px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                                <div style={{display:'flex', alignItems:'center'}}>
                                                    <Grid style={{display:'flex'}} container spacing={0}>
                                                        <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                            {personCountry !== null?
                                                                <Fragment>
                                                                    <div style={{width:'40px' , borderRadius:'100px' , height:'40px'}}>
                                                                            <Flag countryCode={personCountry} style={{height:'100%'  , borderRadius:'100px' , width:'100%', position:'center', objectFit:"cover"}} svg/>
                                                                    </div>
                                                                </Fragment>
                                                            :null}
                                                        </Grid>
                                                        <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                            {personTitle !== null?
                                                                <span style={{marginRight:'8px'}}>{PrTitle(personTitle)}</span>
                                                            :null}
                                                        </Grid>
                                                        <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                            <span style={{padding:'8px 10px 8px 10px' , borderRadius:'8px' , marginRight:'10px' , backgroundColor:'white'}}>{firstName} {lastName}</span>
                                                        </Grid>
                                                        <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                            {personCountry !== null?
                                                                <Fragment>
                                                                    <span style={{padding:'8px 10px 8px 10px' , borderRadius:'8px' }}>
                                                                        <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>از </span>
                                                                        <span>{CountriesInFarsi(personCountry)}</span>
                                                                    </span>
                                                                </Fragment>
                                                            :null}
                                                        </Grid>
                                                    </Grid>
                                                </div>
                                            </Col>
                                     
                                        <Col style={{padding:'10px 5px 0px 5px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                            <div style={{display:'flex', backgroundColor:'#EFEFEF', borderRadius:'100px' , alignItems:'center'}}>
                                                {/* {dateOfBrith !== undefined ?
                                                    <Fragment>
                                                        <span style={{padding:'8px 10px 8px 10px' , borderRadius:'8px'  , backgroundColor:'white'}}>
                                                            <span>{moment(dateOfBrith, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}</span>
                                                            <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>{DateType(calenderType)}</span>
                                                        </span>
                                                    </Fragment>
                                                :null} */}
                                                {customerOrigin !== null?
                                                    <Fragment>
                                                        <span style={{padding:'8px 10px 8px 10px' , borderRadius:'8px' }}>
                                                            <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>جذب شده از طریق </span>
                                                            <span>{CustomerOrigin(customerOrigin)}</span>
                                                        </span>
                                                    </Fragment>
                                                :null}
                                            </div>
                                        </Col>
                                    </Row>

                                </div>
                                <hr className={Style.dashLine}></hr>
                                <div>
                                    
                                    <div className={Style.titlePaddign}>
                                        <div style={{textAlign:'right' , width:'50%'}}>
                                            <BigOneWithDot text="اطلاعات تماس"></BigOneWithDot>
                                        </div>
                                        <div style={{textAlign:'left'  , width:'50%' , display:'felex', alignContent:'center'}}><Button style={{color:'rgb(162, 162, 162)'}} variant="outlined" >ویرایش</Button></div>
                                    </div>
                                    

                                    <Row className="g-0" dir='rtl' style={{padding:'2px 0px 0px 0px'}}>
                                        <div className={Style.littleTitleDiv}>
                                            <LittleOneNormal text='شماره تماس'></LittleOneNormal>
                                            <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                                        </div>
                                    </Row>
                                    <Row>
                                        <Col sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                            {phoneNumbers.map(e=>{
                                                return(
                                                    <div style={{ marginBottom:'10px', alignItems:'center'}}>
                                                        <Grid style={{display:'flex'}} container spacing={0}>
                                                            <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                                <span style={{marginLeft:'5px'}}>
                                                                    <a  href={`tel:${e.number}${e.countryCode}}`}>
                                                                        <IconBotton  backgroundColor='#0076FF' text={false} icon={<Call sx={{color:'#EFEFEF'}}/>}></IconBotton>
                                                                    </a>
                                                                </span>
                                                            </Grid>
                                                            <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                                {e.whatsApp === true ?
                                                                    <a href={`https://api.whatsapp.com/send?phone=${e.number}${e.countryCode}`}>
                                                                        <IconBotton backgroundColor='#13990a' text={false} icon={<WhatsAppIcon sx={{color:'#EFEFEF'}}/>}></IconBotton>
                                                                    </a>
                                                                :e.whatsApp === false ?
                                                                    <IconBotton disable={true} backgroundColor='rgb(115, 115, 115)' text={false} icon={<WhatsAppIcon sx={{color:'#EFEFEF'}}/>}></IconBotton>
                                                                :null}
                                                            </Grid>
                                                            <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                                {personTitle !== null?
                                                                    <span style={{marginRight:'8px'}}>{PrTitle(personTitle)}</span>
                                                                :null}
                                                            </Grid>
                                                            <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                                <span style={{padding:'9px 10px 9px 10px' , borderRadius:'8px' , textAlign:'right' , marginRight:'10px' , backgroundColor:'white'}}>{firstName} {lastName}</span>
                                                            </Grid>
                                                            <Grid  style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                                <span style={{ padding:'10px'}}>
                                                                    {e.countryCode}-{e.number}
                                                                </span>
                                                            </Grid>
                                                        </Grid>
                                                    </div>
                                                )
                                            })}
                                        </Col>
                                    </Row>
                                </div>
                                {emails !== null?
                                    <div> 
                                        <Row className="g-0" dir='rtl' style={{padding:'30px 0px 0px 0px'}}>
                                            <div className={Style.littleTitleDiv}>
                                                
                                                <LittleOneNormal  text='ایمیل'></LittleOneNormal>
                                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>

                                            </div>
                                        </Row>
                                        {emails.map((data , i)=>{
                                            return(
                                                <Col style={{padding:'0px  0px 5px 0px'}} key={i} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                                    <div style={{display:'flex', backgroundColor:'#EFEFEF', marginBottom:'5px',borderRadius:'100px' , alignItems:'center'}}>
                                                            <span style={{marginLeft:'5px'}}>
                                                                <a  href={`mailto:${data.email}`}>
                                                                    <IconBotton  backgroundColor='#00ACA0' text={false} icon={<AlternateEmailIcon sx={{color:'#EFEFEF'}}/>}></IconBotton>
                                                                </a>
                                                            </span>
                                                            <span style={{marginRight:'10px'}}>
                                                                {data.email}
                                                            </span>
                                                        </div>
                                                </Col>
                                            )
                                        })}
                                    </div>
                                :null}   
                                {addresses !== null?
                                    <div>
                                        <hr className={Style.dashLine}></hr>
                                        <div className={Style.titlePaddign}>
                                            <div style={{textAlign:'right' , width:'50%'}}>
                                                <BigOneWithDot text="آدرس"></BigOneWithDot>
                                            </div>
                                            <div style={{textAlign:'left' , width:'50%' , display:'felex', alignContent:'center'}}><Button style={{color:'rgb(162, 162, 162)'}} variant="outlined" >ویرایش</Button></div>
                                        </div>
                                        <Row className="g-0" dir='rtl' style={{padding:'30px 0px 0px 0px'}}>
                                            <div className={Style.littleTitleDiv}>
                                                <LittleOneNormal text='آدرس ها'></LittleOneNormal>
                                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                                            </div>
                                        </Row>
                                        
                                        { addresses.map((data , i)=>{
                                            return(
                                                <Row style={{marginTop:'30px'}} key={i} className="g-0">
                                                    <Col  xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
                                                        <div style={{width:'100%'}}>
                                                        </div>
                                                    </Col>
                                                    <Col style={{padding:'0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                        <Row style={{padding:'0px 0px 0px 0px'}}>
                                                            <Col  xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
                                                                <div style={{width:'100%' , fontSize:'12px' , borderRadius:'11px' , padding:'10px 0px 10px 0px' , marginBottom:'5px' , display:'flex' , justifyContent:'center' , color:'#fff' , backgroundColor:'rgb(60, 60, 60)'}}>
                                                                    آدرس {i+1}
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                        
                                                        <Row className="g-0" dir='rtl' style={{padding:'5px 0px 5px 0px'}}>
                                                            <Col style={{padding:'0px 0px 5px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                                <div  style={{display:'flex',   marginBottom:'5px', alignItems:'center'}}>
                                                                    <Grid style={{display:'flex'}} container spacing={0}>
                                                                        <Grid  style={{padding:'0px 0px 5px 0px' }} item xs="auto" >
                                                                            {data.mapLink === null?
                                                                                <a href={data.mapLink}>
                                                                                    <div style={{marginLeft:'8px'}}>
                                                                                        <IconBotton  backgroundColor='rgb(115, 115, 115)' text={false} icon={<NavigationIcon sx={{color:'#EFEFEF'}}/>}></IconBotton>
                                                                                    </div>
                                                                                </a>
                                                                            :data.mapLink !== null?
                                                                                <a href={data.mapLink}>
                                                                                    <div style={{marginLeft:'8px'}}>
                                                                                        <IconBotton  backgroundColor='#000' text={false} icon={<NavigationIcon sx={{color:'#EFEFEF'}}/>}></IconBotton>
                                                                                    </div>
                                                                                </a>
                                                                            :null}
                                                                        </Grid>
                                                                        <Grid style={{padding:'0px 0px 5px 0px'}} item xs="auto"  >
                                                                            {data.country !== null?
                                                                                <div style={{width:'40px' , borderRadius:'100px' , height:'40px'}}>
                                                                                    <Flag countryCode={data.country} style={{height:'100%'  , borderRadius:'100px' , width:'100%', position:'center', objectFit:"cover"}} svg/>
                                                                                </div>
                                                                            :null}
                                                                        </Grid>
                                                                        <Grid style={{padding:'0px 10px 5px 10px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >
                                                                            {data.country !== null?
                                                                                <span >{CountriesInFarsi(data.country)}</span>
                                                                            :null}
                                                                        </Grid>
                                                                        <Grid style={{padding:'0px 0px 5px 0px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >
                                                                            {data.province !== null?
                                                                                <span style={{padding:'9px 10px 9px 10px' , borderRadius:'8px' , textAlign:'right' , backgroundColor:'white'}}>
                                                                                    <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>استان:</span>
                                                                                    {data.province}
                                                                                </span>
                                                                            :null}
                                                                        </Grid>
                                                                        <Grid style={{padding:'0px 10px 5px 10px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >

                                                                            {data.city !== null?
                                                                                <span >
                                                                                    <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>شهر:</span>
                                                                                    {data.city}
                                                                                </span>
                                                                            :null}
                                                                        </Grid>


                                                                        <Grid style={{padding:'0px 0x 5px 0px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >
                                                                            {data.neighbourhood !== null?
                                                                                <span style={{padding:'9px 10px 9px 10px' , borderRadius:'8px' , textAlign:'right' , backgroundColor:'white'}}>
                                                                                    <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>منطقه(محله):</span>
                                                                                    {data.neighbourhood}
                                                                                </span>
                                                                            :null} 
                                                                        </Grid>
                                                                        <Grid style={{padding:'0px 0px 5px 0px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >

                                                                            {data.street !== null?
                                                                                <span style={{ display:'flex', alignItems:'center', justifyContent:'center' ,padding:'0px 10px 0px 0px'}}>
                                                                                    <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>خیابان:</span>
                                                                                    {data.street}
                                                                                </span>
                                                                            :null}
                                                                        </Grid>
                                                                        <Grid style={{padding:'0px 0px 5px 0px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >
                                                                            {data.plate !== null?
                                                                                <span style={{padding:'9px 10px 9px 10px' , borderRadius:'8px' , textAlign:'right' , marginRight:'10px' , backgroundColor:'white'}}>
                                                                                    <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>پلاک:</span>
                                                                                    {data.plate}
                                                                                </span>
                                                                            :null}
                                                                        </Grid>
                                                                        <Grid style={{padding:'0px 0px 5px 0px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >
                                                                            {data.postalCode !== null?
                                                                                <span style={{padding:'9px 10px 9px 10px'  , borderRadius:'8px' , textAlign:'right'  , backgroundColor:'white'}}>
                                                                                    <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>کد پستی:</span>
                                                                                    {data.postalCode}
                                                                                </span>
                                                                            :null}
                                                                        </Grid>
                                                                    </Grid>
                                                                </div>
                                                            </Col>

                                                        </Row>
                                                    </Col>
                                                </Row>
                                            )
                                        })}
                                    </div>
                                :null}
                            </div>
                        :listType === 'prCalls' ?
                        <div style={{marginTop:'20px'}}>
                                {calls.length === 0?
                                    <div style={{display:'flex' , justifyContent:'center' , alignItems:'center', minHeight:'75vh' }}>
                                        <NoData caption='تماسی برای نمایش وجود ندارد'></NoData>
                                    </div>
                                :calls.length !== 0?
                                    calls.map((e , i)=>{
                                        return(
                                            <div style={{marginBottom:'10px'}} key={i}>
                                                <Accordion>
                                                    <AccordionSummary
                                                    expandIcon={<ExpandMoreIcon />}
                                                    aria-controls="panel1a-content"
                                                    id="panel1a-header"
                                                    >
                                                    <Typography sx={{width:'100%'}}>
                                                        <div className={Style.callDropDownDiv}>
                                                            <div style={{float:'right' ,display:'flex' , justifyContent:'center' , margin:'0px 0px 0px auto' , textAlign:'right'}}>
                                                                <div style={{float:'right', margin:'0px 0px 0px 10px' , textAlign:'right'}}>
                                                                    {e.callStatus === true?
                                                                        <span className={Style.callStatus}><CallMadeIcon sx={{color:'#01E583'}}></CallMadeIcon><span className={Style.callStatusText}>پاسخ داده شد</span></span>
                                                                    :e.callStatus === false?   
                                                                        <span className={Style.callStatus}><CallMissedOutgoingIcon sx={{color:'red'}}></CallMissedOutgoingIcon><span className={Style.callStatusText}>پاسخ داده نشد</span></span>
                                                                    :null}
                                                                </div>
                                                                <div className={Style.callDropDownCallType}  >
                                                                <span>دلیل تماس:</span>{callType.filter(w=>{return w.value === e.callReason})[0].pr}
                                                                </div>
                                                            </div>
                                                            <div  style={{float:"left" , display:'flex' , marginLeft:'10px' }}>
                                                                
                                                                {e.countryCode}-{e.phoneNumber}
                                                            </div>
                                                        </div>
                                                    </Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails>
                                                    <Typography>

                                                    </Typography>
                                                    </AccordionDetails>
                                                </Accordion>
                                            </div>
                                        )
                                    })
                                :null}
                        </div>             
                        :listType === 'prRequests' ?
                            <div style={{marginTop:'20px'}}>
                                <div style={{display:'flex' , justifyContent:'center' , alignItems:'center', minHeight:'75vh' }}>
                                    <NoData caption='درخواستی برای نمایش وجود ندارد'></NoData>
                                </div>
                            </div> 
                        :null}
                    </div>
                    <div style={{margin:'0px auto 0px auto'}} className={Style.showCustomerNav}>
                        <Tabs onChange={handleChange}  value={value} aria-label="icon label tabs example">
                            <Tab  style={{width:'33%'}} icon={<ContactEmergencyIcon />} label="مشخصات" />
                            <Tab  style={{width:'33%'}} icon={<CallIcon />} label="تماس ها" />
                            <Tab  style={{width:'33%'}} icon={<FeedIcon />} label="درخواست ها" />
                        </Tabs> 
                    </div>  
                </div>
            </div>
        </Fragment>
    )
}


const ShowCustomer = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <ShowCustomerPortal persons={props.persons} showCustomer={props.showCustomer} setShowCustomer={props.setShowCustomer} setSuccessToast={props.setSuccessToast} ></ShowCustomerPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}


export default ShowCustomer;