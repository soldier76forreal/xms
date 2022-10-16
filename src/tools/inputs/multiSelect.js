import React from 'react';
import Select from 'react-select';
const measureOptionForNormalSelect = [
  { value:0, label:'هر اسلب'},
  { value:1, label:'هرمتر'},
  { value:2, label:'هر کاشی'}
]

const options = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' }
  ]
const customStyles = {
  menu: (provided, state) => ({
    ...provided,
    width:'100%',
    color:'#354063',
    borderRadius:'0px'
    
  }),
  control: (provided, state) => ({
      ...provided,
      width:'100%',
      border:'none',
      borderRadius:'11px',
      padding:'3px 0px 3px 0px'
    }),





    singleValue: (provided, state) => {
      const opacity = state.isDisabled ? 0.5 : 1;
      const transition = 'opacity 300ms';
  
      return { ...provided, opacity, transition };
    }
  }
const MultiSelect = (props) =>{
    return(
        <Select
        isMulti
        onChange={props.onChange}
        name="colors"
        options={props.options}
        className="basic-multi-select"
        classNamePrefix="select"
        ref={props.ref}
        placeholder={props.placeholder}
        value={props.value}
        theme={(theme) => ({
            ...theme,
            borderRadius: 0,
            colors: {
              ...theme.colors,
              primary25: '#F0F0F0',
              primary: '#000000',
              neutral0:'#F0F0F0',
              neutral80:'#5D5D5D',
              neutral90:'#5D5D5D',
              neutral70:'#5D5D5D',

              neutral50:'#5D5D5D',
            },
          })}
    styles={customStyles}
      />
    )
}
export default MultiSelect;

