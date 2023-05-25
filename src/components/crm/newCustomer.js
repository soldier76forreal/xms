//css
import Style from './newCustomer.module.scss';
//hooks
import { Fragment  , React , useState , useContext} from 'react';
//frameworks
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
//imports
import NormalTopFilterSection from '../../tools/crm/normalTopFilterSection';
import CustomerTable from '../../tools/crm/customerTable';
import BigOneWithDot from '../../tools/titles/bigOneWithDot';
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
import { ArrowBackIos } from '@mui/icons-material';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'    
import jwtDecode from 'jwt-decode';
import AuthContext from '../authAndConnections/auth';
import WhatsApp from '../../assets/whatsapp.png';
import WhatsAppBW from '../../assets/whatsappB&W.png';
import DateMenu from './dateMenu';
import MiladiDatePicker from '../../tools/inputs/datePickerMiladi';
import HejriDatePicker from '../../tools/inputs/datePickerHejri';
import { CircularProgress, Divider } from '@mui/material';

const NewCustomerPortal = (props) =>{
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
    const [explanations , setExplanations] = useState(null);
    const [customerOrigin , setCustomerOrigin] = useState(null);
    const [dateOfBrith , setDateOfBrith] = useState(null);
    const [customerFavoriteProducts , setCustomerFavoriteProducts] = useState([]);
    const [calenderType , setCalenderType] = useState('shamsi');
    const [loading , setLoading] = useState(false);
    //phone numbers information states

    const [phoneNumbers , setPhoneNumbers] = useState([{ countryCode:'' , number:'' , whatsApp:true}]);

    //emails information states
    const [emails , setEmails] = useState([{email:''}]);

    //address information states
    const [addresses  , setAddresses] = useState([]);




    //numbers phone call onChange


    const getCountryCode = (e , j) =>{
        var tempAr = [...phoneNumbers];
        tempAr[j.name].countryCode = e.phone;
        setPhoneNumbers([...tempAr]);
        
    }

    const getPhoneNumber = (e) =>{
        var tempAr = [...phoneNumbers];
        tempAr[e.target.name].number = e.target.value;
        setPhoneNumbers([...tempAr]);
       
    }



    //email onChange 
    const getEmail = (e) =>{
        var tempAr = [...emails];
        tempAr[e.target.name].email = e.target.value;
        setEmails([...tempAr]);
        
    }



    //address onChange
    const getAddressCountry = (e , j) =>{
        var tempAr = [...addresses];
        tempAr[j.name].country = e.code;
        setAddresses([...tempAr]);
       
    }


    const getProvince = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].province = e.target.value;
        setAddresses([...tempAr]);
        
    }

    
    const getCity = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].city = e.target.value;
        setAddresses([...tempAr]);
       
    }

    const getNeighbourhood = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].neighbourhood = e.target.value;
        setAddresses([...tempAr]);
        
    }
    const getStreet = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].street = e.target.value;
        setAddresses([...tempAr]);
        
    }
    const getPlate = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].plate = e.target.value;
        setAddresses([...tempAr]);
        
    }
    const getPostalCode = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].postalCode = e.target.value;
        setAddresses([...tempAr]);
        
    }
    const getMapLink = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].mapLink = e.target.value;
        setAddresses([...tempAr]);
        
    }
    const getAddressExplanations = (e) =>{
        var tempAr = [...addresses];
        tempAr[e.target.name].addressExplanations = e.target.value;
        setAddresses([...tempAr]);
        
    }


    const saveData = async() =>{
        setLoading(true)
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
            address: addresses,
            generatedBy:decoded.id,
            explanations:explanations
        }
     
        if(firstName === '' || lastName === '' || phoneNumbers[0].number ==='' || phoneNumbers[0].countryCode ===''){
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'برای اضافه کردن مشتری جدید، باید حداقل نام و نام خانوادگی شماره تماس را وارد کنید',
              })
              setLoading(false)
        }else{
            try{
                const response = await authCtx.jwtInst({
                    method:"post",
                    data:dataToSend,
                    url:`${axiosCtx.defaultTargetApi}/crm/getTheBlogForMain`,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                props.setRefresh(Math.random())
                setTimeout(()=>{
                    const dataRes = response.data;
                    props.setSuccessToast({status:true , msg:'مشتری جدید ایجاد شد'});
                    props.setNewCustomer(false)
                    setLoading(false)
                    
                    const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'مشتری جدید ایجاد شد'})}, 3000);
                }, 800)
                }catch(err){
                    setLoading(false)
                    console.log(err);
            } 
        }      
    }
    return(
        <Fragment>
            <div style={props.newCustomer === true?{display:'block'}:{display:'none'}}  className={props.newCustomer === true? `${Style.newInvoice} ${Style.fadeIn}` : props.newCustomer === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                <div className={Style.topSection}>
                    <div onClick={()=>{props.setNewCustomer(false);}} className={Style.backBtn}><ArrowBackIos className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIos></div>
                    <div className={Style.topTitle}>مشتری جدید</div>
                </div>
                <div className={Style.ovDiv}  dir='rtl'  style={{maxWidth:'700px' , overflowY:'scroll' , height:'95vh' , padding:"0px 15px 60px 15px"}}>
                    <div className={Style.titlePaddign}>
                        <BigOneWithDot text="مشخصات فردی"></BigOneWithDot>
                    </div>
                    <div className={Style.personalInformationFirstOne}>
                        <Row className="g-0">
                            <Col style={{padding:'10px 5px 0px 5px' , zIndex:'1000'} } sm={12} md={12} lg={12} xl={6} xxl={6} xs={6}>
                                <CustomSelect onChange={(e)=>{setPersonCountry(e.code)}} selectType='countryWithFlag' placeholder="کشور"></CustomSelect>
                            </Col>
                            {/* <Col style={{padding:'10px 5px 0px 5px' , zIndex:'2000'}} sm={12} md={12} lg={2} xl={2} xxl={2} xs={6}>
                                <CustomSelect   onChange={(e)=>{setPersonTitle(e.id)}} selectType='personTitle' placeholder="عنوان"></CustomSelect>
                            </Col> */}
                            <Col style={{padding:'10px 5px 0px 5px' , zIndex:'1999'}} sm={12} md={12} lg={12} xl={6} xxl={6} xs={6} >
                                <div>
                                    <CustomSelect   onChange={(e)=>{setCustomerOrigin(e.id)}}  selectType='customerOrigin' placeholder="جذب شده از طریق"></CustomSelect>
                                </div>
                            </Col>
                            <Col style={{padding:'10px 5px 0px 5px'}} sm={12} md={12} lg={12} xl={6} xxl={6} xs={6}>
                                <TextInputNormal onChange={(e)=>{setFirstName(e.target.value)}}  placeholder="نام"></TextInputNormal>
                            </Col>
                            <Col style={{padding:'10px 5px 0px 5px'}} sm={12} md={12} lg={12} xl={6} xxl={6} xs={6} >
                                <TextInputNormal onChange={(e)=>{setLastName(e.target.value)}} placeholder="نام خانوادگی"></TextInputNormal>
                            </Col>
                        </Row>
                        <Row className="g-0" style={{padding:'0px 0px 5px 0px'}}>

                            {/* <Col dir='rtl' style={{padding:'4px 5px 0px 5px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <div style={{display:'flex' , alignItems:'center' , padding:'10px 5px 2px 5px'}}>
                                    <label style={{marginBottom:'5px' , fontSize:'13px'}}>تاریخ تولد</label>
                                    <div style={{margin:'0px auto 0px 0px' , display:'flex'}}>
                                        <div onClick={()=>{setCalenderType('shamsi')}} style={calenderType==='shamsi'?{padding:'2px 12px 2px 12px' , borderRadius:'5px' , backgroundColor:'rgb(209, 209, 209)' , fontSize:'13px' , cursor:'pointer'}:{padding:'0px 12px 0px 12px' , fontSize:'13px' , cursor:'pointer'}}>شمسی</div>
                                        <div onClick={()=>{setCalenderType('miladi')}} style={calenderType==='miladi'?{padding:'2px 12px 2px 12px' , borderRadius:'5px', backgroundColor:'rgb(209, 209, 209)' , fontSize:'13px' , cursor:'pointer'}:{padding:'0px 12px 0px 12px' , fontSize:'13px' , cursor:'pointer'}}>میلادی</div>
                                    </div>
                                </div>
                                {calenderType === 'shamsi'?
                                    <Datep value={dateOfBrith} onChange={(e)=>{setDateOfBrith(e)}}></Datep>    
                                :calenderType === 'miladi'?
                                    <MiladiDatePicker value={dateOfBrith} onChange={(e)=>{setDateOfBrith(e)}}></MiladiDatePicker>                               
                                :null}
                            </Col> */}
                            {/* <Col style={{padding:'10px 5px 0px 5px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <MultiSelect disable={true} placeholder='محصولات مورد علاقه'></MultiSelect>
                            </Col> */}
                        </Row>
                    </div>
                    <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                    <div>
                        <div className={Style.titlePaddignSecond}>
                            <BigOneWithDot text="اطلاعات تماس"></BigOneWithDot>
                        </div>

                        <Row className="g-0" dir='rtl' style={{padding:'2px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal text='شماره تماس'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                            </div>

                            <Col sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <IconBotton  onClick={()=>{var a = [...phoneNumbers]; a.push({ countryCode:'' , number:'' , whatsApp:false}); setPhoneNumbers([...a])}} color='black' name='شماره تماس جدید' text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                            {phoneNumbers.map((data , i)=>{
                                return(
                                    <Row key={i} className="g-0" dir='rtl' style={{padding:'5px 0px 5px 0px' , marginTop:'5px'}}>
                                        <Col style={{padding:'10px 0px 0px 0px'}} xs={12} sm={12} md={12} lg={7} xl={7} xxl={7} >
                                            <div className={Style.phoneNumberMainDiv}>
                                                <div>
                                                    {data.whatsApp === true?
                                                        <img onClick={()=>{var temp = [...phoneNumbers]; temp[i].whatsApp = false; setPhoneNumbers([...temp])}} style={{width:'40px' , height:'40px' , objectFit:'cover', marginLeft:'5px'}} src={WhatsApp}></img>
                                                    :data.whatsApp === false?
                                                        <img onClick={()=>{var temp = [...phoneNumbers]; temp[i].whatsApp = true; setPhoneNumbers([...temp])}} style={{width:'40px' , height:'40px' , objectFit:'cover', marginLeft:'5px'}} src={WhatsAppBW}></img>
                                                    :null}
                                                </div>
                                                <div style={{padding:'4px 10px 0px 10px'}} className={Style.dot}>{i+1}</div>
                                                    <IconBotton onClick={()=>{var temp = [...phoneNumbers]; temp.splice(i,1); setPhoneNumbers([...temp]) }}  text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                                <div className={Style.phoneNumberCountry}>
                                                    <CustomSelect name={i} onChange={getCountryCode} selectType='countryWithFlagAndCountryCode' placeholder="کد کشور"></CustomSelect>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col  style={{padding:'10px 0px 0px 0px'}} xs={12} sm={12} md={12} lg={5} xl={5} xxl={5} >
                                            <TextInputNormal name={i} onChange={getPhoneNumber} placeholder="شماره تماس"></TextInputNormal>
                                        </Col>
                                    </Row>
                                )
                            })}
                    </div>

                    <div> 
                        <Row className="g-0" dir='rtl' style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal  text='ایمیل'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                            </div>
                            <Col style={{marginBottom:'5px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <IconBotton onClick={()=>{var a = [...emails]; a.push({email:''}); setEmails([...a])}} color='black' name='ایمیل جدید'  text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        {emails.map((data , i)=>{
                            return(
                                <Col style={{padding:'5px  0px 5px 0px'}} key={i} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <div className={Style.phoneNumberMainDiv}>
                                        <div className={Style.dot}>{i+1}</div>
                                            <IconBotton onClick={()=>{var temp = [...emails]; temp.splice(i,1); setEmails([...temp]) }} text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                        <div className={Style.phoneNumberCountry}>
                                            <TextInputNormal name={i} onChange={getEmail} placeholder='ایمیل'></TextInputNormal>
                                        </div>
                                    </div>
                                </Col>
                            )
                        })}
                    </div>
                    <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>

                    <div>
                        <BigOneWithDot text="آدرس"></BigOneWithDot>
                        <Row className="g-0" dir='rtl' style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal text='آدرس ها'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                            </div>
                            <Col style={{marginBottom:'10px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <IconBotton  onClick={()=>{var a = [...addresses]; a.push({country:'' , province:'' , city:'' , neighbourhood:'' , street:'' , plate:'' , postalCode:'' , mapLink:'' , addressExplanations:''}); setAddresses([...a])}} color='black' name='آدرس جدید' text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        
                        {addresses.map((data , i)=>{
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
                                            <Col style={{padding:'0px 0px 10px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div className={Style.phoneNumberMainDiv}>
                                                    <div className={Style.phoneNumberCountry}>
                                                        <CustomSelect onChange={getAddressCountry} name={i} selectType='countryWithFlag' placeholder="کشور"></CustomSelect>
                                                    </div>
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getProvince} name={i} placeholder='استان'></TextInputNormal>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'0px 0px 10px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div className={Style.phoneNumberMainDiv}>                 
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getCity} name={i} placeholder='شهر'></TextInputNormal>
                                                    </div>
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getNeighbourhood} name={i} placeholder='منطقه(محله)'></TextInputNormal>
                                                    </div>

                                                </div>

                                            </Col>
                                            <Col style={{padding:'0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getStreet} name={i} placeholder='خیابان'></TextInputNormal>
                                                    </div>
                                            </Col>
                                        </Row>
                                        <Row className="g-0" dir='rtl' style={{padding:'5px 0px 5px 0px'}}>
                                            <Col style={{padding:'0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div className={Style.phoneNumberMainDiv}>                 
                                                    <div style={{maxWidth:'50%'}} className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getPlate} name={i} placeholder='پلاک'></TextInputNormal>
                                                    </div>
                                                    <div style={{maxWidth:'50%'}} className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getPostalCode} name={i} placeholder='کد پستی'></TextInputNormal>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'10px 0px 10px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div style={{maxWidth:'100%'}} className={Style.phoneNumberCountry}>
                                                    <TextInputNormal onChange={getMapLink} name={i} placeholder='لینک نقشه'></TextInputNormal>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div className={Style.phoneNumberMainDiv}>                 

                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getAddressExplanations} name={i} placeholder='توضیحات'></TextInputNormal>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'5px 0px 0px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div className={Style.addressDeleteBtnWithIcon} >
                                                    <IconBotton onClick={()=>{var temp = [...addresses]; temp.splice(i,1); setAddresses([...temp]) }} text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                                </div>
                                            </Col>
                                        </Row>


                                    </Col>
                                </Row>
                            )
                            
                        })}
                    </div>
                    <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>

                    <div>
                        <Row className="g-0" dir='rtl' style={{padding:'5px 0px 5px 0px'}}>
                            <Col style={{padding:'5px 0px 0px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                <div dir='rtl'>

                                <LittleOneNormal text='توضیحات مختصر'></LittleOneNormal>
                                      
                                    <textarea onChange={(e)=>{setExplanations(e.target.value)}} id="w3review" name="w3review" rows="5" style={{width:'100%'}} cols="50"></textarea>                                            
                                </div>   
                            </Col>
                        </Row>
                    </div>
                    <div>
                        <Row className="g-0" style={{padding:'0px'}}>
                            <Col style={{padding:'0px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <div style={{width:'100%'}}>
                                    <button disabled={loading} onClick={saveData} className={Style.NormalBtn}>{loading === true ?<CircularProgress size='30px' color='inherit'></CircularProgress> :'ذخیره'}</button>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}


const NewCustomer = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <NewCustomerPortal setRefresh={props.setRefresh} setSuccessToast={props.setSuccessToast} newCustomer={props.newCustomer} setNewCustomer={props.setNewCustomer}></NewCustomerPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}


export default NewCustomer;