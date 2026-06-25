import { Search } from "@mui/icons-material"
import { useState } from "react";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import FilterModal from "./filterModal";
import Style from './searchModule.module.scss'
import { useDispatch, useSelector } from "react-redux";
import { actions } from "../../store/store";
import Loader from "../loader/loader";
import { useEffect } from "react";



const SearchBar = (e) =>{
    const [openFilterModal , setOpenFilterModal] = useState(false);
    const [pageState , setPageState] = useState(0);

    const searchForCrm = useSelector((state) => state.searchForCrm);
    useEffect(() => {
        if(localStorage.getItem('pageState') === '0'){
            setPageState(0)
        }else if(localStorage.getItem('pageState') === '2'){
            setPageState(2)
        }else if(localStorage.getItem('pageState') === '1'){
            setPageState(1)
        }
    }, [localStorage.getItem('pageState')]);
    const dispatch = useDispatch()
    const searchInCrm = (e)=>{
        dispatch(actions.searchLoading())
        setTimeout(()=>{
            dispatch(actions.crmSearch(e.target.value))
        },2100)
    }
    return(
        
        <div className={Style.searchBar}>
            <FilterModal  setOpenFilterModal={setOpenFilterModal} openFilterModal={openFilterModal}></FilterModal>
            <div style={{backgroundColor:'#e6e6e6',padding: '0px 0px 0px 6px', display:'flex',justifyContent:'center', alignItems:'center', height:'35px',borderTopLeftRadius:'5px',borderBottomLeftRadius:'5px'}}>
                {searchForCrm.loading === true?
                    <Loader width='22px' color='black'></Loader>
                :
                    <Search sx={{color:"black" , fontSize:'22px'}}></Search>
                }
            </div>
            <input onChange={pageState === 2?searchInCrm:null} placeholder="Search here..."></input>
            <div onClick={()=>{setOpenFilterModal(!openFilterModal)}} style={{backgroundColor:openFilterModal===true?'black':'rgb(84, 84, 84)',padding: '10px 0px 0px 0x', width:'65px', display:'flex',justifyContent:'center', alignItems:'center', height:'35px',borderTopRightRadius:'5px',borderBottomRightRadius:'5px'}}>
                <AutoFixHighIcon sx={{ fontSize:'22px' ,color:openFilterModal===true?'gold':'white' , marginRight:'0px'}}></AutoFixHighIcon>
            </div>
        </div>
    )
}
export default SearchBar