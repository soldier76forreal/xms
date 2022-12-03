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

import ProfImg from '../../assets/imagePlaceHolder.png';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Search } from "@mui/icons-material";
import { Badge, Button } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import LeftSideNav from "./leftSideNav";
const MainNavPortal = (props) =>{
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
    
    return(
        <Fragment>
            <NormalMenuForProfile handleClick={handleClick} handleClose={handleClose} open={open} anchorEl={anchorEl} setAnchorEl={setAnchorEl}></NormalMenuForProfile>
            <LeftSideNav toggleDrawer={toggleDrawer} setLeftSideNav={setLeftSideNav} leftSideNav={leftSideNav}></LeftSideNav>
            <div  className={Style.navDiv}>
                <Navbar className={Style.navBar}  expand="lg">
                    <Container className={Style.containerDiv}> 
                        <Button onClick={toggleDrawer('left', true)} variant="contained" endIcon={<MenuIcon />}>
                        ابزارها
                        </Button>
                        <Navbar.Toggle className={Style.navbarBtn}  aria-controls="basic-navbar-nav">
                            <div>
                                <Hamburger  style={{height:'10px !importain'}}  color="#000" size={29}></Hamburger>
                            </div>
                        </Navbar.Toggle>
                        <Navbar.Collapse  style={{ width:'100%' , margin:'0'  , padding:'0px'}} id="basic-navbar-nav">
                        <Nav  dir="rtl" style={{ width:'100%' , justifyContent:'center' , alignContent:'center' , margin:'0px auto 0px auto'}}  className="me-auto my-2 my-lg-0">
                            <div className={Style.searchBar}> 
                                <div className={Style.searchDiv}>
                                    <Search sx={{color:'rgb(82, 82, 82)'}}></Search>
                                    <input placeholder="جستجو..." type='search'></input>
                                </div>
                            </div>
                        </Nav>
                        </Navbar.Collapse>
                    </Container>
                    <div className={Style.rightSideDiv}>
                        <div className={Style.searchBtn}>
                            <buttom>
                                <Badge badgeContent={0} color="primary">
                                    <NotificationsIcon sx={{color:'#000' , fontSize:'22px' , marginTop:'-6px'}}></NotificationsIcon>
                                </Badge>
                            </buttom>
                        </div>
                        <div className={Style.userBtn}>
                            <buttom>
                                <Badge badgeContent={0} color="primary">
                                    <EmailIcon sx={{color:'#000' , fontSize:'22px' , marginTop:'-6px'}}></EmailIcon>
                                </Badge>

                            </buttom>
                        </div>
                        <div 
                            id="demo-positioned-button"
                            aria-controls={open ? 'demo-positioned-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                            onClick={handleClick}
                        className={Style.profImageDiv}>
                            <img src={ProfImg}></img>
                        </div>
                    </div>
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
                <MainNavPortal>

                </MainNavPortal>
                ,
                document.getElementById('headSec')
                )}
        </Fragment>
    )
}
export default MainNav;