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


import {   actions, fetchData } from "../../store/store";
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
import PageSection from '../../contextApi/pageSection';
import MainJobReport from '../jobReport/mainJobReport';



  


const Main = () =>{
  const pageSection = useContext(PageSection)
  // useEffect(() => {
  //   setValue(localStorage.getItem("pageState"))
  //   console.log(value)
  // }, [localStorage.getItem("pageState")])

  // useEffect(() => {
  //   if (localStorage.getItem("pageState") !== null) {
      
  //     setValue(parseInt(localStorage.getItem("pageState")))
  //   } else {
  //     localStorage.setItem("pageState" , 0)
  //   }
  // }, [])
  



  //   const handleChange = (event, newValue) => {
  //     localStorage.setItem("pageState" , newValue)
  //     setValue(newValue);
  //     if(newValue === 1){
  //       history.push('/files')
  //     }

  //   };
  //   useEffect(() => {
  //     if(localStorage.getItem("pageState") === 1){
  //       if(localStorage.getItem('fileMemory') === undefined){
  //         history.push('/files')
  //         localStorage.setItem('fileMemory' , '/files')
  //       }else if(localStorage.getItem('fileMemory') !== undefined){
  //         history.push(localStorage.getItem('fileMemory'))
  //       }
  //     }else if(localStorage.getItem("pageState") === 0){
        
  //     }
  //   }, [value , location]);
  //   const handleChangeIndex = (index) => {
  //     localStorage.setItem("pageState" , index)
  //     setValue(index);
  //     if(index === 1){
  //       history.push('/files')
  //     }


  //   };



    

 
    return(
        <Fragment>
            <MainNav></MainNav>
            <div style={{marginTop:'60px'}}>
              {pageSection.selectedSection === 0?
                <Mis></Mis>
              :pageSection.selectedSection === 1?
                <FileMain></FileMain>
              :pageSection.selectedSection === 2?
                <Crm></Crm>
              :pageSection.selectedSection === 3?
                <MainJobReport></MainJobReport>
              :null}
            </div>
        </Fragment>
    )
}
export default Main;