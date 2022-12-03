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


const NewCustomer = () =>{
    //hooks
    const authCtx = useContext(AxiosGlobal);


    //personal information states
    const [firstName , setFirstName] = useState('');
    const [lastName , setLastName] = useState('');
    const [personCountry , setPersonCountry] = useState('');
    const [personTitle , setPersonTitle] = useState('');
    const [customerType , setCustomerType] = useState('');
    const [customerOrigin , setCustomerOrigin] = useState('');
    const [dateOfBrith , setDateOfBrith] = useState('');
    const [customerFavoriteProducts , setCustomerFavoriteProducts] = useState([]);

    //phone numbers information states

    const [phoneNumbers , setPhoneNumbers] = useState([{title:'' , countryCode:'' , number:''}]);

    //emails information states
    const [emails , setEmails] = useState([{email:''}]);

    //address information states
    const [addresses  , setAddresses] = useState([{country:'' , province:'' , city:'' , neighbourhood:'' , street:'' , plate:'' , postalCode:'' , mapLink:'' , addressExplanations:''}]);




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
                dateOfBrith:dateOfBrith
            },
            phoneNumberInformation : phoneNumbers,
            email:emails,
            address:addresses
        }
        try{
            const response = await axios({
                method:"post",
                data:dataToSend,
                url:`${authCtx.defaultTargetApi}/crm/getTheBlogForMain`,
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            const dataRes = response.data;
            console.log(dataRes);
    }catch(err){
        console.log(err);
    }       
    }
    return(
        <Fragment>
            
                <div className={Style.ovDiv}  dir='rtl'  style={{maxWidth:'1600px'}}>
                    <div className={Style.titlePaddign}>
                        <BigOneWithDot text="مشخصات فردی"></BigOneWithDot>
                    </div>
                    <div className={Style.personalInformationFirstOne}>
                        <Row className="g-0">
                            <Col style={{padding:'0px 5px 0px 5px'}} sm={12} md={12} lg={2} xl={2} xxl={2} xs={2}>
                                <CustomSelect onChange={(e)=>{setPersonCountry(e.code)}} selectType='countryWithFlag' placeholder="کشور"></CustomSelect>
                            </Col>
                            <Col style={{padding:'0px 5px 0px 5px'}} sm={12} md={12} lg={2} xl={2} xxl={2} xs={2}>
                                <CustomSelect  onChange={(e)=>{setPersonTitle(e.id)}} selectType='personTitle' placeholder="عنوان"></CustomSelect>
                            </Col>
                            <Col style={{padding:'0px 5px 0px 5px'}} sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <TextInputNormal onChange={(e)=>{setFirstName(e.target.value)}}  placeholder="نام"></TextInputNormal>
                            </Col>
                            <Col style={{padding:'0px 5px 0px 5px'}} sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <TextInputNormal onChange={(e)=>{setLastName(e.target.value)}} placeholder="نام خانوادگی"></TextInputNormal>
                            </Col>
                        </Row>
                        <Row className="g-0" style={{padding:'15px 0px 5px 0px'}}>
                            <Col style={{padding:'0px 5px 0px 5px'}} sm={12} md={12} lg={2} xl={2} xxl={2} xs={2}>
                                <CustomSelect selectType='personTitle' placeholder="نوع مشتری"></CustomSelect>
                            </Col>
                            <Col style={{padding:'0px 5px 0px 5px'}} sm={12} md={12} lg={2} xl={2} xxl={2} xs={2}>
                                <CustomSelect onChange={(e)=>{setCustomerOrigin(e.id)}}  selectType='customerOrigin' placeholder="جذب شده از طریق"></CustomSelect>
                            </Col>
                            <Col style={{padding:'0px 5px 0px 5px'}} sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <Datep onChange={setDateOfBrith}></Datep>
                            </Col>
                            <Col style={{padding:'0px 5px 0px 5px'}} sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                <MultiSelect placeholder='محصولات مورد علاقه'></MultiSelect>
                            </Col>
                        </Row>
                    </div>
                    <hr className={Style.dashLine}></hr>
                    <div>
                        <div className={Style.titlePaddignSecond}>
                            <BigOneWithDot text="اطلاعات تماس"></BigOneWithDot>
                        </div>

                        <Row className="g-0" dir='rtl' style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal text='شماره تماس'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>

                            </div>

                            <Col sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <IconBotton  onClick={()=>{var a = [...phoneNumbers]; a.push({title:'' , countryCode:'' , number:''}); setPhoneNumbers([...a])}} color='black' name='شماره تماس جدید' text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        <hr className={Style.dashLineVer}></hr>
                            {phoneNumbers.map((data , i)=>{
                                return(
                                    <Row key={i} className="g-0" dir='rtl' style={{padding:'5px  0px 5px 0px'}}>
                                        <Col sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                            <div className={Style.phoneNumberMainDiv}>
                                                <div className={Style.dot}></div>
                                                    <IconBotton onClick={()=>{var temp = [...phoneNumbers]; temp.splice(i,1); setPhoneNumbers([...temp]) }}  text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                                <div className={Style.phoneNumberCountry}>
                                                    <CustomSelect name={i} onChange={getPrTitle} selectType='personTitle' placeholder="عنوان"></CustomSelect>
                                                </div>
                                                <div className={Style.phoneNumberCountry}>
                                                    <CustomSelect name={i} onChange={getCountryCode} selectType='countryWithFlagAndCountryCode' placeholder="کد کشور"></CustomSelect>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col  style={{padding:'0px'}} sm={12} md={12} lg={3} xl={3} xxl={3} xs={3}>
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

                            <Col sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                    <IconBotton onClick={()=>{var a = [...emails]; a.push({email:''}); setEmails([...a])}} color='black' name='ایمیل جدید'  text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        <hr className={Style.dashLineVer}></hr>
                        {emails.map((data , i)=>{
                            return(
                                <Col key={i} sm={12} md={12} lg={4} xl={4} xxl={4} xs={4}>
                                    <div className={Style.phoneNumberMainDiv}>
                                        <div className={Style.dot}></div>
                                        <IconBotton onClick={()=>{var temp = [...emails]; temp.splice(i,1); setEmails([...temp]) }} text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                        <div className={Style.phoneNumberCountry}>
                                        <TextInputNormal name={i} onChange={getEmail} placeholder='ایمیل'></TextInputNormal>
                                        </div>

                                    </div>
                                </Col>
                            )
                        })}
                    </div>
                    <hr className={Style.dashLine}></hr>

                    <div>
                        <BigOneWithDot text="آدرس"></BigOneWithDot>
                        <Row className="g-0" dir='rtl' style={{padding:'30px 0px 0px 0px'}}>
                            <div className={Style.littleTitleDiv}>
                                <LittleOneNormal text='آدرس ها'></LittleOneNormal>
                                <hr style={{marginRight:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                            </div>
                            <Col sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <IconBotton onClick={()=>{var a = [...addresses]; a.push({country:'' , province:'' , city:'' , neighbourhood:'' , street:'' , plate:'' , postalCode:'' , mapLink:'' , addressExplanations:''}); setAddresses([...a])}} color='black' name='آدرس جدید' text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton>
                            </Col>
                        </Row>
                        <hr className={Style.dashLineVer}></hr>
                        {addresses.map((data , i)=>{
                            return(
                                <Row key={i} className="g-0">
                                    <Col style={{padding:'0px'}} sm={12} md={12} lg={1} xl={1} xxl={1} xs={1}>
                                        <div className={Style.addressDeleteBtnWithIcon} >
                                            <IconBotton onClick={()=>{var temp = [...addresses]; temp.splice(i,1); setAddresses([...temp]) }} text={false} icon={<DeleteIcon sx={{color:'#EA005A'}}/>}></IconBotton>
                                        </div>
                                    </Col>
                                    <Col style={{padding:'0px'}} sm={12} md={12} lg={11} xl={11} xxl={11} xs={11}>
                                        <Row className="g-0" dir='rtl' style={{padding:'5px  0px 5px 0px'}}>
                                            <Col style={{padding:'0px'}} sm={12} md={12} lg={5} xl={5} xxl={5} xs={5}>
                                                <div className={Style.phoneNumberMainDiv}>
                                    
                                                    <div className={Style.phoneNumberCountry}>
                                                        <CustomSelect onChange={getAddressCountry} name={i} selectType='countryWithFlag' placeholder="کشور"></CustomSelect>
                                                    </div>
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getProvince} name={i} placeholder='استان'></TextInputNormal>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'0px'}} sm={12} md={12} lg={5} xl={5} xxl={5} xs={5}>
                                                <div className={Style.phoneNumberMainDiv}>                 
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getCity} name={i} placeholder='شهر'></TextInputNormal>
                                                    </div>
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getNeighbourhood} name={i} placeholder='منطقه(محله)'></TextInputNormal>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col style={{padding:'0px'}} sm={12} md={12} lg={2} xl={2} xxl={2} xs={2}>
                                                <div className={Style.phoneNumberMainDiv}>                 
                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getStreet} name={i} placeholder='خیابان'></TextInputNormal>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row className="g-0" dir='rtl' style={{padding:'5px  0px 5px 0px'}}>
                                            <Col style={{padding:'0px'}} sm={12} md={12} lg={6} xl={6} xxl={6} xs={6}>
                                                <div className={Style.phoneNumberMainDiv}>                 
                                                    <div style={{maxWidth:'15%'}} className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getPlate} name={i} placeholder='پلاک'></TextInputNormal>
                                                    </div>
                                                    <div style={{maxWidth:'25%'}} className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getPostalCode} name={i} placeholder='کد پستی'></TextInputNormal>
                                                    </div>
                                                    <div style={{maxWidth:'60%'}} className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getMapLink} name={i} placeholder='لینک نقشه'></TextInputNormal>
                                                    </div>

                                                </div>
                                            </Col>
                                            <Col style={{padding:'0px'}} sm={12} md={12} lg={6} xl={6} xxl={6} xs={6}>
                                                <div className={Style.phoneNumberMainDiv}>                 

                                                    <div className={Style.phoneNumberCountry}>
                                                        <TextInputNormal onChange={getAddressExplanations} name={i} placeholder='توضیحات'></TextInputNormal>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            )
                        })}
                    </div>
                    <div>
                        <Row className="g-0" style={{padding:'0px'}}>
                            <Col style={{padding:'0px'}} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                <div style={{width:'100%'}}>
                                    <button onClick={saveData} className={Style.NormalBtn}>ذخیره</button>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
        </Fragment>
    )
}
export default NewCustomer;