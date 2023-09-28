import  React , {useContext, useEffect} from 'react';
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
import Style from './leftSideNav.module.scss'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { Link , useHistory} from 'react-router-dom';
import AuthContext from '../../components/authAndConnections/auth';
import jwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Diversity2Icon from '@mui/icons-material/Diversity2';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useState } from 'react';
import PageSection from '../../contextApi/pageSection';
import { Report } from '@mui/icons-material';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
export default function LeftSideNav(props) {
const authContext = useContext(AuthContext);
const pageSection = useContext(PageSection);
const [value , setValue ] = useState();
const history = useHistory();
// useEffect(() => {
//   if (localStorage.getItem("pageState") !== null) {
    
//     setValue(parseInt(localStorage.getItem("pageState")))
//   } else {
//     localStorage.setItem("pageState" , 0)
//   }
// }, [])
// useEffect(() => {

//   if(value === 1){
//     console.log(1)
//     if(localStorage.getItem('fileMemory') === undefined){
//       history.push('/files')
//       localStorage.setItem('fileMemory' , '/files')
//     }else if(localStorage.getItem('fileMemory') !== undefined){
//       history.push(localStorage.getItem('fileMemory'))
//     }
//   }else if(value === 0){
//     localStorage.setItem('pageState' , 0)
//     console.log(0)
//     // history.push('/invoices')
//   }else if(value === 2){
//     console.log(2)
//     localStorage.setItem('pageState' , 2)

//     // history.push('/crm')
//   }
// }, [value]);
  const list = (anchor) => (
    
    <Box
      sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250   }}
      role="presentation"
      onClick={props.toggleDrawer(anchor, false)}
      onKeyDown={props.toggleDrawer(anchor, false)}
    >
      <List>
          {/* <ListItem  disablePadding>
                <div  className={Style.topSection}>
                    <div onClick={()=>{props.toggleDrawer('left', false)}} className={Style.backBtn}><ArrowBackIosIcon sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                    <div style={{float:'left'}} className={Style.topTitle}>Sections</div>
                </div>
          </ListItem> */}
          <div style={{marginTop:'60px'}}>

              <ListItem  style={{fontSize:'26px' , width:'fit-content' , padding:'8px 0px 8px 0px' , marginLeft:'12px', fontFamily:'YekanBold'}} disablePadding>
                XCAPITAL
              </ListItem>

              <ListItem sx={{background:pageSection.selectedSection=== 0?'rgb(222, 222, 222)':null}}  onClick={()=>{pageSection.selectedSectionFunc(0);history.push('/mis')}} disablePadding>
                  <ListItemButton >
                  <ListItemIcon style={{minWidth:'0px',padding:'0px 10px 0px 0px'}}>
                      <ReceiptIcon sx={{color:'black'}}></ReceiptIcon>
                  </ListItemIcon>
                      <ListItemText  primary='Invoices' />
                  </ListItemButton>
              </ListItem>
              <ListItem sx={{background:pageSection.selectedSection=== 2?'rgb(222, 222, 222)':null}}  onClick={()=>{pageSection.selectedSectionFunc(2);history.push('/crm')}} disablePadding>
                  <ListItemButton >
                  <ListItemIcon style={{minWidth:'0px',padding:'0px 10px 0px 0px'}}>
                      <PeopleAltIcon sx={{color:'black'}}></PeopleAltIcon>
                  </ListItemIcon>
                      <ListItemText  primary='Customers' />
                  </ListItemButton>
              </ListItem>
              <ListItem sx={{background:pageSection.selectedSection=== 1?'rgb(222, 222, 222)':null}} onClick={()=>{pageSection.selectedSectionFunc(1);history.push('/files')}}  disablePadding>
                  <ListItemButton>
                  <ListItemIcon style={{minWidth:'0px',padding:'0px 10px 0px 0px'}}>
                      <InsertDriveFileIcon sx={{color:'black'}}></InsertDriveFileIcon>
                  </ListItemIcon>
                      <ListItemText  primary='Files' />
                  </ListItemButton>
              </ListItem>
              <ListItem sx={{background:pageSection.selectedSection=== 3?'rgb(222, 222, 222)':null}}  onClick={()=>{pageSection.selectedSectionFunc(3);history.push('/jobReport')}}  disablePadding>
                  <ListItemButton >
                  <ListItemIcon style={{minWidth:'0px',padding:'0px 10px 0px 0px'}}>
                      <WorkHistoryIcon sx={{color:'black'}}></WorkHistoryIcon>
                  </ListItemIcon>
                      <ListItemText  primary='Job report' />
                  </ListItemButton>
              </ListItem>
              <Divider></Divider>
              {jwtDecode(JSON.stringify(localStorage.getItem('accessToken'))).access.includes('sa') ? 
                <Link style={{textDecoration:'none' , color:'black'}} to='/users'>
                  <ListItem   disablePadding>
                      <ListItemButton>
                        <ListItemIcon style={{minWidth:'0px',padding:'0px 10px 0px 0px'}}>
                            <Diversity2Icon sx={{color:'black'}}></Diversity2Icon>
                        </ListItemIcon>
                          <ListItemText  primary='peaple' />
                      </ListItemButton>
                  </ListItem>
                </Link>
            :
                <ListItem   disablePadding>
                    <ListItemButton disabled={true}>
                    <ListItemIcon style={{minWidth:'0px',padding:'0px 10px 0px 0px'}}>
                        <Diversity2Icon sx={{color:'black'}}></Diversity2Icon>
                    </ListItemIcon>
                        <ListItemText primary='peaple' />
                    </ListItemButton>
                </ListItem>
            }
          </div> 

      </List>
      {/* <Divider /> */}

    </Box>
  );

  return (
    <div>

        <React.Fragment>
          <SwipeableDrawer
            anchor={'left'}
            open={props.leftSideNav['left']}
            onClose={props.toggleDrawer('left', false)}
            onOpen={props.toggleDrawer('left', true)}
          >
            {list('left')}
          </SwipeableDrawer>
        </React.Fragment>
   </div>
  );
}