
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { Fragment, useContext, useState } from 'react';
import { useEffect } from 'react';
import AuthContext from '../authAndConnections/auth';
import AxiosGlobal from '../authAndConnections/axiosGlobalUrl';
import { useDispatch, useSelector } from 'react-redux';
import { actions, getAllTags } from '../../store/store';
import React from 'react';

import CreatableSelect from 'react-select/creatable';

const filter = createFilterOptions({  matchFrom: 'start',
stringify: (option) => option.title,});

export default function SearchInputForTags(props) {
  const [loading, setLoading] = useState(false);
  const [open, toggleOpen] = useState(false);
  const [tagsToAdd , setTagsToAdd] = useState([]);
  const selectedItemsSelect = useSelector((state) => state.selectedItems);
  const allTags = useSelector((state) => state.allTags);
  const refreshTag = useSelector((state) => state.refreshTag);
  const tagsForList = useSelector((state) => state.tagsForList);

  const dispatch = useDispatch()
  const authCtx = useContext(AuthContext);
  const axiosGlobal = useContext(AxiosGlobal);

  const handleClose = () => {
    setDialogValue({
      title: '',
      id: '',
    });
    toggleOpen(false);
  };
  const [dialogValue, setDialogValue] = useState({
    title: '',
    id: '',
  });

  
  useEffect(() => {
    dispatch(actions.tagsForListDisp())
  }, [selectedItemsSelect ]);



  const addTags = async(e)=>{

      try{
        const response = await authCtx.jwtInst({
          method:'post',
          url:`${axiosGlobal.defaultTargetApi}/files/addTag`,
          data:{tag:e.id === undefined ?{label:e.label}:e , selected:selectedItemsSelect},
          config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
        })
        dispatch(actions.refreshTag())        
        handleClose()
      }catch(err){
        console.log(err)
      }
  }

 




  var tempArr =[]
  return (
    <Fragment>
        <CreatableSelect
          theme={theme}
          styles={colorStyles}
          isClearable 
          options={tagsForList.map(e=>{return {id:e._id , label:e.tag}})}
          onChange={addTags}
          getOptionLabel={option => option.label}
          getOptionValue={option => option.id}
          formatCreateLabel={userInput => `Add new tag: ${userInput}`}
        />
    </Fragment>
  );
}
const theme = (theme) => ({
  ...theme,
  borderRadius: 5,
  borderWidth:2,
  colors: {
    ...theme.colors,
    primary25: 'rgb(193, 193, 193)',
    primary: 'black',
  },
})


const colorStyles = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    borderColor: state.isFocused ? 'grey' : 'none',


  }),
  placeholder: defaultStyles => {
    return {
      ...defaultStyles,
      color: "rgb(73, 73, 73)",
      fontSize:'12px',
      borderRadius:'5px',
      width:'100%',
      position:'absolute'
    }
    
  }
};
