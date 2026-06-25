import { Fragment } from "react";
import Style from './filterCrm.module.scss';
import * as React from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsIcon from '@mui/icons-material/Directions';
import { CircularProgress } from "@mui/material";


const FilterCrm = (props) =>{
    
    return(
        <Fragment>
            <div dir="rtl" className={Style.filterDiv}>

            <div style={{width:'100%'}}>

                <Paper
                    component="form"
                    sx={{ p: '0px 4px', display: 'flex', alignItems: 'center', width: '100%', borderRadius:'60px' }}
                    >

                    <InputBase
                        sx={{ ml: 1, flex: 1 , paddingRight:'10px'}}
                        placeholder="جستجو..."
                        inputProps={{ 'aria-label': 'جستجو...' }}
                        onChange={(e)=>{props.setSearchForCustomer({searching:e.target.value , loading:true , retry:false})}}
                    />
                    <IconButton type="button" sx={{ p: '7px' }} aria-label="search">
                        {props.searchForCustomer.loading === true?
                            <CircularProgress size='25px' color='inherit'></CircularProgress>
                        :
                            <SearchIcon />
                        }
                    </IconButton>
                </Paper>
            </div>
            </div>
        </Fragment>
    )
}


export default FilterCrm;
