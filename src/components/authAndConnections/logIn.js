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
            let error = 'خطایی رخ داده است!'
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
                    <Row>
                        <Col style={{padding:'0px'}} xs={12} md={12} lg={12} xl={12} xxl={12}>
                            <div className={Style.keySiv}>
                                <h2>XCAPITAL</h2>
                            </div>
                        </Col>
                        <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                            <div dir='rtl' className={Style.fields}>
                                <TextField

                                    id="filled-multiline-flexible"
                                    label='شماره تلفن'
                                    sx={{width:'100%'}}
                                    multiline
                                    onChange={getPhoneNumber}
                                    maxRows={2}
                                    inputProps={{min: 0, style: { textAlign: 'right' , width:'100%' }}} // the change is here
                                    variant="filled"
                                />
                                <FormControl  sx={{ m: 1, width: '100%' , margin:'10px 0px 0px 0px'}} variant="filled">
                                <InputLabel htmlFor="filled-adornment-password">کلمه عبور</InputLabel>
                                <FilledInput
                                    id="filled-adornment-password"
                                    type={showPassword ? 'text' : 'password'}
                                    onChange={getPassword}
                                    endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={()=>{if(showPassword === true){setShowPassword(false)}else if(showPassword === false){setShowPassword(true)}}}
                                        edge="end"
                                        >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                    }
                                />
                                </FormControl>
                            </div>
                        </Col>
                        <Col xs={12} md={12} lg={12} xl={12} xxl={12}>
                            <div className={Style.logInBtnDiv}>
                                <div style={{color:'red' ,fontSize:'16px' , height:'20px' , marginBottom:'10px'}}>{signUpErrorMsg}</div>
                                <Button onClick={sendLogIn} style={{margin:'0px auto 0px auto' , paddingTop:'10px' , paddingBottom:'10px' ,width:'100%'}} variant="contained" disableElevation>
                                {loadingStatus ===true ? <CircularProgress size='25px' color='inherit'></CircularProgress> : loadingStatus ===false ?'ورود':null}
                                </Button>
                            </div>
                        </Col>

                    </Row>
                </div>
            </div>
            
        </Fragment>
    )
}

export default LogIn;