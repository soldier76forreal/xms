import { Fragment , useState , useContext , useRef , useEffect } from 'react';
import Style from './newCall.module.scss'
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl , Col} from 'react-bootstrap';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import MuiInput from '../../tools/inputs/muiInput';
import MuiSelect from '../../tools/inputs/muiSelect';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import axios from 'axios';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import ReactDom from 'react-dom';
import Datep from '../../tools/inputs/datePicker';
import { Call, WhatsApp } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import AuthContext from '../authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import { CircularProgress, FormControlLabel, Switch } from '@mui/material';
import { useHistory } from 'react-router-dom';
import ToggleBtn from '../../tools/buttons/toggleBtn';
import MultiSelect from '../../tools/inputs/multiSelect';
import ErrorModal from '../../tools/navs/errorModal';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';
import CustomSelect from '../../tools/inputs/customSelect';

import { Email, Facebook, Instagram, LinkedIn, Web } from '@mui/icons-material';
import IconRender from '../functions/iconRender';

const NewCallPortal = (props) =>{
        const authContext = useContext(AuthContext);
        const axiosGlobal = useContext(AxiosGlobal);
        var decoded = jwtDecode(authContext.token);
        const dispatch = useDispatch()
        const history = useHistory();
        
        //pre invoice states
        const targetDocForCall = useSelector((state) => state.setTargetDocForCom);

        const [communicationDate , setCommunicationDate] = useState(Date.now());
        const [communicationReason , setCommunicationReason] = useState('');
        const [targetRequest , setTargetRequest] = useState([]);
        const [errorStatus , setErrorStatus] = useState(null);

        const [invoices , setInvoices] = useState([]);
        const [loading , setLoading] = useState(false);

        const [communicationStatus , setCommunicationStatus] = useState(null);
        const [communicationDescription , setCommunicationDescription] = useState('');



        const [platformType , setPlatformType] = useState('web');
        const [channels , setChannels] = useState([]);
        const [theChannel , setTheChannel] = useState('');

        useEffect(() => {
            if(targetDocForCall.status === true){
                const platform = targetDocForCall.platform
                const contactInfos = targetDocForCall.docItSelf.contactInfo
                setPlatformType(targetDocForCall.platform)
                setTheChannel(targetDocForCall.channel)
                if(platformType === 'call'){
                    if(contactInfos.phoneNumbers!==null){
                        var phones = contactInfos.phoneNumbers.map((e , i)=>{
                            return {id:i,text:`+${e.countryCode}${e.number}`}
                        })
                        setChannels([...phones])
                    }else setChannels([...[]])
                }else if(platformType === 'web'){
                    if(contactInfos.websites!==null){
                        var webs = contactInfos.websites.map((e , i)=>{
                            return {id:i,text:e.website}
                        })
                        setChannels([...webs])
                    }else setChannels([...[]])
                }else if(platformType === 'li'){
                    if(contactInfos.linkedIns!==null){
                        var linkedIns = contactInfos.linkedIns.map((e , i)=>{
                            return {id:i,text:e.linkedIn}
                        })
                        setChannels([...linkedIns])
                    }else setChannels([...[]])
                }else if(platformType === 'in'){
                    if(contactInfos.instagrams!==null){
                        var instagrams = contactInfos.instagrams.map((e , i)=>{
                            return {id:i,text:e.instagram}
                        })
                        setChannels([...instagrams])
                    }else setChannels([...[]])
                }else if(platformType === 'em'){
                    if(contactInfos.emails!==null){
                        var emails = contactInfos.emails.map((e , i)=>{
                            return {id:i,text:e.email}
                        })
                        setChannels([...emails])
                    }else setChannels([...[]])
                }else if(platformType === 'wa'){
                    if(contactInfos.phoneNumbers!==null){
                        var phones = contactInfos.phoneNumbers.map((e , i)=>{
                            if(e.whatsApp === true){
                                return {id:i,text:`+${e.countryCode}${e.number}`}
                            }
                        })
                        setChannels([...phones])
                    }else setChannels([...[]])
                }else if(platformType === 'fa'){
                    if(contactInfos.facebooks!==null){
                        var facebooks = contactInfos.facebooks.map((e , i)=>{
                            return {id:i,text:e.facebook}
                        })
                        setChannels([...facebooks])
                    }else setChannels([...[]])
                }else if(platformType === 'bt'){
                    if(contactInfos.botims!==null){
                        var botims = contactInfos.botims.map((e , i)=>{
                            return {id:i,text:e.botim}
                        })
                        setChannels([...botims])
                    }else setChannels([...[]])
                }
            }
            
        }, [targetDocForCall.status ]);

        useEffect(() => {
            if(targetDocForCall.status === true){
            
                const platform = targetDocForCall.platform

                const contactInfos = targetDocForCall.docItSelf.contactInfo
                setTheChannel('')
                if(platformType === 'call'){
                    if(contactInfos.phoneNumbers!==null){
                        var phones = contactInfos.phoneNumbers.map((e , i)=>{
                            return {id:i,text:`+${e.countryCode}${e.number}`}
                        })
                        setChannels([...phones])
                        
                    }else setChannels([...[]])
                }else if(platformType === 'web'){
                    if(contactInfos.websites!==null){
                        var webs = contactInfos.websites.map((e , i)=>{
                            return {id:i,text:e.website}
                        })
                        setChannels([...webs])
                    }else setChannels([...[]])
                }else if(platformType === 'li'){
                    if(contactInfos.linkedIns!==null){
                        var linkedIns = contactInfos.linkedIns.map((e , i)=>{
                            return {id:i,text:e.linkedIn}
                        })
                        setChannels([...linkedIns])
                    }else setChannels([...[]])
                }else if(platformType === 'in'){
                    if(contactInfos.instagrams!==null){
                        var instagrams = contactInfos.instagrams.map((e , i)=>{
                            return {id:i,text:e.instagram}
                        })
                        setChannels([...instagrams])
                    }else setChannels([...[]])
                }else if(platformType === 'em'){
                    if(contactInfos.emails!==null){
                        var emails = contactInfos.emails.map((e , i)=>{
                            return {id:i,text:e.email}
                        })
                        setChannels([...emails])
                    }else setChannels([...[]])
                }else if(platformType === 'wa'){
                    if(contactInfos.phoneNumbers!==null){
                        var phones = contactInfos.phoneNumbers.map((e , i)=>{
                            if(e.whatsApp === true){
                                return {id:i,text:`+${e.countryCode}${e.number}`}
                            }
                        })
                        setChannels([...phones])
                    }else setChannels([...[]])
                }else if(platformType === 'fa'){
                    if(contactInfos.facebooks!==null){
                        var facebooks = contactInfos.facebooks.map((e , i)=>{
                            return {id:i,text:e.facebook}
                        })
                        setChannels([...facebooks])
                    }else setChannels([...[]])
                }else if(platformType === 'bt'){
                    if(contactInfos.botims!==null){
                        var botims = contactInfos.botims.map((e , i)=>{
                            return {id:i,text:e.botim}
                        })
                        setChannels([...botims])
                    }else setChannels([...[]])
                }
                setTheChannel(targetDocForCall.channel)

            }
        }, [platformType]);
        
        const saveNewCommunication = async() =>{
            setLoading(true)
            if(communicationDate === '' || communicationReason==='' || communicationStatus=== null){
                setErrorStatus(true)
                setLoading(false)
            }else{

            
                const data = {
                    docId:targetDocForCall.docItSelf._id,
                    platform:platformType,
                    channel:theChannel,
                    communicationDate:communicationDate,
                    communicationReason:communicationReason,
                    targetRequest:targetRequest,
                    communicationStatus:communicationStatus,
                    communicationDescription:communicationDescription
                }
                
                try{
                    const response = await authContext.jwtInst({
                        method:'post',
                        url:`${axiosGlobal.defaultTargetApi}/crm/saveNewCommunication`,
                        data:data,
                        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                    })
                    dispatch(actions.crmRefresh())
                    setTimeout(()=>{
                        setLoading(false)
                        props.setSuccessToast({status:true , msg:'New communication has been submitted!'});
                        const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false ,msg:'New communication has been submitted!'})}, 3000);
                        dispatch(actions.setTargetDocForCommunication({docItSelf:'' , status:false , platform:'' , channel:''}))
                    }, 800)
                    
                }catch(err){               
                    console.log(err);
                    setLoading(false)
                }
            }
        }


        // const getAllInvoices = async() =>{
 
        //     try{
        //         const response = await authContext.jwtInst({
        //             method:'get',
        //             params:{id:props.newCallStatus.docId},
        //             url:`${axiosGlobal.defaultTargetApi}/mis/getAllInvoicesForSelect`,
        //             config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
        //         })
        //         var temp = [...response.data];
                
        //         temp.sort((a,b)=>{
        //             return new Date(b.preInvoice.insertDate) - new Date(a.preInvoice.insertDate);
        //         })
        //         var temp2 = []
        //         for(var i=0 ; temp.length>i ; i++){
        //             temp2.push({value:temp[i]._id , name:`${temp[i].preInvoice.productName}-${temp[i].preInvoice.meterage}`})
        //         }
        //         setInvoices([...temp2])
        //     }catch(err){               
        //         console.log(err);
        //     }
        // }

        const platformIcons = (e) =>{
            var platformWithIcon = [
                {id:'call' , text:'Phone call' , icon:<Call sx={{color:'#007BFF' , fontSize:'70px'}}></Call>},
                {id:'web' , text:'Website' , icon:<Web sx={{color:'black' , fontSize:'70px'}}></Web>},
                {id:'in' , text:'Instagram' , icon:<Instagram sx={{color:'#BC2A8D' , fontSize:'70px'}}></Instagram>},
                {id:'li' , text:'Linked In' , icon:<LinkedIn sx={{color:'#1877F2' , fontSize:'70px'}}></LinkedIn>},
                {id:'wa' , text:'WhatsApp' , icon:<WhatsApp sx={{color:'green' , fontSize:'70px'}}></WhatsApp>},
                {id:'fa' , text:'Facebook' , icon:<Facebook sx={{color:'#1877F2' , fontSize:'70px'}}></Facebook>},
                {id:'bt' , text:'Botim' , icon:<Facebook sx={{color:'green' , fontSize:'70px'}}></Facebook>},
                {id:'em' , text:'Email' , icon:<Email sx={{color:'#77DD77' , fontSize:'70px'}}> </Email>}
              ]
              const filterTheArryForIcon = platformWithIcon.filter(event =>{
                return e === event.id
              })[0]
              return filterTheArryForIcon.icon
        }
        // useEffect(() => {
        //     if(props.newCallStatus.status === true){
        //             getAllInvoices()
        //     }
        // }, [props.newCallStatus.status]);
    return(
        <Fragment>
                <ErrorModal  errorContext='to submit a communication; Enter the date of the communication, the reason for the communication and the status of the communication'  setErrorStatus={setErrorStatus} errorStatus={errorStatus}></ErrorModal>
                <div style={targetDocForCall.status === true?{display:'block'}:{display:'none'}}  className={targetDocForCall.status === true? `${Style.newInvoice} ${Style.fadeIn}` : targetDocForCall.status === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                    <div className={Style.topSection}>
                        <div onClick={()=>{dispatch(actions.setTargetDocForCommunication({docItSelf:{} , status:false , platform:'' , channel:''})); history.push('#newPreInvoices')}} className={Style.backBtn}><ArrowBackIosIcon className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                        <div className={Style.topTitle}>Submit communication</div>
                    </div>
                    <div style={{overflowY:'scroll' , height:'95vh'}}>              
                        <div style={{padding:'20px 25px 60px 25px'}}  className={Style.formDiv}>
                            <Row>
                                <Col  xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div className={Style.callBtnDiv} >
                                        <div className={Style.callBtnTitle}>communicated by:</div>
                                        <div style={{ marginBottom:'10px' , marginRight:'0px'}}>
                                            <div style={{marginBottom:'8px'}} className={Style.platformIcon}>
                                                <IconRender botimSize='68px' size='70px' iconName={platformType}></IconRender>
                                            </div>
                                            <div style={{marginBottom:'10px'}} className={Style.platformSelect}>
                                                <label style={{marginBottom:'5px' , fontSize:'13px'}}>Platform</label>
                                                <CustomSelect value={platformType}  onChange={(e)=>{setPlatformType(e.id)}} selectType='platformsWithIcon'> </CustomSelect>
                                            </div>
                                            <div style={{marginBottom:'10px'}} className={Style.platformSelect}>
                                                <label style={{marginBottom:'5px' , fontSize:'13px'}}>Channel</label>
                                                <CustomSelect  platformChannels={channels} value={theChannel} onChange={(e)=>{setTheChannel(e.text)}}  selectType='platformChannels'> </CustomSelect>
                                            </div>
                                            {/* <div className={Style.btm}>     
                                                <a href={`tel:${props.targetDocForCall.countryCode}-${props.targetDocForCall.phoneNumber}`}>
                                                    <button>
                                                        <Call></Call>
                                                    </button>
                                                </a>
                                                <div style={{marginLeft:'5px' , display:'flex' ,width:'150px' , fontSize:'18px' , padding:'5px 10px 0px 10px'}}>
                                                    {props.targetDocForCall.countryCode}-{props.targetDocForCall.phoneNumber}
                                                </div>
                                            </div> */}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            <Row style={{marginBottom:'10px'}}>
                                <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div style={{textAlign:'left'}}>
                                        <label style={{marginBottom:'5px' , fontSize:'13px'}}>Call date</label>
                                        <Datep  onChange={(e)=>{setCommunicationDate(e)}}></Datep>    
                                    </div>
                                </Col>
                            </Row>
                            <Row style={{marginBottom:'10px'}}>
                                <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div style={{textAlign:'left'}}>
                                        <div>
                                            <label style={{marginBottom:'5px' , fontSize:'13px'}}>Call reason</label>
                                        </div>
                                        <ToggleBtn setCallReason={setCommunicationReason} type='callType'></ToggleBtn>
                                    </div>  
                                </Col>
                            </Row>
                            {/* <Row style={{marginBottom:'10px'}}>
                                <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div>
                                        <div>
                                            <label style={{marginBottom:'5px' , fontSize:'13px'}}>درخواست هدف</label>
                                        </div>
                                            <MultiSelect options={invoices}  setTargetRequest={setTargetRequest} type='normal' width='100%'></MultiSelect>

                                        <CustomSelect options={allCustomer} onChange={(e)=>{setCompanyName(e.value)}} selectType='selectCustomer' placeholder="مشتری ها"></CustomSelect>
                                    </div>
                                </Col>
                            </Row> */}
                            <Row style={{marginBottom:'10px'}}>
                                <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div style={{textAlign:'left'}}>
                                        <div>
                                            <label style={{marginBottom:'5px' , fontSize:'13px'}}>Communication status</label>
                                        </div>
                                        <ToggleBtn setCallStatus={setCommunicationStatus} type='callStatus'></ToggleBtn>
                                    </div>  
                                </Col>
                            </Row>
                            <Row style={{marginBottom:'10px'}}>
                                <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div style={{textAlign:'left'}}>
                                        <label style={{marginBottom:'5px' , fontSize:'13px'}}>Brief explanation</label>
                                        <textarea onChange={(e)=>{setCommunicationDescription(e.target.value)}}  id="w3review" name="w3review" rows="5" style={{width:'100%'}} cols="50"></textarea>                                            
                                    </div>      
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <div className={Style.btnDiv}>
                                        <bottom onClick={saveNewCommunication} className={Style.submitBtn}>
                                            {loading === true ?<CircularProgress size='25px' color='inherit'></CircularProgress> :'Submit'}
                                        </bottom>
                                    </div>
                                </Col>
                            </Row>
                        </div>      
                    </div>
                </div>

       </Fragment>
    )
}

const NewCall = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <NewCallPortal successToast={props.successToast} setSuccessToast={props.setSuccessToast}   ></NewCallPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default NewCall;