//css
import Style from './crm.module.scss';
//hooks
import { Fragment , useState  , useContext , useEffect} from 'react';
//frameworks
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
//imports
import NormalTopFilterSection from '../../tools/crm/normalTopFilterSection';
import CustomerTable from '../../tools/crm/customerTable';
import NewCall from './newCall';
import PersoneCard from './personeCard';
import Filter from '../../tools/navs/filter';
import { Avatar, CircularProgress } from '@mui/material';
import jwtDecode from 'jwt-decode';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import WebSections from '../../contextApi/webSection';
import EditIcon from '@mui/icons-material/Edit';
import ProfilePhoto from '../../assets/imagePlaceHolder.png';
import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import { useHistory } from 'react-router-dom';
import NewCustomer from './newCustomer';
import SuccessMsg from '../../tools/navs/successMsg';
import InfiniteScroll from 'react-infinite-scroll-component';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'    
import WhatsAppModal from './whatsAppModal';
import CallModal from './callModal';
import EditCustomer from './editCustomer';
import FilterCrm from '../../tools/navs/filterCrm';
import ShowCustomer from './showCustomer';
import prFlag from '../../assets/per.png';
import NoData from '../../tools/navs/noData';

const Crm = (props) =>{
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const webSections = useContext(WebSections);
    const history = useHistory()
    var decoded = jwtDecode(authCtx.token);
    const MySwal = withReactContent(Swal);
    // set a new call
    const [openWhatsAppModal, setOpenWhatsAppModal] = useState(false);
    const [whatsAppMsgList, setWhatsAppMsgList] = useState([]);
    const [newCallStatus , setNewCallStatus] = useState({status:false , id:''});
    const [newCustomer , setNewCustomer] = useState(false);
    const [successToast , setSuccessToast] = useState({status:false , msg:''});
    const [persons , setPersons] = useState([]);
    const [allPersons , setAllPersons] = useState([]);
    const [targetToDelete , setTargetToDelete] = useState('');
    const [loadingStatus , setLoadingStatus] = useState({loading:true , retry:false});
    const [hasMore , setHasMore] = useState(true);
    const [limit , setLimit] = useState(10);
    const [searchForPerson , setSearchForPerson] = useState({searching:'' , loading:false , retry:false});
    const [refresh , setRefresh] = useState(2)
    const [targetDocForCall , setTargetDocForCall ] = useState({docId:'' , phoneNumber:'' , countryCode:'' , status:false})
    const [openCallModal , setOpenCallModal] = useState({status:false , list:[]});

    const [editCustomer , setEditCustomer] = useState({status:false , theCustomer:[]});

    const [showCustomer , setShowCustomer] = useState({status:false , id:''});

    const [searchForCustomer , setSearchForCustomer] = useState({searching:'' , loading:false , retry:false});

    const getInvoiceData = async() =>{
        setLoadingStatus({loading:true , retry:false})
        try{
            const response = await authCtx.jwtInst({
                method:'get',
                url:`${axiosGlobal.defaultTargetApi}/crm/getAllCustomer`,
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            
            setAllPersons([...response.data])
                var temp = [];
                if(response.data.length !==0){
                    if(limit>response.data.length){
                        setLimit(response.data.length);
                        temp.length =0
                        for(var i = 0 ; i < limit; i++){
                            if(response.data !== undefined){
                                temp.push(response.data[i]);
                            }
                        }
                        setPersons([...temp])
                        setHasMore(false)
                    }else if(limit<=response.data.length){
                        setHasMore(true)
                        setLimit(limit+20);
                        temp.length =0
                        for(var j = 0 ; j < limit; j++){
                            if(response.data[j] !== undefined){
                                temp.push(response.data[j]);
                            }
                        }
                        setPersons([...temp])
                    }
                }

            setLoadingStatus({loading:false , retry:false})
        }catch(err){
            setTimeout(()=>{
                setLoadingStatus({loading:false , retry:true})
            }, 10000);
            console.log(err);
        }
    }
    const notifMore = () =>{
        setTimeout(()=>{
        
            var temp = [];
            if(allPersons.length !==0){
                if(limit>allPersons.length){
                    setLimit(allPersons.length);
                    temp.length =0
                    for(var i = 0 ; i < limit; i++){
                        if(allPersons[i] !== undefined){
                            temp.push(allPersons[i]);
                        }
                    }
                    setPersons([...temp])
                    setHasMore(false)
                }else if(limit<=allPersons.length){
                    setHasMore(true)
                    setLimit(limit+20);
                    temp.length =0
                    for(var j = 0 ; j < limit; j++){
                        if(allPersons[j] !== undefined){
                            temp.push(allPersons[j]);
                        }
                        
                    }
                    setPersons([...temp])
                }
            }
        }, 1000);
        
      }
    useEffect(() => {
        getInvoiceData()
    }, [refresh]);


    const callSet = ()=>{


    }



    //-----------------------------------------------------------------------------------------------------------------delete invoice section
    const deleteModal = (id) =>{
        var id = id;
        Swal.fire({
            title: 'مطمئن هستید؟',
            text: "این فرد از لیست مشتری ها حذف می شود",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'بله',
            cancelButtonText:'خیر'
          }).then((result) => {
            if (result.isConfirmed) {
                deleteDocRec(id)
            }
          })
    }
    const deleteDocRec = async(id)=>{
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/crm/deletePerson`,
                data:{id:id},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            setRefresh(Math.random())
            setSuccessToast({status:true , msg:'فرد مورد نظر شما با موفقیت حذف شد'});
            setRefresh(Math.random())
            const closingSuccessMsgTimeOut = setTimeout(()=>{setSuccessToast({status:false , msg:'فرد مورد نظر شما با موفقیت حذف شد'})}, 3000);
        }catch(err){
            console.log(err);
        }
    }

    return(
        <Fragment>
            {/* overal components */}
            <ShowCustomer persons={persons}  showCustomer={showCustomer} setShowCustomer={setShowCustomer}></ShowCustomer>
            <NewCall successToast={successToast} setSuccessToast={setSuccessToast} setRefresh={setRefresh} targetDocForCall={targetDocForCall} newCallStatus={targetDocForCall} setNewCallStatus={setTargetDocForCall}></NewCall>
            <OpenIconSpeedDial  onClick={()=>{setNewCustomer(true); history.push('#newCustomer')}}></OpenIconSpeedDial>
            <NewCustomer setRefresh={setRefresh} successToast={successToast} setSuccessToast={setSuccessToast} newCustomer={newCustomer} setNewCustomer={setNewCustomer}></NewCustomer>
            <EditCustomer setRefresh={setRefresh} successToast={successToast} setSuccessToast={setSuccessToast} editCustomer={editCustomer} setEditCustomer={setEditCustomer}></EditCustomer>
            <SuccessMsg openMsg={successToast.status} msg={successToast.msg}></SuccessMsg>  
            <WhatsAppModal whatsAppMsgList={whatsAppMsgList} openWhatsAppModal={openWhatsAppModal} setOpenWhatsAppModal={setOpenWhatsAppModal}></WhatsAppModal>
            <CallModal targetDocForCall={targetDocForCall} setTargetDocForCall={setTargetDocForCall}  setOpenCallModal={setOpenCallModal} openCallModal={openCallModal}></CallModal>
            <div style={{maxWidth:'1500px'}} dir='rtl' className={Style.ovDiv}>
                <div>
                    <Row style={{padding:'0px 10px 5px 10px'}}>
                        <Col style={{padding:'5px'}} xs={12} sm={12} md={6} lg={6} xl={6} xxl={6}>
                            <div  dir='rtl' style={{backgroundColor:'#000' , marginBottom:'10px' , display:'flex' , alignItems:'center'}} className={`${Style.invoiceCard} ${Style.fadeIn}` }>
                                <div  style={{ padding:'10px 10px 10px 10px' ,  alignItems:'center' , display:'flex' , height:'100%'}}>
                                    <Avatar
                                        alt="Remy Sharp"
                                        src={jwtDecode(authCtx.token).profileImage  === undefined && authCtx.login === false ?ProfilePhoto:jwtDecode(authCtx.token).profileImage !== undefined && authCtx.login === true ? `${authCtx.defaultTargetApi}/uploads/${jwtDecode(authCtx.token).profileImage.filename}`:null}
                                        sx={{ width: 46, height: 46 }}
                                    />
                                        <div style={{padding:'2px 8px 5px 0px' , display:'inline-block'}}>
                                            <div className={Style.titleProfile}>
                                                <span>
                                                    {jwtDecode(authCtx.token).firstName} {jwtDecode(authCtx.token).lastName}
                                                </span>
                                            </div>
                                            <div className={Style.disProfAccess}>
                                                {`نقش ها:${decoded.access.map(data=>{
                                                    for(var i=0 ; webSections.listOfSections.length >i; i++){
                                                        if(webSections.listOfSections[i].value === data){
                                                            return(
                                                                `${webSections.listOfSections[i].jobTitle}` 
                                                            )
                                                        }
                                                    }
                                                    })}`}
                                            </div>
                                        </div>
                                </div>
                                <div style={{float:'left' , margin:'0px auto 0px 10px'}}>
                                    <div className={Style.editBtn}>
                                        <EditIcon className={Style.editIcon} sx={{color:'#fff' , fontSize:"22px"}}></EditIcon>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col style={{padding:'5px'}} xs={12} sm={12} md={6} lg={6} xl={6} xxl={6}>
                            <FilterCrm searchForCustomer={searchForCustomer} setSearchForCustomer={setSearchForCustomer}></FilterCrm>
                        </Col>
                    </Row>

                </div>
                <div style={{padding:'0px 0px 0px 0px' }} dir='ltr'>
                {persons.length === 0?
                    <div style={{height:'70vh' , display:'flex' , justifyContent:'center' , alignItems:'center'}}>
                        <NoData caption='مشتری ای برای نمایش وجود ندارد'></NoData>
                    </div>
                :persons.length > 0 && loadingStatus.loading === false && loadingStatus.retry === false?                
                    <InfiniteScroll
                        dataLength={persons.length}
                        next={notifMore}
                        hasMore={hasMore}                    
                        loader={<div style={{display:'flex', marginTop:'10px', justifyContent:'center', alignItem:'center'}}><CircularProgress size='35px' color='inherit'></CircularProgress></div>}
                    >
                        {loadingStatus.loading === false
                        && searchForPerson.searching === ''?
                        <Row style={{padding:'0px 10px 0px 10px' }}>
                            {persons.map((data , i) =>{
                                if(data !==undefined){
                                    return(
                                        <Col style={{padding:'5px' }} xs={12} sm={6} md={6} lg={4} xl={3} xxl={3}>
                                            <PersoneCard  setShowCustomer={setShowCustomer} showCustomer={showCustomer} editCustomer={editCustomer} setEditCustomer={setEditCustomer} setOpenCallModal={setOpenCallModal} setWhatsAppMsgList={setWhatsAppMsgList} setOpenWhatsAppModal={setOpenWhatsAppModal} deleteModal={deleteModal}  data={data} key={i} setTargetDocForCall={setTargetDocForCall}  targetDocForCall={targetDocForCall}></PersoneCard>   
                                        </Col>
                                    )
                                }
                            })} 
                        </Row>  
                        : searchForPerson.searching !== ''?
                            persons.map((data , i) =>{
                                return(
                                    <PersoneCard setSuccessToast={setSuccessToast} successToast={successToast} setRefresh={setRefresh}   data={data} key={i} setNewCallStatus={setNewCallStatus} newCallStatus={newCallStatus}></PersoneCard>
                                )
                            })
                        :null
                        }
                    </InfiniteScroll>
                :loadingStatus.loading === false && loadingStatus.retry === true?
                    <Button variant="outlined" color="error">
                        نلاش مجدد
                    </Button>
                :null}
                    {/* <CustomerTable newCallStatus={newCallStatus} setNewCallStatus={setNewCallStatus}></CustomerTable> */}
                </div>
            </div>

        </Fragment>
    )
}
export default Crm;