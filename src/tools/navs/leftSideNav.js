import  React , {useContext} from 'react';
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
import { Link } from 'react-router-dom';
import AuthContext from '../../components/authAndConnections/auth';

export default function LeftSideNav(props) {
const authContext = useContext(AuthContext);


  const list = (anchor) => (
    <Box
      sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }}
      role="presentation"
      onClick={props.toggleDrawer(anchor, false)}
      onKeyDown={props.toggleDrawer(anchor, false)}
    >
      <List>
          <ListItem  disablePadding>
                <div className={Style.topSection}>
                    <div onClick={()=>{props.toggleDrawer('left', false)}} className={Style.backBtn}><ArrowBackIosIcon sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                    <div className={Style.topTitle}>ابزارها</div>
                </div>
          </ListItem>
          <Link style={{textDecoration:'none' , color:'black'}} to='/users'>
                {authContext.access.includes('sa') ? 
                    <ListItem dir='rtl'  disablePadding>
                        <ListItemButton >
                        <ListItemIcon >
                            <PeopleAltIcon></PeopleAltIcon>
                        </ListItemIcon>
                            <ListItemText style={{textAlign:'right'}} primary='افراد' />
                        </ListItemButton>
                    </ListItem>
                :null}
          </Link>
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