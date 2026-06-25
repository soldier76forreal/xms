import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { CircularProgress, Divider } from '@mui/material';
import Style from "./titleModal.module.scss"; 
import { ArrowRight, Delete, Folder } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useContext, useEffect, useState } from 'react';
import {   actions, setFilesAsync, uploadFile } from "../../store/store";
import { useHistory, useLocation } from 'react-router-dom';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import AddIcon from '@mui/icons-material/Add';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { te } from 'date-fns/locale';
import { useRef } from 'react';
import SortIcon from '@mui/icons-material/Sort';
import SnackBarSuccess from '../../tools/navs/snackBar';
import Fuse from 'fuse.js';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Loader from '../../tools/loader/loader';
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '95%',
    maxWidth:'600px',
  bgcolor: 'background.paper',
  border:'none',
  zIndex:'1000',
  boxShadow: 24,
  p: 1,
};

export default function TitleModal(props) {
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);
    const selectRef = useRef()
    const [loading , setLoading] = useState(false);
    const [title,setTitle] = useState('')
    const [search,setSearch] = useState('')
    const [searchedResult,setSearchedResult] = useState('')
    const [searchLoading,setSearchLoading] = useState(false)

    const [allTitles,setAllTitles] = useState([])
    const userProfile = useSelector((state) => state.userProfile);

    const jobReportTitles = useSelector((state) => state.jobReportTitles);
  const handleClose = () => {
    props.setOpenTitleModal(false);

  };
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch()
  
  const addNewTitlePreset = async()=>{
    try{
      if(title === ''){
        dispatch(actions.setShowSnackBar({status:true,msg:'Enter or select the title',type:'error'}))

      }else{

        const response = await authCtx.jwtInst({
            method:'post',
            url:`${axiosGlobal.defaultTargetApi}/jobReport/addNewTitlePreset`,
            data:{title:title},
            config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
        })
        setAllTitles([...allTitles,{title:title}])
        dispatch(actions.setUserProfileRefresh())
        dispatch(actions.setShowSnackBar({status:true,msg:'Preset added with the title',type:'success'}))

      }
    }catch(err){
        console.log(err);
    }
}


  useEffect(() => {
    if(jobReportTitles.length !== 0){
      
      setAllTitles([...jobReportTitles])
    }

  }, [jobReportTitles]);

  useEffect(() => {
    if(props.openTitleModal === true){
      
      const index = props.contentBox.findIndex(x => x.id === props.contentBoxListItemId);

      var tempArr = props.contentBox;
      if(tempArr[index].title !== ''){
        setTitle(tempArr[index].title)
      }
      if(selectRef.current !== undefined && selectRef.current !== null){
        selectRef.current.scrollIntoView()
      }

    }
  }, [props.contentBoxListItemId]);

  useEffect(() => {
    if(props.openTitleModal === true){
      
      const index = props.contentBox.findIndex(x => x.id === props.contentBoxListItemId);
      var tempArr = props.contentBox;
      var isExist = allTitles.filter(e=>{return e.title === title})
      if(isExist.length !== 0){
        tempArr[index].title = title;
        tempArr[index]._id = isExist[0]._id;
        tempArr[index].explanation = isExist[0].explanation;
        props.setContentBox([...tempArr])
        if(selectRef.current !== undefined && selectRef.current !== null){
          selectRef.current.scrollIntoView()
        }

      }else{
        tempArr[index].title = title;
        tempArr[index]._id = null;
        tempArr[index].explanation = '';
     
        props.setContentBox([...tempArr])
        if(selectRef.current !== undefined && selectRef.current !== null){
          selectRef.current.scrollIntoView()
        }
      }
    }
  }, [title]);

  const reverseTheList = ()=>{
    var temp =allTitles
    temp.reverse()
    setAllTitles([...temp])
}
  
    const searchInCrm = (e)=>{
      if(e.target.value === ''){
        setSearchLoading(false)

      }else{
        setSearchLoading(true)
      }
      setTimeout(()=>{
          setSearch(e.target.value)
      },2100)
    }

    useEffect(() => {
      var varResult = []
      const fuse = new Fuse(allTitles, {
        threshold:0.3,
        keys: ['title']
      })
      varResult =  fuse.search(search);
      const res = varResult.map(e=>{
        return e.item
      })
      setSearchedResult([...res])
      setSearchLoading(false)
    }, [search]);
  return (
      <Modal
        sx={{zIndex:'10000'}}
        open={props.openTitleModal}
        onClose={handleClose}
        
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <div style={{width:'100%'}}>
                <div style={{padding:'15px 0px 15px 10px' ,fontSize:'17px', fontFamily:'YekanBold'}}>Enter or select title</div>
            </div>
            <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)'}}></Divider>
           {props.openTitleModal === true?
            <div style={{padding:'8px 0px 14px 0px'}}>
                
                <div style={{textAlign:'left' , fontFamily:'YekanBold', fontSize:'13px'  , marginTop:'5px', padding:'0px 10px 0px 10px'}}>
                    <span style={{cursor:'pointer'}} onClick={()=>{history.push('/files')}}>Title</span>
                    <textarea value={title} onChange={(e)=>{setTitle(e.target.value)}} placeholder='Type here' className={Style.lined} cols="70">
                    </textarea>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'center',marginTop:'10px'}}>
                    <div style={allTitles.filter(e=>{return e.title === title}).length !== 0?{pointerEvents:'none', backgroundColor:'rgb(130, 130, 130)'}:null} onClick={addNewTitlePreset} className={Style.functionBtn}><AddIcon sx={{fontSize:'22px'}}></AddIcon><span style={{marginTop:'2px'}}>Preset</span></div>
                    <div style={allTitles.filter(e=>{return e.title === title}).length !== 0?null:{pointerEvents:'none', backgroundColor:'rgb(130, 130, 130)'}} className={Style.functionBtn}><Delete sx={{fontSize:'22px'}}></Delete><span style={{marginTop:'2px'}}>Delete</span></div>
                </div>
                <div  style={{padding:'10px 10px 0px 10px',display:'flex'}} className={Style.inputDiv}>
                    <div onClick={reverseTheList} style={{backgroundColor:'black',color:'white',marginRight:'6px',padding:'0px 5px 2px 5px',display:'flex',justifyContent:'center',alignItems:'center'}}>{searchLoading ===true ? <Loader width='24px' color='white' ></Loader > : searchLoading ===false ?<SortIcon></SortIcon>:null}</div><input value={props.renameFolder} onChange={searchInCrm} placeholder='Search...'></input>
                  </div>
                {search === ''?
                  <div className={Style.list}>
                    {allTitles.map((e,i)=>{
                      return(
                        <div key={i} ref={title === e.title?selectRef:null} onClick={()=>{setTitle(e.title);props.setTitleExpToEdit()}}  className={Style.listItemDiv}>
                          <div>{i+1}</div>
                            <p style={title === e.title?{backgroundColor:'black',color:'white'}:null}>
                              {e.title}
                            </p>
                        </div>
                      )
                    })}
                  </div>
                :search !==''?
                  <div className={Style.list}>
                    <div style={{fontSize:'16px', fontFamily:'YekanRegular',padding:'5px 0px 10px 0px', width:'100%',display:'flex',justifyContent:'center',alignItems:'center'}}><ArrowDropDownIcon></ArrowDropDownIcon><span style={{paddingTop:'5px'}}>Search result</span><ArrowDropDownIcon></ArrowDropDownIcon></div>
                    {searchedResult.map((e,i)=>{
                      return(
                        <div key={i} ref={title === e.title?selectRef:null} onClick={()=>{setTitle(e.title);props.setTitleExpToEdit()}}  className={Style.listItemDiv}>
                          <div>{i+1}</div>
                            <p style={title === e.title?{backgroundColor:'black',color:'white'}:null}>
                              {e.title}
                            </p>
                        </div>
                      )
                    })}
                  </div>
                :null}
                <div  className={Style.buttonDiv}>

                    <div style={{margin:'0px 0px 0px auto'}}>
                        <button onClick={handleClose} className={Style.okButton} style={{paddingLeft:'20px' , paddingRight:'20px'}}>Ok</button>

                        
                    </div>
                </div>
            </div>
           :null}
        </Box>
      </Modal>
  );
}