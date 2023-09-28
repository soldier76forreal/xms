import React from 'react';
import { useSelector } from 'react-redux';

import Select from 'react-select';

const MultiSelect = (props) =>{
  const contactList = useSelector((state) => state.contactList);
  
  return(
    <Select
      theme={theme}
      styles={colorStyles}
      isMulti
      value={contactList.allAll.map(e=>{return {id:e._id , text:`${e.firstName} ${e.lastName}`}}).filter(e=>{return e.id === props.value})[0]}
      options={contactList.allAll.map(e=>{return {id:e._id , text:`${e.firstName} ${e.lastName}`}})}
      name="colors"
      onChange={props.onChange}
      getOptionLabel={option => option.text}
      getOptionValue={option => option.id}
      className="basic-multi-select"
      classNamePrefix="select"
    />
  )
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
export default MultiSelect