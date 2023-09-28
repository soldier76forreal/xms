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
import { useHistory , Link } from 'react-router-dom';
import { ArrowBackIos, Call, Cancel, Done, Edit, Instagram, LinkedIn, WebStories } from '@mui/icons-material';
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
import { Avatar, Divider, Grid } from '@mui/material';
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
import SortDayByDay from '../functions/sortDayByDay';
import { ExternalLink } from 'react-external-link';
import LanguageIcon from '@mui/icons-material/Language';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';
import Loader from '../../tools/loader/loader';
const ShowCustomerPortal = (props) =>{
    const crmRefresh = useSelector((state) => state.crmRefresh);

    //hooks
    const axiosCtx = useContext(AxiosGlobal);
    const authCtx = useContext(AuthContext);
    const dispatch = useDispatch()
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
    const [explanations , setExplanations] = useState(null);
    const [loading , setLoading] = useState(false);

    const [customerFavoriteProducts , setCustomerFavoriteProducts] = useState([]);
    const [calenderType , setCalenderType] = useState('');

    //phone numbers information states

    const [phoneNumbers , setPhoneNumbers] = useState([{title:'' , countryCode:'' , number:'' , whatsApp:true}]);

    //emails information states
    const [emails , setEmails] = useState([{email:''}]);

    //address information states
    const [addresses  , setAddresses] = useState([{country:'' , province:'' , city:'' , neighbourhood:'' , street:'' , plate:'' , postalCode:'' , mapLink:'' , addressExplanations:''}]);
    const callType =[ {value:'sales' , pr:'فروش'} ,  {value:'requestFollowUp' , pr:'پی گیری درخواست'} ,  {value:'invoiceFollowUp' , pr:'پی گیری فاکتور'} , {value:'customerSatisfaction' , pr:'رضایت مشتری'}]

    //instagrams information states
    const [instagrams , setInstagrams] = useState([{instagram:''}]);

    //websites information states
    const [websites , setWebsites] = useState([{website:''}]);

    //linkedIns information states
    const [linkedIns , setLinkedIns] = useState([{linkedIn:''}]);


    //edit sections
    const [editPersonalInformation , setEditPersonalInformation] = useState(false);
    const [editContactInformation , setEditContactInformation] = useState(false);
    const [editAddressAndExtraInformation , setEditAddressAndExtraInformation] = useState(false);
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
            if(result[0].customer.explanations !==null){
                setExplanations(result[0].customer.explanations)

            }

            setPhoneNumbers([...result[0].customer.contactInfo.phoneNumbers])
            
            if(result[0].customer.address !==null){
                setAddresses([...result[0].customer.address])
            }else if(result[0].customer.address ===null){
                setAddresses(null)
            }
            if(result[0].customer.contactInfo.emails !==null ){
                setEmails([...result[0].customer.contactInfo.emails])
            }else if(result[0].customer.contactInfo.emails ===null){
                setEmails(null)
            }
            if(result[0].customer.contactInfo.instagrams !==null){
                setInstagrams([...result[0].customer.contactInfo.instagrams])
            }else if(result[0].customer.contactInfo.instagrams ===null){
                setInstagrams(null)
            }
            if(result[0].customer.contactInfo.websites !==null){
                setWebsites([...result[0].customer.contactInfo.websites])
            }else if(result[0].customer.contactInfo.websites ===null){
                setWebsites(null)
            }
            if(result[0].customer.contactInfo.linkedIns !==null){
                setLinkedIns([...result[0].customer.contactInfo.linkedIns])
            }else if(result[0].customer.contactInfo.linkedIns ===null){
                setLinkedIns(null)
            }
            if(result[0].customer.phoneCalls.length !==0){
                var dayByDayArr = Object.keys(SortDayByDay(result[0].customer.phoneCalls)).map((key) => [key, SortDayByDay(result[0].customer.phoneCalls)[key]]);
                setCalls([...dayByDayArr])
                
            }
        }else if(props.showCustomer.status === false){
            setFirstName(null)
            setLastName(null)
            setPersonCountry(null)
            setPersonTitle(null)
            setCustomerType(null)
            setCustomerOrigin(null)
            setDateOfBrith(null)
            setCalenderType('')
            setExplanations(null)
            setPhoneNumbers([{title:'' , countryCode:'' , number:'' , whatsApp:true}])
            setAddresses([{country:'' , province:'' , city:'' , neighbourhood:'' , street:'' , plate:'' , postalCode:'' , mapLink:'' , addressExplanations:''}])
            setEmails([{email:''}])
            setInstagrams([{instagram:''}])
            setWebsites([{website:''}])
            setLinkedIns([{linkedIn:''}])
        }
    }, [props.showCustomer ])
    


   
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



    const editContactSection = async() =>{
        setLoading(true)
        const checkArray = (arr , innerType) =>{
            const innerT = innerType
            if(arr[0] !== undefined){
                if(arr[0][innerT] === ''){
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
        console.log(checkArray(instagrams ,'instagram'))
        const dataToSend = {
            phoneNumberInformation : phoneNumbers,  
            email:checkArray(emails ,'email'),
            instagram:checkArray(instagrams ,'instagram'),
            website:checkArray(websites ,'website'),
            linkedIn:checkArray(linkedIns ,'linkedIn'),
            generatedBy:decoded.id,
            id:props.showCustomer.id
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
                    url:`${axiosCtx.defaultTargetApi}/crm/editCustomerContactSection`,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                
                const dataRes = response.data;
                setEditContactInformation(false)

                props.setSuccessToast({status:true , msg:'Customer information has been edited'});
                const closingNewPreInvoice = setTimeout(()=>{setLoading(false)}, 500);
                const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'Customer information has been edited'})}, 3000);
                dispatch(actions.crmRefresh())
                setLoading(false)

            }catch(err){
                console.log(err);
                setLoading(false)
            } 
        }      
    }

    const editPersonalSection = async() =>{
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
            generatedBy:decoded.id,
            id:props.showCustomer.id
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
                    url:`${axiosCtx.defaultTargetApi}/crm/editPersonalInformationSection`,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                
                const dataRes = response.data;
                setEditPersonalInformation(false)

                props.setSuccessToast({status:true , msg:'Customer information has been edited'});
                const closingNewPreInvoice = setTimeout(()=>{setLoading(false)}, 500);
                const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'Customer information has been edited'})}, 3000);
                dispatch(actions.crmRefresh())
                setLoading(false)

            }catch(err){
                console.log(err);
                setLoading(false)
            } 
        }      
    }


    const editAddressAndExplaintionSection = async() =>{
        setLoading(true)
        const dataToSend = {
            address: addresses,
            generatedBy:decoded.id,
            explanations:explanations,
            id:props.showCustomer.id
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
                    url:`${axiosCtx.defaultTargetApi}/crm/editCustomerAddress`,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                
                const dataRes = response.data;
                setEditAddressAndExtraInformation(false)

                props.setSuccessToast({status:true , msg:'Customer information has been edited'});
                const closingNewPreInvoice = setTimeout(()=>{props.setEditCustomer({status:false , theCustomer:{}});setLoading(false)}, 500);
                const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'Customer information has been edited'})}, 3000);
                dispatch(actions.crmRefresh())
                setLoading(false)

            }catch(err){
                console.log(err);
                setLoading(false)
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

    const cancelEditContactInfo = () =>{
        setEditContactInformation(false)
        if(props.showCustomer.status === true){
            var result = props.persons.filter(e=>{if(e !==undefined){return JSON.stringify(e.customer._id) === JSON.stringify(props.showCustomer.id)}});
            setPhoneNumbers([...result[0].customer.contactInfo.phoneNumbers])

            if(result[0].customer.contactInfo.emails !==null){
                setEmails([...result[0].customer.contactInfo.emails])
            }else if(result[0].customer.contactInfo.emails ===null){
                setEmails(null)
            }
            if(result[0].customer.contactInfo.instagrams !==null){
                setInstagrams([...result[0].customer.contactInfo.instagrams])
            }else if(result[0].customer.contactInfo.instagrams ===null){
                setInstagrams(null)
            }
            if(result[0].customer.contactInfo.websites !==null){
                setWebsites([...result[0].customer.contactInfo.websites])
            }else if(result[0].customer.contactInfo.websites ===null){
                setWebsites(null)
            }
            if(result[0].customer.contactInfo.linkedIns !==null){
                setLinkedIns([...result[0].customer.contactInfo.linkedIns])
            }else if(result[0].customer.contactInfo.linkedIns ===null){
                setLinkedIns(null)
            }
        }

    }
    const cancelEditPersonalInfo = () =>{
        setEditPersonalInformation(false)
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
            if(result[0].customer.personalInformation.attractedBy !==null){
                setCustomerOrigin(result[0].customer.personalInformation.attractedBy)
            }
        }

    }
    const cancelEditAddressAndExteraInformation = () =>{
        setEditAddressAndExtraInformation(false)
        if(props.showCustomer.status === true){
            var result = props.persons.filter(e=>{if(e !==undefined){return JSON.stringify(e.customer._id) === JSON.stringify(props.showCustomer.id)}});
            if(result[0].customer.explanations !==null){
                setExplanations(result[0].customer.explanations)

            }
            if(result[0].customer.address !==null){
                setAddresses([...result[0].customer.address])
            }else if(result[0].customer.address ===null){
                setAddresses(null)
            }
        }

    }



    const editPersonalInformationFunc = () =>{
        if(props.showCustomer.status === true){
            var result = props.persons.filter(e=>{if(e !==undefined){return JSON.stringify(e.customer._id) === JSON.stringify(props.showCustomer.id)}})[0].customer;
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
         }
         setEditPersonalInformation(true)

    }

    const editContactInformationFunc = () =>{
        
        if(props.showCustomer.status === true){
            var result = props.persons.filter(e=>{if(e !==undefined){return JSON.stringify(e.customer._id) === JSON.stringify(props.showCustomer.id)}})[0].customer;
            setPhoneNumbers([...result.contactInfo.phoneNumbers])

            if(result.contactInfo.emails !==null && result.contactInfo.emails.length !== 0){
                setEmails([...result.contactInfo.emails])
            }else if(result.contactInfo.emails ===null){
                setEmails([{email:''}])
            }else if(result.contactInfo.emails.length === 0){
                setEmails([{email:''}])
            }
            if(result.contactInfo.instagrams !==null && result.contactInfo.instagrams.length !== 0){
                setInstagrams([...result.contactInfo.instagrams])
            }else if(result.contactInfo.instagrams ===null){
                setInstagrams([{instagram:''}])
            }else if( result.contactInfo.instagrams.length === 0){
                setInstagrams([{instagram:''}])

            }
            if(result.contactInfo.websites !==null && result.contactInfo.websites.length !== 0){
                setWebsites([...result.contactInfo.websites])
            }else if(result.contactInfo.websites ===null || result.contactInfo.websites.length === 0){
                setWebsites([{website:''}])
            }
            if(result.contactInfo.linkedIns !==null && result.contactInfo.linkedIns.length !== 0){
                setLinkedIns([...result.contactInfo.linkedIns])
            }else if(result.contactInfo.linkedIns ===null ||  result.contactInfo.linkedIns.length === 0){
                setLinkedIns([{linkedIn:''}])
            }
            
         }
         setEditContactInformation(true)


    }


    const editAddressAndExtraInformationFunc = () =>{

        if(props.showCustomer.status === true){
            var result = props.persons.filter(e=>{if(e !==undefined){return JSON.stringify(e.customer._id) === JSON.stringify(props.showCustomer.id)}})[0].customer;
            if(result.explanations !==null){
                setExplanations(result.explanations)
            }
            if(result.address !==null){
                setAddresses([...result.address])
            }else if(result.address ===null){
                setAddresses([])
            }
         }
         setEditAddressAndExtraInformation(true)

    }
    return(
        <Fragment>
            
            <div style={props.showCustomer.status === true?{display:'block'}:{display:'none'}}  className={props.showCustomer.status === true? `${Style.newInvoice} ${Style.fadeIn}` : props.showCustomer.status === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                <div className={Style.topSection}>
                    <div onClick={()=>{props.setShowCustomer({status:false , id:''});}} className={Style.backBtn}><ArrowBackIos className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIos></div>
                    <div className={Style.topTitle}>Informations and activities</div>
                </div>
                <div className={Style.ovDiv}    style={{maxWidth:'700px' , overflowx:'none' , overflowY:'scroll' , height:'95vh' , position:'relative' , padding:"0px 0px 100px 0px"}}>
                    <div style={{padding:'0px 25px 60px 25px'}}>      
                        {listType === 'prInformation' ?
                            <div>
                                {editPersonalInformation === true?
                                    <div>
                                        <div className={Style.titlePaddign}>
                                            <BigOneWithDot text="Personal information"></BigOneWithDot>
                                            <div  style={{display:'flex', margin:'0px 0px 0px auto'}}>                                                    
                                                <div disable={loading} style={{backgroundColor:'rgb(220, 220, 220)', marginRight:'10px'}} onClick={cancelEditPersonalInfo} className={Style.editBtn}><Cancel sx={{color:'#EA005A'}}></Cancel></div>
                                                <div disable={loading} style={{backgroundColor:'black'}} onClick={editPersonalSection}  className={Style.editBtn}>{loading === true?<Loader width='20px' color='white'></Loader>:<Done sx={{color:'rgb(255, 255, 255)',fontSize:'20px'}}></Done>}</div>
                                            </div>
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
                                    </div>
                                :editPersonalInformation === false?
                                    <div>
                                    <div className={Style.titlePaddign}>
                                        <div style={{textAlign:'right'}}>
                                            <BigOneWithDot text="Personal information"></BigOneWithDot>
                                        </div>
                                        <div onClick={editPersonalInformationFunc} className={Style.editBtn}><Edit sx={{color:'rgb(255, 255, 255)'}}></Edit></div>

                                        {/* <div style={{textAlign:'left' ,margin:'0px auto 0px 0px'  , display:'felex', alignContent:'center'}}><button style={{fontSize:'10px'}} className='btnOutLine' >ویرایش</button></div> */}
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
                                                                <span style={{padding:'8px 10px 8px 10px' , borderRadius:'8px' , marginLeft:'10px' , backgroundColor:'white'}}>{firstName} {lastName}</span>
                                                            </Grid>
                                                            <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                                {personCountry !== null?
                                                                    <Fragment>
                                                                        <span style={{padding:'8px 10px 8px 10px' , borderRadius:'8px' }}>
                                                                            <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>from </span>
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
                                                                <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px', marginRight:'5px'}}>Attracted customers through</span>
                                                                <span>{CustomerOrigin(customerOrigin)}</span>
                                                            </span>
                                                        </Fragment>
                                                    :null}
                                                </div>
                                            </Col>
                                        </Row>

                                    </div>
                                    </div>
                                :null}

                                <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                                {editContactInformation=== true?
                                    <div>
                                        <div>
                                            <div style={{position:'relative'}} className={Style.titlePaddign}>
                                                <div style={{textAlign:'left'}}>
                                                    <BigOneWithDot text="Contact information"></BigOneWithDot>
                                                </div>
                                                <div  style={{display:'flex', margin:'0px 0px 0px auto'}}>                                                    
                                                    <div style={{backgroundColor:'rgb(220, 220, 220)', marginRight:'10px'}} onClick={cancelEditContactInfo} className={Style.editBtn}><Cancel sx={{color:'#EA005A'}}></Cancel></div>
                                                    <div style={{backgroundColor:'black'}} onClick={editContactSection}  className={Style.editBtn}>{loading === true?<Loader width='20px' color='white'></Loader>:<Done sx={{color:'rgb(255, 255, 255)',fontSize:'20px'}}></Done>}</div>
                                                </div>

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
                                    </div>
                                :editContactInformation=== false?
                                    <div>
                                        <div>
                                            <div className={Style.titlePaddign}>
                                                <div style={{textAlign:'left'}}>
                                                    <BigOneWithDot text="Contact information"></BigOneWithDot>
                                                </div>
                                                <div onClick={editContactInformationFunc} className={Style.editBtn}><Edit sx={{color:'rgb(255, 255, 255)'}}></Edit></div>
                                            </div>
                                            
    
                                            <Row className="g-0" style={{padding:'2px 0px 0px 0px'}}>
                                                <div className={Style.littleTitleDiv}>
                                                    <LittleOneNormal text='Phone number'></LittleOneNormal>
                                                    <hr style={{marginLeft:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                                                </div>
                                            </Row>
                                            <Row>
                                                <Col sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                                    {phoneNumbers.map(e=>{
                                                        return(
                                                            <div style={{ marginBottom:'10px', alignItems:'center'}}>
                                                                <Grid style={{display:'flex'}} container spacing={0}>
                                                                    <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                                        <span style={{marginRight:'5px'}}>
                                                                            <a  href={`tel:${e.countryCode}${e.number}}`}>
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
                                                                    {/* <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                                        {personTitle !== null?
                                                                            <span style={{marginRight:'8px'}}>{PrTitle(personTitle)}</span>
                                                                        :null}
                                                                    </Grid> */}
                                                                    <Grid style={{ display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto" >
                                                                        <span style={{padding:'9px 10px 9px 10px' , borderRadius:'8px' , textAlign:'right' , marginLeft:'10px' , backgroundColor:'white'}}>{firstName} {lastName}</span>
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
                                                <Row className="g-0" style={{padding:'30px 0px 0px 0px'}}>
                                                    <div className={Style.littleTitleDiv}>
                                                        
                                                        <LittleOneNormal  text='Emails'></LittleOneNormal>
                                                        <hr style={{marginLeft:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
    
                                                    </div>
                                                </Row>
                                                {emails.map((data , i)=>{
                                                    return(
                                                        <Col style={{padding:'0px  0px 5px 0px'}} key={i} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                                            <div style={{display:'flex', backgroundColor:'#EFEFEF', marginBottom:'5px',borderRadius:'100px' , alignItems:'center'}}>
                                                                    <span style={{marginRight:'5px'}}>
                                                                        <a  href={`mailto:${data.email}`}>
                                                                            <IconBotton  backgroundColor='#00ACA0' text={false} icon={<AlternateEmailIcon sx={{color:'#EFEFEF'}}/>}></IconBotton>
                                                                        </a>
                                                                    </span>
                                                                    <span style={{marginLeft:'10px'}}>
                                                                        {data.email}
                                                                    </span>
                                                                </div>
                                                        </Col>
                                                    )
                                                })}
                                            </div>
                                        :null}
                                        <Divider sx={{borderBottomWidth:'2px' , opacity:'0.2' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                                        {instagrams !== null?
                                            <div> 
                                                <Row className="g-0" style={{padding:'30px 0px 0px 0px'}}>
                                                    <div className={Style.littleTitleDiv}>
                                                        
                                                        <LittleOneNormal  text='Instagram'></LittleOneNormal>
                                                        <hr style={{marginLeft:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
    
                                                    </div>
                                                </Row>
                                                {instagrams.map((data , i)=>{
                                                    return(
                                                        <Col style={{padding:'0px  0px 5px 0px'}} key={i} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                                            <div style={{display:'flex', backgroundColor:'#EFEFEF', marginBottom:'5px',borderRadius:'100px' , alignItems:'center'}}>
                                                                <span style={{marginRight:'5px'}}>
                                                                    <ExternalLink  href={`https://${data.instagram}`}>
                                                                        <IconBotton  backgroundColor='rgb(255, 0, 85)' text={false} icon={<Instagram sx={{color:'#EFEFEF'}}/>}></IconBotton>
                                                                    </ExternalLink>
                                                                </span>
                                                                <span style={{marginLeft:'10px'}}>
                                                                    {data.instagram}
                                                                </span>
                                                            </div>
                                                        </Col>
                                                    )
                                                })}
                                            </div>
                                        :null}   
                                        <Divider sx={{borderBottomWidth:'2px' , opacity:'0.2' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                                        {websites !== null?
                                            <div> 
                                                <Row className="g-0"  style={{padding:'30px 0px 0px 0px'}}>
                                                    <div className={Style.littleTitleDiv}>
                                                        <LittleOneNormal  text='website'></LittleOneNormal>
                                                        <hr style={{marginLeft:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                                                    </div>
                                                </Row>
                                                {websites.map((data , i)=>{
                                                    return(
                                                        <Col style={{padding:'0px  0px 5px 0px'}} key={i} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                                            <div style={{display:'flex', backgroundColor:'#EFEFEF', marginBottom:'5px',borderRadius:'100px' , alignItems:'center'}}>
                                                                <span style={{marginRight:'5px'}}>
                                                                    <ExternalLink  href={`https://${data.website}`}>
                                                                        <IconBotton  backgroundColor='rgb(70, 147, 247)' text={false} icon={<LanguageIcon sx={{color:'#EFEFEF'}}/>}></IconBotton>
                                                                    </ExternalLink>
                                                                </span>
                                                                <span style={{marginLeft:'10px'}}>
                                                                    {data.website}
                                                                </span>
                                                            </div>
                                                        </Col>
                                                    )
                                                })}
                                            </div>
                                        :null}   
                                        <Divider sx={{borderBottomWidth:'2px' , opacity:'0.2' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                                        {linkedIns !== null?
                                            <div> 
                                                <Row className="g-0" style={{padding:'30px 0px 0px 0px'}}>
                                                    <div className={Style.littleTitleDiv}>
                                                        <LittleOneNormal  text='linkedIns'></LittleOneNormal>
                                                        <hr style={{marginLeft:'8px' , maxWidth:'15px' , padding:"3px , 0px , 3px , 0px"}} className={Style.dashLineVer}></hr>
                                                    </div>
                                                </Row>
                                                {linkedIns.map((data , i)=>{
                                                    return(
                                                        <Col style={{padding:'0px  0px 5px 0px'}} key={i} sm={12} md={12} lg={12} xl={12} xxl={12} xs={12}>
                                                            <div style={{display:'flex', backgroundColor:'#EFEFEF', marginBottom:'5px',borderRadius:'100px' , alignItems:'center'}}>
                                                                <span style={{marginRight:'5px'}}>
                                                                    <ExternalLink  href={`https://${data.linkedIn}`}>
                                                                        <IconBotton  backgroundColor='blue' text={false} icon={<LinkedIn sx={{color:'#EFEFEF'}}/>}></IconBotton>
                                                                    </ExternalLink>
                                                                </span>
                                                                <span style={{marginLeft:'10px'}}>
                                                                    {data.linkedIn}
                                                                </span>
                                                            </div>
                                                        </Col>
                                                    )
                                                })}
                                            </div>
                                        :null}               
                                    </div>    
                                :null}


                                {editAddressAndExtraInformation=== true?
                                    <div>
                                        <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>

                                        <div>
                                            <div className={Style.titlePaddign}>
                                                <BigOneWithDot text="Address"></BigOneWithDot>
                                                <div  style={{display:'flex', margin:'0px 0px 0px auto'}}>                                                    
                                                    <div disable={loading} style={{backgroundColor:'rgb(220, 220, 220)', marginRight:'10px'}} onClick={cancelEditAddressAndExteraInformation} className={Style.editBtn}><Cancel sx={{color:'#EA005A'}}></Cancel></div>
                                                    <div disable={loading} style={{backgroundColor:'black'}} onClick={editAddressAndExplaintionSection}  className={Style.editBtn}>{loading === true?<Loader width='20px' color='white'></Loader>:<Done sx={{color:'rgb(255, 255, 255)',fontSize:'20px'}}></Done>}</div>
                                                </div>
                                            </div>
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
                                    </div>
                                :editAddressAndExtraInformation=== false?
                                    <div>
                                        {addresses !== null?
                                            <div>
                                            <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                                                <div className={Style.titlePaddign}>
                                                    <div className={Style.titlePaddign}>
                                                        <div style={{textAlign:'right'}}>
                                                        <BigOneWithDot text="Address"></BigOneWithDot>
                                                        </div>
                                                        <div onClick={editAddressAndExtraInformationFunc} className={Style.editBtn}><Edit sx={{color:'rgb(255, 255, 255)'}}></Edit></div>
                                                    </div>
                                                    {/* <div style={{textAlign:'left' , width:'50%' , display:'felex', alignContent:'center'}}><Button style={{color:'rgb(162, 162, 162)'}} variant="outlined" >ویرایش</Button></div> */}
                                                </div>
                                                <Row className="g-0"  style={{padding:'30px 0px 0px 0px'}}>
                                                    <div className={Style.littleTitleDiv}>
                                                        <LittleOneNormal text='Addresses'></LittleOneNormal>
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
                                                                            Address {i+1}
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                                
                                                                <Row className="g-0"  style={{padding:'5px 0px 5px 0px'}}>
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
                                                                                            <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>State:</span>
                                                                                            {data.province}
                                                                                        </span>
                                                                                    :null}
                                                                                </Grid>
                                                                                <Grid style={{padding:'0px 10px 5px 10px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >

                                                                                    {data.city !== null?
                                                                                        <span >
                                                                                            <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>City:</span>
                                                                                            {data.city}
                                                                                        </span>
                                                                                    :null}
                                                                                </Grid>


                                                                                <Grid style={{padding:'0px 0x 5px 0px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >
                                                                                    {data.neighbourhood !== null?
                                                                                        <span style={{padding:'9px 10px 9px 10px' , borderRadius:'8px' , textAlign:'right' , backgroundColor:'white'}}>
                                                                                            <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>Neighborhood:</span>
                                                                                            {data.neighbourhood}
                                                                                        </span>
                                                                                    :null} 
                                                                                </Grid>
                                                                                <Grid style={{padding:'0px 0px 5px 0px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >

                                                                                    {data.street !== null?
                                                                                        <span style={{ display:'flex', alignItems:'center', justifyContent:'center' ,padding:'0px 10px 0px 0px'}}>
                                                                                            <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>Street:</span>
                                                                                            {data.street}
                                                                                        </span>
                                                                                    :null}
                                                                                </Grid>
                                                                                <Grid style={{padding:'0px 0px 5px 0px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >
                                                                                    {data.plate !== null?
                                                                                        <span style={{padding:'9px 10px 9px 10px' , borderRadius:'8px' , textAlign:'right' , marginRight:'10px' , backgroundColor:'white'}}>
                                                                                            <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>Plate:</span>
                                                                                            {data.plate}
                                                                                        </span>
                                                                                    :null}
                                                                                </Grid>
                                                                                <Grid style={{padding:'0px 0px 5px 0px' , display:'flex', alignItems:'center', justifyContent:'center'}} item xs="auto"  >
                                                                                    {data.postalCode !== null?
                                                                                        <span style={{padding:'9px 10px 9px 10px'  , borderRadius:'8px' , textAlign:'right'  , backgroundColor:'white'}}>
                                                                                            <span style={{color:'rgb(109, 109, 109)' , fontSize:'13px'}}>Postal code:</span>
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
                                        <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)', margin:'10px 0px 10px 0px'}}></Divider>
                                        {explanations !== null?
                                            <div>
                                                <Row className="g-0" style={{padding:'5px 0px 5px 0px'}}>
                                                    <Col style={{padding:'5px 0px 0px 0px'}} xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} >
                                                        <div style={{padding:'0px 10px 0px 10px'}} >

                                                            <LittleOneNormal text='Extra explaintion'></LittleOneNormal>
                                                            <p style={{fontSize:'15px' , color:'black' , padding:'0px 5x 0px 5px'}}>{explanations}</p>
                                                        </div>   
                                                    </Col>
                                                </Row>
                                            </div>
                                        :null}
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
                                        <div style={{marginBottom:'30px'}}>
                                            {calls.map((f , j)=>{
                                                return(
                                                    <Fragment>
                                                    <span style={{padding:'0px 10px 10px 0px'}}>{f[0]}</span>
                                                        {f[1].map((e , i)=>{                                           
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
                                                                                            <span className={Style.callStatus}><CallMadeIcon sx={{color:'#009a4a'}}></CallMadeIcon><span className={Style.callStatusText}>{new Date(e.callDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' , hour12: false})}</span></span>
                                                                                        :e.callStatus === false?   
                                                                                            <span className={Style.callStatus}><CallMissedOutgoingIcon sx={{color:'red'}}></CallMissedOutgoingIcon><span className={Style.callStatusText}>{new Date(e.callDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' , hour12: false})}</span></span>
                                                                                        :null}
                                                                                    </div>
                                                                                    <div className={Style.callDropDownCallType}  >
                                                                                        <span>دلیل تماس:</span>{callType.filter(w=>{return w.value === e.callReason})[0].pr}
                                                                                    </div>
                                                                                </div>
                                                                                <div className={Style.phoneNum} >
                                                                                    {e.countryCode}-{e.phoneNumber}
                                                                                </div>
                                                                            </div>
                                                                        </Typography>
                                                                        </AccordionSummary>
                                                                        <AccordionDetails>
                                                                        <Typography>
                                                                            <div className={Style.subToolsForCall}>

                                                                                {e.callStatus === true?
                                                                                    <div style={{color:'#009a4a'}} className={Style.rightTools}>
                                                                                        تماس برقرار شد
                                                                                    </div>
                                                                                :e.callStatus === false?   
                                                                                    <div style={{color:'red'}} className={Style.rightTools}>
                                                                                        تماس برقرار نشد
                                                                                    </div>
                                                                                :null}
                                                                                <div  className={Style.leftTools}>
                                                                                    <div className={Style.callBtn}>
                                                                                        <div className={Style.btm}>     
                                                                                            <a onClick={()=>{props.setTargetDocForCall({status:true , docId : props.targetDocForCall.docId , phoneNumber:`${e.phoneNumber}` , countryCode:`${e.countryCode}`}); }} href={`tel:${e.countryCode}${e.phoneNumber}`}>
                                                                                            <button>
                                                                                                <Call sx={{fontSize:'20px'}}></Call>
                                                                                            </button>
                                                                                            </a>
                                                                                            <div className={Style.number}>
                                                                                            {e.countryCode}-{e.phoneNumber}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div> 
                                                                                </div>
                                                                            </div>     
                                                                            <hr className={Style.dashLine}></hr> 
                                                                            <div className={Style.chosenInvoiceDiv}>
                                                                                <span>
                                                                                    درخواست هدف
                                                                                </span>    
                                                                                <div className={Style.callChosenInvoice}>
                                                                                    <span>درخواستی انتخاب نشده است</span>  
                                                                                </div>                                                                
                                                                            </div>
                                                                            <hr className={Style.dashLine}></hr>                
                                                                            <div className={Style.discriptionDiv}>
                                                                                <span>
                                                                                    توضیحات مختصر
                                                                                </span> 
                                                                                {e.description === ""?
                                                                                    <div className={Style.callDiscription}>
                                                                                        توضیحاتی نوشته نشده است 
                                                                                    </div>                                                                
                                                                                :
                                                                                    <div className={Style.callDiscriptionItSelf}>
                                                                                        {e.description}
                                                                                    </div>   
                                                                                }   
                                                                            </div>              
                                                                        </Typography>
                                                                        </AccordionDetails>
                                                                    </Accordion>
                                                                </div>
                                                            )
                                                        })}
                                                    </Fragment>
                                                )
                                            })}
                                        </div>
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
              <ShowCustomerPortal setSuccessToast={props.setSuccessToast} successToast={props.successToast} persons={props.persons} showCustomer={props.showCustomer} setShowCustomer={props.setShowCustomer}  ></ShowCustomerPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}


export default ShowCustomer;