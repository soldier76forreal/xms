import { Fragment , useState , useContext , useEffect } from 'react';
import Style from './mis.module.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,Button, Col} from 'react-bootstrap';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import MainNav from '../../tools/navs/mainNav';
import SubNav from '../../tools/navs/subNav';
import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import NewPreInvoice from './newPreInvoice';
import ContactList from './contactList';
import axios from 'axios';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { Avatar, Chip, CircularProgress } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import Prof from '../../assets/imagePlaceHolder.png'
import AuthContext from '../authAndConnections/auth';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ShowMore from './showMore';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import moment from 'jalali-moment'
import SuccessMsg from '../../tools/navs/successMsg';
import ShowFullPost from './showFullPost';
import { useHistory } from 'react-router-dom';
import Modal from '../../tools/modal/modal';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'    
import NewUser from './newUser';
import EditInvoice from './editInvoice';
import ProfilePhoto from '../../assets/imagePlaceHolder.png';
import WebSections from '../../contextApi/webSection';
import EditIcon from '@mui/icons-material/Edit';
import Filter from '../../tools/navs/filter';
import Fuse from 'fuse.js';
import Notfications from './notfications';
import InfiniteScroll from 'react-infinite-scroll-component';
import NoData from '../../tools/navs/noData';
import RetryError from '../../tools/buttons/retryError';

const Mis = () =>{
    const urlContext = useContext(AuthContext);
    const history = useHistory();
    const MySwal = withReactContent(Swal)
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const webSections = useContext(WebSections);
    var decoded = jwtDecode(authCtx.token);

    
    //edit invoice status
    const [openEditInvoice , setOpenEditInvoice] = useState({status:false , id:null});
    
    //new preInvoice
    const [newPreInvoiceStatus , setNewPreInvoiceStatus] = useState(false);

    //open the post
    const [postOpen , setPostOpen] = useState({status:false , id:null});
    const [showPost , setShowPost] = useState(false);

    //searching in posts
    const [searchForInvoices , setSearchForInvoices] = useState({searching:'' , loading:false , retry:false});
    const [searchedData , setSearchedData] = useState([]);


    //page utils
    const [contectRefresh , setContectRefresh] = useState(2);
    const [successToast , setSuccessToast] = useState({status:false , msg:''});
    const [loadingStatus , setLoadingStatus] = useState({loading:true , retry:false});
    const [hasMore , setHasMore] = useState(true);
    const [limit , setLimit] = useState(10);
    const [targetToSend , setTargetToSend] = useState('');


    //handle back botton
    const [ locationKeys, setLocationKeys ] = useState([])



      

    //get invoices states
    const [invoice , setInvoice] = useState([]);
    const [invoiceForShow , setInvoiceForShow] = useState([]);

    //-----------------------------------------------------------------------------------------------------------------dropdown menu section
    //open dropdown menu
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClose = () => {
        setAnchorEl(null);
    }


    //-----------------------------------------------------------------------------------------------------------------shaire to contact section
    //shaire to contact
    const [openContactList, setOpenContactList] = useState({
        bottom: false
    });
    const selectContact = () =>{
        handleClose()
        setOpenContactList({ ...openContactList, ['bottom']: true }); 
    }
    


    //-----------------------------------------------------------------------------------------------------------------delete invoice section
    const deleteModal = () =>{
        handleClose()
        Swal.fire({
            
            title: 'مطمئن هستید؟',
            text: "این درخواست از لیست درخواست های شما حذف می شود",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'بله',
            cancelButtonText:'خیر'
          }).then((result) => {
            if (result.isConfirmed) {
                deleteDocRec()

            }
          })
    }
    const deleteDocRec = async()=>{

        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/mis/deleteInvoices`,
                data:{id:targetToSend , userId:decoded.id},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            
            setContectRefresh(Math.random())
            setSuccessToast({status:true , msg:'درخواست شما با موفقیت حذف شد'});
            const closingSuccessMsgTimeOut = setTimeout(()=>{setSuccessToast({status:false , msg:'درخواست شما با موفقیت حذف شد'})}, 3000);

        }catch(err){
            console.log(err);
        }
    }





    const openEditInv = () =>{
        handleClose()
        setOpenEditInvoice({status:true , id:openEditInvoice.id})
        history.push('#editRequest')
    }


    const getInvoiceData = async() =>{
        setLoadingStatus({loading:true , retry:false})
        try{
            const response = await authCtx.jwtInst({
                method:'get',
                url:`${axiosGlobal.defaultTargetApi}/mis/getInvoices`,
                params:{id:jwtDecode(localStorage.getItem('accessToken')).id},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            var filterd = response.data.rs.filter(e=>{return e.doc !==null})
            setInvoice([...filterd])
                var temp = [];
                if(filterd.length !==0){
                    if(limit>filterd.length){
                        setLimit(filterd.length);
                        temp.length =0
                        for(var i = 0 ; i < limit; i++){
                            if(filterd !== undefined){
                                temp.push(filterd[i]);
                            }
                        }
                        setInvoiceForShow([...temp])
                        setHasMore(false)
                    }else if(limit<=filterd.length){
                        setHasMore(true)
                        setLimit(limit+20);
                        temp.length =0
                        for(var j = 0 ; j < limit; j++){
                            if(filterd[j] !== undefined){
                                temp.push(filterd[j]);
                            }
                        }
                        setInvoiceForShow([...temp])
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
    useEffect(() => {       
        authCtx.socket?.on("newPing", (data) => {
            setContectRefresh(data.ping);
        });
    }, [authCtx.socket]);

    useEffect(() => {
        getInvoiceData()
    }, [ contectRefresh]);

        const fuse = new Fuse(invoice, {
            keys: ['doc.preInvoice.productName', 'doc.preInvoice.meterage' , 'doc.preInvoice.destination']
        })
        const searching = async() =>{        
            const result =  fuse.search(searchForInvoices.searching);

            setSearchForInvoices({searching:searchForInvoices.searching , loading:false , retry:false}); 
            setLoadingStatus({loading:false , retry:false})
            setTimeout(()=>{
                var temp = [];
                if(result.length !==0){
                    if(limit>result.length){
                        setLimit(result.length);
                        temp.length =0
                        for(var i = 0 ; i < limit; i++){
                            if(result[i] !== undefined){
                                temp.push(result[i]);
                            }
                        }
                        setSearchedData([...temp]);
                        setHasMore(false)
                    }else if(limit<=result.length){
                        setHasMore(true)
                        setLimit(limit+20);
                        temp.length =0
                        for(var j = 0 ; j < limit; j++){
                            if(result[j] !== undefined){
                                temp.push(result[j]);
                            }
                            
                        }
                        setSearchedData([...temp]);
                    }
                }
            }, 1000);
            
        }
        useEffect(() => {
            if(searchForInvoices.searching !== ''){
                setLoadingStatus({loading:true , retry:false})
                setSearchForInvoices({searching:searchForInvoices.searching , loading:true , retry:false}); 
            }
            let categorySearchTimeOut = setTimeout(()=>{
                searching()
                
            }, 1000)
            return () => {
                clearTimeout(categorySearchTimeOut);
            }
        }, [searchForInvoices.searching]);

 
        const notifMore = () =>{
            setTimeout(()=>{
            
                var temp = [];
                if(invoice.length !==0){
                    if(limit>invoice.length){
                        setLimit(invoice.length);
                        temp.length =0
                        for(var i = 0 ; i < limit; i++){
                            if(invoice[i] !== undefined){
                                temp.push(invoice[i]);
                            }
                        }
                        setInvoiceForShow([...temp])
                        setHasMore(false)
                    }else if(limit<=invoice.length){
                        setHasMore(true)
                        setLimit(limit+20);
                        temp.length =0
                        for(var j = 0 ; j < limit; j++){
                            if(invoice[j] !== undefined){
                                temp.push(invoice[j]);
                            }
                            
                        }
                        setInvoiceForShow([...temp])
                    }
                }
            }, 1000);
            
          }

  
useEffect(() => {
  return history.listen(location => {
    if (history.action === 'PUSH') {
      setLocationKeys([ location.key ])
    }

    if (history.action === 'POP') {
      if (locationKeys[1] === location.key) {
        setLocationKeys(([ _, ...keys ]) => keys)

        // Handle forward event

      } else {
          if(showPost === true){
                setLocationKeys((keys) => [ location.key, ...keys ])
                setShowPost(false); 
                setPostOpen({status:false , id:showPost.id})
            }
            
            if(newPreInvoiceStatus === true){
                setLocationKeys((keys) => [ location.key, ...keys ])
                setNewPreInvoiceStatus(false)
            
            }
        }
    }
  })
}, [ locationKeys])




    return(
        <Fragment>
            {/* <MainNav></MainNav> */}
            {/* refresh */}
            <NewUser setContectRefresh={setContectRefresh}></NewUser>
            <EditInvoice setContectRefresh={setContectRefresh} openEditInvoice={openEditInvoice} setOpenEditInvoice={setOpenEditInvoice} setSuccessToast={setSuccessToast} data={ openEditInvoice.status === true?invoice[openEditInvoice.id]:null}></EditInvoice>
            <ShowFullPost setContectRefresh={setContectRefresh}  setSuccessToast={setSuccessToast}  data={ postOpen.status === true?invoice[postOpen.id]:null} setPostOpen={setPostOpen} setShowPost={setShowPost} showPost={showPost}></ShowFullPost>
            <OpenIconSpeedDial  onClick={()=>{setNewPreInvoiceStatus(true); history.push('#newPreInvoices')}}></OpenIconSpeedDial>
            <ShowMore openEditInv={openEditInv} deleteModal={deleteModal}  selectContact={selectContact} anchorEl={anchorEl} setAnchorEl={setAnchorEl} open={open}  handleClose={handleClose}></ShowMore>
            <NewPreInvoice setTargetToSend={setTargetToSend} setContectRefresh={setContectRefresh} setSuccessToast={setSuccessToast}  openContactList={openContactList} setOpenContactList={setOpenContactList}  setNewPreInvoiceStatus={setNewPreInvoiceStatus} newPreInvoiceStatus={newPreInvoiceStatus}></NewPreInvoice>
            <ContactList  setContectRefresh={setContectRefresh} setSuccessToast={setSuccessToast} targetToSend={targetToSend} state={openContactList} setState={setOpenContactList}></ContactList>
            <SuccessMsg openMsg={successToast.status} msg={successToast.msg}></SuccessMsg>  
                <div style={{maxWidth:'700px' , padding:'0px 0px 18px 0px'}} className={Style.overalDiv}>
                    <div style={{marginBottom:'10px'}}>
                        <Filter searchForInvoices={searchForInvoices} setSearchForInvoices={setSearchForInvoices}></Filter>
                    </div>
                    <div  dir='rtl' style={{backgroundColor:'#000' , marginBottom:'10px' , display:'flex' , alignItems:'center'}} className={`${Style.invoiceCard} ${Style.fadeIn}` }>
                        <div  style={{width:'91%' , padding:'10px 10px 10px 10px' ,  alignItems:'center' , display:'flex' , height:'100%'}}>
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
                        <div className={Style.editBtn}>
                            <EditIcon className={Style.editIcon} sx={{color:'#fff' , fontSize:"22px"}}></EditIcon>
                        </div>
                    </div>
                    {loadingStatus.loading === false && loadingStatus.retry === true?
                        <Fragment>
                            <div style={{display:'flex' , justifyContent:'center' , alignItems:'center' , textAlign:'center' , minHeight:'50vh' }}>
                                <RetryError onClick={getInvoiceData}></RetryError>
                            </div>       
                        </Fragment>
                    :loadingStatus.loading === true && loadingStatus.retry === false?
                        <div style={{display:'flex' , justifyContent:'center' , alignItems:'center', minHeight:'60vh' }}>
                            <CircularProgress size='44px' color='inherit'></CircularProgress>
                        </div>
                    :loadingStatus.loading === false && loadingStatus.retry === false?
                        
                   
                    <div>
                        {invoice.length === 0?
                            <div style={{display:'flex' , justifyContent:'center' , alignItems:'center', minHeight:'50vh' }}>
                                <NoData caption='درخواستی برای نمایش وجود ندارد'></NoData>
                            </div>
                            
                        :invoice.length !== 0?
                            
                            <InfiniteScroll
                                dataLength={invoiceForShow.length}
                                next={notifMore}
                                hasMore={hasMore}
                                                    
                                loader={<div style={{display:'flex', marginTop:'10px', justifyContent:'center', alignItem:'center'}}><CircularProgress size='35px' color='inherit'></CircularProgress></div>}
                                >
                            
                            {loadingStatus.loading === false
                            && searchForInvoices.searching === ''?
                                invoiceForShow.map((data , i)=>{
                                    if(data !== undefined){
                                        return(
                                            <div  key={i} dir='rtl' style={{backgroundColor:data.doc.status === 0?'#fff': data.doc.status === 1?'rgb(239, 156, 78)' :data.doc.status === 2?'rgb(112, 236, 139)':null , marginBottom:'10px'}} className={postOpen.status === true && postOpen.id === i ?`${Style.invoiceCard} ${Style.fadeOut}`:`${Style.invoiceCard} ${Style.fadeIn}` }>
                                                <div
                                                id={data.doc._id}
                                                aria-controls={open ? 'demo-customized-menu' : undefined}
                                                aria-haspopup="true"
                                                aria-expanded={open ? 'true' : undefined}
                                                variant="contained"
                                                disableElevation
                                                onClick={(e)=>{
                                                    setTargetToSend(e.currentTarget.id);  
                                                    setAnchorEl(e.currentTarget);
                                                    setOpenEditInvoice({status:false , id:i})
                                                }}
                                                endIcon={<KeyboardArrowDownIcon />}
                                                className={Style.sideBtn}>
                                                    <MoreVertIcon ></MoreVertIcon>
                                                </div>
                                                <div onClick={()=>{setPostOpen({status:true , id:i}); setShowPost(true); history.push('#showFullPost')}} style={{width:'95%' , padding:'10px 10px 10px 10px' , height:'100%'}}>
                                                    <Row>
                                                        <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                            <div className={Style.top}>
                                                                {data.user !== null ?
                                                                    <div dir='rtl' className={Style.effectBy}>
                                                                        ارسال شده توسط : <span>{data.user.firstName} {data.user.lastName}</span>
                                                                    </div>
                                                                :null}
                                                                {data.user !== null ?
                                                                    <div className={Style.date}>
                                                                        تاریخ ارسال:<span>{moment(data.date, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}</span>
                                                                    </div>
                                                                :data.user === null ?
                                                                    <div className={Style.date}>
                                                                        تاریخ ثبت:<span>{moment(data.date, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}</span>
                                                                    </div>
                                                                :null}
                                                            </div>
                                                            <div style={{padding:'5px 0px 5px 0px'}}>
                                                                <div className={Style.title}>
                                                                    <span>
                                                                        {data.doc.preInvoice.productName}
                                                                    </span>
                                                                    <span>-</span>
                                                                    <span dir='rtl' className={Style.meter}>{data.doc.preInvoice.meterage === null ? "متراژ:نامشخص":data.doc.preInvoice.meterage !== null? `${data.doc.preInvoice.meterage} متر`:null}</span>
                                                                    {data.doc.preInvoice.dimentions !== undefined?<span>-</span>:null}
                                                                    <span dir='rtl' className={Style.meter}>{data.doc.preInvoice.dimentions !== undefined?`${data.doc.preInvoice.dimentions.width}*${data.doc.preInvoice.dimentions.height}*${data.doc.preInvoice.dimentions.diameter}`:null}</span>
                                                                </div>
                                                                <div className={Style.dis}>
                                                                    آدرس مقصد:<span>{data.doc.preInvoice.destination}</span>
                                                                </div>
                                                            </div>
                                                            <div className={Style.top}>
                                                                {data.user !== null ?
                                                                    <div className={Style.date2}>
                                                                        تاریخ ارسال:<span>{moment(data.date, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}</span>
                                                                    </div>
                                                                :data.user === null ?
                                                                    <div className={Style.date2}>
                                                                        تاریخ ثبت:<span>{moment(data.date, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}</span>
                                                                    </div>
                                                                :null}
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </div>
                                        )
                                    }
                                })  
                            : searchForInvoices.searching !== ''?
                                searchedData.map((data , i)=>{
                                    if(data.item.doc){    
                                        return(
                                                <div  key={i} dir='rtl' style={{backgroundColor:data.item.doc.status === 0?'#fff': data.item.doc.status === 1?'rgb(239, 156, 78)' :data.item.doc.status === 2?'rgb(112, 236, 139)':null , marginBottom:'10px'}} className={postOpen.status === true && postOpen.id === i ?`${Style.invoiceCard} ${Style.fadeOut}`:`${Style.invoiceCard} ${Style.fadeIn}` }>
                                                    <div
                                                    id={data.item.doc._id}
                                                    aria-controls={open ? 'demo-customized-menu' : undefined}
                                                    aria-haspopup="true"
                                                    aria-expanded={open ? 'true' : undefined}
                                                    variant="contained"
                                                    disableElevation
                                                    onClick={(e)=>{
                                                        setTargetToSend(e.currentTarget.id);  
                                                        setAnchorEl(e.currentTarget);
                                                        setOpenEditInvoice({status:false , id:i})
                                                    }}
                                                    endIcon={<KeyboardArrowDownIcon />}
                                                    className={Style.sideBtn}>
                                                        <MoreVertIcon ></MoreVertIcon>
                                                    </div>
                                                    <div onClick={()=>{setPostOpen({status:true , id:i}); setShowPost(true); history.push('#showFullPost')}} style={{width:'95%' , padding:'10px 10px 10px 10px' , height:'100%'}}>
                                                        <Row>
                                                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                                <div className={Style.top}>
                                                                    {data.item.user !== null ?
                                                                        <div dir='rtl' className={Style.effectBy}>
                                                                            ارسال شده توسط : <span>{data.item.user.firstName} {data.item.user.lastName}</span>
                                                                        </div>
                                                                    :null}
                                                                    {data.item.user !== null ?
                                                                        <div className={Style.date}>
                                                                            تاریخ ارسال:<span>{moment(data.item.date, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}</span>
                                                                        </div>
                                                                    :data.item.user === null ?
                                                                        <div className={Style.date}>
                                                                            تاریخ ثبت:<span>{moment(data.item.date, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}</span>
                                                                        </div>
                                                                    :null}
                                                                </div>
                                                                <div style={{padding:'5px 0px 5px 0px'}}>
                                                                    <div className={Style.title}>
                                                                        <span>
                                                                            {data.item.doc.preInvoice.productName}
                                                                        </span>
                                                                        <span>-</span>
                                                                        <span dir='rtl' className={Style.meter}>{data.item.doc.preInvoice.meterage === null ? "متراژ:نامشخص":data.item.doc.preInvoice.meterage !== null? `متر ${data.item.doc.preInvoice.meterage}`:null}</span>
                                                                        {data.item.doc.preInvoice.dimentions !== undefined?<span>-</span>:null}
                                                                        <span dir='rtl' className={Style.meter}>{data.item.doc.preInvoice.dimentions !== undefined?`${data.item.doc.preInvoice.dimentions.width}*${data.item.doc.preInvoice.dimentions.height}*${data.item.doc.preInvoice.dimentions.diameter}`:null}</span>
                                                                    </div>
                                                                    <div className={Style.dis}>
                                                                        آدرس مقصد:<span>{data.item.doc.preInvoice.destination}</span>
                                                                    </div>
                                                                </div>
                                                                <div className={Style.top}>
                                                                    {data.item.user !== null ?
                                                                        <div className={Style.date2}>
                                                                            تاریخ ارسال:<span>{moment(data.item.date, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}</span>
                                                                        </div>
                                                                    :data.item.user === null ?
                                                                        <div className={Style.date2}>
                                                                            تاریخ ثبت:<span>{moment(data.item.date, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}</span>
                                                                        </div>
                                                                    :null}
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                </div>
                                            )
                                    }
                                })
                            :null
                        }
                            </InfiniteScroll>
                        :null}
                    </div>
                     :null}
                </div>

        </Fragment>
    )
}
export default Mis;