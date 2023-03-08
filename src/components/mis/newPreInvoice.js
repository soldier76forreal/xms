import { Fragment , useState , useContext , useRef , useEffect } from 'react';
import Style from './newPreInvoice.module.scss'
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
import { Diversity1 } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import AuthContext from '../authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import { CircularProgress, FormControlLabel, Switch } from '@mui/material';
import { useHistory } from 'react-router-dom';
import MultiSelect from '../../tools/inputs/multiSelect';
import IconBotton from '../../tools/buttons/iconBtn';
import AddIcon from '@mui/icons-material/Add';
import NewCustomer from '../crm/newCustomer';
import CustomSelect from '../../tools/inputs/customSelect';


const NewPreInvoicePortal = (props) =>{
        const authContext = useContext(AuthContext);
        const axiosGlobal = useContext(AxiosGlobal);
        var decoded = jwtDecode(authContext.token);
        const history = useHistory();

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
        const [name , setName] = useState('');
        const [nameErr , setNameErr] = useState({status:false , msg:''});
        const [meter , setMeter] = useState('');
        const [meterErr , setMeterErr] = useState({status:false , msg:''});
        const [destination , setDestination] = useState('');
        const [destinationErr , setDestinationErr] = useState({status:false , msg:''});
        const [companyName , setCompanyName] = useState('');
        const [companyNameErr , setCompanyNameErr] = useState({status:false , msg:''});
        const [dimentions , setDimentions] = useState({width:null , diameter:null , height:null})

        

        const [invoiceDate , setInvoiceDate] = useState(Date.now());
        const [invoiceDateErr , setInvoiceDateErr] = useState({status:false , msg:''});
        const [costCnf, setCostCnf] = useState('');
        const [costCnfErr, setCostCnfErr] = useState({status:false , msg:''});
        const [costFob , setCostFob] = useState('');
        const [costFobErr , setCostFobErr] = useState({status:false , msg:''});
        const [factoryPrice , setFactoryPrice] = useState('');
        const [factoryPriceErr , setFactoryPriceErr] = useState({status:false , msg:''});
        const [stoneThickness , setStoneThickness] = useState('');
        const [stoneThicknessErr , setStoneThicknessErr] = useState({status:false , msg:''});
        const [stoneRate , setStoneRate] = useState('');
        const [stoneRateErr , setStoneRateErr] = useState({status:false , msg:''});
        const [dateOfShipment , setDateOfShipment] = useState(Date.now());
        const [dateOfShipmentErr , setDateOfShipmentErr] = useState({status:false , msg:''});

        const [insertFactor , setInsertFactor] = useState(true);
        const [allCustomer , setAllCustomer] = useState([]);

        const [newCustomer , setNewCustomer] = useState(false);
        const [loading , setLoading] = useState(false);
        const [loadingAndSend , setLoadingAndSend] = useState(false);

        const getAllCustomer = async() =>{
            try{
                const response = await authContext.jwtInst({
                    method:'get',
                    url:`${axiosGlobal.defaultTargetApi}/crm/getAllCustomerForSelect`,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                var tempArr = [];
                for(var i = 0 ; response.data.length > i ; i++){
                    tempArr.push({value:response.data[i]._id , name:`${response.data[i].personalInformation.firstName} ${response.data[i].personalInformation.lastName}`})
                }
                setAllCustomer([...tempArr])
            }catch(err){
                console.log(err);
            }
        }


        const newPreInvoice = async() =>{
            setLoading(true)
            
            if(insertFactor === true){
            if(name === ''){
                setNameErr({status:true , msg:'نام سنگ را وارد کنید'});
                stoneNameRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(dimentions.height ===  null || dimentions.width === null || dimentions.diameter === null){
                setMeterErr({status:true , msg:'ابعاد مورد نظر را وارد کنید'});
                meterageRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(destination === ''){
                setDestinationErr({status:true , msg:'آدرس مقصد را وارد کنید'});
                destRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(companyName === ''){
                setCompanyNameErr({status:true , msg:'نام شرکت را وارد کنید'});
                companyNameRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false) 
            }
           
        
            // if(isNaN(meter) === false){
                if(name !== '' &&   destination.width !== null &&  destination.diameter !== null &&  destination.height !== null && companyName !== ''){
                    const data = {
                        insertFactor:insertFactor,
                        productName:name,
                        meterage:meter,
                        destination:destination,
                        companyName:companyName,
                        dimentions:dimentions,
                        generatedBy:decoded.id
                    }
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
                            setName('')
                            setMeter('')
                            setDestination('')
                            setCompanyName('')
                            setDimentions({width:null , diameter:null , height:null})
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
            // }else{
            //     setMeterErr({status:true , msg:'متراژ باید به صورت عددی وارد شود'});
            //     meterageRef.current.scrollIntoView();
            // }
        }else if(insertFactor === false){
            if(name === ''){
                setNameErr({status:true , msg:'نام سنگ را وارد کنید'});
                stoneNameRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(dimentions.height ===  null || dimentions.width === null || dimentions.diameter === null){
                setMeterErr({status:true , msg:'ابعاد مورد نظر را وارد کنید'});
                meterageRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(destination === ''){
                setDestinationErr({status:true , msg:'آدرس مقصد را وارد کنید'});
                destRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(companyName === ''){
                setCompanyNameErr({status:true , msg:'نام شرکت را وارد کنید'});
                companyNameRef.current.scrollIntoView(); 
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(costCnf === ''){
                setCostCnfErr({status:true , msg:'هزینه(cnf) را وارد کنید'});
                costCnfRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(costFob === ''){
                setCostFobErr({status:true , msg:'هزینه(fob) را وارد کنید'});
                costFobRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(factoryPrice === ''){
                setFactoryPriceErr({status:true , msg:'قیمت درب کارخانه را وارد کنید'});
                factoryPriceRef.current.scrollIntoView(); 
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(stoneThickness === ''){
                setStoneThicknessErr({status:true , msg:'قطر سنگ - سایز را وارد کنید'});
                invoiceDateRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(stoneRate === ''){
                setStoneRateErr({status:true , msg:'درجه سنگ را وارد کنید'});
                costCnfRef.current.scrollIntoView();
                setLoadingAndSend(false)
                setLoading(false)
            }
            if(factoryPrice === ''){
                setFactoryPriceErr({status:true , msg:'قیمت درب کارخانه را وارد کنید'});
                factoryPriceRef.current.scrollIntoView(); 
                setLoadingAndSend(false)
                setLoading(false)
            }

            if(name !== ''&& destination.width !== null &&  destination.diameter !== null &&  destination.height !== null  && destination !== '' && companyName !== '' && factoryPrice !== '' && stoneRate !== '' && stoneThickness !== '' && factoryPrice !== '' && costFob !== '' && costCnf !== ''){
                const data = {
                    productName:name,
                    meterage:meter,
                    destination:destination,
                    companyName:companyName,
                    dimentions:dimentions,
                    invoiceDate:invoiceDate,
                    costCnf:costCnf,
                    costFob:costFob,
                    factoryPrice:factoryPrice,
                    stoneThickness:stoneThickness,
                    stoneRate:stoneRate,
                    dateOfShipment:dateOfShipment,
                    insertFactor:insertFactor,
                    generatedBy:decoded.id
                }
                try{
                    const response = await authContext.jwtInst({
                        method:'post',
                        url:`${axiosGlobal.defaultTargetApi}/mis/newPreInvoice`,
                        data:data,
                        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                    })
                    const clearData = setTimeout(()=>{
                    props.setSuccessToast({status:true , msg:'پیش فاکتور ایجاد شد'});
                    const closingNewPreInvoice = setTimeout(()=>{props.setNewPreInvoiceStatus(false)}, 500);
                    const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'پیش فاکتور ایجاد شد'})}, 3000);
                        setName('')
                        setMeter('')
                        setDestination('')
                        setCompanyName('')
                        setDimentions({width:null , diameter:null , height:null})
                        setCostCnf('')
                        setCostFob('')
                        setFactoryPrice('')
                        setStoneThickness('')
                        setStoneRate('')
                        setLoadingAndSend(false)
                        setLoading(false)
                        props.setContectRefresh(Math.random());
                    }, 1000);
                    return(
                        response.data
                    )
           
                }catch(err){
                    console.log(err)
                    setLoadingAndSend(false)
                    setLoading(false)
                }

            }
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
            getAllCustomer()
        }, []);
        
        
        const sendAndsave = async() =>{
            setLoadingAndSend(true)
            const data = await newPreInvoice()
            props.setTargetToSend(data._id);

            const closingNewPreInvoice = setTimeout(()=>{props.setOpenContactList({ ...props.openContactList, ['bottom']: true })}, 600);
        }

    return(
        <Fragment>
                <NewCustomer  successToast={props.successToast} setSuccessToast={props.setSuccessToast} newCustomer={newCustomer} setNewCustomer={setNewCustomer}></NewCustomer>
                <div style={props.newPreInvoiceStatus === true?{display:'block'}:{display:'none'}}  className={props.newPreInvoiceStatus === true? `${Style.newInvoice} ${Style.fadeIn}` : props.newPreInvoiceStatus === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                    <div className={Style.topSection}>
                        <div onClick={()=>{props.setNewPreInvoiceStatus(false); history.push('#newPreInvoices')}} className={Style.backBtn}><ArrowBackIosIcon className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                        <div className={Style.topTitle}>پیش فاکتور جدید</div>
                    </div>
                    <div style={{overflowY:'scroll' , height:'95vh'}}>              
                        {decoded.access.includes('inv')?
                            <div   className={Style.formDiv}>
                                <div className={Style.secTitle}>پیش فاکتور</div>
                                <div>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div ref={stoneNameRef}>
                                                <MuiInput value={name} onChange={(e)=>{setName(e.target.value); setNameErr({status:false , msg:''})}} err={nameErr} name='نام سنگ' type='normal' width='100%'></MuiInput>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div>
                                                <MuiInput value={meter} onChange={(e)=>{setMeter(e.target.value); setMeterErr({status:false , msg:''})}} err={meterErr} name='متراژ مورد نظر' type='meter' width='100%'></MuiInput>
                                            </div>  
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div  style={{display:'flex' , justifyContent:'center' , alignItems:'center'}} ref={destRef}>
                                                <MuiInput value={dimentions.width===null?'':dimentions.width} onChange={(e)=>{setDimentions({width:e.target.value ,diameter:dimentions.diameter , height:dimentions.height}); setMeterErr({status:false , msg:''})}} err={meterErr} name='طول' type='cm' width='95%'></MuiInput>
                                            
                                                <MuiInput value={dimentions.height ===null?'': dimentions.height} onChange={(e)=>{setDimentions({width:dimentions.width , diameter:dimentions.diameter , height:e.target.value}); setMeterErr({status:false , msg:''})}} err={meterErr} name='عرض' type='cm' width='95%'></MuiInput>
                                                
                                                <MuiInput value={dimentions.diameter ===null?'':dimentions.diameter} onChange={(e)=>{setDimentions({width:dimentions.width , height:dimentions.height , diameter:e.target.value}); setMeterErr({status:false , msg:''})}} err={meterErr} name='قطر' type='cm' width='95%'></MuiInput>
                              
                                            </div>      
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 10px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div ref={destRef}>
                                                <MuiInput value={destination} onChange={(e)=>{setDestination(e.target.value); setDestinationErr({status:false , msg:''})}} err={destinationErr} name='مقصد' type='normal' width='100%'></MuiInput>
                                            </div>      
                                        </Col>
                                    </Row>
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
                                    <Row style={{marginBottom:'10px' , padding:'0px 0px 0px 0px'}}>
                                        <Col  xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div dir='rtl' ref={companyNameRef}>
                                                <MuiInput onChange={(e)=>{setCompanyName(e.target.value)}} value={companyName}  name='نام شرکت/مشتری' type='normal' width='100%'></MuiInput>
                                            </div>      
                                        </Col>
                                    </Row>
                                </div>      
                                <div >
                                        <div  className={Style.secTitle}>
                                            <div dir='rtl' style={{display:'inline-block' , marginLeft:'20px' , float:'left'}}>
                                            <FormControlLabel
                                                    label="اضافه کردن فاکتور"
                                                control={
                                                    <Switch   
                                                    checked={insertFactor === false ? true :insertFactor === true ? false:null}
                                                    onChange={()=>{if(insertFactor === true){setInsertFactor(false)}else if(insertFactor === false){setInsertFactor(true)}}}
                                                    inputProps={{ 'aria-label': 'controlled' }} />
                                                }
                                            />

                                            </div>
                                            <div style={{display:'inline-block'}}>فاکتور</div>
                                        </div>
                                            <div style={{marginTop:'20px'}}>

                                        
                                                <Row style={{marginBottom:'10px' ,  padding:'0px 10px 0px 10px'}}>
                                                    <Col style={{ padding:'0px 10px 0px 0px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                        <div ref={factoryPriceRef}>
                                                            <MuiInput insertFactor={insertFactor} value={factoryPrice} err={factoryPriceErr} onChange={(e)=>{setFactoryPrice(e.target.value); setFactoryPriceErr({status:false , msg:''})}} name='قیمت درب کارخانه' type='normal' width='100%'></MuiInput>
                                                        </div>
                                                    </Col>
                                                    <Col style={{ padding:'0px 0px 0px 10px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                        <div ref={invoiceDateRef}>
                                                            <label style={{marginBottom:'5px' , fontSize:'13px'}}>تاریخ فاکتور</label>
                                                            <Datep insertFactor={insertFactor} onChange={(e)=>{setInvoiceDate(e)}}></Datep>                            
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <Row style={{marginBottom:'10px' , padding:'0px 10px 0px 10px'}}>
                                                    <Col style={{ padding:'0px 10px 0px 0px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                        <div ref={costFobRef}>
                                                            <MuiInput insertFactor={insertFactor} err={costFobErr} value={costFob} onChange={(e)=>{setCostFob(e.target.value); setCostFobErr({status:false , msg:''})}} name='(fob)هزینه' type='normal' width='100%'></MuiInput>
                                                        </div>
                                                    </Col>
                                                    <Col style={{ padding:'0px 0px 0px 10px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                        <div ref={costCnfRef}>
                                                            <MuiInput insertFactor={insertFactor} err={costCnfErr} value={costCnf} onChange={(e)=>{setCostCnf(e.target.value); setCostCnfErr({status:false , msg:''});}} name='(cnf)هزینه' type='normal' width='100%'></MuiInput>
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <Row style={{marginBottom:'10px', padding:'0px 10px 0px 10px'}}>
                                                        <Col style={{ padding:'0px 10px 0px 0px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                            <div ref={stoneRateRef}>
                                                                <MuiInput insertFactor={insertFactor} err={stoneRateErr} value={stoneRate} onChange={(e)=>{setStoneRate(e.target.value); setStoneRateErr({status:false , msg:''})}} name='درجه سنگ' type='normal' width='100%'></MuiInput>
                                                            </div>
                                                        </Col>
                                                        <Col style={{ padding:'0px 0px 0px 10px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                            <div ref={stoneThicknessRef}>
                                                                <MuiInput insertFactor={insertFactor} err={stoneThicknessErr} value={stoneThickness} onChange={(e)=>{setStoneThickness(e.target.value); setStoneThicknessErr({status:false , msg:''})}} name='قطر سنگ - سایز' type='normal' width='100%'></MuiInput>
                                                            </div>
                                                        </Col>
                                                </Row> 
                                                <Row style={{marginBottom:'5px' , padding:'0px 5px 0px 10px'}}>
                                                    <Col style={{ padding:'0px 5px 0px 0px'}}  xs={12} md={12} lg={12} xl={12} xxl={12}>
                                                        <div ref={dateOfShipmentRef}>
                                                            <label style={{marginBottom:'5px' , fontSize:'13px'}}>تاریخ آماده شدن سنگ برای بارگیری</label>
                                                            <Datep insertFactor={insertFactor}  onChange={(e)=>{setDateOfShipment(e)}}></Datep>    
                                                        </div>
                                                    </Col>
                                                </Row>
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
                        :decoded.access.includes('req')?
                            <div className={Style.formDiv}>
                                <div className={Style.secTitle}>پیش فاکتور</div>
                                <div>
                                    <Row style={{marginBottom:'10px' , padding:'0px 5px 0px 10px'}}>
                                        <Col   xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div  ref={stoneNameRef}>
                                                <MuiInput value={name} onChange={(e)=>{setName(e.target.value); setNameErr({status:false , msg:''})}} err={nameErr} name='نام سنگ' type='normal' width='100%'></MuiInput>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 15px 0px 22px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div ref={meterageRef}>
                                                <MuiInput value={meter} onChange={(e)=>{setMeter(e.target.value); setMeterErr({status:false , msg:''})}} err={meterErr} name='متراژ مورد نظر' type='meter' width='100%'></MuiInput>
                                            </div>  
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px' , padding:'0px 5px 0px 10px'}}>
                                        <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div  style={{display:'flex' , justifyContent:'center' , alignItems:'center'}} ref={destRef}>
                                                <MuiInput value={dimentions.width===null?'':dimentions.width} onChange={(e)=>{setDimentions({width:e.target.value ,diameter:dimentions.diameter , height:dimentions.height}); setMeterErr({status:false , msg:''})}} err={meterErr} name='طول' type='cm' width='95%'></MuiInput>
                                                
                                                <MuiInput value={dimentions.height ===null?'': dimentions.height} onChange={(e)=>{setDimentions({width:dimentions.width , diameter:dimentions.diameter , height:e.target.value}); setMeterErr({status:false , msg:''})}} err={meterErr} name='عرض' type='cm' width='95%'></MuiInput>
                                                
                                                <MuiInput value={dimentions.diameter ===null?'':dimentions.diameter} onChange={(e)=>{setDimentions({width:dimentions.width , height:dimentions.height , diameter:e.target.value}); setMeterErr({status:false , msg:''})}} err={meterErr} name='قطر' type='cm' width='95%'></MuiInput>
                              
                                            </div>      
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'10px' , padding:'0px 5px 0px 10px'}}>
                                        <Col  xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div ref={destRef}>
                                                <MuiInput value={destination} onChange={(e)=>{setDestination(e.target.value); setDestinationErr({status:false , msg:''})}} err={destinationErr} name='مقصد' type='normal' width='100%'></MuiInput>
                                            </div>      
                                        </Col>
                                    </Row>
                                    {/* <Row style={{marginBottom:'5px' , padding:'0px 5px 0px 10px'}}> */}
                                        {/* <Col style={{padding:'0px 10px 0px 10px', zIndex:'1000'}} xs={12} md={12} lg={12} xl={12} xxl={12}> */}
                                            {/* <div style={{display:'flex' , alignItems:'center'}} dir='rtl' ref={companyNameRef}> */}
                                                {/* <div style={{width:'22%'}}> */}
                                                    {/* <IconBotton onClick={()=>{setNewCustomer(true)}}  color='black' name='مشتری جدید' text={true} icon={<AddIcon sx={{color:'rgb(231, 231, 231)'}}/>}></IconBotton> */}
                                                {/* </div> */}
                                                {/* <div style={{width:'78%' , marginRight:'10px'}}> */}
                                                    {/* <CustomSelect options={allCustomer} onChange={(e)=>{setCompanyName(e.value)}} selectType='selectCustomer' placeholder="مشتری ها"></CustomSelect> */}
                                                    {/* <MultiSelect options={allCustomer}  placeholder='مشتری'></MultiSelect> */}
                                                {/* </div> */}
                                            {/* </div> */}  
                                            {/* <div  dir='rtl' ref={companyNameRef}> */}
                                                
                                                {/* <MuiInput onChange={(e)=>{setCompanyName(e.target.value)}} value={companyName}  name='نام شرکت/مشتری' type='normal' width='100%'></MuiInput> */}
                                            {/* </div>       */}
                                        {/* </Col> */}
                                    {/* </Row> */}
                                    <Row style={{marginBottom:'10px' , padding:'0px 5px 0px 10px'}}>
                                        <Col  xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div dir='rtl' ref={companyNameRef}>
                                                <MuiInput onChange={(e)=>{setCompanyName(e.target.value)}} value={companyName}  name='نام شرکت/مشتری' type='normal' width='100%'></MuiInput>
                                            </div>      
                                        </Col>
                                    </Row>
                                </div>      
                                    <Row>
                                        <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div className={Style.btnDiv}>
                                                <Button className={Style.btn} onClick={sendAndsave} sx={{backgroundColor:'rgb(86, 86, 86)' , width:'120px'  , fontSize:'15px' , color:'#fff' , margin:'0px 10px 0px 0px'}} variant="contained">{loadingAndSend === true ? <CircularProgress size='26px' color='inherit'></CircularProgress>:"ذخیره و ارسال"}</Button>
                                                <Button className={Style.btn} onClick={newPreInvoice} sx={{backgroundColor:'rgb(0, 0, 0)' , width:'80px' , fontSize:'15px' , color:'#fff'}} variant="contained">{loading === true ? <CircularProgress size='26px' color='inherit'></CircularProgress>:'ذخیره'}</Button>
                                            </div>
                                        </Col>
                                    </Row>
                            </div>
                        :null}

                    </div>
                </div>

       </Fragment>
    )
}

const NewPreInvoice = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <NewPreInvoicePortal setTargetToSend={props.setTargetToSend} setContectRefresh={props.setContectRefresh} setOpenContactList={props.setOpenContactList} setSuccessToast={props.setSuccessToast} setNewPreInvoiceStatus={props.setNewPreInvoiceStatus} openContactList={props.openContactList} newPreInvoiceStatus={props.newPreInvoiceStatus} ></NewPreInvoicePortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default NewPreInvoice;