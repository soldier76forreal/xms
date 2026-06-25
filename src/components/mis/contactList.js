import React, {useContext , useEffect} from 'react';
import Box from '@mui/material/Box';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import Style from './contactList.module.scss';
import { ArrowBackIos } from '@mui/icons-material';
import { CircularProgress, Drawer } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import Stack from '@mui/material/Stack';
import Persons from './persons';
import AuthContext from '../authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import SocketContext from '../authAndConnections/socketReq';
import { useSelector } from 'react-redux';
import Loader from '../../tools/loader/loader';
export default function ContactList(props) {


  const contactList = useSelector((state) => state.contactList);
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const socketCtx = useContext(SocketContext);
  const [isSend , setIsSent] = React.useState(false);
  const [checked, setChecked] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const toggleDrawer = (anchor, open) => (event) => {
    setChecked([...[]]);
    setIsSent(false);
    if (
      event &&
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }

    props.setState({ ...props.state, [anchor]: open });
  };





  const sendPreInvoices = async()=>{
    const data = {
      peopleToSend :checked,
      from:jwtDecode(authCtx.token).id,
      document:props.targetToSend
    }
    setLoading(true)
    
    setTimeout(async()=>{
        try{
            const response = await authCtx.jwtInst({
              method:'post',
              url:`${axiosGlobal.defaultTargetApi}/mis/sendPreInvoices`,
              data:data,
              config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}

            })
            props.setContectRefresh(Math.random());
            setChecked([...[]]);
            setIsSent(false);
            props.setState({ ...props.state, ['bottom']: false });
            toggleDrawer('bottom', false);
            props.setSuccessToast({status:true , msg:'درخواست شما ارسال شد'});
            const closingSuccessMsgTimeOut = setTimeout(()=>{props.setSuccessToast({status:false , msg:'درخواست شما ارسال شد'})}, 3000);
            socketCtx.sendToContactsIo(checked ,jwtDecode(authCtx.token).id ,props.targetToSend ,'sendRequest');
            setLoading(false)
        }catch(err){
          console.log(err);
        }
      }, 1000)
  }

  const list = (anchor) => (
    
    <Box
      sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : '100%' }}
      role="presentation"
    >
      <div style={{padding:'0px 0px 50px 0px'}}> 

        <List>
        <ListItem disablePadding>
              <div className={Style.topSection}>
                  <div onClick={toggleDrawer(anchor, false)}  className={Style.backBtn}><ArrowBackIos sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIos></div>
                  <div className={Style.topTitle}>مخاطبین</div>
              </div>
          </ListItem>
        </List>
        <List>
          <ListItem dir='rtl' disablePadding>
              <div style={{marginTop:'50px'}} className={Style.topSectionDiv}>
                <span style={{color:'#000'}}>مدیران فروش</span>
              </div>
          </ListItem>
        </List>
        <Divider />
        <List>
          <Persons setChecked={setChecked} checked={checked} userData={contactList.inv} setIsSent={setIsSent}></Persons>
        </List>
        

        <List>
          <ListItem dir='rtl' disablePadding>
              <div style={{marginTop:'0px'}} className={Style.topSectionDiv}>
                <span style={{color:'#000'}}>فروشنده ها</span>
              </div>
          </ListItem>
        </List>
        <Divider />
        <List>
          <Persons setChecked={setChecked} checked={checked} userData={contactList.req} setIsSent={setIsSent}></Persons>
        </List>
        <List>
          <ListItem dir='rtl' disablePadding>
              <div style={{marginTop:'0px'}} className={Style.topSectionDiv}>
                <span style={{color:'#000'}}>مدیریت</span>
              </div>
          </ListItem>
        </List>
        <Divider />
        <List>
          <Persons setChecked={setChecked} checked={checked} userData={contactList.sa} setIsSent={setIsSent}></Persons>
        </List>
      </div>
      {isSend === true?
     
      <List sx={{position:'absolute' , zIndex:'1000', left:'0' , right:'0' , bottom:'0px' , margin:'0px auto 0px auto' , display:'flex' , justifyContent:'center' , marginBottom:'45px'}}>

            <div style={{backgroundColor:'#fff'}} className={Style.sendBtn}>
            <Stack direction="row" spacing={2}>
                <botton style={{marginLeft:'10px'}} onClick={toggleDrawer('bottom', false)} className='btnWithIconOutLine'>
                    <span>Cancel</span>
                    <DeleteIcon />
                </botton>
                <botton onClick={sendPreInvoices} className='btnWithIcon'>
                    <span>Send</span>
                    {loading === true?<Loader width='24px' color='white'></Loader>:<SendIcon />}
                </botton>

            </Stack>
            </div>
      </List>
      :null
       }
    </Box>
  );

  return (
    <div>

        <React.Fragment >
          <Drawer
            sx={{zIndex:'10000'}}
            anchor={'bottom'}
            open={props.state['bottom']}
            onClose={toggleDrawer('bottom', false)}
            onOpen={toggleDrawer('bottom', true)}
          >
            {list('bottom')}
          </Drawer>
        </React.Fragment>
     
    </div>
  );
}