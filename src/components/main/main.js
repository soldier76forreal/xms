import { Fragment , useState , useContext , useEffect } from 'react';
import Style from './main.module.scss';
import { Container } from 'react-bootstrap';
import PropTypes from 'prop-types';
import SwipeableViews from 'react-swipeable-views';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';


import {   actions, fetchData } from "../../store/fileManager";
import MainNav from '../../tools/navs/mainNav';
import SubNav from '../../tools/navs/subNav';
import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import ContactList from '../mis/contactList';
import Mis from '../mis/mis';
import { Lock } from '@mui/icons-material';
import Notfications from '../mis/notfications';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import Crm from '../crm/crm';
import FileMain from '../fileManager/fileMain';
import { useHistory, useLocation } from "react-router-dom";
import { useDispatch } from 'react-redux';


function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`full-width-tabpanel-${index}`}
        aria-labelledby={`full-width-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }
  
  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  };
  
  function a11yProps(index) {
    return {
      id: `full-width-tab-${index}`,
      'aria-controls': `full-width-tabpanel-${index}`,
    };
  }

const Main = () =>{
  const authCtx =useContext(AuthContext);
  const axiosGlobal =useContext(AxiosGlobal);
  const dispatch = useDispatch();
  const location = useLocation()
  const [pageState , setPageState] = useState('');
  let history = useHistory();

  const theme = useTheme();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (localStorage.getItem("pageState") !== null) {
      
      setValue(parseInt(localStorage.getItem("pageState")))
    } else {
      localStorage.setItem("pageState" , 0)
    }
  }, [])
  



    const handleChange = (event, newValue) => {
      localStorage.setItem("pageState" , newValue)
      setValue(newValue);
      if(newValue === 1){
        history.push('/files')
      }

    };
    useEffect(() => {
      if(localStorage.getItem("pageState") === 1){
        if(localStorage.getItem('fileMemory') === undefined){
          history.push('/files')
          localStorage.setItem('fileMemory' , '/files')
        }else if(localStorage.getItem('fileMemory') !== undefined){
          history.push(localStorage.getItem('fileMemory'))
        }
      }else if(localStorage.getItem("pageState") === 0){
        
      }
    }, [value , location]);
    const handleChangeIndex = (index) => {
      localStorage.setItem("pageState" , index)
      setValue(index);
      if(index === 1){
        history.push('/files')
      }


    };



    

 
    return(
        <Fragment>

        
            <MainNav></MainNav>
              <div className={Style.tabsDiv}  style={{width:'100%' , position:'relative' , height:'100%'}}>
              <Box  sx={{ bgcolor: 'background.paper', width: '100%'  ,boxShadow:'none' , height:'100%'}}>
                  <AppBar  position="static">
                    <Tabs
                      value={value}
                      onChange={handleChange}
                      indicatorColor="secondary"
                      textColor="inherit"
                      sx={{backgroundColor:'#F8F8F8',boxShadow:'none' , color:'#000'}}
                      variant="fullWidth"
                      aria-label="full width tabs example"
                    >
                      <Tab label="درخواست ها" {...a11yProps(0)} />
                      <Tab label="فایل ها" {...a11yProps(1)} />
                      <Tab label="مشتری ها" {...a11yProps(2)} />
                    </Tabs>
                  </AppBar>
                  <SwipeableViews
                    axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                    index={value}
                    sx={{width:'100%' ,boxShadow:'none', height:'100%'}}
                    onChangeIndex={handleChangeIndex}
                  >
                  <TabPanel style={{backgroundColor:'#F8F8F8' ,boxShadow:'none' , positiona:'absolute', minHeight:'100%'}} value={value} index={0} dir={theme.direction}>
                    <Mis></Mis>
                  </TabPanel>
                  <TabPanel className={Style.fileTabPanel} value={value} index={1} dir={theme.direction}>
                      <FileMain></FileMain>
                      
                  </TabPanel>
                  <TabPanel style={{backgroundColor:'#F8F8F8' ,boxShadow:'none' , positiona:'absolute', minHeight:'100%'}} value={value} index={2} dir={theme.direction}>

                      <Crm></Crm>
                  </TabPanel>
                </SwipeableViews>
              </Box>
                
            </div>
        </Fragment>
    )
}
export default Main;