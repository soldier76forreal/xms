import { Fragment , useContext , useState  , useEffect , useLayoutEffect} from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactDom from 'react-dom';
import {Pagination,Navbar,Row  , Nav ,NavDropdown , Container ,Form ,FormControl , Col} from 'react-bootstrap';
import Style from './mainNav.module.scss';
import { Rotate as Hamburger } from 'hamburger-react'
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import axios from "axios";
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import NormalMenuForProfile from './normalMenuForProfile';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Search } from "@mui/icons-material";
import { Badge, Button } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import jwtDecode from 'jwt-decode';
import LeftSideNav from "./leftSideNav";
import ProfilePhoto from '../../assets/imagePlaceHolder.png';
import AuthContext from "../../components/authAndConnections/auth";
import Notfications from "../../components/mis/notfications";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import FilterModal from "./filterModal";
import SearchBar from "./searchModule";
const MainNavPortal = (props) =>{
    const [showNotfication , setShowNotfication] = useState(false);
    const [notifCount , setNotifCount] = useState();
    const authContext = useContext(AuthContext);
    const [status , setStatus] = useState(false);
    const [openFilterModal , setOpenFilterModal] = useState(false);

    const [leftSideNav , setLeftSideNav] = useState({
        left: false,
      
      });
      const toggleDrawer = (anchor, open) => (event) => {
        if (
          event &&
          event.type === 'keydown' &&
          (event.key === 'Tab' || event.key === 'Shift')
        ) {
          return;
        }
    
        setLeftSideNav({ ...leftSideNav, [anchor]: open });
      };
      const [anchorEl, setAnchorEl] = useState(null);
      const open = Boolean(anchorEl);
      const handleClick = (event) => {
        
        setAnchorEl(event.currentTarget);
      };
      const handleClose = () => {
        setAnchorEl(null);
      };
      const logOut = () => {
        authContext.logout()
        setAnchorEl(null);
      };
    return(
        <Fragment>
            <FilterModal  setOpenFilterModal={setOpenFilterModal} openFilterModal={openFilterModal}></FilterModal>
            <Notfications notifCount={(e)=>{setNotifCount(e)}}  setShowNotfication={setShowNotfication} showNotfication={showNotfication}></Notfications>
            <NormalMenuForProfile logOut={logOut} handleClick={handleClick} handleClose={handleClose} open={open} anchorEl={anchorEl} setAnchorEl={setAnchorEl}></NormalMenuForProfile>
            <LeftSideNav a11yProps={props.a11yProps} toggleDrawer={toggleDrawer} setLeftSideNav={setLeftSideNav} leftSideNav={leftSideNav}></LeftSideNav>
            <div dir="ltr" className={Style.navDiv}>
                <Navbar className={Style.navBar}  expand="lg">
                    <Container className={Style.containerDiv}> 
                    <div style={{textAlign:'left',width:'5%'}}>
                        <botton onClick={leftSideNav.left===true?toggleDrawer('left', false):toggleDrawer('left', true)} style={{backgroundColor:'black', padding:'6px 7px 6px 7px' , borderRadius:'3px'}}>
                            {leftSideNav.left === false?<MenuIcon sx={{fontSize:'22px'}}/>:<ArrowBackIcon sx={{fontSize:'22px'}}/>}
                        </botton>
                        
                    </div>
                    <div className={Style.searchBar}>
                        <SearchBar></SearchBar>
                    </div>
                    <div className={Style.rightSideDiv}>
                        <div style={{background:'none',border:'solid black 2px'}} onClick={()=>{showNotfication?setShowNotfication(false):setShowNotfication(true)}} className={Style.searchBtn}>
                            <botton >
                                <Badge badgeContent={notifCount} color="primary">
                                    <NotificationsIcon sx={{color:'#000' , fontSize:'22px' , marginTop:'1px'}}></NotificationsIcon>
                                </Badge>
                            </botton>
                        </div>
                        <div style={{background:'none',border:'solid black 2px'}} className={Style.userBtn}>
                            <botton >
                                <Badge  badgeContent={0} color="primary">
                                    <EmailIcon sx={{color:'#000' , fontSize:'22px' , marginTop:'1px'}}></EmailIcon>
                                </Badge>

                            </botton>
                        </div>
                        <div 
                            id="demo-positioned-button"
                            aria-controls={open ? 'demo-positioned-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                            onClick={handleClick}
                        className={Style.profImageDiv}>
                            <Avatar
                                alt="Remy Sharp"
                                src={jwtDecode(authContext.token).profileImage  === undefined && authContext.login === false ?ProfilePhoto:jwtDecode(authContext.token).profileImage !== undefined && authContext.login === true ? `${authContext.defaultTargetApi}/uploads/${jwtDecode(authContext.token).profileImage.filename}`:null}
                                sx={{ width: 40, height: 40 }}
                            />
                        </div>
                    </div>
                    </Container>
                </Navbar>
                <div className={Style.bottomLine}></div>

            </div>
        </Fragment>
    )
}
const MainNav = (props)=>{
    return(
        <Fragment>
            {ReactDom.createPortal(
                <MainNavPortal notifCount={props.notifCount} showNotfication={props.showNotfication} setShowNotfication={props.setShowNotfication}>

                </MainNavPortal>
                ,
                document.getElementById('headSec')
                )}
        </Fragment>
    )
}
export default MainNav;