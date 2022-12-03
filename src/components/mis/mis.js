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
import { Avatar, Chip } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import Prof from '../../assets/imagePlaceHolder.png'
import AuthContext from '../authAndConnections/auth';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ShowMore from './showMore';

const Mis = () =>{
    const [newPreInvoiceStatus , setNewPreInvoiceStatus] = useState(false);
    const [openContactList, setOpenContactList] = useState({

        bottom: false
    
      });

    const [invoice , setInvoice] = useState([]);
    const [limit , setLimit] = useState(20);
    const [targetToSend , setTargetToSend] = useState('');
    const authCtx = useContext(AuthContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
      setTargetToSend(event.currentTarget.id);  
      setAnchorEl(event.currentTarget);

    };
    const handleClose = () => {
        setAnchorEl(null);
    }
    const selectContact = () =>{
        handleClose()
        setOpenContactList({ ...openContactList, ['bottom']: true }); 
    }
    const getInvoiceData = async() =>{
        try{
            const response = await axios({
                method:'get',
                url:`${authCtx.defaultTargetApi}/mis/getInvoices`,
                params:{limit:limit},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            setInvoice([...response.data.rs])
            console.log(response.data.rs)
        }catch(err){
            console.log(err);
        }
    }
    useEffect(() => {
        getInvoiceData()
    }, [limit]);
    return(
        <Fragment>
            {/* <MainNav></MainNav> */}
            <OpenIconSpeedDial  onClick={()=>{setNewPreInvoiceStatus(true)}}></OpenIconSpeedDial>
            <ShowMore selectContact={selectContact} anchorEl={anchorEl} setAnchorEl={setAnchorEl} open={open} handleClick={handleClick} handleClose={handleClose}></ShowMore>
            <NewPreInvoice openContactList={openContactList} setOpenContactList={setOpenContactList}  setNewPreInvoiceStatus={setNewPreInvoiceStatus} newPreInvoiceStatus={newPreInvoiceStatus}></NewPreInvoice>
            <ContactList targetToSend={targetToSend} state={openContactList} setState={setOpenContactList}></ContactList>
            <div style={{maxWidth:'700px'}} className={Style.overalDiv}>
                {invoice.map((data , i)=>{
                    return(
                        <div key={i} dir='rtl' style={{backgroundColor:data.status === 0?'#fff': data.status === 1?'rgb(239, 156, 78)' :data.status === 2?'rgb(112, 236, 139)':null , marginBottom:'10px'}} className={Style.invoiceCard}>
                            <div
                            id={data._id}
                            aria-controls={open ? 'demo-customized-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                            variant="contained"
                            disableElevation
                            onClick={handleClick}
                            endIcon={<KeyboardArrowDownIcon />}
                            className={Style.sideBtn}>
                                <MoreVertIcon ></MoreVertIcon>
                            </div>
                            <div style={{width:'95%' , padding:'15px 10px 15px 10px' , height:'100%'}}>
                                <Row>
                                    <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div className={Style.top}>
                                            <div dir='rtl' className={Style.effectBy}>
                                                ارسال شده توسط<span> محمد رضایی </span>
                                            </div>
                                            <div className={Style.date}>
                                                تاریخ ثبت:<span>1401/02/1</span>
                                            </div>
                                        </div>
                                        <div className={Style.title}>
                                            <span>
                                                {data.preInvoice.productName}
                                            </span>
                                            <span>-</span>
                                            <span dir='rtl' className={Style.meter}>{data.preInvoice.meterage} متر</span>
                                        </div>
                                        <div className={Style.dis}>
                                            آدرس مقصد:<span>{data.preInvoice.destination}</span>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </div>

                    )
                })}
                
            </div>
        </Fragment>
    )
}
export default Mis;