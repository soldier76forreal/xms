//css
import Style from './logIn.module.scss';
//hooks
import { Fragment, useState , useContext , useEffect } from 'react';
//frameworks
import 'bootstrap/dist/css/bootstrap.min.css';
import {Pagination,Navbar,Row,  Nav ,NavDropdown , Container ,Form , Col} from 'react-bootstrap';
import KeyIcon from '@mui/icons-material/Key';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Alert, Button, FilledInput, IconButton, TextField } from '@mui/material';
import * as React from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import axios from 'axios';
import AxiosGlobal from './axiosGlobalUrl';
import AuthContext from './auth';
import CircularProgress from '@mui/material/CircularProgress';
import { useHistory } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import '../overalStyle/overals.scss'
import Loader from '../../tools/loader/loader';



const LogIn =(props)=>{
    
    const axiosGlobal = useContext(AxiosGlobal);
    const AuthCtx = useContext(AuthContext);
    const [showPassword , setShowPassword] = useState(false);
    const history = useHistory();

    const [phoneNumber , setPhoneNumber] = useState('');
    const [password , setPassword] = useState('');
    const [signUpError , setSignUpError] = useState(false);
    const [signUpErrorMsg , setSignUpErrorMsg] = useState('');
    const [loadingStatus , setLoadingStatus] = useState(false);
    const [passwordVisibiltyStatus , setPasswordVisibilityStatus] = useState(false);

    useEffect(() => {
        setSignUpError(false);
        setSignUpErrorMsg('');
    }, [phoneNumber , password])
    const styles = {
        smallIcon: {
          width: 76,
          height: 76,
        }
      };
      const getPhoneNumber = (e) =>{
          setPhoneNumber(e.target.value);
      }
      const getPassword = (e) =>{
        setPassword(e.target.value);
    }
      const formData ={
          phoneNumber:phoneNumber,
          password:password
      }
      const sendLogIn = async () =>{
          try{
            setLoadingStatus(true);
              const response = await axios({
                  withCredentials:true,
                  method:'post',
                  url:`${axiosGlobal.authTargetApi}/auth/login`,
                  data : formData,
                  config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
              })
              const data = await response.data;
            //   const expirationAuth = new Date(new Date().getTime() + (3600 * 1000));
              if(data.accessToken !== undefined){
                AuthCtx.login(data.accessToken);
                AuthCtx.access = jwtDecode(data.accessToken).access;
                setLoadingStatus(false);
                history.replace('/');
              }
          }catch(err){
            let error = 'Log in failed...'
            if(err && err.response.data !== ''){
                error=err.response.data;
                setSignUpError(true);
                setSignUpErrorMsg(error);
              setLoadingStatus(false);
            }     
          }
      }
    return(
        <Fragment>

            <div  className={Style.overDiv}>

                <div  className={Style.background}>
                    <Row style={{padding:'0px'}}>
                        <Col style={{padding:'0px' , display:'flex', justifyContent:'center' , alignItems:'center'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                            <div className={Style.keySiv}>
                                <h2>XMS</h2>
                            </div>
                        </Col>
                        <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                            <div  className={Style.fields}>
                                <input
                                    className='normInput'
                                    placeholder='Phone number'
                                    sx={{width:'100%'}}
                                    onChange={getPhoneNumber}
                                />
                                <div style={{position:'relative', marginTop:'10px'}}>

                                    <input
                                        className='normInput'
                                        type={showPassword ? 'text' : 'password'}
                                        onChange={getPassword}
                                        placeholder='Password'
                                    />
                                     <IconButton
                                        sx={{position:'absolute' , right:'15px'}}
                                        aria-label="toggle password visibility"
                                        onClick={()=>{if(showPassword === true){setShowPassword(false)}else if(showPassword === false){setShowPassword(true)}}}
                                        edge="end"
                                        >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </div>
                            </div>
                        </Col>
                        <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                            <div className={Style.logInBtnDiv}>
                                <div style={{color:'red' ,fontSize:'14px' , height:'20px' , marginBottom:'10px'}}>{signUpErrorMsg}</div>
                                <botton onClick={sendLogIn} className='btn'>
                                {loadingStatus ===true ? <Loader width='25px' color='white' ></Loader > : loadingStatus ===false ?'Log in':null}
                                </botton>
                            </div>
                        </Col>

                    </Row>
                    <div style={{padding:'10px 0px 9px 10px', fontFamily:'codeBold', borderRadius:'5px' , letterSpacing:'1px',width:'100%',backgroundColor:'black' , color:'white',display:'flex', justifyContent:'center',alignItems:'center'}}>
                         XCAPITAL           
                    </div>
                </div>
            </div>
            
        </Fragment>
    )
}

export default LogIn;