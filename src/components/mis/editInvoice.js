import { Fragment , useState , useContext , useRef , useEffect } from 'react';
import Style from './editInvoice.module.scss'
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
import { FormControlLabel, Switch } from '@mui/material';
import { useHistory } from 'react-router-dom';
import SocketContext from '../authAndConnections/socketReq';


const EditInvoicePortal = (props) =>{
        const authContext = useContext(AuthContext);
        const axiosGlobal = useContext(AxiosGlobal);
        const socketCtx = useContext(SocketContext);

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

        const [docId , setDocId] = useState('');

        

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


        useEffect(() => {
            
            if(props.data !== null){
                if(props.data.doc.completeInvoice !== undefined){
                    setDocId(props.data.doc._id)
                    setName(props.data.doc.preInvoice.productName)
                    setMeter(props.data.doc.preInvoice.meterage)
                    setDestination(props.data.doc.preInvoice.destination)
                    setCompanyName(props.data.doc.preInvoice.companyName)
                    if(props.data.doc.preInvoice.dimentions !== undefined){
                        setDimentions({width:props.data.doc.preInvoice.dimentions.width , diameter:props.data.doc.preInvoice.dimentions.diameter , height:props.data.doc.preInvoice.dimentions.height})
                    }                    
                    setInvoiceDate(props.data.doc.completeInvoice.invoiceDate)
                    setCostCnf(props.data.doc.completeInvoice.costCnf)
                    setCostFob(props.data.doc.completeInvoice.costFob)
                    setFactoryPrice(props.data.doc.completeInvoice.factoryPrice)
                    setStoneThickness(props.data.doc.completeInvoice.stoneThickness)
                    setStoneRate(props.data.doc.completeInvoice.stoneRate)
                    setDateOfShipment(props.data.doc.completeInvoice.dateOfShipment)
                }if(props.data.doc.completeInvoice === undefined){
                    setDocId(props.data.doc._id)
                    setName(props.data.doc.preInvoice.productName)
                    setMeter(props.data.doc.preInvoice.meterage)
                    setDestination(props.data.doc.preInvoice.destination)
                    setCompanyName(props.data.doc.preInvoice.companyName)
                    setInsertFactor(false)
                    if(props.data.doc.preInvoice.dimentions !== undefined){
                        setDimentions({width:props.data.doc.preInvoice.dimentions.width , diameter:props.data.doc.preInvoice.dimentions.diameter , height:props.data.doc.preInvoice.dimentions.height})
                    }
                }

            }
        }, [props.openEditInvoice]);


        const editPreInvoices =async () =>{
            try{
                if(name === ''){
                    setNameErr({status:true , msg:'نام سنگ را وارد کنید'});
                    stoneNameRef.current.scrollIntoView();
                }

                if(destination === ''){
                    setDestinationErr({status:true , msg:'آدرس مقصد را وارد کنید'});
                    destRef.current.scrollIntoView();
                }
                if(companyName === ''){
                    setCompanyNameErr({status:true , msg:'نام شرکت را وارد کنید'});
                    companyNameRef.current.scrollIntoView(); 
                }
                if(dimentions.height ===  null || dimentions.width === null || dimentions.diameter === null){
                    setMeterErr({status:true , msg:'ابعاد مورد نظر را وارد کنید'});
                    meterageRef.current.scrollIntoView();
                }
                if(isNaN(meter) === false){
                    if(name !== '' && destination !== '' && companyName !== ''){
                        const data = {
                            insertFactor:insertFactor,
                            productName:name,
                            meterage:meter,
                            destination:destination,
                            dimentions:dimentions,
                            companyName:companyName,
                            docId:docId
                        }
                        try{
                            const response = await authContext.jwtInst({
                                method:'post',
                                url:`${axiosGlobal.defaultTargetApi}/mis/editPreInvoice`,
                                data:data,
                                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                            })
    
                            props.setSuccessToast({status:true , msg:'پیش فاکتور بروزرسانی شد'});
                            props.setContectRefresh(Math.random());
                            const closingNewPreInvoice = setTimeout(()=>{props.setOpenEditInvoice({status:false , id:null})}, 500);
                            const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'پیش فاکتور بروزرسانی شد'})}, 3000);
                            const clearData = setTimeout(()=>{
                                setName('');
                                setMeter('');
                                setDestination('');
                                setCompanyName('');
                            }, 1000);
                            props.setContectRefresh(Math.random());
                            return(
                                response.data
                            )
                        }catch(err){
                            
                        }
                    }
                }else{
                    setMeterErr({status:true , msg:'متراژ باید به صورت عددی وارد شود'});
                    meterageRef.current.scrollIntoView();
                }
            }catch{

            }
        }

        const newPreInvoice = async() =>{
           
            
            if(insertFactor === false){
            if(name === ''){
                setNameErr({status:true , msg:'نام سنگ را وارد کنید'});
                stoneNameRef.current.scrollIntoView();
            }
            if(dimentions.height ===  null || dimentions.width === null || dimentions.diameter === null){
                setMeterErr({status:true , msg:'ابعاد مورد نظر را وارد کنید'});
                meterageRef.current.scrollIntoView();
            }
            if(destination === ''){
                setDestinationErr({status:true , msg:'آدرس مقصد را وارد کنید'});
                destRef.current.scrollIntoView();
            }
            if(companyName === ''){
                setCompanyNameErr({status:true , msg:'نام شرکت را وارد کنید'});
                companyNameRef.current.scrollIntoView(); 
            }
            
            if(isNaN(meter) === false){
                if(name !== ''  && destination !== '' && companyName !== ''){
                    const data = {
                        insertFactor:insertFactor,
                        productName:name,
                        meterage:meter,
                        destination:destination,
                        companyName:companyName,
                        dimentions:dimentions,
                        docId:docId
                    }
                    try{
                        const response = await authContext.jwtInst({
                            method:'post',
                            url:`${axiosGlobal.defaultTargetApi}/mis/editInvoices`,
                            data:data,
                            config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                        })

                        props.setSuccessToast({status:true , msg:'پیش فاکتور بروزرسانی شد'});
                        props.setContectRefresh(Math.random());

                        const closingNewPreInvoice = setTimeout(()=>{props.setOpenEditInvoice({status:false , id:null})}, 500);
                        const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'پیش فاکتور بروزرسانی شد'})}, 3000);
                        const clearData = setTimeout(()=>{
                            setName('');
                            setMeter('');
                            setDestination('');
                            setCompanyName('');
                        }, 1000);
                        props.setContectRefresh(Math.random());
                        return(
                            response.data
                        )
                    }catch(err){
                        
                    }
                }
            }else{
                setMeterErr({status:true , msg:'متراژ باید به صورت عددی وارد شود'});
                meterageRef.current.scrollIntoView();
            }
        }else if(insertFactor === true){
            if(name === ''){
                setNameErr({status:true , msg:'نام سنگ را وارد کنید'});
                stoneNameRef.current.scrollIntoView();
            }
            if(dimentions.height ===  null || dimentions.width === null || dimentions.diameter === null){
                setMeterErr({status:true , msg:'ابعاد مورد نظر را وارد کنید'});
                meterageRef.current.scrollIntoView();
            }
            if(destination === ''){
                setDestinationErr({status:true , msg:'آدرس مقصد را وارد کنید'});
                destRef.current.scrollIntoView();
            }
            if(companyName === ''){
                setCompanyNameErr({status:true , msg:'نام شرکت را وارد کنید'});
                companyNameRef.current.scrollIntoView(); 
            }
            if(costCnf === ''){
                setCostCnfErr({status:true , msg:'هزینه(cnf) را وارد کنید'});
                costCnfRef.current.scrollIntoView();
            }
            if(costFob === ''){
                setCostFobErr({status:true , msg:'هزینه(fob) را وارد کنید'});
                costFobRef.current.scrollIntoView();
            }
            if(factoryPrice === ''){
                setFactoryPriceErr({status:true , msg:'قیمت درب کارخانه را وارد کنید'});
                factoryPriceRef.current.scrollIntoView(); 
            }
            if(stoneThickness === ''){
                setStoneThicknessErr({status:true , msg:'قطر سنگ - سایز را وارد کنید'});
                invoiceDateRef.current.scrollIntoView();
            }
            if(stoneRate === ''){
                setStoneRateErr({status:true , msg:'درجه سنگ را وارد کنید'});
                costCnfRef.current.scrollIntoView();
            }
            if(factoryPrice === ''){
                setFactoryPriceErr({status:true , msg:'قیمت درب کارخانه را وارد کنید'});
                factoryPriceRef.current.scrollIntoView(); 
            }
            if(name !== ''&& destination.width !== null &&  destination.diameter !== null &&  destination.height !== null && destination !== '' && companyName !== '' && factoryPrice !== '' && stoneRate !== '' && stoneThickness !== '' && factoryPrice !== '' && costFob !== '' && costCnf !== ''){
                const data = {
                    productName:name,
                    meterage:meter,
                    destination:destination,
                    companyName:companyName,
                    invoiceDate:invoiceDate,
                    costCnf:costCnf,
                    dimentions:dimentions,
                    costFob:costFob,
                    factoryPrice:factoryPrice,
                    stoneThickness:stoneThickness,
                    stoneRate:stoneRate,
                    dateOfShipment:dateOfShipment,
                    insertFactor:insertFactor,
                    docId:docId
                }
                try{
                    const response = await authContext.jwtInst({
                        method:'post',
                        url:`${axiosGlobal.defaultTargetApi}/mis/editInvoices`,
                        data:data,
                        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                    })
                    props.setSuccessToast({status:true , msg:'درخواست بروزرسانی شد'});
                    props.setContectRefresh(Math.random());
                    const closingNewPreInvoice = setTimeout(()=>{props.setOpenEditInvoice({status:false , id:null})}, 500);
                    const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false ,  msg:'درخواست بروزرسانی شد'})}, 3000);
                    const clearData = setTimeout(()=>{
                        setName('');
                        setMeter('');
                        setDestination('');
                        setCompanyName('');
                        setInvoiceDate('');
                        setCostCnf('');
                        setCostFob('');
                        setFactoryPrice('');
                        setStoneThickness('');
                        setStoneRate('');
                        setDateOfShipment('');
                    }, 1000);
                    props.setContectRefresh(Math.random());
                    return(
                        response.data
                    )
           
                }catch{
                    
                }

            }
        }
        }

 

        
        const activeInvoice = () =>{
            if(insertFactor === true){
                setInsertFactor(false)
                
                setInvoiceDate('');
                setCostCnf('');
                setCostFob('');
                setFactoryPrice('');
                setStoneThickness('');
                setStoneRate('');
                setDateOfShipment('');
                
            }else if(insertFactor === false){
                setInsertFactor(true);
                setInvoiceDate(props.data.doc.completeInvoice.invoiceDate)
                setCostCnf(props.data.doc.completeInvoice.costCnf)
                setCostFob(props.data.doc.completeInvoice.costFob)
                setFactoryPrice(props.data.doc.completeInvoice.factoryPrice)
                setStoneThickness(props.data.doc.completeInvoice.stoneThickness)
                setStoneRate(props.data.doc.completeInvoice.stoneRate)
                setDateOfShipment(props.data.doc.completeInvoice.dateOfShipment)
            }
        }
        
        
        
        const sendAndsave = async() =>{
            const data = await newPreInvoice()
            props.setTargetToSend(data._id);
            const closingNewPreInvoice = setTimeout(()=>{props.setOpenContactList({ ...props.openContactList, ['bottom']: true })}, 600);
        }

        if(props.data !==null){
    return(

       
        <Fragment>
            
                <div style={props.openEditInvoice.status === true?{display:'block'}:{display:'none'}}  className={props.openEditInvoice.status === true? `${Style.newInvoice} ${Style.fadeIn}` : props.openEditInvoice.status === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                    <div className={Style.topSection}>
                        <div onClick={()=>{props.setOpenEditInvoice({status:false , id:null}); history.push('#')}} className={Style.backBtn}><ArrowBackIosIcon className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                        <div className={Style.topTitle}>پیش فاکتور جدید</div>
                    </div>
                    <div style={{overflowY:'scroll' , overflowX:'none' , height:'95vh' , marginTop:'70px' , paddingBottom:'16px'}}>              
                    {decoded.access.includes('inv')?
                        <div  className={Style.formDiv}>
                            <div className={Style.secTitle}>پیش فاکتور</div>
                            <div>
                                <Row style={{marginBottom:'10px'}}>
                                    <Col style={{padding:'0px 25px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div ref={stoneNameRef}>
                                            <MuiInput value={name} onChange={(e)=>{setName(e.target.value); setNameErr({status:false , msg:''})}} err={nameErr} name='نام سنگ' type='normal' width='100%'></MuiInput>
                                        </div>
                                    </Col>
                                </Row>
                                <Row style={{marginBottom:'10px'}}>
                                    <Col style={{padding:'0px 25px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div ref={meterageRef}>
                                            <MuiInput value={meter} onChange={(e)=>{setMeter(e.target.value); setMeterErr({status:false , msg:''})}} err={meterErr} name='متراژ مورد نظر' type='meter' width='100%'></MuiInput>
                                        </div>  
                                    </Col>
                                </Row>
                                <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 25px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div  style={{display:'flex' , justifyContent:'center' , alignItems:'center'}} ref={destRef}>
                                                <MuiInput value={dimentions.width} onChange={(e)=>{setDimentions({width:e.target.value ,diameter:dimentions.diameter , height:dimentions.height}); setMeterErr({status:false , msg:''})}} err={meterErr} name='طول' type='cm' width='95%'></MuiInput>
                                                
                                                <MuiInput value={dimentions.height} onChange={(e)=>{setDimentions({width:dimentions.width , diameter:dimentions.diameter , height:e.target.value}); setMeterErr({status:false , msg:''})}} err={meterErr} name='عرض' type='cm' width='95%'></MuiInput>
                                                
                                                <MuiInput value={dimentions.diameter} onChange={(e)=>{setDimentions({width:dimentions.width , height:dimentions.height , diameter:e.target.value}); setMeterErr({status:false , msg:''})}} err={meterErr} name='قطر' type='cm' width='95%'></MuiInput>
                                                
                                            </div>      
                                        </Col>
                                    </Row>
                                <Row style={{marginBottom:'10px'}}>
                                    <Col style={{padding:'0px 25px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div ref={destRef}>
                                            <MuiInput value={destination} onChange={(e)=>{setDestination(e.target.value); setDestinationErr({status:false , msg:''})}} err={destinationErr} name='مقصد' type='normal' width='100%'></MuiInput>
                                        </div>      
                                    </Col>
                                </Row>
                                <Row style={{marginBottom:'10px'}}>
                                    <Col style={{padding:'0px 25px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div ref={companyNameRef}>
                                            <MuiInput value={companyName} onChange={(e)=>{setCompanyName(e.target.value); setCompanyNameErr({status:false , msg:''})}} name='نام شرکت'  err={companyNameErr} type='normal' width='100%'></MuiInput>
                                        </div>
                                    </Col>
                                </Row>
                            </div>      
                            <div >
                                    <div  className={Style.secTitle}>
                                        <div dir='rtl' style={{display:'inline-block' , marginLeft:'20px' , float:'left'}}>
                                        <FormControlLabel
                                                label="حذف فاکتور"
                                            control={
                                                <Switch   
                                                checked={insertFactor === false ? true :insertFactor === true ? false:null}
                                                onChange={activeInvoice}
                                                inputProps={{ 'aria-label': 'controlled' }} />
                                            }
                                        />

                                        </div>
                                        <div style={{display:'inline-block'}}>فاکتور</div>
                                    </div>
                                    <Row style={{marginBottom:'5px' ,  padding:'0px 15px 0px 0px'}}>
                                        <Col  xs={6} md={6} lg={6} xl={6} xxl={6}>
                                            <div ref={factoryPriceRef}>
                                                <MuiInput insertFactor={!insertFactor} value={factoryPrice} err={factoryPriceErr} onChange={(e)=>{setFactoryPrice(e.target.value); setFactoryPriceErr({status:false , msg:''})}} name='قیمت درب کارخانه' type='normal' width='100%'></MuiInput>
                                            </div>
                                        </Col>
                                        <Col xs={6} md={6} lg={6} xl={6} xxl={6}>
                                            <div ref={invoiceDateRef}>
                                                <label style={{marginBottom:'5px' , fontSize:'13px'}}>تاریخ فاکتور</label>
                                                <Datep value={invoiceDate} insertFactor={!insertFactor} onChange={(e)=>{setInvoiceDate(e)}}></Datep>                            
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'5px' , padding:'0px 15px 0px 0px'}}>
                                        <Col xs={6} md={6} lg={6} xl={6} xxl={6}>
                                            <div ref={costFobRef}>
                                                <MuiInput insertFactor={!insertFactor} err={costFobErr} value={costFob} onChange={(e)=>{setCostFob(e.target.value); setCostFobErr({status:false , msg:''})}} name='(fob)هزینه' type='normal' width='100%'></MuiInput>
                                            </div>
                                        </Col>
                                        <Col xs={6} md={6} lg={6} xl={6} xxl={6}>
                                            <div ref={costCnfRef}>
                                                <MuiInput insertFactor={!insertFactor} err={costCnfErr} value={costCnf} onChange={(e)=>{setCostCnf(e.target.value); setCostCnfErr({status:false , msg:''});}} name='(cnf)هزینه' type='normal' width='100%'></MuiInput>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row style={{marginBottom:'5px', padding:'0px 15px 0px 0px'}}>
                                            <Col xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                <div ref={stoneRateRef}>
                                                    <MuiInput insertFactor={!insertFactor} err={stoneRateErr} value={stoneRate} onChange={(e)=>{setStoneRate(e.target.value); setStoneRateErr({status:false , msg:''})}} name='درجه سنگ' type='normal' width='100%'></MuiInput>
                                                </div>
                                            </Col>
                                            <Col xs={6} md={6} lg={6} xl={6} xxl={6}>
                                                <div ref={stoneThicknessRef}>
                                                    <MuiInput insertFactor={!insertFactor} err={stoneThicknessErr} value={stoneThickness} onChange={(e)=>{setStoneThickness(e.target.value); setStoneThicknessErr({status:false , msg:''})}} name='قطر سنگ - سایز' type='normal' width='100%'></MuiInput>
                                                </div>
                                            </Col>
                                    </Row> 
                                    <Row style={{marginBottom:'5px' , padding:'0px 5px 0px 10px'}}>
                                        <Col  xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div ref={dateOfShipmentRef}>
                                                <label style={{marginBottom:'5px' , fontSize:'13px'}}>تاریخ آماده شدن سنگ برای بارگیری</label>
                                                <Datep value={dateOfShipment} insertFactor={!insertFactor}  onChange={(e)=>{setDateOfShipment(e)}}></Datep>    
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                    <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div className={Style.btnDiv}>
                                            <Button className={Style.btn} onClick={newPreInvoice} sx={{backgroundColor:'rgb(0, 0, 0)' , fontSize:'15px' , color:'#fff'}} variant="contained">ذخیره</Button>
                                        </div>
                                    </Col>
                                </Row>
                                </div>         
                        </div>
                    :decoded.access.includes('req')?
                        <div className={Style.formDiv}>
                            <div className={Style.secTitle}>پیش فاکتور</div>
                            <div>
                                <Row >
                                    <Col style={{padding:'0px 30px 0px 15px'}}  xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div  ref={stoneNameRef}>
                                            <MuiInput value={name} onChange={(e)=>{setName(e.target.value); setNameErr({status:false , msg:''})}} err={nameErr} name='نام سنگ' type='normal' width='100%'></MuiInput>
                                        </div>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col style={{padding:'0px 30px 0px 15px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div ref={meterageRef}>
                                            <MuiInput value={meter} onChange={(e)=>{setMeter(e.target.value); setMeterErr({status:false , msg:''})}} err={meterErr} name='متراژ مورد نظر' type='meter' width='100%'></MuiInput>
                                        </div>  
                                    </Col>
                                </Row>
                                <Row style={{marginBottom:'10px'}}>
                                        <Col style={{padding:'0px 25px 0px 10px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                            <div  style={{display:'flex' , justifyContent:'center' , alignItems:'center'}} ref={destRef}>
                                                <MuiInput value={dimentions.width} onChange={(e)=>{setDimentions({width:e.target.value ,diameter:dimentions.diameter , height:dimentions.height}); setMeterErr({status:false , msg:''})}} err={meterErr} name='طول' type='cm' width='95%'></MuiInput>

                                                <MuiInput value={dimentions.height} onChange={(e)=>{setDimentions({width:dimentions.width , diameter:dimentions.diameter , height:e.target.value}); setMeterErr({status:false , msg:''})}} err={meterErr} name='عرض' type='cm' width='95%'></MuiInput>

                                                <MuiInput value={dimentions.diameter} onChange={(e)=>{setDimentions({width:dimentions.width , height:dimentions.height , diameter:e.target.value}); setMeterErr({status:false , msg:''})}} err={meterErr} name='قطر' type='cm' width='95%'></MuiInput>
                                                <div>:ابعاد</div>
                                            </div>      
                                        </Col>
                                    </Row>
                                <Row>
                                    <Col style={{padding:'0px 30px 0px 15px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div ref={destRef}>
                                            <MuiInput value={destination} onChange={(e)=>{setDestination(e.target.value); setDestinationErr({status:false , msg:''})}} err={destinationErr} name='مقصد' type='normal' width='100%'></MuiInput>
                                        </div>      
                                    </Col>
                                </Row>
                                <Row>
                                    <Col style={{padding:'0px 30px 0px 15px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div ref={companyNameRef}>
                                            <MuiInput value={companyName} onChange={(e)=>{setCompanyName(e.target.value); setCompanyNameErr({status:false , msg:''})}} name='نام شرکت'  err={companyNameErr} type='normal' width='100%'></MuiInput>
                                        </div>
                                    </Col>
                                </Row>
                            </div>      
                                <Row>
                                    <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                        <div className={Style.btnDiv}>
                                            <Button className={Style.btn} onClick={editPreInvoices} sx={{backgroundColor:'rgb(0, 0, 0)' , fontSize:'15px' , color:'#fff'}} variant="contained">ذخیره</Button>
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
}

const EditInvoice = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <EditInvoicePortal setContectRefresh={props.setContectRefresh} openEditInvoice={props.openEditInvoice} setOpenEditInvoice={props.setOpenEditInvoice} setSuccessToast={props.setSuccessToast} data={props.data}></EditInvoicePortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default EditInvoice ;