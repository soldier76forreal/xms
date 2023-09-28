import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AuthContext from '../../components/authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import { useContext } from 'react';
import Style from './normalMenuForProfile.module.scss'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { Divider } from '@mui/material';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import WebSections from '../../contextApi/webSection';
import { NotificationImportant, Notifications } from '@mui/icons-material';
import AxiosGlobal from '../../components/authAndConnections/axiosGlobalUrl';

export default function NormalMenuForProfile(props) {
const authCtx = useContext(AuthContext);
var decoded = jwtDecode(authCtx.token);
const axiosGlobal = useContext(AxiosGlobal);

const webSections = useContext(WebSections);
var reg;
  if('Notification' in window){

  }
  const configurePushSub = async() =>{
    if(!('serviceWorker' in navigator)){
      return
    }
    navigator.serviceWorker.ready
    .then((swreg)=>{
      reg=swreg;
      return swreg.pushManager.getSubscription()
    }).then((sub)=>{
      if(sub === null){
        return reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:'BM67mHEyeX_8ChNMsQGcVkgE965usqKz0LTBppeporoWbviq6zPdH2EELVIK2QnlL5MLYqIzf-0-qxdWtBAd5w4'

        })

      }else{

      }
    }).then(async(newSub)=>{
      try{
        const response = await authCtx.jwtInst({
            method:'post',
            url:`${axiosGlobal.defaultTargetApi}/notfication/saveSubsToDb`,
            data:{subs:JSON.stringify(newSub) , userId:jwtDecode(authCtx.token).id},
            config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
        })
      }catch(err){
          console.log(err)
      }
    })
  }
  const activeNotif = () =>{
    Notification.requestPermission((res)=>{
      if(res !== 'granted'){

      }else {
        configurePushSub()
      }
    })
  }
  return (
    <div className={Style.ovDiv}>

      <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={props.anchorEl}
        open={props.open}
        onClose={props.handleClose}
     
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{marginTop:'48px'  ,paddingTop:'0px'}}
        style={{padding:'0px'}}
      >

        <div style={{width:'260px' , height:'240px' , backgroundColor:'black' , boxShadow:'none', position:'relative'}}> 
          <div style={{color:'white' , fontSize:'15px' , padding:'12px 12px 10px 12px'}}>
              <span style={{fontFamily:'YekanBold' , fontSize:'15px'}}>
                <span style={{color:'rgb(172, 172, 172)' }}>Name:</span>{jwtDecode(authCtx.token).firstName} {jwtDecode(authCtx.token).lastName}
              </span>
          </div>
          <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(172, 172, 172)'}}></Divider>
          <div style={{color:'white' , fontSize:'12px' , padding:'12px 12px 10px 12px' , display:'flex', flexWrap:'wrap'}}>
          
                <span style={{color:'rgb(172, 172, 172)' , fontSize:'12px' , padding:'0px' , margin:'3px 3px 0px 0px'}}>Roles:</span>
                {decoded.access.map(data=>{
                    for(var i=0 ; webSections.listOfSections.length >i; i++){
                        if(webSections.listOfSections[i].value === data){
                            return(
                              <Chip size="small" sx={{color:'rgb(255, 255, 255)' , borderColor:'white', margin:'2px' , fontSize:'12px', paddingTop:'2px'}} label={webSections.listOfSections[i].jobTitle} variant="outlined" />
                            )
                        }
                    }
                  })}
          </div>
          <div style={{width:'260px' , display:'flex' ,position:'absolute' , padding:'0px 10px 10px 10px' , bottom:'0px'}}>
            <div onClick={()=>{authCtx.logout()}} style={{margin:'0px 2px 0px 2px'}} className={Style.logOutBtn} >
              <LogoutOutlinedIcon sx={{color:'white',fontSize:'20px'}}></LogoutOutlinedIcon>
            </div>
            <div className={Style.settingBtn} style={{backgroundColor:'red' , margin:'0px 2px 0px 2px' , borderRadius:'5px',width:"100%"}}>
              <ModeEditIcon sx={{color:'rgb(172, 172, 172)' ,fontSize:'20px'}}></ModeEditIcon>
            </div>
            <div onClick={activeNotif} style={{margin:'0px 2px 0px 2px'}}  className={Style.logOutBtn} >
              <Notifications sx={{color:'black',fontSize:'20px'}}></Notifications>
            </div>
            
          </div>
          
        </div>

        {/* <MenuItem onClick={props.handleClose}>تنظیمات</MenuItem>
        <MenuItem onClick={props.logOut}>خروج از حساب کاربری</MenuItem> */}
      </Menu>
    </div>
  );
}