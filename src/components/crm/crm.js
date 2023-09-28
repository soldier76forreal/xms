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
import { Avatar, CircularProgress, Divider } from '@mui/material';
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
import InfiniteScroll from 'react-infinite-scroller';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'    
import WhatsAppModal from './whatsAppModal';
import CallModal from './callModal';
import EditCustomer from './editCustomer';
import FilterCrm from '../../tools/navs/filterCrm';
import ShowCustomer from './showCustomer';
import prFlag from '../../assets/per.png';
import NoData from '../../tools/navs/noData';
import RetryError from '../../tools/buttons/retryError';
import ReactDom from 'react-dom';
import Loader from '../../tools/loader/loader';
import { useSelector , useDispatch } from 'react-redux';
import SearchBar from '../../tools/navs/searchModule';
import { Compress } from '@mui/icons-material';
import PersoneCardMinimized from './personeCardMinimized';
import ExpandIcon from '@mui/icons-material/Expand';
import { actions } from '../../store/store';
const CrmPortal = (props) =>{
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const webSections = useContext(WebSections);
    const history = useHistory()
    var decoded = jwtDecode(authCtx.token);
    const MySwal = withReactContent(Swal);
    const dispatch = useDispatch()
    // set a new call
    const [openWhatsAppModal, setOpenWhatsAppModal] = useState(false);
    const [whatsAppMsgList, setWhatsAppMsgList] = useState([]);
    const [newCallStatus , setNewCallStatus] = useState({status:false , id:''});
    const [newCustomer , setNewCustomer] = useState(false);
    const [successToast , setSuccessToast] = useState({status:false , msg:''});

    const [searchForPerson , setSearchForPerson] = useState({searching:'' , loading:false , retry:false});

    const [targetDocForCall , setTargetDocForCall ] = useState({docId:'' , phoneNumber:'' , countryCode:'' , status:false})
    const [openCallModal , setOpenCallModal] = useState({status:false , list:[]});

    const [editCustomer , setEditCustomer] = useState({status:false , theCustomer:[]});

    const [showCustomer , setShowCustomer] = useState({status:false , id:''});
    const [tileCompress , setTileCompress] = useState(false);

    const crmRefresh = useSelector((state) => state.crmRefresh);
    const customerToShow = useSelector((state) => state.customerToShow);
    const crmLoading = useSelector((state) => state.crmLoading);
    const crmLimit = useSelector((state) => state.crmLimit);
    const crmHasMore = useSelector((state) => state.crmHasMore);
    const searchForCustomer = useSelector((state) => state.searchForCrm);
  





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
            setSuccessToast({status:true , msg:'فرد مورد نظر شما با موفقیت حذف شد'});
            dispatch(actions.misRefresh())
            const closingSuccessMsgTimeOut = setTimeout(()=>{setSuccessToast({status:false , msg:'فرد مورد نظر شما با موفقیت حذف شد'})}, 3000);
        }catch(err){
            console.log(err);
        }
    }

    return(
        <Fragment>
            {/* overal components */}
            <ShowCustomer successToast={successToast} setSuccessToast={setSuccessToast} persons={customerToShow}  showCustomer={showCustomer} setShowCustomer={setShowCustomer}></ShowCustomer>
            <NewCall  successToast={successToast} setSuccessToast={setSuccessToast}  targetDocForCall={targetDocForCall} newCallStatus={targetDocForCall} setNewCallStatus={setTargetDocForCall}></NewCall>
            <OpenIconSpeedDial  onClick={()=>{setNewCustomer(true); history.push('#newCustomer')}}></OpenIconSpeedDial>
            <NewCustomer  successToast={successToast} setSuccessToast={setSuccessToast} newCustomer={newCustomer} setNewCustomer={setNewCustomer}></NewCustomer>
            <EditCustomer  successToast={successToast} setSuccessToast={setSuccessToast} editCustomer={editCustomer} setEditCustomer={setEditCustomer}></EditCustomer>
            <SuccessMsg openMsg={successToast.status} msg={successToast.msg}></SuccessMsg>  
            <WhatsAppModal whatsAppMsgList={whatsAppMsgList} openWhatsAppModal={openWhatsAppModal} setOpenWhatsAppModal={setOpenWhatsAppModal}></WhatsAppModal>
            <CallModal targetDocForCall={targetDocForCall} setTargetDocForCall={setTargetDocForCall}  setOpenCallModal={setOpenCallModal} openCallModal={openCallModal}></CallModal>
            <div style={{maxWidth:'1500px' , height:'98vh' , padding:'0px 5px 0px 5px'}}  className={Style.ovDiv}>
                <div style={{marginTop:'6px'}} className={Style.topToolsDiv}>
                    <div className={Style.searchDiv}> 
                        <SearchBar></SearchBar>
                    </div>
                    <div onClick={()=>{setTileCompress(!tileCompress)}} className={Style.tileChange}>
                        {tileCompress === true?
                            <ExpandIcon sx={{color:'white'}}></ExpandIcon>
                        :tileCompress === false?
                            <Compress sx={{color:'white'}}></Compress>
                        :null}
                    </div>
                </div>
                
                <Divider sx={{borderBottomWidth:'1px' , marginTop:'10px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                {/* <div>
                    <Row style={{padding:'0px 10px 0px 10px'}}>
                        <Col style={{padding:'5px 0px 5px 0px'}} xs={12} sm={12} md={6} lg={6} xl={6} xxl={6}>
                            <div  dir='rtl' style={{backgroundColor:'#000' , marginBottom:'0px' , display:'flex' , alignItems:'center'}} className={`${Style.invoiceCard} ${Style.fadeIn}` }>
                                <div  style={{ padding:'10px 10px 10px 10px' ,  alignItems:'center' , display:'flex' , height:'100%'}}>
                                    <Avatar
                                        alt="Remy Sharp"
                                        src={jwtDecode(authCtx.token).profileImage  === undefined && authCtx.login === false ?ProfilePhoto:jwtDecode(authCtx.token).profileImage !== undefined && authCtx.login === true ? `${authCtx.defaultTargetApi}/uploads/${jwtDecode(authCtx.token).profileImage.filename}`:null}
                                        sx={{ width: 38, height: 38 }}
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
                                        <EditIcon className={Style.editIcon} sx={{color:'#fff' , fontSize:"16px"}}></EditIcon>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col style={{padding:'5px'}} xs={12} sm={12} md={6} lg={6} xl={6} xxl={6}>
                            <FilterCrm searchForCustomer={searchForCustomer} setSearchForCustomer={setSearchForCustomer}></FilterCrm>
                        </Col>
                    </Row>

                </div> */}
                {customerToShow.length === 0 && crmLoading.loading === false && crmLoading.retry === false?
                    <div style={{height:'70vh' , display:'flex' , justifyContent:'center' , alignItems:'center'}}>
                        <NoData caption='مشتری ای برای نمایش وجود ندارد'></NoData>
                    </div>
                :customerToShow.length > 0 && crmLoading.loading === false && crmLoading.retry === false? 
                <div style={{overflow:'auto'}}>

                        {crmLoading.loading === false
                        && searchForCustomer.searched.length === 0?
                            <InfiniteScroll
                                loadMore={()=>{dispatch(actions.notfiMore())}}
                                pageStart={0}
                                hasMore={crmHasMore}                    
                                loader={<div style={{display:'flex', marginTop:'10px', justifyContent:'center', alignItem:'center'}}><Loader width='30px' color='black'></Loader></div>}
                            >
                                <Row style={{padding:'0px 0px 0px 0px' , margin:'0px auto 0px auto' , maxWidth:'1480px',overflowX:'hidden'}}>
                                    {customerToShow.map((data , i) =>{
                                        if(data !==undefined){
                                            return(
                                                <Col style={{padding:'5px'}} xs={12} sm={6} md={6} lg={4} xl={3} xxl={3}>
                                                    {
                                                    tileCompress=== false?
                                                        <PersoneCard  setShowCustomer={setShowCustomer} showCustomer={showCustomer} editCustomer={editCustomer} setEditCustomer={setEditCustomer} setOpenCallModal={setOpenCallModal} setWhatsAppMsgList={setWhatsAppMsgList} setOpenWhatsAppModal={setOpenWhatsAppModal} deleteModal={deleteModal}  data={data} key={i} setTargetDocForCall={setTargetDocForCall}  targetDocForCall={targetDocForCall}></PersoneCard>   
                                                    :tileCompress===true?
                                                        <PersoneCardMinimized setShowCustomer={setShowCustomer} showCustomer={showCustomer} editCustomer={editCustomer} setEditCustomer={setEditCustomer} setOpenCallModal={setOpenCallModal} setWhatsAppMsgList={setWhatsAppMsgList} setOpenWhatsAppModal={setOpenWhatsAppModal} deleteModal={deleteModal}  data={data} key={i} setTargetDocForCall={setTargetDocForCall}  targetDocForCall={targetDocForCall}></PersoneCardMinimized>
                                                    :null
                                                    }   
                                                </Col>
                                            )
                                        }
                                    })} 
                                </Row>  
                            </InfiniteScroll>
                        : searchForCustomer.searched.length !== 0?
                            <InfiniteScroll
                                loadMore={()=>{dispatch(actions.notfiMoreSearch())}}
                                pageStart={0}
                                hasMore={crmHasMore}                    
                                loader={<div style={{display:'flex', marginTop:'10px', justifyContent:'center', alignItem:'center'}}><Loader width='30px' color='black'></Loader></div>}
                            >
                                <Row style={{padding:'0px 0px 0px 0px' , margin:'0px auto 0px auto' , maxWidth:'1480px',overflowX:'hidden'}}>
                                    {searchForCustomer.searched.map((data , i) =>{
                                        if(data !==undefined){
                                            return(
                                                <Col style={{padding:'5px'}} xs={12} sm={6} md={6} lg={4} xl={3} xxl={3}>
                                                    {
                                                    tileCompress=== false?
                                                        <PersoneCard  setShowCustomer={setShowCustomer} showCustomer={showCustomer} editCustomer={editCustomer} setEditCustomer={setEditCustomer} setOpenCallModal={setOpenCallModal} setWhatsAppMsgList={setWhatsAppMsgList} setOpenWhatsAppModal={setOpenWhatsAppModal} deleteModal={deleteModal}  data={data.item} key={i} setTargetDocForCall={setTargetDocForCall}  targetDocForCall={targetDocForCall}></PersoneCard>   
                                                    :tileCompress===true?
                                                        <PersoneCardMinimized setShowCustomer={setShowCustomer} showCustomer={showCustomer} editCustomer={editCustomer} setEditCustomer={setEditCustomer} setOpenCallModal={setOpenCallModal} setWhatsAppMsgList={setWhatsAppMsgList} setOpenWhatsAppModal={setOpenWhatsAppModal} deleteModal={deleteModal}  data={data.item} key={i} setTargetDocForCall={setTargetDocForCall}  targetDocForCall={targetDocForCall}></PersoneCardMinimized>
                                                    :null
                                                    }   
                                                </Col>
                                            )
                                        }
                                    })}
                                </Row>  
                            </InfiniteScroll>
                        :null}
                    
                </div>              
                    :crmLoading.loading === false && crmLoading.retry === true?
                        <Fragment>
                            <div style={{display:'flex' , justifyContent:'center' , alignItems:'center' , textAlign:'center' , minHeight:'50vh' }}>
                                <RetryError></RetryError>
                            </div>       
                        </Fragment>
                    : crmLoading.loading === true && crmLoading.retry === false ?
                        <div style={{display:'flex' , justifyContent:'center' , alignItems:'center', minHeight:'65vh' }}>
                            <Loader width='45px' color='black'></Loader>
                        </div>       
                    :null}
            </div>

        </Fragment>
    )
}

const Crm = (props)=>{
    return(
        <Fragment>
            {ReactDom.createPortal(
                <CrmPortal>

                </CrmPortal>
                ,
                document.getElementById('crm')
                )}
        </Fragment>
    )
}
export default Crm;