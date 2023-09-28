import { Fragment , useState  , useContext , useRef , useEffect} from 'react';
import Style from './newUser.module.scss';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form ,FormControl ,ProgressBar , Col} from 'react-bootstrap';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import MuiInput from '../../tools/inputs/muiInput';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import axios from 'axios';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import MultiSelect from '../../tools/inputs/multiSelect';
import WebSections from '../../contextApi/webSection';
import ImagePlaceholder from '../../assets/imagePlaceHolder.png'
import AuthContext from '../authAndConnections/auth';
import { useHistory } from 'react-router-dom';
import ReactDom from 'react-dom';
import Prof from '../../assets/prof.jpg'
import 'bootstrap/dist/css/bootstrap.min.css';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
const NewUserPortal =(props)=>{
    const urlContext = useContext(AxiosGlobal);
    const authContext = useContext(AuthContext);
    const webSectionContext = useContext(WebSections);
    const history = useHistory();
    const [name , setName] = useState('');
    const [lastName , setLastName] = useState('');
    const [password , setPassword] = useState('');
    const [phoneNumber , setPhoneNumber] = useState('');
    const [refresh , setRefresh] = useState(33);
    const [access , setAccess] = useState([]);


    const uploadInputRef = useRef();
    const [titleTemp , setTitleTemp] = useState('');
    const [featureArray , setFeatureArray] = useState([]);
    const [featureListName , setFeatureListName] = useState('');
    //success toast states
    //failed toast states
    const [failedOpenToast , setFailedOpenToast] = useState(false);
    const [failedMsgToast , setFailedMsgToast] = useState('');

    const [file , setFile] = useState({});
    const [progressBar,setProgressBar] = useState('');

    const getAccess = (e) =>{
        var temp =[];
        e.map(data=>{
            temp.push(data.value)
        })
        setAccess([...temp]);
       
    }
    const getFile =(e)=>{
        //check file format
       if(e.target.files[0].name.split(".").pop()==='jpg'){
           if(e.target.files[0].size < 1024 * 1024){
               setFile(e.target.files);
           }else{
               setFailedOpenToast(true);
               setFailedMsgToast("حجم فایل باید کم تر از 1MB باشد");
               const closingSuccessMsgTimeOut = setTimeout(()=>{setFailedOpenToast(false)}, 3000);
               setFile({});
               uploadInputRef.current.value = "";
           }
       }else{
           setFailedOpenToast(true);
           setFailedMsgToast("فرمت تصویر مناسب نیست");
           const closingSuccessMsgTimeOut = setTimeout(()=>{setFailedOpenToast(false)}, 3000);
           setFile({});
           uploadInputRef.current.value = "";
       }

}









    const sendData = async() =>{


        

        const formData = new FormData();
                
        formData.append('firstName' , name);
        formData.append('lastName' , lastName);
        formData.append('password' , password);
        formData.append('phoneNumber' , phoneNumber);
        formData.append('access' , access);
        formData.append('images' , file[0]);
        try{
            const response = await authContext.jwtInst({
                method:'post',
                url:`${urlContext.authTargetApi}/auth/register`,
                data:formData,
                //progress bar precentage
                onUploadProgress: data => {                           
                    console.log(Math.round((100 * data.loaded) / data.total))
                    setProgressBar(Math.round((100 * data.loaded) / data.total));
                    if(Math.round((100 * data.loaded) / data.total) === 100){
                        
                    }
                },
                config: { headers: {'Content-Type': 'multipart/form-data' }}
            })
            
            // setRefresh(Math.random())
            // history.push('#');
            // props.setSuccessToast({status:true , msg:'کاربر جدید ایجاد شد'});
            // props.setRefresh(Math.random())
            // const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'کاربر جدید ایجاد شد'})}, 3000);
            // const closingSuccessMsgTimeOutModal2 = setTimeout(()=>{
            //     setFile({});
            //     uploadInputRef.current.value = "";
            //     // setProgressBar('');
            // }, 500);
            // const closingSuccessMsgTimeOutModal = setTimeout(()=>{    
            //     // props.setNewUserStatus(false);
            // }, 300);
        }catch(err){
            console.log(err)

        }
    }

    return(
        <Fragment>
            {props.newUserStatus === true?
                <div className={Style.newInvoice}>
                    <div className={Style.topSection}>
                        <div onClick={()=>{props.setNewUserStatus(false);  history.push('#newUser');}} className={Style.backBtn}><ArrowBackIosIcon sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                        <div className={Style.topTitle}>کاربر جدید</div>
                    </div>
                    <div dir='rtl'  className={Style.formDiv}>
                    <div dir="rtl" className={props.showModal === true ? `${Style.modalDiv} ${Style.fadeIn}` : props.showModal === false ? `${Style.modalDiv} ${Style.fadeOut}` : null}>
                        <div style={{padding:'0px'}} onClick={props.closeModal} className={props.showModal === true ? `${Style.backDrop} ${Style.fadeIn}` : props.showModal === false ? `${Style.backDrop} ${Style.fadeOut}` : null} dir='rtl' ></div>
                            <div style={{padding:'0px 0px 30px 0px'}}  className={props.showModal === true ? `${Style.modalBoarder} ${Style.scaleIn}` : props.showModal === false ? `${Style.modalBoarder} ${Style.scaleOut}` : null} >
                                {file[0] !== undefined ?
                                    <div  className={Style.profDiv}>
                                        <img alt='theImage' title='theImage' className={Style.profImg} src={`${URL.createObjectURL(file[0])}`}></img>
                                    </div>
                                :
                                    <div  className={Style.profDiv}>
                                        <img alt='placeholder' title='placeholder' className={Style.profImg} src={Prof}></img>
                                    </div>
                                }
                                <div  className={Style.inputUploadDiv}>
                                    <Form.Group style={{padding:'0px'}} controlId="formFile" className="mb-3">
                                        <Form.Control ref={uploadInputRef} type="file" onChange={getFile} />
                                    </Form.Group>
                                    <div>
                                        <span style={{padding:'0px 6px 3px 0px'}}>آپلود شده:</span><ProgressBar style={{background:"#E6EDFD" , height:'20px'}} now={progressBar} label={progressBar} /> 
                                    </div>
                                </div>
                            </div>                         
                        </div>
                        <div style={{padding:'0px 10px 0px 10px'}}>                  
                            <Row>
                                <Col style={{padding:'0px 0px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                    <MuiInput onChange={(e)=>{setName(e.target.value)}} name='نام' type='normal' width='100%'></MuiInput>
                                </Col>
                                <Col style={{padding:'0px 5px 0px 0px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                    <MuiInput onChange={(e)=>{setLastName(e.target.value)}} name='نام خانوادگی' type='normal' width='100%'></MuiInput>
                                </Col>
                            </Row>
                            <Row>
                                <Col  style={{padding:'10px 0px 0px 5px'}} xs={4} md={4} lg={4} xl={4} xxl={4}>
                                    <MuiInput name='کد تایید' type='normal' width='100%'></MuiInput>
    
                                </Col>
                                <Col style={{padding:'10px 5px 0px 0px'}} xs={8} md={8} lg={8} xl={8} xxl={8}>
                                    <MuiInput onChange={(e)=>{setPhoneNumber(e.target.value)}} name='شماره تلفن' type='normal' width='100%'></MuiInput>
                                </Col>
                            </Row>
                            <Row>
                                <Col style={{padding:'0px 0px 0px 0px' , marginRight:'-8px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <MuiInput  onChange={(e)=>{setPassword(e.target.value)}} name='کلمه عبور' type='password' width='100%'></MuiInput>
                                </Col>
                            </Row>
                            <Row>
                                <Col style={{padding:'0px 0px 0px 0px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
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
                </div>
            :null
            }
        </Fragment>
    )
}
const NewUser = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <NewUserPortal 
              newUserStatus={props.newUserStatus}
              setNewUserStatus={props.setNewUserStatus}
              showModal={props.showModal}
            ></NewUserPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default NewUser;