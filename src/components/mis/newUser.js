import { Fragment , useState  , useContext} from 'react';
import Style from './newUser.module.scss';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl , Col} from 'react-bootstrap';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import MuiInput from '../../tools/inputs/muiInput';
import MuiSelect from '../../tools/inputs/muiSelect';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import axios from 'axios';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import MultiSelect from '../../tools/inputs/multiSelect';
import WebSections from '../../contextApi/webSection';
import ImagePlaceholder from '../../assets/imagePlaceHolder.png'

const NewUser =(props)=>{
    const urlContext = useContext(AxiosGlobal);
    const webSectionContext = useContext(WebSections);
    const [name , setName] = useState('');
    const [lastName , setLastName] = useState('');
    const [password , setPassword] = useState('');
    const [phoneNumber , setPhoneNumber] = useState('');
    const [access , setAccess] = useState([]);

    const getAccess = (e) =>{
        var temp =[];
        e.map(data=>{
            temp.push(data.value)
        })
        setAccess([...temp]);
        console.log(access)
    }
    const sendData = async() =>{

        const data = {
            firstName :name,
            lastName : lastName,
            password:password,
            phoneNumber:phoneNumber,
            access:access
        }
        try{
            const response = await axios({
                method:'post',
                url:`${urlContext.defaultTargetApi}/auth/register`,
                data:data,
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            console.log(response.data)
        }catch(err){
            console.log(err)

        }
    }

    return(
        <Fragment>
            {props.newUserStatus === true?
                <div className={Style.newInvoice}>
                    <div className={Style.topSection}>
                        <div onClick={()=>{props.setNewUserStatus(false)}} className={Style.backBtn}><ArrowBackIosIcon sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                        <div className={Style.topTitle}>کاربر جدید</div>
                    </div>
                    <div  className={Style.formDiv}>
                        <Row>
                            <Col xs={6} md={6} lg={6} xl={6} xxl={6}>
                                <MuiInput onChange={(e)=>{setName(e.target.value)}} name='نام' type='normal' width='100%'></MuiInput>
                            </Col>
                            <Col xs={6} md={6} lg={6} xl={6} xxl={6}>
                                <MuiInput onChange={(e)=>{setLastName(e.target.value)}} name='نام خانوادگی' type='normal' width='100%'></MuiInput>
                            </Col>
                        </Row>
                        <Row>
                            <Col style={{padding:'0px 0px 0px 10px'}} xs={4} md={4} lg={4} xl={4} xxl={4}>
                                <MuiInput name='کد تایید' type='normal' width='100%'></MuiInput>
 
                            </Col>
                            <Col xs={8} md={8} lg={8} xl={8} xxl={8}>
                                <MuiInput onChange={(e)=>{setPhoneNumber(e.target.value)}} name='شماره تلفن' type='normal' width='100%'></MuiInput>
                            </Col>
                        </Row>
                        <Row>

                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                <MuiInput onChange={(e)=>{setPassword(e.target.value)}} name='کلمه عبور' type='password' width='100%'></MuiInput>
                            </Col>
                        </Row>
                        <Row>
                            <Col style={{padding:'0px 0px 0px 20px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                <MultiSelect onChange={getAccess} options={webSectionContext.listOfSections} setAccess={setAccess} type='normal' width='100%'></MultiSelect>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                                <div className={Style.btnDiv}>
                                    <Button onClick={sendData} sx={{backgroundColor:'rgb(0, 0, 0)' , fontSize:'15px' , color:'#fff'}} variant="contained">ذخیره</Button>
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

export default NewUser;