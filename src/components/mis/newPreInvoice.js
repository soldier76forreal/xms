import { Fragment , useState , useContext } from 'react';
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

const NewPreInvoicePortal = (props) =>{
        const axiosGlobal = useContext(AxiosGlobal);
        //pre invoice states
        const [name , setName] = useState('');
        const [meter , setMeter] = useState('');
        const [destination , setDestination] = useState('');
        const [companyName , setCompanyName] = useState('');
    
        const newPreInvoice = async() =>{
            const data = {
                productName:name,
                meterage:meter,
                destination:destination,
                companyName:companyName
            }
            try{
                const response = await axios({
                    method:'post',
                    url:`${axiosGlobal.defaultTargetApi}/mis/newPreInvoice`,
                    data:data,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                })
                console.log(response.data)
            }catch{
    
            }
        }
    return(
        <Fragment>
            {props.newPreInvoiceStatus === true?
                <div className={Style.newInvoice}>
                    <div className={Style.topSection}>
                        <div onClick={()=>{props.setNewPreInvoiceStatus(false)}} className={Style.backBtn}><ArrowBackIosIcon sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                        <div className={Style.topTitle}>پیش فاکتور جدید</div>
                    </div>
                    <div  className={Style.formDiv}>
                        <Row>
                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                <MuiInput onChange={(e)=>{setName(e.target.value)}} name='نام سنگ' type='normal' width='100%'></MuiInput>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                <MuiInput onChange={(e)=>{setMeter(e.target.value)}} name='متراژ مورد نظر' type='meter' width='100%'></MuiInput>
                            </Col>
                            {/* <Col  xs={6} md={6} lg={6} xl={6} xxl={6}>
                                <MuiInput type='price' name='(fob)قیمت' width='100%'></MuiInput>
                            </Col> */}
                        </Row>
                        <Row>
                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                <MuiInput onChange={(e)=>{setDestination(e.target.value)}} name='مقصد' type='normal' width='100%'></MuiInput>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                <MuiInput onChange={(e)=>{setCompanyName(e.target.value)}} name='نام شرکت' type='normal' width='100%'></MuiInput>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                <MuiInput onChange={(e)=>{setDestination(e.target.value)}} name='(fob)هزینه' type='normal' width='100%'></MuiInput>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                <MuiInput onChange={(e)=>{setDestination(e.target.value)}} name='(cnf)هزینه' type='normal' width='100%'></MuiInput>
                            </Col>
                        </Row>

                        <Row>
                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                <div className={Style.btnDiv}>
                                    <Button onClick={()=>{props.setOpenContactList({ ...props.openContactList, ['bottom']: true }); newPreInvoice()}} sx={{backgroundColor:'rgb(86, 86, 86)' , fontSize:'15px' , color:'#fff' , margin:'0px 10px 0px 0px'}} variant="contained">ذخیره و ارسال</Button>
                                    <Button onClick={newPreInvoice} sx={{backgroundColor:'rgb(0, 0, 0)' , fontSize:'15px' , color:'#fff'}} variant="contained">ذخیره</Button>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            :null
            }
       </Fragment>
    )
}

const NewPreInvoice = (props)=>{

  return(
      <Fragment>
          {ReactDom.createPortal(
              <NewPreInvoicePortal setNewPreInvoiceStatus={props.setNewPreInvoiceStatus} newPreInvoiceStatus={props.newPreInvoiceStatus} ></NewPreInvoicePortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default NewPreInvoice;