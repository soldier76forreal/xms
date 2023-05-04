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
import areFilesEqual from '../functions/sameFileValidation';


const UserEditPortal =(props)=>{
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
    const [userId , setUserId] = useState('');

    //success toast states
    //failed toast states
    const [failedOpenToast , setFailedOpenToast] = useState(false);
    const [failedMsgToast , setFailedMsgToast] = useState('');
    
    const [file , setFile] = useState({});
    const [initFile , setInitFile] = useState({});
    const [progressBar,setProgressBar] = useState('');

    const getAccess = (e) =>{
        setAccess([...e]);
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
        var temp = [];
        const formData = new FormData();
        access.forEach(element => {
            temp.push(element.value)
        });       
        formData.append('userId', userId); 
        formData.append('firstName' , name);
        formData.append('lastName' , lastName);
        formData.append('access' , temp);
        console.log(areFilesEqual(file , initFile))
        if(areFilesEqual(file , initFile) === false){
            formData.append('images' , file[0]);
            try{
                const response = await authContext.jwtInst({
                    method:'post',      
                    url:`${urlContext.authTargetApi}/auth/updateUser`,
                    data:formData,
                    //progress bar precentage
                    onUploadProgress: data => {                           
                        setProgressBar(Math.round((100 * data.loaded) / data.total));
                        if(Math.round((100 * data.loaded) / data.total) === 100){
                            setRefresh(Math.random())
                            history.push('#');
                            props.setSuccessToast({status:true , msg:'کاربر جدید ایجاد شد'});
                            props.setRefresh(Math.random())
                            const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'کاربر جدید ایجاد شد'})}, 3000);
                            const closingSuccessMsgTimeOutModal2 = setTimeout(()=>{
                                setFile({});
                                uploadInputRef.current.value = "";
                                setProgressBar('');
                            }, 500);
                            const closingSuccessMsgTimeOutModal = setTimeout(()=>{    
                                props.setOpenEditUser(false)
                            }, 300);
                        }
                        },
                    config: { headers: {'Content-Type': 'multipart/form-data' }}
                })
                

            }catch(err){
                console.log(err);
            }
        }else if(areFilesEqual(file , initFile) === true){

            try{
                const response = await authContext.jwtInst({
                    method:'post',
                    url:`${urlContext.authTargetApi}/auth/updateUser`,
                    data:formData,
                    config: { headers: {'Content-Type': 'multipart/form-data' }}
                })
                
                setRefresh(Math.random())
                history.push('#');
                props.setOpenEditUser(false)
                props.setSuccessToast({status:true , msg:'کاربر جدید ایجاد شد'});
                props.setRefresh(Math.random())
                const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'کاربر جدید ایجاد شد'})}, 3000);
            }catch(err){
                console.log(err);
            }
        }

    }
    useEffect(() => {
        var tempArr =[]
        if( props.targetedEditData !== undefined){
            setName(props.targetedEditData.firstName)
            setLastName(props.targetedEditData.lastName)
            setPhoneNumber(props.targetedEditData.phoneNumber)
            setUserId(props.targetedEditData._id);
            if(props.targetedEditData.access !== undefined){
                for(var j = 0 ; props.targetedEditData.access.length > j ; j++){
                    for(var i = 0 ; webSectionContext.listOfSections.length > i ; i++){
                        if(props.targetedEditData.access[j] === webSectionContext.listOfSections[i].value){
                            tempArr.push(webSectionContext.listOfSections[i])
                        }
                    }
                }
            }
            setAccess([...tempArr])
            if(props.targetedEditData.profileImage !== undefined){
                setFile(props.targetedEditData.profileImage)
                setInitFile(props.targetedEditData.profileImage)
            }
        }
    }, [props.targetedEditData]);

    return(
        <Fragment>
            <div style={props.openEditUser === true?{display:'block'}:{display:'none'}}  className={props.openEditUser === true? `${Style.newInvoice} ${Style.fadeIn}` : props.openEditUser === false?`${Style.newInvoice} ${Style.fadeOut}`:null}>
                <div className={Style.topSection}>
                    <div onClick={()=>{props.setOpenEditUser(false);  history.push('#EditUser');}} className={Style.backBtn}><ArrowBackIosIcon className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                    <div className={Style.topTitle}>ویرایش پروفایل</div>
                </div>
                <div className={Style.ovDiv}  dir='rtl'  style={{maxWidth:'700px' , margin:'0px auto 0px auto'  , overflowY:'scroll' , height:'95vh' , padding:"0px 15px 60px 15px"}}>
                    <div style={{margin:'0px auto 0px auto' }}>        
                        <div style={{padding:'0px 0px 10px 0px'}}>
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
                        <div style={{padding:'0px 10px 0px 10px'}}> 
                            <Row style={{padding:'13px 8px 13px 8px'}}>
                                <Col style={{padding:'0px 0px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                    شماره شما:
                                </Col>
                                <Col style={{padding:'0px 5px 0px 0px', textAlign:'left'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                    {phoneNumber}
                                </Col>
                            </Row>                 
                            <Row>
                                <Col style={{padding:'0px 0px 0px 5px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                    <MuiInput value={name} onChange={(e)=>{setName(e.target.value)}} name='نام' type='normal' width='100%'></MuiInput>
                                </Col>
                                <Col style={{padding:'0px 5px 0px 0px'}} xs={6} md={6} lg={6} xl={6} xxl={6}>
                                    <MuiInput value={lastName} onChange={(e)=>{setLastName(e.target.value)}} name='نام خانوادگی' type='normal' width='100%'></MuiInput>
                                </Col>
                            </Row>
                            <Row>
                                <Col style={{padding:'0px 0px 0px 0px' , marginTop:'15px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                                    <MultiSelect value={access} onChange={getAccess} options={webSectionContext.listOfSections} setAccess={setAccess} type='normal' width='100%'></MultiSelect>
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
            </div>
        </Fragment>
    )
}


const UserEdit = ( props )=>{
    return(
      <Fragment>
          {ReactDom.createPortal(
            <UserEditPortal 
              setOpenEditUser={props.setOpenEditUser}
              openEditUser={props.openEditUser}
              targetedEditData={props.targetedEditData}
              setTargetedEditData={props.setTargetedEditData}
              setSuccessToast={props.setSuccessToast}
            ></UserEditPortal>
          ,
          document.getElementById('ovForms')
          )}

      </Fragment>
  );
}
export default UserEdit;