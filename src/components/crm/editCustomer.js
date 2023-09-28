//css
import Style from './editCustomer.module.scss';
//hooks
import { Fragment  , React , useState , useContext, useEffect} from 'react';
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
import MiladiDatePicker from '../../tools/inputs/datePickerMiladi';
import { CircularProgress } from '@mui/material';
import Divider from '@mui/material/Divider';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';

const EditCustomerPortal = (props) =>{
    //hooks
    const axiosCtx = useContext(AxiosGlobal);
    const authCtx = useContext(AuthContext);
    const history = useHistory();
    var decoded = jwtDecode(authCtx.token);
    const MySwal = withReactContent(Swal)
    const dispatch = useDispatch()
    //personal information states
    const [firstName , setFirstName] = useState(null);
    const [lastName , setLastName] = useState(null);
    const [personCountry , setPersonCountry] = useState(null);
    const [personTitle , setPersonTitle] = useState(null);
    const [customerType , setCustomerType] = useState(null);
    const [customerOrigin , setCustomerOrigin] = useState(null);
    const [dateOfBrith , setDateOfBrith] = useState(null);
    const [customerFavoriteProducts , setCustomerFavoriteProducts] = useState([]);
    const [calenderType , setCalenderType] = useState('shamsi');
    const [loading , setLoading] = useState(false);
    





    //phone numbers information states

    const [phoneNumbers , setPhoneNumbers] = useState([]);

    //emails information states
    const [emails , setEmails] = useState([{email:''}]);

    //address information states
    const [addresses  , setAddresses] = useState([]);

    const [explanations , setExplanations] = useState(null);
    //instagrams information states
    const [instagrams , setInstagrams] = useState([{instagram:''}]);

    //websites information states
    const [websites , setWebsites] = useState([{website:''}]);

    //linkedIns information states
    const [linkedIns , setLinkedIns] = useState([{linkedIn:''}]);
    useEffect(() => {
        if(props.editCustomer.status === true){
           var result = props.editCustomer.theCustomer;
                if(result.personalInformation.firstName !==null){
                    setFirstName(result.personalInformation.firstName)
                }
                if(result.personalInformation.lastName !==null){
                    setLastName(result.personalInformation.lastName)
                }
                if(result.personalInformation.country !==null){
                    setPersonCountry(result.personalInformation.country)
                }
                if(result.personalInformation.personTitle !==null){
                    setPersonTitle(result.personalInformation.personTitle)
                }
                if(result.personalInformation.customerType !==null){
                    setCustomerType(result.personalInformation.customerType)
                }
                if(result.personalInformation.attractedBy !==null){
                    setCustomerOrigin(result.personalInformation.attractedBy)
                }
                if(result.personalInformation.dateOfBirth !==null){
                    setDateOfBrith(result.personalInformation.dateOfBirth.date)
                }
                if(result.personalInformation.dateOfBirth !==null){
                    setCalenderType(result.personalInformation.dateOfBirth.dateType)
                }
                if(result.explanations !==null){
                    setExplanations(result.explanations)
                }
                setPhoneNumbers([...result.contactInfo.phoneNumbers])
                
                if(result.address !==null){
                    setAddresses([...result.address])
                }else if(result.address ===null){
                    setAddresses([])
                }
                if(result.contactInfo.emails !==null){
                    setEmails([...result.contactInfo.emails])
                }else if(result.contactInfo.emails ===null){
                    setEmails([{email:''}])
                }
                
                if(result.contactInfo.instagrams !==null){
                    setInstagrams([...result.contactInfo.instagrams])
                }else if(result.contactInfo.instagrams ===null){
                    setInstagrams([{instagram:''}])
                }
                if(result.contactInfo.websites !==null){
                    setWebsites([...result.contactInfo.websites])
                }else if(result.contactInfo.websites ===null){
                    setWebsites([{website:''}])
                }
                if(result.contactInfo.linkedIns !==null){
                    setLinkedIns([...result.contactInfo.linkedIns])
                }else if(result.contactInfo.linkedIns ===null){
                    setLinkedIns([{linkedIn:''}])
                }

        }
    }, [props.editCustomer.status])
    

   
    //numbers phone call onChange
    const getCountryCode = (e , j) =>{

        const updatedItems = phoneNumbers.map((item,i) => {
        if (parseInt(j.name) === parseInt(i)) {
            return { ...item, countryCode: e.phone };
        }
        return item;
        });
        // Update the state with the new array
        setPhoneNumbers([...updatedItems]);
    }

    const getPhoneNumber = (e) =>{

        const updatedItems = phoneNumbers.map((item,i) => {
        if (parseInt(e.target.name) === parseInt(i)) {
            return { ...item, number: e.target.value };
        }
        return item;
        });
        // Update the state with the new array
        setPhoneNumbers([...updatedItems]);
        
       
    }



    //email onChange 
    const getEmail = (e) =>{
        const updatedItems = emails.map((item,i) => {
            if (parseInt(e.target.name) === parseInt(i)) {
                return { ...item, email: e.target.value };
            }
            return item;
        });
        // Update the state with the new array
        setEmails([...updatedItems]);
        
    }

    //instagram onChange 
    const getInstagram = (e) =>{
        const updatedItems = instagrams.map((item,i) => {
            if (parseInt(e.target.name) === parseInt(i)) {
                return { ...item, instagram: e.target.value };
            }
            return item;
        });
        // Update the state with the new array
        setInstagrams([...updatedItems]);
        
    }
    

    //website onChange 
    const getWebsite = (e) =>{
        const updatedItems = websites.map((item,i) => {
            if (parseInt(e.target.name) === parseInt(i)) {
                return { ...item, website: e.target.value };
            }
            return item;
        });
        // Update the state with the new array
        setWebsites([...updatedItems]);
        
    }
    
    //linkedIns onChange 
    const getLinkeIn = (e) =>{
        const updatedItems = linkedIns.map((item,i) => {
            if (parseInt(e.target.name) === parseInt(i)) {
                return { ...item, linkedIn: e.target.value };
            }
            return item;
        });
        // Update the state with the new array
        setLinkedIns([...updatedItems]);
        
    }

    //address onChange
    const getAddressCountry = (e , j) =>{
        const updatedItems = addresses.map((item,i) => {
        if(parseInt(j.name) === parseInt(i)) {
            return { ...item, country: e.code};
        }
            return item;
        });
        setAddresses([...updatedItems]);
    }


    const getProvince = (e) =>{
        const updatedItems = addresses.map((item,i) => {
        if(parseInt(e.target.name) === parseInt(i)) {
            return { ...item, province: e.target.value};
        }
            return item;
        });
        setAddresses([...updatedItems]);
    }

    
    const getCity = (e) =>{
        const updatedItems = addresses.map((item,i) => {
            if(parseInt(e.target.name) === parseInt(i)) {
                return { ...item, city: e.target.value};
            }
                return item;
        });
        setAddresses([...updatedItems]);
    }

    const getNeighbourhood = (e) =>{
        const updatedItems = addresses.map((item,i) => {
            if(parseInt(e.target.name) === parseInt(i)) {
                return { ...item, neighbourhood: e.target.value};
            }
                return item;
        });
        setAddresses([...updatedItems]);
    }
    const getStreet = (e) =>{
        const updatedItems = addresses.map((item,i) => {
            if(parseInt(e.target.name) === parseInt(i)) {
                return { ...item, street: e.target.value};
            }
                return item;
        });
        setAddresses([...updatedItems]);
    }
    const getPlate = (e) =>{
        const updatedItems = addresses.map((item,i) => {
            if(parseInt(e.target.name) === parseInt(i)) {
                return { ...item, plate: e.target.value};
            }
                return item;
        });
        setAddresses([...updatedItems]);   
    }
    const getPostalCode = (e) =>{
        const updatedItems = addresses.map((item,i) => {
            if(parseInt(e.target.name) === parseInt(i)) {
                return { ...item, postalCode: e.target.value};
            }
                return item;
        });
        setAddresses([...updatedItems]);
    }
    const getMapLink = (e) =>{
        const updatedItems = addresses.map((item,i) => {
            if(parseInt(e.target.name) === parseInt(i)) {
                return { ...item, mapLink: e.target.value};
            }
                return item;
        });
        setAddresses([...updatedItems]);
    }
    const getAddressExplanations = (e) =>{
        console.log(e.target.value)
        const updatedItems = addresses.map((item,i) => {
            if(parseInt(e.target.name) === parseInt(i)) {
                return { ...item, addressExplanations: e.target.value};
            }
                return item;
        });
        setAddresses([...updatedItems]);
    }


    const saveData = async() =>{
        setLoading(true)
        const checkArray = (arr , innerType) =>{
            if(arr[0] !== undefined){
                if(arr[0].innerType === ''){
                    return null
                }else{
                    return arr
                }
            }else if(arr.length === 0){
                return null
            }else{
                return arr
            }
        }
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
            
            email:checkArray(emails ,'email'),
            instagram:checkArray(instagrams ,'instagram'),
            website:checkArray(websites ,'website'),
            linkedIn:checkArray(linkedIns ,'linkedIn'),
            address: addresses,
            generatedBy:decoded.id,
            explanations:explanations,
            id:props.editCustomer.theCustomer._id
        }
     
        if(firstName === '' || lastName === '' || phoneNumbers[0].number ==='' || phoneNumbers[0].countryCode ===''){
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'To add new customer, you have to enter first name ,last name and phone number.',
              })
            setLoading(false)
        }else{
            try{
                const response = await authCtx.jwtInst({
                    method:"post",
                    data:dataToSend,
                    url:`${axiosCtx.defaultTargetApi}/crm/editCustomer`,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                
                const dataRes = response.data;
                
                props.setSuccessToast({status:true , msg:'Customer information has been edited'});
                const closingNewPreInvoice = setTimeout(()=>{props.setEditCustomer({status:false , theCustomer:{}});setLoading(false)}, 500);
                const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'Customer information has been edited'})}, 3000);
                dispatch(actions.crmRefresh())
            }catch(err){
                console.log(err);
                setLoading(false)
            } 
        }      
    }
    
    return(
        <Fragment>
            <div style={props.editCustomer.status === true?{display:'block'}:{display:'none'}}  className={props.editCustomer.status === true? `${Style.newInvoice} ${Style.fadeIn}` : props.editCustomer.status === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                <div className={Style.topSection}>
                    <div onClick={()=>{props.setEditCustomer({status:false , theCustomer:{}});}} className={Style.backBtn}><ArrowBackIos className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIos></div>
                    <div className={Style.topTitle}>Edit customer information</div>
                </div>
                <div className={Style.ovDiv}    style={{maxWidth:'700px' , overflowY:'scroll' , height:'95vh' , padding:"0px 15px 60px 15px"}}>
                    <div className={Style.titlePaddign}>
                        <BigOneWithDot text="Personal information"></BigOneWithDot>
                    </div>
                    <div className={Style.personalInformationFirstOne}>
                        <Row className="g-0">
                            <Col style={{padding:'10px 5px 0px 5px' , zIndex:'1000'}} sm={12} md={12} lg={12} xl={6} xxl={6} xs={6}>
                                <CustomSelect value={personCountry} onChange={(e)=>{setPersonCountry(e.code)}} selectType='countryWithFlag' placeholder="Country"></CustomSelect>
                            </Col>
                            <Col style={{padding:'10px 5px 0px 5px' , zIndex:'1999'}} sm={12} md={12} lg={12} xl={6} xxl={6} xs={6}>
                                <CustomSelect value={customerOrigin} onChange={(e)=>{setCustomerOrigin(e.id)}}  selectType='customerOrigin' placeholder="Attracted customers through"></CustomSelect>
                            </Col>
                            {/* <Col style={{padding:'10px 5px 0px 5px' , zIndex:'2000'}} sm={12} md={12} lg={2} xl={2} xxl={2} xs={6}>
                                <CustomSelect value={personCountry}  onChange={(e)=>{setPersonTitle(e.id)}} selectType='personTitle' placeholder="عنوان"></CustomSelect>
                            </Col> */}
                            <Col style={{padding:'10px 5px 0px 5px'}} sm={12} md={12} lg={12} xl={6} xxl={6} xs={6}>
                                <TextInputNormal value={firstName} onChange={(e)=>{setFirstName(e.target.value)}}  placeholder="First name"></TextInputNormal>
                            </Col>
                            <Col style={{padding:'10px 5px 0px 5px'}} sm={12} md={12} lg={12} xl={6} xxl={6} xs={6}>
                                <TextInputNormal value={lastName} onChange={(e)=>{setLastName(e.target.value)}} placeholder="Last name"></TextInputNormal>
                            </Col>
                        </Row>
                        <Row className="g-0" style={{padding:'0px 0px 5px 0px'}}>
                            {/* <Col style={{padding:'10px 5px 0px 5px' , zIndex:'999'}} sm={12} md={12} lg={6} xl={6} xxl={6} xs={6}>
                                <CustomSelect disable={true} selectType='personTitle' placeholder="نوع مشتری"></CustomSelect>
                            </Col> */}

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
                            </Col>
                            <Col style={{padding:'10px 5px 0px 5px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <MultiSelect disable={true} placeholder='محصولات مورد علاقه'></MultiSelect>
                            </Col> */}
                        </Row>
                    </div>
                    <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)' , margin:'10px 0px 10px 0px'}}></Divider>
                    <div>
                        <div className={Style.titlePaddignSecond}>
                            <BigOneWithDot text="Contact information"></BigOneWithDot>
                        </div>

                        <Row className="g-0" style={{padding:'2px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal text='Phone number'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                            </div>

                            <Col sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <IconBotton  onClick={()=>{var a = [...phoneNumbers]; a.push({title:'' , countryCode:'' , number:'' , whatsApp:false}); setPhoneNumbers([...a])}} color='black' name='New phone number' text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                            {phoneNumbers.map((data , i)=>{
                                return(
                                    <Row key={i} className="g-0"  style={{padding:'5px 0px 5px 0px' , marginTop:'5px'}}>
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
                                                    <CustomSelect value={data.countryCode} name={i} onChange={getCountryCode} selectType='countryWithFlagAndCountryCode' placeholder="Country code"></CustomSelect>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col  style={{padding:'10px 0px 0px 0px'}} xs={12} sm={12} md={12} lg={5} xl={5} xxl={5} >
                                            <TextInputNormal value={data.number} name={i} onChange={getPhoneNumber} placeholder="Phone number"></TextInputNormal>
                                        </Col>
                                    </Row>
                                )
                            })}
                    </div>
                    
                    <div> 
                        <Row className="g-0"  style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal  text='Email'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>

                            </div>

                            <Col style={{marginBottom:'5px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <IconBotton onClick={()=>{var a = [...emails]; a.push({email:''}); setEmails([...a])}} color='black' name='New email'  text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        {emails.map((data , i)=>{
                            return(
                                <Col style={{padding:'5px  0px 5px 0px'}} key={i} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <div className={Style.phoneNumberMainDiv}>
                                        <div className={Style.dot}>{i+1}</div>
                                        <IconBotton onClick={()=>{var temp = [...emails]; temp.splice(i,1); setEmails([...temp]) }} text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                        <div className={Style.phoneNumberCountry}>
                                        <TextInputNormal value={data.email} name={i} onChange={getEmail} placeholder='Email'></TextInputNormal>
                                        </div>

                                    </div>
                                </Col>
                            )
                        })}
                    </div>
                    <Divider sx={{borderBottomWidth:'2px' , opacity:'0.2' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                    <div> 
                        <Row className="g-0"  style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal  text='instagram'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                            </div>
                            <Col style={{marginBottom:'5px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <IconBotton onClick={()=>{var a = [...instagrams]; a.push({instagram:''}); setInstagrams([...a])}} color='black' name='New instagram url'  text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        {instagrams.map((data , i)=>{
                            return(
                                <Col style={{padding:'5px  0px 5px 0px'}} key={i} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <div className={Style.phoneNumberMainDiv}>
                                        <div className={Style.dot}>{i+1}</div>
                                            <IconBotton onClick={()=>{var temp = [...instagrams]; temp.splice(i,1); setInstagrams([...temp]) }} text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                        <div className={Style.phoneNumberCountry}>
                                            <TextInputNormal value={data.instagram} name={i} onChange={getInstagram} placeholder='Instagram profile url'></TextInputNormal>
                                        </div>
                                    </div>
                                </Col>
                            )
                        })}
                    </div>
                    <Divider sx={{borderBottomWidth:'2px' , opacity:'0.2' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                    <div> 
                        <Row className="g-0"  style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal  text='Website'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                            </div>
                            <Col style={{marginBottom:'5px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <IconBotton onClick={()=>{var a = [...websites]; a.push({website:''}); setWebsites([...a])}} color='black' name='New Website url'  text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        {websites.map((data , i)=>{
                            return(
                                <Col style={{padding:'5px  0px 5px 0px'}} key={i} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <div className={Style.phoneNumberMainDiv}>
                                        <div className={Style.dot}>{i+1}</div>
                                            <IconBotton onClick={()=>{var temp = [...websites]; temp.splice(i,1); setWebsites([...temp]) }} text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                        <div className={Style.phoneNumberCountry}>
                                            <TextInputNormal value={data.website} name={i} onChange={getWebsite} placeholder='Website url'></TextInputNormal>
                                        </div>
                                    </div>
                                </Col>
                            )
                        })}
                    </div>
                    <Divider sx={{borderBottomWidth:'2px' , opacity:'0.2' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                    <div> 
                        <Row className="g-0"  style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal  text='linkedIn'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                            </div>
                            <Col style={{marginBottom:'5px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <IconBotton onClick={()=>{var a = [...linkedIns]; a.push({linkedIn:''}); setLinkedIns([...a])}} color='black' name='New linkedIn url'  text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        {linkedIns.map((data , i)=>{
                            return(
                                <Col style={{padding:'5px  0px 5px 0px'}} key={i} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <div className={Style.phoneNumberMainDiv}>
                                        <div className={Style.dot}>{i+1}</div>
                                            <IconBotton onClick={()=>{var temp = [...linkedIns]; temp.splice(i,1); setLinkedIns([...temp]) }} text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                        <div className={Style.phoneNumberCountry}>
                                            <TextInputNormal value={data.linkedIn} name={i} onChange={getLinkeIn} placeholder='linkedIn url'></TextInputNormal>
                                        </div>
                                    </div>
                                </Col>
                            )
                        })}
                    </div>
                    
                    <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>

                    <div>
                        <BigOneWithDot text="Address"></BigOneWithDot>
                        <Row className="g-0"  style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal text='Addresses'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                            </div>
                            <Col style={{marginBottom:'10px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <IconBotton  onClick={()=>{var a = [...addresses]; a.push({country:'' , province:'' , city:'' , neighbourhood:'' , street:'' , plate:'' , postalCode:'' , mapLink:'' , addressExplanations:''}); setAddresses([...a])}} color='black' name='New address' text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
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
                                                Address {i+1}
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row className="g-0"  style={{padding:'5px 0px 5px 0px'}}>
                                            <Col style={{padding:'0px 0px 10px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div className={Style.phoneNumberMainDiv}>
                                                    <div className={Style.phoneNumberCountry}>
                                                        <CustomSelect value={data.country} onChange={getAddressCountry} name={i} selectType='countryWithFlag' placeholder="Country"></CustomSelect>
                                                    </div>

                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal value={data.province} onChange={getProvince} name={i} placeholder='State'></TextInputNormal>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'0px 0px 10px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div className={Style.phoneNumberMainDiv}>                 
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal value={data.city} onChange={getCity} name={i} placeholder='City'></TextInputNormal>
                                                    </div>
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal value={data.neighbourhood} onChange={getNeighbourhood} name={i} placeholder='Neighborhood'></TextInputNormal>
                                                    </div>

                                                </div>

                                            </Col>
                                            <Col style={{padding:'0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal value={data.street} onChange={getStreet} name={i} placeholder='Street'></TextInputNormal>
                                                    </div>
                                            </Col>
                                        </Row>
                                        <Row className="g-0" dir='rtl' style={{padding:'5px 0px 5px 0px'}}>
                                            <Col style={{padding:'0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div className={Style.phoneNumberMainDiv}>                 
                                                    <div style={{maxWidth:'50%'}} className={Style.phoneNumberCountry}>
                                                        <TextInputNormal value={data.plate} onChange={getPlate} name={i} placeholder='Plate'></TextInputNormal>
                                                    </div>
                                                    <div style={{maxWidth:'50%'}} className={Style.phoneNumberCountry}>
                                                        <TextInputNormal value={data.postalCode} onChange={getPostalCode} name={i} placeholder='Postal code'></TextInputNormal>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'10px 0px 10px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div style={{maxWidth:'100%'}} className={Style.phoneNumberCountry}>
                                                    <TextInputNormal value={data.mapLink} onChange={getMapLink} name={i} placeholder='Map link'></TextInputNormal>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                <div className={Style.phoneNumberMainDiv}>                 

                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal value={data.addressExplanations} onChange={getAddressExplanations} name={i} placeholder='Explaintion'></TextInputNormal>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col style={{padding:'5px 0px 0px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                        <div className={Style.addressDeleteBtnWithIcon} >
                                            <IconBotton onClick={()=>{var temp = [...addresses]; temp.splice(i,1); setAddresses([...temp]) }} text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                        </div>
                                    </Col>
                                </Row>
                            )
                        })}
                        <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                        <div>
                            <Row className="g-0"  style={{padding:'5px 0px 5px 0px'}}>
                                <Col style={{padding:'5px 0px 0px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                    <div >
                                        <LittleOneNormal text='Extra explaintion'></LittleOneNormal>
                                        <textarea value={explanations} onChange={(e)=>{setExplanations(e.target.value)}} id="w3review" name="w3review" rows="5" style={{width:'100%'}} cols="50"></textarea>                                            
                                    </div>   
                                </Col>
                            </Row>
                        </div>
                    </div>
                    <div>
                        <Row className="g-0" style={{padding:'0px'}}>
                            <Col style={{padding:'0px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <div style={{width:'100%'}}> 
                                    <button disabled={loading} style={{fontSize:'15px' , display:'flex' , justifyContent:'center' , alignItems:'center'}} onClick={saveData} className={Style.NormalBtn}>{loading === true ? <CircularProgress size='24px' color='inherit'></CircularProgress>:'ویرایش'}</button>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}


const EditCustomer = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <EditCustomerPortal  setSuccessToast={props.setSuccessToast} editCustomer={props.editCustomer} setEditCustomer={props.setEditCustomer}></EditCustomerPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}


export default EditCustomer;