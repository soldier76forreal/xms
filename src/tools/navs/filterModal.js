import Style from './filterModal.module.scss'
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { CircularProgress, Divider, Switch } from '@mui/material';

import CustomSelect from '../inputs/customSelect';
import MultiSelect from '../inputs/multiSelect';
import SortIcon from '@mui/icons-material/Sort';
import { Close, FilterAlt } from '@mui/icons-material';
import { useContext } from 'react';
import AuthContext from '../../components/authAndConnections/auth';
import AxiosGlobal from '../../components/authAndConnections/axiosGlobalUrl';
import { alpha, styled } from '@mui/material/styles';
import '../../components/overalStyle/overals.scss'
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import {  actions } from "../../store/store";
import { useState } from 'react';
import SuccessMsg from './successMsg';

const style = {
    position: 'absolute',
    top: '40%',
    left: '50%',
    overflowY:'none',
    transform: 'translate(-50%, -50%)',
    maxWidth: 600,
    borderRadius:'5px',
    width:'95%',
    height:'400px',
    bgcolor: 'background.paper',
    border: '0px solid #000',
    boxShadow: 24,
    p: 4  ,
  };

  const options = [{value:'none' , name:'none'},{value:'newest' , name:'newest'},{value:'oldest' , name:'oldest'}]
const FilterModal = (props) =>{
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const dispatch = useDispatch()
    const filter = useSelector((state) => state.filterCrm);
    const filterMis = useSelector((state) => state.filterMis);
    const [successToast , setSuccessToast] = useState({status:false , msg:''});


    // ----------------------CRM----------------------
    const [sort , setSort] = useState('')
    const [country , setCountry] = useState('')
    const [attractedBy , setAttractedBy] = useState('')
    const [whatsApp , setWhatsApp] = useState()
    const [havingAdderss , setHavingAdderss] = useState('')


    // ----------------------MIS----------------------
    const [sortMis , setSortMis] = useState('')
    const [requestTypeMis , setRequestTypeMis] = useState('')
    const [sentByMis , setSentByMis] = useState([])
    const [sentToMis , setSentToMis] = useState([])


    const PinkSwitch = styled(Switch)(({ theme }) => ({
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: '#000',
          '&:hover': {
            backgroundColor: alpha('#000', theme.palette.action.hoverOpacity),
          },
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
          backgroundColor: '#000',
        },
      }));
    const changeSort = async(sort)=>{
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/changeCrmSort`,
                data:{newSort:sort==='none'?null:sort},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.crmRefresh(Math.random()));
            
        }catch(err){
            console.log(err);
        }
    }

    const filterByCountry = async(e)=>{
        setCountry(e.code)
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/filterByCountry`,
                data:{country:e.code === 'null'? null:e.code},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.crmRefresh(Math.random()));

        }catch(err){
            console.log(err);
        }
    }

    
    const filterByAttraction = async(e)=>{
        setAttractedBy(e.id)
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/filterByAttraction`,
                data:{attraction: e.id === 'null'? null:e.id},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.crmRefresh(Math.random()));

        }catch(err){
            console.log(err);
        }
    }

    const filterWhatsApp = async(e)=>{
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/filterWhatsAppStatus`,
                data:{filterWhatsApp: !whatsApp},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            setWhatsApp(!whatsApp)
            dispatch(actions.crmRefresh(Math.random()));

        }catch(err){
            console.log(err);
        }
    }

    const filterAddress = async(e)=>{
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/filterHavingAddress`,
                data:{havingAdderss: !havingAdderss},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            setHavingAdderss(!havingAdderss)
            dispatch(actions.crmRefresh(Math.random()));
        }catch(err){
            console.log(err);
        }
    }

    const resetAllCrmFilter = async(e)=>{
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/resetAllCrmFilter`,
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.misRefresh(Math.random()));
            setSuccessToast({status:true , msg:'Filters and sort have been reset'});
            const closingSuccessMsgTimeOut = setTimeout(()=>{setSuccessToast({status:false , msg:'Filters and sort have been reset'})}, 3000);
            dispatch(actions.crmRefresh(Math.random()));
        }catch(err){
            console.log(err);
        }
    }
    const filterCountry = (e , j) =>{
        // var tempAr = [...addresses];
        // tempAr[j.name].country = e.code;
        // setAddresses([...tempAr]);
        console.log(e.code)
       
    }

    // ----------------------MIS----------------------
    const changeSortMis= async(sort)=>{
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/changeMisSort`,
                data:{newSort:sort==='none'?null:sort},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.misRefresh(Math.random()));

        }catch(err){
            console.log(err);
        }
    }
    
    const requestTypeFilterMis = async(e)=>{
        setRequestTypeMis(e.id)
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/requestTypeMis`,
                data:{requestType:e.id === 'null'? null:e.id},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.misRefresh(Math.random()));
        }catch(err){
            console.log(err);
        }
    }

    const sentToFilterMis = async(e)=>{
        var reMap = e.map(res=>{return res.id})
        setSentToMis([...reMap])
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/sentToMis`,
                data:{sentTo:reMap.length === 0? null:reMap},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.misRefresh(Math.random()));
        }catch(err){
            console.log(err);
        }
    }
    const sentByFilterMis = async(e)=>{
        var reMap = e.map(res=>{return res.id})
        setSentByMis([...reMap])
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/sentByMis`,
                data:{sentBy:reMap.length === 0? null:reMap},
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.misRefresh(Math.random()));
        }catch(err){
            console.log(err);
        }
    }
    const resetAllMis = async(e)=>{
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/filter/resetAllMisFilter`,
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.misRefresh(Math.random()));
            setSuccessToast({status:true , msg:'Filters and sort have been reset'});
            const closingSuccessMsgTimeOut = setTimeout(()=>{setSuccessToast({status:false , msg:'Filters and sort have been reset'})}, 3000);
        }catch(err){
            console.log(err);
        }
    }
    useEffect(() => {
        
        if(Object.keys(filter).length !== 0){
            // ----------------------CRM----------------------
            setSort(filter.sort !== null?filter.sort:'null')
            setCountry(filter.filter.country !== null?filter.filter.country:'null')
            setAttractedBy(filter.filter.attractedBy !== null?filter.filter.attractedBy:'null')
            setWhatsApp(filter.filter.whatsApp)
            setHavingAdderss(filter.filter.havingAdderss)
            

            // ----------------------CRM----------------------
            setSortMis(filterMis.sort !== null?filterMis.sort:'null')
            setRequestTypeMis(filterMis.filter.requestType !== null?filterMis.filter.requestType:'null')
            setSentToMis(filterMis.filter.sentTo !== null?[...filterMis.filter.sentTo]:[])
            setSentByMis(filterMis.filter.sentBy !== null?[...filterMis.filter.sentBy]:[])
        }
    }, [filter]);

    const handleOpen = () => props.setOpenFilterModal(true);
    const handleClose = () => props.setOpenFilterModal(false);
    return( 
        <div>
            <SuccessMsg openMsg={successToast.status} msg={successToast.msg}></SuccessMsg>  
            <Modal
            style={{zIndex:'1000'}}
            open={props.openFilterModal}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            > 
            <Box sx={style}>
                <Close onClick={handleClose} sx={{position:'absolute' , right:'2px', top:'2px', fontSize:'30px'}}></Close>
            {localStorage.getItem('pageState') === '0'?
                <div className={Style.ovStyle}>
                    <div className={Style.sortDiv}>
                        <div className={Style.sortTitle}>
                            <SortIcon sx={{color:'black' , fontSize:'30px'}}></SortIcon>
                            <span style={{fontFamily:'YekanBold', marginLeft:'3px'}}>Sort</span>
                        </div>
                        <div className={Style.sortCustomSelect}>
                            <CustomSelect value={sortMis} onChange={(e)=>{changeSortMis(e.name);setSortMis(e.name)}} options={options}  selectType='selectSortCrm' placeholder="select"></CustomSelect>
                        </div>
                    </div>
                    <Divider sx={{borderBottomWidth:'1px' , marginTop:'10px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                    
                    <div style={{marginTop:'12px'}} className={Style.filtertDiv}>
                        <div className={Style.sortTitle}>
                            <FilterAlt sx={{color:'black' , fontSize:'30px'}}   ></FilterAlt>
                            <span style={{fontFamily:'YekanBold', marginLeft:'3px'}}>Filter</span>
                        </div>
                        <div style={{padding:'0px 8px 0px 8px'}} className={Style.filterCustomSelect}>
                            <div className={Style.subFilterDiv}>
                                <div className={Style.subFilterTitleDiv}>
                                    Request type:
                                </div>
                                <div className={Style.subFilterTitleSelectDiv}>
                                    <CustomSelect value={requestTypeMis} onChange={requestTypeFilterMis}  selectType='requestTypeMis' placeholder="Select"></CustomSelect>
                                </div> 
                            </div>
                            <div className={Style.subFilterDiv}>
                                <div className={Style.subFilterTitleDiv}>
                                    Sent by:
                                </div>
                                <div style={{width:'100%'}} className={Style.subFilterTitleSelectDiv}>
                                    <MultiSelect value={sentByMis} onChange={sentByFilterMis}></MultiSelect>
                                </div> 
                            </div>
                            <div className={Style.subFilterDiv}>
                                <div className={Style.subFilterTitleDiv}>
                                    Sent to:
                                </div>
                                <div style={{width:'100%'}} className={Style.subFilterTitleSelectDiv}>
                                    <MultiSelect value={sentToMis} onChange={sentToFilterMis}></MultiSelect>
                                </div> 
                            </div>
                            {/* <div className={Style.subFilterDiv}>
                                <div className={Style.subFilterTitleDiv}>
                                    Sent to:
                                </div>
                                <div style={{width:'100%'}} className={Style.subFilterTitleSelectDiv}>
                                    <MultiSelect onChange={sentByFilterMis}></MultiSelect>
                                </div> 
                            </div> */}
                            {/* <div className={Style.subFilterDiv}>
                                <div className={Style.subFilterTitleDiv}>
                                    Having address:
                                </div>
                                <div style={{textAlign:'right'}} className={Style.subFilterTitleSelectDiv}>
                                    <PinkSwitch onClick={filterAddress} value={havingAdderss} checked={havingAdderss}   />                        
                                </div> 
                            </div> */}
                        </div>
                    </div>
                    <div className={Style.resetDiv}>
                        <div  className={Style.resetAllText}>
                            Reset all:
                        </div>
                        <div style={{margin:'0px 0px 0px auto'}}>
                            <botton onClick={resetAllMis} style={{fontSize:'14px' , backgroundColor:'black' , color:'white' , cursor:'pointer', borderRadius:'5px',padding:'5px 10px 5px 10px'}} >Reset</botton>
                        </div>
                    </div>
                </div>
            :localStorage.getItem('pageState') === '2'?
                <div className={Style.ovStyle}>
                    <div className={Style.sortDiv}>
                        <div className={Style.sortTitle}>
                            <SortIcon sx={{color:'black' , fontSize:'30px'}}></SortIcon>
                            <span style={{fontFamily:'YekanBold', marginLeft:'3px'}}>Sort</span>
                        </div>
                        <div className={Style.sortCustomSelect}>
                            <CustomSelect value={sort} onChange={(e)=>{changeSort(e.name);setSort(e.name)}} options={options}  selectType='selectSortCrm' placeholder="select"></CustomSelect>
                        </div>
                    </div>
                    <Divider sx={{borderBottomWidth:'1px' , marginTop:'10px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
                    
                    <div style={{marginTop:'12px'}} className={Style.filtertDiv}>
                        <div className={Style.sortTitle}>
                            <FilterAlt sx={{color:'black' , fontSize:'30px'}}   ></FilterAlt>
                            <span style={{fontFamily:'YekanBold', marginLeft:'3px'}}>Filter</span>
                        </div>
                        <div  style={{padding:'0px 8px 0px 8px'}} className={Style.filterCustomSelect}>
                            <div className={Style.subFilterDiv}>
                                <div className={Style.subFilterTitleDiv}>
                                    Country origin:
                                </div>
                                <div className={Style.subFilterTitleSelectDiv}>
                                    <CustomSelect value={country} onChange={filterByCountry}  selectType='countryWithFlag' placeholder="Select"></CustomSelect>
                                </div> 
                            </div>
                            <div className={Style.subFilterDiv}>
                                <div className={Style.subFilterTitleDiv}>
                                    Attracted by:
                                </div>
                                <div className={Style.subFilterTitleSelectDiv}>
                                    <CustomSelect value={attractedBy}  onChange={filterByAttraction}   selectType='customerOrigin' placeholder="Select"></CustomSelect>
                                </div> 
                            </div>
                            <div className={Style.subFilterDiv}>
                                <div className={Style.subFilterTitleDiv}>
                                    Having whatsApp:
                                </div>
                                <div style={{textAlign:'right'}} className={Style.subFilterTitleSelectDiv}>
                                    <PinkSwitch onClick={filterWhatsApp} value={whatsApp}  checked={whatsApp} />                        
                                </div> 
                            </div>
                            <div className={Style.subFilterDiv}>
                                <div className={Style.subFilterTitleDiv}>
                                    Having address:
                                </div>
                                <div style={{textAlign:'right'}} className={Style.subFilterTitleSelectDiv}>
                                    <PinkSwitch onClick={filterAddress} value={havingAdderss} checked={havingAdderss}   />                        
                                </div> 
                            </div>
                        </div>
                    </div>
                    <div className={Style.resetDiv}>
                        <div  className={Style.resetAllText}>
                            Reset all:
                        </div>
                        <div style={{margin:'0px 0px 0px auto'}}>
                            <botton onClick={resetAllCrmFilter} style={{fontSize:'14px' , backgroundColor:'black' , color:'white' , cursor:'pointer', borderRadius:'5px',padding:'5px 10px 5px 10px'}} >Reset</botton>
                        </div>
                    </div>
                </div>
            :null}
            
            </Box>
            </Modal>
      </div>
    )
}
export default FilterModal