import React, {useContext} from 'react';
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
import { Drawer } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import Stack from '@mui/material/Stack';
import Persons from './persons';
import GetDatas from '../../contextApi/getDatas';
import AuthContext from '../authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
export default function ContactList(props) {
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);
  const userData = useContext(GetDatas);
    const [isSend , setIsSent] = React.useState(false);
    const [checked, setChecked] = React.useState([]);
    const [inv , setInv] = React.useState([]);
    const [req , setreq] = React.useState([]);
    
  const toggleDrawer = (anchor, open) => (event) => {
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
  for(var i = 0 ; userData.userData.length > i ; i++){
    if(userData.userData[i].access.includes('inv') === true){
      inv.push(userData.userData[i]);
    }
  }
  for(var g = 0 ; userData.userData.length > g ; g++){
    if(userData.userData[g].access.includes('req') === true){
      req.push(userData.userData[g]);
    }
  }


  const sendPreInvoices = async()=>{
    const data = {
      peopleToSend :checked,
      from:jwtDecode(authCtx.token).id,
      document:props.targetToSend
    }
    
    try{
        const response = await axios({
          method:'post',
          url:`${axiosGlobal.defaultTargetApi}/mis/sendPreInvoices`,
          data:data,
          config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}

        })
        console.log(response);
    }catch(err){
      console.log(err);
    }
  }
  const list = (anchor) => (
    <Box
      sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : '100%' }}
      role="presentation"
    >
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
            <div  className={Style.topSectionDiv}>
              <span style={{color:'#000'}}>مدیران فروش</span>
            </div>
        </ListItem>
      </List>
      <Divider />
      <List>
        <Persons setChecked={setChecked} checked={checked} userData={userData.userData} setIsSent={setIsSent}></Persons>
      </List>
      {isSend === true?
     
      <List sx={{position:'relative' , display:'flex' , justifyContent:'center' , marginBottom:'45px'}}>

            <div className={Style.sendBtn}>
            <Stack direction="row" spacing={2}>
                <Button onClick={toggleDrawer('bottom', false)} variant="outlined" startIcon={<DeleteIcon />}>
                لغو
                </Button>
                <Button onClick={sendPreInvoices} variant="contained" endIcon={<SendIcon />}>
                ارسال
                </Button>
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