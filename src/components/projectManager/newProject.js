import { Fragment , useState , useContext , useRef , useEffect } from 'react';
import Style from './newProject.module.css'
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
import { Add, Delete, Diversity1, PlusOne } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import AuthContext from '../authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import { CircularProgress, FormControlLabel, Switch, Typography } from '@mui/material';
import { useHistory } from 'react-router-dom';
import MultiSelect from '../../tools/inputs/multiSelect';
import IconBotton from '../../tools/buttons/iconBtn';
import AddIcon from '@mui/icons-material/Add';
import NewCustomer from '../crm/newCustomer';
import CustomSelect from '../../tools/inputs/customSelect';
import { StyledDropZone } from 'react-drop-zone'
import 'react-drop-zone/dist/styles.css'
import { FileIcon , defaultStyles } from 'react-file-icon';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';
import TextInputNormal from '../../tools/inputs/textInputNormal';
import Slider from '@mui/material/Slider';
const NewProjectPortal = (props) =>{
        const authContext = useContext(AuthContext);
        const axiosGlobal = useContext(AxiosGlobal);
        var decoded = jwtDecode(authContext.token);
        const history = useHistory();
        const dispatch = useDispatch();
        const stoneNameRef = useRef();
        const meterageRef = useRef();
        const destRef = useRef();
        const companyNameRef = useRef();

        const invoiceDateRef = useRef();
        const costCnfRef = useRef();
        const costFobRef = useRef();
        const factoryPriceRef = useRef();
        const stoneThicknessRef = useRef();
        const stoneRateRef = useRef();
        const dateOfShipmentRef = useRef();

        //pre invoice states
  

        const [customer , setCustomer] = useState(null);
        const [orderType , setOrderType] = useState(null);
        const [status , setStatus] = useState(null);
        const [orderTitle , setOrderTitle] = useState('');
        const [quantity , setQuantity] = useState(null);
        const [material , setMaterial] = useState(null);
        const [doubleSided , setDoubleSided] = useState(false);
        const [designRequired , setDesignRequired] = useState(false);

        const [invoiceDate , setInvoiceDate] = useState(Date.now());

        
        const [uom , setUom] = useState(null);
        const [rate , setRate] = useState(null);
        const [totalAmount , setTotalAmount] = useState(null);
        const [graphicDesignCost , setGraphicDesignCost] = useState(null);
        const [shipDeliveryCost , setShipDeliveryCost] = useState(null);
        const [designDuration , setDesignDuration] = useState(null);
        const [printDuration , setPrintDuration] = useState(null);




        const [insertFactor , setInsertFactor] = useState(true);
        const [allCustomer , setAllCustomer] = useState([]);

        const [newCustomer , setNewCustomer] = useState(false);
        const [loading , setLoading] = useState(false);
        const [loadingAndSend , setLoadingAndSend] = useState(false);

        const [files , setFiles] = useState([]);
        
        const newInvoice = useSelector((state) => state.newInvoice);
        const newAddedCustomer = useSelector((state) => state.lastInsertedCustomer);
        const newProjects = useSelector((state) => state.newProject);

        
        const getAllCustomer = async() =>{
            try{
                const response = await authContext.jwtInst({
                    method:'get',
                    url:`${axiosGlobal.defaultTargetApi}/crm/allCustomerBasedOnUser`,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                var customerData = response.data.customer
                var tempArr = [];
                for(var i = 0 ; customerData.length > i ; i++){
                    if(customerData[i].personalInformation.companyName === null){
                        tempArr.push({id:customerData[i]._id , name:`${customerData[i].personalInformation.firstName} ${customerData[i].personalInformation.lastName}`})

                    }else{
                        tempArr.push({id:customerData[i]._id , name:`${customerData[i].personalInformation.companyName}`})

                    }
                }
                setAllCustomer([...tempArr])
            }catch(err){
                console.log(err);
            }
        }

        const checkIfnullOrEmpty = (j) =>{
            if(j !== null){
                if(j !== ''){
                    return j
                }
            }else if(j !== ''){
                if(j !== null){
                    return j
                }

            }else return null
        }
        const newPreInvoice = async() =>{
            setLoading(true)
            const data = {
                customer:checkIfnullOrEmpty(customer),
                orderType:checkIfnullOrEmpty(orderType),
                quantity:checkIfnullOrEmpty(quantity),
                orderTitle:checkIfnullOrEmpty(orderTitle),
                material:checkIfnullOrEmpty(material),
                status:checkIfnullOrEmpty(status),
                doubleSided:checkIfnullOrEmpty(doubleSided),
                designRequired:checkIfnullOrEmpty(designRequired),
                uom:checkIfnullOrEmpty(uom),
                rate:checkIfnullOrEmpty(rate),
                totalAmount:checkIfnullOrEmpty(totalAmount),
                graphicDesignCost:checkIfnullOrEmpty(graphicDesignCost),
                shipDeliveryCost:checkIfnullOrEmpty(shipDeliveryCost),
                designDuration:checkIfnullOrEmpty(designDuration),
                printDuration:checkIfnullOrEmpty(printDuration),
                insertDate:checkIfnullOrEmpty(invoiceDate),
                generatedBy:checkIfnullOrEmpty(decoded.id)
            }
            console.log(data)        
                    try{
                        const response = await authContext.jwtInst({
                            method:'post',
                            url:`${axiosGlobal.defaultTargetApi}/mis/newPreInvoice`,
                            data:data,
                            config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                        })
                        props.setSuccessToast({status:true , msg:'پیش فاکتور ایجاد شد'});
                        const closingNewPreInvoice = setTimeout(()=>{props.setNewPreInvoiceStatus(false)}, 500);
                        const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'پیش فاکتور ایجاد شد'})}, 3000);
                        const clearData = setTimeout(()=>{
                            setLoading(false)
                            setLoadingAndSend(false)
                            props.setContectRefresh(Math.random());
                        }, 1000);
                        // authContext.socket.emit("sendNotification", {
                        //     senderName: `${authContext.decoded.firstName}' '${authContext.decoded.lastName}`,
                        //     receiverName: post.username,
                        //     type,
                        //   });
                        return(
                            response.data
                        )
                    }catch(err){
                        console.log(err)
                        setLoadingAndSend(false)
                        setLoading(false)
                    }
        
        }

        useEffect(() => {

            if(newCustomer === true){
                props.setNewPreInvoiceStatus(false);
            }else if(newCustomer === false){
                props.setNewPreInvoiceStatus(true);
            }
        }, [newCustomer]);
        useEffect(() => {
            props.setNewPreInvoiceStatus(false);
        }, []);
        

        useEffect(() => {
            if(newInvoice !== false){
                const temp = allCustomer
                temp.push(newAddedCustomer)
                setAllCustomer([...temp])
                setCustomer(newAddedCustomer.id)
                
            }
        }, [newAddedCustomer]);
        
        useEffect(() => {
            getAllCustomer()
        }, []);
        
        
        const sendAndsave = async() =>{
            setLoadingAndSend(true)
            const data = await newPreInvoice()
            props.setTargetToSend(data._id);

            const closingNewPreInvoice = setTimeout(()=>{props.setOpenContactList({ ...props.openContactList, ['bottom']: true })}, 600);
        }

        
        const setFile =(file, text)=>{
            var temp=files
            
            for(var i = 0 ; file.length > i ; i++){
                temp.push(file[i])
               
            }
            setFiles([ ...temp])
        }

        const marks = [
            {
              value: 1,
              label: '1 D',
            },
            {
              value: 3,
              label: '3 D',
            },
            {
              value: 7,
              label: '7 D',
            },
            {
              value: 10,
              label: '10 D',
            },
            {
             value: 14,
             label: '14 D',
            },
            {
                value: 21,
                label: '21 D',
            },
            {
                value: 30,
                label: '30 D',
            },
          ];
          const CustomSliderStyles = {
            '& .MuiSlider-thumb': {
                color: "black"
            },
            '& .MuiSlider-track': {
                color: "black"
            },
            '& .MuiSlider-rail': {
                color: "rgb(224, 224, 224)"
            },
            '& .MuiSlider-active': {
                color: "rgb(255, 255, 255)"
            }
        };


        function designDurationFunc(value) {
            setDesignDuration(value)
          }
          
        function printDurationFunc(value) {
            setPrintDuration(value)
          }

        const rateFunc = (event) =>{
      
            if(event.input === 'rate'){
                setRate(event.value)
                const sum = event.value*quantity;
                setTotalAmount(sum)
            }else if(event.input === 'totalAmount'){
                setTotalAmount(event.value)
                const dvide = event.value/quantity;
                setRate(dvide)
            }
        }
        useEffect(() => {
            if(rate !== ''){
                const sum = rate*quantity;
                setTotalAmount(sum)

            }

        }, [quantity]);
    return(
        <Fragment>
                <NewCustomer  successToast={props.successToast} setSuccessToast={props.setSuccessToast} newCustomer={newCustomer} setNewCustomer={setNewCustomer}></NewCustomer>
                <div style={newProjects === true?{display:'block'}:{display:'none'}}  className={newProjects === true? `${Style.newInvoice} ${Style.fadeIn}` : newInvoice === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                    <div className={Style.topSection}>
                        <div onClick={()=>{dispatch(actions.toggleProject()); history.push('#closeProjects')}} className={Style.backBtn}><ArrowBackIosIcon className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                        <div className={Style.topTitle}>New invoice</div>
                    </div>
                    <div dir='ltr' style={{overflowY:'scroll' , height:'100vh' , padding:'0px 0px 40px 00px'}}>              
                            <div   className={Style.formDiv}>
                                <div className={Style.secTitle}>Pre invoice</div>
                                <div>
                                    <Row className="g-0">
                                        <Col style={{padding:'10px 5px 0px 0px' , zIndex:'3001'} } sm={10} md={10} lg={10} xl={10} xxl={10} xs={10}>
                                            <CustomSelect value={customer} options={allCustomer}  onChange={(e)=>{setCustomer(e.id)}} selectType='customers' placeholder="Customer"></CustomSelect>
                                        </Col>
                                        <Col style={{padding:'10px 0px 0px 5px' , zIndex:'2000'} } sm={2} md={2} lg={2} xl={2} xxl={2} xs={2}>
                                            <button onClick={()=>{dispatch(actions.toggleNewCustomer())}} style={{width:'100%' , height:'100%', backgroundColor:'black' , borderRadius:'5px' , border:'none'}}><Add sx={{color:'white'}}></Add></button>
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}} className="g-0">
                                        <Col style={{padding:'10px 5px 0px 0px' , zIndex:'1001'} } sm={6} md={6} lg={6} xl={6} xxl={6} xs={6}>
                                            <CustomSelect onChange={(e)=>{setOrderType(e.id)}}  selectType='orderType' placeholder="Order type"></CustomSelect>
                                        </Col>
                                        <Col style={{padding:'10px 0px 0px 5px' , zIndex:'2000'} } sm={6} md={6} lg={6} xl={6} xxl={6} xs={6}>
                                            <CustomSelect onChange={(e)=>{setStatus(e.id)}}  selectType='invoiceStatus' placeholder="Status"></CustomSelect>
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div dir='ltr' ref={stoneNameRef}>
                                                <TextInputNormal  value={orderTitle} onChange={(e)=>{setOrderTitle(e.target.value);}} placeholder='Order title'></TextInputNormal>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div>
                                                <TextInputNormal  value={quantity} onChange={(e)=>{setQuantity(e.target.value);}} placeholder='Quantity'></TextInputNormal>
                                            </div>  
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div ref={destRef}>
                                                <TextInputNormal  value={material} onChange={(e)=>{setMaterial(e.target.value);}}  placeholder='Material'></TextInputNormal>

                                            </div>      
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{ padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div ref={invoiceDateRef}>
                                                <label style={{marginBottom:'5px' , fontSize:'13px'}}>Invoice date</label>
                                                <Datep  onChange={(e)=>{setInvoiceDate(e)}}></Datep>                            
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'2px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div style={{marginRight:'0px', marginTop:'6px'}}  className={Style.secTitle}>
                                                <div dir='rtl' style={{display:'inline-block' , marginLeft:'20px' , float:'right'}}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch   
                                                        sx={{margin:'0px'}}
                                                        checked={doubleSided}
                                                        onChange={()=>{setDoubleSided(!doubleSided)}}
                                                        inputProps={{ 'aria-label': 'controlled' }} />
                                                    }
                                                />

                                                </div>
                                                <div style={{display:'inline-block', fontSize:'15px' ,fontFamily:'YekanRegular'}}>Double sided</div>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div style={{marginRight:'0px', marginTop:'6px'}}  className={Style.secTitle}>
                                                <div dir='rtl' style={{display:'inline-block' , marginLeft:'0px' , float:'right'}}>
                                                <FormControlLabel
                                                    
                                                    control={
                                                        <Switch   
                                                        sx={{margin:'0px'}}
                                                        checked={designRequired}
                                                        onChange={()=>{setDesignRequired(!designRequired)}}
                                                        inputProps={{ 'aria-label': 'controlled' }} />
                                                    }
                                                />

                                                </div>
                                                <div style={{display:'inline-block', fontSize:'15px' , fontFamily:'YekanRegular'}}>Design required</div>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <StyledDropZone
                                               multiple onDrop={setFile}
                                            />
                                        </Col>
                                    </Row>
                                      {files.length === 0?
                                            <div className={Style.uploadedItemsDiv}>
                                                {files.length === 0?
                                                    <div className={Style.emptyThingText}>No file has been added...</div>
                                                    :null  
                                                }
                                            </div>      
                                        :
                                            <div className={Style.uploadedItemsDiv}>
                                                <Row style={{width:'100%'}}>
                                                    {files.map((e,i)=>{
                                                        return(
                                                            
                                                            <Col style={{marginBottom:'8px',padding:'0px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                                <div className={Style.uploadItems}>
                                                                    <Delete onClick={()=>{var tem = files; tem.splice(i, 1); setFiles([...tem])}} sx={{fontSize:'23px' , width:'35px' , color:'red'}}></Delete>
                                                                    <div className={Style.iconDiv}>
                                                                        
                                                                        <FileIcon  extension={e.name.split(".")[e.name.split(".").length - 1]} {...defaultStyles[`${e.name.split(".")[e.name.split(".").length - 1]}`]} />
                                                                    </div>
                                                                    <div style={{maxWidth:'70%',whiteSpace:'nowrap', overflow:'hidden',textOverflow: 'ellipsis' , position:'absolute',left:'85px', fontSize:'13px'}}>{e.name}</div>
                                                                    
                                                                </div>
                                                                
                                                            </Col>
                                                        )
                                                    })}

                                                    
                                                </Row>
                                                {/* {files.length === 0?
                                                    <div className={Style.emptyThingText}>No file has been added...</div>
                                                    :null  
                                                } */}
                                            </div>    
                                        
                                        }                      

                                    {/* <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div  style={{display:'flex' , justifyContent:'center' , alignItems:'center'}} ref={destRef}>
                                                <div style={{padding:'0px 5px 0px 0px'}}>
                                                    <MuiInput value={dimentions.width===null?'':dimentions.width} onChange={(e)=>{setDimentions({width:e.target.value ,diameter:dimentions.diameter , height:dimentions.height}); setMeterErr({status:false , msg:''})}} err={meterErr} name='طول' type='cm' width='100%'></MuiInput>
                                                </div>
                                                <div style={{padding:'0px 5px 0px 5px'}}>
                                                    <MuiInput value={dimentions.height ===null?'': dimentions.height} onChange={(e)=>{setDimentions({width:dimentions.width , diameter:dimentions.diameter , height:e.target.value}); setMeterErr({status:false , msg:''})}} err={meterErr} name='عرض' type='cm' width='100%'></MuiInput>
                                                </div>
                                                <div style={{padding:'0px 0px 0px 5px'}}>
                                                    <MuiInput value={dimentions.diameter ===null?'':dimentions.diameter} onChange={(e)=>{setDimentions({width:dimentions.width , height:dimentions.height , diameter:e.target.value}); setMeterErr({status:false , msg:''})}} err={meterErr} name='قطر' type='cm' width='100%'></MuiInput>
                                                </div>
                                            
                                                
                              
                                            </div>      
                                        </Col>
                                    </Row> */}
                                    {/* <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div ref={destRef}>
                                                <MuiInput value={destination} onChange={(e)=>{setDestination(e.target.value); setDestinationErr({status:false , msg:''})}} err={destinationErr} name='مقصد' type='normal' width='100%'></MuiInput>
                                            </div>      
                                        </Col>
                                    </Row> */}
                                    {/* <Row style={{marginBottom:'10px'}}> */}
                                        {/* <Col style={{padding:'0px 10px 0px 10px', zIndex:'1000'}} xs={12} md={12} lg={12} xl={12} xxl={12}> */}
                                            {/* <div style={{display:'flex' , alignItems:'center'}} dir='rtl' ref={companyNameRef}> */}
                                                {/* <div style={{width:'22%'}}> */}

                                                    {/* <IconBotton onClick={()=>{setNewCustomer(true)}}  color='black' name='مشتری جدید' text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton> */}
                                                {/* </div> */}
                                                {/* <div style={{width:'78%' , marginRight:'10px'}}> */}
                                                    {/* <CustomSelect options={allCustomer} onChange={(e)=>{setCompanyName(e.value)}} selectType='selectCustomer' placeholder="کشور"></CustomSelect> */}
                                                    {/* <MultiSelect options={allCustomer}  placeholder='مشتری'></MultiSelect> */}
                                                {/* </div> */}
                                            {/* </div> */}
                                            {/* <div style={{display:'flex'  , alignItems:'center'}} dir='rtl' ref={companyNameRef}>
                                                <MuiInput onChange={(e)=>{setCompanyName(e.target.value)}} value={companyName}  name='نام شرکت/مشتری' type='normal' width='100%'></MuiInput>
                                            </div>       */}
                                        {/* </Col>
                                    </Row> */}
                                    {/* <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}}  xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div dir='rtl' ref={companyNameRef}>
                                                <MuiInput onChange={(e)=>{setCompanyName(e.target.value)}} value={companyName}  name='نام شرکت/مشتری' type='normal' width='100%'></MuiInput>
                                            </div>      
                                        </Col>
                                    </Row> */}
                                </div>      
                                <div >
                                        <div className={Style.secTitle}>Complete invoice</div>
                                        <div style={{marginTop:'20px'}}>
                                                <Row style={{marginBottom:'10px'}} className="g-0">
                                                    <Col style={{padding:'0px 5px 0px 0px' , zIndex:'3001'} } sm={6} md={6} lg={6} xl={6} xxl={6} xs={6}>
                                                        <CustomSelect onChange={(e)=>{setUom(e.id)}}  selectType='UOM'   placeholder="UOM"></CustomSelect>
                                                    </Col>
                                                    <Col style={{padding:'0px 0px 0px 5px' , zIndex:'2000'} } sm={6} md={6} lg={6} xl={6} xxl={6} xs={6}>
                                                        <TextInputNormal  value={rate} onChange={(e)=>{rateFunc({input:'rate',value:e.target.value})}}  placeholder='Rate(AED)'></TextInputNormal>
                                                    </Col>
                                                </Row>
                                                <Row style={{marginBottom:'10px'}}>
                                                    <Col style={{ padding:'0px 11px 0px 11px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                        <div ref={factoryPriceRef}>
                                                            <TextInputNormal  value={totalAmount} onChange={(e)=>{rateFunc({input:'totalAmount',value:e.target.value})}}  placeholder='Total amount(AED)'></TextInputNormal>
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <Row style={{marginBottom:'10px'}} className="g-0">
                                                    <Col style={{padding:'0px 5px 0px 0px' , zIndex:'1001'} } sm={6} md={6} lg={6} xl={6} xxl={6} xs={6}>
                                                        <div ref={factoryPriceRef}>
                                                            <TextInputNormal disable={!designRequired} value={graphicDesignCost} onChange={(e)=>{setGraphicDesignCost(e.target.value);}}  placeholder='Graphic design cost(AED)'></TextInputNormal>
                                                        </div>      
                                                    </Col>
                                                    <Col style={{padding:'0px 0px 0px 5px' , zIndex:'2000'} } sm={6} md={6} lg={6} xl={6} xxl={6} xs={6}>
                                                        <div ref={factoryPriceRef}>
                                                            <TextInputNormal  value={shipDeliveryCost} onChange={(e)=>{setShipDeliveryCost(e.target.value);}}  placeholder='Shipping/Delivery cost'></TextInputNormal>
                                                        </div>
                                                    </Col>
                                                </Row>

                                                
                                                <Row style={{marginBottom:'5px'}}>
                                                    <Col style={{ padding:'30px 25px 0px 15px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                        <div ref={factoryPriceRef}>
                                                            <Typography  gutterBottom>
                                                                Design duration
                                                            </Typography>
                                                            <Slider
                                                                aria-label="Custom marks"
                                                                defaultValue={3}
                                                                getAriaValueText={designDurationFunc}
                                                                step={1}
                                                                max={30}

                                                                disabled={!designRequired}
                                                                sx={CustomSliderStyles}
                                                                valueLabelDisplay="auto"
                                                                marks={marks}
                                                            />                                                        
                                                        </div>
                                                    </Col>
                                                    <Col style={{ padding:'30px 25px 0px 15px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                        <div ref={factoryPriceRef}>
                                                            <Typography  gutterBottom>
                                                                Print duration
                                                            </Typography>
                                                            <Slider
                                                                aria-label="Custom marks"
                                                                defaultValue={7}
                                                                getAriaValueText={printDurationFunc}
                                                                step={1}
                                                                max={30}
                                                                sx={CustomSliderStyles}

                                                                valueLabelDisplay="auto"
                                                                marks={marks}
                                                            />                                                        
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <Row style={{marginBottom:'10px',marginTop:'30px'}} className="g-0">
                                                    <div style={{display:'flex',height:'40px' , width:'100%',justifyContent:'center',alignItems:'center'}}>
                                                        <div style={{margin:'0px auto 0px 0px'}}>Address</div>
                                                        <div style={{height:'40px', width:'70px'}}><button onClick={()=>{dispatch(actions.toggleNewCustomer())}} style={{width:'100%' , height:'100%', backgroundColor:'black' , borderRadius:'5px' , border:'none'}}><Add sx={{color:'white'}}></Add></button></div>
                                                    </div>
                                                </Row>
                                                <Row style={{marginBottom:'10px',marginTop:'30px'}} className="g-0">

                                                </Row>
                                                    <Col  xs={12} md={12} lg={12} xl={12} xxl={12}>

                                                    </Col>
                                                <Row>
                                                <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                    <div className={Style.btnDiv}>
                                                        <Button className={Style.btn} onClick={sendAndsave} sx={{backgroundColor:'rgb(86, 86, 86)' , width:'120px'  , fontSize:'15px' , color:'#fff' , margin:'0px 10px 0px 0px'}} variant="contained">{loadingAndSend === true ? <CircularProgress size='26px' color='inherit'></CircularProgress>:"ذخیره و ارسال"}</Button>
                                                        <Button className={Style.btn} onClick={newPreInvoice} sx={{backgroundColor:'rgb(0, 0, 0)' , width:'80px'  , fontSize:'15px' , color:'#fff'}} variant="contained">{loading === true ? <CircularProgress size='26px' color='inherit'></CircularProgress>:'ذخیره'}</Button>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>         
                            </div>

                        

                    </div>
                </div>

       </Fragment>
    )
}

const NewProject = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <NewProjectPortal   setNewPreInvoiceStatus={props.setNewPreInvoiceStatus}  newPreInvoiceStatus={props.newPreInvoiceStatus} ></NewProjectPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default NewProject;